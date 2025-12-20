import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoadmapSection } from '../../../components/skills/RoadmapSection';
import { SkillRoadmapItem } from '../../../types';

// Mock child modals
vi.mock('../../../components/skills/ImportExportModal', () => ({
    ImportExportModal: ({ onClose, onImport }: { onClose: () => void; onImport: (roadmap: SkillRoadmapItem[]) => void }) => (
        <div data-testid="import-export-modal">
            <button onClick={onClose}>Close Import</button>
            <button onClick={() => onImport([{ id: 'imported-1', title: 'Imported Task', isCompleted: false, type: 'TASK' }])}>
                Import Data
            </button>
        </div>
    )
}));



vi.mock('../../../components/skills/FullRoadmapEditor', () => ({
    FullRoadmapEditor: ({ onClose, onSave, roadmap }: {
        onClose: () => void;
        onSave: (roadmap: SkillRoadmapItem[]) => void;
        roadmap: SkillRoadmapItem[];
    }) => (
        <div data-testid="full-roadmap-editor">
            <button onClick={onClose}>Close Editor</button>
            <button onClick={() => onSave([...roadmap, { id: 'edited-1', title: 'Edited Task', isCompleted: false, type: 'TASK' }])}>
                Save Changes
            </button>
        </div>
    )
}));

vi.mock('../../../components/skills/VisualRoadmapEditor', () => ({
    default: ({ onClose, onSave }: any) => (
        <div data-testid="visual-roadmap-editor">
            <button onClick={onClose}>Close Visual Editor</button>
            <button onClick={() => onSave({ nodes: [], connections: [] })}>Save Visual Roadmap</button>
        </div>
    )
}));

vi.mock('../../../components/skills/VisualRoadmapView', () => ({
    VisualRoadmapView: ({ onOpenEditor }: any) => (
        <div data-testid="visual-roadmap-view">
            <button onClick={onOpenEditor}>Open Visual Editor</button>
        </div>
    )
}));

// Sample roadmap data - subTasks are now clickable SkillRoadmapItem objects
// with id and isCompleted for proper toggle functionality
const createMockRoadmap = (): SkillRoadmapItem[] => [
    { id: 'section-1', title: 'FUNDAMENTOS', isCompleted: false, type: 'SECTION' },
    { id: 'task-1', title: 'Aprender conceitos básicos', isCompleted: false, type: 'TASK' },
    { id: 'task-2', title: 'Praticar exercícios', isCompleted: true, type: 'TASK' },
    {
        id: 'task-3', title: 'Task com subs', isCompleted: false, type: 'TASK', subTasks: [
            { id: 'sub-1', title: 'Sub-tarefa A', isCompleted: false, type: 'TASK' },
            { id: 'sub-2', title: 'Sub-tarefa B', isCompleted: true, type: 'TASK' }
        ]
    }
];

