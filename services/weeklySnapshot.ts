/**
 * Weekly Snapshot Service
 * Gerencia a captura e análise de snapshots semanais para o sistema de progressão de 67 dias.
 */

import {
    WeeklySnapshot,
    WeeklyMetrics,
    WeeklyEvolution,
    ImprovementPoint,
    FinalJourneySummary,
    Habit,
    Skill,
    Book,
    OrganizeTask,
    Game,
    CENTRAL_FOLDER_ID
} from '../types';

// --- CONFIGURAÇÕES DA JORNADA ---

export const JOURNEY_CONFIG = {
    TOTAL_DAYS: 67,
    EFFECTIVE_DAYS: 63,  // Dias usados no cálculo (margem de 4 dias de folga)
    DISPLAY_DAYS: 67,    // Dias exibidos no UI
    TOTAL_WEEKS: 10,
    DAYS_PER_WEEK: 7,
    // Sistema de Ciclos (10 Anos)
    TOTAL_CYCLES: 55,
    DECADE_YEARS: 10,
} as const;

export const SCORING_CONFIG = {
    // Ponderação do score geral
    WEIGHTS: {
        HABITS: 0.35,
        SKILLS: 0.25,
        READING: 0.2,
        TASKS: 0.1,
        GAMES: 0.1,
    },
    // Metas semanais para 100%
    WEEKLY_TARGETS: {
        SKILL_MINUTES: 420,    // 1h/dia = 7h/semana
        PAGES_READ: 100,
        TASKS_COMPLETED: 7,
        GAMES_HOURS: 5,        // 5h jogo/semana
    },
    // Thresholds de alerta
    THRESHOLDS: {
        LOW_CONSISTENCY: 70,
        CRITICAL_CONSISTENCY: 50,
        MIN_SKILL_MINUTES: 120,   // 2h/semana
        MIN_SKILL_MINUTES_CRITICAL: 60,  // 1h/semana
        SIGNIFICANT_DECLINE: 15,
        TREND_THRESHOLD: 5,
    },
} as const;

// --- UTILIDADES DE DATA ---

/**
 * Calcula a semana atual da jornada baseado na data de início
 * Normaliza as datas para meia-noite local para evitar bugs de timezone
 */
export function calculateCurrentWeek(startDate: string): number {
    const start = new Date(startDate);
    const now = new Date();

    // Normalize both dates to midnight (local time)
    const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = nowMidnight.getTime() - startMidnight.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.min(
        JOURNEY_CONFIG.TOTAL_WEEKS,
        Math.max(1, Math.ceil((diffDays + 1) / JOURNEY_CONFIG.DAYS_PER_WEEK))
    );
}

/**
 * Calcula o dia atual da jornada (0-67)
 * Retorna 0 se a jornada ainda não iniciou (startDate no futuro)
 * Normaliza as datas para meia-noite local para evitar bugs de timezone
 */
export function calculateCurrentDay(startDate: string): number {
    const start = new Date(startDate);
    const now = new Date();

    // Normalize both dates to midnight (local time) for day comparison
    const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = nowMidnight.getTime() - startMidnight.getTime();
    const dayDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Se startDate está no futuro, retorna 0 (jornada não iniciada)
    if (dayDiff < 0) {
        return 0;
    }

    // Day 1 is the start day, Day 2 is the next day, etc.
    return Math.min(JOURNEY_CONFIG.TOTAL_DAYS, dayDiff + 1);
}

/**
 * Calcula quantos dias faltam para o início da jornada
 * Retorna 0 se já começou ou se é hoje
 */
export function getDaysUntilStart(startDate: string): number {
    const start = new Date(startDate);
    const now = new Date();

    const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = startMidnight.getTime() - nowMidnight.getTime();
    const dayDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, dayDiff);
}

/**
 * Retorna as datas de início e fim de uma semana específica
 */
export function getWeekDateRange(startDate: string, weekNumber: number): { startDate: string; endDate: string } {
    const start = new Date(startDate);
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * JOURNEY_CONFIG.DAYS_PER_WEEK);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Helper to format as YYYY-MM-DD using local time
    const toLocalDateString = (date: Date): string => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    return {
        startDate: toLocalDateString(weekStart),
        endDate: toLocalDateString(weekEnd)
    };
}

/**
 * Verifica se um snapshot deve ser gerado (passou uma semana desde o último)
 */
