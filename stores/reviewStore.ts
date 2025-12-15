/**
 * Review Store - Journey review data with Firebase persistence
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { JourneyReviewData, WeeklySnapshot, ImprovementPoint, FinalJourneySummary } from '../types';
import { createFirebaseStorage } from './persistMiddleware';

interface ReviewState {
    reviewData: JourneyReviewData;
    isLoading: boolean;

    // Snapshot Actions
    addSnapshot: (snapshot: WeeklySnapshot) => void;
    addSnapshotWithImprovements: (snapshot: WeeklySnapshot, newImprovements: ImprovementPoint[]) => void;
    updateSnapshot: (id: string, updates: Partial<WeeklySnapshot>) => void;
    confirmSnapshot: (id: string) => void;
    skipSnapshot: (id: string) => void;
    setPendingSnapshot: (snapshot: WeeklySnapshot | undefined) => void;

    // Improvement Actions
    addImprovement: (improvement: ImprovementPoint) => void;
    updateImprovement: (id: string, updates: Partial<ImprovementPoint>) => void;
    markImprovementAddressed: (id: string) => void;
    toggleImprovementAddressed: (id: string) => void;

    // Final Summary
    setFinalSummary: (summary: FinalJourneySummary) => void;

    // Full state
    setReviewData: (data: JourneyReviewData) => void;

    setLoading: (loading: boolean) => void;
}

const DEFAULT_REVIEW_DATA: JourneyReviewData = {
    snapshots: [],
    improvements: [],
    lastSnapshotWeek: 0
};

export const useReviewStore = create<ReviewState>()(
    persist(
        (set) => ({
            reviewData: DEFAULT_REVIEW_DATA,
            isLoading: true,

            // Snapshot Actions
            addSnapshot: (snapshot) => set((state) => {
                // Prevent duplicate snapshots for the same week
                const existsForWeek = state.reviewData.snapshots.some(
                    s => s.weekNumber === snapshot.weekNumber
                );
                if (existsForWeek) {
                    return state; // Don't add if already exists for this week
                }
                return {
                    reviewData: {
                        ...state.reviewData,
                        snapshots: [...state.reviewData.snapshots, snapshot],
                        lastSnapshotWeek: snapshot.weekNumber
                    }
                };
            }),

            addSnapshotWithImprovements: (snapshot, newImprovements) => set((state) => {
                // Prevent duplicate snapshots for the same week
                const existsForWeek = state.reviewData.snapshots.some(
                    s => s.weekNumber === snapshot.weekNumber
                );
                if (existsForWeek) {
                    return state; // Don't add if already exists for this week
                }
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
            }),

            updateSnapshot: (id, updates) => set((state) => ({
                reviewData: {
                    ...state.reviewData,
                    snapshots: state.reviewData.snapshots.map(s =>
                        s.id === id ? { ...s, ...updates } : s
                    )
                }
            })),

            confirmSnapshot: (id) => set((state) => ({
                reviewData: {
                    ...state.reviewData,
                    snapshots: state.reviewData.snapshots.map(s =>
                        s.id === id ? { ...s, status: 'CONFIRMED' as const } : s
                    ),
                    pendingSnapshot: undefined
                }
            })),

            skipSnapshot: (id) => set((state) => ({
                reviewData: {
                    ...state.reviewData,
                    snapshots: state.reviewData.snapshots.map(s =>
                        s.id === id ? { ...s, status: 'SKIPPED' as const } : s
                    ),
                    pendingSnapshot: undefined
                }
            })),

            setPendingSnapshot: (snapshot) => set((state) => ({
                reviewData: {
                    ...state.reviewData,
                    pendingSnapshot: snapshot
                }
            })),

            // Improvement Actions
            addImprovement: (improvement) => set((state) => ({
                reviewData: {
                    ...state.reviewData,
                    improvements: [...state.reviewData.improvements, improvement]
                }
            })),

            updateImprovement: (id, updates) => set((state) => ({
                reviewData: {
                    ...state.reviewData,
                    improvements: state.reviewData.improvements.map(i =>
                        i.id === id ? { ...i, ...updates } : i
                    )
                }
            })),

            markImprovementAddressed: (id) => set((state) => ({
                reviewData: {
                    ...state.reviewData,
                    improvements: state.reviewData.improvements.map(i =>
                        i.id === id ? { ...i, isAddressed: true } : i
                    )
                }
            })),

            toggleImprovementAddressed: (id) => set((state) => ({
                reviewData: {
                    ...state.reviewData,
                    improvements: state.reviewData.improvements.map(i =>
                        i.id === id ? { ...i, isAddressed: !i.isAddressed } : i
                    )
                }
            })),

            // Final Summary
            setFinalSummary: (summary) => set((state) => ({
                reviewData: {
                    ...state.reviewData,
                    finalSummary: summary
                }
            })),

            // Full state
            setReviewData: (data) => set({ reviewData: data }),

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'p67_review_store',
            storage: createFirebaseStorage('p67_review_store'),
            partialize: (state) => ({ reviewData: state.reviewData }),
            onRehydrateStorage: () => (state) => {
                // Clean up any duplicate snapshots (same weekNumber)
                if (state?.reviewData?.snapshots?.length) {
                    const seen = new Set<number>();
                    const uniqueSnapshots = state.reviewData.snapshots.filter(s => {
                        if (seen.has(s.weekNumber)) {
                            return false; // Skip duplicate
                        }
                        seen.add(s.weekNumber);
                        return true;
                    });

                    if (uniqueSnapshots.length !== state.reviewData.snapshots.length) {
                        // There were duplicates, update the store
                        state.setReviewData({
                            ...state.reviewData,
                            snapshots: uniqueSnapshots
                        });
                    }
                }
                state?.setLoading(false);
            },
        }
    )
);
