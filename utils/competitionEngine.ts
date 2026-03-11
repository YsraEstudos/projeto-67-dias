import {
    Book,
    CompetitionCategoryId,
    CompetitionDailyRecord,
    CompetitionRival,
    CompetitionScoreBreakdown,
    Habit,
    OrganizeTask,
    Skill,
    TimeSlotGoalConfig,
    TimeSlotTask,
} from '../types';
import type { MetTargetSession } from '../stores/workStore';
import { calculateCurrentDay } from '../services/weeklySnapshot';
import { calculateReadingProgress, calculateSkillProgress } from './dailyOffensiveUtils';
import { daysDiff, getStartOfDay, getTodayISO, parseDate } from './dateUtils';

export const COMPETITION_ENGINE_VERSION = '2026.03.11.1';
export const COMPETITION_THEORETICAL_DAILY_MAX = 1000;

const CATEGORY_LABELS: Record<CompetitionCategoryId, string> = {
    questoes: 'Questoes',
    habitos: 'Habitos',
    tarefas: 'Tarefas',
    skillTree: 'Skill Tree',
    leitura: 'Leitura',
    extras: 'Extras',
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const roundPoints = (value: number) => Math.round(Math.max(0, value));

const isTimestampOnDate = (timestamp: number | undefined, dateKey: string) => {
    if (!timestamp) return false;
    return new Date(timestamp).toISOString().split('T')[0] === dateKey;
};

const hashSeed = (value: string) => {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};

const seededUnit = (seed: string) => {
    const hashed = hashSeed(seed);
    return (hashed % 10000) / 10000;
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
    points: roundPoints(points),
    maxPoints: roundPoints(maxPoints),
    remainingPoints: roundPoints(Math.max(0, maxPoints - points)),
    summary,
    priority: roundPoints(Math.max(0, maxPoints - points)),
});

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