export function shouldGenerateSnapshot(
    lastSnapshotWeek: number,
    startDate: string
): boolean {
    const currentWeek = calculateCurrentWeek(startDate);
    return currentWeek > lastSnapshotWeek;
}

// --- CAPTURA DE MÉTRICAS ---

/**
 * Captura as métricas de uma semana específica
 */
export function captureWeeklyMetrics(
    weekNumber: number,
    startDate: string,
    habits: Habit[],
    skills: Skill[],
    books: Book[],
    tasks: OrganizeTask[],
    games: Game[],
    journalEntryCount: number
): WeeklyMetrics {
    const { startDate: weekStart, endDate: weekEnd } = getWeekDateRange(startDate, weekNumber);

    // Filter games for 67 Days folder
    const centralGames = games.filter(g => g.folderId === CENTRAL_FOLDER_ID);

    // Games: horas jogadas na semana
    let gamesHoursPlayed = 0;
    centralGames.forEach(game => {
        const weekLogs = game.history.filter(log =>
            log.date >= weekStart && log.date <= weekEnd
        );
        gamesHoursPlayed += weekLogs.reduce((sum, log) => sum + log.hoursPlayed, 0);
    });

    // Games: zerados na semana
    // Nota: Usamos updatedAt como proxy para data de completion se não houver um campo específico
    const gamesCompleted = centralGames.filter(g =>
        g.status === 'COMPLETED' &&
        g.updatedAt >= new Date(weekStart).getTime() &&
        g.updatedAt <= new Date(weekEnd).getTime()
    ).length;

    // Games: resenhas feitas na semana
    const gamesReviewed = centralGames.filter(g =>
        g.review && !g.reviewPending &&
        g.updatedAt >= new Date(weekStart).getTime() &&
        g.updatedAt <= new Date(weekEnd).getTime()
    ).length;

    // Hábitos: calcular consistência da semana
    let habitsCompleted = 0;
    let habitsTotal = 0;

    const activeHabits = habits.filter(h => !h.archived);
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const dateKey = d.toISOString().split('T')[0];

        activeHabits.forEach(habit => {
            habitsTotal++;
            if (habit.history[dateKey]?.completed) {
                habitsCompleted++;
            }
        });
    }

    const habitConsistency = habitsTotal > 0
        ? Math.round((habitsCompleted / habitsTotal) * 100)
        : 0;

    // Skills: minutos registrados na semana
    let skillMinutes = 0;
    const skillsProgressed: string[] = [];

    skills.forEach(skill => {
        const weekLogs = skill.logs.filter(log => {
            const logDate = log.date;
            return logDate >= weekStart && logDate <= weekEnd;
        });

        if (weekLogs.length > 0) {
            const minutesThisWeek = weekLogs.reduce((sum, log) => sum + log.minutes, 0);
            skillMinutes += minutesThisWeek;
            if (minutesThisWeek > 0) {
                skillsProgressed.push(skill.id);
            }
        }
    });

    // Livros: páginas lidas e livros completados na semana
    // Nota: Como não temos histórico de leitura por data, usamos valores acumulados
    const booksCompleted = books.filter(b => b.status === 'COMPLETED').length;
    const booksProgress = books.reduce((sum, b) => sum + b.current, 0);

    // Tarefas: completadas na semana
    const tasksCompleted = tasks.filter(t => t.isCompleted && !t.isArchived).length;

    return {
        habitsCompleted,
        habitsTotal,
        habitConsistency,
        booksProgress,
        booksCompleted,
        skillMinutes,
        skillsProgressed,
        tasksCompleted,
        journalEntries: journalEntryCount,
        gamesHoursPlayed,
        gamesCompleted,
        gamesReviewed
    };
}

// --- CÁLCULO DE EVOLUÇÃO ---

/**
 * Calcula a evolução entre duas semanas
 */
