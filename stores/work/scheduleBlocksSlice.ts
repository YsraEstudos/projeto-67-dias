/**
 * Schedule Blocks Slice - Metas por Horário
 * 
 * Gerencia blocos de atividades baseados no horário do dia:
 * - NCM (08:00-10:00): Comer + fazer NCMs
 * - STUDY (10:00-14:00): Estudar com vídeos e criar cards
 * - AJEITAR (14:00-16:00): Ajeitar Rápido (link para SundayView)
 */
import { StateCreator } from 'zustand';
import type { ScheduleBlockType, ScheduleBlockConfig, ScheduleBlockProgress } from '../../types';

// Default configurations
export const DEFAULT_SCHEDULE_BLOCKS: ScheduleBlockConfig[] = [
    {
        id: 'NCM',
        label: 'Comer + NCM',
        startHour: 8,
        endHour: 10,
        icon: '🍽️',
        color: 'amber',
    },
    {
        id: 'STUDY',
        label: 'Estudar',
        startHour: 10,
        endHour: 14,
        icon: '📚',
        color: 'violet',
    },
    {
        id: 'AJEITAR',
        label: 'Ajeitar Rápido',
        startHour: 14,
        endHour: 16,
        icon: '🧹',
        color: 'pink',
    },
];

// Helper to get today's date as YYYY-MM-DD
const getTodayKey = (): string => {
    const now = new Date();
    return now.toISOString().split('T')[0];
};

export interface ScheduleBlocksSlice {
    // Configuration (persisted, editable via settings)
    scheduleBlocks: ScheduleBlockConfig[];

    // Progress logs per date
    scheduleProgress: ScheduleBlockProgress[];

    // Actions - Config
    updateBlockConfig: (blockId: ScheduleBlockType, updates: Partial<Pick<ScheduleBlockConfig, 'startHour' | 'endHour' | 'label'>>) => void;

    // Actions - Progress
    completeBlock: (blockId: ScheduleBlockType) => void;
    uncompleteBlock: (blockId: ScheduleBlockType) => void;
    setNcmCount: (count: number) => void;

    // Selectors
    getTodayProgress: () => Record<ScheduleBlockType, { completed: boolean; count?: number }>;
    getActiveBlockId: () => ScheduleBlockType | null;
}

export const createScheduleBlocksSlice: StateCreator<
    ScheduleBlocksSlice,
    [],
    [],
    ScheduleBlocksSlice
> = (set, get) => ({
    scheduleBlocks: [...DEFAULT_SCHEDULE_BLOCKS],
    scheduleProgress: [],

    updateBlockConfig: (blockId, updates) => {
        set((state) => ({
            scheduleBlocks: state.scheduleBlocks.map((block) =>
                block.id === blockId ? { ...block, ...updates } : block
            ),
        }));
    },

    completeBlock: (blockId) => {
        const today = getTodayKey();
        set((state) => {
            // Check if already has progress for today
            const existingIndex = state.scheduleProgress.findIndex(
                (p) => p.blockId === blockId && p.date === today
            );

            if (existingIndex >= 0) {
                // Update existing
                const updated = [...state.scheduleProgress];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    completed: true,
                    completedAt: Date.now(),
                };
                return { scheduleProgress: updated };
            }

            // Create new
            return {
                scheduleProgress: [
                    ...state.scheduleProgress,
                    {
                        blockId,
                        date: today,
                        completed: true,
                        completedAt: Date.now(),
                    },
                ],
            };
        });
    },

    uncompleteBlock: (blockId) => {
        const today = getTodayKey();
        set((state) => ({
            scheduleProgress: state.scheduleProgress.map((p) =>
                p.blockId === blockId && p.date === today
                    ? { ...p, completed: false, completedAt: undefined }
                    : p
            ),
        }));
    },

    setNcmCount: (count) => {
        const today = getTodayKey();
        set((state) => {
            const existingIndex = state.scheduleProgress.findIndex(
                (p) => p.blockId === 'NCM' && p.date === today
            );

            if (existingIndex >= 0) {
                const updated = [...state.scheduleProgress];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    count: Math.max(0, count),
                };
                return { scheduleProgress: updated };
            }

            return {
                scheduleProgress: [
                    ...state.scheduleProgress,
                    {
                        blockId: 'NCM',
                        date: today,
                        completed: false,
                        count: Math.max(0, count),
                    },
                ],
            };
        });
    },

    getTodayProgress: () => {
        const today = getTodayKey();
        const { scheduleProgress } = get();

        const result: Record<ScheduleBlockType, { completed: boolean; count?: number }> = {
            NCM: { completed: false },
            STUDY: { completed: false },
            AJEITAR: { completed: false },
        };

        scheduleProgress
            .filter((p) => p.date === today)
            .forEach((p) => {
                result[p.blockId] = {
                    completed: p.completed,
                    count: p.count,
                };
            });

        return result;
    },

    getActiveBlockId: () => {
        const now = new Date();
        const currentHour = now.getHours();
        const { scheduleBlocks } = get();

        const activeBlock = scheduleBlocks.find(
            (block) => currentHour >= block.startHour && currentHour < block.endHour
        );

        return activeBlock?.id ?? null;
    },
});
