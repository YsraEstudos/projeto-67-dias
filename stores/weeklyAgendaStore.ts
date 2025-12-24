/**
 * Weekly Agenda Store
 * 
 * Manages weekly skill planning with:
 * - Default day plans (per day of week)
 * - Day overrides (for specific dates)
 * - Extra activities (non-skill items)
 * - Calendar events (custom events)
 * - Scheduled blocks (Google Calendar style)
 */
import { create } from 'zustand';
import {
    AgendaActivity,
    AgendaActivityLog,
    DayOfWeekPlan,
    DayOverride,
    WeeklyAgendaData,
    CalendarEvent,
    ScheduledBlock
} from '../types';
import { writeToFirestore } from './firestoreSync';

const STORE_KEY = 'p67_weekly_agenda';

// Helper to generate unique IDs
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Initial state
const initialState: WeeklyAgendaData = {
    weeklyPlan: [],
    overrides: [],
    activities: [],
    events: [],
    scheduledBlocks: []
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

    // Calendar Event Actions
    addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => string;
    updateEvent: (id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>) => void;
    deleteEvent: (id: string) => void;

    // Scheduled Block Actions (Google Calendar style)
    scheduleBlock: (block: Omit<ScheduledBlock, 'id'>) => string;
    updateBlock: (id: string, updates: Partial<Omit<ScheduledBlock, 'id'>>) => void;
    deleteBlock: (id: string) => void;
    moveBlock: (blockId: string, newDate: string, newStartHour: number, newStartMinute: number) => void;
    resizeBlock: (blockId: string, newDurationMinutes: number) => void;
    getBlocksForDate: (date: string) => ScheduledBlock[];

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
    events: [],
    scheduledBlocks: [],
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
            // Also remove from all plans, overrides, and scheduled blocks
            weeklyPlan: state.weeklyPlan.map(p => ({
                ...p,
                activityGoals: p.activityGoals.filter(g => g.activityId !== id)
            })),
            overrides: state.overrides.map(o => ({
                ...o,
                activityGoals: o.activityGoals.filter(g => g.activityId !== id)
            })),
            scheduledBlocks: state.scheduledBlocks.filter(b =>
                !(b.type === 'activity' && b.referenceId === id)
            )
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

    // Calendar Event Actions
    addEvent: (eventData) => {
        const id = generateId();
        const event: CalendarEvent = {
            id,
            title: eventData.title,
            description: eventData.description,
            color: eventData.color,
            defaultDurationMinutes: eventData.defaultDurationMinutes,
            createdAt: Date.now()
        };

        set((state) => ({
            events: [...state.events, event]
        }));
        get()._syncToFirestore();
        return id;
    },

    updateEvent: (id, updates) => {
        set((state) => ({
            events: state.events.map(e =>
                e.id === id ? { ...e, ...updates } : e
            )
        }));
        get()._syncToFirestore();
    },

    deleteEvent: (id) => {
        set((state) => ({
            events: state.events.filter(e => e.id !== id),
            // Also remove scheduled blocks referencing this event
            scheduledBlocks: state.scheduledBlocks.filter(b =>
                !(b.type === 'event' && b.referenceId === id)
            )
        }));
        get()._syncToFirestore();
    },

    // Scheduled Block Actions
    scheduleBlock: (blockData) => {
        const id = generateId();
        const block: ScheduledBlock = {
            id,
            ...blockData
        };

        set((state) => ({
            scheduledBlocks: [...state.scheduledBlocks, block]
        }));
        get()._syncToFirestore();
        return id;
    },

    updateBlock: (id, updates) => {
        set((state) => ({
            scheduledBlocks: state.scheduledBlocks.map(b =>
                b.id === id ? { ...b, ...updates } : b
            )
        }));
        get()._syncToFirestore();
    },

    deleteBlock: (id) => {
        set((state) => ({
            scheduledBlocks: state.scheduledBlocks.filter(b => b.id !== id)
        }));
        get()._syncToFirestore();
    },

    moveBlock: (blockId, newDate, newStartHour, newStartMinute) => {
        set((state) => ({
            scheduledBlocks: state.scheduledBlocks.map(b =>
                b.id === blockId
                    ? { ...b, date: newDate, startHour: newStartHour, startMinute: newStartMinute }
                    : b
            )
        }));
        get()._syncToFirestore();
    },

    resizeBlock: (blockId, newDurationMinutes) => {
        set((state) => ({
            scheduledBlocks: state.scheduledBlocks.map(b =>
                b.id === blockId
                    ? { ...b, durationMinutes: Math.max(15, newDurationMinutes) } // Min 15 min
                    : b
            )
        }));
        get()._syncToFirestore();
    },

    getBlocksForDate: (date) => {
        return get().scheduledBlocks.filter(b => b.date === date);
    },

    // Internal Methods
    _syncToFirestore: () => {
        const { weeklyPlan, overrides, activities, events, scheduledBlocks, _initialized } = get();
        if (_initialized) {
            const data = { weeklyPlan, overrides, activities, events, scheduledBlocks };
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(() => writeToFirestore(STORE_KEY, data), { timeout: 2000 });
            } else {
                setTimeout(() => writeToFirestore(STORE_KEY, data), 100);
            }
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            set({
                weeklyPlan: data.weeklyPlan || [],
                overrides: data.overrides || [],
                activities: data.activities || [],
                events: data.events || [],
                scheduledBlocks: data.scheduledBlocks || [],
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
