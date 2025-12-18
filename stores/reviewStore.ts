/**
 * Review Store - Journey review data with Firestore-first persistence
 */
import { create } from 'zustand';
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

export const useReviewStore = create<ReviewState>()((set, get) => ({
    reviewData: DEFAULT_REVIEW_DATA,
    isLoading: true,
    _initialized: false,

    addSnapshot: (snapshot) => {
        set((state) => {
            const existsForWeek = state.reviewData.snapshots.some(
                s => s.weekNumber === snapshot.weekNumber
            );
            if (existsForWeek) return state;
            return {
                reviewData: {
                    ...state.reviewData,
                    snapshots: [...state.reviewData.snapshots, snapshot],
                    lastSnapshotWeek: snapshot.weekNumber
                }
            };
        });
        get()._syncToFirestore();
    },

    addSnapshotWithImprovements: (snapshot, newImprovements) => {
        set((state) => {
            const existsForWeek = state.reviewData.snapshots.some(
                s => s.weekNumber === snapshot.weekNumber
            );
            if (existsForWeek) return state;
            return {
                reviewData: {
                    ...state.reviewData,
                    snapshots: [...state.reviewData.snapshots, snapshot],
                    improvements: [
                        ...state.reviewData.improvements,
                        ...newImprovements.filter(ni =>
                            !state.reviewData.improvements.some(pi => pi.title === ni.title)
                        )
                    ],
                    lastSnapshotWeek: snapshot.weekNumber
                }
            };
        });
        get()._syncToFirestore();
    },

    updateSnapshot: (id, updates) => {
        set((state) => ({
            reviewData: {
                ...state.reviewData,
                snapshots: state.reviewData.snapshots.map(s =>
                    s.id === id ? { ...s, ...updates } : s
                )
            }
        }));
        get()._syncToFirestore();
    },

    confirmSnapshot: (id) => {
        set((state) => ({
            reviewData: {
                ...state.reviewData,
                snapshots: state.reviewData.snapshots.map(s =>
                    s.id === id ? { ...s, status: 'CONFIRMED' as const } : s
                ),
                pendingSnapshot: undefined
            }
        }));
        get()._syncToFirestore();
    },

    skipSnapshot: (id) => {
        set((state) => ({
            reviewData: {
                ...state.reviewData,
                snapshots: state.reviewData.snapshots.map(s =>
                    s.id === id ? { ...s, status: 'SKIPPED' as const } : s
                ),
                pendingSnapshot: undefined
            }
        }));
        get()._syncToFirestore();
    },

    setPendingSnapshot: (snapshot) => {
        set((state) => ({
            reviewData: { ...state.reviewData, pendingSnapshot: snapshot }
        }));
        get()._syncToFirestore();
    },

    addImprovement: (improvement) => {
        set((state) => ({
            reviewData: {
                ...state.reviewData,
                improvements: [...state.reviewData.improvements, improvement]
            }
        }));
        get()._syncToFirestore();
    },

    updateImprovement: (id, updates) => {
        set((state) => ({
            reviewData: {
                ...state.reviewData,
                improvements: state.reviewData.improvements.map(i =>
                    i.id === id ? { ...i, ...updates } : i
                )
            }
        }));
        get()._syncToFirestore();
    },

    markImprovementAddressed: (id) => {
        set((state) => ({
            reviewData: {
                ...state.reviewData,
                improvements: state.reviewData.improvements.map(i =>
                    i.id === id ? { ...i, isAddressed: true } : i
                )
            }
        }));
        get()._syncToFirestore();
    },

    toggleImprovementAddressed: (id) => {
        set((state) => ({
            reviewData: {
                ...state.reviewData,
                improvements: state.reviewData.improvements.map(i =>
                    i.id === id ? { ...i, isAddressed: !i.isAddressed } : i
                )
            }
        }));
        get()._syncToFirestore();
    },

    setFinalSummary: (summary) => {
        set((state) => ({
            reviewData: { ...state.reviewData, finalSummary: summary }
        }));
        get()._syncToFirestore();
    },

    setReviewData: (data) => {
        set({ reviewData: data });
        get()._syncToFirestore();
    },

    setLoading: (loading) => set({ isLoading: loading }),

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

            set({
                reviewData: { ...data.reviewData, snapshots },
                isLoading: false,
                _initialized: true
            });
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({ reviewData: DEFAULT_REVIEW_DATA, isLoading: true, _initialized: false });
    }
}));
