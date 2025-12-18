/**
 * Games Store - Games with Firestore-first persistence
 */
import { create } from 'zustand';
import { Game, GameLog, GameMission, GameFolder, CENTRAL_FOLDER_ID, CENTRAL_FOLDER_NAME } from '../types';
import { generateId } from '../utils/generateId';
import { writeToFirestore } from './firestoreSync';

const STORE_KEY = 'games-storage';

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
    isLoading: boolean;
    _initialized: boolean;

    addGame: (game: Omit<Game, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'missions'>) => void;
    updateGame: (id: string, updates: Partial<Game>) => void;
    deleteGame: (id: string) => void;
    moveGameToFolder: (gameId: string, folderId: string | null) => void;

    createFolder: (name: string, color: string) => void;
    deleteFolder: (folderId: string) => void;
    updateFolder: (id: string, name: string, color: string) => void;

    addMission: (gameId: string, mission: Omit<GameMission, 'id' | 'isCompleted'>) => void;
    toggleMission: (gameId: string, missionId: string) => void;
    deleteMission: (gameId: string, missionId: string) => void;

    logHours: (gameId: string, hours: number, date?: string) => void;

    setGameReview: (gameId: string, review: string) => void;
    toggleReviewPending: (gameId: string) => void;

    setLoading: (loading: boolean) => void;

    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { games: Game[]; folders: GameFolder[] } | null) => void;
    _reset: () => void;
}

export const useGamesStore = create<GamesState>()((set, get) => ({
    games: [],
    folders: [CENTRAL_FOLDER],
    isLoading: true,
    _initialized: false,

    addGame: (gameData) => {
        set((state) => {
            const newGame: Game = {
                id: generateId(),
                ...gameData,
                missions: [],
                history: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            return { games: [newGame, ...state.games] };
        });
        get()._syncToFirestore();
    },

    updateGame: (id, updates) => {
        set((state) => {
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
        });
        get()._syncToFirestore();
    },

    deleteGame: (id) => {
        set((state) => ({ games: state.games.filter((g) => g.id !== id) }));
        get()._syncToFirestore();
    },

    moveGameToFolder: (gameId, folderId) => {
        set((state) => ({
            games: state.games.map(g => g.id === gameId ? { ...g, folderId: folderId || undefined } : g)
        }));
        get()._syncToFirestore();
    },

    createFolder: (name, color) => {
        set((state) => ({
            folders: [...state.folders, {
                id: generateId(),
                name,
                color,
                createdAt: Date.now()
            }]
        }));
        get()._syncToFirestore();
    },

    deleteFolder: (folderId) => {
        set((state) => {
            const folder = state.folders.find(f => f.id === folderId);
            if (folder?.isProtected) {
                console.warn('[GamesStore] Cannot delete protected folder:', folder.name);
                return state;
            }
            return {
                folders: state.folders.filter(f => f.id !== folderId),
                games: state.games.map(g => g.folderId === folderId ? { ...g, folderId: undefined } : g)
            };
        });
        get()._syncToFirestore();
    },

    updateFolder: (id, name, color) => {
        set((state) => ({
            folders: state.folders.map(f => f.id === id ? { ...f, name, color } : f)
        }));
        get()._syncToFirestore();
    },

    addMission: (gameId, missionData) => {
        set((state) => ({
            games: state.games.map((g) => {
                if (g.id !== gameId) return g;
                const newMission: GameMission = {
                    id: generateId(),
                    isCompleted: false,
                    ...missionData,
                };
                return { ...g, missions: [...g.missions, newMission], updatedAt: Date.now() };
            }),
        }));
        get()._syncToFirestore();
    },

    toggleMission: (gameId, missionId) => {
        set((state) => ({
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
        }));
        get()._syncToFirestore();
    },

    deleteMission: (gameId, missionId) => {
        set((state) => ({
            games: state.games.map((g) => {
                if (g.id !== gameId) return g;
                return {
                    ...g,
                    missions: g.missions.filter((m) => m.id !== missionId),
                    updatedAt: Date.now(),
                };
            }),
        }));
        get()._syncToFirestore();
    },

    logHours: (gameId, hours, date = new Date().toISOString()) => {
        set((state) => ({
            games: state.games.map((g) => {
                if (g.id !== gameId) return g;
                const newLog: GameLog = {
                    id: generateId(),
                    date,
                    hoursPlayed: hours,
                };
                return {
                    ...g,
                    history: [...g.history, newLog],
                    hoursPlayed: g.hoursPlayed + hours,
                    updatedAt: Date.now(),
                };
            }),
        }));
        get()._syncToFirestore();
    },

    setGameReview: (gameId, review) => {
        set((state) => ({
            games: state.games.map((g) =>
                g.id === gameId
                    ? { ...g, review, reviewPending: false, updatedAt: Date.now() }
                    : g
            ),
        }));
        get()._syncToFirestore();
    },

    toggleReviewPending: (gameId) => {
        set((state) => ({
            games: state.games.map((g) =>
                g.id === gameId
                    ? { ...g, reviewPending: !g.reviewPending, updatedAt: Date.now() }
                    : g
            ),
        }));
        get()._syncToFirestore();
    },

    setLoading: (loading) => set({ isLoading: loading }),

    _syncToFirestore: () => {
        const { games, folders, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { games, folders });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            let folders = data.folders || [];
            // Ensure CENTRAL_FOLDER exists
            if (!folders.some(f => f.id === CENTRAL_FOLDER_ID)) {
                folders = [CENTRAL_FOLDER, ...folders];
            }
            set({
                games: data.games || [],
                folders,
                isLoading: false,
                _initialized: true
            });
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({ games: [], folders: [CENTRAL_FOLDER], isLoading: true, _initialized: false });
    }
}));
