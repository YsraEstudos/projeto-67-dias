/**
 * Zustand Stores - Central export for all application stores
 * 
 * Usage:
 *   import { useUIStore, useConfigStore, useHabitsStore } from './stores';
 */

// UI Store - Navigation and ephemeral UI state (not persisted)
export { useUIStore } from './uiStore';

// Config Store - Project configuration
export { useConfigStore } from './configStore';

// Timer Store - Global timer state
export { useTimerStore } from './timerStore';

// Habits Store - Habits and tasks
export { useHabitsStore } from './habitsStore';

// Work Store - Work sessions, goals, and study schedules
export { useWorkStore } from './workStore';
export type { MetTargetSession, StudySubject, DailyStudySchedule, WorkGoals, PaceMode, ScheduledStudyItem } from './workStore';

// Reading Store - Books and folders
export { useReadingStore } from './readingStore';

// Skills Store - Skills, logs, resources, and roadmaps
export { useSkillsStore } from './skillsStore';

// Rest Store - Rest activities
export { useRestStore } from './restStore';

// Prompts Store - Prompts and categories
export { usePromptsStore } from './promptsStore';

// Notes Store - Notes and tags
export { useNotesStore } from './notesStore';

// Links Store - Quick links
export { useLinksStore } from './linksStore';

// Sunday Store - Sunday tasks
export { useSundayStore } from './sundayStore';

// Journal Store - Journal entries
export { useJournalStore } from './journalStore';
export type { JournalEntry } from './journalStore';

// Review Store - Journey review data
export { useReviewStore } from './reviewStore';

// Water Store - Water tracking
export { useWaterStore } from './waterStore';
export type { WaterLog, BottleType } from './waterStore';

// Games Store
export { useGamesStore } from './gamesStore';

// Streak Store - Daily streak tracking
export { useStreakStore } from './streakStore';

// Optimized Selectors - Pre-built hooks with useShallow for common patterns
export {
    // Habits selectors
    useHabits,
    useActiveHabits,
    useTasks,
    useActiveTasks,
    useCompletedTasks,
    useHabitActions,
    useTaskActions,
    // Work selectors
    useWorkHistory,
    useWorkGoals,
    useStudySubjects,
    useStudySchedules,
    useWorkTracking,
    useTimeConfig,
    useWorkSessionActions,
    // Reading selectors
    useBooks,
    useCompletedBooks,
    useReadingBooks,
    // Skills selectors
    useSkills,
    useTotalStudyHours,
    // Games selectors
    useGames,
    useGameFolders,
    useGameFolderActions,
    useGameActions,
    useGameReviewActions,
} from './selectors';


// Persistence utilities
export {
    createFirebaseStorage,
    subscribeToFirestore,
    getCurrentUserId,
} from './persistMiddleware';

export {
    readNamespacedStorage,
    writeNamespacedStorage,
    removeNamespacedStorage,
    getStorageKeyForUser
} from '../utils/storageUtils';

// Import stores for rehydration
import { useConfigStore } from './configStore';
import { useHabitsStore } from './habitsStore';
import { useWorkStore } from './workStore';
import { useNotesStore } from './notesStore';
import { useSundayStore } from './sundayStore';
import { useJournalStore } from './journalStore';
import { useLinksStore } from './linksStore';
import { useSkillsStore } from './skillsStore';
import { useReadingStore } from './readingStore';
import { useRestStore } from './restStore';
import { usePromptsStore } from './promptsStore';
import { useGamesStore } from './gamesStore';
import { useReviewStore } from './reviewStore';
import { useWaterStore } from './waterStore';
import { useStreakStore } from './streakStore';
import { readNamespacedStorage, writeNamespacedStorage, writeLocalMeta, readLocalMeta } from '../utils/storageUtils';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Rehydrate all persisted stores with the correct user-scoped data.
 * 
 * CLOUD-FIRST STRATEGY:
 * 1. Fetch data from Firebase Firestore (Source of Truth)
 * 2. Update local cache with cloud data
 * 3. Fall back to localStorage only if cloud fetch fails
 * 
 * This ensures cross-device sync works correctly by prioritizing cloud data
 * over potentially stale local cache.
 * 
 * @param userId - The authenticated user's ID to scope the storage keys
 * @returns Promise that resolves when all stores are synced
 */
