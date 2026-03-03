import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import GamesView from '../../../components/views/GamesView';
import { useConfigStore } from '../../../stores/configStore';
import { useGamesStore } from '../../../stores/gamesStore';
import { CENTRAL_FOLDER_ID, type Game } from '../../../types';

const createGame = (overrides: Partial<Game> = {}): Game => ({
    id: 'game-1',
    title: 'Metaphor ReFantazio',
    platform: 'PC',
    status: 'PLAYING',
    hoursPlayed: 24,
    totalHoursEstimate: 80,
    missions: [],
    history: [],
    stories: [],
    reviewPending: false,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
});

describe('GamesView stories integration', () => {
    beforeEach(() => {
        useGamesStore.getState()._reset();
        useConfigStore.getState()._reset();

        useConfigStore.setState((state) => ({
            ...state,
            isLoading: false,
            _initialized: false,
        }));

        useGamesStore.setState((state) => ({
            ...state,
            games: [
                createGame({
                    stories: [{
                        id: 'story-1',
                        content: 'Primeiro encontro com o rei.',
                        arc: 'Prólogo',
                        createdAt: 10,
                        updatedAt: 10,
                    }],
                }),
            ],
            folders: [{
                id: CENTRAL_FOLDER_ID,
                name: '67 Days',
                color: 'purple',
                createdAt: 0,
                isProtected: true,
            }],
            isLoading: false,
            _initialized: false,
        }));
    });

    it('shows the stories button and toggles the inline stories mural', () => {
        render(<GamesView />);

        const storiesButton = screen.getByRole('button', { name: /Histórias/i });
        expect(storiesButton).toBeInTheDocument();

        fireEvent.click(storiesButton);

        expect(screen.getByText('Mural de histórias')).toBeInTheDocument();
        expect(screen.getByText('Timeline filtrável')).toBeInTheDocument();
        expect(screen.getByText('Primeiro encontro com o rei.')).toBeInTheDocument();

        fireEvent.click(storiesButton);

        expect(screen.queryByText('Mural de histórias')).not.toBeInTheDocument();
    });
});