export const createDefaultCompetitionRoster = (): CompetitionRival[] => ([
    {
        id: 'aline-blindada',
        name: 'Aline Blindada',
        archetype: 'Elite equilibrada',
        description: 'Quase nao entrega ponto gratis e pressiona em todas as frentes.',
        basePower: 0.86,
        volatility: 0.05,
        favoredCategories: ['questoes', 'skillTree', 'leitura'],
        weakCategories: ['extras'],
        taunts: [
            'Aline nao desperdicou nenhuma janela hoje.',
            'Aline virou o dia como quem ja sabia o resultado.',
            'Aline esta jogando sem abrir brecha.',
        ],
    },
    {
        id: 'bruno-marreta',
        name: 'Bruno Marreta',
        archetype: 'Triturador de questoes',
        description: 'Vive empilhando questoes e tenta abrir a corrida cedo.',
        basePower: 0.82,
        volatility: 0.07,
        favoredCategories: ['questoes', 'extras'],
        weakCategories: ['leitura'],
        taunts: [
            'Bruno bateu mais uma leva de questoes sem hesitar.',
            'Bruno abriu a manha acelerando no contador.',
            'Bruno esta tentando te obrigar a responder na mesma moeda.',
        ],
    },
    {
        id: 'clara-monastica',
        name: 'Clara Monastica',
        archetype: 'Disciplina fria',
        description: 'Cresce na consistencia e quase sempre limpa habitos e tarefas.',
        basePower: 0.78,
        volatility: 0.04,
        favoredCategories: ['habitos', 'tarefas'],
        weakCategories: ['extras'],
        taunts: [
            'Clara limpou a lista do dia antes de olhar para o relogio.',
            'Clara segue pontuando sem drama e sem ruído.',
            'Clara esta ganhando na base da rotina impecavel.',
        ],
    },
    {
        id: 'diego-tatico',
        name: 'Diego Tatico',
        archetype: 'Especialista de longo prazo',
        description: 'Converte leitura e skill tree em pressao silenciosa.',
        basePower: 0.76,
        volatility: 0.05,
        favoredCategories: ['skillTree', 'leitura'],
        weakCategories: ['tarefas'],
        taunts: [
            'Diego esta te cortando pelo flanco da skill tree.',
            'Diego achou mais pontos onde quase ninguem olha.',
            'Diego esta transformando estudo profundo em vantagem real.',
        ],
    },
    {
        id: 'eva-clutch',
        name: 'Eva Clutch',
        archetype: 'Final de campeonato',
        description: 'Comeca tranquila e cresce demais quando o projeto aperta.',
        basePower: 0.68,
        volatility: 0.08,
        favoredCategories: ['questoes', 'skillTree'],
        weakCategories: ['habitos'],
        clutchWindow: {
            startDay: 45,
            endDay: 67,
            bonus: 0.11,
        },
        taunts: [
            'Eva ligou o modo decisao e o fim do ciclo chegou.',
            'Eva adora quando a margem fica curta.',
            'Eva virou o ritmo justo na reta final.',
        ],
    },
    {
        id: 'felipe-caotico',
        name: 'Felipe Caotico',
        archetype: 'Explosao instavel',
        description: 'Tem dias absurdos e dias irreconheciveis.',
        basePower: 0.62,
        volatility: 0.16,
        favoredCategories: ['extras', 'questoes'],
        weakCategories: ['habitos', 'leitura'],
        taunts: [
            'Felipe acertou um pico absurdo hoje.',
            'Felipe caiu em caos ou em genialidade, nunca no meio.',
            'Felipe acabou de transformar bagunca em pontos.',
        ],
    },
    {
        id: 'giulia-fenix',
        name: 'Giulia Fenix',
        archetype: 'Recuperacao feroz',
        description: 'Quanto mais atras, mais agressiva fica.',
        basePower: 0.58,
        volatility: 0.09,
        favoredCategories: ['tarefas', 'extras'],
        weakCategories: ['leitura'],
        recoveryBoost: 0.18,
        taunts: [
            'Giulia nao aceita ficar atras por muito tempo.',
            'Giulia voltou pro jogo como se tivesse sido provocada.',
            'Giulia esta transformando desvantagem em combustivel.',
        ],
    },
    {
        id: 'hugo-sombra',
        name: 'Hugo Sombra',
        archetype: 'Pressao constante',
        description: 'Nao faz barulho, mas todo dia arranca quase a mesma fatia de pontos.',
        basePower: 0.7,
        volatility: 0.03,
        favoredCategories: ['habitos', 'leitura'],
        weakCategories: ['extras'],
        taunts: [
            'Hugo pontuou de novo e quase ninguem percebeu.',
            'Hugo esta ali, estavel, encostando devagar.',
            'Hugo nao acelera demais nem freia demais. So pressiona.',
        ],
    },
]);

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

    const scoreableHabits = state.habits.filter((habit) => {
        if (habit.archived || habit.isNegative) return false;
        if (habit.goalType === 'BOOLEAN' || !habit.goalType) return true;
        return habit.frequency !== 'WEEKLY';
    });
    const completedHabits = scoreableHabits.filter((habit) => habit.history[dateKey]?.completed).length;
    const habitValue = scoreableHabits.length > 0
        ? Math.min(40, 160 / scoreableHabits.length)
        : 0;
    const habitsMax = roundPoints(scoreableHabits.length * habitValue);
    const habitsPoints = roundPoints(completedHabits * habitValue);
    const habitsBreakdown = buildBreakdown(
        'habitos',
        habitsPoints,
        habitsMax,
        `${completedHabits}/${scoreableHabits.length} habitos scoreaveis concluidos.`,
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
        ? roundPoints((skillProgressPercent / 100) * 140)
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

    const readingBooks = state.books.filter((book) => book.status === 'READING' && (book.dailyGoal || 0) > 0);
    const readingProgressPercent = calculateReadingProgress(state.books);
    const readingMax = readingBooks.length > 0 ? 90 : 0;
    const readingPoints = readingBooks.length > 0
        ? roundPoints((readingProgressPercent / 100) * 90)
        : 0;
    const readingBreakdown = buildBreakdown(
        'leitura',
        readingPoints,
        readingMax,
        `${readingProgressPercent}% da meta de leitura ativa do dia.`,
    );

    const sessionPoints = clamp(todaySessions.reduce((sum, session) => sum + session.points, 0), 0, 40);
    const extraGoalsToday = todaysScheduleTasks.filter((task) => task.goalId !== 'questoes');
    const completedExtraGoals = extraGoalsToday.filter((task) => isTimeSlotTaskQualified(task, goalMap.get(task.goalId))).length;
    const extraGoalsMax = Math.min(30, extraGoalsToday.length * 10);
    const extraGoalsPoints = Math.min(30, completedExtraGoals * 10);
    const extrasMax = 40 + extraGoalsMax;
    const extrasPoints = sessionPoints + extraGoalsPoints;
    const extrasBreakdown = buildBreakdown(
        'extras',
        extrasPoints,
        extrasMax,
        `${sessionPoints}/40 em sessoes extras e ${completedExtraGoals} metas extras qualificadas.`,
    );

    const breakdown = [
        questionsBreakdown,
        habitsBreakdown,
        tasksBreakdown,
        skillTreeBreakdown,
        readingBreakdown,
        extrasBreakdown,
    ];

    const score = breakdown.reduce((sum, entry) => sum + entry.points, 0);
    const maxScore = breakdown.reduce((sum, entry) => sum + entry.maxPoints, 0);

    return {
        date: dateKey,
        projectDay: calculateCurrentDay(state.startDate),
        score,
        maxScore,
        theoreticalMaxScore: COMPETITION_THEORETICAL_DAILY_MAX,
        remainingScore: Math.max(0, maxScore - score),
        breakdown: breakdown
            .map((entry) => ({
                ...entry,
                remainingPoints: Math.max(0, entry.maxPoints - entry.points),
                priority: Math.max(0, entry.maxPoints - entry.points),
            }))
            .sort((left, right) => right.priority - left.priority),
        updatedAt: Date.now(),
    };
};

