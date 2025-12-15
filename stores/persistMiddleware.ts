/**
 * Custom storage engine for Zustand persist middleware
 * Integrates with Firebase Firestore and localStorage
 * 
 * Performance optimizations:
 * - Debounced writes to Firebase (2s delay)
 * - Immediate localStorage writes for offline availability
 * - Automatic flush on page unload
 */
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';
import {
    readNamespacedStorage,
    writeNamespacedStorage,
    removeNamespacedStorage,
    readLocalMeta,
    writeLocalMeta
} from '../utils/storageUtils';

const META_SUFFIX = '::__meta';
const DEBOUNCE_DELAY_MS = 2000; // 2 seconds debounce for Firebase writes

// Track pending writes for debouncing
const pendingWrites = new Map<string, {
    timeoutId: NodeJS.Timeout;
    value: string;
    timestamp: number;
    userId: string;
}>();

// Track pending LOCAL writes for debouncing
const pendingLocalWrites = new Map<string, {
    timeoutId: NodeJS.Timeout;
    value: string;
    timestamp: number;
    userId: string;
}>();



// Get current user ID from Firebase Auth
export const getCurrentUserId = (): string | null => {
    try {
        // Priority 1: Firebase Auth (Live)
        if (auth?.currentUser?.uid) return auth.currentUser.uid;

        // Priority 2: Cached ID (Sync fallback for hydration)
        // Critical for ensuring we read the correct storage key on page load
        // before Auth initializes asynchronously.
        if (typeof window !== 'undefined') {
            return localStorage.getItem('p67_last_uid');
        }

        return null;
    } catch {
        return null;
    }
};

/**
 * Immediately flush a pending write to Firestore
 */
const flushPendingWrite = async (storageKey: string) => {
    const pending = pendingWrites.get(storageKey);
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    pendingWrites.delete(storageKey);

    await syncToFirestoreImmediate(storageKey, pending.value, pending.timestamp, pending.userId);
};

/**
 * Flush all pending writes immediately (used on page unload)
 */
const flushAllPendingWrites = () => {
    pendingWrites.forEach((pending, storageKey) => {
        clearTimeout(pending.timeoutId);
        // Use synchronous XHR for unload - sendBeacon would be better but Firestore doesn't support it
        try {
            syncToFirestoreImmediate(storageKey, pending.value, pending.timestamp, pending.userId);
        } catch (e) {
            console.warn(`[Storage] Failed to flush on unload: ${storageKey}`, e);
        }
    });
    pendingWrites.clear();

    // Flush LOCAL writes
    pendingLocalWrites.forEach((pending, storageKey) => {
        clearTimeout(pending.timeoutId);
        try {
            writeNamespacedStorage(storageKey, pending.value, pending.userId);
            writeLocalMeta(storageKey, pending.timestamp, pending.userId);
        } catch (e) {
            console.warn(`[Storage] Failed to flush local on unload: ${storageKey}`, e);
        }
    });
    pendingLocalWrites.clear();
};

// Register beforeunload handler once
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', flushAllPendingWrites);
    // Also flush on visibility hidden (mobile browsers may not fire beforeunload)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            flushAllPendingWrites();
        }
    });
}

/**
 * Creates a custom storage that namespaces by user and syncs with Firebase
 */
const createCustomStorage = (storageKey: string): StateStorage => ({
    getItem: (name: string): string | null => {
        const userId = getCurrentUserId();
        const localValue = readNamespacedStorage(storageKey, userId);

        // DISABLED: Auto-sync from Firestore was causing race conditions
        // where stale Firebase data overwrote newer local changes.
        // Firebase sync now only happens via explicit subscribeToFirestore()
        // or real-time listeners if enabled.
        // if (userId && db) {
        //     syncFromFirestore(storageKey, userId);
        // }

        return localValue;
    },

    setItem: (name: string, value: string): void => {
        const userId = getCurrentUserId();
        const timestamp = Date.now();

        // Local Storage: Immediate write (Critical for data integrity)
        // Removed 500ms debounce which caused data loss on quick reloads
        writeNamespacedStorage(storageKey, value, userId);
        writeLocalMeta(storageKey, timestamp, userId);

        // Clear any pending (in case we race with a previous timeout)
        const existingLocal = pendingLocalWrites.get(storageKey);
        if (existingLocal) {
            clearTimeout(existingLocal.timeoutId);
            pendingLocalWrites.delete(storageKey);
        }

        // Debounced write to Firestore
        if (userId && db) {
            debouncedSyncToFirestore(storageKey, value, timestamp, userId);
        }
    },

    removeItem: (name: string): void => {
        const userId = getCurrentUserId();
        removeNamespacedStorage(storageKey, userId);

        // Cancel any pending write
        const pending = pendingWrites.get(storageKey);
        if (pending) {
            clearTimeout(pending.timeoutId);
            pendingWrites.delete(storageKey);
        }
    }
});

