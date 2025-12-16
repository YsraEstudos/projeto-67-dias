import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Game, GameLog, GameMission, GameStatus, GameFolder, CENTRAL_FOLDER_ID, CENTRAL_FOLDER_NAME } from '../types';
import { generateId } from '../utils/generateId';
import { createFirebaseStorage } from './persistMiddleware';

// Pasta central pré-definida (67 Days)
const CENTRAL_FOLDER: GameFolder = {
    id: CENTRAL_FOLDER_ID,
    name: CENTRAL_FOLDER_NAME,
    color: 'purple',
    createdAt: 0,
    isProtected: true
};

interface GamesState {
    games: Game[];
    folders: GameFolder[];

    // Game Actions
    addGame: (game: Omit<Game, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'missions'>) => void;
    updateGame: (id: string, updates: Partial<Game>) => void;
    deleteGame: (id: string) => void;
    moveGameToFolder: (gameId: string, folderId: string | null) => void;

    // Folder Actions
    createFolder: (name: string, color: string) => void;
    deleteFolder: (folderId: string) => void;
    updateFolder: (id: string, name: string, color: string) => void;

    // Mission Actions
    addMission: (gameId: string, mission: Omit<GameMission, 'id' | 'isCompleted'>) => void;
    toggleMission: (gameId: string, missionId: string) => void;
    deleteMission: (gameId: string, missionId: string) => void;

    // Time Logging
    logHours: (gameId: string, hours: number, date?: string) => void;

    // Review Actions
    setGameReview: (gameId: string, review: string) => void;
    toggleReviewPending: (gameId: string) => void;
}

export const useGamesStore = create<GamesState>()(
    persist(
        (set, get) => ({
            games: [],
            folders: [CENTRAL_FOLDER],

            addGame: (gameData) => set((state) => {
                const newGame: Game = {
                    id: generateId(),
                    ...gameData,
                    missions: [],
                    history: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };
                return { games: [newGame, ...state.games] };
            }),

            updateGame: (id, updates) => set((state) => {
                const gameExists = state.games.some(g => g.id === id);
                if (!gameExists) {
                    console.warn(`[GamesStore] Attempted to update non-existent game: ${id}`);
                    return state;
                }
                return {
                    games: state.games.map((g) =>
                        g.id === id ? { ...g, ...updates, updatedAt: Date.now() } : g
                    ),
                };
            }),

            deleteGame: (id) => set((state) => ({
                games: state.games.filter((g) => g.id !== id),
            })),

            moveGameToFolder: (gameId, folderId) => set((state) => ({
                games: state.games.map(g => g.id === gameId ? { ...g, folderId: folderId || undefined } : g)
            })),

            createFolder: (name, color) => set((state) => {
                const newId = generateId();
                console.log('[GamesStore] Creating folder:', { name, color, id: newId });

                return {
                    folders: [...state.folders, {
                        id: newId,
                        name,
                        color,
                        createdAt: Date.now()
                    }]
                };
            }),

            deleteFolder: (folderId) => set((state) => {
                // Não permitir exclusão de pastas protegidas (67 Days)
                const folder = state.folders.find(f => f.id === folderId);
                if (folder?.isProtected) {
                    console.warn('[GamesStore] Cannot delete protected folder:', folder.name);
                    return state;
                }
                return {
                    folders: state.folders.filter(f => f.id !== folderId),
                    games: state.games.map(g => g.folderId === folderId ? { ...g, folderId: undefined } : g)
                };
            }),

            updateFolder: (id, name, color) => set((state) => ({
                folders: state.folders.map(f => f.id === id ? { ...f, name, color } : f)
            })),

            addMission: (gameId, missionData) => set((state) => ({
                games: state.games.map((g) => {
                    if (g.id !== gameId) return g;
                    const newMission: GameMission = {
                        id: generateId(),
                        isCompleted: false,
                        ...missionData,
                    };
                    return { ...g, missions: [...g.missions, newMission], updatedAt: Date.now() };
                }),
            })),

            toggleMission: (gameId, missionId) => set((state) => ({
                games: state.games.map((g) => {
                    if (g.id !== gameId) return g;
                    return {
                        ...g,
                        missions: g.missions.map((m) =>
                            m.id === missionId ? { ...m, isCompleted: !m.isCompleted } : m
                        ),
                        updatedAt: Date.now(),
                    };
                }),
            })),

            deleteMission: (gameId, missionId) => set((state) => ({
                games: state.games.map((g) => {
                    if (g.id !== gameId) return g;
                    return {
                        ...g,
                        missions: g.missions.filter((m) => m.id !== missionId),
                        updatedAt: Date.now(),
                    };
                }),
            })),

            logHours: (gameId, hours, date = new Date().toISOString()) => set((state) => ({
                games: state.games.map((g) => {
                    if (g.id !== gameId) return g;

                    const newLog: GameLog = {
                        id: generateId(),
                        date,
                        hoursPlayed: hours,
                    };

                    const newTotal = g.hoursPlayed + hours;

                    return {
                        ...g,
                        history: [...g.history, newLog],
                        hoursPlayed: newTotal,
                        updatedAt: Date.now(),
                    };
                }),
            })),

            // Review Actions
            setGameReview: (gameId, review) => set((state) => ({
                games: state.games.map((g) =>
                    g.id === gameId
                        ? { ...g, review, reviewPending: false, updatedAt: Date.now() }
                        : g
                ),
            })),

            toggleReviewPending: (gameId) => set((state) => ({
                games: state.games.map((g) =>
                    g.id === gameId
                        ? { ...g, reviewPending: !g.reviewPending, updatedAt: Date.now() }
                        : g
                ),
            })),
        }),
        {
            name: 'games-storage',
            storage: createFirebaseStorage('games-storage'),
            // Garantir que a pasta 67 Days sempre exista
            onRehydrateStorage: () => (state) => {
                if (state && !state.folders.some(f => f.id === CENTRAL_FOLDER_ID)) {
                    state.folders = [CENTRAL_FOLDER, ...state.folders];
                }
            },
        }
    )
);
