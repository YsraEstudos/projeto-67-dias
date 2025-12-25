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

    addSession: (session) => set((state) => {
        state.history.push(session);
    }),

    updateSession: (id, updates) => set((state) => {
        const session = state.history.find(s => s.id === id);
        if (session) Object.assign(session, updates);
    }),

    deleteSession: (id) => set((state) => {
        const idx = state.history.findIndex(s => s.id === id);
        if (idx !== -1) state.history.splice(idx, 1);
    }),

    clearHistory: () => set((state) => {
        state.history = [];
    }),
});

