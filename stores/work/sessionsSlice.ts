/**
 * Work Sessions Slice - History and session management
 */
import { StateCreator } from 'zustand';

export interface MetTargetSession {
    id: string;
    date: string;
    durationSeconds: number;
    ankiCount: number;
    ncmCount: number;
    tomorrowReady?: boolean;
    points: number; // Calculated: Math.floor(durationSeconds / 60) + (ankiCount * 2) + (ncmCount * 2) + (tomorrowReady ? 5 : 0)
    comment?: string;
}

export interface SessionsSlice {
    history: MetTargetSession[];
    addSession: (session: MetTargetSession) => void;
    updateSession: (id: string, updates: Partial<MetTargetSession>) => void;
    deleteSession: (id: string) => void;
    clearHistory: () => void;
}

export const createSessionsSlice: StateCreator<
    SessionsSlice,
    [],
    [],
    SessionsSlice
> = (set) => ({
    history: [],

    addSession: (session) => set((state) => ({
        history: [...state.history, session]
    })),

    updateSession: (id, updates) => set((state) => ({
        history: state.history.map(s => s.id === id ? { ...s, ...updates } : s)
    })),

    deleteSession: (id) => set((state) => ({
        history: state.history.filter(s => s.id !== id)
    })),

    clearHistory: () => set({ history: [] }),
});
