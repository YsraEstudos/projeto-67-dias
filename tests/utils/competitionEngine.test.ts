import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import type {
    Book,
    Habit,
    OrganizeTask,
    Skill,
    TimeSlotGoalConfig,
    TimeSlotTask,
} from '../../types';
import { useReadingStore } from '../../stores/readingStore';
import {
    COMPETITION_THEORETICAL_DAILY_MAX,
    createCompetitionDailyRecord,
    generateSimulatedRivals,
    type CompetitionSourceState,
} from '../../utils/competitionEngine';
import { getTodayISO } from '../../utils/dateUtils';

const today = getTodayISO();

const createBook = (overrides: Partial<Book> = {}): Book => ({
    id: 'book-1',
    title: 'Livro teste',
    author: 'Autor teste',
    genre: 'Tecnico',
    unit: 'PAGES',
    total: 200,
    current: 0,
    status: 'READING',
    rating: 0,
    folderId: null,
    notes: '',
    addedAt: new Date().toISOString(),
    dailyGoal: 20,
    logs: [],
    ...overrides,
});

const createSkill = (overrides: Partial<Skill> = {}): Skill => ({
    id: 'skill-1',
    name: 'Skill teste',
    level: 'Intermediário',
    currentMinutes: 0,
    goalMinutes: 0,
    resources: [],
    roadmap: [],
    logs: [],
    colorTheme: 'emerald',
    createdAt: Date.now(),
    microAchievements: [],
    ...overrides,
});

const createHabit = (overrides: Partial<Habit> = {}): Habit => ({
    id: 'habit-1',
    title: 'Habit teste',
    category: 'Saude',
    goalType: 'BOOLEAN',
    frequency: 'DAILY',
    isNegative: false,
    subHabits: [],
    history: {},
    createdAt: Date.now(),
    archived: false,
    ...overrides,
});

const createTask = (overrides: Partial<OrganizeTask> = {}): OrganizeTask => ({
    id: 'task-1',
    title: 'Task teste',
    isCompleted: false,
    isArchived: false,
    category: 'Geral',
    createdAt: Date.now(),
    ...overrides,
});

const createGoal = (overrides: Partial<TimeSlotGoalConfig> = {}): TimeSlotGoalConfig => ({
    id: 'questoes',
    label: 'Questoes',
    icon: 'Q',
    color: 'emerald',
    inputMode: 'COUNTER',
    createdAt: 0,
    ...overrides,
});

const createTimeSlotTask = (overrides: Partial<TimeSlotTask> = {}): TimeSlotTask => ({
    id: 'slot-task-1',
    goalId: 'questoes',
    slotId: 'slot1',
    date: today,
    completed: false,
    count: 0,
    ...overrides,
});

const createSourceState = (overrides: Partial<CompetitionSourceState> = {}): CompetitionSourceState => ({
    startDate: today,
    currentCount: 0,
    workHistory: [],
    scheduledTasks: [],
    availableGoals: [],
    habits: [],
    tasks: [],
    skills: [],
    books: [],
    ...overrides,
});

describe('competitionEngine', () => {
    beforeEach(() => {
        useReadingStore.getState()._reset();
    });

    it('keeps the theoretical daily max fixed at 1000', () => {
        const record = createCompetitionDailyRecord(createSourceState());

        expect(COMPETITION_THEORETICAL_DAILY_MAX).toBe(1000);
        expect(record.theoreticalMaxScore).toBe(1000);
    });

    it('uses the larger question tracker instead of double-counting question sources', () => {
        const record = createCompetitionDailyRecord(createSourceState({
            currentCount: 180,
            availableGoals: [createGoal()],
            scheduledTasks: [
                createTimeSlotTask({ id: 'q1', count: 80 }),
                createTimeSlotTask({ id: 'q2', count: 40 }),
            ],
        }));

        const questoes = record.breakdown.find((entry) => entry.id === 'questoes');

        expect(questoes?.points).toBe(280);
        expect(questoes?.summary).toContain('180');
    });

    it('recalculates reading points from the final pages read today value', () => {
        useReadingStore.getState()._hydrateFromFirestore({
            books: [createBook()],
            folders: [],
        });

        useReadingStore.getState().updateProgress('book-1', 10);
        useReadingStore.getState().updateProgress('book-1', 25);
        useReadingStore.getState().updateProgress('book-1', 12);

        const books = useReadingStore.getState().books;
        const record = createCompetitionDailyRecord(createSourceState({ books }));
        const leitura = record.breakdown.find((entry) => entry.id === 'leitura');

        expect(books[0].logs?.[0]?.pagesRead).toBe(12);
        expect(leitura?.points).toBe(54);
    });

    it('uses the fallback daily goal when the book has no configured goal', () => {
        const record = createCompetitionDailyRecord(createSourceState({
            books: [
                createBook({
                    dailyGoal: 0,
                    logs: [{ id: 'log-1', date: today, pagesRead: 5, bookId: 'book-1' }],
                }),
            ],
        }));

        const leitura = record.breakdown.find((entry) => entry.id === 'leitura');

        expect(leitura?.points).toBe(45);
        expect(leitura?.summary).toContain('5 paginas hoje');
    });

    it('does not award reading XP for old accumulated progress without pages today', () => {
        const record = createCompetitionDailyRecord(createSourceState({
            books: [
                createBook({
                    current: 80,
                    dailyGoal: 20,
                    logs: [],
                }),
            ],
        }));

        const leitura = record.breakdown.find((entry) => entry.id === 'leitura');

        expect(leitura?.points).toBe(0);
        expect(leitura?.maxPoints).toBe(90);
    });

    it('keeps reading XP when the book was completed today', () => {
        const record = createCompetitionDailyRecord(createSourceState({
            books: [
                createBook({
                    status: 'COMPLETED',
                    current: 100,
                    total: 100,
                    dailyGoal: 10,
                    logs: [{ id: 'log-1', date: today, pagesRead: 10, bookId: 'book-1' }],
                }),
            ],
        }));

        const leitura = record.breakdown.find((entry) => entry.id === 'leitura');

        expect(leitura?.points).toBe(90);
        expect(leitura?.maxPoints).toBe(90);
    });

    it('counts roadmap nodes and micro-achievements only on the day they were completed', () => {
        const completionToday = new Date(`${today}T12:00:00.000Z`).getTime();
        const yesterday = completionToday - (24 * 60 * 60 * 1000);

        const record = createCompetitionDailyRecord(createSourceState({
            skills: [
                createSkill({
                    roadmap: [
                        { id: 'roadmap-today', title: 'Hoje', isCompleted: true, completedAt: completionToday, type: 'TASK' },
                        { id: 'roadmap-yesterday', title: 'Ontem', isCompleted: true, completedAt: yesterday, type: 'TASK' },
                    ],
                    microAchievements: [
                        { id: 'micro-today', title: 'Hoje', isCompleted: true, completedAt: completionToday, createdAt: completionToday },
                        { id: 'micro-yesterday', title: 'Ontem', isCompleted: true, completedAt: yesterday, createdAt: yesterday },
                    ],
                }),
            ],
        }));

        const skillTree = record.breakdown.find((entry) => entry.id === 'skillTree');

        expect(skillTree?.points).toBe(30);
        expect(skillTree?.summary).toContain('1 nos');
        expect(skillTree?.summary).toContain('1 micro-vitorias');
    });

    it('simulates rivals deterministically for the same ranking window', () => {
        const first = generateSimulatedRivals(2400, 512);
        const second = generateSimulatedRivals(2400, 512);

        expect(first).toEqual(second);
        expect(first).toHaveLength(4);
    });
});
