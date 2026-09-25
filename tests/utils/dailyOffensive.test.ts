import { describe, it, expect } from 'vitest';
import { calculateReadingProgress, calculateSkillProgress, calculateDailyOffensiveAdvanced } from '../../utils/dailyOffensiveUtils';
import { Book, Skill, ProjectConfig } from '../../types';
import { DEFAULT_OFFENSIVE_GOALS } from '../../stores/configStore';
import { getTodayISO } from '../../utils/dateUtils';

const today = getTodayISO();

describe('Daily Offensive Advanced Utils', () => {
    describe('calculateReadingProgress', () => {
        it('counts only pages read today', () => {
            const books = [{
                id: 'b1',
                dailyGoal: 20,
                status: 'READING',
                current: 80,
                total: 200,
                logs: [{ date: today, pagesRead: 10 }],
            }] as unknown as Book[];

            expect(calculateReadingProgress(books)).toBe(50);
        });

        it('does not give reading progress for old accumulated progress without log today', () => {
            const books = [{
                id: 'b1',
                dailyGoal: 20,
                status: 'READING',
                current: 80,
                total: 200,
                logs: [],
            }] as unknown as Book[];

            expect(calculateReadingProgress(books)).toBe(0);
        });
    });

    describe('calculateDailyOffensiveAdvanced', () => {
        const mockBooks = [{ id: '1', dailyGoal: 10, status: 'READING', logs: [{ date: today, pagesRead: 10 }] }] as unknown as Book[]; // 100%
        const mockSkills = [{ id: 's1', goalMinutes: 1340, logs: [{ date: today, minutes: 20 }] }] as unknown as Skill[]; // ~100% (20min req)

        it('should verify balanced weights calculation (60/40)', () => {
            // Setup: 100% Reading, 0% Skills
            // Weights: Skills 60, Reading 40
            const config = {
                ...DEFAULT_OFFENSIVE_GOALS,
                categoryWeights: { skills: 60, reading: 40 }
            };

            const result = calculateDailyOffensiveAdvanced(
                mockBooks, // 100%
                [],        // 0%
                config
            );

            // Calculation: (0 * 0.6) + (100 * 0.4) = 40
            expect(result.readingProgress).toBe(100);
            expect(result.skillProgress).toBe(0);
            expect(result.weightedProgress).toBe(40);
            expect(result.isOffensive).toBe(false); // 40 < 50
        });

        it('should activate offensive if weighted progress >= minPercentage', () => {
            // Setup: 100% Reading, 100% Skills
            // Weights: Skills 60, Reading 40
            // Expected: 60 + 40 = 100%

            const config = {
                ...DEFAULT_OFFENSIVE_GOALS,
                categoryWeights: { skills: 60, reading: 40 },
                minimumPercentage: 70
            };

            const result = calculateDailyOffensiveAdvanced(
                mockBooks,
                mockSkills,
                config
            );

            expect(result.weightedProgress).toBe(100);
            expect(result.isOffensive).toBe(true);
        });

        it('should handle Focus Skills with individual weights', () => {
            // Skill 1: 100% progress, Weight 80
            // Skill 2: 0% progress, Weight 20
            // Category Weight: Skills 100% (to isolate test)

            const skills = [
                { id: 's1', goalMinutes: 1340, logs: [{ date: today, minutes: 20 }] }, // 100%
                { id: 's2', goalMinutes: 1340, logs: [] } // 0%
            ] as unknown as Skill[];

            const config = {
                ...DEFAULT_OFFENSIVE_GOALS,
                categoryWeights: { skills: 100, reading: 0 },
                focusSkills: [
                    { skillId: 's1', weight: 80 },
                    { skillId: 's2', weight: 20 }
                ]
            };

            const result = calculateDailyOffensiveAdvanced([], skills, config);

            // Skill Progress = (100 * 0.8) + (0 * 0.2) = 80%
            expect(result.skillProgress).toBe(80);
            expect(result.weightedProgress).toBe(80);
        });
    });

    describe('Module Toggles', () => {
        const mockBooks = [{ id: '1', dailyGoal: 10, status: 'READING', logs: [{ date: today, pagesRead: 10 }] }] as unknown as Book[]; // 100%
        const mockSkills = [{ id: 's1', goalMinutes: 1340, logs: [{ date: today, minutes: 20 }] }] as unknown as Skill[]; // 100%

        it('should ignore disabled modules in calculation', () => {
            const config = {
                ...DEFAULT_OFFENSIVE_GOALS,
                enabledModules: { skills: true, reading: false },
                categoryWeights: { skills: 60, reading: 40 }
            };

            const result = calculateDailyOffensiveAdvanced(
                mockBooks,  // 100% (mas ignorado)
                mockSkills, // 100%
                config
            );

            // Apenas skills conta, normalizado para 100% do peso
            expect(result.skillProgress).toBe(100);
            expect(result.readingProgress).toBe(0); // Desativado
            expect(result.weightedProgress).toBe(100);
            expect(result.categoryBreakdown.skills.enabled).toBe(true);
            expect(result.categoryBreakdown.reading.enabled).toBe(false);
        });

        it('should re-distribute weights among active modules', () => {
            // Skills (60), Reading (40) -> Disable Reading -> Skills becomes 100%
            const config = {
                ...DEFAULT_OFFENSIVE_GOALS,
                enabledModules: { skills: true, reading: false },
                categoryWeights: { skills: 60, reading: 40 }
            };

            const result = calculateDailyOffensiveAdvanced(
                mockBooks,
                mockSkills,
                config
            );

            expect(result.weightedProgress).toBe(100);
        });

        it('should handle all modules disabled gracefully', () => {
            const config = {
                ...DEFAULT_OFFENSIVE_GOALS,
                enabledModules: { skills: false, reading: false }
            };

            const result = calculateDailyOffensiveAdvanced(mockBooks, mockSkills, config);
            expect(result.weightedProgress).toBe(0);
            expect(result.isOffensive).toBe(false);
        });
    });
});
