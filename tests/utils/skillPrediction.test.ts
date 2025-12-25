/**
 * Tests for Skill Prediction Utilities
 */
import { describe, it, expect } from 'vitest';
import { calculateDailyRequirement } from '../../utils/skillPrediction';
import { Skill } from '../../types';
import { formatDateISO, addDaysToDate } from '../../utils/dateUtils';

// Helper to create a minimal skill for testing
const createMockSkill = (overrides: Partial<Skill> = {}): Skill => ({
    id: 'test-skill-1',
    name: 'Test Skill',
    level: 'Iniciante',
    currentMinutes: 0,
    goalMinutes: 600, // 10 hours
    resources: [],
    roadmap: [],
    logs: [],
    colorTheme: 'emerald',
    createdAt: Date.now(),
    goalType: 'TIME',
    pomodorosCompleted: 0,
    goalPomodoros: 24,
    ...overrides,
});

// Helper to get a date N days from now in YYYY-MM-DD format
const getFutureDate = (daysFromNow: number): string => {
    return formatDateISO(addDaysToDate(new Date(), daysFromNow));
};

describe('calculateDailyRequirement', () => {
    describe('when skill has no deadline', () => {
        it('should return null', () => {
            const skill = createMockSkill({ deadline: undefined });
            const result = calculateDailyRequirement(skill);
            expect(result).toBeNull();
        });
    });

    describe('when deadline has passed', () => {
        it('should return isExpired: true', () => {
            const skill = createMockSkill({
                deadline: getFutureDate(-1) // Yesterday
            });

            const result = calculateDailyRequirement(skill);

            expect(result).not.toBeNull();
            expect(result!.isExpired).toBe(true);
            expect(result!.remainingDays).toBe(0);
        });
    });

    describe('when skill with TIME goal type has future deadline', () => {
        it('should calculate hours per day within expected range', () => {
            // Deadline roughly 10 days away, 10 hours remaining
            const skill = createMockSkill({
                goalType: 'TIME',
                currentMinutes: 0,
                goalMinutes: 600, // 10 hours
                deadline: getFutureDate(10)
            });

            const result = calculateDailyRequirement(skill);

            expect(result).not.toBeNull();
            expect(result!.isExpired).toBe(false);
            // Due to timezone/time-of-day, days might be 9-11
            expect(result!.remainingDays).toBeGreaterThanOrEqual(9);
            expect(result!.remainingDays).toBeLessThanOrEqual(11);
            // Hours per day should be around 1h (between 0.9 and 1.2)
            expect(result!.hoursPerDay).toBeGreaterThanOrEqual(0.9);
            expect(result!.hoursPerDay).toBeLessThanOrEqual(1.2);
        });

        it('should account for progress already made', () => {
            // 10 hours goal, 5 hours done, ~5 days left
            const skill = createMockSkill({
                goalType: 'TIME',
                currentMinutes: 300, // 5 hours done
                goalMinutes: 600, // 10 hours total
                deadline: getFutureDate(5)
            });

            const result = calculateDailyRequirement(skill);

            expect(result).not.toBeNull();
            // 5 hours remaining / ~5 days = ~1h/day
            expect(result!.hoursPerDay).toBeGreaterThanOrEqual(0.8);
            expect(result!.hoursPerDay).toBeLessThanOrEqual(1.5);
        });
    });

    describe('when skill with POMODOROS goal type has future deadline', () => {
        it('should calculate correct pomodoros per day', () => {
            // 20 pomodoros goal, 10 done, ~5 days left
            const skill = createMockSkill({
                goalType: 'POMODOROS',
                pomodorosCompleted: 10,
                goalPomodoros: 20,
                deadline: getFutureDate(5)
            });

            const result = calculateDailyRequirement(skill);

            expect(result).not.toBeNull();
            // 10 remaining / ~5 days = ~2 pomodoros/day
            expect(result!.pomodorosPerDay).toBeGreaterThanOrEqual(1);
            expect(result!.pomodorosPerDay).toBeLessThanOrEqual(3);
            expect(result!.hoursPerDay).toBeGreaterThan(0);
        });
    });

    describe('when skill is already completed', () => {
        it('should return 0 for daily requirements', () => {
            const skill = createMockSkill({
                goalType: 'TIME',
                currentMinutes: 600,
                goalMinutes: 600,
                deadline: getFutureDate(5)
            });

            const result = calculateDailyRequirement(skill);

            expect(result).not.toBeNull();
            expect(result!.pomodorosPerDay).toBe(0);
            expect(result!.hoursPerDay).toBe(0);
            expect(result!.isExpired).toBe(false);
        });
    });

    describe('edge cases', () => {
        it('should handle deadline today', () => {
            const skill = createMockSkill({
                goalMinutes: 60,
                currentMinutes: 0,
                deadline: getFutureDate(0) // Today
            });

            const result = calculateDailyRequirement(skill);

            // Today as deadline - might be expired or have 0-1 days depending on time
            expect(result).not.toBeNull();
        });

        it('should handle very short deadline (1 day)', () => {
            const skill = createMockSkill({
                goalMinutes: 300, // 5 hours
                currentMinutes: 0,
                deadline: getFutureDate(1)
            });

            const result = calculateDailyRequirement(skill);

            expect(result).not.toBeNull();
            // Due to timezone, could be 0 or 1 day
            expect(result!.remainingDays).toBeLessThanOrEqual(1);
            // If not expired, hoursPerDay should be >= 5 (all work in remaining time)
            if (!result!.isExpired && result!.remainingDays > 0) {
                expect(result!.hoursPerDay).toBe(5);
            }
        });
    });
});
