import { describe, expect, it } from 'vitest';

import { normalizeRoadmap } from '../../stores/skills/roadmapValidator';

const buildItems = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
        id: `task-${index + 1}`,
        title: `Task ${index + 1}`,
        isCompleted: false,
        type: 'TASK' as const,
    }));

describe('roadmapValidator', () => {
    it('accepts roadmaps up to 2000 items', () => {
        const roadmap = buildItems(2000);

        const result = normalizeRoadmap(roadmap);

        expect(result).not.toBeNull();
        expect(result).toHaveLength(2000);
    });

    it('rejects roadmaps over 2000 items', () => {
        const roadmap = buildItems(2001);

        const result = normalizeRoadmap(roadmap);

        expect(result).toBeNull();
    });

    it('preserves completedAt for completed items and drops it for pending or invalid values', () => {
        const result = normalizeRoadmap([
            { id: 'a', title: 'A', isCompleted: true, completedAt: 1700000000000, type: 'TASK' },
            { id: 'b', title: 'B', isCompleted: false, completedAt: 1700000000000, type: 'TASK' },
            { id: 'c', title: 'C', isCompleted: true, completedAt: 'ontem', type: 'TASK' },
            {
                id: 's', title: 'S', isCompleted: false, type: 'SECTION',
                subTasks: [{ id: 'sub', title: 'Sub', isCompleted: true, completedAt: 1700000000001 }],
            },
        ]);

        expect(result?.[0].completedAt).toBe(1700000000000);
        expect(result?.[1].completedAt).toBeUndefined();
        expect(result?.[2].completedAt).toBeUndefined();
        expect(result?.[3].subTasks?.[0].completedAt).toBe(1700000000001);
    });
});

