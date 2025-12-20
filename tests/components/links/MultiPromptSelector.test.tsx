import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MultiPromptSelector from '../../../components/links/MultiPromptSelector';
import { Prompt, PromptCategory } from '../../../types';

describe('MultiPromptSelector', () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    const mockCategories: PromptCategory[] = [
        { id: 'code', name: 'Código', color: 'emerald', icon: 'code', order: 0 },
        { id: 'writing', name: 'Escrita', color: 'blue', icon: 'writing', order: 1 },
    ];

    const mockPrompts: Prompt[] = [
        { id: 'p1', title: 'Refatorar Código', content: 'Analise o código...', category: 'code', images: [], copyCount: 0, isFavorite: false, order: 0, createdAt: Date.now(), updatedAt: Date.now() },
        { id: 'p2', title: 'Debug Helper', content: 'Ajude a debugar...', category: 'code', images: [], copyCount: 0, isFavorite: false, order: 1, createdAt: Date.now(), updatedAt: Date.now() },
        { id: 'p3', title: 'Revisar Texto', content: 'Revise o texto...', category: 'writing', images: [], copyCount: 0, isFavorite: false, order: 0, createdAt: Date.now(), updatedAt: Date.now() },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders modal with title', () => {
            render(
                <MultiPromptSelector
                    prompts={mockPrompts}
                    categories={mockCategories}
                    selectedIds={[]}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            expect(screen.getByText('Vincular Prompts')).toBeInTheDocument();
        });

        it('renders categories with prompts grouped', () => {
            render(
                <MultiPromptSelector
                    prompts={mockPrompts}
                    categories={mockCategories}
                    selectedIds={[]}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            expect(screen.getByText('Código')).toBeInTheDocument();
            expect(screen.getByText('Escrita')).toBeInTheDocument();
            expect(screen.getByText('Refatorar Código')).toBeInTheDocument();
            expect(screen.getByText('Revisar Texto')).toBeInTheDocument();
        });

        it('shows selection count in header', () => {
            render(
                <MultiPromptSelector
                    prompts={mockPrompts}
                    categories={mockCategories}
                    selectedIds={['p1', 'p2']}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            expect(screen.getByText('2 selecionados')).toBeInTheDocument();
        });
    });

    describe('Selection behavior', () => {
        it('toggles prompt selection on click', () => {
            render(
                <MultiPromptSelector
                    prompts={mockPrompts}
                    categories={mockCategories}
                    selectedIds={[]}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            // Click to select
            fireEvent.click(screen.getByText('Refatorar Código'));

            // Click confirm
            fireEvent.click(screen.getByText(/Confirmar/));

            expect(mockOnSave).toHaveBeenCalledWith(['p1']);
        });

        it('deselects prompt if already selected', () => {
            render(
                <MultiPromptSelector
                    prompts={mockPrompts}
                    categories={mockCategories}
                    selectedIds={['p1']}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            // Click to deselect
            fireEvent.click(screen.getByText('Refatorar Código'));

            // Click confirm
            fireEvent.click(screen.getByText(/Confirmar/));

            expect(mockOnSave).toHaveBeenCalledWith([]);
        });

        it('allows selecting multiple prompts', () => {
            render(
                <MultiPromptSelector
                    prompts={mockPrompts}
                    categories={mockCategories}
                    selectedIds={[]}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            fireEvent.click(screen.getByText('Refatorar Código'));
            fireEvent.click(screen.getByText('Debug Helper'));
            fireEvent.click(screen.getByText('Revisar Texto'));

            fireEvent.click(screen.getByText(/Confirmar/));

            expect(mockOnSave).toHaveBeenCalledWith(['p1', 'p2', 'p3']);
        });
    });

    describe('Search functionality', () => {
        it('filters prompts by search query', () => {
            render(
                <MultiPromptSelector
                    prompts={mockPrompts}
                    categories={mockCategories}
                    selectedIds={[]}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            const searchInput = screen.getByPlaceholderText('Buscar prompts...');
            fireEvent.change(searchInput, { target: { value: 'Refatorar' } });

            expect(screen.getByText('Refatorar Código')).toBeInTheDocument();
            expect(screen.queryByText('Debug Helper')).not.toBeInTheDocument();
            expect(screen.queryByText('Revisar Texto')).not.toBeInTheDocument();
        });
    });

    describe('Category interactions', () => {
        it('collapses/expands category on click', () => {
            render(
                <MultiPromptSelector
                    prompts={mockPrompts}
                    categories={mockCategories}
                    selectedIds={[]}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            // Prompts should be visible initially (expanded)
            expect(screen.getByText('Refatorar Código')).toBeInTheDocument();

            // Click category header to collapse
            fireEvent.click(screen.getByText('Código'));

            // Prompts should be hidden
            expect(screen.queryByText('Refatorar Código')).not.toBeInTheDocument();
        });
    });

    describe('Modal actions', () => {
        it('calls onClose when cancel is clicked', () => {
            render(
                <MultiPromptSelector
                    prompts={mockPrompts}
                    categories={mockCategories}
                    selectedIds={[]}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            fireEvent.click(screen.getByText('Cancelar'));
            expect(mockOnClose).toHaveBeenCalled();
        });

        it('calls onClose when X button is clicked', () => {
            render(
                <MultiPromptSelector
                    prompts={mockPrompts}
                    categories={mockCategories}
                    selectedIds={[]}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            fireEvent.click(screen.getByLabelText('Fechar'));
            expect(mockOnClose).toHaveBeenCalled();
        });

        it('shows correct count in confirm button', () => {
            render(
                <MultiPromptSelector
                    prompts={mockPrompts}
                    categories={mockCategories}
                    selectedIds={['p1', 'p2', 'p3']}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            expect(screen.getByText(/Confirmar \(3\)/)).toBeInTheDocument();
        });
    });

    describe('Empty state', () => {
        it('shows empty message when no prompts match search', () => {
            render(
                <MultiPromptSelector
                    prompts={mockPrompts}
                    categories={mockCategories}
                    selectedIds={[]}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            const searchInput = screen.getByPlaceholderText('Buscar prompts...');
            fireEvent.change(searchInput, { target: { value: 'xyz123nonexistent' } });

            expect(screen.getByText('Nenhum prompt encontrado')).toBeInTheDocument();
        });
    });
});
