/**
 * Data Migration Utility
 * One-time migration from legacy useStorage keys to Zustand store keys
 * This ensures users don't lose data when upgrading
 */

import { auth, subscribeToAuthChanges } from '../services/firebase';

const MIGRATION_VERSION_KEY = 'p67_migration_version';
const CURRENT_MIGRATION_VERSION = 1;

// Key mappings: legacy -> { storeKey, dataPath }
const LEGACY_KEY_MAPPINGS: Record<string, { storeKey: string; path: string }> = {
    'p67_habits': { storeKey: 'p67_habits_store', path: 'habits' },
    'p67_tasks': { storeKey: 'p67_habits_store', path: 'tasks' },
    'p67_notes': { storeKey: 'p67_notes_store', path: 'notes' },
    'p67_tags': { storeKey: 'p67_notes_store', path: 'tags' },
    'p67_journal': { storeKey: 'p67_journal_store', path: 'entries' },
    'p67_skills': { storeKey: 'p67_skills_store', path: 'skills' },
    'p67_sunday_tasks': { storeKey: 'p67_sunday_store', path: 'tasks' },
    'p67_rest_activities': { storeKey: 'p67_rest_store', path: 'activities' },
    'p67_rest_next_2h': { storeKey: 'p67_rest_store', path: 'nextTwoHoursIds' },
    'p67_links': { storeKey: 'p67_links_store', path: 'links' },
    'p67_books': { storeKey: 'p67_reading_store', path: 'books' },
    'p67_prompts': { storeKey: 'p67_prompts_store', path: 'prompts' },
    'p67_prompt_categories': { storeKey: 'p67_prompts_store', path: 'categories' },
    'p67_journey_review': { storeKey: 'p67_review_store', path: 'reviewData' },
    'p67_work_met_target_history': { storeKey: 'p67_work_store', path: 'history' },
};

/**
 * Check if migration has already been run
 */
function hasMigrationRun(userId: string | null): boolean {
    const prefix = userId ? `${userId}::` : 'guest::';
    const versionKey = `${prefix}${MIGRATION_VERSION_KEY}`;
    const currentVersion = localStorage.getItem(versionKey);
    return currentVersion !== null && parseInt(currentVersion, 10) >= CURRENT_MIGRATION_VERSION;
}

/**
 * Mark migration as complete
 */
function markMigrationComplete(userId: string | null): void {
    const prefix = userId ? `${userId}::` : 'guest::';
    const versionKey = `${prefix}${MIGRATION_VERSION_KEY}`;
    localStorage.setItem(versionKey, CURRENT_MIGRATION_VERSION.toString());
}

/**
 * Migrate a single legacy key to Zustand store format
 */
function migrateSingleKey(
    legacyKey: string,
    storeKey: string,
    path: string,
    userId: string | null
): boolean {
    const prefix = userId ? `${userId}::` : 'guest::';

    // Try namespaced key first, then legacy key
    const namespacedLegacyKey = `${prefix}${legacyKey}`;
    const legacyValue = localStorage.getItem(namespacedLegacyKey) || localStorage.getItem(legacyKey);

    if (!legacyValue) {
        return false;
    }

    const zustandKey = `${prefix}${storeKey}`;
    const existingStore = localStorage.getItem(zustandKey);

    try {
        const legacyData = JSON.parse(legacyValue);

        if (existingStore) {
            // Merge with existing store data
            const storeData = JSON.parse(existingStore);
            const existingPath = storeData.state?.[path];

            // Only migrate if the Zustand store path is empty/undefined
            if (!existingPath || (Array.isArray(existingPath) && existingPath.length === 0)) {
                storeData.state = storeData.state || {};
                storeData.state[path] = legacyData;
                localStorage.setItem(zustandKey, JSON.stringify(storeData));
                console.log(`[Migration] Merged ${legacyKey} -> ${storeKey}.${path}`);
                return true;
            }
        } else {
            // Create new Zustand format: { state: { [path]: data }, version: 0 }
            const storeData = {
                state: { [path]: legacyData },
                version: 0
            };
            localStorage.setItem(zustandKey, JSON.stringify(storeData));
            console.log(`[Migration] Migrated ${legacyKey} -> ${storeKey}.${path}`);
            return true;
        }
    } catch (error) {
        console.warn(`[Migration] Failed to migrate ${legacyKey}:`, error);
    }

    return false;
}

/**
 * Run the migration for all legacy keys
 */
export function migrateLegacyData(userId: string | null): void {
    if (hasMigrationRun(userId)) {
        return;
    }

    console.log('[Migration] Starting legacy data migration...');

    let migratedCount = 0;

    for (const [legacyKey, { storeKey, path }] of Object.entries(LEGACY_KEY_MAPPINGS)) {
        if (migrateSingleKey(legacyKey, storeKey, path, userId)) {
            migratedCount++;
        }
    }

    if (migratedCount > 0) {
        console.log(`[Migration] Completed. Migrated ${migratedCount} keys.`);
    } else {
        console.log('[Migration] No legacy data found to migrate.');
    }

    markMigrationComplete(userId);
}

/**
 * Setup migration on auth state change
 * Call this once in your app entry point
 */
export function setupDataMigration(): () => void {
    // Run immediately for current auth state
    const currentUserId = auth?.currentUser?.uid ?? null;
    migrateLegacyData(currentUserId);

    // Also run when auth state changes
    return subscribeToAuthChanges((user) => {
        migrateLegacyData(user?.uid ?? null);
    });

    return () => { };
}
