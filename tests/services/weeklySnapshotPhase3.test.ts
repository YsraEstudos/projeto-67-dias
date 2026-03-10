import { describe, it, expect } from 'vitest';
import { calculateEvolution, calculateOverallScore } from '../../services/weeklySnapshot';
import { WeeklyMetrics } from '../../types';

const baseMetrics: WeeklyMetrics = {
  habitsCompleted: 10,
  habitsTotal: 14,
  habitConsistency: 71,
  booksProgress: 80,
  booksCompleted: 1,
  skillMinutes: 300,
  skillsProgressed: ['s1'],
  tasksCompleted: 4,
  journalEntries: 3,
  gamesHoursPlayed: 2,
  gamesCompleted: 0,
  gamesReviewed: 0,
  sitesUpdated: 1,
  linksClicked: 10,
};

describe('weeklySnapshot phase 3 regressions', () => {
  it('includes linksChange in evolution diff', () => {
    const previous: WeeklyMetrics = { ...baseMetrics, linksClicked: 2 };
    const current: WeeklyMetrics = { ...baseMetrics, linksClicked: 10 };

    const evolution = calculateEvolution(current, previous);
    expect(evolution.linksChange).toBe(8);
  });

  it('calculateOverallScore remains stable with legacy metrics missing links fields', () => {
    const legacyMetrics = {
      ...baseMetrics,
      sitesUpdated: undefined,
      linksClicked: undefined,
    } as unknown as WeeklyMetrics;

    const score = calculateOverallScore(legacyMetrics);
    expect(Number.isFinite(score)).toBe(true);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});
