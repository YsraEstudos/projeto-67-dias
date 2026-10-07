/**
 * Water Store - Water tracking with Firestore-first persistence
 */
import { create } from 'zustand';
import { writeToFirestore } from './firestoreSync';
import { getTodayISO } from '../utils/dateUtils';

const STORE_KEY = 'p67_water_store';

export interface WaterLog {
    amount: number;
    goal: number;
}

export interface BottleType {
    id: string;
    label: string;
    amount: number;
    icon?: string;
    color?: string;
}

const MIN_BOTTLE_AMOUNT = 50;
const MAX_BOTTLE_AMOUNT = 5000;
const MAX_BOTTLES = 12;

const DEFAULT_GOAL = 2500;
export const MIN_DAILY_GOAL = 250;
export const MAX_DAILY_GOAL = 10000;

/** Clamp a daily goal to a sane range; invalid values fall back to the default. */
export const sanitizeGoal = (goal: unknown): number => {
    const n = Number(goal);
    if (!Number.isFinite(n) || n <= 0) return DEFAULT_GOAL;
    return Math.round(Math.min(MAX_DAILY_GOAL, Math.max(MIN_DAILY_GOAL, n)));
};

/**
 * Re-derive `today`/`currentAmount` from the real calendar day so the counter
 * resets after midnight even if the app stayed open (stale `today`).
 */
const rollDay = (state: { today: string; currentAmount: number; history: Record<string, WaterLog> }) => {
    const today = getTodayISO();
    if (today === state.today) return { today, currentAmount: state.currentAmount };
    return { today, currentAmount: state.history[today]?.amount || 0 };
};

const DEFAULT_BOTTLES: BottleType[] = [
    { id: 'copo', label: 'Copo', amount: 200, icon: '🥛', color: '#60a5fa' },
    { id: 'garrafa-pequena', label: 'Garrafa Pequena', amount: 300, icon: '🧴', color: '#34d399' },
    { id: 'garrafa-media', label: 'Garrafa Média', amount: 500, icon: '🍶', color: '#a78bfa' },
    { id: 'garrafa-grande', label: 'Garrafa Grande', amount: 600, icon: '🫗', color: '#22d3ee' },
    { id: 'garrafa-1l', label: 'Garrafa 1L', amount: 1000, icon: '💧', color: '#2dd4bf' },
    { id: 'mega-garrafa', label: 'Mega Garrafa', amount: 1700, icon: '🏋️', color: '#f97316' },
];

interface WaterState {
    today: string;
    currentAmount: number;
    dailyGoal: number;
    history: Record<string, WaterLog>;
    bottles: BottleType[];
    isLoading: boolean;
    _initialized: boolean;

    addWater: (amount: number, date: string) => void;
    removeWater: (amount: number, date: string) => void;
    setGoal: (amount: number) => void;
    checkDate: (date: string) => void;

    addBottle: (bottle: Omit<BottleType, 'id'>) => void;
    updateBottle: (id: string, updates: Partial<Omit<BottleType, 'id'>>) => void;
    removeBottle: (id: string) => void;
    resetBottlesToDefault: () => void;

    setLoading: (loading: boolean) => void;

    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { dailyGoal: number; history: Record<string, WaterLog>; today: string; bottles: BottleType[] } | null) => void;
    _reset: () => void;
}

