/**
 * Review Store - Journey review data with Firestore-first persistence
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { JourneyReviewData, WeeklySnapshot, ImprovementPoint, FinalJourneySummary } from '../types';
import { writeToFirestore } from './firestoreSync';

const STORE_KEY = 'p67_review_store';

const DEFAULT_REVIEW_DATA: JourneyReviewData = {
    snapshots: [],
    improvements: [],
    lastSnapshotWeek: 0
};

interface ReviewState {
    reviewData: JourneyReviewData;
    isLoading: boolean;
    _initialized: boolean;

    addSnapshot: (snapshot: WeeklySnapshot) => void;
    addSnapshotWithImprovements: (snapshot: WeeklySnapshot, newImprovements: ImprovementPoint[]) => void;
    updateSnapshot: (id: string, updates: Partial<WeeklySnapshot>) => void;
    confirmSnapshot: (id: string) => void;
    skipSnapshot: (id: string) => void;
    setPendingSnapshot: (snapshot: WeeklySnapshot | undefined) => void;

    addImprovement: (improvement: ImprovementPoint) => void;
    updateImprovement: (id: string, updates: Partial<ImprovementPoint>) => void;
    markImprovementAddressed: (id: string) => void;
    toggleImprovementAddressed: (id: string) => void;

    setFinalSummary: (summary: FinalJourneySummary) => void;
    setReviewData: (data: JourneyReviewData) => void;

    setLoading: (loading: boolean) => void;

    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { reviewData: JourneyReviewData } | null) => void;
    _reset: () => void;
}

export const useReviewStore = create<ReviewState>()(immer((set, get) => ({
    reviewData: DEFAULT_REVIEW_DATA,
    isLoading: true,
    _initialized: false,

    addSnapshot: (snapshot) => {
        set((state) => {
            const existsForWeek = state.reviewData.snapshots.some(
                s => s.weekNumber === snapshot.weekNumber
            );
            if (existsForWeek) return;
            state.reviewData.snapshots.push(snapshot);
            state.reviewData.lastSnapshotWeek = snapshot.weekNumber;
        });
        get()._syncToFirestore();
    },

    addSnapshotWithImprovements: (snapshot, newImprovements) => {
        set((state) => {
            const existsForWeek = state.reviewData.snapshots.some(
                s => s.weekNumber === snapshot.weekNumber
            );
            if (existsForWeek) return;

            state.reviewData.snapshots.push(snapshot);
            state.reviewData.lastSnapshotWeek = snapshot.weekNumber;

            // Add non-duplicate improvements
            for (const ni of newImprovements) {
                if (!state.reviewData.improvements.some(pi => pi.title === ni.title)) {
                    state.reviewData.improvements.push(ni);
                }
            }
        });
        get()._syncToFirestore();
    },

    updateSnapshot: (id, updates) => {
        set((state) => {
            const snapshot = state.reviewData.snapshots.find(s => s.id === id);
            if (snapshot) Object.assign(snapshot, updates);
        });
        get()._syncToFirestore();
    },

    confirmSnapshot: (id) => {
        set((state) => {
            const snapshot = state.reviewData.snapshots.find(s => s.id === id);
            if (snapshot) snapshot.status = 'CONFIRMED';
            state.reviewData.pendingSnapshot = undefined;
        });
        get()._syncToFirestore();
    },

    skipSnapshot: (id) => {
        set((state) => {
            const snapshot = state.reviewData.snapshots.find(s => s.id === id);
            if (snapshot) snapshot.status = 'SKIPPED';
            state.reviewData.pendingSnapshot = undefined;
        });
        get()._syncToFirestore();
    },

    setPendingSnapshot: (snapshot) => {
        set((state) => {
            state.reviewData.pendingSnapshot = snapshot;
        });
        get()._syncToFirestore();
    },

    addImprovement: (improvement) => {
        set((state) => {
            state.reviewData.improvements.push(improvement);
        });
        get()._syncToFirestore();
    },

    updateImprovement: (id, updates) => {
        set((state) => {
            const improvement = state.reviewData.improvements.find(i => i.id === id);
            if (improvement) Object.assign(improvement, updates);
        });
        get()._syncToFirestore();
    },

    markImprovementAddressed: (id) => {
        set((state) => {
            const improvement = state.reviewData.improvements.find(i => i.id === id);
            if (improvement) improvement.isAddressed = true;
        });
        get()._syncToFirestore();
    },

    toggleImprovementAddressed: (id) => {
        set((state) => {
            const improvement = state.reviewData.improvements.find(i => i.id === id);
            if (improvement) improvement.isAddressed = !improvement.isAddressed;
        });
        get()._syncToFirestore();
    },

    setFinalSummary: (summary) => {
        set((state) => {
            state.reviewData.finalSummary = summary;
        });
        get()._syncToFirestore();
    },

    setReviewData: (data) => {
        set((state) => {
            state.reviewData = data;
        });
        get()._syncToFirestore();
    },

    setLoading: (loading) => set((state) => { state.isLoading = loading; }),

    _syncToFirestore: () => {
        const { reviewData, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { reviewData });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data?.reviewData) {
            // Deduplicate snapshots by weekNumber
            let snapshots = data.reviewData.snapshots || [];
            const seenWeeks = new Set<number>();
            snapshots = snapshots.filter(s => {
                if (seenWeeks.has(s.weekNumber)) return false;
                seenWeeks.add(s.weekNumber);
                return true;
            });

            set((state) => {
                state.reviewData = { ...data.reviewData, snapshots };
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
            state.reviewData = DEFAULT_REVIEW_DATA;
            state.isLoading = true;
            state._initialized = false;
        });
    }
})));

