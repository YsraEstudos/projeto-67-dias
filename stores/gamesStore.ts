/**
 * Games Store - Games with Firestore-first persistence
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
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

export const useGamesStore = create<GamesState>()(immer((set, get) => ({
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
            state.games.unshift(newGame);
        });
        get()._syncToFirestore();
    },

    updateGame: (id, updates) => {
        set((state) => {
            const game = state.games.find(g => g.id === id);
            if (!game) {
                console.warn(`[GamesStore] Attempted to update non-existent game: ${id}`);
                return;
            }
            Object.assign(game, updates);
            game.updatedAt = Date.now();
        });
        get()._syncToFirestore();
    },

    deleteGame: (id) => {
        set((state) => {
            const idx = state.games.findIndex(g => g.id === id);
            if (idx !== -1) state.games.splice(idx, 1);
        });
        get()._syncToFirestore();
    },

    moveGameToFolder: (gameId, folderId) => {
        set((state) => {
            const game = state.games.find(g => g.id === gameId);
            if (game) game.folderId = folderId || undefined;
        });
        get()._syncToFirestore();
    },

    createFolder: (name, color) => {
        set((state) => {
            state.folders.push({
                id: generateId(),
                name,
                color,
                createdAt: Date.now()
            });
        });
        get()._syncToFirestore();
    },

    deleteFolder: (folderId) => {
        set((state) => {
            const folder = state.folders.find(f => f.id === folderId);
            if (folder?.isProtected) {
                console.warn('[GamesStore] Cannot delete protected folder:', folder.name);
                return;
            }
            const folderIdx = state.folders.findIndex(f => f.id === folderId);
            if (folderIdx !== -1) state.folders.splice(folderIdx, 1);

            // Move games from deleted folder to no folder
            for (const game of state.games) {
                if (game.folderId === folderId) {
                    game.folderId = undefined;
                }
            }
        });
        get()._syncToFirestore();
    },

    updateFolder: (id, name, color) => {
        set((state) => {
            const folder = state.folders.find(f => f.id === id);
            if (folder) {
                folder.name = name;
                folder.color = color;
            }
        });
        get()._syncToFirestore();
    },

    addMission: (gameId, missionData) => {
        set((state) => {
            const game = state.games.find(g => g.id === gameId);
            if (!game) return;
            const newMission: GameMission = {
                id: generateId(),
                isCompleted: false,
                ...missionData,
            };
            game.missions.push(newMission);
            game.updatedAt = Date.now();
        });
        get()._syncToFirestore();
    },

    toggleMission: (gameId, missionId) => {
        set((state) => {
            const game = state.games.find(g => g.id === gameId);
            if (!game) return;
            const mission = game.missions.find(m => m.id === missionId);
            if (mission) {
                mission.isCompleted = !mission.isCompleted;
                game.updatedAt = Date.now();
            }
        });
        get()._syncToFirestore();
    },

    deleteMission: (gameId, missionId) => {
        set((state) => {
            const game = state.games.find(g => g.id === gameId);
            if (!game) return;
            const missionIdx = game.missions.findIndex(m => m.id === missionId);
            if (missionIdx !== -1) {
                game.missions.splice(missionIdx, 1);
                game.updatedAt = Date.now();
            }
        });
        get()._syncToFirestore();
    },

    logHours: (gameId, hours, date = new Date().toISOString()) => {
        set((state) => {
            const game = state.games.find(g => g.id === gameId);
            if (!game) return;
            const newLog: GameLog = {
                id: generateId(),
                date,
                hoursPlayed: hours,
            };
            game.history.push(newLog);
            game.hoursPlayed += hours;
            game.updatedAt = Date.now();
        });
        get()._syncToFirestore();
    },

    setGameReview: (gameId, review) => {
        set((state) => {
            const game = state.games.find(g => g.id === gameId);
            if (game) {
                game.review = review;
                game.reviewPending = false;
                game.updatedAt = Date.now();
            }
        });
        get()._syncToFirestore();
    },

    toggleReviewPending: (gameId) => {
        set((state) => {
            const game = state.games.find(g => g.id === gameId);
            if (game) {
                game.reviewPending = !game.reviewPending;
                game.updatedAt = Date.now();
            }
        });
        get()._syncToFirestore();
    },

    setLoading: (loading) => set((state) => { state.isLoading = loading; }),

    _syncToFirestore: () => {
        const { games, folders, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { games, folders });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            set((state) => {
                state.games = data.games || [];
                let folders = data.folders || [];
                // Ensure CENTRAL_FOLDER exists
                if (!folders.some(f => f.id === CENTRAL_FOLDER_ID)) {
                    folders = [CENTRAL_FOLDER, ...folders];
                }
                state.folders = folders;
                state.isLoading = false;
                state._initialized = true;
            });
        } else {
            set((state) => {
                state.isLoading = false;
                state._initialized = true;
            });
        }
    },

    _reset: () => {
        set((state) => {
            state.games = [];
            state.folders = [CENTRAL_FOLDER];
            state.isLoading = true;
            state._initialized = false;
        });
    }
})));

