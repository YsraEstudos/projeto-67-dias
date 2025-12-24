/**
 * Weekly Agenda Store
 * 
 * Manages weekly skill planning with:
 * - Default day plans (per day of week)
 * - Day overrides (for specific dates)
 * - Extra activities (non-skill items)
 */
import { create } from 'zustand';
import { AgendaActivity, AgendaActivityLog, DayOfWeekPlan, DayOverride, WeeklyAgendaData } from '../types';
import { writeToFirestore } from './firestoreSync';

const STORE_KEY = 'p67_weekly_agenda';

// Helper to generate unique IDs
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Initial state
const initialState: WeeklyAgendaData = {
    weeklyPlan: [],
    overrides: [],
    activities: []
};

interface WeeklyAgendaState extends WeeklyAgendaData {
    isLoading: boolean;
    _initialized: boolean;

    // Day Plan Actions
    setDayPlan: (dayOfWeek: number, skillGoals: DayOfWeekPlan['skillGoals'], activityGoals: DayOfWeekPlan['activityGoals']) => void;
    getDayPlan: (dayOfWeek: number) => DayOfWeekPlan | undefined;

    // Override Actions
    addOverride: (override: Omit<DayOverride, 'skillGoals' | 'activityGoals'> & Partial<Pick<DayOverride, 'skillGoals' | 'activityGoals'>>) => void;
    updateOverride: (date: string, updates: Partial<DayOverride>) => void;
    removeOverride: (date: string) => void;
    getOverride: (date: string) => DayOverride | undefined;

    // Activity Actions
    addActivity: (activity: Omit<AgendaActivity, 'id' | 'logs' | 'createdAt'>) => string;
    updateActivity: (id: string, updates: Partial<Omit<AgendaActivity, 'id' | 'logs' | 'createdAt'>>) => void;
    deleteActivity: (id: string) => void;
    logActivityTime: (activityId: string, minutes: number, date?: string) => void;
    getActivityProgress: (activityId: string, date: string) => number;

    // Internal Methods
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: WeeklyAgendaData | null) => void;
    _reset: () => void;
}

export const useWeeklyAgendaStore = create<WeeklyAgendaState>()((set, get) => ({
    // Initial state
    weeklyPlan: [],
    overrides: [],
    activities: [],
    isLoading: true,
    _initialized: false,

    // Day Plan Actions
    setDayPlan: (dayOfWeek, skillGoals, activityGoals) => {
        set((state) => {
            const existingIndex = state.weeklyPlan.findIndex(p => p.dayOfWeek === dayOfWeek);
            const newPlan: DayOfWeekPlan = { dayOfWeek, skillGoals, activityGoals };

            if (existingIndex >= 0) {
                const updated = [...state.weeklyPlan];
                updated[existingIndex] = newPlan;
                return { weeklyPlan: updated };
            } else {
                return { weeklyPlan: [...state.weeklyPlan, newPlan] };
            }
        });
        get()._syncToFirestore();
    },

    getDayPlan: (dayOfWeek) => {
        return get().weeklyPlan.find(p => p.dayOfWeek === dayOfWeek);
    },

    // Override Actions
    addOverride: (overrideData) => {
        const override: DayOverride = {
            date: overrideData.date,
            reason: overrideData.reason,
            skillGoals: overrideData.skillGoals || [],
            activityGoals: overrideData.activityGoals || []
        };

        set((state) => {
            // Remove existing override for same date
            const filtered = state.overrides.filter(o => o.date !== override.date);
            return { overrides: [...filtered, override] };
        });
        get()._syncToFirestore();
    },

    updateOverride: (date, updates) => {
        set((state) => ({
            overrides: state.overrides.map(o =>
                o.date === date ? { ...o, ...updates } : o
            )
        }));
        get()._syncToFirestore();
    },

    removeOverride: (date) => {
        set((state) => ({
            overrides: state.overrides.filter(o => o.date !== date)
        }));
        get()._syncToFirestore();
    },

    getOverride: (date) => {
        return get().overrides.find(o => o.date === date);
    },

    // Activity Actions
    addActivity: (activityData) => {
        const id = generateId();
        const activity: AgendaActivity = {
            id,
            title: activityData.title,
            dailyGoalMinutes: activityData.dailyGoalMinutes,
            color: activityData.color,
            notes: activityData.notes,
            logs: [],
            createdAt: Date.now()
        };

        set((state) => ({
            activities: [...state.activities, activity]
        }));
        get()._syncToFirestore();
        return id;
    },

    updateActivity: (id, updates) => {
        set((state) => ({
            activities: state.activities.map(a =>
                a.id === id ? { ...a, ...updates } : a
            )
        }));
        get()._syncToFirestore();
    },

    deleteActivity: (id) => {
        set((state) => ({
            activities: state.activities.filter(a => a.id !== id),
            // Also remove from all plans and overrides
            weeklyPlan: state.weeklyPlan.map(p => ({
                ...p,
                activityGoals: p.activityGoals.filter(g => g.activityId !== id)
            })),
            overrides: state.overrides.map(o => ({
                ...o,
                activityGoals: o.activityGoals.filter(g => g.activityId !== id)
            }))
        }));
        get()._syncToFirestore();
    },

    logActivityTime: (activityId, minutes, date) => {
        const logDate = date || new Date().toISOString().split('T')[0];
        const logId = generateId();

        set((state) => ({
            activities: state.activities.map(a => {
                if (a.id !== activityId) return a;

                // Check if log for this date already exists
                const existingLogIndex = a.logs.findIndex(l => l.date === logDate);

                if (existingLogIndex >= 0) {
                    // Update existing log
                    const updatedLogs = [...a.logs];
                    updatedLogs[existingLogIndex] = {
                        ...updatedLogs[existingLogIndex],
                        minutes: updatedLogs[existingLogIndex].minutes + minutes
                    };
                    return { ...a, logs: updatedLogs };
                } else {
                    // Add new log
                    const newLog: AgendaActivityLog = { id: logId, date: logDate, minutes };
                    return { ...a, logs: [...a.logs, newLog] };
                }
            })
        }));
        get()._syncToFirestore();
    },

    getActivityProgress: (activityId, date) => {
        const activity = get().activities.find(a => a.id === activityId);
        if (!activity) return 0;

        const log = activity.logs.find(l => l.date === date);
        return log?.minutes || 0;
    },

    // Internal Methods
    _syncToFirestore: () => {
        const { weeklyPlan, overrides, activities, _initialized } = get();
        if (_initialized) {
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(() => writeToFirestore(STORE_KEY, { weeklyPlan, overrides, activities }), { timeout: 2000 });
            } else {
                setTimeout(() => writeToFirestore(STORE_KEY, { weeklyPlan, overrides, activities }), 100);
            }
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            set({
                weeklyPlan: data.weeklyPlan || [],
                overrides: data.overrides || [],
                activities: data.activities || [],
                isLoading: false,
                _initialized: true
            });
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({ ...initialState, isLoading: true, _initialized: false });
    }
}));
