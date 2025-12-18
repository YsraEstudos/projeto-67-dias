import { describe, it, expect } from 'vitest';
import { calculateReadingProgress, calculateSkillProgress, calculateGamesProgress, calculateDailyOffensiveAdvanced } from '../../utils/dailyOffensiveUtils';
import { Book, Skill, Game, ProjectConfig } from '../../types';
import { DEFAULT_OFFENSIVE_GOALS } from '../../stores/configStore';

const today = new Date().toISOString().split('T')[0];

describe('Daily Offensive Advanced Utils', () => {

    describe('calculateGamesProgress', () => {
        it('should return 0 when daily goal is invalid', () => {
            const games = [{ status: 'PLAYING', history: [{ date: today, hoursPlayed: 1 }] }] as unknown as Game[];
            expect(calculateGamesProgress(games, 0)).toBe(0);
        });

        it('should calculate correct percentage', () => {
            const games = [
                { status: 'PLAYING', history: [{ date: today, hoursPlayed: 1.5 }] }
            ] as unknown as Game[];
            expect(calculateGamesProgress(games, 3)).toBe(50); // 1.5 of 3 hours
        });

        it('should cap at 100%', () => {
            const games = [
                { status: 'PLAYING', history: [{ date: today, hoursPlayed: 5 }] }
            ] as unknown as Game[];
            expect(calculateGamesProgress(games, 3)).toBe(100);
        });

        it('should sum hours only from PLAYING games', () => {
            const games = [
                { status: 'PLAYING', history: [{ date: today, hoursPlayed: 1 }] },
                { status: 'COMPLETED', history: [{ date: today, hoursPlayed: 2 }] } // Should ignore
            ] as unknown as Game[];
            expect(calculateGamesProgress(games, 2)).toBe(50); // 1 hour of 2
        });
    });

    describe('calculateDailyOffensiveAdvanced', () => {
        const mockBooks = [{ id: '1', dailyGoal: 10, status: 'READING', logs: [{ date: today, pagesRead: 10 }] }] as unknown as Book[]; // 100%
        const mockSkills = [{ id: 's1', goalMinutes: 1340, logs: [{ date: today, minutes: 20 }] }] as unknown as Skill[]; // ~100% (20min req)
        const mockGames = [{ status: 'PLAYING', history: [{ date: today, hoursPlayed: 1 }] }] as unknown as Game[]; // 100% if goal=1

        it('should verify balanced weights calculation (50/30/20)', () => {
            // Setup: 100% Reading, 0% Skills, 0% Games
            // Weights: Skills 50, Reading 30, Games 20
            const config = {
                ...DEFAULT_OFFENSIVE_GOALS,
                categoryWeights: { skills: 50, reading: 30, games: 20 }
            };

            const result = calculateDailyOffensiveAdvanced(
                mockBooks, // 100%
                [],        // 0%
                [],        // 0%
                config
            );

            // Calculation: (0 * 0.5) + (100 * 0.3) + (0 * 0.2) = 30
            expect(result.readingProgress).toBe(100);
            expect(result.skillProgress).toBe(0);
            expect(result.weightedProgress).toBe(30);
            expect(result.isOffensive).toBe(false); // 30 < 50
        });

        it('should activate offensive if weighted progress >= minPercentage', () => {
            // Setup: 100% Reading, 100% Skills, 0% Games
            // Weights: Skills 50, Reading 30, Games 20
            // Expected: 50 + 30 = 80%

            const config = {
                ...DEFAULT_OFFENSIVE_GOALS,
                categoryWeights: { skills: 50, reading: 30, games: 20 },
                minimumPercentage: 70
            };

            const result = calculateDailyOffensiveAdvanced(
                mockBooks,
                mockSkills,
                [],
                config
            );

            expect(result.weightedProgress).toBe(80);
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
                categoryWeights: { skills: 100, reading: 0, games: 0 },
                focusSkills: [
                    { skillId: 's1', weight: 80 },
                    { skillId: 's2', weight: 20 }
                ]
            };

            const result = calculateDailyOffensiveAdvanced([], skills, [], config);

            // Skill Progress = (100 * 0.8) + (0 * 0.2) = 80%
            expect(result.skillProgress).toBe(80);
            expect(result.weightedProgress).toBe(80);
        });
    });
});
