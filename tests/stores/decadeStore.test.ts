import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { writeToFirestore } from '../../stores/firestoreSync';
import { useDecadeStore } from '../../stores/decadeStore';
import { JourneyReviewData } from '../../types';

const emptyReview: JourneyReviewData = { snapshots: [], improvements: [], lastSnapshotWeek: 0 };

describe('decadeStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useDecadeStore.getState()._reset();
        useDecadeStore.getState()._hydrateFromFirestore(null);
    });

    it('initializeDecade sets the start date only once (not on every visit)', () => {
        vi.useFakeTimers();
        try {
            vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
            useDecadeStore.getState().initializeDecade();
            const first = useDecadeStore.getState().decadeData.decadeStartDate;
            expect(first).toBe('2026-01-01T10:00:00.000Z');

            vi.setSystemTime(new Date('2026-03-01T10:00:00Z'));
            useDecadeStore.getState().initializeDecade();
            expect(useDecadeStore.getState().decadeData.decadeStartDate).toBe(first);
        } finally {
            vi.useRealTimers();
        }
    });

    it('keeps the persisted start date after hydration', () => {
        useDecadeStore.getState()._reset();
        useDecadeStore.getState()._hydrateFromFirestore({
            decadeData: {
                currentCycle: 1,
                cycleHistory: [],
                decadeStartDate: '2025-05-05T00:00:00.000Z',
                isDecadeComplete: false,
            },
        });
        useDecadeStore.getState().initializeDecade();
        expect(useDecadeStore.getState().decadeData.decadeStartDate).toBe('2025-05-05T00:00:00.000Z');
    });

    it('trims the cycle goal', () => {
        useDecadeStore.getState().setCycleGoal('   Quero terminar meu portfólio inteiro   ');
        expect(useDecadeStore.getState().decadeData.pendingCycleGoal).toBe('Quero terminar meu portfólio inteiro');
    });

    it('completeCycle archives and advances the cycle', () => {
        useDecadeStore.getState().setCycleGoal('Objetivo suficientemente longo aqui');
        useDecadeStore.getState().completeCycle(emptyReview, 'YES', '2026-01-01T00:00:00.000Z');
        const { decadeData } = useDecadeStore.getState();
        expect(decadeData.currentCycle).toBe(2);
        expect(decadeData.cycleHistory).toHaveLength(1);
        expect(decadeData.pendingCycleGoal).toBe('');
        expect(writeToFirestore).toHaveBeenCalled();
    });

    it('does not append duplicate snapshots once the decade is complete', () => {
        useDecadeStore.setState((state) => {
            state.decadeData.currentCycle = 55;
        });
        useDecadeStore.getState().completeCycle(emptyReview, 'YES', '2026-01-01T00:00:00.000Z');
        expect(useDecadeStore.getState().decadeData.isDecadeComplete).toBe(true);
        expect(useDecadeStore.getState().decadeData.cycleHistory).toHaveLength(1);

        useDecadeStore.getState().completeCycle(emptyReview, 'NO', '2026-01-01T00:00:00.000Z');
        expect(useDecadeStore.getState().decadeData.cycleHistory).toHaveLength(1);
        expect(useDecadeStore.getState().decadeData.currentCycle).toBe(55);
    });
});
