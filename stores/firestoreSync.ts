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
const WRITE_DEBOUNCE_MS = 300;

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
export const isFullySynced = (): boolean => pendingWriteCount === 0 && writeTimeouts.size === 0;

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
    pendingWriteCount++;
    notifyPendingListeners();

    try {
        const { collectionKey, data, userId } = payload;
        const docRef = doc(db, 'users', userId, 'data', collectionKey);
        await setDoc(docRef, {
            value: data,
            updatedAt: Date.now()
        });
    } catch (error) {
        console.warn(`[Firestore] Write for ${payload.collectionKey} will be retried when online:`, error);
    } finally {
        pendingWriteCount--;
        notifyPendingListeners();
    }
};

export const writeToFirestore = <T extends object>(collectionKey: string, data: T): void => {
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
        clearTimeout(existing.timeout);
    }

    const timeout = setTimeout(() => {
        writeTimeouts.delete(collectionKey);
        void performWrite(payload);
    }, WRITE_DEBOUNCE_MS);

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
