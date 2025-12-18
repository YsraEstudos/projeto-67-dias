/**
 * Timer Store - Global timer state with Firestore-first persistence
 */
import { create } from 'zustand';
import { GlobalTimerState } from '../types';
import { writeToFirestore } from './firestoreSync';

const STORE_KEY = 'p67_tool_timer';

const DEFAULT_TIMER: GlobalTimerState = {
    mode: 'STOPWATCH',
    status: 'IDLE',
    startTime: null,
    endTime: null,
    accumulated: 0,
    totalDuration: 0,
    label: undefined
};

interface TimerStoreState {
    timer: GlobalTimerState;
    isLoading: boolean;
    _initialized: boolean;

    setTimer: (timerOrFn: Partial<GlobalTimerState> | ((prev: GlobalTimerState) => GlobalTimerState)) => void;
    startStopwatch: (label?: string) => void;
    startTimer: (durationSeconds: number, label?: string) => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    reset: () => void;
    setLoading: (loading: boolean) => void;

    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { timer: GlobalTimerState } | null) => void;
    _reset: () => void;
}

export const useTimerStore = create<TimerStoreState>()((set, get) => ({
    timer: DEFAULT_TIMER,
    isLoading: true,
    _initialized: false,

    setTimer: (timerOrFn) => {
        set((state) => {
            const newTimer = typeof timerOrFn === 'function'
                ? timerOrFn(state.timer)
                : { ...state.timer, ...timerOrFn };
            return { timer: newTimer };
        });
        get()._syncToFirestore();
    },

    startStopwatch: (label) => {
        set({
            timer: {
                mode: 'STOPWATCH',
                status: 'RUNNING',
                startTime: Date.now(),
                endTime: null,
                accumulated: 0,
                totalDuration: 0,
                label
            }
        });
        get()._syncToFirestore();
    },

    startTimer: (durationSeconds, label) => {
        set({
            timer: {
                mode: 'TIMER',
                status: 'RUNNING',
                startTime: Date.now(),
                endTime: Date.now() + (durationSeconds * 1000),
                accumulated: 0,
                totalDuration: durationSeconds,
                label
            }
        });
        get()._syncToFirestore();
    },

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
        get()._syncToFirestore();
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
        get()._syncToFirestore();
    },

    stop: () => {
        set((state) => ({
            timer: { ...state.timer, status: 'FINISHED' }
        }));
        get()._syncToFirestore();
    },

    reset: () => {
        set({ timer: DEFAULT_TIMER });
        get()._syncToFirestore();
    },

    setLoading: (loading) => set({ isLoading: loading }),

    _syncToFirestore: () => {
        const { timer, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { timer });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data?.timer) {
            set({
                timer: { ...DEFAULT_TIMER, ...data.timer },
                isLoading: false,
                _initialized: true
            });
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({ timer: DEFAULT_TIMER, isLoading: true, _initialized: false });
    }
}));
