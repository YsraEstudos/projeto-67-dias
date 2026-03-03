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
import { immer } from 'zustand/middleware/immer';
import {
    AgendaActivity,
    AgendaActivityLog,
    DayOfWeekPlan,
    DayOverride,
    WeeklyAgendaData,
    CalendarEvent,
    ScheduledBlock,
    DayTemplate,
    TemplateBlock
} from '../types';
import { writeToFirestore } from './firestoreSync';
import { getTodayISO } from '../utils/dateUtils';

const STORE_KEY = 'p67_weekly_agenda';

// Helper to generate unique IDs
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Initial state
const initialState: WeeklyAgendaData = {
    weeklyPlan: [],
    overrides: [],
    activities: [],
    events: [],
    scheduledBlocks: [],
    templates: []
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

    // Template Actions
    templates: DayTemplate[];
    addTemplate: (name: string, blocks: TemplateBlock[]) => string;
    deleteTemplate: (id: string) => void;
    applyTemplateToDate: (templateId: string, date: string) => void;
    saveCurrentDayAsTemplate: (date: string, name: string) => string;

    // Internal Methods
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: WeeklyAgendaData | null) => void;
    _reset: () => void;
}

export const useWeeklyAgendaStore = create<WeeklyAgendaState>()(immer((set, get) => ({
    // Initial state
    weeklyPlan: [],
    overrides: [],
    activities: [],
    events: [],
    scheduledBlocks: [],
    templates: [],
    isLoading: true,
    _initialized: false,

    // Day Plan Actions
    setDayPlan: (dayOfWeek, skillGoals, activityGoals) => {
        set((state) => {
            const existingIndex = state.weeklyPlan.findIndex(p => p.dayOfWeek === dayOfWeek);
            const newPlan: DayOfWeekPlan = { dayOfWeek, skillGoals, activityGoals };

            if (existingIndex >= 0) {
                state.weeklyPlan[existingIndex] = newPlan;
            } else {
                state.weeklyPlan.push(newPlan);
            }
        });
        get()._syncToFirestore();
    },

    getDayPlan: (dayOfWeek) => {
        return get().weeklyPlan.find(p => p.dayOfWeek === dayOfWeek);
    },

    // Override Actions
    addOverride: (overrideData) => {
        set((state) => {
            // Remove existing override for same date
            const existingIdx = state.overrides.findIndex(o => o.date === overrideData.date);
            if (existingIdx !== -1) state.overrides.splice(existingIdx, 1);

            const override: DayOverride = {
                date: overrideData.date,
                reason: overrideData.reason,
                skillGoals: overrideData.skillGoals || [],
                activityGoals: overrideData.activityGoals || []
            };
            state.overrides.push(override);
        });
        get()._syncToFirestore();
    },

    updateOverride: (date, updates) => {
        set((state) => {
            const override = state.overrides.find(o => o.date === date);
            if (override) Object.assign(override, updates);
        });
        get()._syncToFirestore();
    },

    removeOverride: (date) => {
        set((state) => {
            const idx = state.overrides.findIndex(o => o.date === date);
            if (idx !== -1) state.overrides.splice(idx, 1);
        });
        get()._syncToFirestore();
    },

    getOverride: (date) => {
        return get().overrides.find(o => o.date === date);
    },

    // Activity Actions
    addActivity: (activityData) => {
        const id = generateId();
        set((state) => {
            const activity: AgendaActivity = {
                id,
                title: activityData.title,
                dailyGoalMinutes: activityData.dailyGoalMinutes,
                color: activityData.color,
                notes: activityData.notes,
                logs: [],
                createdAt: Date.now()
            };
            state.activities.push(activity);
        });
        get()._syncToFirestore();
        return id;
    },

    updateActivity: (id, updates) => {
        set((state) => {
            const activity = state.activities.find(a => a.id === id);
            if (activity) Object.assign(activity, updates);
        });
        get()._syncToFirestore();
    },

    deleteActivity: (id) => {
        set((state) => {
            // Remove activity
            const activityIdx = state.activities.findIndex(a => a.id === id);
            if (activityIdx !== -1) state.activities.splice(activityIdx, 1);

            // Remove from weekly plans
            for (const plan of state.weeklyPlan) {
                const goalIdx = plan.activityGoals.findIndex(g => g.activityId === id);
                if (goalIdx !== -1) plan.activityGoals.splice(goalIdx, 1);
            }

            // Remove from overrides
            for (const override of state.overrides) {
                const goalIdx = override.activityGoals.findIndex(g => g.activityId === id);
                if (goalIdx !== -1) override.activityGoals.splice(goalIdx, 1);
            }

            // Remove scheduled blocks referencing this activity
            for (let i = state.scheduledBlocks.length - 1; i >= 0; i--) {
                const block = state.scheduledBlocks[i];
                if (block.type === 'activity' && block.referenceId === id) {
                    state.scheduledBlocks.splice(i, 1);
                }
            }
        });
        get()._syncToFirestore();
    },

    logActivityTime: (activityId, minutes, date) => {
        const logDate = date || getTodayISO();
        set((state) => {
            const activity = state.activities.find(a => a.id === activityId);
            if (!activity) return;

            const existingLog = activity.logs.find(l => l.date === logDate);
            if (existingLog) {
                existingLog.minutes += minutes;
            } else {
                const newLog: AgendaActivityLog = { id: generateId(), date: logDate, minutes };
                activity.logs.push(newLog);
            }
        });
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
        set((state) => {
            const event: CalendarEvent = {
                id,
                title: eventData.title,
                description: eventData.description,
                color: eventData.color,
                defaultDurationMinutes: eventData.defaultDurationMinutes,
                createdAt: Date.now()
            };
            state.events.push(event);
        });
        get()._syncToFirestore();
        return id;
    },

    updateEvent: (id, updates) => {
        set((state) => {
            const event = state.events.find(e => e.id === id);
            if (event) Object.assign(event, updates);
        });
        get()._syncToFirestore();
    },

    deleteEvent: (id) => {
        set((state) => {
            // Remove event
            const eventIdx = state.events.findIndex(e => e.id === id);
            if (eventIdx !== -1) state.events.splice(eventIdx, 1);

            // Remove scheduled blocks referencing this event
            for (let i = state.scheduledBlocks.length - 1; i >= 0; i--) {
                const block = state.scheduledBlocks[i];
                if (block.type === 'event' && block.referenceId === id) {
                    state.scheduledBlocks.splice(i, 1);
                }
            }
        });
        get()._syncToFirestore();
    },

    // Scheduled Block Actions
    scheduleBlock: (blockData) => {
        const id = generateId();
        set((state) => {
            const block: ScheduledBlock = { id, ...blockData };
            state.scheduledBlocks.push(block);
        });
        get()._syncToFirestore();
        return id;
    },

    updateBlock: (id, updates) => {
        set((state) => {
            const block = state.scheduledBlocks.find(b => b.id === id);
            if (block) Object.assign(block, updates);
        });
        get()._syncToFirestore();
    },

    deleteBlock: (id) => {
        set((state) => {
            const idx = state.scheduledBlocks.findIndex(b => b.id === id);
            if (idx !== -1) state.scheduledBlocks.splice(idx, 1);
        });
        get()._syncToFirestore();
    },

    moveBlock: (blockId, newDate, newStartHour, newStartMinute) => {
        set((state) => {
            const block = state.scheduledBlocks.find(b => b.id === blockId);
            if (block) {
                block.date = newDate;
                block.startHour = newStartHour;
                block.startMinute = newStartMinute;
            }
        });
        get()._syncToFirestore();
    },

    resizeBlock: (blockId, newDurationMinutes) => {
        set((state) => {
            const block = state.scheduledBlocks.find(b => b.id === blockId);
            if (block) {
                block.durationMinutes = Math.max(15, newDurationMinutes); // Min 15 min
            }
        });
        get()._syncToFirestore();
    },

    getBlocksForDate: (date) => {
        return get().scheduledBlocks.filter(b => b.date === date);
    },

    // Template Actions
    addTemplate: (name, blocks) => {
        const id = generateId();
        set((state) => {
            const template: DayTemplate = {
                id,
                name,
                blocks,
                createdAt: Date.now()
            };
            if (!state.templates) state.templates = [];
            state.templates.push(template);
        });
        get()._syncToFirestore();
        return id;
    },

    deleteTemplate: (id) => {
        set((state) => {
            if (!state.templates) return;
            const idx = state.templates.findIndex(t => t.id === id);
            if (idx !== -1) state.templates.splice(idx, 1);
        });
        get()._syncToFirestore();
    },

    applyTemplateToDate: (templateId, date) => {
        const template = get().templates?.find(t => t.id === templateId);
        if (!template) return;

        set((state) => {
            // Remove existing blocks for this date
            state.scheduledBlocks = state.scheduledBlocks.filter(b => b.date !== date);

            // Add template blocks with new IDs and the target date
            for (const tb of template.blocks) {
                const newBlock: ScheduledBlock = {
                    id: generateId(),
                    date,
                    startHour: tb.startHour,
                    startMinute: tb.startMinute,
                    durationMinutes: tb.durationMinutes,
                    type: tb.type,
                    referenceId: tb.referenceId,
                    color: tb.color,
                    notes: tb.notes
                };
                state.scheduledBlocks.push(newBlock);
            }
        });
        get()._syncToFirestore();
    },

    saveCurrentDayAsTemplate: (date, name) => {
        const blocksForDate = get().scheduledBlocks.filter(b => b.date === date);
        const templateBlocks: TemplateBlock[] = blocksForDate.map(b => ({
            startHour: b.startHour,
            startMinute: b.startMinute,
            durationMinutes: b.durationMinutes,
            type: b.type,
            referenceId: b.referenceId,
            color: b.color,
            notes: b.notes
        }));
        return get().addTemplate(name, templateBlocks);
    },

    // Internal Methods
    _syncToFirestore: () => {
        const { weeklyPlan, overrides, activities, events, scheduledBlocks, templates, _initialized } = get();
        if (_initialized) {
            const data = { weeklyPlan, overrides, activities, events, scheduledBlocks, templates };
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(() => writeToFirestore(STORE_KEY, data), { timeout: 2000 });
            } else {
                setTimeout(() => writeToFirestore(STORE_KEY, data), 100);
            }
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            set((state) => {
                state.weeklyPlan = data.weeklyPlan || [];
                state.overrides = data.overrides || [];
                state.activities = data.activities || [];
                state.events = data.events || [];
                state.scheduledBlocks = data.scheduledBlocks || [];
                state.templates = data.templates || [];
                state.isLoading = false;
                state._initialized = true;
            });
        } else {
            set((state) => {
                state.isLoading = false;
                state._initialized = true;
            });
        }
    },

    _reset: () => {
        set((state) => {
            Object.assign(state, { ...initialState, isLoading: true, _initialized: false });
        });
    }
})));

