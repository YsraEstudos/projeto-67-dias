/**
 * Reading Prediction Utilities
 * 
 * Calculates daily page/chapter requirements to complete a book by its deadline.
 * Supports exponential distribution across phases (same as Skills).
 */
import { Book } from '../types';
import {
    getStartOfDay,
    parseDate,
    daysDiff,
    addDaysToDate,
    formatDateISO,
    getDayOfWeek,
    formatDateBR,
    getTodayISO,
    DAY_NAMES_PT
} from './dateUtils';

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface ReadingDailyPrediction {
    remainingDays: number;
    pagesPerDay: number;
    isExpired: boolean;
}

export interface ReadingDailyPlanItem {
    date: string;              // YYYY-MM-DD
    dayOfWeek: number;         // 0-6
    dayOfWeekName: string;     // "Domingo", "Segunda", etc.
    pages: number;             // Páginas/capítulos alocados
    isExcluded: boolean;       // Dia excluído pelo usuário
    cumulativePages: number;   // Total acumulado até este dia
    percentOfAverage: number;  // % em relação à média (ex: 30, 100, 170)
    formattedDate: string;     // Pre-computed "20 dez" format
}

export interface ReadingPhaseSummary {
    name: string;
    emoji: string;
    startDay: number;
    endDay: number;
    avgPagesPerDay: number;
    totalPages: number;
    percentRange: string;  // ex: "30%-50%"
}

