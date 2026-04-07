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

    it('keeps the heavy-topic range focused on the current BLD progression', () => {
        const roadmap = readRoadmap();
        const byId = Object.fromEntries(roadmap.map((item) => [item.id, item]));

        const expectTitleContains = (id: string, expectedText: string) => {
            const title = byId[id]?.title.toLowerCase();
            expect(title, `missing roadmap item ${id}`).toBeDefined();
            expect(title).toContain(expectedText.toLowerCase());
        };

        ['day-25', 'day-26', 'day-27', 'day-28'].forEach((id) => expectTitleContains(id, 'cantos'));
        ['day-29', 'day-30', 'day-31', 'day-32'].forEach((id) => {
            expect(byId[id], `missing roadmap item ${id}`).toBeDefined();
            expect(byId[id]?.type).toBe('TASK');
        });

        expectTitleContains('day-31', 'arestas');
        expectTitleContains('day-32', 'cantos');

        ['day-36', 'day-43', 'day-50', 'day-56', 'day-62', 'day-66'].forEach((id) =>
            expectTitleContains(id, 'bld'),
        );
    });

    it('keeps all tasks atomic without nested subtasks', () => {
        const roadmap = readRoadmap();
        const tasks = roadmap.filter((item) => item.type === 'TASK');
        const tasksWithSubtasks = tasks.filter((item) => (item.subTasks?.length ?? 0) > 0);

        expect(tasksWithSubtasks).toHaveLength(0);
    });
});