// Async function for Firestore read sync
async function syncFromFirestore(storageKey: string, userId: string) {
    try {
        const localTimestamp = readLocalMeta(storageKey, userId);
        const docRef = doc(db, 'users', userId, 'data', storageKey);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const remoteTimestamp = data.updatedAt || 0;

            if (remoteTimestamp > localTimestamp) {
                const value = JSON.stringify({ state: data.value, version: 0 });
                writeNamespacedStorage(storageKey, value, userId);
                writeLocalMeta(storageKey, remoteTimestamp, userId);
            }
        }
    } catch (error) {
        console.warn(`[Storage] Failed to sync from Firestore: ${storageKey}`, error);
    }
}

/**
 * Debounced write to Firestore - waits for DEBOUNCE_DELAY_MS before writing
 * If another write comes in, the timer resets
 */
function debouncedSyncToFirestore(
    storageKey: string,
    value: string,
    timestamp: number,
    userId: string
) {
    // Cancel any existing pending write for this key
    const existing = pendingWrites.get(storageKey);
    if (existing) {
        clearTimeout(existing.timeoutId);
    }

    // Schedule new write
    const timeoutId = setTimeout(() => {
        pendingWrites.delete(storageKey);
        syncToFirestoreImmediate(storageKey, value, timestamp, userId);
    }, DEBOUNCE_DELAY_MS);

    pendingWrites.set(storageKey, {
        timeoutId,
        value,
        timestamp,
        userId
    });
}

/**
 * Immediate write to Firestore (no debouncing)
 */
async function syncToFirestoreImmediate(
    storageKey: string,
    value: string,
    timestamp: number,
    userId: string
) {
    try {
        const parsed = JSON.parse(value);
        const docRef = doc(db, 'users', userId, 'data', storageKey);
        await setDoc(docRef, {
            value: parsed.state,
            updatedAt: timestamp
        });
    } catch (error) {
        console.warn(`[Storage] Failed to write to Firestore: ${storageKey}`, error);
    }
}

/**
 * Creates a Zustand-compatible storage using createJSONStorage
 * Provides proper typing for persist middleware
 */
export const createFirebaseStorage = (storageKey: string) =>
    createJSONStorage(() => createCustomStorage(storageKey));

/**
 * Subscribe to Firestore changes for real-time sync
 * Returns unsubscribe function
 */
export const subscribeToFirestore = <T>(
    storageKey: string,
    onUpdate: (value: T) => void
): (() => void) => {
    const userId = getCurrentUserId();

    if (!userId || !db) {
        return () => { };
    }

    const docRef = doc(db, 'users', userId, 'data', storageKey);

    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const localTimestamp = readLocalMeta(storageKey, userId);
            const remoteTimestamp = data.updatedAt || 0;

            // Only update if remote is newer
            if (remoteTimestamp > localTimestamp) {
                onUpdate(data.value as T);
                writeLocalMeta(storageKey, remoteTimestamp, userId);
            }
        }
    }, (error) => {
        console.warn(`[Storage] Firestore listener error: ${storageKey}`, error);
    });
};

/**
 * Force flush a specific storage key to both localStorage AND Firestore immediately
 * Useful for critical saves before navigation
 */
export const forceFlush = async (storageKey: string) => {
    // Flush local writes first (synchronous)
    const pendingLocal = pendingLocalWrites.get(storageKey);
    if (pendingLocal) {
        clearTimeout(pendingLocal.timeoutId);
        pendingLocalWrites.delete(storageKey);
        writeNamespacedStorage(storageKey, pendingLocal.value, pendingLocal.userId);
        writeLocalMeta(storageKey, pendingLocal.timestamp, pendingLocal.userId);
    }

    // Then flush Firebase writes (async)
    await flushPendingWrite(storageKey);
};

