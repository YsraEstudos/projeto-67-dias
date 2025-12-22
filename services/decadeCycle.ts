/**
 * Decade Cycle Service (10 Anos / 55 Ciclos)
 * Gerencia a lógica de progressão de longo prazo do Projeto 67 Dias.
 */

import {
    CycleSnapshot,
    JourneyReviewData,
    WeeklySnapshot,
    ImprovementPoint
} from '../types';

export const DECADE_CONFIG = {
    TOTAL_CYCLES: 55,
    DAYS_PER_CYCLE: 67,
    TOTAL_DAYS: 3685, // 55 * 67
    YEARS_APPROX: 10,
    MIN_GOAL_LENGTH: 20 // Caracteres mínimos para o objetivo do ciclo
} as const;

/**
 * Calcula o progresso geral da jornada de 10 anos
 */
export function calculateDecadeProgress(
    currentCycle: number,
    currentDayInCycle: number // 0-67
): { percentage: number; yearsElapsed: number; yearsRemaining: number; totalDaysPassed: number } {
    // Ciclos completos anteriores (currentCycle é 1-indexed)
    const cyclesCompleted = Math.max(0, currentCycle - 1);

    // Dias totais passados
    const totalDaysPassed = (cyclesCompleted * DECADE_CONFIG.DAYS_PER_CYCLE) + Math.min(DECADE_CONFIG.DAYS_PER_CYCLE, currentDayInCycle);

    // Porcentagem total
    const percentage = Math.min(100, (totalDaysPassed / DECADE_CONFIG.TOTAL_DAYS) * 100);

    // Anos passados e restantes (aprox)
    const yearsElapsed = Number((totalDaysPassed / 365.25).toFixed(1));
    const yearsRemaining = Number(((DECADE_CONFIG.TOTAL_DAYS - totalDaysPassed) / 365.25).toFixed(1));

    return {
        percentage,
        yearsElapsed,
        yearsRemaining,
        totalDaysPassed
    };
}

/**
 * Verifica se o ciclo atual pode ser finalizado
 */
export function canFinalizeCycle(
    currentDay: number,
    cycleGoal?: string
): { ready: boolean; reason?: string } {
    if (currentDay < DECADE_CONFIG.DAYS_PER_CYCLE) {
        return {
            ready: false,
            reason: `Você está no dia ${currentDay}. Complete os 67 dias para finalizar o ciclo.`
        };
    }

    if (!cycleGoal || cycleGoal.trim().length < DECADE_CONFIG.MIN_GOAL_LENGTH) {
        return {
            ready: false,
            reason: `Defina um objetivo claro para este ciclo (mínimo ${DECADE_CONFIG.MIN_GOAL_LENGTH} caracteres) antes de finalizar.`
        };
    }

    return { ready: true };
}

/**
 * Cria um snapshot do ciclo atual (arquivamento)
 */
export function createCycleSnapshot(
    cycleNumber: number,
    reviewData: JourneyReviewData,
    cycleGoal: string,
    startDate: string,
    goalAchieved: 'YES' | 'PARTIAL' | 'NO' = 'YES'
): CycleSnapshot {
    const snapshots = reviewData.snapshots || [];

    // Calcular estatísticas agregadas do ciclo
    const totalHabitsCompleted = snapshots.reduce((sum, s) => sum + s.metrics.habitsCompleted, 0);
    const averageConsistency = snapshots.length > 0
        ? Math.round(snapshots.reduce((sum, s) => sum + s.metrics.habitConsistency, 0) / snapshots.length)
        : 0;

    const totalBooksRead = snapshots.length > 0
        ? snapshots[snapshots.length - 1].metrics.booksCompleted
        : 0; // Assume acumulativo

    const totalPagesRead = snapshots.length > 0
        ? snapshots[snapshots.length - 1].metrics.booksProgress
        : 0; // Assume acumulativo

    const totalSkillHours = Math.round(
        snapshots.reduce((sum, s) => sum + s.metrics.skillMinutes, 0) / 60
    );

    const totalTasksCompleted = snapshots.reduce((sum, s) => sum + s.metrics.tasksCompleted, 0);
    const totalJournalEntries = snapshots.reduce((sum, s) => sum + s.metrics.journalEntries, 0);

    // Score geral do ciclo (média dos scores semanais)
    const overallScore = snapshots.length > 0
        ? Math.round(snapshots.reduce((sum, s) => sum + (s.evolution?.overallScore || 0), 0) / snapshots.length)
        : 0;

    return {
        cycleNumber,
        startDate,
        endDate: new Date().toISOString(), // Data atual como fim
        completedAt: Date.now(),
        cycleGoal,
        goalAchieved,

        finalStats: {
            totalHabitsCompleted,
            averageConsistency,
            totalBooksRead,
            totalPagesRead,
            totalSkillHours,
            totalTasksCompleted,
            totalJournalEntries,
            overallScore
        },

        weeklySnapshots: [...snapshots] // Cópia dos snapshots da semana
    };
}

/**
 * Agrega estatísticas de todos os ciclos completados
 */
export function aggregateCycleStats(history: CycleSnapshot[]) {
    if (history.length === 0) {
        return {
            cyclesCompleted: 0,
            totalDaysProgressed: 0,
            bestCycle: undefined,
            averageScore: 0
        };
    }

    const cyclesCompleted = history.length;
    const totalDaysProgressed = cyclesCompleted * DECADE_CONFIG.DAYS_PER_CYCLE;

    // Calcular melhor ciclo (baseado no score)
    let bestCycle = history[0].cycleNumber;
    let maxScore = history[0].finalStats.overallScore;
    let totalScore = 0;

    history.forEach(cycle => {
        totalScore += cycle.finalStats.overallScore;
        if (cycle.finalStats.overallScore > maxScore) {
            maxScore = cycle.finalStats.overallScore;
            bestCycle = cycle.cycleNumber;
        }
    });

    const averageScore = Math.round(totalScore / cyclesCompleted);

    return {
        cyclesCompleted,
        totalDaysProgressed,
        bestCycle,
        averageScore
    };
}