export const rehydrateAllStores = async (userId: string | null): Promise<void> => {
    if (!userId) {
        console.warn('[rehydrateAllStores] No userId provided, skipping cloud sync');
        return;
    }

    // Map of stores to their storage keys
    const storeConfigs: Array<{ store: { setState: (state: any) => void; getState: () => any }; key: string }> = [
        { store: useConfigStore, key: 'p67_project_config' },
        { store: useHabitsStore, key: 'p67_habits_store' },
        { store: useWorkStore, key: 'p67_work_store' },
        { store: useNotesStore, key: 'p67_notes_store' },
        { store: useSundayStore, key: 'p67_sunday_store' },
        { store: useJournalStore, key: 'p67_journal_store' },
        { store: useLinksStore, key: 'p67_links_store' },
        { store: useSkillsStore, key: 'p67_skills_store' },
        { store: useReadingStore, key: 'p67_reading_store' },
        { store: useRestStore, key: 'p67_rest_store' },
        { store: usePromptsStore, key: 'p67_prompts_store' },
        { store: useGamesStore, key: 'games-storage' },
        { store: useReviewStore, key: 'p67_review_store' },
        { store: useWaterStore, key: 'p67_water_store' },
        { store: useStreakStore, key: 'p67_streak_store' },
    ];

    // Fetch all stores in parallel from Firebase
    const fetchPromises = storeConfigs.map(async ({ store, key }) => {
        try {
            const localTimestamp = readLocalMeta(key, userId);

            // CLOUD-FIRST: Try to fetch from Firebase
            if (db) {
                const docRef = doc(db, 'users', userId, 'data', key);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const remoteValue = data.value;
                    const remoteTimestamp = data.updatedAt || 0;

                    // Last-write-wins: only apply cloud if it is newer/equal than local.
                    // This prevents losing recently-created data if the Firestore write was still debounced
                    // when the page was reloaded.
                    if (remoteValue && remoteTimestamp >= localTimestamp) {
                        const currentState = store.getState();
                        store.setState({ ...currentState, ...remoteValue });

                        const cacheValue = JSON.stringify({ state: remoteValue, version: 0 });
                        writeNamespacedStorage(key, cacheValue, userId);
                        writeLocalMeta(key, remoteTimestamp, userId);

                        console.log(`[rehydrateAllStores] ✅ ${key} synced from cloud`);
                        return;
                    }

                    // If local is newer, prefer local and (best-effort) push it to Firestore to heal cross-device sync.
                    if (localTimestamp > remoteTimestamp) {
                        const rawLocal = readNamespacedStorage(key, userId);
                        if (rawLocal) {
                            const parsed = JSON.parse(rawLocal);
                            if (parsed?.state) {
                                const currentState = store.getState();
                                store.setState({ ...currentState, ...parsed.state });

                                try {
                                    await setDoc(docRef, { value: parsed.state, updatedAt: localTimestamp });
                                    console.log(`[rehydrateAllStores] 🔁 ${key} local newer; pushed to cloud`);
                                } catch (pushError) {
                                    console.warn(`[rehydrateAllStores] Local newer but failed to push ${key} to cloud:`, pushError);
                                }

                                console.log(`[rehydrateAllStores] ✅ ${key} kept from local (newer than cloud)`);
                                return;
                            }
                        }
                    }
                }
            }

            // FALLBACK: Cloud data not available, try local cache
            const rawData = readNamespacedStorage(key, userId);
            if (rawData) {
                const parsed = JSON.parse(rawData);
                if (parsed.state) {
                    const currentState = store.getState();
                    store.setState({ ...currentState, ...parsed.state });
                    console.log(`[rehydrateAllStores] ⚠️ ${key} loaded from local cache (no cloud data)`);
                }
            }
        } catch (e) {
            console.warn(`[rehydrateAllStores] Failed to sync ${key}:`, e);

            // Final fallback: Try local storage on error
            try {
                const rawData = readNamespacedStorage(key, userId);
                if (rawData) {
                    const parsed = JSON.parse(rawData);
                    if (parsed.state) {
                        const currentState = store.getState();
                        store.setState({ ...currentState, ...parsed.state });
                        console.log(`[rehydrateAllStores] ⚠️ ${key} loaded from local cache (cloud error)`);
                    }
                }
            } catch (localError) {
                console.warn(`[rehydrateAllStores] Local fallback also failed for ${key}:`, localError);
            }
        }
    });

    await Promise.all(fetchPromises);
    console.log('[rehydrateAllStores] ✅ All stores synced');
};

