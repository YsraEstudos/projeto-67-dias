/**
 * Rest Store - Rest activities with Firestore-first persistence
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { RestActivity, RestActivityLink } from '../types';
import { writeToFirestore } from './firestoreSync';
import { addDaysToDate, formatDateISO } from '../utils/dateUtils';

const STORE_KEY = 'p67_rest_store';

const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

interface RestState {
    activities: RestActivity[];
    nextTwoHoursIds: string[];
    isLoading: boolean;
    _initialized: boolean;

    setActivities: (activities: RestActivity[]) => void;
    addActivity: (activity: RestActivity) => void;
    addActivities: (activities: RestActivity[]) => void;
    updateActivity: (id: string, updates: Partial<RestActivity>) => void;
    deleteActivity: (id: string) => void;
    toggleActivityComplete: (id: string) => void;
    reorderActivities: (activities: RestActivity[]) => void;

    addLink: (activityId: string, link: RestActivityLink) => void;
    updateLink: (activityId: string, linkId: string, updates: Partial<RestActivityLink>) => void;
    deleteLink: (activityId: string, linkId: string) => void;

    setNextTwoHoursIds: (ids: string[]) => void;
    addToNextTwoHours: (id: string) => void;
    removeFromNextTwoHours: (id: string) => void;

    setLoading: (loading: boolean) => void;

    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { activities: RestActivity[]; nextTwoHoursIds: string[] } | null) => void;
    _reset: () => void;
}

export const useRestStore = create<RestState>()(immer((set, get) => ({
    activities: [],
    nextTwoHoursIds: [],
    isLoading: true,
    _initialized: false,

    setActivities: (activities) => {
        set((state) => { state.activities = deduplicateById(activities); });
        get()._syncToFirestore();
    },

    addActivity: (activity) => {
        set((state) => { state.activities.push(activity); });
        get()._syncToFirestore();
    },

    addActivities: (activities) => {
        set((state) => { state.activities.push(...activities); });
        get()._syncToFirestore();
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
            const idx = state.activities.findIndex(a => a.id === id);
            if (idx !== -1) state.activities.splice(idx, 1);

            const nextIdx = state.nextTwoHoursIds.indexOf(id);
            if (nextIdx !== -1) state.nextTwoHoursIds.splice(nextIdx, 1);
        });
        get()._syncToFirestore();
    },

    toggleActivityComplete: (id) => {
        set((state) => {
            const activity = state.activities.find(a => a.id === id);
            if (activity) activity.isCompleted = !activity.isCompleted;
        });
        get()._syncToFirestore();
    },

    reorderActivities: (activities) => {
        set((state) => { state.activities = activities; });
        get()._syncToFirestore();
    },

    addLink: (activityId, link) => {
        set((state) => {
            const activity = state.activities.find(a => a.id === activityId);
            if (!activity) return;
            if (!activity.links) activity.links = [];
            activity.links.push(link);
        });
        get()._syncToFirestore();
    },

    updateLink: (activityId, linkId, updates) => {
        set((state) => {
            const activity = state.activities.find(a => a.id === activityId);
            if (!activity?.links) return;
            const link = activity.links.find(l => l.id === linkId);
            if (link) Object.assign(link, updates);
        });
        get()._syncToFirestore();
    },

    deleteLink: (activityId, linkId) => {
        set((state) => {
            const activity = state.activities.find(a => a.id === activityId);
            if (!activity?.links) return;
            const idx = activity.links.findIndex(l => l.id === linkId);
            if (idx !== -1) activity.links.splice(idx, 1);
        });
        get()._syncToFirestore();
    },

    setNextTwoHoursIds: (ids) => {
        set((state) => { state.nextTwoHoursIds = ids; });
        get()._syncToFirestore();
    },

    addToNextTwoHours: (id) => {
        set((state) => {
            if (!state.nextTwoHoursIds.includes(id)) {
                state.nextTwoHoursIds.push(id);
            }
        });
        get()._syncToFirestore();
    },

    removeFromNextTwoHours: (id) => {
        set((state) => {
            const idx = state.nextTwoHoursIds.indexOf(id);
            if (idx !== -1) state.nextTwoHoursIds.splice(idx, 1);
        });
        get()._syncToFirestore();
    },

    setLoading: (loading) => set((state) => { state.isLoading = loading; }),

    _syncToFirestore: () => {
        const { activities, nextTwoHoursIds, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { activities, nextTwoHoursIds });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            // Clean up old ONCE activities
            let activities = deduplicateById(data.activities || []);
            const thirtyDaysAgo = addDaysToDate(new Date(), -30);
            const thresholdDate = formatDateISO(thirtyDaysAgo);
            activities = activities.filter(a => {
                if (a.type !== 'ONCE') return true;
                return (a.specificDate || '') >= thresholdDate;
            });

            set((state) => {
                state.activities = activities;
                state.nextTwoHoursIds = [...new Set(data.nextTwoHoursIds || [])];
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
            state.activities = [];
            state.nextTwoHoursIds = [];
            state.isLoading = true;
            state._initialized = false;
        });
    }
})));

