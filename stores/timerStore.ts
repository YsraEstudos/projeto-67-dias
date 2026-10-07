/**
 * Timer Store - Global timer state with Firestore-first persistence
 */
import { create } from 'zustand';
import { GlobalTimerState } from '../types';
import { writeToFirestore } from './firestoreSync';

const STORE_KEY = 'p67_tool_timer';

export const DEFAULT_POMODORO_SECONDS = 25 * 60; // 25 minutes in seconds

const DEFAULT_TIMER: GlobalTimerState = {
    mode: 'STOPWATCH',
    status: 'IDLE',
    startTime: null,
    endTime: null,
    accumulated: 0,
    totalDuration: 0,
    label: undefined
};

/**
 * Tempo a exibir (ms) para o estado global do timer.
 *
 * Contrato compartilhado com o TimerTool (principal produtor do estado):
 * - TIMER RUNNING: tempo restante = endTime - now
 * - TIMER PAUSED: `accumulated` guarda o tempo RESTANTE
 * - STOPWATCH: `accumulated` guarda o tempo decorrido antes do último start
 */
export function getTimerDisplayMs(timer: GlobalTimerState, now: number = Date.now()): number {
    const runningElapsed = timer.status === 'RUNNING' && timer.startTime ? now - timer.startTime : 0;

    if (timer.mode === 'STOPWATCH') {
        if (timer.status === 'IDLE') return 0;
        return Math.max(0, timer.accumulated + runningElapsed);
    }

    switch (timer.status) {
        case 'IDLE':
            return timer.totalDuration * 1000;
        case 'FINISHED':
            return 0;
        case 'PAUSED':
            return Math.max(0, timer.accumulated);
        case 'RUNNING':
            if (timer.endTime) return Math.max(0, timer.endTime - now);
            // Estado legado sem endTime: deriva do início
            return Math.max(0, timer.totalDuration * 1000 - runningElapsed);
    }
}

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
        if (timer.status !== 'RUNNING') return;

        const now = Date.now();
        // TIMER guarda o restante em `accumulated` (mesmo contrato do TimerTool);
        // antes guardava o decorrido e a retomada ignorava o endTime antigo.
        const accumulated = getTimerDisplayMs(timer, now);
        set({
            timer: {
                ...timer,
                status: 'PAUSED',
                accumulated,
                startTime: null,
            }
        });
        get()._syncToFirestore();
    },

    resume: () => {
        const { timer } = get();
        if (timer.status !== 'PAUSED') return;

        const now = Date.now();
        set({
            timer: {
                ...timer,
                status: 'RUNNING',
                startTime: now,
                endTime: timer.mode === 'TIMER' ? now + timer.accumulated : timer.endTime,
            }
        });
        get()._syncToFirestore();
    },

    stop: () => {
        const { timer } = get();
        const now = Date.now();
        // Congela o tempo do cronômetro; sem isso o decorrido final se perdia.
        const accumulated = timer.mode === 'STOPWATCH' ? getTimerDisplayMs(timer, now) : 0;
        set({
            timer: { ...timer, status: 'FINISHED', accumulated, startTime: null }
        });
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
