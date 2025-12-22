import { describe, it, expect } from 'vitest';
import {
    calculateDecadeProgress,
    canFinalizeCycle,
    createCycleSnapshot,
    DECADE_CONFIG
} from '../../services/decadeCycle';
import { JourneyReviewData } from '../../types';

describe('decadeCycle Service', () => {
    describe('calculateDecadeProgress', () => {
        it('should return correct progress for start of cycle 1', () => {
            // Ciclo 1, Dia 0
            const progress = calculateDecadeProgress(1, 0);
            expect(progress.percentage).toBe(0);
            expect(progress.yearsElapsed).toBe(0);
        });

        it('should return correct progress for end of cycle 1', () => {
            // Ciclo 1, Dia 67
            const progress = calculateDecadeProgress(1, 67);

            // 67 dias de 3685
            const expectedPercent = (67 / DECADE_CONFIG.TOTAL_DAYS) * 100;
            expect(progress.percentage).toBeCloseTo(expectedPercent, 2);
            expect(progress.totalDaysPassed).toBe(67);
        });

        it('should handle cycle changes correctly (Cycle 2 Day 1)', () => {
            // Ciclo 2, Dia 1
            const progress = calculateDecadeProgress(2, 1);

            // (67 dias do ciclo 1) + 1 dia do ciclo 2 = 68 dias
            const expectedPercent = (68 / DECADE_CONFIG.TOTAL_DAYS) * 100;
            expect(progress.percentage).toBeCloseTo(expectedPercent, 2);
            expect(progress.totalDaysPassed).toBe(68);
        });
    });

    describe('canFinalizeCycle', () => {
        it('should fail if current day is less than 67', () => {
            const result = canFinalizeCycle(66, 'My goal for this cycle');
            expect(result.ready).toBe(false);
            expect(result.reason).toContain('dia 66');
        });

        it('should fail if goal is missing or too short', () => {
            const result = canFinalizeCycle(67, 'Too short');
            expect(result.ready).toBe(false);
            expect(result.reason).toContain('objetivo');
        });

        it('should succeed if day is 67 and goal is valid', () => {
            const validGoal = 'My valid goal that is definitely long enough for the check';
            const result = canFinalizeCycle(67, validGoal);
            expect(result.ready).toBe(true);
        });
    });

    describe('createCycleSnapshot', () => {
        it('should create a valid snapshot with correct mappings', () => {
            const mockReviewData: JourneyReviewData = {
                snapshots: [
                    {
                        weekNumber: 1,
                        startDate: '',
                        endDate: '',
                        metrics: {
                            habitsCompleted: 10,
                            habitConsistency: 80,
                            booksCompleted: 0,
                            booksProgress: 50,
                            skillMinutes: 120,
                            tasksCompleted: 5,
                            journalEntries: 3,
                            gamesSessions: 0
                        }
                    } as any
                ],
                improvements: [],
                lastSnapshotWeek: 1
            };

            const goal = 'My cycle goal testing';
            const startDate = '2025-01-01';

            const snapshot = createCycleSnapshot(1, mockReviewData, goal, startDate);

            expect(snapshot.cycleNumber).toBe(1);
            expect(snapshot.cycleGoal).toBe(goal);
            expect(snapshot.startDate).toBe(startDate);
            expect(snapshot.completedAt).toBeDefined();

            // Aggregated stats checks
            expect(snapshot.finalStats.totalHabitsCompleted).toBe(10);
            expect(snapshot.finalStats.averageConsistency).toBe(80);
            expect(snapshot.finalStats.totalSkillHours).toBe(2); // 120 mins / 60
        });
    });
});
