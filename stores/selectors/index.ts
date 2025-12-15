/**
 * Optimized Zustand Selectors
 * 
 * This module provides pre-built atomic selectors and hooks for common store patterns.
 * Using these ensures optimal re-rendering behavior across the application.
 * 
 * Usage:
 *   import { useHabits, useTasks, useHabitActions } from '../stores/selectors';
 */

import { useShallow } from 'zustand/shallow';
import { useHabitsStore } from '../habitsStore';
import { useWorkStore } from '../workStore';
import { useReadingStore } from '../readingStore';
import { useSkillsStore } from '../skillsStore';
import { useWaterStore } from '../waterStore';

// ============================================================
// HABITS STORE SELECTORS
// ============================================================

/** Get all habits (reactive to habits changes only) */
export const useHabits = () => useHabitsStore((s) => s.habits);

/** Get active (non-archived) habits */
export const useActiveHabits = () => useHabitsStore(
    (s) => s.habits.filter(h => !h.archived)
);

/** Get all tasks (reactive to tasks changes only) */
export const useTasks = () => useHabitsStore((s) => s.tasks);

/** Get active (non-archived) tasks */
export const useActiveTasks = () => useHabitsStore(
    (s) => s.tasks.filter(t => !t.isArchived)
);

/** Get completed tasks */
export const useCompletedTasks = () => useHabitsStore(
    (s) => s.tasks.filter(t => t.isCompleted)
);

/** Get habit actions (stable references) */
export const useHabitActions = () => useHabitsStore(
    useShallow((s) => ({
        addHabit: s.addHabit,
        updateHabit: s.updateHabit,
        deleteHabit: s.deleteHabit,
        toggleHabitCompletion: s.toggleHabitCompletion,
        logHabitValue: s.logHabitValue,
        archiveHabit: s.archiveHabit,
    }))
);

/** Get task actions (stable references) */
export const useTaskActions = () => useHabitsStore(
    useShallow((s) => ({
        addTask: s.addTask,
        updateTask: s.updateTask,
        deleteTask: s.deleteTask,
        toggleTaskComplete: s.toggleTaskComplete,
        archiveTask: s.archiveTask,
        restoreTask: s.restoreTask,
    }))
);

// ============================================================
// WORK STORE SELECTORS
// ============================================================

/** Get work session history */
export const useWorkHistory = () => useWorkStore((s) => s.history);

/** Get work goals */
export const useWorkGoals = () => useWorkStore((s) => s.goals);

/** Get study subjects */
export const useStudySubjects = () => useWorkStore((s) => s.studySubjects);

/** Get study schedules */
export const useStudySchedules = () => useWorkStore((s) => s.studySchedules);

/** Get current work tracking state */
export const useWorkTracking = () => useWorkStore(
    useShallow((s) => ({
        currentCount: s.currentCount,
        goal: s.goal,
        preBreakCount: s.preBreakCount,
    }))
);

/** Get time configuration */
export const useTimeConfig = () => useWorkStore(
    useShallow((s) => ({
        startTime: s.startTime,
        endTime: s.endTime,
        breakTime: s.breakTime,
    }))
);

/** Get work session actions */
export const useWorkSessionActions = () => useWorkStore(
    useShallow((s) => ({
        addSession: s.addSession,
        deleteSession: s.deleteSession,
        clearHistory: s.clearHistory,
    }))
);

// ============================================================
// READING STORE SELECTORS
// ============================================================

/** Get all books */
export const useBooks = () => useReadingStore((s) => s.books);

/** Get completed books */
export const useCompletedBooks = () => useReadingStore(
    (s) => s.books.filter(b => b.status === 'COMPLETED')
);

/** Get books in progress */
export const useReadingBooks = () => useReadingStore(
    (s) => s.books.filter(b => b.status === 'READING')
);

// ============================================================
// SKILLS STORE SELECTORS
// ============================================================

/** Get all skills */
export const useSkills = () => useSkillsStore((s) => s.skills);

/** Get total study hours across all skills */
export const useTotalStudyHours = () => useSkillsStore(
    (s) => s.skills.reduce((acc, skill) => acc + skill.currentMinutes, 0) / 60
);

// ============================================================
// WATER STORE SELECTORS
// ============================================================

/** Get water tracking data */
export const useWaterData = () => useWaterStore(
    useShallow((s) => ({
        currentAmount: s.currentAmount,
        dailyGoal: s.dailyGoal,
        bottles: s.bottles,
    }))
);

/** Get water store actions */
export const useWaterActions = () => useWaterStore(
    useShallow((s) => ({
        addWater: s.addWater,
        removeWater: s.removeWater,
        checkDate: s.checkDate,
        setGoal: s.setGoal
    }))
);

// ============================================================
// GAMES STORE SELECTORS
// ============================================================

import { useGamesStore } from '../gamesStore';
import { CENTRAL_FOLDER_ID } from '../../types';

/** Get all games */
export const useGames = () => useGamesStore((s) => s.games);

/** Get game folders */
export const useGameFolders = () => useGamesStore((s) => s.folders);

/** Get games from the 67 Days central folder */
export const useCentralFolderGames = () => useGamesStore(
    (s) => s.games.filter(g => g.folderId === CENTRAL_FOLDER_ID)
);

/** Get games with pending reviews (from 67 Days folder) */
export const usePendingReviewGames = () => useGamesStore(
    (s) => s.games.filter(g => g.reviewPending && g.folderId === CENTRAL_FOLDER_ID)
);

/** Get game folder actions (stable references) */
export const useGameFolderActions = () => useGamesStore(
    useShallow((s) => ({
        createFolder: s.createFolder,
        deleteFolder: s.deleteFolder,
        updateFolder: s.updateFolder,
    }))
);

/** Get game actions (stable references) */
export const useGameActions = () => useGamesStore(
    useShallow((s) => ({
        addGame: s.addGame,
        updateGame: s.updateGame,
        deleteGame: s.deleteGame,
        moveGameToFolder: s.moveGameToFolder,
        addMission: s.addMission,
        toggleMission: s.toggleMission,
        deleteMission: s.deleteMission,
        logHours: s.logHours,
    }))
);

/** Get game review actions (stable references) */
export const useGameReviewActions = () => useGamesStore(
    useShallow((s) => ({
        setGameReview: s.setGameReview,
        toggleReviewPending: s.toggleReviewPending,
    }))
);
