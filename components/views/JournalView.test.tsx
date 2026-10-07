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

vi.mock('../journal/DrawingCanvas', () => ({
    default: ({ onClose }: { onClose: () => void }) => (
        <button type="button" onClick={onClose}>fechar-canvas</button>
    ),
}));

vi.mock('../../services/storageService', () => ({
    deleteAllDrawingsForEntry: vi.fn(),
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

describe('JournalView editor and sidebar', () => {
    it('shows the inserted checklist item in the editor (uses the local buffer)', async () => {
        render(<JournalView />);

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: 'texto novo' } });
        fireEvent.click(screen.getByTitle('Inserir checkbox'));

        await waitFor(() => {
            expect(screen.getByRole('textbox')).toHaveValue('texto novo\n- [ ] ');
        });
        expect(useJournalStore.getState().entries[0].content).toBe('texto novo\n- [ ] ');
    });

    it('lists entries newest first and filters them with an accent-insensitive search', () => {
        act(() => {
            useJournalStore.setState({
                entries: [
                    { id: 'old', date: '2026-01-01', content: 'Entrada antiga', entryType: 'text', createdAt: 1, updatedAt: 1 },
                    { id: 'new', date: '2026-03-01', content: 'Reunião importante', entryType: 'text', createdAt: 2, updatedAt: 2 },
                ],
            });
            useTabStore.setState({ tabs: [], activeTabId: null as unknown as string });
        });

        render(<JournalView />);

        const old = screen.getByText('Entrada antiga');
        const recent = screen.getByText('Reunião importante');
        expect(recent.compareDocumentPosition(old) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

        fireEvent.change(screen.getByLabelText('Buscar entradas do diário'), { target: { value: 'reuniao' } });
        expect(screen.getByText('Reunião importante')).toBeInTheDocument();
        expect(screen.queryByText('Entrada antiga')).not.toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Buscar entradas do diário'), { target: { value: 'xyz' } });
        expect(screen.getByText(/Nenhuma entrada encontrada/)).toBeInTheDocument();
    });

    it('lets an existing drawing entry be reopened', async () => {
        act(() => {
            useJournalStore.setState({
                entries: [{
                    id: 'draw-1', date: '2026-02-01', content: '', entryType: 'drawing',
                    drawingPages: [{ id: 'p1', storageUrl: 'https://x/p1.png', storagePath: 'p1', width: 1, height: 1, createdAt: 1 }],
                    createdAt: 1, updatedAt: 1,
                }],
            });
            useTabStore.setState({
                tabs: [{ id: 'tab-1', label: 'Diário', view: ViewState.JOURNAL, state: { selectedEntryId: 'draw-1' }, createdAt: 1 }],
                activeTabId: 'tab-1',
            });
        });

        render(<JournalView />);
        expect(screen.getByAltText('Página 1 do desenho')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Abrir desenho/ }));
        fireEvent.click(await screen.findByText('fechar-canvas'));

        // Entry with saved pages is kept
        expect(useJournalStore.getState().entries.map(e => e.id)).toContain('draw-1');
    });

    it('discards a new drawing entry closed without saving any page', async () => {
        render(<JournalView />);

        fireEvent.click(screen.getByTitle('Nova Entrada'));
        fireEvent.click(await screen.findByRole('heading', { name: 'Desenho' }));
        fireEvent.click(await screen.findByText('fechar-canvas'));

        expect(useJournalStore.getState().entries.filter(e => e.entryType === 'drawing')).toHaveLength(0);
        expect(useJournalStore.getState().entries).toHaveLength(1);
    });

    it('exposes mood buttons with accessible names and pressed state', () => {
        render(<JournalView />);
        const pressed = screen.getAllByRole('button', { pressed: true }).filter(b => b.getAttribute('aria-label')?.startsWith('Humor:'));
        expect(pressed).toHaveLength(1);
    });
});
