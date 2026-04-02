import {
    Book,
    CompetitionCategoryId,
    CompetitionDailyRecord,
    CompetitionScoreBreakdown,
    Habit,
    OrganizeTask,
    Skill,
    TimeSlotGoalConfig,
    TimeSlotTask,
} from '../types';
import type { MetTargetSession } from '../stores/workStore';
import { calculateCurrentDay } from '../services/weeklySnapshot';
import {
    calculateSkillProgress,
    getReadingDailyProgressSnapshot,
} from './dailyOffensiveUtils';
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
    // Use local date formatting to avoid UTC timezone mismatch
    // new Date().toISOString() gives UTC time, which for GMT-3 late-night events
    // would incorrectly show the *next* day, ignoring today's XP.
    const d = new Date(timestamp);
    const localDateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return localDateKey === dateKey;
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

export const CHAMPIONSHIP_LEAGUES: import('../types').CompetitionLeague[] = [
    { name: 'Bronze III', minPoints: 0, maxPoints: 500, rankRange: [10000, 8000], color: 'text-orange-700' },
    { name: 'Bronze II', minPoints: 501, maxPoints: 1000, rankRange: [8000, 6500], color: 'text-orange-600' },
    { name: 'Bronze I', minPoints: 1001, maxPoints: 2000, rankRange: [6500, 5000], color: 'text-orange-500' },
    { name: 'Prata III', minPoints: 2001, maxPoints: 3500, rankRange: [5000, 4000], color: 'text-slate-400' },
    { name: 'Prata II', minPoints: 3501, maxPoints: 5000, rankRange: [4000, 3000], color: 'text-slate-300' },
    { name: 'Prata I', minPoints: 5001, maxPoints: 7000, rankRange: [3000, 2000], color: 'text-slate-200' },
    { name: 'Ouro III', minPoints: 7001, maxPoints: 9500, rankRange: [2000, 1000], color: 'text-yellow-500' },
    { name: 'Ouro II', minPoints: 9501, maxPoints: 12500, rankRange: [1000, 500], color: 'text-yellow-400' },
    { name: 'Ouro I', minPoints: 12501, maxPoints: 16000, rankRange: [500, 200], color: 'text-yellow-300' },
    { name: 'Platina', minPoints: 16001, maxPoints: 22000, rankRange: [200, 50], color: 'text-cyan-400' },
    { name: 'Diamante', minPoints: 22001, maxPoints: 30000, rankRange: [50, 10], color: 'text-purple-400' },
    { name: 'Mestre', minPoints: 30001, maxPoints: Infinity, rankRange: [10, 1], color: 'text-rose-500' },
];

