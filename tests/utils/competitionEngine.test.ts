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
    RestActivity,
} from '../../types';
import { useReadingStore } from '../../stores/readingStore';
import {
    COMPETITION_THEORETICAL_DAILY_MAX,
    calculateAdaptiveCompetitionMetrics,
    createCompetitionDailyRecord,
    migrateCompetitionDailyRecord,
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

const createHabitLog = (overrides: Partial<Habit['history'][string]> = {}) => ({
    completed: false,
    subHabitsCompleted: [],
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
    restActivities: [],
    ...overrides,
});

const createRestActivity = (overrides: Partial<RestActivity> = {}): RestActivity => ({
    id: 'rest-1',
    title: 'Alongamento',
    isCompleted: false,
    type: 'DAILY',
    order: 0,
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
        expect(record.score).toBe(0);
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

        expect(record.activityScore).toBe(280);
        expect(questoes?.points).toBe(280);
        expect(questoes?.summary).toContain('180');
    });

    it('awards XP for a completed positive daily habit', () => {
        const record = createCompetitionDailyRecord(createSourceState({
            habits: [
                createHabit({
                    history: {
                        [today]: createHabitLog({ completed: true }),
                    },
                }),
            ],
        }));

        const habits = record.breakdown.find((entry) => entry.id === 'habitos');

        expect(habits?.points).toBe(40);
        expect(habits?.maxPoints).toBe(40);
        expect(habits?.summary).toContain('1/1 unidades positivas');
    });

    it('awards sub-habit XP without double-counting the parent completion flag', () => {
        const record = createCompetitionDailyRecord(createSourceState({
            habits: [
                createHabit({
                    subHabits: [
                        { id: 'sub-1', title: 'Sub 1' },
                        { id: 'sub-2', title: 'Sub 2' },
                    ],
                    history: {
                        [today]: createHabitLog({
                            completed: true,
                            subHabitsCompleted: ['sub-1'],
                        }),
                    },
                }),
            ],
        }));

        const habits = record.breakdown.find((entry) => entry.id === 'habitos');

        expect(habits?.points).toBe(40);
        expect(habits?.maxPoints).toBe(80);
        expect(habits?.summary).toContain('1/2 unidades positivas');
    });

    it('continues awarding task XP for completed tasks', () => {
        const completionToday = new Date(`${today}T12:00:00.000Z`).getTime();
        const record = createCompetitionDailyRecord(createSourceState({
            tasks: [
                createTask({
                    isCompleted: true,
                    completedAt: completionToday,
                }),
            ],
        }));

        const tasks = record.breakdown.find((entry) => entry.id === 'tarefas');

        expect(tasks?.points).toBe(22);
        expect(tasks?.maxPoints).toBe(22);
    });

    it('subtracts XP for a completed negative habit', () => {
        const record = createCompetitionDailyRecord(createSourceState({
            habits: [
                createHabit({
                    isNegative: true,
                    history: {
                        [today]: createHabitLog({ completed: true }),
                    },
                }),
            ],
        }));

        const habits = record.breakdown.find((entry) => entry.id === 'habitos');

        expect(habits?.points).toBe(-40);
        expect(habits?.maxPoints).toBe(0);
        expect(habits?.summary).toContain('1 unidade negativa acionada');
        expect(record.score).toBeLessThan(0);
    });

    it('subtracts partial XP for negative sub-habits', () => {
        const record = createCompetitionDailyRecord(createSourceState({
            habits: [
                createHabit({
                    isNegative: true,
                    subHabits: [
                        { id: 'trigger-1', title: 'Trigger 1' },
                        { id: 'trigger-2', title: 'Trigger 2' },
                        { id: 'trigger-3', title: 'Trigger 3' },
                    ],
                    history: {
                        [today]: createHabitLog({
                            subHabitsCompleted: ['trigger-1', 'trigger-2'],
                        }),
                    },
                }),
            ],
        }));

        const habits = record.breakdown.find((entry) => entry.id === 'habitos');

        expect(habits?.points).toBe(-80);
        expect(habits?.maxPoints).toBe(0);
        expect(habits?.summary).toContain('2 unidades negativas acionadas');
    });

    it('ignores weekly habits in the official daily XP', () => {
        const record = createCompetitionDailyRecord(createSourceState({
            habits: [
                createHabit({
                    frequency: 'WEEKLY',
                    history: {
                        [today]: createHabitLog({ completed: true }),
                    },
                }),
                createHabit({
                    id: 'habit-negative-weekly',
                    isNegative: true,
                    frequency: 'WEEKLY',
                    history: {
                        [today]: createHabitLog({ completed: true }),
                    },
                }),
            ],
        }));

        const habits = record.breakdown.find((entry) => entry.id === 'habitos');

        expect(habits?.points).toBe(0);
        expect(habits?.maxPoints).toBe(0);
        expect(habits?.summary).toContain('Nenhum hábito pontuável');
    });

    it('produces a signed daily score when gains and penalties are combined', () => {
        const completionToday = new Date(`${today}T12:00:00.000Z`).getTime();
        const record = createCompetitionDailyRecord(createSourceState({
            tasks: [
                createTask({
                    isCompleted: true,
                    completedAt: completionToday,
                }),
            ],
            habits: [
                createHabit({
                    history: {
                        [today]: createHabitLog({ completed: true }),
                    },
                }),
                createHabit({
                    id: 'habit-negative-combo',
                    isNegative: true,
                    subHabits: [
                        { id: 'loss-1', title: 'Loss 1' },
                        { id: 'loss-2', title: 'Loss 2' },
                    ],
                    history: {
                        [today]: createHabitLog({
                            subHabitsCompleted: ['loss-1', 'loss-2'],
                        }),
                    },
                }),
            ],
        }));

        expect(record.activityScore).toBeLessThan(0);
        expect(record.score).toBeLessThan(0);
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
        expect(record.activityScore).toBe(54);
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

        expect(record.activityScore).toBe(30);
        expect(skillTree?.points).toBe(30);
        expect(skillTree?.summary).toContain('1 nos');
        expect(skillTree?.summary).toContain('1 micro-vitorias');
    });

    it('adds descanso XP only from series completed on the current day', () => {
        const completionToday = new Date(`${today}T12:00:00.000Z`).getTime();
        const yesterday = completionToday - (24 * 60 * 60 * 1000);

        const record = createCompetitionDailyRecord(createSourceState({
            restActivities: [
                createRestActivity({
                    id: 'rest-series',
                    totalSets: 3,
                    completedSets: 2,
                    series: [
                        { id: 's1', label: 'Série 1', isCompleted: true, completedAt: completionToday, order: 0 },
                        { id: 's2', label: 'Série 2', isCompleted: true, completedAt: yesterday, order: 1 },
                        { id: 's3', label: 'Série 3', isCompleted: false, order: 2 },
                    ],
                }),
            ],
        }));

        const descanso = record.breakdown.find((entry) => entry.id === 'descanso');

        expect(descanso?.points).toBe(10);
        expect(descanso?.maxPoints).toBe(20);
        expect(descanso?.summary).toContain('1/2 séries');
    });

    it('caps descanso XP at 60 bruto per day', () => {
        const completionToday = new Date(`${today}T12:00:00.000Z`).getTime();

        const record = createCompetitionDailyRecord(createSourceState({
            restActivities: [
                createRestActivity({
                    id: 'rest-cap',
                    totalSets: 7,
                    completedSets: 7,
                    series: Array.from({ length: 7 }, (_, index) => ({
                        id: `series-${index + 1}`,
                        label: `Série ${index + 1}`,
                        isCompleted: true,
                        completedAt: completionToday,
                        order: index,
                    })),
                }),
            ],
        }));

        const descanso = record.breakdown.find((entry) => entry.id === 'descanso');

        expect(descanso?.points).toBe(60);
        expect(descanso?.maxPoints).toBe(60);
    });

    it('awards simple descanso activities only on the day they were completed', () => {
        const completionToday = new Date(`${today}T12:00:00.000Z`).getTime();
        const yesterday = completionToday - (24 * 60 * 60 * 1000);

        const record = createCompetitionDailyRecord(createSourceState({
            restActivities: [
                createRestActivity({
                    id: 'simple-today',
                    isCompleted: true,
                    completedAt: completionToday,
                }),
                createRestActivity({
                    id: 'simple-yesterday',
                    isCompleted: true,
                    completedAt: yesterday,
                    order: 1,
                }),
            ],
        }));

        const descanso = record.breakdown.find((entry) => entry.id === 'descanso');

        expect(descanso?.points).toBe(20);
        expect(descanso?.maxPoints).toBe(20);
        expect(descanso?.summary).toContain('1/1 atividades simples');
    });

    it('does not duplicate weekly descanso XP outside the completion day', () => {
        const completionYesterday = new Date(`${today}T12:00:00.000Z`).getTime() - (24 * 60 * 60 * 1000);

        const record = createCompetitionDailyRecord(createSourceState({
            restActivities: [
                createRestActivity({
                    id: 'weekly-rest',
                    type: 'WEEKLY',
                    daysOfWeek: [new Date().getDay()],
                    totalSets: 1,
                    completedSets: 1,
                    series: [
                        { id: 'weekly-series', label: 'Série 1', isCompleted: true, completedAt: completionYesterday, order: 0 },
                    ],
                }),
            ],
        }));

        const descanso = record.breakdown.find((entry) => entry.id === 'descanso');

        expect(descanso?.points).toBe(0);
        expect(descanso?.maxPoints).toBe(0);
    });

    it('gives a moderate advantage to perfect dense days over perfect sparse days', () => {
        const sparse = calculateAdaptiveCompetitionMetrics(90, 90);
        const dense = calculateAdaptiveCompetitionMetrics(320, 320);

        expect(sparse.score).toBeLessThan(dense.score);
        expect(dense.score - sparse.score).toBeLessThan(10);
    });

    it('lets a perfect sparse day beat a partial dense day', () => {
        const sparse = calculateAdaptiveCompetitionMetrics(90, 90);
        const densePartial = calculateAdaptiveCompetitionMetrics(180, 320);

        expect(sparse.score).toBeGreaterThan(densePartial.score);
    });

    it('keeps adaptive score at zero when nothing was available that day', () => {
        const metrics = calculateAdaptiveCompetitionMetrics(0, 0);

        expect(metrics.score).toBe(0);
        expect(metrics.activityScore).toBe(0);
        expect(metrics.completionRate).toBe(0);
    });

    it('migrates legacy records without activityScore while keeping raw breakdown intact', () => {
        const legacyRecord = {
            date: today,
            projectDay: 1,
            score: 280,
            maxScore: 500,
            theoreticalMaxScore: 1000,
            remainingScore: 220,
            breakdown: [
                {
                    id: 'questoes' as const,
                    label: 'Questoes',
                    points: 280,
                    maxPoints: 500,
                    remainingPoints: 220,
                    summary: 'Resumo',
                    priority: 220,
                },
            ],
            updatedAt: Date.now(),
        } as any;

        const migrated = migrateCompetitionDailyRecord(legacyRecord);
        const adaptive = calculateAdaptiveCompetitionMetrics(280, 500);

        expect(migrated.activityScore).toBe(280);
        expect(migrated.score).toBe(adaptive.score);
        expect(migrated.breakdown[0].points).toBe(280);
        expect(migrated.maxScore).toBe(500);
    });

    it('simulates rivals deterministically for the same ranking window', () => {
        const first = generateSimulatedRivals(2400, 512);
        const second = generateSimulatedRivals(2400, 512);

        expect(first).toEqual(second);
        expect(first).toHaveLength(4);
    });
});
