/**
 * Time Slots Slice - Metas Extras Dinâmicas
 * 
 * Sistema de 4 time slots (3×2h + 1×1h) onde o usuário pode atribuir
 * múltiplas metas (NCM, Anki, Questões, ou custom).
 */
import { StateCreator } from 'zustand';
import type {
    TimeSlotConfig,
    TimeSlotGoalConfig,
    TimeSlotTask,
    GoalInputMode,
    // Legacy types for backward compatibility
    ScheduleBlockConfig,
    ScheduleBlockProgress,
    ScheduleBlockType
} from '../../types';
import { BUILT_IN_GOALS, DEFAULT_TIME_SLOTS } from '../../types';

// Helper to get today's date as YYYY-MM-DD
const getTodayKey = (): string => {
    const now = new Date();
    return now.toISOString().split('T')[0];
};

// Generate unique ID
const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export interface TimeSlotsSlice {
    // Configuration
    timeSlots: TimeSlotConfig[];
    availableGoals: TimeSlotGoalConfig[];

    // Legacy fields for backward compatibility during migration
    /** @deprecated Use timeSlots instead */
    scheduleBlocks: ScheduleBlockConfig[];
    /** @deprecated Use tasks instead */
    scheduleProgress: ScheduleBlockProgress[];

    // Tasks per slot/date
    tasks: TimeSlotTask[];

    // Actions - Goals Management
    createCustomGoal: (goal: Omit<TimeSlotGoalConfig, 'id' | 'createdAt' | 'isBuiltIn'>) => void;
    deleteCustomGoal: (goalId: string) => void;
    updateTimeSlotGoal: (goalId: string, updates: Partial<Pick<TimeSlotGoalConfig, 'label' | 'icon' | 'color' | 'inputMode'>>) => void;

    // Actions - Task Assignment
    assignGoalToSlot: (slotId: string, goalId: string) => void;
    removeTask: (taskId: string) => void;

    // Actions - Task Progress
    toggleTaskComplete: (taskId: string) => void;
    updateTaskCount: (taskId: string, count: number) => void;
    updateTaskMinutes: (taskId: string, minutes: number) => void;

    // Actions - Slot Config
    updateSlotConfig: (slotId: string, updates: Partial<Pick<TimeSlotConfig, 'startHour' | 'endHour'>>) => void;

    // Selectors
    getTasksForSlot: (slotId: string, date?: string) => TimeSlotTask[];
    getGoalById: (goalId: string) => TimeSlotGoalConfig | undefined;
    getActiveSlotId: () => string | null;
    getTodayTasks: () => TimeSlotTask[];

    // Legacy selectors for backward compatibility
    /** @deprecated */
    getTodayProgress: () => Record<ScheduleBlockType, { completed: boolean; count?: number }>;
    /** @deprecated */
    getActiveBlockId: () => ScheduleBlockType | null;
    /** @deprecated */
    completeBlock: (blockId: ScheduleBlockType) => void;
    /** @deprecated */
    uncompleteBlock: (blockId: ScheduleBlockType) => void;
    /** @deprecated */
    setNcmCount: (count: number) => void;
    /** @deprecated */
    updateBlockConfig: (blockId: ScheduleBlockType, updates: Partial<Pick<ScheduleBlockConfig, 'startHour' | 'endHour' | 'label'>>) => void;
}

// Legacy default blocks for backward compatibility
export const DEFAULT_SCHEDULE_BLOCKS: ScheduleBlockConfig[] = [
    { id: 'NCM', label: 'Comer + NCM', startHour: 8, endHour: 10, icon: '🍽️', color: 'amber' },
    { id: 'STUDY', label: 'Estudar', startHour: 10, endHour: 14, icon: '📚', color: 'violet' },
    { id: 'AJEITAR', label: 'Ajeitar Rápido', startHour: 14, endHour: 16, icon: '🧹', color: 'pink' },
];

export const createTimeSlotsSlice: StateCreator<
    TimeSlotsSlice,
    [],
    [],
    TimeSlotsSlice
