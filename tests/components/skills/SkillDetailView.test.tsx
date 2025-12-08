import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillDetailView } from '../../../components/skills/SkillDetailView';
import { Skill } from '../../../types';

// Mock modals to avoid complexity
vi.mock('../../../components/skills/ImportExportModal', () => ({
    ImportExportModal: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="import-export-modal">
            <button onClick={onClose}>Close Import/Export</button>
        </div>
    )
}));

vi.mock('../../../components/skills/AIRoadmapModal', () => ({
    AIRoadmapModal: ({ onClose, onGenerate }: { onClose: () => void; onGenerate: (items: string[]) => void }) => (
        <div data-testid="ai-roadmap-modal">
            <button onClick={onClose}>Close AI Modal</button>
            <button onClick={() => onGenerate(['Tarefa 1', 'Tarefa 2'])}>Generate</button>
        </div>
    )
}));

// Mock skill data
const createMockSkill = (overrides: Partial<Skill> = {}): Skill => ({
    id: 'test-skill-1',
    name: 'Python Avançado',
    description: 'Dominar Python para Data Science',
    level: 'Intermediário',
    currentMinutes: 1800, // 30 hours
    goalMinutes: 6000, // 100 hours
    resources: [
        { id: 'r1', title: 'Python Docs', url: 'https://docs.python.org', type: 'DOC' }
    ],
    roadmap: [
        { id: 'rm1', title: 'Fundamentos', isCompleted: false, type: 'SECTION' },
        { id: 'rm2', title: 'Aprender Pandas', isCompleted: true, type: 'TASK' },
        { id: 'rm3', title: 'Aprender NumPy', isCompleted: false, type: 'TASK' }
    ],
    logs: [
        { id: 'log1', date: '2025-01-01', minutes: 60 }
    ],
    colorTheme: 'purple',
    createdAt: Date.now() - 86400000, // Yesterday
    ...overrides
});

