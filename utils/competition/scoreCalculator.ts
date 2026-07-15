import {
    Book,
    CompetitionCategoryId,
    CompetitionDailyRecord,
    CompetitionScoreBreakdown,
    Habit,
    OrganizeTask,
    RestActivity,
    Skill,
    TimeSlotGoalConfig,
    TimeSlotTask,
} from '../../types';
import type { MetTargetSession } from '../../stores/workStore';
import { calculateCurrentDay } from '../../services/weeklySnapshot';
import {
    calculateSkillProgress,
    getReadingDailyProgressSnapshot,
} from '../dailyOffensiveUtils';
import { daysDiff, getStartOfDay, getTodayISO, parseDate } from '../dateUtils';

export const COMPETITION_ENGINE_VERSION = '2026.04.06.1';
export const COMPETITION_THEORETICAL_DAILY_MAX = 1000;
const COMPETITION_PERFORMANCE_EXPONENT = 1.35;
const COMPETITION_BASE_DIFFICULTY = 0.85;
const COMPETITION_DIFFICULTY_RANGE = 0.3;
const REST_SERIES_POINTS = 10;
const REST_SIMPLE_ACTIVITY_POINTS = 20;
const REST_DAILY_MAX = 60;

const CATEGORY_LABELS: Record<CompetitionCategoryId, string> = {
    questoes: 'Questoes',
    habitos: 'Habitos',
    tarefas: 'Tarefas',
    skillTree: 'Skill Tree',
    leitura: 'Leitura',
    descanso: 'Descanso',
    extras: 'Extras',
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const roundPositivePoints = (value: number) => Math.round(Math.max(0, value));
const roundSignedPoints = (value: number) => Math.round(value);

export interface AdaptiveCompetitionMetrics {
    score: number;
    activityScore: number;
    completionRate: number;
    availabilityRate: number;
    difficultyMultiplier: number;
    remainingScore: number;
}

export const calculateAdaptiveCompetitionMetrics = (
    activityScore: number,
    activityMaxScore: number,
    theoreticalMaxScore = COMPETITION_THEORETICAL_DAILY_MAX,
): AdaptiveCompetitionMetrics => {
    const normalizedActivityScore = roundSignedPoints(activityScore);
    const normalizedActivityMax = roundPositivePoints(activityMaxScore);
    const scoringBaseline = normalizedActivityMax > 0
        ? normalizedActivityMax
        : Math.abs(normalizedActivityScore);
    const completionRate = scoringBaseline > 0
        ? clamp(normalizedActivityScore / scoringBaseline, -1, 1)
        : 0;
    const availabilityRate = theoreticalMaxScore > 0
        ? clamp(normalizedActivityMax / theoreticalMaxScore, 0, 1)
        : 0;
    const performanceRate = Math.abs(completionRate) > 0
        ? Math.abs(completionRate) ** COMPETITION_PERFORMANCE_EXPONENT
        : 0;
    const difficultyMultiplier = COMPETITION_BASE_DIFFICULTY + (COMPETITION_DIFFICULTY_RANGE * availabilityRate);
    const scoreDirection = normalizedActivityScore === 0 ? 0 : Math.sign(normalizedActivityScore);

    return {
        score: roundSignedPoints(scoreDirection * 100 * performanceRate * difficultyMultiplier),
        activityScore: normalizedActivityScore,
        completionRate,
        availabilityRate,
        difficultyMultiplier,
        remainingScore: roundPositivePoints(Math.max(0, normalizedActivityMax - Math.max(0, normalizedActivityScore))),
    };
};

const isTimestampOnDate = (timestamp: number | undefined, dateKey: string) => {
    if (!timestamp) return false;
    const d = new Date(timestamp);
    const localDateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return localDateKey === dateKey;
};

const isRestActivityScheduledForDate = (activity: RestActivity, dateKey: string) => {
    if (activity.type === 'DAILY') return true;
    if (activity.type === 'ONCE') return activity.specificDate === dateKey;

    if (activity.type === 'WEEKLY') {
        const [year, month, day] = dateKey.split('-').map(Number);
        const weekday = new Date(year, month - 1, day).getDay();
        return activity.daysOfWeek?.includes(weekday) ?? false;
    }

    return false;
};

const calculateRestBreakdown = (activities: RestActivity[], dateKey: string) => {
    let availableSeriesCount = 0;
    let completedSeriesToday = 0;
    let availableSimpleCount = 0;
    let completedSimpleToday = 0;

    activities
        .filter((activity) => isRestActivityScheduledForDate(activity, dateKey))
        .forEach((activity) => {
            if (activity.series?.length) {
                activity.series.forEach((series) => {
                    const completedToday = isTimestampOnDate(series.completedAt, dateKey);
                    const countsAsAvailable = !series.isCompleted || completedToday;

                    if (countsAsAvailable) {
                        availableSeriesCount += 1;
                    }
                    if (completedToday) {
                        completedSeriesToday += 1;
                    }
                });
                return;
            }

            const completedToday = isTimestampOnDate(activity.completedAt, dateKey);
            const countsAsAvailable = !activity.isCompleted || completedToday;

            if (countsAsAvailable) {
                availableSimpleCount += 1;
            }
            if (completedToday) {
                completedSimpleToday += 1;
            }
        });

    const rawPoints = (completedSeriesToday * REST_SERIES_POINTS) + (completedSimpleToday * REST_SIMPLE_ACTIVITY_POINTS);
    const rawMax = (availableSeriesCount * REST_SERIES_POINTS) + (availableSimpleCount * REST_SIMPLE_ACTIVITY_POINTS);
    const points = Math.min(REST_DAILY_MAX, rawPoints);
    const maxPoints = Math.min(REST_DAILY_MAX, rawMax);
    const summaryParts: string[] = [];

    if (availableSeriesCount > 0 || completedSeriesToday > 0) {
        summaryParts.push(`${completedSeriesToday}/${availableSeriesCount} séries concluídas hoje.`);
    }

    if (availableSimpleCount > 0 || completedSimpleToday > 0) {
        summaryParts.push(`${completedSimpleToday}/${availableSimpleCount} atividades simples concluídas hoje.`);
    }

    return buildBreakdown(
        'descanso',
        points,
        maxPoints,
        summaryParts.join(' ') || 'Nenhum descanso pontuável hoje.',
    );
};

const isTimeSlotTaskQualified = (task: TimeSlotTask, goal?: TimeSlotGoalConfig) => {
    if (!goal) return false;
    if (goal.inputMode === 'BOOLEAN') return task.completed;
    if (goal.inputMode === 'COUNTER') return (task.count || 0) > 0;
    if (goal.inputMode === 'TIME') return (task.minutes || 0) > 0;
    return false;
};

const flattenRoadmapTasks = (skills: Skill[]) => {
    const items: Array<{ skillId: string; itemId: string; completedAt?: number; isCompleted: boolean }> = [];

    const walk = (skillId: string, roadmapItems: Skill['roadmap']) => {
        roadmapItems.forEach((item) => {
            if (item.type !== 'SECTION') {
                items.push({
                    skillId,
                    itemId: item.id,
                    completedAt: item.completedAt,
                    isCompleted: item.isCompleted,
                });
            }

            if (item.subTasks?.length) {
                walk(skillId, item.subTasks);
            }
        });
    };

    skills.forEach((skill) => walk(skill.id, skill.roadmap || []));
    return items;
};

const countRoadmapCompletionsToday = (skills: Skill[], dateKey: string) => {
    return flattenRoadmapTasks(skills).filter((item) => item.isCompleted && isTimestampOnDate(item.completedAt, dateKey)).length;
};

const countRemainingRoadmapTasks = (skills: Skill[]) => {
    return flattenRoadmapTasks(skills).filter((item) => !item.isCompleted).length;
};

const countMicroAchievementsToday = (skills: Skill[], dateKey: string) => {
    return skills.reduce((total, skill) => (
        total + (skill.microAchievements || []).filter((achievement) =>
            achievement.isCompleted && isTimestampOnDate(achievement.completedAt, dateKey)
        ).length
    ), 0);
};

const countRemainingMicroAchievements = (skills: Skill[]) => {
    return skills.reduce((total, skill) => (
        total + (skill.microAchievements || []).filter((achievement) => !achievement.isCompleted).length
    ), 0);
};

const buildBreakdown = (
    id: CompetitionCategoryId,
    points: number,
    maxPoints: number,
    summary: string,
): CompetitionScoreBreakdown => ({
    id,
    label: CATEGORY_LABELS[id],
    points: roundSignedPoints(points),
    maxPoints: roundPositivePoints(maxPoints),
    remainingPoints: roundPositivePoints(Math.max(0, maxPoints - Math.max(0, points))),
    summary,
    priority: roundPositivePoints(Math.max(0, maxPoints - Math.max(0, points))),
});

interface HabitScoreUnitSummary {
    availablePositiveUnits: number;
    completedPositiveUnits: number;
    completedNegativeUnits: number;
}

const calculateHabitUnits = (habits: Habit[], dateKey: string): HabitScoreUnitSummary => {
    return habits.reduce<HabitScoreUnitSummary>((summary, habit) => {
        if (habit.archived || habit.frequency === 'WEEKLY') {
            return summary;
        }

        const log = habit.history[dateKey];
        const subHabitCount = habit.subHabits.length;

        if (habit.isNegative) {
            if (subHabitCount > 0) {
                summary.completedNegativeUnits += Math.min(log?.subHabitsCompleted.length || 0, subHabitCount);
            } else if (log?.completed) {
                summary.completedNegativeUnits += 1;
            }
            return summary;
        }

        if (subHabitCount > 0) {
            summary.availablePositiveUnits += subHabitCount;
            summary.completedPositiveUnits += Math.min(log?.subHabitsCompleted.length || 0, subHabitCount);
            return summary;
        }

        summary.availablePositiveUnits += 1;
        if (log?.completed) {
            summary.completedPositiveUnits += 1;
        }
        return summary;
    }, {
        availablePositiveUnits: 0,
        completedPositiveUnits: 0,
        completedNegativeUnits: 0,
    });
};

export interface CompetitionSourceState {
    startDate: string;
    currentCount: number;
    workHistory: MetTargetSession[];
    scheduledTasks: TimeSlotTask[];
    availableGoals: TimeSlotGoalConfig[];
    habits: Habit[];
    tasks: OrganizeTask[];
    skills: Skill[];
    books: Book[];
    restActivities: RestActivity[];
}

export interface CompetitionSimulationDay {
    date: string;
    playerScore: number;
    maxScore: number;
}

export interface CompetitionLeaderboardEntry {
    id: string;
    name: string;
    archetype: string;
    description: string;
    totalScore: number;
    todayScore: number;
    bestDayScore: number;
    gapToPlayer: number;
    gapToLeader: number;
    rank: number;
    basePower: number;
    taunt: string;
}

export const migrateCompetitionDailyRecord = (record: CompetitionDailyRecord): CompetitionDailyRecord => {
    const activityScore = typeof record.activityScore === 'number'
        ? record.activityScore
        : record.breakdown.reduce((sum, entry) => sum + entry.points, 0);
    const theoreticalMaxScore = record.theoreticalMaxScore || COMPETITION_THEORETICAL_DAILY_MAX;
    const metrics = calculateAdaptiveCompetitionMetrics(activityScore, record.maxScore, theoreticalMaxScore);

    return {
        ...record,
        score: metrics.score,
        activityScore: metrics.activityScore,
        completionRate: metrics.completionRate,
        availabilityRate: metrics.availabilityRate,
        difficultyMultiplier: metrics.difficultyMultiplier,
        remainingScore: metrics.remainingScore,
        theoreticalMaxScore,
    };
};

export const createCompetitionDailyRecord = (
    state: CompetitionSourceState,
    dateKey = getTodayISO(),
): CompetitionDailyRecord => {
    const goalMap = new Map(state.availableGoals.map((goal) => [goal.id, goal]));
    const todaysScheduleTasks = state.scheduledTasks.filter((task) => task.date === dateKey);
    const todaySessions = state.workHistory.filter((session) => (
        (session.date.split('T')[0] || session.date) === dateKey
    ));

    const questionSlotCount = todaysScheduleTasks
        .filter((task) => task.goalId === 'questoes')
        .reduce((sum, task) => sum + (task.count || 0), 0);
    const questionCount = Math.max(state.currentCount, questionSlotCount);
    const questionBase = Math.min(250, questionCount);
    const questionBonus =
        (questionCount >= 50 ? 25 : 0) +
        (questionCount >= 100 ? 25 : 0) +
        (questionCount >= 150 ? 50 : 0);
    const questionPoints = Math.min(350, questionBase + questionBonus);
    const questionsBreakdown = buildBreakdown(
        'questoes',
        questionPoints,
        350,
        `${questionCount} questoes rastreadas no dia.`,
    );

    const {
        availablePositiveUnits,
        completedPositiveUnits,
        completedNegativeUnits,
    } = calculateHabitUnits(state.habits, dateKey);
    const hasHabitUnits = availablePositiveUnits > 0 || completedNegativeUnits > 0;
    const habitValue = hasHabitUnits
        ? Math.min(40, 160 / Math.max(1, availablePositiveUnits))
        : 0;
    const habitsMax = roundPositivePoints(availablePositiveUnits * habitValue);
    const habitsPoints = roundSignedPoints(clamp(
        (completedPositiveUnits - completedNegativeUnits) * habitValue,
        -160,
        160,
    ));
    const habitSummaryParts: string[] = [];
    if (availablePositiveUnits > 0) {
        habitSummaryParts.push(`${completedPositiveUnits}/${availablePositiveUnits} unidades positivas concluídas.`);
    }
    if (completedNegativeUnits > 0) {
        habitSummaryParts.push(`${completedNegativeUnits} unidade${completedNegativeUnits === 1 ? '' : 's'} negativa${completedNegativeUnits === 1 ? '' : 's'} acionada${completedNegativeUnits === 1 ? '' : 's'}.`);
    }
    const habitsBreakdown = buildBreakdown(
        'habitos',
        habitsPoints,
        habitsMax,
        habitSummaryParts.join(' ') || 'Nenhum hábito pontuável hoje.',
    );

    const activeTasks = state.tasks.filter((task) => !task.isArchived);
    const completedTasksToday = state.tasks.filter((task) => (
        task.isCompleted &&
        !task.isArchived &&
        isTimestampOnDate(task.completedAt, dateKey)
    )).length;
    const tasksMax = Math.min(5, activeTasks.length) * 22;
    const tasksPoints = Math.min(5, completedTasksToday) * 22;
    const tasksBreakdown = buildBreakdown(
        'tarefas',
        tasksPoints,
        tasksMax,
        `${Math.min(5, completedTasksToday)}/${Math.min(5, activeTasks.length)} tarefas valendo no dia.`,
    );

    const skillProgressPercent = calculateSkillProgress(state.skills);
    const skillProgressPoints = state.skills.length > 0
        ? roundPositivePoints((skillProgressPercent / 100) * 140)
        : 0;
    const skillProgressMax = state.skills.length > 0 ? 140 : 0;
    const roadmapCompletionsToday = countRoadmapCompletionsToday(state.skills, dateKey);
    const roadmapMax = Math.min(3, roadmapCompletionsToday + countRemainingRoadmapTasks(state.skills)) * 20;
    const roadmapPoints = Math.min(3, roadmapCompletionsToday) * 20;
    const microCompletionsToday = countMicroAchievementsToday(state.skills, dateKey);
    const microMax = Math.min(2, microCompletionsToday + countRemainingMicroAchievements(state.skills)) * 10;
    const microPoints = Math.min(2, microCompletionsToday) * 10;
    const skillTreeMax = skillProgressMax + roadmapMax + microMax;
    const skillTreePoints = skillProgressPoints + roadmapPoints + microPoints;
    const skillTreeBreakdown = buildBreakdown(
        'skillTree',
        skillTreePoints,
        skillTreeMax,
        `${skillProgressPercent}% de ofensiva, ${Math.min(3, roadmapCompletionsToday)} nos e ${Math.min(2, microCompletionsToday)} micro-vitorias hoje.`,
    );

    const readingSnapshot = getReadingDailyProgressSnapshot(state.books, dateKey);
    const readingMax = readingSnapshot.activeBooksCount > 0 ? 90 : 0;
    const readingPoints = readingSnapshot.activeBooksCount > 0
        ? roundPositivePoints((readingSnapshot.progressPercent / 100) * 90)
        : 0;
    const readingBreakdown = buildBreakdown(
        'leitura',
        readingPoints,
        readingMax,
        `${readingSnapshot.totalPagesReadToday} ${readingSnapshot.totalPagesReadToday === 1 ? 'pagina' : 'paginas'} hoje (${readingSnapshot.progressPercent}% da meta diaria).`,
    );

    const restBreakdown = calculateRestBreakdown(state.restActivities, dateKey);

    const extrasBreakdown = buildBreakdown(
        'extras',
        0,
        0,
        'Metas Extras desativadas.',
    );

    const breakdown = [
        questionsBreakdown,
        habitsBreakdown,
        tasksBreakdown,
        skillTreeBreakdown,
        readingBreakdown,
        restBreakdown,
        extrasBreakdown,
    ];

    const activityScore = breakdown.reduce((sum, entry) => sum + entry.points, 0);
    const maxScore = breakdown.reduce((sum, entry) => sum + entry.maxPoints, 0);
    const adaptiveMetrics = calculateAdaptiveCompetitionMetrics(activityScore, maxScore);

    return {
        date: dateKey,
        projectDay: calculateCurrentDay(state.startDate),
        score: adaptiveMetrics.score,
        activityScore: adaptiveMetrics.activityScore,
        maxScore,
        theoreticalMaxScore: COMPETITION_THEORETICAL_DAILY_MAX,
        completionRate: adaptiveMetrics.completionRate,
        availabilityRate: adaptiveMetrics.availabilityRate,
        difficultyMultiplier: adaptiveMetrics.difficultyMultiplier,
        remainingScore: adaptiveMetrics.remainingScore,
        breakdown: breakdown
            .map((entry) => ({
                ...entry,
                remainingPoints: Math.max(0, entry.maxPoints - Math.max(0, entry.points)),
                priority: Math.max(0, entry.maxPoints - Math.max(0, entry.points)),
            }))
            .sort((left, right) => right.priority - left.priority),
        updatedAt: Date.now(),
    };
};

export const getCompetitionStartedLabel = (competitionStartedAt: number | null) => {
    if (!competitionStartedAt) return 'Aguardando inicio';
    return new Date(competitionStartedAt).toLocaleDateString('pt-BR');
};

export const getCompetitionDayCount = (competitionStartedAt: number | null, todayKey = getTodayISO()) => {
    if (!competitionStartedAt) return 0;
    const startDate = getStartOfDay(new Date(competitionStartedAt));
    return Math.max(1, daysDiff(startDate, parseDate(todayKey)) + 1);
};

export const getTopOpportunity = (record: CompetitionDailyRecord | null) => {
    if (!record) return null;
    return [...record.breakdown]
        .sort((left, right) => right.remainingPoints - left.remainingPoints)
        .find((entry) => entry.remainingPoints > 0) || null;
};
