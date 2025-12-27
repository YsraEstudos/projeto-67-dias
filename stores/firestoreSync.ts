/**
 * Simplified Firestore Sync Layer
 * 
 * Replaces the complex persistMiddleware.ts with a cleaner approach:
 * - Uses Firestore's native IndexedDB persistence (enabled in firebase.ts)
 * - No more manual LocalStorage cache management
 * - No more manual offline queue - Firestore SDK handles it
 */
import { doc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { incrementWrites, incrementReads, isQuotaExceeded, notifyQuotaListeners } from '../utils/firestoreQuota';

// Debounce writes to avoid excessive Firestore calls during rapid typing
type PendingWrite = {
    timeout: NodeJS.Timeout;
    payload: {
        userId: string;
        collectionKey: string;
        data: any;
    };
};

const writeTimeouts = new Map<string, PendingWrite>();

// Increased from 300ms to 1500ms to reduce Firestore writes significantly
// This prevents excessive billing from rapid user interactions
const WRITE_DEBOUNCE_MS = 1500;

// Reduced debounce for realtime stores (timers) that need instant sync across devices
// 200ms is fast enough for realtime UX while still preventing excessive writes
export const REALTIME_DEBOUNCE_MS = 200;

// Rate limiter to prevent billing spikes (max 60 writes per minute globally)
const MAX_WRITES_PER_MINUTE = 60;
let writeCountLastMinute = 0;
let lastWriteResetTime = Date.now();

/**
 * Recursively remove undefined values from an object
 * Firestore fails with "Unsupported field value: undefined"
 */
const removeUndefined = (obj: any): any => {
    if (obj && typeof obj === 'object') {
        // Use JSON stringify/parse for deep cleaning of simple objects
        // This also handles Date serialization which is safer for our sync pattern
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            console.error('[FirestoreSync] Failed to clean object:', e);
            return obj;
        }
    }
    return obj;
};

// Track pending writes for UI indicator
let pendingWriteCount = 0;
const pendingWriteListeners: (() => void)[] = [];

const notifyPendingListeners = () => {
    pendingWriteListeners.forEach(fn => fn());
};

/**
 * Subscribe to pending write count changes (for UI sync indicator)
 */
export const subscribeToPendingWrites = (listener: () => void): (() => void) => {
    pendingWriteListeners.push(listener);
    return () => {
        const idx = pendingWriteListeners.indexOf(listener);
        if (idx > -1) pendingWriteListeners.splice(idx, 1);
    };
};

/**
 * Get current pending write count
 */
export const getPendingWriteCount = (): number => pendingWriteCount;

/**
 * Check if all writes are synced
 */
export const isFullySynced = (): boolean => pendingWriteCount === 0;

/**
 * Get current authenticated user ID
 */
export const getCurrentUserId = (): string | null => {
    const liveUid = auth.currentUser?.uid;
    if (liveUid) return liveUid;
    // Fallback: use cached UID saved by useAuth for early hydration / edge timing
    if (typeof window !== 'undefined') {
        const cached = window.localStorage.getItem('p67_last_uid');
        if (cached) return cached;
    }
    return null;
};

/**
 * Write data to Firestore with debounce
 * Firestore SDK automatically handles offline queueing via IndexedDB
 */
