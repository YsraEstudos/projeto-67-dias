import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

type RoadmapItem = {
    id: string;
    title: string;
    isCompleted: boolean;
    type?: 'TASK' | 'SECTION';
    subTasks?: Array<{
        id: string;
        title: string;
        isCompleted: boolean;
    }>;
};

const roadmapPath = path.resolve(
    process.cwd(),
    'Json 67 days/Projetos/cubo_magico_67_dias.json',
);

const readRoadmap = (): RoadmapItem[] => {
    const raw = fs.readFileSync(roadmapPath, 'utf8');
    return JSON.parse(raw) as RoadmapItem[];
};

describe('cubo_magico_67_dias roadmap audit', () => {
    it('keeps the expected 67-day structure', () => {
        const roadmap = readRoadmap();
        const sections = roadmap.filter((item) => item.type === 'SECTION');
        const days = roadmap.filter((item) => item.type !== 'SECTION');

        expect(roadmap).toHaveLength(77);
        expect(sections).toHaveLength(10);
        expect(days).toHaveLength(67);
        expect(days[0]?.id).toBe('day-1');
        expect(days.at(-1)?.id).toBe('day-67');
    });

    it('avoids the old generic study/practice/review pattern', () => {
        const roadmap = readRoadmap();
        const genericSubTasks = roadmap
            .flatMap((item) => item.subTasks ?? [])
            .filter((subTask) => /^(Estudar|Praticar|Revisar)\s+/i.test(subTask.title));

        expect(genericSubTasks).toHaveLength(0);
    });

    it('splits the heavy topics into lighter daily chunks', () => {
        const roadmap = readRoadmap();
        const byId = Object.fromEntries(roadmap.map((item) => [item.id, item]));

        const expectDailyTaskCount = (id: string, maxSubTasks: number) => {
            const item = byId[id];
            expect(item, `missing roadmap item ${id}`).toBeDefined();
            expect(item?.type).toBe('TASK');
            expect(item?.subTasks?.length ?? 0).toBeLessThanOrEqual(maxSubTasks);
        };

        ['day-25', 'day-26', 'day-27', 'day-28'].forEach((id) => expectDailyTaskCount(id, 2));
        ['day-29', 'day-30', 'day-31', 'day-32'].forEach((id) => expectDailyTaskCount(id, 2));
        ['day-36', 'day-37', 'day-38', 'day-39', 'day-40', 'day-41', 'day-42', 'day-43', 'day-44', 'day-45', 'day-46', 'day-47', 'day-48', 'day-49'].forEach((id) =>
            expectDailyTaskCount(id, 2),
        );

        expect(byId['day-25']?.title).toContain('F2L');
        expect(byId['day-26']?.title).toContain('F2L');
        expect(byId['day-27']?.title).toContain('F2L');
        expect(byId['day-28']?.title).toContain('F2L');

        expect(byId['day-29']?.title).toContain('OLL');
        expect(byId['day-30']?.title).toContain('OLL');
        expect(byId['day-31']?.title).toContain('PLL');
        expect(byId['day-32']?.title).toContain('PLL');

        expect(byId['day-36']?.title.toLowerCase()).toContain('blindfold');
        expect(byId['day-37']?.title.toLowerCase()).toContain('blindfold');
        expect(byId['day-38']?.title.toLowerCase()).toContain('blindfold');
        expect(byId['day-39']?.title.toLowerCase()).toContain('blindfold');
        expect(byId['day-40']?.title.toLowerCase()).toContain('blindfold');
        expect(byId['day-41']?.title.toLowerCase()).toContain('blindfold');
        expect(byId['day-42']?.title.toLowerCase()).toContain('blindfold');
    });

    it('uses some 2-subtask days so the plan stays realistic for 15 minutes', () => {
        const roadmap = readRoadmap();
        const tasks = roadmap.filter((item) => item.type === 'TASK');
        const twoSubtaskDays = tasks.filter((item) => (item.subTasks?.length ?? 0) === 2);

        expect(twoSubtaskDays.length).toBeGreaterThanOrEqual(20);
    });
});
