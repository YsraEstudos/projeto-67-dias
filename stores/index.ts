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
import { readNamespacedStorage } from '../utils/storageUtils';

/**
 * Rehydrate all persisted stores with the correct user-scoped data.
 * 
 * IMPORTANT: The default Zustand persist.rehydrate() does NOT re-call storage.getItem().
 * It only re-applies data that was already read during initialization.
 * 
 * This function manually reads from localStorage using the correct userId
 * and applies the data via setState(), ensuring user data is loaded correctly
 * after authentication completes.
 * 
 * @param userId - The authenticated user's ID to scope the storage keys
 */
export const rehydrateAllStores = async (userId: string | null): Promise<void> => {
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

    for (const { store, key } of storeConfigs) {
        try {
            const rawData = readNamespacedStorage(key, userId);
            if (rawData) {
                const parsed = JSON.parse(rawData);
                if (parsed.state) {
                    // Merge with current state to preserve actions and non-persisted fields
                    const currentState = store.getState();
                    store.setState({ ...currentState, ...parsed.state });
                }
            }
        } catch (e) {
            console.warn(`[rehydrateAllStores] Failed to rehydrate ${key}:`, e);
        }
    }
};

