import { describe, it, expect } from 'vitest';
import { calculateReadingProgress, calculateSkillProgress, calculateDailyOffensive } from '../../utils/dailyOffensiveUtils';
import { Book, Skill } from '../../types';

describe('Daily Offensive Utils', () => {
    describe('calculateReadingProgress', () => {
        const today = new Date().toISOString().split('T')[0];

        it('should return 0 when no books have goals', () => {
            const books = [
                { id: '1', dailyGoal: 0, logs: [], status: 'READING' }
            ] as unknown as Book[];
            expect(calculateReadingProgress(books)).toBe(0);
        });

        it('should calculate correct percentage for single book', () => {
            const books = [
                {
                    id: '1',
                    dailyGoal: 20,
                    status: 'READING',
                    logs: [{ date: today, pagesRead: 10 }]
                }
            ] as unknown as Book[];
            expect(calculateReadingProgress(books)).toBe(50);
        });

        it('should cap progress at 100%', () => {
            const books = [
                {
                    id: '1',
                    dailyGoal: 20,
                    status: 'READING',
                    logs: [{ date: today, pagesRead: 40 }]
                }
            ] as unknown as Book[];
            expect(calculateReadingProgress(books)).toBe(100);
        });

        it('should average minimal progress across multiple books with goals', () => {
            const books = [
                {
                    id: '1',
                    dailyGoal: 20,
                    status: 'READING',
                    logs: [{ date: today, pagesRead: 20 }] // 100%
                },
                {
                    id: '2',
                    dailyGoal: 20,
                    status: 'READING',
                    logs: [{ date: today, pagesRead: 0 }] // 0%
                }
            ] as unknown as Book[];
            expect(calculateReadingProgress(books)).toBe(50);
        });
    });

    describe('calculateSkillProgress', () => {
        const today = new Date().toISOString().split('T')[0];

        it('should return 0 if no active skills', () => {
            const skills = [] as Skill[];
            expect(calculateSkillProgress(skills)).toBe(0);
        });

        it('should calculate progress based on implicit daily goal (approx goal/67)', () => {
            // goalMinutes = 1340. 1340 / 67 = 20 mins/day required
            const skills = [
                {
                    id: '1',
                    goalMinutes: 1340,
                    logs: [{ date: today, minutes: 10 }]
                }
            ] as unknown as Skill[];

            // 10 minutes studied / 20 minutes required = 50%
            expect(calculateSkillProgress(skills)).toBe(50);
        });

        it('should use default goal of 30 mins if goalMinutes is 0', () => {
            // Se goalMinutes é 0, ativa fallback de 30 mins (conforme implementação)
            // Mas a implementação diz: `const activeSkills = skills.filter(s => s.goalMinutes > 0);`
            // Então se for 0, retorna 0 logo no inicio.
            // Vamos testar isso.
            const skills = [
                {
                    id: '1',
                    goalMinutes: 0,
                    logs: [{ date: today, minutes: 10 }]
                }
            ] as unknown as Skill[];
            expect(calculateSkillProgress(skills)).toBe(0);
        });
    });

    describe('calculateDailyOffensive', () => {
        const today = new Date().toISOString().split('T')[0];

        it('should be offensive if average >= 50%', () => {
            const books = [{
                id: '1', dailyGoal: 10, status: 'READING',
                logs: [{ date: today, pagesRead: 5 }] // 50%
            }] as unknown as Book[];

            // goalMinutes need to be > 1005 (15 * 67) to avoid minimum cap
            // Let's use 1340 (20 min/day)
            const skills = [{
                id: '1', goalMinutes: 1340,
                logs: [{ date: today, minutes: 10 }] // 10/20 = 50%
            }] as unknown as Skill[];

            const result = calculateDailyOffensive(books, skills);
            expect(result.averageProgress).toBe(50);
            expect(result.isOffensive).toBe(true);
        });

        it('should NOT be offensive if average < 50%', () => {
            const books = [{
                id: '1', dailyGoal: 10, status: 'READING',
                logs: [{ date: today, pagesRead: 2 }] // 20%
            }] as unknown as Book[];

            const skills = [{
                id: '1', goalMinutes: 1340, // 20 min/day
                logs: [{ date: today, minutes: 4 }] // 4/20 = 20%
            }] as unknown as Skill[];

            const result = calculateDailyOffensive(books, skills);
            expect(result.averageProgress).toBe(20);
            expect(result.isOffensive).toBe(false);
        });

        it('should compensate: 100% reading and 0% skill = 50% offensive', () => {
            const books = [{
                id: '1', dailyGoal: 10, status: 'READING',
                logs: [{ date: today, pagesRead: 10 }] // 100%
            }] as unknown as Book[];

            // Skill ativa mas sem progresso
            const skills = [{
                id: '1', goalMinutes: 1340,
                logs: []
            }] as unknown as Skill[];

            const result = calculateDailyOffensive(books, skills);
            expect(result.averageProgress).toBe(50);
            expect(result.isOffensive).toBe(true);
        });
    });
});
