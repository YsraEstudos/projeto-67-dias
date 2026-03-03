import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StoriesPanel } from '../../../components/games/stories/StoriesPanel';
import { useGamesStore } from '../../../stores/gamesStore';
import { useNotesStore } from '../../../stores/notesStore';
import type { Game } from '../../../types';

const { deleteGameStoryImageMock } = vi.hoisted(() => ({
    deleteGameStoryImageMock: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../services/storageService', () => ({
    uploadGameStoryImage: vi.fn(),
    deleteGameStoryImage: deleteGameStoryImageMock,
}));

const createGame = (overrides: Partial<Game> = {}): Game => ({
    id: 'game-1',
    title: 'Persona 3 Reload',
    platform: 'PC',
    status: 'PLAYING',
    hoursPlayed: 12,
    totalHoursEstimate: 70,
    missions: [],
    history: [],
    stories: [],
    reviewPending: false,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
});

describe('StoriesPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useGamesStore.getState()._reset();
        useNotesStore.getState()._reset();
        useGamesStore.setState((state) => ({ ...state, isLoading: false, _initialized: false }));
        useNotesStore.setState((state) => ({ ...state, isLoading: false, _initialized: false }));
    });

    it('requires selecting a game in global mode before creating a story, then saves bilingual data', async () => {
        useGamesStore.setState((state) => ({
            ...state,
            games: [
                createGame(),
                createGame({ id: 'game-2', title: 'Clair Obscur', platform: 'PS5' }),
            ],
        }));

        render(<StoriesPanel mode="global" />);

        const composer = screen.getByText('Registrar nova história').closest('form');
        expect(composer).not.toBeNull();

        fireEvent.change(within(composer!).getByPlaceholderText(/Descreva a cena/i), {
            target: { value: 'A equipe encontrou a torre selada.' },
        });
        fireEvent.change(within(composer!).getByPlaceholderText(/Registre sua traducao/i), {
            target: { value: 'The team found the sealed tower.' },
        });

        const submitButton = within(composer!).getByRole('button', { name: /Adicionar historia/i });
        expect(submitButton).toBeDisabled();

        const [gameSelect] = within(composer!).getAllByRole('combobox');
        fireEvent.change(gameSelect, { target: { value: 'game-2' } });
        fireEvent.change(within(composer!).getByPlaceholderText('Capitulo 3'), {
            target: { value: 'Torre Lacrada' },
        });

        expect(submitButton).not.toBeDisabled();
        fireEvent.click(submitButton);

        await waitFor(() => {
            const targetGame = useGamesStore.getState().games.find((game) => game.id === 'game-2');
            expect(targetGame?.stories).toHaveLength(1);
        });

        const savedStory = useGamesStore.getState().games.find((game) => game.id === 'game-2')?.stories?.[0];
        expect(savedStory?.arc).toBe('Torre Lacrada');
        expect(savedStory?.content).toBe('A equipe encontrou a torre selada.');
        expect(savedStory?.translatedContent).toBe('The team found the sealed tower.');
        expect(savedStory?.originalLanguage).toBe('ja');
        expect(savedStory?.translatedLanguage).toBe('pt-BR');
        expect(screen.getByText('História salva em Clair Obscur.')).toBeInTheDocument();
    });

    it('creates a note and a Games Story tag from right-click selection', async () => {
        useGamesStore.setState((state) => ({
            ...state,
            games: [
                createGame({
                    stories: [{
                        id: 'story-1',
                        arc: 'Lua Cheia',
                        content: '敵が現れた。',
                        translatedContent: 'Um inimigo apareceu.',
                        originalLanguage: 'ja',
                        translatedLanguage: 'pt-BR',
                        createdAt: 100,
                        updatedAt: 100,
                    }],
                }),
            ],
        }));

        render(<StoriesPanel mode="global" />);

        const originalText = screen.getByText('敵が現れた。');
        const selectionSpy = vi.spyOn(window, 'getSelection').mockImplementation(() => ({
            toString: () => '敵が現れた。',
            rangeCount: 1,
            getRangeAt: () => ({ commonAncestorContainer: originalText }) as Range,
        }) as Selection);

        fireEvent.contextMenu(originalText, { clientX: 140, clientY: 180 });
        fireEvent.click(await screen.findByRole('button', { name: /Estudar depois em Notas/i }));

        await waitFor(() => {
            expect(useNotesStore.getState().notes).toHaveLength(1);
            expect(useNotesStore.getState().tags).toHaveLength(1);
        });

        const [note] = useNotesStore.getState().notes;
        const [tag] = useNotesStore.getState().tags;

        expect(tag.label).toBe('Games Story');
        expect(note.title).toBe('[Persona 3 Reload] Estudar Depois');
        expect(note.tags).toEqual([tag.id]);
        expect(note.content).toContain('Jogo: Persona 3 Reload');
        expect(note.content).toContain('Arco: Lua Cheia');
        expect(note.content).toContain('Idioma do trecho: ja');
        expect(note.content).toContain('Tradução registrada:');

        selectionSpy.mockRestore();
    });

    it('deletes stories with storage cleanup in game mode', async () => {
        useGamesStore.setState((state) => ({
            ...state,
            games: [
                createGame({
                    stories: [{
                        id: 'story-1',
                        arc: 'Dormitório',
                        content: 'Entrada visual com screenshot.',
                        imageUrl: 'https://example.com/story.jpg',
                        imageStoragePath: 'game-stories/user/game-1/story-1.jpg',
                        createdAt: 200,
                        updatedAt: 200,
                    }],
                }),
            ],
        }));

        render(<StoriesPanel mode="game" gameId="game-1" />);

        expect(screen.getByText('Histórias do jogo')).toBeInTheDocument();
        expect(screen.queryByText('Todos os jogos')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Excluir história de Persona 3 Reload/i }));

        await waitFor(() => {
            expect(deleteGameStoryImageMock).toHaveBeenCalledWith('game-stories/user/game-1/story-1.jpg');
            expect(useGamesStore.getState().games[0].stories).toHaveLength(0);
        });
    });
});