export interface ReadingDailyPlan {
    items: ReadingDailyPlanItem[];
    totalPages: number;
    remainingPages: number;
    effectiveDays: number;     // Dias úteis (excluindo os marcados como "off")
    avgPagesPerDay: number;
    phases: ReadingPhaseSummary[];
    isExpired: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DAY_NAMES = DAY_NAMES_PT;

// ─────────────────────────────────────────────────────────────────────────────
// BASIC PREDICTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates how many pages per day are needed to complete a book by its deadline.
 * 
 * @param book - The book to analyze
 * @returns ReadingDailyPrediction object or null if no deadline is set
 */
export function calculateReadingDailyRequirement(book: Book): ReadingDailyPrediction | null {
    // No deadline set - can't calculate prediction
    if (!book.deadline) return null;

    // Calculate remaining days
    const today = getStartOfDay(new Date());
    const deadline = getStartOfDay(parseDate(book.deadline));
    const remainingDays = daysDiff(today, deadline);

    // Deadline has passed
    if (remainingDays <= 0) {
        return {
            remainingDays: 0,
            pagesPerDay: 0,
            isExpired: true
        };
    }

    // Calculate remaining pages
    const remainingPages = Math.max(0, book.total - book.current);

    // Already completed
    if (remainingPages <= 0) {
        return {
            remainingDays,
            pagesPerDay: 0,
            isExpired: false
        };
    }

    // Calculate daily requirement
    const pagesPerDay = Math.ceil(remainingPages / remainingDays);

    return {
        remainingDays,
        pagesPerDay,
        isExpired: false
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPONENTIAL DISTRIBUTION SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula o fator multiplicador para um dia específico na curva exponencial.
 * 
 * @param dayIndex - Índice do dia (0 = primeiro dia)
 * @param totalDays - Total de dias úteis
 * @param intensity - Intensidade da curva (0.0 = linear, 1.0 = máximo)
 * @returns Fator multiplicador (ex: 0.3 para início, 1.7 para final)
 */
export function getExponentialFactor(dayIndex: number, totalDays: number, intensity: number = 1.0): number {
    if (totalDays <= 1) return 1.0;

    // Normalizar posição para 0-1
    const position = dayIndex / (totalDays - 1);

    // Curva exponencial usando função sigmoid-like
    // intensity 1.0: range 0.3 - 1.7
    // intensity 0.5: range 0.5 - 1.5
    // intensity 0.0: range 1.0 - 1.0 (linear)
    const minFactor = 1.0 - (0.7 * intensity);  // 0.3 when intensity=1.0
    const maxFactor = 1.0 + (0.7 * intensity);  // 1.7 when intensity=1.0

    // Curva suave usando ease-in
    const curve = Math.pow(position, 1.5);

    return minFactor + (maxFactor - minFactor) * curve;
}

/**
 * Gera o plano diário completo de leitura para um livro.
 * 
 * @param book - Livro com deadline definido
 * @returns ReadingDailyPlan com todos os dias detalhados ou null se não há deadline
 */
export function calculateReadingDailyPlan(book: Book): ReadingDailyPlan | null {
    if (!book.deadline) return null;

    const today = getStartOfDay(new Date());
    const deadline = getStartOfDay(parseDate(book.deadline));
    const totalDays = daysDiff(today, deadline);

    if (totalDays <= 0) {
        return {
            items: [],
            totalPages: 0,
            remainingPages: 0,
            effectiveDays: 0,
            avgPagesPerDay: 0,
            phases: [],
            isExpired: true
        };
    }

    // Calcular páginas restantes
    const remainingPages = Math.max(0, book.total - book.current);

    // Already completed
    if (remainingPages <= 0) {
        return {
            items: [],
            totalPages: 0,
            remainingPages: 0,
            effectiveDays: totalDays,
            avgPagesPerDay: 0,
            phases: [],
            isExpired: false
        };
    }

    const excludedDays = book.excludedDays || [];
    const isExponential = book.distributionType === 'EXPONENTIAL';
    const intensity = book.exponentialIntensity ?? 1.0;

    // Gerar lista de todos os dias
    const items: ReadingDailyPlanItem[] = [];
    let effectiveIndex = 0;

    // Primeiro passo: contar dias úteis
    let effectiveDaysCount = 0;
    for (let i = 0; i < totalDays; i++) {
        const date = addDaysToDate(today, i);
        const dayOfWeek = getDayOfWeek(date);
        if (!excludedDays.includes(dayOfWeek)) {
            effectiveDaysCount++;
        }
    }

    if (effectiveDaysCount === 0) {
        // Todos os dias estão excluídos
        return {
            items: [],
            totalPages: remainingPages,
            remainingPages,
            effectiveDays: 0,
            avgPagesPerDay: 0,
            phases: [],
            isExpired: false
        };
    }

    // Segundo passo: calcular fatores e normalizar
    const factors: number[] = [];
    let factorSum = 0;

    for (let i = 0; i < totalDays; i++) {
        const date = addDaysToDate(today, i);
        const dayOfWeek = getDayOfWeek(date);

        if (excludedDays.includes(dayOfWeek)) {
            factors.push(0);
        } else {
            const factor = isExponential
                ? getExponentialFactor(effectiveIndex, effectiveDaysCount, intensity)
                : 1.0;
            factors.push(factor);
            factorSum += factor;
            effectiveIndex++;
        }
    }

    // Terceiro passo: distribuir páginas
    let cumulative = 0;
    const avgPagesPerDay = remainingPages / effectiveDaysCount;

    for (let i = 0; i < totalDays; i++) {
        const date = addDaysToDate(today, i);
        const dayOfWeek = getDayOfWeek(date);
        const isExcluded = excludedDays.includes(dayOfWeek);

        let pages = 0;
        let percentOfAverage = 0;

        if (!isExcluded && factorSum > 0) {
            pages = Math.round((factors[i] / factorSum) * remainingPages);
            percentOfAverage = Math.round((pages / avgPagesPerDay) * 100);
        }

        cumulative += pages;

        items.push({
            date: formatDateISO(date),
            dayOfWeek,
            dayOfWeekName: DAY_NAMES[dayOfWeek],
            pages,
            isExcluded,
            cumulativePages: cumulative,
            percentOfAverage,
            formattedDate: formatDateBR(date, 'dd MMM')
        });
    }

    // Ajustar arredondamento para totalizar exatamente
    const currentTotal = items.reduce((sum, item) => sum + item.pages, 0);
    const diff = remainingPages - currentTotal;
    if (diff !== 0 && items.length > 0) {
        // Adicionar diferença ao último dia não-excluído
        for (let i = items.length - 1; i >= 0; i--) {
            if (!items[i].isExcluded) {
                items[i].pages += diff;
                // Recalcular cumulativo
                let cum = 0;
                for (const item of items) {
                    cum += item.pages;
                    item.cumulativePages = cum;
                }
                break;
            }
        }
    }

    // Calcular fases (dividir em 4 fases)
    const phases = calculatePhases(items, effectiveDaysCount, avgPagesPerDay);

    return {
        items,
        totalPages: remainingPages,
        remainingPages,
        effectiveDays: effectiveDaysCount,
        avgPagesPerDay,
        phases,
        isExpired: false
    };
}

/**
 * Divide os dias úteis em 4 fases para exibição resumida.
 */
function calculatePhases(items: ReadingDailyPlanItem[], effectiveDays: number, avgPages: number): ReadingPhaseSummary[] {
    if (effectiveDays === 0) return [];

    const effectiveItems = items.filter(i => !i.isExcluded);
    const phaseSize = Math.ceil(effectiveItems.length / 4);

    const phaseConfigs = [
        { name: 'Início', emoji: '🌱' },
        { name: 'Ramp', emoji: '📈' },
        { name: 'Pico', emoji: '🚀' },
        { name: 'Final', emoji: '⭐' }
    ];

    const phases: ReadingPhaseSummary[] = [];

    for (let p = 0; p < 4; p++) {
        const start = p * phaseSize;
        const end = Math.min(start + phaseSize, effectiveItems.length);

        if (start >= effectiveItems.length) break;

        const phaseItems = effectiveItems.slice(start, end);
        const totalPgs = phaseItems.reduce((sum, i) => sum + i.pages, 0);
        const avgPgs = phaseItems.length > 0 ? totalPgs / phaseItems.length : 0;

        const minPercent = Math.round((Math.min(...phaseItems.map(i => i.pages)) / avgPages) * 100);
        const maxPercent = Math.round((Math.max(...phaseItems.map(i => i.pages)) / avgPages) * 100);

        phases.push({
            name: phaseConfigs[p].name,
            emoji: phaseConfigs[p].emoji,
            startDay: start + 1,
            endDay: end,
            avgPagesPerDay: Math.round(avgPgs),
            totalPages: totalPgs,
            percentRange: `${minPercent}%-${maxPercent}%`
        });
    }

    return phases;
}

/**
 * Obtém o plano de hoje a partir do plano diário.
 */
export function getTodayPlan(dailyPlan: ReadingDailyPlan | null): ReadingDailyPlanItem | null {
    if (!dailyPlan || dailyPlan.isExpired || dailyPlan.items.length === 0) return null;
    const today = getTodayISO();
    return dailyPlan.items.find(item => item.date === today) || dailyPlan.items[0];
}

/**
 * Obtém a fase atual baseada no dia de hoje.
 */
export function getCurrentPhase(dailyPlan: ReadingDailyPlan | null, todayPlan: ReadingDailyPlanItem | null): ReadingPhaseSummary | null {
    if (!dailyPlan || dailyPlan.phases.length === 0 || !todayPlan) return null;
    const today = getTodayISO();
    const todayIndex = dailyPlan.items.filter(i => !i.isExcluded).findIndex(i => i.date === today);
    if (todayIndex === -1) return dailyPlan.phases[0];

    for (const phase of dailyPlan.phases) {
        if (todayIndex >= phase.startDay - 1 && todayIndex < phase.endDay) {
            return phase;
        }
    }
    return dailyPlan.phases[dailyPlan.phases.length - 1];
}