export const useWaterStore = create<WaterState>()((set, get) => ({
    today: getTodayISO(),
    currentAmount: 0,
    dailyGoal: DEFAULT_GOAL,
    history: {},
    bottles: DEFAULT_BOTTLES,
    isLoading: true,
    _initialized: false,

    addWater: (amount, date) => {
        if (!Number.isFinite(amount) || amount <= 0) return;
        set((state) => {
            const day = rollDay(state);
            const currentLog = state.history[date] || { amount: 0, goal: state.dailyGoal };
            const newAmount = currentLog.amount + amount;
            return {
                today: day.today,
                currentAmount: date === day.today ? newAmount : day.currentAmount,
                history: { ...state.history, [date]: { ...currentLog, amount: newAmount } }
            };
        });
        get()._syncToFirestore();
    },

    removeWater: (amount, date) => {
        if (!Number.isFinite(amount) || amount <= 0) return;
        set((state) => {
            const day = rollDay(state);
            const currentLog = state.history[date] || { amount: 0, goal: state.dailyGoal };
            const newAmount = Math.max(0, currentLog.amount - amount);
            return {
                today: day.today,
                currentAmount: date === day.today ? newAmount : day.currentAmount,
                history: { ...state.history, [date]: { ...currentLog, amount: newAmount } }
            };
        });
        get()._syncToFirestore();
    },

    setGoal: (rawGoal) => {
        const goal = sanitizeGoal(rawGoal);
        set((state) => {
            const day = rollDay(state);
            return {
                ...day,
                dailyGoal: goal,
                history: {
                    ...state.history,
                    [day.today]: { ...(state.history[day.today] || { amount: 0 }), goal }
                }
            };
        });
        get()._syncToFirestore();
    },

    checkDate: (date) => {
        set((state) => {
            if (date !== state.today) {
                // Day changed: the counter must reflect the new day's log, not yesterday's
                return { today: date, currentAmount: state.history[date]?.amount || 0 };
            }
            return {};
        });
    },

    addBottle: (bottle) => {
        set((state) => {
            if (state.bottles.length >= MAX_BOTTLES) return {};
            const sanitizedAmount = Math.min(MAX_BOTTLE_AMOUNT, Math.max(MIN_BOTTLE_AMOUNT, bottle.amount));
            const sanitizedLabel = bottle.label.slice(0, 30).trim();
            if (!sanitizedLabel) return {};
            return {
                bottles: [...state.bottles, {
                    label: sanitizedLabel,
                    amount: sanitizedAmount,
                    icon: bottle.icon?.slice(0, 4) || '💧',
                    color: bottle.color || '#22d3ee',
                    id: `bottle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                }]
            };
        });
        get()._syncToFirestore();
    },

    updateBottle: (id, updates) => {
        set((state) => ({
            bottles: state.bottles.map((bottle) => {
                if (bottle.id !== id) return bottle;
                const sanitizedUpdates: Partial<BottleType> = {};
                if (updates.label !== undefined) {
                    sanitizedUpdates.label = updates.label.slice(0, 30).trim() || bottle.label;
                }
                if (updates.amount !== undefined) {
                    sanitizedUpdates.amount = Math.min(MAX_BOTTLE_AMOUNT, Math.max(MIN_BOTTLE_AMOUNT, updates.amount));
                }
                if (updates.icon !== undefined) {
                    sanitizedUpdates.icon = updates.icon.slice(0, 4);
                }
                if (updates.color !== undefined) {
                    sanitizedUpdates.color = updates.color;
                }
                return { ...bottle, ...sanitizedUpdates };
            })
        }));
        get()._syncToFirestore();
    },

    removeBottle: (id) => {
        set((state) => ({ bottles: state.bottles.filter((b) => b.id !== id) }));
        get()._syncToFirestore();
    },

    resetBottlesToDefault: () => {
        set({ bottles: DEFAULT_BOTTLES });
        get()._syncToFirestore();
    },

    setLoading: (loading) => set({ isLoading: loading }),

    _syncToFirestore: () => {
        const { dailyGoal, history, today, bottles, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { dailyGoal, history, today, bottles });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            const today = getTodayISO();
            const currentLog = data.history?.[today];
            set({
                dailyGoal: sanitizeGoal(data.dailyGoal),
                history: data.history || {},
                today,
                bottles: data.bottles || DEFAULT_BOTTLES,
                currentAmount: currentLog?.amount || 0,
                isLoading: false,
                _initialized: true
            });
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({
            today: getTodayISO(),
            currentAmount: 0,
            dailyGoal: DEFAULT_GOAL,
            history: {},
            bottles: DEFAULT_BOTTLES,
            isLoading: true,
            _initialized: false
        });
    }
}));
