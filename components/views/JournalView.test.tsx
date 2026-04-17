import '@testing-library/jest-dom/vitest';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import JournalView from './JournalView';
import { useJournalStore } from '../../stores/journalStore';
import { useTabStore } from '../../stores/tabStore';
import { ViewState } from '../../types';

const { pushNavigationMock, trackActivityMock } = vi.hoisted(() => ({
    pushNavigationMock: vi.fn(),
    trackActivityMock: vi.fn(),
}));

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

vi.mock('../../hooks/useNavigationHistory', () => ({
    useNavigationHistory: () => ({
        pushNavigation: pushNavigationMock,
        replaceNavigation: vi.fn(),
        isHandlingPopState: false,
    }),
}));

vi.mock('../../hooks/useStreakTracking', () => ({
    useStreakTracking: () => ({
        trackActivity: trackActivityMock,
        isActiveToday: false,
        currentStreak: 0,
    }),
}));

const initialEntryContent = ['Primeira linha', '- [ ] tarefa pendente', '- [x] concluída'].join('\n');

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    act(() => {
        useJournalStore.setState({
            entries: [
                {
                    id: 'entry-1',
                    date: '2026-04-17',
                    content: initialEntryContent,
                    isSaved: false,
                    entryType: 'text',
                    mood: 'neutral',
                    createdAt: 1,
                    updatedAt: 1,
                },
            ],
            isLoading: false,
            _initialized: true,
        });

        useTabStore.setState({
            tabs: [
                {
                    id: 'tab-1',
                    label: 'Diário',
                    view: ViewState.JOURNAL,
                    state: { selectedEntryId: 'entry-1' },
                    createdAt: 1,
                },
            ],
            activeTabId: 'tab-1',
        });
    });
});

afterEach(() => {
    cleanup();
});

describe('JournalView save flow', () => {
    it('saves the note, shows the formatted view, toggles checklist items, and returns to edit mode', async () => {
        render(<JournalView />);

        expect(screen.getByRole('textbox')).toHaveValue(initialEntryContent);
        expect(screen.getByRole('button', { name: 'Salvar nota' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Salvar nota' }));

        await waitFor(() => {
            expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Editar nota' })).toBeInTheDocument();
            expect(screen.getByText('Nota salva')).toBeInTheDocument();
        });

        const checklistButton = screen
            .getAllByRole('button', { name: /tarefa pendente/i })
            .find((element) => element.getAttribute('type') === 'button');

        expect(checklistButton).toBeTruthy();
        if (!checklistButton) {
            throw new Error('Checklist button not found');
        }

        fireEvent.click(checklistButton);

        await waitFor(() => {
            expect(trackActivityMock).toHaveBeenCalled();
            expect(useJournalStore.getState().entries[0].content).toContain('- [x] tarefa pendente');
        });

        fireEvent.click(screen.getByRole('button', { name: 'Editar nota' }));

        await waitFor(() => {
            expect(screen.getByRole('textbox')).toHaveValue(['Primeira linha', '- [x] tarefa pendente', '- [x] concluída'].join('\n'));
        });
    });
});
