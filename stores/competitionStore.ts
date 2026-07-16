import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { CompetitionDailyRecord, CompetitionScoreBreakdown, CompetitionState } from '../types';
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
    return left.date === right.date
        && left.projectDay === right.projectDay
        && left.score === right.score
        && left.activityScore === right.activityScore
        && left.maxScore === right.maxScore
        && left.theoreticalMaxScore === right.theoreticalMaxScore
        && left.completionRate === right.completionRate
        && left.availabilityRate === right.availabilityRate
        && left.difficultyMultiplier === right.difficultyMultiplier
        && left.remainingScore === right.remainingScore
        && left.breakdown.length === right.breakdown.length
        && left.breakdown.every((entry, index) => {
            const candidate = right.breakdown[index];
            return entry.id === candidate.id
                && entry.label === candidate.label
                && entry.points === candidate.points
                && entry.maxPoints === candidate.maxPoints
                && entry.remainingPoints === candidate.remainingPoints
                && entry.summary === candidate.summary
                && entry.priority === candidate.priority;
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
