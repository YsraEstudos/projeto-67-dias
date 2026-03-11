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
    buildCompetitionLeaderboard,
    COMPETITION_THEORETICAL_DAILY_MAX,
    createCompetitionDailyRecord,
    createDefaultCompetitionRoster,
    type CompetitionSourceState,
} from '../../utils/competitionEngine';
import { getTodayISO } from '../../utils/dateUtils';

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
    date: getTodayISO(),
    completed: false,
    count: 0,
    ...overrides,
});

const createSourceState = (overrides: Partial<CompetitionSourceState> = {}): CompetitionSourceState => ({
    startDate: getTodayISO(),
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

    it('does not inflate reading points when progress goes up and then down on the same day', () => {
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

    it('counts roadmap nodes and micro-achievements only on the day they were completed', () => {
        const today = new Date(`${getTodayISO()}T12:00:00.000Z`).getTime();
        const yesterday = today - (24 * 60 * 60 * 1000);

        const record = createCompetitionDailyRecord(createSourceState({
            skills: [
                createSkill({
                    roadmap: [
                        { id: 'roadmap-today', title: 'Hoje', isCompleted: true, completedAt: today, type: 'TASK' },
                        { id: 'roadmap-yesterday', title: 'Ontem', isCompleted: true, completedAt: yesterday, type: 'TASK' },
                    ],
                    microAchievements: [
                        { id: 'micro-today', title: 'Hoje', isCompleted: true, completedAt: today, createdAt: today },
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

    it('simulates rivals deterministically for the same stored days', () => {
        const record = createCompetitionDailyRecord(createSourceState({
            currentCount: 120,
            habits: [
                createHabit({
                    history: {
                        [getTodayISO()]: { completed: true, subHabitsCompleted: [] },
                    },
                }),
            ],
            tasks: [
                createTask({ isCompleted: true, completedAt: Date.now() }),
            ],
        }));

        const first = buildCompetitionLeaderboard(createDefaultCompetitionRoster(), {
            [record.date]: record,
        });
        const second = buildCompetitionLeaderboard(createDefaultCompetitionRoster(), {
            [record.date]: record,
        });

        expect(first).toEqual(second);
        expect(first).toHaveLength(9);
    });
});
