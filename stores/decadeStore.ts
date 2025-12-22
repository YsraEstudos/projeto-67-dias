/**
 * Decade Store - Gerencia o progresso de longo prazo (10 Anos / 55 Ciclos)
 * Persistence: Firestore-first (similar a reviewStore e configStore)
 */
import { create } from 'zustand';
import { DecadeProgress, CycleSnapshot, JourneyReviewData } from '../types';
import { writeToFirestore } from './firestoreSync';
import { createCycleSnapshot } from '../services/decadeCycle';

const STORE_KEY = 'p67_decade_store';

const DEFAULT_DECADE_PROGRESS: DecadeProgress = {
    currentCycle: 1,
    cycleHistory: [],
    decadeStartDate: new Date().toISOString(),
    isDecadeComplete: false,
    pendingCycleGoal: ''
};

interface DecadeState {
    decadeData: DecadeProgress;
    isLoading: boolean;
    _initialized: boolean;

    // Actions
    initializeDecade: () => void;
    setCycleGoal: (goal: string) => void;

    /**
     * Completa o ciclo atual, arquiva os dados e prepara para o próximo.
     * @param reviewData Dados atuais da jornada para gerar o snapshot
     * @param goalAchieved Auto-avaliação do usuário sobre o objetivo
     * @param cycleStartDate Data de início do ciclo que está encerrando
     */
    completeCycle: (
        reviewData: JourneyReviewData,
        goalAchieved: 'YES' | 'PARTIAL' | 'NO',
        cycleStartDate: string
    ) => void;

    // Internal sync methods
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { decadeData: DecadeProgress } | null) => void;
    _reset: () => void;
}

export const useDecadeStore = create<DecadeState>()((set, get) => ({
    decadeData: DEFAULT_DECADE_PROGRESS,
    isLoading: true,
    _initialized: false,

    initializeDecade: () => {
        set(state => {
            if (state.decadeData.currentCycle > 1) return state; // Já iniciado
            return {
                decadeData: {
                    ...state.decadeData,
                    decadeStartDate: new Date().toISOString()
                }
            };
        });
        get()._syncToFirestore();
    },

    setCycleGoal: (goal: string) => {
        set(state => ({
            decadeData: {
                ...state.decadeData,
                pendingCycleGoal: goal
            }
        }));
        // Debounce write could be handled by firestoreSync hook, but direct write here is fine for occasional updates
        get()._syncToFirestore();
    },

    completeCycle: (reviewData, goalAchieved, cycleStartDate) => {
        set(state => {
            const currentCycleNum = state.decadeData.currentCycle;
            const goal = state.decadeData.pendingCycleGoal || '';

            // 1. Criar snapshot do ciclo atual
            const newSnapshot = createCycleSnapshot(
                currentCycleNum,
                reviewData,
                goal,
                cycleStartDate,
                goalAchieved
            );

            // 2. Atualizar histórico e incrementar ciclo
            const nextCycle = currentCycleNum + 1;
            const isComplete = nextCycle > 55;

            return {
                decadeData: {
                    ...state.decadeData,
                    cycleHistory: [...state.decadeData.cycleHistory, newSnapshot],
                    currentCycle: isComplete ? 55 : nextCycle,
                    isDecadeComplete: isComplete,
                    pendingCycleGoal: '' // Limpar para o próximo ciclo
                }
            };
        });
        get()._syncToFirestore();
    },

    _syncToFirestore: () => {
        const { decadeData, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { decadeData });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data?.decadeData) {
            set({
                decadeData: { ...DEFAULT_DECADE_PROGRESS, ...data.decadeData },
                isLoading: false,
                _initialized: true
            });
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({
            decadeData: DEFAULT_DECADE_PROGRESS,
            isLoading: true,
            _initialized: false
        });
    }
}));
