/**
 * Rest Store - Rest activities with Firebase persistence
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RestActivity, RestActivityLink } from '../types';
import { createFirebaseStorage } from './persistMiddleware';

interface RestState {
    activities: RestActivity[];
    nextTwoHoursIds: string[];
    isLoading: boolean;

    // Activity Actions
    setActivities: (activities: RestActivity[]) => void;
    addActivity: (activity: RestActivity) => void;
    addActivities: (activities: RestActivity[]) => void;

    updateActivity: (id: string, updates: Partial<RestActivity>) => void;
    deleteActivity: (id: string) => void;
    toggleActivityComplete: (id: string) => void;
    reorderActivities: (activities: RestActivity[]) => void;

    // Link Actions
    addLink: (activityId: string, link: RestActivityLink) => void;
    updateLink: (activityId: string, linkId: string, updates: Partial<RestActivityLink>) => void;
    deleteLink: (activityId: string, linkId: string) => void;

    // Next 2 hours
    setNextTwoHoursIds: (ids: string[]) => void;
    addToNextTwoHours: (id: string) => void;
    removeFromNextTwoHours: (id: string) => void;

    setLoading: (loading: boolean) => void;
}

export const useRestStore = create<RestState>()(
    persist(
        (set) => ({
            activities: [],
            nextTwoHoursIds: [],
            isLoading: true,

            // Activity Actions
            setActivities: (activities) => set({ activities }),

            addActivity: (activity) => set((state) => ({
                activities: [...state.activities, activity]
            })),

            addActivities: (activities) => set((state) => ({
                activities: [...state.activities, ...activities]
            })),


            updateActivity: (id, updates) => set((state) => ({
                activities: state.activities.map(a => a.id === id ? { ...a, ...updates } : a)
            })),

            deleteActivity: (id) => set((state) => ({
                activities: state.activities.filter(a => a.id !== id),
                nextTwoHoursIds: state.nextTwoHoursIds.filter(i => i !== id)
            })),

            toggleActivityComplete: (id) => set((state) => ({
                activities: state.activities.map(a =>
                    a.id === id ? { ...a, isCompleted: !a.isCompleted } : a
                )
            })),

            reorderActivities: (activities) => set({ activities }),

            // Link Actions
            addLink: (activityId, link) => set((state) => ({
                activities: state.activities.map(a => {
                    if (a.id !== activityId) return a;
                    return { ...a, links: [...(a.links || []), link] };
                })
            })),

            updateLink: (activityId, linkId, updates) => set((state) => ({
                activities: state.activities.map(a => {
                    if (a.id !== activityId) return a;
                    return {
                        ...a,
                        links: (a.links || []).map(l => l.id === linkId ? { ...l, ...updates } : l)
                    };
                })
            })),

            deleteLink: (activityId, linkId) => set((state) => ({
                activities: state.activities.map(a => {
                    if (a.id !== activityId) return a;
                    return {
                        ...a,
                        links: (a.links || []).filter(l => l.id !== linkId)
                    };
                })
            })),

            // Next 2 hours
            setNextTwoHoursIds: (ids) => set({ nextTwoHoursIds: ids }),

            addToNextTwoHours: (id) => set((state) => ({
                nextTwoHoursIds: state.nextTwoHoursIds.includes(id)
                    ? state.nextTwoHoursIds
                    : [...state.nextTwoHoursIds, id]
            })),

            removeFromNextTwoHours: (id) => set((state) => ({
                nextTwoHoursIds: state.nextTwoHoursIds.filter(i => i !== id)
            })),

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'p67_rest_store',
            storage: createFirebaseStorage('p67_rest_store'),
            partialize: (state) => ({
                activities: state.activities,
                nextTwoHoursIds: state.nextTwoHoursIds
            }),
            onRehydrateStorage: () => (state) => {
                // Clean up any duplicate activities (same id)
                if (state?.activities?.length) {
                    const seen = new Set<string>();
                    const uniqueActivities = state.activities.filter(a => {
                        if (seen.has(a.id)) return false;
                        seen.add(a.id);
                        return true;
                    });
                    if (uniqueActivities.length !== state.activities.length) {
                        state.setActivities(uniqueActivities);
                    }
                }
                // Clean up duplicate IDs in nextTwoHoursIds
                if (state?.nextTwoHoursIds?.length) {
                    const uniqueIds = [...new Set(state.nextTwoHoursIds)];
                    if (uniqueIds.length !== state.nextTwoHoursIds.length) {
                        state.setNextTwoHoursIds(uniqueIds);
                    }
                }

                // Archiving: Remove ONCE activities older than 30 days
                if (state?.activities?.length) {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    const thresholdDate = thirtyDaysAgo.toISOString().split('T')[0];

                    const keptActivities = state.activities.filter(a => {
                        if (a.type !== 'ONCE') return true;
                        return (a.specificDate || '') >= thresholdDate;
                    });

                    if (keptActivities.length !== state.activities.length) {
                        state.setActivities(keptActivities);
                    }
                }

                state?.setLoading(false);
            },

        }
    )
);
