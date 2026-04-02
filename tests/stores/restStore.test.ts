import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { useRestStore } from '../../stores/restStore';

describe('restStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useRestStore.getState()._reset();
        useRestStore.getState()._hydrateFromFirestore(null);
    });

    it('migrates legacy totalSets data into explicit series', () => {
        useRestStore.getState()._hydrateFromFirestore({
            activities: [
                {
                    id: 'legacy-rest',
                    title: 'Prancha',
                    isCompleted: false,
                    totalSets: 3,
                    completedSets: 2,
                    type: 'DAILY',
                    order: 0,
                },
            ],
            nextTwoHoursIds: [],
        });

        const activity = useRestStore.getState().activities[0];

        expect(activity.series).toHaveLength(3);
        expect(activity.completedSets).toBe(2);
        expect(activity.isCompleted).toBe(false);
        expect(activity.series?.[0].label).toBe('Série 1');
    });

    it('toggles individual series and completes the activity only when all are done', () => {
        useRestStore.getState().addActivity({
            id: 'series-rest',
            title: 'Alongamento',
            isCompleted: false,
            type: 'DAILY',
            order: 0,
            totalSets: 2,
            completedSets: 0,
        });

        let activity = useRestStore.getState().activities[0];

        useRestStore.getState().toggleActivitySeries(activity.id, activity.series![0].id);
        activity = useRestStore.getState().activities[0];

        expect(activity.series?.[0].isCompleted).toBe(true);
        expect(activity.completedSets).toBe(1);
        expect(activity.isCompleted).toBe(false);
        expect(activity.series?.[0].completedAt).toBeTypeOf('number');

        useRestStore.getState().toggleActivitySeries(activity.id, activity.series![1].id);
        activity = useRestStore.getState().activities[0];

        expect(activity.completedSets).toBe(2);
        expect(activity.isCompleted).toBe(true);
    });

    it('undoing a completed series removes the activity completion state', () => {
        useRestStore.getState().addActivity({
            id: 'series-rest-undo',
            title: 'Respiração',
            isCompleted: true,
            type: 'DAILY',
            order: 0,
            totalSets: 2,
            completedSets: 2,
            series: [
                { id: 's1', label: 'Série 1', isCompleted: true, order: 0 },
                { id: 's2', label: 'Série 2', isCompleted: true, order: 1 },
            ],
        });

        const activityBefore = useRestStore.getState().activities[0];
        useRestStore.getState().toggleActivitySeries(activityBefore.id, activityBefore.series![0].id);

        const activityAfter = useRestStore.getState().activities[0];

        expect(activityAfter.series?.[0].isCompleted).toBe(false);
        expect(activityAfter.series?.[0].completedAt).toBeUndefined();
        expect(activityAfter.completedSets).toBe(1);
        expect(activityAfter.isCompleted).toBe(false);
    });
});
