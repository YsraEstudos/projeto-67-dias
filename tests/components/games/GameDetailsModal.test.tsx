import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { GameDetailsModal } from '../../../components/games/GameDetailsModal';
import { useGamesStore } from '../../../stores/gamesStore';
import type { Game } from '../../../types';

const createGame = (overrides: Partial<Game> = {}): Game => ({
    id: 'game-1',
    title: 'Final Fantasy VII Rebirth',
    platform: 'PS5',
    status: 'PLAYING',
    hoursPlayed: 40,
    totalHoursEstimate: 110,
    missions: [],
    history: [],
    stories: [],
    reviewPending: false,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
});

describe('GameDetailsModal stories tab', () => {
    beforeEach(() => {
        useGamesStore.getState()._reset();
        useGamesStore.setState((state) => ({
            ...state,
            games: [
                createGame({
                    stories: [{
                        id: 'story-1',
                        content: 'Cloud encontra um novo eco.',
                        arc: 'Junon',
                        createdAt: 10,
                        updatedAt: 10,
                    }],
                }),
            ],
            isLoading: false,
            _initialized: false,
        }));
    });

    it('renders the shared stories panel in game mode', () => {
        render(<GameDetailsModal gameId="game-1" onClose={() => undefined} />);

        expect(screen.getByText('Histórias do jogo')).toBeInTheDocument();
        expect(screen.getByText('Cloud encontra um novo eco.')).toBeInTheDocument();
        expect(screen.queryByText('Todos os jogos')).not.toBeInTheDocument();
    });
});