> = (set, get) => ({
    // New state
    timeSlots: [...DEFAULT_TIME_SLOTS],
    availableGoals: [...BUILT_IN_GOALS],
    tasks: [],

    // Legacy state
    scheduleBlocks: [...DEFAULT_SCHEDULE_BLOCKS],
    scheduleProgress: [],

    // ============= GOALS MANAGEMENT =============

    createCustomGoal: (goal) => {
        const newGoal: TimeSlotGoalConfig = {
            ...goal,
            id: `custom_${generateId()}`,
            isBuiltIn: false,
            createdAt: Date.now(),
        };
        set((state) => ({
            availableGoals: [...state.availableGoals, newGoal],
        }));
    },

    deleteCustomGoal: (goalId) => {
        set((state) => ({
            availableGoals: state.availableGoals.filter((g) => g.id !== goalId || g.isBuiltIn),
            // Also remove all tasks using this goal
            tasks: state.tasks.filter((t) => t.goalId !== goalId),
        }));
    },

    updateTimeSlotGoal: (goalId, updates) => {
        set((state) => ({
            availableGoals: state.availableGoals.map((g) =>
                g.id === goalId ? { ...g, ...updates } : g
            ),
        }));
    },

    // ============= TASK ASSIGNMENT =============

    assignGoalToSlot: (slotId, goalId) => {
        const today = getTodayKey();
        // Check if this goal is already assigned to this slot today
        const existing = get().tasks.find(
            (t) => t.slotId === slotId && t.goalId === goalId && t.date === today
        );
        if (existing) return; // Already assigned

        const newTask: TimeSlotTask = {
            id: generateId(),
            goalId,
            slotId,
            date: today,
            completed: false,
        };
        set((state) => ({
            tasks: [...state.tasks, newTask],
        }));
    },

    removeTask: (taskId) => {
        set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== taskId),
        }));
    },

    // ============= TASK PROGRESS =============

    toggleTaskComplete: (taskId) => {
        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === taskId
                    ? {
                        ...t,
                        completed: !t.completed,
                        completedAt: !t.completed ? Date.now() : undefined,
                    }
                    : t
            ),
        }));
    },

    updateTaskCount: (taskId, count) => {
        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === taskId ? { ...t, count: Math.max(0, count) } : t
            ),
        }));
    },

    updateTaskMinutes: (taskId, minutes) => {
        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === taskId ? { ...t, minutes: Math.max(0, minutes) } : t
            ),
        }));
    },

    // ============= SLOT CONFIG =============

    updateSlotConfig: (slotId, updates) => {
        set((state) => ({
            timeSlots: state.timeSlots.map((s) =>
                s.id === slotId ? { ...s, ...updates } : s
            ),
        }));
    },

    // ============= SELECTORS =============

    getTasksForSlot: (slotId, date = getTodayKey()) => {
        return get().tasks.filter((t) => t.slotId === slotId && t.date === date);
    },

    getGoalById: (goalId) => {
        return get().availableGoals.find((g) => g.id === goalId);
    },

    getActiveSlotId: () => {
        const currentHour = new Date().getHours();
        const { timeSlots } = get();
        const activeSlot = timeSlots.find(
            (slot) => currentHour >= slot.startHour && currentHour < slot.endHour
        );
        return activeSlot?.id ?? null;
    },

    getTodayTasks: () => {
        const today = getTodayKey();
        return get().tasks.filter((t) => t.date === today);
    },

    // ============= LEGACY METHODS (deprecated) =============

    getTodayProgress: () => {
        // Return empty for legacy compatibility
        return {
            NCM: { completed: false },
            STUDY: { completed: false },
            AJEITAR: { completed: false },
        };
    },

    getActiveBlockId: () => {
        const currentHour = new Date().getHours();
        const { scheduleBlocks } = get();
        const activeBlock = scheduleBlocks.find(
            (block) => currentHour >= block.startHour && currentHour < block.endHour
        );
        return activeBlock?.id ?? null;
    },

    completeBlock: () => {
        // No-op for legacy compatibility
    },

    uncompleteBlock: () => {
        // No-op for legacy compatibility
    },

    setNcmCount: () => {
        // No-op for legacy compatibility
    },

    updateBlockConfig: () => {
        // No-op for legacy compatibility
    },
});

// Keep legacy export name for backward compatibility
export const createScheduleBlocksSlice = createTimeSlotsSlice;
export type ScheduleBlocksSlice = TimeSlotsSlice;
