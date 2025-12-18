/**
 * Legacy LocalStorage to Firestore Migration
 * 
 * One-time migration for users who had data in LocalStorage before
 * the Firestore-only architecture was implemented.
 * 
 * This runs once per user and uploads any existing LocalStorage data
 * to Firestore if Firestore doesn't already have data for that store.
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, subscribeToAuthChanges } from '../services/firebase';

const FIRESTORE_MIGRATION_FLAG = 'p67_firestore_migration_complete';
const MIGRATION_VERSION = 2; // Increment this to re-run migration

// All store keys that need to be migrated
const STORE_KEYS = [
    'p67_project_config',
    'p67_habits_store',
    'p67_work_store',
    'p67_notes_store',
    'p67_sunday_store',
    'p67_journal_store',
    'p67_links_store',
    'p67_skills_store',
    'p67_reading_store',
    'p67_rest_store',
    'p67_prompts_store',
    'games-storage',
    'p67_review_store',
    'p67_water_store',
    'p67_streak_store',
    'p67_tool_timer',
];

/**
 * Check if migration has already been completed for this user
 */
function hasMigrationCompleted(userId: string): boolean {
    const migrationKey = `${userId}::${FIRESTORE_MIGRATION_FLAG}`;
    const storedVersion = localStorage.getItem(migrationKey);
    return storedVersion !== null && parseInt(storedVersion, 10) >= MIGRATION_VERSION;
}

/**
 * Mark migration as complete
 */
function markMigrationComplete(userId: string): void {
    const migrationKey = `${userId}::${FIRESTORE_MIGRATION_FLAG}`;
    localStorage.setItem(migrationKey, MIGRATION_VERSION.toString());
}

/**
 * Try to read data from LocalStorage for a given store key
 */
function readLocalStorageData(key: string, userId: string): any | null {
    // Try namespaced key first (preferred format)
    const namespacedKey = `${userId}::${key}`;
    let rawData = localStorage.getItem(namespacedKey);

    // Fall back to non-namespaced key (legacy format)
    if (!rawData) {
        rawData = localStorage.getItem(key);
    }

    if (!rawData) return null;

    try {
        const parsed = JSON.parse(rawData);
        // Zustand persist format stores data in { state: {...}, version: N }
        if (parsed?.state) {
            return parsed.state;
        }
        // Direct data format
        return parsed;
    } catch {
        return null;
    }
}

/**
 * Migrate a single store from LocalStorage to Firestore
 */
async function migrateStore(key: string, userId: string): Promise<boolean> {
    try {
        const docRef = doc(db, 'users', userId, 'data', key);

        // Check if Firestore already has data for this store
        const cloudDoc = await getDoc(docRef);
        if (cloudDoc.exists()) {
            // Cloud already has data, skip migration
            return false;
        }

        // Read from LocalStorage
        const localData = readLocalStorageData(key, userId);
        if (!localData) {
            // No local data to migrate
            return false;
        }

        // Upload to Firestore
        await setDoc(docRef, {
            value: localData,
            updatedAt: Date.now(),
            migratedFromLocalStorage: true
        });

        console.log(`[FirestoreMigration] ✅ Migrated ${key} to Firestore`);
        return true;

    } catch (error) {
        console.warn(`[FirestoreMigration] ⚠️ Failed to migrate ${key}:`, error);
        return false;
    }
}

/**
 * Run migration for all stores
 */
export async function runLocalStorageToFirestoreMigration(): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
        console.log('[FirestoreMigration] Skipped: No authenticated user');
        return;
    }

    if (!db) {
        console.warn('[FirestoreMigration] Skipped: Firestore not initialized');
        return;
    }

    if (hasMigrationCompleted(userId)) {
        console.log('[FirestoreMigration] Already completed for this user');
        return;
    }

    console.log('[FirestoreMigration] Starting LocalStorage → Firestore migration...');

    let migratedCount = 0;

    for (const key of STORE_KEYS) {
        const migrated = await migrateStore(key, userId);
        if (migrated) migratedCount++;
    }

    markMigrationComplete(userId);

    if (migratedCount > 0) {
        console.log(`[FirestoreMigration] ✅ Complete. Migrated ${migratedCount} stores.`);
    } else {
        console.log('[FirestoreMigration] ✅ Complete. No local data needed migration.');
    }
}

/**
 * Setup migration to run on auth changes
 * Call this once in App.tsx
 */
export function setupFirestoreMigration(): () => void {
    // Run immediately for current user
    runLocalStorageToFirestoreMigration();

    // Also run when user changes
    return subscribeToAuthChanges((user) => {
        if (user) {
            runLocalStorageToFirestoreMigration();
        }
    });
}