export function calculateEvolution(
    current: WeeklyMetrics,
    previous: WeeklyMetrics | null
): WeeklyEvolution {
    if (!previous) {
        // Primeira semana - sem comparação
        const baseScore = calculateOverallScore(current);
        return {
            habitsChange: 0,
            skillsChange: 0,
            readingChange: 0,
            gamesChange: 0,
            overallScore: baseScore,
            trend: 'STABLE'
        };
    }

    const habitsChange = current.habitConsistency - previous.habitConsistency;
    const skillsChange = current.skillMinutes - previous.skillMinutes;
    const readingChange = current.booksProgress - previous.booksProgress;
    const gamesChange = (current.gamesHoursPlayed || 0) - (previous.gamesHoursPlayed || 0);

    const currentScore = calculateOverallScore(current);
    const previousScore = calculateOverallScore(previous);
    const scoreDiff = currentScore - previousScore;

    let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    if (scoreDiff > SCORING_CONFIG.THRESHOLDS.TREND_THRESHOLD) trend = 'UP';
    else if (scoreDiff < -SCORING_CONFIG.THRESHOLDS.TREND_THRESHOLD) trend = 'DOWN';

    return {
        habitsChange,
        skillsChange,
        readingChange,
        gamesChange,
        overallScore: currentScore,
        trend
    };
}

/**
 * Calcula um score geral de 0-100 baseado nas métricas
 */
export function calculateOverallScore(metrics: WeeklyMetrics): number {
    const { WEIGHTS, WEEKLY_TARGETS } = SCORING_CONFIG;

    // Hábitos: já é 0-100
    const habitScore = metrics.habitConsistency;

    // Skills: baseado na meta semanal
    const skillScore = Math.min(100, (metrics.skillMinutes / WEEKLY_TARGETS.SKILL_MINUTES) * 100);

    // Leitura: baseado na meta de páginas
    const readingScore = Math.min(100, (metrics.booksProgress / WEEKLY_TARGETS.PAGES_READ) * 100);

    // Tarefas: baseado na meta semanal
    const taskScore = Math.min(100, (metrics.tasksCompleted / WEEKLY_TARGETS.TASKS_COMPLETED) * 100);

    // Games: baseado na meta de horas
    const gamesScore = Math.min(100, ((metrics.gamesHoursPlayed || 0) / WEEKLY_TARGETS.GAMES_HOURS) * 100);

    return Math.round(
        habitScore * WEIGHTS.HABITS +
        skillScore * WEIGHTS.SKILLS +
        readingScore * WEIGHTS.READING +
        taskScore * WEIGHTS.TASKS +
        gamesScore * WEIGHTS.GAMES
    );
}

// --- GERAÇÃO DE SNAPSHOT ---

/**
 * Gera um novo snapshot semanal (status PENDING para confirmação do usuário)
 */
export function generateWeeklySnapshot(
    weekNumber: number,
    startDate: string,
    habits: Habit[],
    skills: Skill[],
    books: Book[],
    tasks: OrganizeTask[],
    games: Game[],
    journalEntryCount: number,
    previousSnapshot: WeeklySnapshot | null
): WeeklySnapshot {
    const metrics = captureWeeklyMetrics(
        weekNumber,
        startDate,
        habits,
        skills,
        books,
        tasks,
        games,
        journalEntryCount
    );

    const evolution = calculateEvolution(
        metrics,
        previousSnapshot?.metrics || null
    );

    const { startDate: weekStart, endDate: weekEnd } = getWeekDateRange(startDate, weekNumber);

    return {
        id: `week_${weekNumber}_${Date.now()}`,
        weekNumber,
        startDate: weekStart,
        endDate: weekEnd,
        capturedAt: Date.now(),
        metrics,
        evolution,
        status: 'PENDING' // Aguarda confirmação do usuário
    };
}

// --- DETECÇÃO DE PONTOS DE MELHORIA ---

/**
 * Detecta pontos de melhoria baseado nos snapshots
 */
