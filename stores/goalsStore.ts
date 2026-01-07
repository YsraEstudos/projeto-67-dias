/**
 * Goals Store - Metas anuais com links vinculados e Firestore-first persistence
 */
import { create } from 'zustand';
import { writeToFirestore } from './firestoreSync';
import { YearlyGoal, GoalLink, GoalStatus } from '../types';

const STORE_KEY = 'p67_goals_store';

const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

interface GoalsState {
    goals: YearlyGoal[];
    isLoading: boolean;
    _initialized: boolean;

    // CRUD Actions
    setGoals: (goals: YearlyGoal[]) => void;
    addGoal: (goal: YearlyGoal) => void;
    updateGoal: (id: string, updates: Partial<YearlyGoal>) => void;
    deleteGoal: (id: string) => void;

    // Status Actions
    setGoalStatus: (id: string, status: GoalStatus) => void;

    // Link Actions
    addLinkToGoal: (goalId: string, link: GoalLink) => void;
    removeLinkFromGoal: (goalId: string, linkId: string) => void;
    updateGoalLink: (goalId: string, linkId: string, updates: Partial<GoalLink>) => void;

    // Helpers
    getGoalsByYear: (year: number) => YearlyGoal[];
    getGoalsByStatus: (status: GoalStatus) => YearlyGoal[];

    setLoading: (loading: boolean) => void;
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { goals: YearlyGoal[] } | null) => void;
    _reset: () => void;
}

export const useGoalsStore = create<GoalsState>()((set, get) => ({
    goals: [],
    isLoading: true,
    _initialized: false,

    // --- CRUD Actions ---

    setGoals: (goals) => {
        set({ goals: deduplicateById(goals) });
        get()._syncToFirestore();
    },

    addGoal: (goal) => {
        set((state) => ({ goals: [...state.goals, goal] }));
        get()._syncToFirestore();
    },

    updateGoal: (id, updates) => {
        set((state) => ({
            goals: state.goals.map(g =>
                g.id === id ? { ...g, ...updates, updatedAt: Date.now() } : g
            )
        }));
        get()._syncToFirestore();
    },

    deleteGoal: (id) => {
        set((state) => ({ goals: state.goals.filter(g => g.id !== id) }));
        get()._syncToFirestore();
    },

    // --- Status Actions ---

    setGoalStatus: (id, status) => {
        set((state) => ({
            goals: state.goals.map(g => {
                if (g.id !== id) return g;
                return {
                    ...g,
                    status,
                    achievedAt: status === 'ACHIEVED' ? Date.now() : undefined,
                    updatedAt: Date.now()
                };
            })
        }));
        get()._syncToFirestore();
    },

    // --- Link Actions ---

    addLinkToGoal: (goalId, link) => {
        set((state) => ({
            goals: state.goals.map(g => {
                if (g.id !== goalId) return g;
                return {
                    ...g,
                    links: [...g.links, link],
                    updatedAt: Date.now()
                };
            })
        }));
        get()._syncToFirestore();
    },

    removeLinkFromGoal: (goalId, linkId) => {
        set((state) => ({
            goals: state.goals.map(g => {
                if (g.id !== goalId) return g;
                return {
                    ...g,
                    links: g.links.filter(l => l.id !== linkId),
                    updatedAt: Date.now()
                };
            })
        }));
        get()._syncToFirestore();
    },

    updateGoalLink: (goalId, linkId, updates) => {
        set((state) => ({
            goals: state.goals.map(g => {
                if (g.id !== goalId) return g;
                return {
                    ...g,
                    links: g.links.map(l =>
                        l.id === linkId ? { ...l, ...updates } : l
                    ),
                    updatedAt: Date.now()
                };
            })
        }));
        get()._syncToFirestore();
    },

    // --- Helpers ---

    getGoalsByYear: (year) => get().goals.filter(g => g.year === year),

    getGoalsByStatus: (status) => get().goals.filter(g => g.status === status),

    setLoading: (loading) => set({ isLoading: loading }),

    // --- Firestore Sync ---

    _syncToFirestore: () => {
        const { goals, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { goals });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            set({
                goals: deduplicateById(data.goals || []),
                isLoading: false,
                _initialized: true
            });
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({ goals: [], isLoading: true, _initialized: false });
    }
}));
