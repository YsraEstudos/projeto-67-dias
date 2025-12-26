import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SiteCategoryModal from '../../../components/links/SiteCategoryModal';
import { SiteCategory } from '../../../types';

describe('SiteCategoryModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();
    const mockCategories: SiteCategory[] = [
        { id: 'personal', name: 'Meus Sites', color: 'indigo', icon: 'layout', order: 0, isDefault: true, parentId: null },
        { id: 'general', name: 'Sites Gerais', color: 'slate', icon: 'grid', order: 1, isDefault: true, parentId: null },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Creating new category', () => {
        it('renders with "Nova Categoria" title when no category prop', () => {
            render(
                <SiteCategoryModal
                    category={null}
                    categories={mockCategories}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            expect(screen.getByText('Nova Categoria')).toBeInTheDocument();
        });

        it('enables save button when name is filled', () => {
            render(
                <SiteCategoryModal
                    category={null}
                    categories={mockCategories}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            const saveButton = screen.getByText('Criar Categoria');
            expect(saveButton).toBeDisabled();

            const nameInput = screen.getByPlaceholderText(/Trabalho, Estudos, Lazer/i);
            fireEvent.change(nameInput, { target: { value: 'Minha Categoria' } });

            expect(saveButton).not.toBeDisabled();
        });

        it('calls onSave with new category data', () => {
            render(
                <SiteCategoryModal
                    category={null}
                    categories={mockCategories}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            const nameInput = screen.getByPlaceholderText(/Trabalho, Estudos, Lazer/i);
            fireEvent.change(nameInput, { target: { value: 'Trabalho' } });

            const saveButton = screen.getByText('Criar Categoria');
            fireEvent.click(saveButton);

            expect(mockOnSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Trabalho',
                    color: 'indigo', // default
                    icon: 'layout', // default
                    parentId: null,
                    isDefault: false,
                })
            );
        });

        it('allows changing color', () => {
            render(
                <SiteCategoryModal
                    category={null}
                    categories={mockCategories}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            const nameInput = screen.getByPlaceholderText(/Trabalho, Estudos, Lazer/i);
            fireEvent.change(nameInput, { target: { value: 'Test' } });

            // Click on emerald color button
            const colorButton = screen.getByLabelText('Selecionar cor emerald');
            fireEvent.click(colorButton);

            const saveButton = screen.getByText('Criar Categoria');
            fireEvent.click(saveButton);

            expect(mockOnSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    color: 'emerald',
                })
            );
        });
    });

    describe('Editing existing category', () => {
        const existingCategory: SiteCategory = {
            id: 'cat-1',
            name: 'Trabalho',
            color: 'blue',
            icon: 'briefcase',
            order: 0,
            isDefault: false,
            parentId: null,
        };

        it('renders with "Editar Categoria" title', () => {
            render(
                <SiteCategoryModal
                    category={existingCategory}
                    categories={mockCategories}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            expect(screen.getByText('Editar Categoria')).toBeInTheDocument();
        });

        it('pre-fills form with existing category data', () => {
            render(
                <SiteCategoryModal
                    category={existingCategory}
                    categories={mockCategories}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            const nameInput = screen.getByDisplayValue('Trabalho');
            expect(nameInput).toBeInTheDocument();
        });

        it('shows "Salvar" button instead of "Criar Categoria"', () => {
            render(
                <SiteCategoryModal
                    category={existingCategory}
                    categories={mockCategories}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            expect(screen.getByText('Salvar')).toBeInTheDocument();
            expect(screen.queryByText('Criar Categoria')).not.toBeInTheDocument();
        });
    });

    describe('Default category behavior', () => {
        const defaultCategory: SiteCategory = {
            id: 'personal',
            name: 'Meus Sites',
            color: 'indigo',
            icon: 'layout',
            order: 0,
            isDefault: true,
            parentId: null,
        };

        it('disables name input for default categories', () => {
            render(
                <SiteCategoryModal
                    category={defaultCategory}
                    categories={mockCategories}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            const nameInput = screen.getByDisplayValue('Meus Sites');
            expect(nameInput).toBeDisabled();
        });

        it('shows warning message for default categories', () => {
            render(
                <SiteCategoryModal
                    category={defaultCategory}
                    categories={mockCategories}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            expect(screen.getByText(/Categorias padrão não podem ser renomeadas/i)).toBeInTheDocument();
        });
    });

    describe('Modal interactions', () => {
        it('calls onClose when cancel button is clicked', () => {
            render(
                <SiteCategoryModal
                    category={null}
                    categories={mockCategories}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            fireEvent.click(screen.getByText('Cancelar'));
            expect(mockOnClose).toHaveBeenCalled();
        });

        it('calls onClose when X button is clicked', () => {
            render(
                <SiteCategoryModal
                    category={null}
                    categories={mockCategories}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                />
            );

            fireEvent.click(screen.getByLabelText('Fechar modal'));
            expect(mockOnClose).toHaveBeenCalled();
        });
    });
});

