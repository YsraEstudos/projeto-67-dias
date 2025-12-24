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
        onCreateTag: vi.fn((label: string) => ({ id: `new-${label}`, label, color: 'bg-slate-500', createdAt: Date.now() } as Tag)),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Fullscreen Mode for existing notes', () => {
        it('opens in view mode (not editing) for existing note', () => {
            render(
                <NoteEditor
                    note={mockExistingNote}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            // In view mode, should display title as h1
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
            expect(screen.getByTitle(/Fechar/)).toBeInTheDocument();

            // Should have pin button
            expect(screen.getByTitle(/fixar nota/i)).toBeInTheDocument();
        });

        it('can switch to edit mode by clicking edit button', () => {
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

            // Title input should now be visible (as input, not h1)
            const titleInput = screen.getByDisplayValue('Existing Note');
            expect(titleInput.tagName).toBe('INPUT');
        });

        it('can switch to edit mode by clicking on title', () => {
            render(
                <NoteEditor
                    note={mockExistingNote}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            // Click on title to enter edit mode
            const title = screen.getByText('Existing Note');
            fireEvent.click(title);

            // Should now show input
            const titleInput = screen.getByDisplayValue('Existing Note');
            expect(titleInput.tagName).toBe('INPUT');
        });
    });

    describe('Fullscreen Mode for new notes', () => {
        it('opens in edit mode for new note (no note prop)', () => {
            render(
                <NoteEditor
                    note={null}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            // Should have title input placeholder
            expect(screen.getByPlaceholderText(/Título da nota/i)).toBeInTheDocument();

            // View button should be active (showing eye icon to switch to view)
            expect(screen.getByTitle('Visualizar')).toBeInTheDocument();
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
            expect(titleInput.tagName).toBe('INPUT');
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

            // Open metadata panel to access save button
            const metadataToggle = screen.getByText(/Metadados e Tags/i);
            fireEvent.click(metadataToggle);

            // Click save - use the "Salvar Nota" button in metadata panel
            const saveButton = screen.getByRole('button', { name: /Salvar Nota/i });
            fireEvent.click(saveButton);

            expect(mockHandlers.onSave).toHaveBeenCalled();
            expect(mockHandlers.onClose).toHaveBeenCalled();

            const savedNote = mockHandlers.onSave.mock.calls[0][0];
            expect(savedNote.title).toBe('New Test Note');
        });

        it('shows save button in action bar when there are changes', () => {
            render(
                <NoteEditor
                    note={mockExistingNote}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            // Enter edit mode
            const editButton = screen.getByTitle('Editar nota');
            fireEvent.click(editButton);

            // Make a change
            const titleInput = screen.getByDisplayValue('Existing Note');
            fireEvent.change(titleInput, { target: { value: 'Modified Title' } });

            // Save button should appear in action bar
            expect(screen.getByTitle(/Salvar/)).toBeInTheDocument();
        });
    });

    describe('Markdown toolbar', () => {
        it('shows markdown toolbar when in edit mode', () => {
            render(
                <NoteEditor
                    note={null}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            // Should have formatting buttons
            expect(screen.getByTitle(/Negrito/)).toBeInTheDocument();
            expect(screen.getByTitle(/Itálico/)).toBeInTheDocument();
            expect(screen.getByTitle(/Link/)).toBeInTheDocument();
        });
    });

    describe('Color picker', () => {
        it('toggles color picker when clicking color button', () => {
            render(
                <NoteEditor
                    note={mockExistingNote}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            // Click color button
            const colorButton = screen.getByTitle('Cor da nota');
            fireEvent.click(colorButton);

            // Should show color options
            expect(screen.getByTitle('Âmbar')).toBeInTheDocument();
            expect(screen.getByTitle('Roxo')).toBeInTheDocument();
        });
    });

    describe('Metadata panel', () => {
        it('toggles metadata panel when clicking toggle button', () => {
            render(
                <NoteEditor
                    note={mockExistingNote}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            // Click metadata toggle
            const metadataToggle = screen.getByText(/Metadados e Tags/i);
            fireEvent.click(metadataToggle);

            // Should show tags section label
            expect(screen.getByText('Tags')).toBeInTheDocument();

            // Should show tag input placeholder
            expect(screen.getByPlaceholderText(/Nova tag/i)).toBeInTheDocument();
        });
    });
});
