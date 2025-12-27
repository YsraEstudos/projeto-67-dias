/**
 * Sunday Timer Store - Timer do Ajeitar Rápido com persistência Firestore
 * 
 * Timer de 2.5h para sessões de organização semanal.
 * Exibe widget flutuante global quando ativo.
 */
import { create } from 'zustand';
import { SundayTimerState, WidgetPosition } from '../types';
import { writeToFirestore } from './firestoreSync';

const STORE_KEY = 'p67_sunday_timer';
const DEFAULT_DURATION = 150 * 60 * 1000; // 2.5h em ms

const DEFAULT_TIMER: SundayTimerState = {
    status: 'IDLE',
    startTime: null,
    pausedAt: null,
    accumulated: 0,
    totalDuration: DEFAULT_DURATION,
    widgetPosition: 'bottom-right'
};

interface SundayTimerStoreState {
    timer: SundayTimerState;
    isLoading: boolean;
    _initialized: boolean;

    // Timer Actions
    start: () => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    reset: () => void;

    // Widget Position
    setPosition: (position: WidgetPosition) => void;

    // Internal
    setLoading: (loading: boolean) => void;
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { timer: SundayTimerState } | null) => void;
    _reset: () => void;
}

export const useSundayTimerStore = create<SundayTimerStoreState>()((set, get) => ({
    timer: DEFAULT_TIMER,
    isLoading: true,
    _initialized: false,

    start: () => {
        set({
            timer: {
                ...get().timer,
                status: 'RUNNING',
                startTime: Date.now(),
                pausedAt: null,
                accumulated: 0
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
                pausedAt: Date.now(),
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
                startTime: Date.now(),
                pausedAt: null
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

    setPosition: (position) => {
        set((state) => ({
            timer: { ...state.timer, widgetPosition: position }
        }));
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

// Utility: Calcular tempo restante em ms
export const getTimeRemaining = (timer: SundayTimerState): number => {
    if (timer.status === 'IDLE') return timer.totalDuration;
    if (timer.status === 'FINISHED') return 0;

    if (timer.status === 'PAUSED') {
        return timer.totalDuration - timer.accumulated;
    }

    // RUNNING
    if (!timer.startTime) return timer.totalDuration;
    const elapsed = Date.now() - timer.startTime + timer.accumulated;
    return Math.max(0, timer.totalDuration - elapsed);
};
