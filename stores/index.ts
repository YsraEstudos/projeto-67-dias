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

// Import stores for clearAllStores function
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
import { useTimerStore } from './timerStore';

/**
 * Clears all stores to initial state.
 * Use this when switching users to prevent data leaks.
 */
export const clearAllStores = () => {
    // Use the new _reset() method on each store to reset to initial state
    // This properly handles the new Firestore-first architecture
    useConfigStore.getState()._reset();
    useHabitsStore.getState()._reset();
    useWorkStore.getState()._reset();
    useNotesStore.getState()._reset();
    useSundayStore.getState()._reset();
    useJournalStore.getState()._reset();
    useLinksStore.getState()._reset();
    useSkillsStore.getState()._reset();
    useReadingStore.getState()._reset();
    useRestStore.getState()._reset();
    usePromptsStore.getState()._reset();
    useGamesStore.getState()._reset();
    useReviewStore.getState()._reset();
    useWaterStore.getState()._reset();
    useStreakStore.getState()._reset();
    useTimerStore.getState()._reset();
    console.log('[clearAllStores] All stores reset for user switch');
};