const getAffinity = (rival: CompetitionRival, categoryId: CompetitionCategoryId) => {
    if (rival.favoredCategories.includes(categoryId)) return 1.2;
    if (rival.weakCategories.includes(categoryId)) return 0.8;
    return 1;
};

const getRivalDayScore = (
    rival: CompetitionRival,
    day: CompetitionSimulationDay & { breakdown: CompetitionScoreBreakdown[]; projectDay: number },
    playerTotalBeforeDay: number,
    rivalTotalBeforeDay: number,
) => {
    const pressureGap = playerTotalBeforeDay - rivalTotalBeforeDay;
    const recoveryPressure = pressureGap > 0
        ? Math.min(0.12, (pressureGap / 1800) * (rival.recoveryBoost || 0.08))
        : 0;
    const headToHeadPressure = Math.abs(pressureGap) < 220 ? 0.04 : 0;
    const clutchBoost = rival.clutchWindow &&
        day.projectDay >= rival.clutchWindow.startDay &&
        day.projectDay <= rival.clutchWindow.endDay
        ? rival.clutchWindow.bonus
        : 0;

    const baseline = clamp(rival.basePower + recoveryPressure + headToHeadPressure + clutchBoost, 0.3, 0.98);
    const categoryScores = day.breakdown.map((entry) => {
        const noise = (seededUnit(`${day.date}:${rival.id}:${entry.id}`) - 0.5) * 2 * rival.volatility;
        const intensity = clamp(baseline + noise, 0.15, 1);
        return roundPoints(entry.maxPoints * clamp(intensity * getAffinity(rival, entry.id), 0, 1));
    });

    const rawScore = categoryScores.reduce((sum, value) => sum + value, 0);
    return Math.min(day.maxScore, rawScore);
};

export const buildCompetitionLeaderboard = (
    roster: CompetitionRival[],
    dailyRecords: Record<string, CompetitionDailyRecord>,
): CompetitionLeaderboardEntry[] => {
    const days = Object.values(dailyRecords)
        .sort((left, right) => left.date.localeCompare(right.date))
        .map((record) => ({
            date: record.date,
            playerScore: record.score,
            maxScore: record.maxScore,
            breakdown: record.breakdown,
            projectDay: record.projectDay,
        }));

    const playerTotal = days.reduce((sum, day) => sum + day.playerScore, 0);
    const entries = roster.map((rival) => {
        let rivalTotal = 0;
        let bestDayScore = 0;
        let todayScore = 0;
        let playerRunningTotal = 0;

        days.forEach((day) => {
            const dayScore = getRivalDayScore(rival, day, playerRunningTotal, rivalTotal);
            rivalTotal += dayScore;
            playerRunningTotal += day.playerScore;
            bestDayScore = Math.max(bestDayScore, dayScore);
            todayScore = day.date === days[days.length - 1]?.date ? dayScore : todayScore;
        });

        const tauntIndex = days.length > 0
            ? Math.floor(seededUnit(`${rival.id}:${days[days.length - 1].date}:taunt`) * rival.taunts.length)
            : 0;

        return {
            id: rival.id,
            name: rival.name,
            archetype: rival.archetype,
            description: rival.description,
            totalScore: rivalTotal,
            todayScore,
            bestDayScore,
            gapToPlayer: rivalTotal - playerTotal,
            gapToLeader: 0,
            rank: 0,
            basePower: rival.basePower,
            taunt: rival.taunts[tauntIndex] || rival.taunts[0] || '',
        };
    });

    const playerEntry: CompetitionLeaderboardEntry = {
        id: 'player',
        name: 'Voce',
        archetype: 'Jogador principal',
        description: 'Seu placar vem do que voce realmente conclui no projeto.',
        totalScore: playerTotal,
        todayScore: days[days.length - 1]?.playerScore || 0,
        bestDayScore: days.reduce((best, day) => Math.max(best, day.playerScore), 0),
        gapToPlayer: 0,
        gapToLeader: 0,
        rank: 0,
        basePower: 1,
        taunt: days.length > 0
            ? 'Seu jogo muda o humor inteiro da tabela.'
            : 'A corrida comeca no primeiro ponto registrado.',
    };

    const combined = [...entries, playerEntry]
        .sort((left, right) => right.totalScore - left.totalScore);

    const leaderScore = combined[0]?.totalScore || 0;
    return combined.map((entry, index) => ({
        ...entry,
        rank: index + 1,
        gapToLeader: entry.totalScore - leaderScore,
    }));
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
