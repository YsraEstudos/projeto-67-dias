import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { writeToFirestore } from '../../stores/firestoreSync';
import { useDailyPlannerStore } from '../../stores/dailyPlannerStore';

describe('dailyPlannerStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useDailyPlannerStore.getState()._reset();
        useDailyPlannerStore.getState()._hydrateFromFirestore(null);
    });

    it('creates today session with planner defaults', () => {
        const session = useDailyPlannerStore.getState().ensureSession('2026-04-07');

        expect(session.dayInputs).toMatchObject({
            sleepTime: '22:00',
            windDownMinutes: 10,
            mealDurationMinutes: 20,
            dogDurationMinutes: 25,
            mealPending: false,
            dogPending: false,
        });
    });

    it('hydrates persisted sessions and resets cleanly on logout', () => {
        useDailyPlannerStore.getState()._hydrateFromFirestore({
            preferences: {
                defaultSleepTime: '23:00',
                defaultWindDownMinutes: 15,
                mealDurationMinutes: 30,
                dogDurationMinutes: 20,
            },
            sessionsByDate: {
                '2026-04-07': {
                    date: '2026-04-07',
                    dayInputs: {
                        sleepTime: '23:00',
                        windDownMinutes: 15,
                        mealPending: true,
                        mealDurationMinutes: 30,
                        dogPending: true,
                        dogDurationMinutes: 20,
                        pendingTasksText: 'Estudar 2h e revisar',
                    },
                    draftMessage: 'encaixa uma pausa',
                    messages: [],
                    latestPlan: null,
                    completedBlockIds: [],
                    isLoading: false,
                    error: null,
                    lastUpdatedAt: Date.now(),
                },
            },
        });

        expect(useDailyPlannerStore.getState().preferences.defaultSleepTime).toBe('23:00');
        expect(useDailyPlannerStore.getState().sessionsByDate['2026-04-07']?.dayInputs.mealPending).toBe(true);

        useDailyPlannerStore.getState()._reset();

        expect(useDailyPlannerStore.getState().sessionsByDate).toEqual({});
        expect(useDailyPlannerStore.getState().isLoading).toBe(true);
    });

    it('syncs updates and keeps preference defaults aligned with edited inputs', () => {
        useDailyPlannerStore.getState().ensureSession('2026-04-07');
        vi.clearAllMocks();

        useDailyPlannerStore.getState().updateDayInputs('2026-04-07', {
            sleepTime: '21:30',
            windDownMinutes: 20,
            mealDurationMinutes: 25,
            dogDurationMinutes: 35,
            mealPending: true,
        });

        const state = useDailyPlannerStore.getState();

        expect(state.preferences).toMatchObject({
            defaultSleepTime: '21:30',
            defaultWindDownMinutes: 20,
            mealDurationMinutes: 25,
            dogDurationMinutes: 35,
        });
        expect(state.sessionsByDate['2026-04-07']?.dayInputs.mealPending).toBe(true);
        expect(writeToFirestore).toHaveBeenCalledWith('p67_daily_planner_store', expect.any(Object));
    });
});