const performWrite = async (payload: PendingWrite['payload']) => {
    // Note: pendingWriteCount already incremented in writeToFirestore

    // Daily quota check - prevents exceeding 20k operations/day
    if (isQuotaExceeded()) {
        console.warn('[Firestore] Daily quota exceeded (20k ops). Write blocked.');
        pendingWriteCount--;
        notifyPendingListeners();
        return;
    }

    // Rate limiter check - prevents billing spikes
    const now = Date.now();
    if (now - lastWriteResetTime > 60000) {
        // Reset counter every minute
        writeCountLastMinute = 0;
        lastWriteResetTime = now;
    }

    if (writeCountLastMinute >= MAX_WRITES_PER_MINUTE) {
        console.warn(`[Firestore] Rate limit reached (${MAX_WRITES_PER_MINUTE}/min). Rescheduling write for ${payload.collectionKey}`);
        // Reschedule for 5 seconds later
        setTimeout(() => performWrite(payload), 5000);
        return;
    }
    writeCountLastMinute++;

    try {
        const { collectionKey, data, userId } = payload;
        const docRef = doc(db, 'users', userId, 'data', collectionKey);
        await setDoc(docRef, {
            value: data,
            updatedAt: Date.now()
        });
        // Track successful write for quota monitoring
        incrementWrites();
        notifyQuotaListeners();
    } catch (error) {
        console.warn(`[Firestore] Write for ${payload.collectionKey} will be retried when online:`, error);
    } finally {
        pendingWriteCount--;
        notifyPendingListeners();
    }
};

export const writeToFirestore = <T extends object>(
    collectionKey: string,
    data: T,
    debounceMs?: number  // Optional custom debounce (e.g., 200ms for realtime stores)
): void => {
    const userId = getCurrentUserId();
    if (!userId) {
        console.warn('[Firestore] Cannot write without authenticated user');
        return;
    }

    // Clean data before writing (removes undefined which Firestore rejects)
    const cleanedData = removeUndefined(data);
    const payload: PendingWrite['payload'] = { userId, collectionKey, data: cleanedData };

    const existing = writeTimeouts.get(collectionKey);
    if (existing) {
        // Cancel previous timeout - the new write replaces it
        // Don't change pendingWriteCount since we're just updating the pending write
        clearTimeout(existing.timeout);
    } else {
        // Truly new write - increment pending count
        pendingWriteCount++;
        notifyPendingListeners();
    }

    // Use custom debounce if provided, otherwise use default
    const effectiveDebounce = debounceMs ?? WRITE_DEBOUNCE_MS;

    const timeout = setTimeout(() => {
        writeTimeouts.delete(collectionKey);
        void performWrite(payload);
    }, effectiveDebounce);

    writeTimeouts.set(collectionKey, { timeout, payload });
};

/**
 * Subscribe to Firestore document changes
 * Returns an unsubscribe function
 */
export const subscribeToDocument = <T>(
    collectionKey: string,
    onData: (data: T | null) => void,
    onError?: (error: Error) => void
): Unsubscribe => {
    const userId = getCurrentUserId();
    if (!userId) {
        console.warn('[Firestore] Cannot subscribe without authenticated user');
        return () => { };
    }

    const docRef = doc(db, 'users', userId, 'data', collectionKey);

    return onSnapshot(
        docRef,
        (snapshot) => {
            // Track read for quota monitoring
            incrementReads();
            notifyQuotaListeners();

            if (snapshot.exists()) {
                const docData = snapshot.data();
                onData(docData.value as T);
            } else {
                onData(null);
            }
        },
        (error) => {
            console.error(`[Firestore] Subscription error for ${collectionKey}:`, error);
            onError?.(error);
        }
    );
};

/**
 * Flush all pending debounced writes immediately
 * Call this before logout or page unload
 */
export const flushPendingWrites = (): void => {
    writeTimeouts.forEach(({ timeout, payload }, key) => {
        clearTimeout(timeout);
        writeTimeouts.delete(key);
        // Execute immediately to avoid losing last edits (e.g. before unload)
        void performWrite(payload);
    });
};

// Flush on page unload to ensure UI state is persisted
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', flushPendingWrites);
    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            flushPendingWrites();
        }
    });
}

/**
 * RESET STATE FOR TESTING ONLY
 */
export const __resetForTesting = () => {
    writeTimeouts.forEach(({ timeout }) => clearTimeout(timeout));
    writeTimeouts.clear();
    pendingWriteCount = 0;
    pendingWriteListeners.length = 0;
};
