/**
 * Rest Store - Rest activities with Firestore-first persistence
 */
import { create } from 'zustand';
import { RestActivity, RestActivityLink } from '../types';
import { writeToFirestore } from './firestoreSync';

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

export const useRestStore = create<RestState>()((set, get) => ({
    activities: [],
    nextTwoHoursIds: [],
    isLoading: true,
    _initialized: false,

    setActivities: (activities) => {
        set({ activities: deduplicateById(activities) });
        get()._syncToFirestore();
    },

    addActivity: (activity) => {
        set((state) => ({ activities: [...state.activities, activity] }));
        get()._syncToFirestore();
    },

    addActivities: (activities) => {
        set((state) => ({ activities: [...state.activities, ...activities] }));
        get()._syncToFirestore();
    },

    updateActivity: (id, updates) => {
        set((state) => ({
            activities: state.activities.map(a => a.id === id ? { ...a, ...updates } : a)
        }));
        get()._syncToFirestore();
    },

    deleteActivity: (id) => {
        set((state) => ({
            activities: state.activities.filter(a => a.id !== id),
            nextTwoHoursIds: state.nextTwoHoursIds.filter(i => i !== id)
        }));
        get()._syncToFirestore();
    },

    toggleActivityComplete: (id) => {
        set((state) => ({
            activities: state.activities.map(a =>
                a.id === id ? { ...a, isCompleted: !a.isCompleted } : a
            )
        }));
        get()._syncToFirestore();
    },

    reorderActivities: (activities) => {
        set({ activities });
        get()._syncToFirestore();
    },

    addLink: (activityId, link) => {
        set((state) => ({
            activities: state.activities.map(a => {
                if (a.id !== activityId) return a;
                return { ...a, links: [...(a.links || []), link] };
            })
        }));
        get()._syncToFirestore();
    },

    updateLink: (activityId, linkId, updates) => {
        set((state) => ({
            activities: state.activities.map(a => {
                if (a.id !== activityId) return a;
                return {
                    ...a,
                    links: (a.links || []).map(l => l.id === linkId ? { ...l, ...updates } : l)
                };
            })
        }));
        get()._syncToFirestore();
    },

    deleteLink: (activityId, linkId) => {
        set((state) => ({
            activities: state.activities.map(a => {
                if (a.id !== activityId) return a;
                return { ...a, links: (a.links || []).filter(l => l.id !== linkId) };
            })
        }));
        get()._syncToFirestore();
    },

    setNextTwoHoursIds: (ids) => {
        set({ nextTwoHoursIds: ids });
        get()._syncToFirestore();
    },

    addToNextTwoHours: (id) => {
        set((state) => ({
            nextTwoHoursIds: state.nextTwoHoursIds.includes(id)
                ? state.nextTwoHoursIds
                : [...state.nextTwoHoursIds, id]
        }));
        get()._syncToFirestore();
    },

    removeFromNextTwoHours: (id) => {
        set((state) => ({
            nextTwoHoursIds: state.nextTwoHoursIds.filter(i => i !== id)
        }));
        get()._syncToFirestore();
    },

    setLoading: (loading) => set({ isLoading: loading }),

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
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const thresholdDate = thirtyDaysAgo.toISOString().split('T')[0];
            activities = activities.filter(a => {
                if (a.type !== 'ONCE') return true;
                return (a.specificDate || '') >= thresholdDate;
            });

            set({
                activities,
                nextTwoHoursIds: [...new Set(data.nextTwoHoursIds || [])],
                isLoading: false,
                _initialized: true
            });
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({ activities: [], nextTwoHoursIds: [], isLoading: true, _initialized: false });
    }
}));
