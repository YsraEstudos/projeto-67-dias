// Tipos do módulo Trabalho (WorkView)

import type { PaceMode as StorePaceMode } from '../../../stores/work/trackingSlice';

/** Status atual do dia de trabalho */
export type WorkStatus = 'PRE_BREAK' | 'BREAK' | 'POST_BREAK' | 'FINISHED';

/** Modo de cálculo de ritmo (10 ou 25 minutos) - re-exportado do store */
export type PaceMode = StorePaceMode;

/** Metas de trabalho configuráveis */
export interface WorkGoals {
    weekly: number;
    ultra: number;
    anki: number;
    ncm: number;
    refactorings: number;
}

/** Input para cálculo de métricas de trabalho */
export interface WorkMetricsInput {
    goal: number;
    startTime: string;
    endTime: string;
    breakTime: string;
    currentCount: number;
    preBreakCount: number;
    paceMode: PaceMode;
}

/** Sessão extra após bater a meta diária */
export interface MetTargetSession {
    id: string;
    date: string;
    ankiCount: number;
    ncmCount: number;
    refactoringsCount?: number;
    durationSeconds: number;
}

/** Matéria de estudo */
export interface StudySubject {
    id: string;
    name: string;
    color: string; // Tailwind color class (e.g., 'bg-blue-500')
    createdAt: number;
}

/** Item agendado para um dia */
export interface ScheduledStudyItem {
    subjectId: string;
    type: 'VIDEO' | 'ANKI';
    isCompleted: boolean;
}

/** Planejamento diário */
export interface DailyStudySchedule {
    date: string; // ISO date (YYYY-MM-DD)
    items: ScheduledStudyItem[];
}

/** Dados de trabalho persistidos (localStorage/Firebase) */
export interface WorkData {
    goal: number;
    startTime: string;
    endTime: string;
    breakTime: string;
    currentCount: number;
    preBreakCount: number;
    paceMode: PaceMode;
    // Configurable Goals
    weeklyGoal?: number;
    ultraWeeklyGoal?: number;
    ankiDailyGoal?: number;
    ncmDailyGoal?: number;
    refactoringsDailyGoal?: number;
    // Study Scheduler
    studySubjects?: StudySubject[];
    studySchedules?: DailyStudySchedule[];
    lastUpdated: string;
}
