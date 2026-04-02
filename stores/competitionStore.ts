import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { CompetitionDailyRecord, CompetitionState } from '../types';
import { writeToFirestore } from './firestoreSync';
import { COMPETITION_ENGINE_VERSION, migrateCompetitionDailyRecord } from '../utils/competitionEngine';

const STORE_KEY = 'p67_competition_store';

const createInitialCompetitionState = (): CompetitionState => ({
    competitionStartedAt: null,
    engineVersion: COMPETITION_ENGINE_VERSION,
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
        activityScore: left.activityScore,
        maxScore: left.maxScore,
        theoreticalMaxScore: left.theoreticalMaxScore,
        completionRate: left.completionRate,
        availabilityRate: left.availabilityRate,
        difficultyMultiplier: left.difficultyMultiplier,
        remainingScore: left.remainingScore,
        breakdown: left.breakdown,
    }) === JSON.stringify({
        date: right.date,
        projectDay: right.projectDay,
        score: right.score,
        activityScore: right.activityScore,
        maxScore: right.maxScore,
        theoreticalMaxScore: right.theoreticalMaxScore,
        completionRate: right.completionRate,
        availabilityRate: right.availabilityRate,
        difficultyMultiplier: right.difficultyMultiplier,
        remainingScore: right.remainingScore,
        breakdown: right.breakdown,
    });
};

interface CompetitionStoreState {
    competition: CompetitionState;
    isLoading: boolean;
    _initialized: boolean;
    initializeCompetition: (startedAt?: number) => void;
    upsertDailyRecord: (record: CompetitionDailyRecord) => void;
    setCompetitionStartedAt: (startedAt: number) => void;
    setLoading: (loading: boolean) => void;
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { competition: CompetitionState } | null) => void;
    _reset: () => void;
}

const sanitizeCompetitionState = (input?: CompetitionState): CompetitionState => ({
    competitionStartedAt: input?.competitionStartedAt ?? null,
    engineVersion: COMPETITION_ENGINE_VERSION,
    dailyRecords: Object.fromEntries(
        Object.entries(input?.dailyRecords || {}).map(([date, record]) => [
            date,
            migrateCompetitionDailyRecord(record),
        ]),
    ),
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
            state.competition.engineVersion = COMPETITION_ENGINE_VERSION;
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
