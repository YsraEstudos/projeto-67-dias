import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Note, Tag } from '../../../types';
import { NoteEditor } from '../../../components/notes/NoteEditor';

// Mock components that are heavy to render
vi.mock('../../../components/notes/MarkdownRenderer', () => ({
    MarkdownRenderer: ({ content }: { content: string }) => <div data-testid="markdown-preview">{content}</div>
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

    describe('Basic Rendering', () => {
        it('renders without crashing for existing note', () => {
            expect(() => {
                render(
                    <NoteEditor
                        note={mockExistingNote}
                        availableTags={mockTags}
                        {...mockHandlers}
                    />
                );
            }).not.toThrow();
        });

        it('renders without crashing for new note', () => {
            expect(() => {
                render(
                    <NoteEditor
                        note={null}
                        availableTags={mockTags}
                        {...mockHandlers}
                    />
                );
            }).not.toThrow();
        });

        it('displays title input', () => {
            render(
                <NoteEditor
                    note={mockExistingNote}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            // Title should always be an input
            const titleInput = screen.getByDisplayValue('Existing Note');
            expect(titleInput.tagName).toBe('INPUT');
        });
    });

    describe('New Note Behavior', () => {
        it('opens in source mode for new notes (shows textarea)', () => {
            render(
                <NoteEditor
                    note={null}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            // New notes should have title input placeholder
            expect(screen.getByPlaceholderText(/Título da nota/i)).toBeInTheDocument();

            // And show textarea for content editing
            expect(screen.getByPlaceholderText(/Comece a escrever/)).toBeInTheDocument();
        });

        it('shows markdown toolbar in source mode', () => {
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

    describe('Mode Toggle', () => {
        it('has a toggle button in action bar', () => {
            render(
                <NoteEditor
                    note={mockExistingNote}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            // Should have a button to toggle modes
            const toggleButton = screen.getByTitle(/Ver (código fonte|formatado)/);
            expect(toggleButton).toBeInTheDocument();
        });

        it('toggle button is clickable and changes mode', () => {
            render(
                <NoteEditor
                    note={null}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            // Initially in source mode (new note)
            const initialButton = screen.getByTitle(/Ver formatado/);
            expect(initialButton).toBeInTheDocument();

            // Click to toggle
            fireEvent.click(initialButton);

            // Button title should change
            expect(screen.getByTitle(/Ver código fonte/)).toBeInTheDocument();
        });
    });

    describe('Save functionality', () => {
        it('calls onSave with note data when saving', () => {
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

            // Open metadata panel
            const metadataToggle = screen.getByText(/Metadados e Tags/i);
            fireEvent.click(metadataToggle);

            // Click save
            const saveButton = screen.getByRole('button', { name: /Salvar Nota/i });
            fireEvent.click(saveButton);

            expect(mockHandlers.onSave).toHaveBeenCalled();
            expect(mockHandlers.onClose).toHaveBeenCalled();

            const savedNote = mockHandlers.onSave.mock.calls[0][0];
            expect(savedNote.title).toBe('New Test Note');
        });

        it('shows save button when changes are made', () => {
            render(
                <NoteEditor
                    note={mockExistingNote}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            // Make a change
            const titleInput = screen.getByDisplayValue('Existing Note');
            fireEvent.change(titleInput, { target: { value: 'Modified Title' } });

            // Save button should appear
            expect(screen.getByTitle(/Salvar/)).toBeInTheDocument();
        });
    });

    describe('Action Bar', () => {
        it('displays close button', () => {
            render(
                <NoteEditor
                    note={mockExistingNote}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            expect(screen.getByTitle(/Fechar/)).toBeInTheDocument();
        });

        it('displays pin button', () => {
            render(
                <NoteEditor
                    note={mockExistingNote}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            expect(screen.getByTitle(/fixar nota/i)).toBeInTheDocument();
        });

        it('displays color picker button', () => {
            render(
                <NoteEditor
                    note={mockExistingNote}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            expect(screen.getByTitle('Cor da nota')).toBeInTheDocument();
        });
    });

    describe('Color Picker', () => {
        it('toggles color picker when clicking color button', () => {
            render(
                <NoteEditor
                    note={mockExistingNote}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            const colorButton = screen.getByTitle('Cor da nota');
            fireEvent.click(colorButton);

            expect(screen.getByTitle('Âmbar')).toBeInTheDocument();
            expect(screen.getByTitle('Roxo')).toBeInTheDocument();
        });
    });

    describe('Metadata Panel', () => {
        it('toggles metadata panel', () => {
            render(
                <NoteEditor
                    note={mockExistingNote}
                    availableTags={mockTags}
                    {...mockHandlers}
                />
            );

            const metadataToggle = screen.getByText(/Metadados e Tags/i);
            fireEvent.click(metadataToggle);

            expect(screen.getByText('Tags')).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/Nova tag/i)).toBeInTheDocument();
        });
    });
});
