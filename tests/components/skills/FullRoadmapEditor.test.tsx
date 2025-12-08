import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FullRoadmapEditor } from '../../../components/skills/FullRoadmapEditor';
import { SkillRoadmapItem } from '../../../types';

// Mock window.print
const printMock = vi.fn();
Object.defineProperty(window, 'print', { value: printMock, writable: true });

// Mock confirm
const confirmMock = vi.fn(() => true);
Object.defineProperty(window, 'confirm', { value: confirmMock, writable: true });

// Sample roadmap data
const createMockRoadmap = (): SkillRoadmapItem[] => [
    { id: 'section-1', title: 'FUNDAMENTOS', isCompleted: false, type: 'SECTION' },
    { id: 'task-1', title: 'Aprender conceitos básicos', isCompleted: false, type: 'TASK' },
    {
        id: 'task-2', title: 'Praticar exercícios', isCompleted: true, type: 'TASK', subTasks: [
            { id: 'sub-1', title: 'Fazer exercício 1', isCompleted: false, type: 'TASK' },
            { id: 'sub-2', title: 'Fazer exercício 2', isCompleted: false, type: 'TASK' }
        ]
    },
];

describe('FullRoadmapEditor Component', () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- HAPPY PATH TESTS ---

    it('renders correctly with existing roadmap', () => {
        render(
            <FullRoadmapEditor
                skillName="Python Avançado"
                roadmap={createMockRoadmap()}
                theme="emerald"
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        expect(screen.getByText('Editor de Roadmap')).toBeInTheDocument();
        expect(screen.getByText('Python Avançado')).toBeInTheDocument();
        expect(screen.getByDisplayValue('FUNDAMENTOS')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Aprender conceitos básicos')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Praticar exercícios')).toBeInTheDocument();
    });

    it('calls onClose when back button is clicked', () => {
        render(
            <FullRoadmapEditor
                skillName="Test Skill"
                roadmap={createMockRoadmap()}
                theme="emerald"
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        // Back button is the first button in header
        const backButton = screen.getAllByRole('button')[0];
        fireEvent.click(backButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onSave with current items when save button is clicked', () => {
        render(
            <FullRoadmapEditor
                skillName="Test Skill"
                roadmap={createMockRoadmap()}
                theme="emerald"
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        fireEvent.click(screen.getByText('Salvar Alterações'));

        expect(mockOnSave).toHaveBeenCalledTimes(1);
        expect(mockOnSave).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ id: 'section-1', title: 'FUNDAMENTOS' }),
            expect.objectContaining({ id: 'task-1' }),
            expect.objectContaining({ id: 'task-2' }),
        ]));
    });

    it('calls window.print when export PDF is clicked', () => {
        render(
            <FullRoadmapEditor
                skillName="Test Skill"
                roadmap={createMockRoadmap()}
                theme="emerald"
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        fireEvent.click(screen.getByText('Exportar PDF'));

        expect(printMock).toHaveBeenCalledTimes(1);
    });

    it('adds new task when Nova Tarefa button is clicked', async () => {
        render(
            <FullRoadmapEditor
                skillName="Test Skill"
                roadmap={createMockRoadmap()}
                theme="emerald"
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        fireEvent.click(screen.getByText('Nova Tarefa'));

        // Should add a new task with default title
        await waitFor(() => {
            expect(screen.getByDisplayValue('Nova Tarefa')).toBeInTheDocument();
        });
    });

    it('adds new section when Nova Seção button is clicked', async () => {
        render(
            <FullRoadmapEditor
                skillName="Test Skill"
                roadmap={createMockRoadmap()}
                theme="emerald"
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        fireEvent.click(screen.getByText('Nova Seção'));

        await waitFor(() => {
            expect(screen.getByDisplayValue('NOVA SEÇÃO')).toBeInTheDocument();
        });
    });

    it('toggles task completion', async () => {
        render(
            <FullRoadmapEditor
                skillName="Test Skill"
                roadmap={createMockRoadmap()}
                theme="emerald"
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        // Find the input for the uncompleted task and its parent
        const taskInput = screen.getByDisplayValue('Aprender conceitos básicos');
        const taskRow = taskInput.closest('div[class*="flex items-center gap-3 p-3"]');

        // Toggle button is inside this row
        const toggleButton = taskRow?.querySelector('button');
        if (toggleButton) {
            fireEvent.click(toggleButton);
        }

        // Save and verify the update
        fireEvent.click(screen.getByText('Salvar Alterações'));

        expect(mockOnSave).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                id: 'task-1',
                isCompleted: true
            })
        ]));
    });

    it('edits item title', () => {
        render(
            <FullRoadmapEditor
                skillName="Test Skill"
                roadmap={createMockRoadmap()}
                theme="emerald"
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        const taskInput = screen.getByDisplayValue('Aprender conceitos básicos');
        fireEvent.change(taskInput, { target: { value: 'Novo título da tarefa' } });

        expect(screen.getByDisplayValue('Novo título da tarefa')).toBeInTheDocument();

        // Save and verify
        fireEvent.click(screen.getByText('Salvar Alterações'));

        expect(mockOnSave).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                id: 'task-1',
                title: 'Novo título da tarefa'
            })
        ]));
    });

    it('deletes item after confirmation', () => {
        confirmMock.mockReturnValue(true);

        render(
            <FullRoadmapEditor
                skillName="Test Skill"
                roadmap={createMockRoadmap()}
                theme="emerald"
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        // Find and click delete button for a task
        const taskInput = screen.getByDisplayValue('Aprender conceitos básicos');
        const taskContainer = taskInput.closest('.group');
        const deleteButton = taskContainer?.querySelector('button[class*="hover:text-red"]');

        if (deleteButton) {
            fireEvent.click(deleteButton);
        }

        // Save and verify item was removed
        fireEvent.click(screen.getByText('Salvar Alterações'));

        expect(mockOnSave).toHaveBeenCalledWith(
            expect.not.arrayContaining([
                expect.objectContaining({ id: 'task-1' })
            ])
        );
    });

    it('does not delete item if confirmation is cancelled', () => {
        confirmMock.mockReturnValue(false);

        render(
            <FullRoadmapEditor
                skillName="Test Skill"
                roadmap={createMockRoadmap()}
                theme="emerald"
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        const taskInput = screen.getByDisplayValue('Aprender conceitos básicos');
        const taskContainer = taskInput.closest('.group');
        const deleteButton = taskContainer?.querySelector('button[class*="hover:text-red"]');

        if (deleteButton) {
            fireEvent.click(deleteButton);
        }

        // Item should still exist
        expect(screen.getByDisplayValue('Aprender conceitos básicos')).toBeInTheDocument();
    });

    // --- EDGE CASE TESTS ---

    it('shows empty state with add button when roadmap is empty', () => {
        render(
            <FullRoadmapEditor
                skillName="Test Skill"
                roadmap={[]}
                theme="emerald"
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        expect(screen.getByText('Nenhum item no roadmap.')).toBeInTheDocument();
        expect(screen.getByText('Adicionar Primeira Seção')).toBeInTheDocument();
    });

    it('displays subtasks correctly', () => {
        render(
            <FullRoadmapEditor
                skillName="Test Skill"
                roadmap={createMockRoadmap()}
                theme="emerald"
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        // Subtasks should be visible
        expect(screen.getByDisplayValue('Fazer exercício 1')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Fazer exercício 2')).toBeInTheDocument();
    });

    it('applies different theme variants correctly', () => {
        const { rerender } = render(
            <FullRoadmapEditor
                skillName="Test Skill"
                roadmap={createMockRoadmap()}
                theme="purple"
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        // Component should render without errors with purple theme
        expect(screen.getByText('Editor de Roadmap')).toBeInTheDocument();

        // Rerender with different theme
        rerender(
            <FullRoadmapEditor
                skillName="Test Skill"
                roadmap={createMockRoadmap()}
                theme="rose"
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        expect(screen.getByText('Editor de Roadmap')).toBeInTheDocument();
    });

    it('shows print header with skill name', () => {
        render(
            <FullRoadmapEditor
                skillName="Python Mastery"
                roadmap={createMockRoadmap()}
                theme="emerald"
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        // Print header is hidden but should be in DOM
        expect(screen.getByText('Python Mastery - Plano de Estudos')).toBeInTheDocument();
    });

    it('renders sections with different styling than tasks', () => {
        render(
            <FullRoadmapEditor
                skillName="Test Skill"
                roadmap={createMockRoadmap()}
                theme="emerald"
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        // Section input should have uppercase class/styling
        const sectionInput = screen.getByDisplayValue('FUNDAMENTOS');
        expect(sectionInput).toHaveClass('uppercase');
    });
});
