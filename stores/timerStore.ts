/**
 * Timer Store - Global timer state with Firebase persistence
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GlobalTimerState } from '../types';
import { createFirebaseStorage } from './persistMiddleware';

interface TimerStoreState {
    timer: GlobalTimerState;
    isLoading: boolean;

    // Actions
    setTimer: (timerOrFn: Partial<GlobalTimerState> | ((prev: GlobalTimerState) => GlobalTimerState)) => void;
    startStopwatch: (label?: string) => void;
    startTimer: (durationSeconds: number, label?: string) => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    reset: () => void;
    setLoading: (loading: boolean) => void;
}

const DEFAULT_TIMER: GlobalTimerState = {
    mode: 'STOPWATCH',
    status: 'IDLE',
    startTime: null,
    endTime: null,
    accumulated: 0,
    totalDuration: 0,
    label: undefined
};

export const useTimerStore = create<TimerStoreState>()(
    persist(
        (set, get) => ({
            timer: DEFAULT_TIMER,
            isLoading: true,

            setTimer: (timerOrFn) => set((state) => {
                const newTimer = typeof timerOrFn === 'function'
                    ? timerOrFn(state.timer)
                    : { ...state.timer, ...timerOrFn };
                return { timer: newTimer };
            }),

            startStopwatch: (label) => set({
                timer: {
                    mode: 'STOPWATCH',
                    status: 'RUNNING',
                    startTime: Date.now(),
                    endTime: null,
                    accumulated: 0,
                    totalDuration: 0,
                    label
                }
            }),

            startTimer: (durationSeconds, label) => set({
                timer: {
                    mode: 'TIMER',
                    status: 'RUNNING',
                    startTime: Date.now(),
                    endTime: Date.now() + (durationSeconds * 1000),
                    accumulated: 0,
                    totalDuration: durationSeconds,
                    label
                }
            }),

            pause: () => {
                const { timer } = get();
                if (timer.status !== 'RUNNING' || !timer.startTime) return;

                const elapsed = Date.now() - timer.startTime;
                set({
                    timer: {
                        ...timer,
                        status: 'PAUSED',
                        accumulated: timer.accumulated + elapsed,
                        startTime: null
                    }
                });
            },

            resume: () => {
                const { timer } = get();
                if (timer.status !== 'PAUSED') return;

                set({
                    timer: {
                        ...timer,
                        status: 'RUNNING',
                        startTime: Date.now()
                    }
                });
            },

            stop: () => set((state) => ({
                timer: { ...state.timer, status: 'FINISHED' }
            })),

            reset: () => set({ timer: DEFAULT_TIMER }),

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'p67_tool_timer',
            storage: createFirebaseStorage('p67_tool_timer'),
            onRehydrateStorage: () => (state) => {
                state?.setLoading(false);
            },
        }
    )
);