describe('RoadmapSection Component', () => {
    const mockOnUpdate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- HAPPY PATH TESTS ---

    it('renders roadmap items correctly', () => {
        render(
            <RoadmapSection
                roadmap={createMockRoadmap()}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        expect(screen.getByText('Roadmap Inteligente')).toBeInTheDocument();
        expect(screen.getByText('FUNDAMENTOS')).toBeInTheDocument();
        expect(screen.getByText('Aprender conceitos básicos')).toBeInTheDocument();
        expect(screen.getByText('Praticar exercícios')).toBeInTheDocument();
    });

    it('displays subtasks when they exist', () => {
        render(
            <RoadmapSection
                roadmap={createMockRoadmap()}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        // Subtasks are rendered as strings
        expect(screen.getByText('Sub-tarefa A')).toBeInTheDocument();
        expect(screen.getByText('Sub-tarefa B')).toBeInTheDocument();
    });

    it('calculates progress correctly (including subtasks, excluding SECTIONs)', () => {
        render(
            <RoadmapSection
                roadmap={createMockRoadmap()}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        // 3 parent tasks + 2 subtasks = 5 total tasks
        // Completed: task-2 (true) + sub-2 (true) = 2 completed
        // Progress: 2/5 = 40%
        expect(screen.getByText('2 / 5')).toBeInTheDocument();
        expect(screen.getByText('40% Completo')).toBeInTheDocument();
    });

    it('toggles task completion', () => {
        render(
            <RoadmapSection
                roadmap={createMockRoadmap()}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        // Find uncompleted task
        const taskText = screen.getByText('Aprender conceitos básicos');
        const taskContainer = taskText.closest('div[class*="rounded-xl"]');
        const toggleButton = taskContainer?.querySelector('button');

        if (toggleButton) {
            fireEvent.click(toggleButton);
        }

        expect(mockOnUpdate).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ id: 'task-1', isCompleted: true })
        ]));
    });

    it('toggles subtask completion when clicked', () => {
        render(
            <RoadmapSection
                roadmap={createMockRoadmap()}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        // Find subtask and click it
        const subTaskText = screen.getByText('Sub-tarefa A');
        const subTaskContainer = subTaskText.closest('div[class*="cursor-pointer"]');

        if (subTaskContainer) {
            fireEvent.click(subTaskContainer);
        }

        // Subtask should be toggled
        expect(mockOnUpdate).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                id: 'task-3',
                subTasks: expect.arrayContaining([
                    expect.objectContaining({ id: 'sub-1', isCompleted: true })
                ])
            })
        ]));
    });

    it('auto-completes parent task when all subtasks are completed', () => {
        // Create roadmap where all subtasks will be complete after toggle
        const roadmapWithOneSubLeft: SkillRoadmapItem[] = [
            {
                id: 'task-1', title: 'Parent Task', isCompleted: false, type: 'TASK', subTasks: [
                    { id: 'sub-1', title: 'Sub 1', isCompleted: true, type: 'TASK' },
                    { id: 'sub-2', title: 'Sub 2', isCompleted: false, type: 'TASK' }
                ]
            }
        ];

        render(
            <RoadmapSection
                roadmap={roadmapWithOneSubLeft}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        // Click the incomplete subtask
        const subTaskText = screen.getByText('Sub 2');
        const subTaskContainer = subTaskText.closest('div[class*="cursor-pointer"]');

        if (subTaskContainer) {
            fireEvent.click(subTaskContainer);
        }

        // Parent should now be auto-completed
        expect(mockOnUpdate).toHaveBeenCalledWith([
            expect.objectContaining({
                id: 'task-1',
                isCompleted: true, // Auto-completed!
                subTasks: expect.arrayContaining([
                    expect.objectContaining({ id: 'sub-1', isCompleted: true }),
                    expect.objectContaining({ id: 'sub-2', isCompleted: true })
                ])
            })
        ]);
    });

    it('uncompletes parent task when a subtask is unchecked', () => {
        // Create roadmap where parent is complete and all subs are complete
        const roadmapAllComplete: SkillRoadmapItem[] = [
            {
                id: 'task-1', title: 'Parent Task', isCompleted: true, type: 'TASK', subTasks: [
                    { id: 'sub-1', title: 'Sub 1', isCompleted: true, type: 'TASK' },
                    { id: 'sub-2', title: 'Sub 2', isCompleted: true, type: 'TASK' }
                ]
            }
        ];

        render(
            <RoadmapSection
                roadmap={roadmapAllComplete}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        // Click to uncheck a subtask
        const subTaskText = screen.getByText('Sub 1');
        const subTaskContainer = subTaskText.closest('div[class*="cursor-pointer"]');

        if (subTaskContainer) {
            fireEvent.click(subTaskContainer);
        }

        // Parent should now be uncompleted
        expect(mockOnUpdate).toHaveBeenCalledWith([
            expect.objectContaining({
                id: 'task-1',
                isCompleted: false, // Auto-uncompleted!
                subTasks: expect.arrayContaining([
                    expect.objectContaining({ id: 'sub-1', isCompleted: false }),
                    expect.objectContaining({ id: 'sub-2', isCompleted: true })
                ])
            })
        ]);
    });

    it('adds manual task', async () => {
        render(
            <RoadmapSection
                roadmap={createMockRoadmap()}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        // Click "Tarefa" button
        fireEvent.click(screen.getByText('Tarefa'));

        // Fill input
        const input = await screen.findByPlaceholderText('Descreva a nova tarefa...');
        fireEvent.change(input, { target: { value: 'Nova tarefa manual' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(mockOnUpdate).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                title: 'Nova tarefa manual',
                type: 'TASK',
                isCompleted: false
            })
        ]));
    });

    it('adds divider/section', async () => {
        render(
            <RoadmapSection
                roadmap={createMockRoadmap()}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        // Click Divisória button
        fireEvent.click(screen.getByText('Divisória'));

        // Fill section name
        const input = await screen.findByPlaceholderText('Nome da Seção...');
        fireEvent.change(input, { target: { value: 'AVANÇADO' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(mockOnUpdate).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                title: 'AVANÇADO',
                type: 'SECTION'
            })
        ]));
    });

    // --- MODAL INTEGRATION TESTS ---


    it('opens FullRoadmapEditor modal', async () => {
        render(
            <RoadmapSection
                roadmap={createMockRoadmap()}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        fireEvent.click(screen.getByText('Editor'));

        await waitFor(() => {
            expect(screen.getByTestId('full-roadmap-editor')).toBeInTheDocument();
        });
    });

    it('saves changes from FullRoadmapEditor', async () => {
        render(
            <RoadmapSection
                roadmap={createMockRoadmap()}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        fireEvent.click(screen.getByText('Editor'));
        await waitFor(() => {
            fireEvent.click(screen.getByText('Save Changes'));
        });

        expect(mockOnUpdate).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ id: 'edited-1', title: 'Edited Task' })
        ]));
    });

    it('opens Import/Export modal', async () => {
        render(
            <RoadmapSection
                roadmap={createMockRoadmap()}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        fireEvent.click(screen.getByText('Importar / Exportar'));

        await waitFor(() => {
            expect(screen.getByTestId('import-export-modal')).toBeInTheDocument();
        });
    });

    it('imports roadmap from ImportExportModal', async () => {
        render(
            <RoadmapSection
                roadmap={[]}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        fireEvent.click(screen.getByText('Importar / Exportar'));
        await waitFor(() => {
            fireEvent.click(screen.getByText('Import Data'));
        });

        expect(mockOnUpdate).toHaveBeenCalledWith([
            expect.objectContaining({ id: 'imported-1', title: 'Imported Task' })
        ]);
    });

    // --- EDGE CASE TESTS ---

    it('shows empty state when roadmap is empty', () => {
        render(
            <RoadmapSection
                roadmap={[]}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        expect(screen.getByText('Adicione tarefas para montar seu plano de estudos.')).toBeInTheDocument();
    });

    it('shows 0% progress with empty roadmap', () => {
        render(
            <RoadmapSection
                roadmap={[]}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        expect(screen.getByText('0 / 0')).toBeInTheDocument();
        expect(screen.getByText('0% Completo')).toBeInTheDocument();
    });

    it('shows 100% when all tasks are completed', () => {
        const allCompleted: SkillRoadmapItem[] = [
            { id: 'section-1', title: 'DONE', isCompleted: false, type: 'SECTION' },
            { id: 'task-1', title: 'Task 1', isCompleted: true, type: 'TASK' },
            { id: 'task-2', title: 'Task 2', isCompleted: true, type: 'TASK' }
        ];

        render(
            <RoadmapSection
                roadmap={allCompleted}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        expect(screen.getByText('2 / 2')).toBeInTheDocument();
        expect(screen.getByText('100% Completo')).toBeInTheDocument();
    });

    it('does not add empty task title', () => {
        render(
            <RoadmapSection
                roadmap={createMockRoadmap()}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        fireEvent.click(screen.getByText('Tarefa'));

        const input = screen.getByPlaceholderText('Descreva a nova tarefa...');
        fireEvent.change(input, { target: { value: '   ' } }); // whitespace only
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it('does not add empty divider title', () => {
        render(
            <RoadmapSection
                roadmap={createMockRoadmap()}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        fireEvent.click(screen.getByText('Divisória'));

        const input = screen.getByPlaceholderText('Nome da Seção...');
        fireEvent.change(input, { target: { value: '' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it('renders completed task with line-through styling', () => {
        render(
            <RoadmapSection
                roadmap={createMockRoadmap()}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
            />
        );

        const completedTask = screen.getByText('Praticar exercícios');
        expect(completedTask).toHaveClass('line-through');
    });

    // --- MODE TOGGLE & VISUAL ROADMAP TESTS ---

    it('renders mode toggle buttons', () => {
        render(
            <RoadmapSection
                roadmap={createMockRoadmap()}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
                viewMode="tasks"
            />
        );

        expect(screen.getByText('Tarefas')).toBeInTheDocument();
        expect(screen.getByText('Roadmap')).toBeInTheDocument();
    });

    it('switches to visual mode', () => {
        const onViewModeChange = vi.fn();
        render(
            <RoadmapSection
                roadmap={createMockRoadmap()}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
                viewMode="tasks"
                onViewModeChange={onViewModeChange}
            />
        );

        fireEvent.click(screen.getByText('Roadmap'));
        expect(onViewModeChange).toHaveBeenCalledWith('visual');
    });

    it('renders visual roadmap view when in visual mode', () => {
        render(
            <RoadmapSection
                roadmap={createMockRoadmap()}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
                viewMode="visual"
            />
        );

        expect(screen.getByTestId('visual-roadmap-view')).toBeInTheDocument();
        // Should not show task list items
        expect(screen.queryByText('Aprender conceitos básicos')).not.toBeInTheDocument();
    });

    it('opens visual editor from toggle button', async () => {
        render(
            <RoadmapSection
                roadmap={createMockRoadmap()}
                skillName="Python"
                skillLevel="Intermediário"
                skillColorTheme="emerald"
                onUpdate={mockOnUpdate}
                viewMode="visual"
            />
        );

        fireEvent.click(screen.getByText('Abrir Editor Visual'));
        await waitFor(() => {
            expect(screen.getByTestId('visual-roadmap-editor')).toBeInTheDocument();
        });
    });
});
