import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NoteCard } from '../../../components/notes/NoteCard';
import { Note } from '../../../types';

// Mock MarkdownRenderer to avoid complex markdown parsing in tests
vi.mock('../../../components/notes/MarkdownRenderer', () => ({
    MarkdownRenderer: ({ content }: { content: string }) => <div data-testid="markdown">{content}</div>
}));

describe('NoteCard', () => {
    const mockNote: Note = {
        id: 'test-note-1',
        title: 'Test Note',
        content: 'Test content',
        color: 'blue',
        tags: [],
        isPinned: false,
        pinnedToTags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    const mockHandlers = {
        onClick: vi.fn(),
        onDelete: vi.fn(),
        onDuplicate: vi.fn(),
        onTogglePin: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Pin Toggle', () => {
        it('calls onTogglePin with correct id when pin button clicked', () => {
            render(<NoteCard note={mockNote} {...mockHandlers} />);

            const pinButton = screen.getByTitle('Fixar');
            fireEvent.click(pinButton);

            expect(mockHandlers.onTogglePin).toHaveBeenCalledWith('test-note-1');
            expect(mockHandlers.onClick).not.toHaveBeenCalled();
        });

        it('shows different title for pinned notes', () => {
            const pinnedNote = { ...mockNote, isPinned: true };
            render(<NoteCard note={pinnedNote} {...mockHandlers} />);

            const pinButton = screen.getByTitle(/Desafixar/);
            expect(pinButton).toBeInTheDocument();
        });

        it('pin button stops propagation (does not trigger card click)', () => {
            render(<NoteCard note={mockNote} {...mockHandlers} />);

            const pinButton = screen.getByTitle('Fixar');
            fireEvent.click(pinButton);

            expect(mockHandlers.onTogglePin).toHaveBeenCalled();
            expect(mockHandlers.onClick).not.toHaveBeenCalled();
        });
    });

    describe('Basic Rendering', () => {
        it('renders note title and content', () => {
            render(<NoteCard note={mockNote} {...mockHandlers} />);

            expect(screen.getByText('Test Note')).toBeInTheDocument();
            expect(screen.getByTestId('markdown')).toHaveTextContent('Test content');
        });

        it('calls onClick when card is clicked', () => {
            render(<NoteCard note={mockNote} {...mockHandlers} />);

            fireEvent.click(screen.getByText('Test Note'));

            expect(mockHandlers.onClick).toHaveBeenCalledWith(mockNote);
        });

        it('renders with correct color scheme', () => {
            render(<NoteCard note={mockNote} {...mockHandlers} />);

            // Card should have blue border styling  
            const card = screen.getByText('Test Note').closest('[class*="border-blue"]');
            expect(card).toBeInTheDocument();
        });
    });

    describe('Pinned Note Display', () => {
        it('shows pinned tag labels when note is pinned with tags', () => {
            const pinnedNote = {
                ...mockNote,
                isPinned: true,
                pinnedToTags: ['tag-1'],
            };
            const tags = [{ id: 'tag-1', label: 'Work', color: 'bg-blue-500', createdAt: Date.now() }];

            render(<NoteCard note={pinnedNote} availableTags={tags} {...mockHandlers} />);

            // Pin button should show tags in title
            const pinButton = screen.getByTitle(/Desafixar.*Work/);
            expect(pinButton).toBeInTheDocument();
        });
    });
});