export const calculateLeagueStanding = (totalPoints: number) => {
    let currentLeagueIndex = CHAMPIONSHIP_LEAGUES.findIndex(l => totalPoints >= l.minPoints && totalPoints <= l.maxPoints);
    if (currentLeagueIndex === -1) {
        if (totalPoints > CHAMPIONSHIP_LEAGUES[CHAMPIONSHIP_LEAGUES.length - 1].maxPoints) {
            currentLeagueIndex = CHAMPIONSHIP_LEAGUES.length - 1;
        } else {
            currentLeagueIndex = 0;
        }
    }
    
    const league = CHAMPIONSHIP_LEAGUES[currentLeagueIndex];
    const nextLeague = currentLeagueIndex < CHAMPIONSHIP_LEAGUES.length - 1 ? CHAMPIONSHIP_LEAGUES[currentLeagueIndex + 1] : null;

    const pointProgress = Math.max(0, totalPoints - Math.max(0, league.minPoints));
    const tierSize = league.maxPoints - Math.max(0, league.minPoints);
    const rankSize = league.rankRange[0] - league.rankRange[1];
    
    let currentRank = league.rankRange[0];
    if (tierSize > 0 && tierSize !== Infinity) {
        const progressPercent = Math.min(1, pointProgress / tierSize);
        currentRank = Math.floor(league.rankRange[0] - (rankSize * progressPercent));
    } else if (tierSize === Infinity) {
        currentRank = Math.max(1, league.rankRange[0] - Math.floor(pointProgress / 1000));
    }
    
    const pointsToNext = nextLeague ? (nextLeague.minPoints - totalPoints) : 0;

    return {
        currentLeague: league,
        currentRank: Math.max(1, currentRank),
        nextLeague,
        pointsToNext: Math.max(0, pointsToNext)
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

    const scoreableHabits = state.habits.filter((habit) => {
        if (habit.archived || habit.isNegative) return false;
        // Weekly habits (of any type) must not count toward daily XP.
        // They only require completion once per week, so including them in
        // the daily score would either inflate maxScore or unfairly penalize.
        if (habit.frequency === 'WEEKLY') return false;
        return true;
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

    const readingSnapshot = getReadingDailyProgressSnapshot(state.books, dateKey);
    const readingMax = readingSnapshot.activeBooksCount > 0 ? 90 : 0;
    const readingPoints = readingSnapshot.activeBooksCount > 0
        ? roundPoints((readingSnapshot.progressPercent / 100) * 90)
        : 0;
    const readingBreakdown = buildBreakdown(
        'leitura',
        readingPoints,
        readingMax,
        `${readingSnapshot.totalPagesReadToday} ${readingSnapshot.totalPagesReadToday === 1 ? 'pagina' : 'paginas'} hoje (${readingSnapshot.progressPercent}% da meta diaria).`,
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

// === CHAMPSIONSHIP NEW ENGINE (V2) ===

export const generateCumulativeHistory = (dailyRecords: Record<string, CompetitionDailyRecord>, daysToLookBack = 10) => {
    const history = [];
    const sortedKeys = Object.keys(dailyRecords).sort();
    
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysToLookBack + 1);
    
    let baseScore = 0;
    for (const key of sortedKeys) {
        if (new Date(key) < getStartOfDay(startDate)) {
            baseScore += dailyRecords[key].score;
        }
    }

    let currentScore = baseScore;
    let fakeTopScoreDelta = 0;
    
    for (let i = daysToLookBack - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        
        const dayRecord = dailyRecords[iso];
        if (dayRecord) {
            currentScore += dayRecord.score;
        }
        
        const seedStr = iso + "fake";
        const dailyGrowthFake = Math.floor(200 + seededUnit(seedStr) * 150);
        fakeTopScoreDelta += dailyGrowthFake;

        history.push({
            date: iso,
            dateLabel: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
            fullDateLabel: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            playerTotal: currentScore,
            playerDaily: dayRecord ? dayRecord.score : 0,
            simulatedRivalTotal: baseScore + fakeTopScoreDelta, 
        });
    }

    return history;
};

export const generateSimulatedRivals = (playerTotal: number, playerRank: number) => {
    const rivals = [];
    const names = ['Alex', 'Luccas', 'Sarah', 'Jorge', 'Alice', 'Pedro', 'Nathalia', 'Leo', 'Marcos', 'Julia', 'Caio', 'Malu'];
    const titles = ['🔥', '⚡', '🛡️', '⚔️', '🎯', '🚀'];
    
    for (let i = -2; i <= 2; i++) {
        if (i === 0) continue; 
        const rivalRank = playerRank + i;
        if (rivalRank < 1) continue;
        
        const seed = hashSeed(`rival-v2-${rivalRank}`);
        const nameIndex = seed % names.length;
        const titleIndex = (seed >> 2) % titles.length;
        
        const pointDiff = (i * (15 + (seed % 10))) + (seed % 20); 
        const rivalScore = Math.max(0, playerTotal - pointDiff);

        rivals.push({
            id: `fake-${rivalRank}`,
            rank: rivalRank,
            name: `${names[nameIndex]} ${titles[titleIndex]}`,
            score: rivalScore
        });
    }
    
    return rivals.sort((a, b) => a.rank - b.rank);
};
