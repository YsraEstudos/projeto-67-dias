import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import JournalView from '../../../components/views/JournalView';

// Mock Zustand store
const mockAddEntry = vi.fn();
const mockUpdateEntry = vi.fn();
const mockDeleteEntry = vi.fn();

vi.mock('../../../stores/journalStore', () => ({
    useJournalStore: () => ({
        entries: [
            {
                id: 'entry-1',
                date: '2024-01-15',
                content: 'Test journal entry content',
                mood: 'great',
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
        ],
        addEntry: mockAddEntry,
        updateEntry: mockUpdateEntry,
        deleteEntry: mockDeleteEntry,
        isLoading: false,
    }),
}));

// Mock useStreakTracking hook
vi.mock('../../../hooks/useStreakTracking', () => ({
    useStreakTracking: () => ({
        trackActivity: vi.fn(),
    }),
}));

describe('JournalView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear localStorage mock for initialization flag
        localStorage.removeItem('p67_journal_initialized');
    });

    describe('Basic Rendering', () => {
        it('renders the journal sidebar with entries', () => {
            render(<JournalView />);

            expect(screen.getByText('Diário')).toBeInTheDocument();
            expect(screen.getByText('Test journal entry content')).toBeInTheDocument();
        });

        it('shows empty state placeholder when no entry is selected', () => {
            render(<JournalView />);

            expect(screen.getByText('Seu espaço de reflexão')).toBeInTheDocument();
            expect(screen.getByText(/Selecione uma entrada/)).toBeInTheDocument();
        });

        it('displays the new entry button', () => {
            render(<JournalView />);

            expect(screen.getByTitle('Nova Entrada')).toBeInTheDocument();
        });
    });

    describe('Entry Selection', () => {
        it('shows entry content when entry is clicked', () => {
            render(<JournalView />);

            // Click on entry in sidebar
            fireEvent.click(screen.getByText('Test journal entry content'));

            // Should show editor with entry content
            expect(screen.getByDisplayValue('Test journal entry content')).toBeInTheDocument();
        });

        it('shows mood selector when entry is selected', () => {
            render(<JournalView />);

            // Click on entry in sidebar
            fireEvent.click(screen.getByText('Test journal entry content'));

            // Should show mood selector buttons (based on MOOD_CONFIG)
            expect(screen.getByTitle('Incrível')).toBeInTheDocument();
        });
    });

    describe('Entry Creation', () => {
        it('calls addEntry when new entry button is clicked', () => {
            render(<JournalView />);

            const newEntryButton = screen.getByTitle('Nova Entrada');
            fireEvent.click(newEntryButton);

            expect(mockAddEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: '',
                    mood: 'neutral',
                })
            );
        });

        it('shows create button in empty state placeholder', () => {
            render(<JournalView />);

            expect(screen.getByText('Criar nova entrada')).toBeInTheDocument();
        });
    });

    describe('Entry Update', () => {
        it('calls updateEntry when content is changed', () => {
            render(<JournalView />);

            // Select entry
            fireEvent.click(screen.getByText('Test journal entry content'));

            // Change content
            const textarea = screen.getByDisplayValue('Test journal entry content');
            fireEvent.change(textarea, { target: { value: 'Updated content' } });

            expect(mockUpdateEntry).toHaveBeenCalledWith('entry-1', { content: 'Updated content' });
        });
    });

    describe('Mood Selector', () => {
        it('renders all mood options', () => {
            render(<JournalView />);

            // Select entry to show mood selector
            fireEvent.click(screen.getByText('Test journal entry content'));

            // Verify all mood buttons exist
            expect(screen.getByTitle('Incrível')).toBeInTheDocument();
            expect(screen.getByTitle('Bem')).toBeInTheDocument();
            expect(screen.getByTitle('Normal')).toBeInTheDocument();
            expect(screen.getByTitle('Mal')).toBeInTheDocument();
            expect(screen.getByTitle('Péssimo')).toBeInTheDocument();
        });

        it('calls updateEntry when mood is changed', () => {
            render(<JournalView />);

            // Select entry
            fireEvent.click(screen.getByText('Test journal entry content'));

            // Click on a different mood
            const normalMoodButton = screen.getByTitle('Normal');
            fireEvent.click(normalMoodButton);

            expect(mockUpdateEntry).toHaveBeenCalledWith('entry-1', { mood: 'neutral' });
        });
    });

    describe('Entry Deletion', () => {
        it('has delete button when entry is selected', () => {
            render(<JournalView />);

            // Select entry
            fireEvent.click(screen.getByText('Test journal entry content'));

            expect(screen.getByTitle('Excluir')).toBeInTheDocument();
        });
    });

    describe('Inspirational Quote', () => {
        it('shows inspirational quote when entry is selected', () => {
            render(<JournalView />);

            // Select entry
            fireEvent.click(screen.getByText('Test journal entry content'));

            expect(screen.getByText(/A excelência não é um ato, mas um hábito/)).toBeInTheDocument();
            expect(screen.getByText('— Aristóteles')).toBeInTheDocument();
        });
    });
});
