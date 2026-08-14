/**
 * Conflict Store
 * 
 * Manages sync conflicts between local (offline) and remote (cloud) data.
 * When reconnecting, if both have changed, shows user a choice to keep one version.
 */
import { create } from 'zustand';

// Human-readable labels for collection keys
const COLLECTION_LABELS: Record<string, string> = {
    'p67_habits': 'Hábitos',
    'p67_reading': 'Leituras',
    'p67_skills': 'Habilidades',
    'p67_notes': 'Notas',
    'p67_games': 'Jogos',
    'p67_journal': 'Diário',
    'p67_project_config': 'Configurações',
    'p67_links': 'Links',
    'p67_prompts': 'Prompts',
    'p67_rest': 'Descanso',
    'p67_sunday': 'Domingo',
    'p67_timer': 'Timer',
    'p67_streak': 'Streak',
    'p67_work': 'Trabalho',
    'p67_review': 'Revisão',
    'p67_weekly_agenda': 'Agenda Semanal',
};

export interface Conflict {
    id: string;
    collectionKey: string;
    label: string;              // Human-readable label
    localData: unknown;
    remoteData: unknown;
    localTimestamp: number;
    remoteTimestamp: number;
    detectedAt: number;
}

interface ConflictState {
    conflicts: Conflict[];

    /** Add a new conflict to the queue */
    addConflict: (conflict: Omit<Conflict, 'id' | 'detectedAt' | 'label'>) => void;

    /** Resolve conflict by choosing local or remote version */
    resolveConflict: (id: string, choice: 'local' | 'remote') => {
        collectionKey: string;
        chosenData: unknown;
    } | null;

    /** Dismiss conflict without resolving (uses remote by default) */
    dismissConflict: (id: string) => void;

    /** Clear all conflicts */
    clearAll: () => void;

    /** Check if there are pending conflicts */
    hasPendingConflicts: () => boolean;
}

export const useConflictStore = create<ConflictState>()((set, get) => ({
    conflicts: [],

    addConflict: (conflict) => {
        const id = `conflict-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const label = COLLECTION_LABELS[conflict.collectionKey] || conflict.collectionKey;

        set((state) => ({
            conflicts: [
                ...state.conflicts,
                {
                    ...conflict,
                    id,
                    label,
                    detectedAt: Date.now(),
                }
            ]
        }));

        console.log(`[ConflictStore] New conflict detected for ${label}`);
    },

    resolveConflict: (id, choice) => {
        const conflict = get().conflicts.find(c => c.id === id);
        if (!conflict) return null;

        set((state) => ({
            conflicts: state.conflicts.filter(c => c.id !== id)
        }));

        console.log(`[ConflictStore] Resolved ${conflict.label}: chose ${choice}`);

        return {
            collectionKey: conflict.collectionKey,
            chosenData: choice === 'local' ? conflict.localData : conflict.remoteData,
        };
    },

    dismissConflict: (id) => {
        set((state) => ({
            conflicts: state.conflicts.filter(c => c.id !== id)
        }));
    },

    clearAll: () => {
        set({ conflicts: [] });
    },

    hasPendingConflicts: () => {
        return get().conflicts.length > 0;
    },
}));

// Helper to format relative time
export const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Há ${days} dia${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Há ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'Agora mesmo';
};

export default useConflictStore;
