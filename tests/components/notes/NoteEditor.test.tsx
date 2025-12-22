import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NoteEditor } from '../../../components/notes/NoteEditor';
import { Note, Tag } from '../../../types';

// Mock MarkdownRenderer
vi.mock('../../../components/notes/MarkdownRenderer', () => ({
    MarkdownRenderer: ({ content }: { content: string }) => <div data-testid="markdown-preview">{content}</div>
}));

// Mock Gemini service
vi.mock('../../../services/gemini', () => ({
    getGeminiModel: vi.fn()
}));

describe('NoteEditor', () => {
    const mockExistingNote: Note = {
        id: 'existing-note-1',
        title: 'Existing Note',
        content: 'Existing content',
        color: 'blue',
        tags: [],
        isPinned: false,
        pinnedToTags: [],
        createdAt: Date.now() - 10000,
        updatedAt: Date.now(),
    };

    const mockTags: Tag[] = [
        { id: 'tag-1', label: 'Work', color: 'bg-blue-500', createdAt: Date.now() },
        { id: 'tag-2', label: 'Personal', color: 'bg-green-500', createdAt: Date.now() },
    ];

    const mockHandlers = {
        onSave: vi.fn(),
        onClose: vi.fn(),
        onCreateTag: vi.fn((label: string) => ({ id: `new-${label}`, label, color: 'bg-slate-500', createdAt: Date.now() })),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('viewMode for existing notes', () => {
        it('opens in focus mode for existing note', () => {
            render(
                <NoteEditor
                    note={mockExistingNote}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            // In focus mode, should display title in large text
            expect(screen.getByText('Existing Note')).toBeInTheDocument();

            // Should show the markdown preview content
            expect(screen.getByTestId('markdown-preview')).toHaveTextContent('Existing content');
        });

        it('displays floating action bar with edit and close buttons', () => {
            render(
                <NoteEditor
                    note={mockExistingNote}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            // Should have edit button accessible via title
            expect(screen.getByTitle('Editar nota')).toBeInTheDocument();

            // Should have close button
            expect(screen.getByTitle('Fechar')).toBeInTheDocument();

            // Should have pin button
            expect(screen.getByTitle(/fixar nota/i)).toBeInTheDocument();
        });

        it('can switch from focus to edit mode', () => {
            render(
                <NoteEditor
                    note={mockExistingNote}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            // Click edit button in floating bar
            const editButton = screen.getByTitle('Editar nota');
            fireEvent.click(editButton);

            // Header should show edit mode
            expect(screen.getByText('Editar Nota')).toBeInTheDocument();

            // Title input should be editable  
            const titleInput = screen.getByDisplayValue('Existing Note');
            expect(titleInput).not.toHaveAttribute('readOnly');
        });
    });


    describe('viewMode for new notes', () => {
        it('opens in edit mode for new note (no note prop)', () => {
            render(
                <NoteEditor
                    note={null}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            // Should show "Nova Nota" header
            expect(screen.getByText('Nova Nota')).toBeInTheDocument();

            // Edit button should be active
            const editButton = screen.getByRole('button', { name: /Editar/i });
            expect(editButton).toHaveClass('bg-purple-600');
        });

        it('title input is editable for new note', () => {
            render(
                <NoteEditor
                    note={null}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            const titleInput = screen.getByPlaceholderText(/Título da nota/i);
            expect(titleInput).not.toHaveAttribute('readOnly');
        });
    });

    describe('Save functionality', () => {
        it('calls onSave with updated note data', () => {
            render(
                <NoteEditor
                    note={null}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            // Fill in title
            const titleInput = screen.getByPlaceholderText(/Título da nota/i);
            fireEvent.change(titleInput, { target: { value: 'New Test Note' } });

            // Click save
            const saveButton = screen.getByRole('button', { name: /Salvar/i });
            fireEvent.click(saveButton);

            expect(mockHandlers.onSave).toHaveBeenCalled();
            expect(mockHandlers.onClose).toHaveBeenCalled();

            const savedNote = mockHandlers.onSave.mock.calls[0][0];
            expect(savedNote.title).toBe('New Test Note');
        });
    });
});
