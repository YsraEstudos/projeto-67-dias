import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { CompetitionDailyRecord, CompetitionRival, CompetitionState } from '../types';
import { writeToFirestore } from './firestoreSync';
import { COMPETITION_ENGINE_VERSION, createDefaultCompetitionRoster } from '../utils/competitionEngine';

const STORE_KEY = 'p67_competition_store';

const createInitialCompetitionState = (): CompetitionState => ({
    competitionStartedAt: null,
    engineVersion: COMPETITION_ENGINE_VERSION,
    roster: createDefaultCompetitionRoster(),
    dailyRecords: {},
    lastSyncedDate: null,
});

const areDailyRecordsEquivalent = (
    left?: CompetitionDailyRecord,
    right?: CompetitionDailyRecord,
) => {
    if (!left || !right) return false;
    return JSON.stringify({
        date: left.date,
        projectDay: left.projectDay,
        score: left.score,
        maxScore: left.maxScore,
        theoreticalMaxScore: left.theoreticalMaxScore,
        remainingScore: left.remainingScore,
        breakdown: left.breakdown,
    }) === JSON.stringify({
        date: right.date,
        projectDay: right.projectDay,
        score: right.score,
        maxScore: right.maxScore,
        theoreticalMaxScore: right.theoreticalMaxScore,
        remainingScore: right.remainingScore,
        breakdown: right.breakdown,
    });
};

interface CompetitionStoreState {
    competition: CompetitionState;
    isLoading: boolean;
    _initialized: boolean;
    initializeCompetition: (startedAt?: number) => void;
    setRoster: (roster: CompetitionRival[]) => void;
    upsertDailyRecord: (record: CompetitionDailyRecord) => void;
    setCompetitionStartedAt: (startedAt: number) => void;
    setLoading: (loading: boolean) => void;
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { competition: CompetitionState } | null) => void;
    _reset: () => void;
}

const sanitizeCompetitionState = (input?: CompetitionState): CompetitionState => ({
    competitionStartedAt: input?.competitionStartedAt ?? null,
    engineVersion: input?.engineVersion || COMPETITION_ENGINE_VERSION,
    roster: Array.isArray(input?.roster) && input!.roster.length > 0
        ? input!.roster
        : createDefaultCompetitionRoster(),
    dailyRecords: input?.dailyRecords || {},
    lastSyncedDate: input?.lastSyncedDate ?? null,
});

export const useCompetitionStore = create<CompetitionStoreState>()(immer((set, get) => ({
    competition: createInitialCompetitionState(),
    isLoading: true,
    _initialized: false,

    initializeCompetition: (startedAt = Date.now()) => {
        set((state) => {
            if (!state.competition.competitionStartedAt) {
                state.competition.competitionStartedAt = startedAt;
            }
            if (!state.competition.roster.length) {
                state.competition.roster = createDefaultCompetitionRoster();
            }
            state.competition.engineVersion = COMPETITION_ENGINE_VERSION;
        });
        get()._syncToFirestore();
    },

    setRoster: (roster) => {
        set((state) => {
            state.competition.roster = roster;
        });
        get()._syncToFirestore();
    },

    upsertDailyRecord: (record) => {
        const currentRecord = get().competition.dailyRecords[record.date];
        if (areDailyRecordsEquivalent(currentRecord, record)) {
            return;
        }

        set((state) => {
            if (!state.competition.competitionStartedAt) {
                state.competition.competitionStartedAt = Date.now();
            }
            state.competition.dailyRecords[record.date] = record;
            state.competition.lastSyncedDate = record.date;
            state.competition.engineVersion = COMPETITION_ENGINE_VERSION;
        });
        get()._syncToFirestore();
    },

    setCompetitionStartedAt: (startedAt) => {
        set((state) => {
            state.competition.competitionStartedAt = startedAt;
        });
        get()._syncToFirestore();
    },

    setLoading: (loading) => set((state) => {
        state.isLoading = loading;
    }),

    _syncToFirestore: () => {
        const { competition, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { competition });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data?.competition) {
            set((state) => {
                state.competition = sanitizeCompetitionState(data.competition);
                state.isLoading = false;
                state._initialized = true;
            });
            return;
        }

        set((state) => {
            state.competition = createInitialCompetitionState();
            state.isLoading = false;
            state._initialized = true;
        });
    },

    _reset: () => {
        set((state) => {
            state.competition = createInitialCompetitionState();
            state.isLoading = true;
            state._initialized = false;
        });
    },
})));
