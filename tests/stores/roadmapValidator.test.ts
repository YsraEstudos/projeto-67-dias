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
    it('accepts roadmaps up to 1000 items', () => {
        const roadmap = buildItems(1000);

        const result = normalizeRoadmap(roadmap);

        expect(result).not.toBeNull();
        expect(result).toHaveLength(1000);
    });

    it('rejects roadmaps over 1000 items', () => {
        const roadmap = buildItems(1001);

        const result = normalizeRoadmap(roadmap);

        expect(result).toBeNull();
    });
});