export function detectImprovements(
    snapshots: WeeklySnapshot[]
): ImprovementPoint[] {
    const improvements: ImprovementPoint[] = [];

    if (snapshots.length === 0) return improvements;

    const latestSnapshot = snapshots[snapshots.length - 1];
    const metrics = latestSnapshot.metrics;

    const { THRESHOLDS } = SCORING_CONFIG;

    // Hábitos abaixo do threshold
    if (metrics.habitConsistency < THRESHOLDS.LOW_CONSISTENCY) {
        improvements.push({
            id: `imp_habits_${Date.now()}`,
            category: 'HABITS',
            title: 'Consistência de Hábitos Baixa',
            description: `Sua consistência está em ${metrics.habitConsistency}%. Tente manter acima de ${THRESHOLDS.LOW_CONSISTENCY}% para resultados melhores.`,
            priority: metrics.habitConsistency < THRESHOLDS.CRITICAL_CONSISTENCY ? 'HIGH' : 'MEDIUM',
            weekIdentified: latestSnapshot.weekNumber,
            isAddressed: false
        });
    }

    // Menos de 2 horas de skill por semana
    if (metrics.skillMinutes < THRESHOLDS.MIN_SKILL_MINUTES) {
        improvements.push({
            id: `imp_skills_${Date.now()}`,
            category: 'SKILLS',
            title: 'Tempo de Estudo Insuficiente',
            description: `Apenas ${Math.round(metrics.skillMinutes / 60)}h de estudo esta semana. Tente dedicar pelo menos ${THRESHOLDS.MIN_SKILL_MINUTES / 60}h semanais.`,
            priority: metrics.skillMinutes < THRESHOLDS.MIN_SKILL_MINUTES_CRITICAL ? 'HIGH' : 'MEDIUM',
            weekIdentified: latestSnapshot.weekNumber,
            isAddressed: false
        });
    }

    // Nenhuma entrada de diário
    if (metrics.journalEntries === 0) {
        improvements.push({
            id: `imp_journal_${Date.now()}`,
            category: 'JOURNAL',
            title: 'Sem Reflexões no Diário',
            description: 'Nenhuma entrada de diário esta semana. Escrever ajuda a processar pensamentos e acompanhar seu crescimento.',
            priority: 'LOW',
            weekIdentified: latestSnapshot.weekNumber,
            isAddressed: false
        });
    }

    // Queda acentuada em relação à semana anterior
    if (latestSnapshot.evolution?.trend === 'DOWN' && latestSnapshot.evolution.habitsChange < -THRESHOLDS.SIGNIFICANT_DECLINE) {
        improvements.push({
            id: `imp_decline_${Date.now()}`,
            category: 'HABITS',
            title: 'Queda de Performance',
            description: `Houve uma queda de ${Math.abs(latestSnapshot.evolution.habitsChange)}% na consistência. Identifique o que mudou esta semana.`,
            priority: 'HIGH',
            weekIdentified: latestSnapshot.weekNumber,
            isAddressed: false
        });
    }

    return improvements;
}

// --- RESUMO FINAL DA JORNADA ---

/**
 * Gera o resumo final quando a jornada de 67 dias é concluída
 */
export function generateFinalSummary(
    snapshots: WeeklySnapshot[],
    improvements: ImprovementPoint[]
): FinalJourneySummary {
    // Agregar estatísticas de todos os snapshots
    const totalHabitsCompleted = snapshots.reduce((sum, s) => sum + s.metrics.habitsCompleted, 0);
    const averageConsistency = snapshots.length > 0
        ? Math.round(snapshots.reduce((sum, s) => sum + s.metrics.habitConsistency, 0) / snapshots.length)
        : 0;

    const totalBooksRead = snapshots.length > 0
        ? snapshots[snapshots.length - 1].metrics.booksCompleted
        : 0;

    const totalPagesRead = snapshots.length > 0
        ? snapshots[snapshots.length - 1].metrics.booksProgress
        : 0;

    const totalSkillHours = Math.round(
        snapshots.reduce((sum, s) => sum + s.metrics.skillMinutes, 0) / 60
    );

    const totalTasksCompleted = snapshots.reduce((sum, s) => sum + s.metrics.tasksCompleted, 0);
    const totalJournalEntries = snapshots.reduce((sum, s) => sum + s.metrics.journalEntries, 0);

    // Curva de evolução
    const evolutionCurve = snapshots.map(s => s.evolution?.overallScore || 0);

    // Melhor e pior semana
    let bestWeek = 1;
    let challengingWeek = 1;
    let bestScore = 0;
    let worstScore = 100;

    snapshots.forEach(s => {
        const score = s.evolution?.overallScore || 0;
        if (score > bestScore) {
            bestScore = score;
            bestWeek = s.weekNumber;
        }
        if (score < worstScore) {
            worstScore = score;
            challengingWeek = s.weekNumber;
        }
    });

    return {
        generatedAt: Date.now(),
        totalDays: JOURNEY_CONFIG.TOTAL_DAYS,
        finalStats: {
            totalHabitsCompleted,
            averageConsistency,
            totalBooksRead,
            totalPagesRead,
            totalSkillHours,
            totalTasksCompleted,
            totalJournalEntries
        },
        evolutionCurve,
        bestWeek,
        challengingWeek
    };
}