describe('SkillDetailView Component', () => {
    const mockOnBack = vi.fn();
    const mockOnUpdate = vi.fn();
    const mockOnDelete = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- HAPPY PATH TESTS ---

    it('displays skill statistics correctly', () => {
        const skill = createMockSkill();
        render(
            <SkillDetailView
                skill={skill}
                onBack={mockOnBack}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
            />
        );

        // Name
        expect(screen.getByText('Python Avançado')).toBeInTheDocument();
        // Level
        expect(screen.getByText('Intermediário')).toBeInTheDocument();
        // Hours (30h)
        expect(screen.getByText('30.0')).toBeInTheDocument();
        // Sessions count
        expect(screen.getByText('1')).toBeInTheDocument(); // 1 log
    });

    it('allows editing skill name', async () => {
        const skill = createMockSkill();
        render(
            <SkillDetailView
                skill={skill}
                onBack={mockOnBack}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
            />
        );

        // Click edit button
        fireEvent.click(screen.getByTitle('Renomear módulo'));

        // Should show input
        const input = screen.getByPlaceholderText('Nome do módulo...');
        expect(input).toBeInTheDocument();

        // Change name
        fireEvent.change(input, { target: { value: 'Python Master' } });
        fireEvent.blur(input);

        expect(mockOnUpdate).toHaveBeenCalledWith({ name: 'Python Master' });
    });

    it('adds resource to vault', async () => {
        const skill = createMockSkill({ resources: [] });
        render(
            <SkillDetailView
                skill={skill}
                onBack={mockOnBack}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
            />
        );

        // Add URL
        const urlInput = screen.getByPlaceholderText('Cole um link aqui...');
        fireEvent.change(urlInput, { target: { value: 'https://youtube.com/watch' } });

        // Click add button
        const addButton = urlInput.nextElementSibling;
        if (addButton) fireEvent.click(addButton);

        expect(mockOnUpdate).toHaveBeenCalledWith({
            resources: expect.arrayContaining([
                expect.objectContaining({
                    url: 'https://youtube.com/watch',
                    type: 'VIDEO'
                })
            ])
        });
    });

    it('removes resource from vault', () => {
        const skill = createMockSkill();
        render(
            <SkillDetailView
                skill={skill}
                onBack={mockOnBack}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
            />
        );

        // Find the resource
        expect(screen.getByText('Python Docs')).toBeInTheDocument();

        // Find and click remove button (it's in a group-hover element)
        const resourceRow = screen.getByText('Python Docs').closest('div[class*="group"]');
        const deleteButton = resourceRow?.querySelector('button');
        if (deleteButton) fireEvent.click(deleteButton);

        expect(mockOnUpdate).toHaveBeenCalledWith({
            resources: []
        });
    });

    it('adds task to roadmap', async () => {
        const skill = createMockSkill();
        render(
            <SkillDetailView
                skill={skill}
                onBack={mockOnBack}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
            />
        );

        // Click add task button inline
        fireEvent.click(screen.getByText('Adicionar Tarefa'));

        // Fill task
        const taskInput = screen.getByPlaceholderText('Descreva a nova tarefa...');
        fireEvent.change(taskInput, { target: { value: 'Nova tarefa de teste' } });
        fireEvent.keyDown(taskInput, { key: 'Enter' });

        expect(mockOnUpdate).toHaveBeenCalledWith({
            roadmap: expect.arrayContaining([
                expect.objectContaining({
                    title: 'Nova tarefa de teste',
                    type: 'TASK',
                    isCompleted: false
                })
            ])
        });
    });

    it('toggles task completion', () => {
        const skill = createMockSkill();
        render(
            <SkillDetailView
                skill={skill}
                onBack={mockOnBack}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
            />
        );

        // Find uncompleted task text and its parent container
        const numpyTaskText = screen.getByText('Aprender NumPy');
        const taskContainer = numpyTaskText.closest('div[class*="rounded-xl"]');

        // The toggle button is the first button inside the task container
        const buttons = taskContainer?.querySelectorAll('button');
        const toggleButton = buttons?.[0]; // First button is the circle/check toggle

        if (toggleButton) fireEvent.click(toggleButton);

        expect(mockOnUpdate).toHaveBeenCalledWith({
            roadmap: expect.arrayContaining([
                expect.objectContaining({
                    id: 'rm3',
                    isCompleted: true
                })
            ])
        });
    });


    it('adds divider/section to roadmap', async () => {
        const skill = createMockSkill();
        render(
            <SkillDetailView
                skill={skill}
                onBack={mockOnBack}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
            />
        );

        // Click Divisória button
        fireEvent.click(screen.getByText('Divisória'));

        // Fill section name
        const sectionInput = screen.getByPlaceholderText('Nome da Seção...');
        fireEvent.change(sectionInput, { target: { value: 'Avançado' } });
        fireEvent.keyDown(sectionInput, { key: 'Enter' });

        expect(mockOnUpdate).toHaveBeenCalledWith({
            roadmap: expect.arrayContaining([
                expect.objectContaining({
                    title: 'Avançado',
                    type: 'SECTION'
                })
            ])
        });
    });

    it('calls onBack when back button is clicked', () => {
        const skill = createMockSkill();
        render(
            <SkillDetailView
                skill={skill}
                onBack={mockOnBack}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
            />
        );

        fireEvent.click(screen.getByTitle('Voltar'));
        expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('calls onDelete when delete button is clicked', () => {
        const skill = createMockSkill();
        render(
            <SkillDetailView
                skill={skill}
                onBack={mockOnBack}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
            />
        );

        fireEvent.click(screen.getByTitle('Excluir módulo'));
        expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    // --- EDGE CASE TESTS ---

    it('cancels name editing with Escape key', () => {
        const skill = createMockSkill();
        render(
            <SkillDetailView
                skill={skill}
                onBack={mockOnBack}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
            />
        );

        fireEvent.click(screen.getByTitle('Renomear módulo'));
        const input = screen.getByPlaceholderText('Nome do módulo...');

        fireEvent.change(input, { target: { value: 'Changed Name' } });
        fireEvent.keyDown(input, { key: 'Escape' });

        // Should NOT have called update
        expect(mockOnUpdate).not.toHaveBeenCalled();
        // Should show original name
        expect(screen.getByText('Python Avançado')).toBeInTheDocument();
    });

    it('saves name with Enter key', () => {
        const skill = createMockSkill();
        render(
            <SkillDetailView
                skill={skill}
                onBack={mockOnBack}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
            />
        );

        fireEvent.click(screen.getByTitle('Renomear módulo'));
        const input = screen.getByPlaceholderText('Nome do módulo...');

        fireEvent.change(input, { target: { value: 'New Name' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(mockOnUpdate).toHaveBeenCalledWith({ name: 'New Name' });
    });

    it('shows empty state for empty roadmap', () => {
        const skill = createMockSkill({ roadmap: [] });
        render(
            <SkillDetailView
                skill={skill}
                onBack={mockOnBack}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
            />
        );

        expect(screen.getByText('Gere um plano de estudos com IA para começar.')).toBeInTheDocument();
    });

    it('shows empty state for empty resources', () => {
        const skill = createMockSkill({ resources: [] });
        render(
            <SkillDetailView
                skill={skill}
                onBack={mockOnBack}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
            />
        );

        expect(screen.getByText('Nenhum link salvo.')).toBeInTheDocument();
    });

    // --- ERROR CASE TESTS ---

    it('does not add task with empty title', () => {
        const skill = createMockSkill();
        render(
            <SkillDetailView
                skill={skill}
                onBack={mockOnBack}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
            />
        );

        fireEvent.click(screen.getByText('Adicionar Tarefa'));

        const taskInput = screen.getByPlaceholderText('Descreva a nova tarefa...');
        fireEvent.change(taskInput, { target: { value: '   ' } }); // whitespace only
        fireEvent.keyDown(taskInput, { key: 'Enter' });

        expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it('does not add divider with empty title', () => {
        const skill = createMockSkill();
        render(
            <SkillDetailView
                skill={skill}
                onBack={mockOnBack}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
            />
        );

        fireEvent.click(screen.getByText('Divisória'));

        const sectionInput = screen.getByPlaceholderText('Nome da Seção...');
        fireEvent.change(sectionInput, { target: { value: '' } });
        fireEvent.keyDown(sectionInput, { key: 'Enter' });

        expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it('displays roadmap progress correctly', () => {
        const skill = createMockSkill();
        render(
            <SkillDetailView
                skill={skill}
                onBack={mockOnBack}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
            />
        );

        // 1 of 2 tasks completed (sections don't count) = 50%
        expect(screen.getByText('1 / 2')).toBeInTheDocument();
        expect(screen.getByText('50% Completo')).toBeInTheDocument();
    });

    it('opens AI Roadmap modal', () => {
        const skill = createMockSkill();
        render(
            <SkillDetailView
                skill={skill}
                onBack={mockOnBack}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
            />
        );

        fireEvent.click(screen.getByText('Gerar com IA'));
        expect(screen.getByTestId('ai-roadmap-modal')).toBeInTheDocument();
    });

    it('opens Import/Export modal', () => {
        const skill = createMockSkill();
        render(
            <SkillDetailView
                skill={skill}
                onBack={mockOnBack}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
            />
        );

        fireEvent.click(screen.getByText('Importar / Exportar'));
        expect(screen.getByTestId('import-export-modal')).toBeInTheDocument();
    });
});
