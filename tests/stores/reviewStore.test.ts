import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../stores/firestoreSync', () => ({
  writeToFirestore: vi.fn(),
}));

import { useReviewStore } from '../../stores/reviewStore';

describe('reviewStore migration/normalization', () => {
  beforeEach(() => {
    useReviewStore.getState()._reset();
  });

  it('normalizes legacy snapshots during hydrate and deduplicates by week', () => {
    useReviewStore.getState()._hydrateFromFirestore({
      reviewData: {
        snapshots: [
          {
            id: 'w2-old',
            weekNumber: 2,
            startDate: '2025-01-08',
            endDate: '2025-01-14',
            capturedAt: 2,
            metrics: {
              habitsCompleted: 5,
              habitsTotal: 10,
              habitConsistency: 50,
              booksProgress: 40,
              booksCompleted: 0,
              skillMinutes: 120,
              skillsProgressed: ['s1'],
              tasksCompleted: 2,
              journalEntries: 0,
            },
            evolution: {
              habitsChange: 0,
              skillsChange: 0,
              readingChange: 0,
              overallScore: 45,
              trend: 'STABLE',
            },
            status: 'CONFIRMED',
          },
          {
            id: 'w1-old',
            weekNumber: 1,
            startDate: '2025-01-01',
            endDate: '2025-01-07',
            capturedAt: 1,
            metrics: {
              habitsCompleted: 2,
              habitsTotal: 10,
              habitConsistency: 20,
              booksProgress: 10,
              booksCompleted: 0,
              skillMinutes: 60,
              skillsProgressed: [],
              tasksCompleted: 1,
              journalEntries: 0,
            },
            status: 'CONFIRMED',
          },
          {
            id: 'w2-duplicate',
            weekNumber: 2,
            startDate: '2025-01-08',
            endDate: '2025-01-14',
            capturedAt: 3,
            metrics: {
              habitsCompleted: 99,
              habitsTotal: 99,
              habitConsistency: 99,
              booksProgress: 99,
              booksCompleted: 1,
              skillMinutes: 999,
              skillsProgressed: [],
              tasksCompleted: 9,
              journalEntries: 9,
            },
            status: 'CONFIRMED',
          },
        ],
        improvements: [],
        lastSnapshotWeek: 2,
      },
    } as any);

    const snapshots = useReviewStore.getState().reviewData.snapshots;
    expect(snapshots).toHaveLength(2);
    expect(snapshots[0].weekNumber).toBe(1);
    expect(snapshots[1].weekNumber).toBe(2);

    expect(snapshots[1].metrics.gamesHoursPlayed).toBe(0);
    expect(snapshots[1].metrics.gamesCompleted).toBe(0);
    expect(snapshots[1].metrics.gamesReviewed).toBe(0);
    expect(snapshots[1].metrics.sitesUpdated).toBe(0);
    expect(snapshots[1].metrics.linksClicked).toBe(0);
    expect(snapshots[1].evolution?.linksChange).toBe(0);
  });

  it('normalizes data in setReviewData for runtime updates', () => {
    useReviewStore.getState().setReviewData({
      snapshots: [
        {
          id: 'legacy',
          weekNumber: 1,
          startDate: '2025-01-01',
          endDate: '2025-01-07',
          capturedAt: 1,
          metrics: {
            habitsCompleted: 1,
            habitsTotal: 2,
            habitConsistency: 50,
            booksProgress: 0,
            booksCompleted: 0,
            skillMinutes: 0,
            skillsProgressed: [],
            tasksCompleted: 0,
            journalEntries: 0,
          },
          status: 'CONFIRMED',
        },
      ],
      improvements: [],
      lastSnapshotWeek: 1,
    } as any);

    const snapshot = useReviewStore.getState().reviewData.snapshots[0];
    expect(snapshot.metrics.sitesUpdated).toBe(0);
    expect(snapshot.metrics.linksClicked).toBe(0);
    expect(snapshot.metrics.gamesHoursPlayed).toBe(0);
  });
});
