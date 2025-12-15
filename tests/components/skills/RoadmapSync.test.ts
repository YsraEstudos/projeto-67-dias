
import { describe, it, expect } from 'vitest';
import { syncRoadmapState } from '../../../components/skills/roadmapSync';
import { SkillRoadmapItem, VisualRoadmap } from '../../../types';

describe('syncRoadmapState', () => {

    // Initial Data Helper
    const initialTasks: SkillRoadmapItem[] = [
        { id: '1', title: 'Task 1', isCompleted: false, type: 'TASK' },
        { id: '2', title: 'Task 2', isCompleted: true, type: 'TASK' }
    ];

    const initialVisual: VisualRoadmap = {
        nodes: [
            { id: '1', title: 'Task 1', type: 'main', x: 0, y: 0, isCompleted: false },
            { id: '2', title: 'Task 2', type: 'main', x: 100, y: 0, isCompleted: true }
        ],
        connections: []
    };

    describe('Source: Tasks', () => {
        it('adds new node when task is added', () => {
            const newTasks = [
                ...initialTasks,
                { id: '3', title: 'Task 3', isCompleted: false, type: 'TASK' as const }
            ];

            const result = syncRoadmapState(newTasks, initialVisual, 'tasks');

            expect(result.visualRoadmap.nodes).toHaveLength(3);
            expect(result.visualRoadmap.nodes.find(n => n.id === '3')).toBeDefined();
            expect(result.visualRoadmap.nodes.find(n => n.id === '3')?.title).toBe('Task 3');
        });

        it('removes node when task is deleted', () => {
            const remainingTasks = initialTasks.filter(t => t.id !== '1');

            const result = syncRoadmapState(remainingTasks, initialVisual, 'tasks');

            expect(result.visualRoadmap.nodes).toHaveLength(1);
            expect(result.visualRoadmap.nodes.find(n => n.id === '1')).toBeUndefined();
        });

        it('updates node when task title changes', () => {
            const updatedTasks = initialTasks.map(t =>
                t.id === '1' ? { ...t, title: 'Updated Task 1' } : t
            );

            const result = syncRoadmapState(updatedTasks, initialVisual, 'tasks');

            const node = result.visualRoadmap.nodes.find(n => n.id === '1');
            expect(node?.title).toBe('Updated Task 1');
        });
    });

    describe('Source: Visual', () => {
        it('adds new task when node is added', () => {
            const newNodes = [
                ...initialVisual.nodes,
                { id: '3', title: 'Node 3', type: 'main' as const, x: 200, y: 0, isCompleted: false }
            ];
            const updatedVisual = { ...initialVisual, nodes: newNodes }; // Fix: use updatedVisual

            const result = syncRoadmapState(initialTasks, updatedVisual, 'visual');

            expect(result.roadmap).toHaveLength(3);
            expect(result.roadmap.find(t => t.id === '3')).toBeDefined();
            expect(result.roadmap.find(t => t.id === '3')?.title).toBe('Node 3');
        });

        it('removes task when node is deleted', () => {
            const remainingNodes = initialVisual.nodes.filter(n => n.id !== '1');
            const updatedVisual = { ...initialVisual, nodes: remainingNodes };

            const result = syncRoadmapState(initialTasks, updatedVisual, 'visual');

            expect(result.roadmap).toHaveLength(1);
            expect(result.roadmap.find(t => t.id === '1')).toBeUndefined();
        });

        it('updates task when node title changes', () => {
            const updatedNodes = initialVisual.nodes.map(n =>
                n.id === '1' ? { ...n, title: 'Updated Node 1' } : n
            );
            const updatedVisual = { ...initialVisual, nodes: updatedNodes };

            const result = syncRoadmapState(initialTasks, updatedVisual, 'visual');

            const task = result.roadmap.find(t => t.id === '1');
            expect(task?.title).toBe('Updated Node 1');
        });
    });
});
