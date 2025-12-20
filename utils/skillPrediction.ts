/**
 * Skill Prediction Utilities
 * 
 * Calculates daily requirements to complete a skill by its deadline.
 */
import { Skill } from '../types';

export interface DailyPrediction {
    remainingDays: number;
    pomodorosPerDay: number;
    hoursPerDay: number;
    isExpired: boolean;
}

/**
 * Calculates how many pomodoros/hours per day are needed to complete a skill by its deadline.
 * 
 * @param skill - The skill to analyze
 * @returns DailyPrediction object or null if no deadline is set
 */
export function calculateDailyRequirement(skill: Skill): DailyPrediction | null {
    // No deadline set - can't calculate prediction
    if (!skill.deadline) return null;

    // Calculate remaining days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(skill.deadline);
    deadline.setHours(0, 0, 0, 0);

    const diffMs = deadline.getTime() - today.getTime();
    const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Deadline has passed
    if (remainingDays <= 0) {
        return {
            remainingDays: 0,
            pomodorosPerDay: 0,
            hoursPerDay: 0,
            isExpired: true
        };
    }

    // Calculate remaining units based on goal type
    const isPomodoro = skill.goalType === 'POMODOROS';

    let remainingUnits: number;
    if (isPomodoro) {
        const goal = skill.goalPomodoros || 0;
        const completed = skill.pomodorosCompleted || 0;
        remainingUnits = Math.max(0, goal - completed);
    } else {
        remainingUnits = Math.max(0, skill.goalMinutes - skill.currentMinutes);
    }

    // Already completed
    if (remainingUnits <= 0) {
        return {
            remainingDays,
            pomodorosPerDay: 0,
            hoursPerDay: 0,
            isExpired: false
        };
    }

    // Calculate daily requirement
    const unitsPerDay = Math.ceil(remainingUnits / remainingDays);

    if (isPomodoro) {
        // Units are pomodoros
        return {
            remainingDays,
            pomodorosPerDay: unitsPerDay,
            hoursPerDay: (unitsPerDay * 25) / 60, // 25 min per pomodoro
            isExpired: false
        };
    } else {
        // Units are minutes
        return {
            remainingDays,
            pomodorosPerDay: Math.ceil(unitsPerDay / 25), // Convert minutes to pomodoros
            hoursPerDay: unitsPerDay / 60,
            isExpired: false
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPONENTIAL DISTRIBUTION SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export interface DailyPlanItem {
    date: string;              // YYYY-MM-DD
    dayOfWeek: number;         // 0-6
    dayOfWeekName: string;     // "Domingo", "Segunda", etc.
    minutes: number;           // Tempo alocado
    isExcluded: boolean;       // Dia excluído pelo usuário
    cumulativeMinutes: number; // Total acumulado até este dia
    percentOfAverage: number;  // % em relação à média (ex: 30, 100, 170)
    formattedDate: string;     // Pre-computed "20 dez" format
}

export interface PhaseSummary {
    name: string;
    emoji: string;
    startDay: number;
    endDay: number;
    avgMinutesPerDay: number;
    totalMinutes: number;
    percentRange: string;  // ex: "30%-50%"
}

export interface DailyPlan {
    items: DailyPlanItem[];
    totalMinutes: number;
    remainingMinutes: number;
    effectiveDays: number;     // Dias úteis (excluindo os marcados como "off")
    avgMinutesPerDay: number;
    phases: PhaseSummary[];
    isExpired: boolean;
}

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
 * Gera o plano diário completo de estudo para uma skill.
 * 
 * @param skill - Skill com deadline definido
 * @returns DailyPlan com todos os dias detalhados ou null se não há deadline
 */
export function calculateDailyPlan(skill: Skill): DailyPlan | null {
    if (!skill.deadline) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(skill.deadline);
    deadline.setHours(0, 0, 0, 0);

    const diffMs = deadline.getTime() - today.getTime();
    const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (totalDays <= 0) {
        return {
            items: [],
            totalMinutes: 0,
            remainingMinutes: 0,
            effectiveDays: 0,
            avgMinutesPerDay: 0,
            phases: [],
            isExpired: true
        };
    }

    // Calcular minutos restantes
    const isPomodoro = skill.goalType === 'POMODOROS';
    let remainingMinutes: number;

    if (isPomodoro) {
        const goalPom = skill.goalPomodoros || 0;
        const completedPom = skill.pomodorosCompleted || 0;
        remainingMinutes = Math.max(0, (goalPom - completedPom) * 25);
    } else {
        remainingMinutes = Math.max(0, skill.goalMinutes - skill.currentMinutes);
    }

    // Already completed
    if (remainingMinutes <= 0) {
        return {
            items: [],
            totalMinutes: 0,
            remainingMinutes: 0,
            effectiveDays: totalDays,
            avgMinutesPerDay: 0,
            phases: [],
            isExpired: false
        };
    }

    const excludedDays = skill.excludedDays || [];
    const isExponential = skill.distributionType === 'EXPONENTIAL';
    const intensity = skill.exponentialIntensity ?? 1.0;

    // Gerar lista de todos os dias
    const items: DailyPlanItem[] = [];
    let effectiveIndex = 0;

    // Primeiro passo: contar dias úteis
    let effectiveDaysCount = 0;
    for (let i = 0; i < totalDays; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dayOfWeek = date.getDay();
        if (!excludedDays.includes(dayOfWeek)) {
            effectiveDaysCount++;
        }
    }

    if (effectiveDaysCount === 0) {
        // Todos os dias estão excluídos
        return {
            items: [],
            totalMinutes: remainingMinutes,
            remainingMinutes,
            effectiveDays: 0,
            avgMinutesPerDay: 0,
            phases: [],
            isExpired: false
        };
    }

    // Segundo passo: calcular fatores e normalizar
    const factors: number[] = [];
    let factorSum = 0;

    for (let i = 0; i < totalDays; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dayOfWeek = date.getDay();

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

    // Terceiro passo: distribuir minutos
    let cumulative = 0;
    const avgMinutesPerDay = remainingMinutes / effectiveDaysCount;

    for (let i = 0; i < totalDays; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dayOfWeek = date.getDay();
        const dateStr = date.toISOString().split('T')[0];
        const isExcluded = excludedDays.includes(dayOfWeek);

        let minutes = 0;
        let percentOfAverage = 0;

        if (!isExcluded && factorSum > 0) {
            minutes = Math.round((factors[i] / factorSum) * remainingMinutes);
            percentOfAverage = Math.round((minutes / avgMinutesPerDay) * 100);
        }

        cumulative += minutes;

        items.push({
            date: dateStr,
            dayOfWeek,
            dayOfWeekName: DAY_NAMES[dayOfWeek],
            minutes,
            isExcluded,
            cumulativeMinutes: cumulative,
            percentOfAverage,
            formattedDate: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        });
    }

    // Ajustar arredondamento para totalizar exatamente
    const currentTotal = items.reduce((sum, item) => sum + item.minutes, 0);
    const diff = remainingMinutes - currentTotal;
    if (diff !== 0 && items.length > 0) {
        // Adicionar diferença ao último dia não-excluído
        for (let i = items.length - 1; i >= 0; i--) {
            if (!items[i].isExcluded) {
                items[i].minutes += diff;
                // Recalcular cumulativo
                let cum = 0;
                for (const item of items) {
                    cum += item.minutes;
                    item.cumulativeMinutes = cum;
                }
                break;
            }
        }
    }

    // Calcular fases (dividir em 4 fases)
    const phases = calculatePhases(items, effectiveDaysCount, avgMinutesPerDay);

    return {
        items,
        totalMinutes: remainingMinutes,
        remainingMinutes,
        effectiveDays: effectiveDaysCount,
        avgMinutesPerDay,
        phases,
        isExpired: false
    };
}

/**
 * Divide os dias úteis em 4 fases para exibição resumida.
 */
function calculatePhases(items: DailyPlanItem[], effectiveDays: number, avgMinutes: number): PhaseSummary[] {
    if (effectiveDays === 0) return [];

    const effectiveItems = items.filter(i => !i.isExcluded);
    const phaseSize = Math.ceil(effectiveItems.length / 4);

    const phaseConfigs = [
        { name: 'Início', emoji: '🌱' },
        { name: 'Ramp', emoji: '📈' },
        { name: 'Pico', emoji: '🚀' },
        { name: 'Final', emoji: '⭐' }
    ];

    const phases: PhaseSummary[] = [];

    for (let p = 0; p < 4; p++) {
        const start = p * phaseSize;
        const end = Math.min(start + phaseSize, effectiveItems.length);

        if (start >= effectiveItems.length) break;

        const phaseItems = effectiveItems.slice(start, end);
        const totalMins = phaseItems.reduce((sum, i) => sum + i.minutes, 0);
        const avgMins = phaseItems.length > 0 ? totalMins / phaseItems.length : 0;

        const minPercent = Math.round((Math.min(...phaseItems.map(i => i.minutes)) / avgMinutes) * 100);
        const maxPercent = Math.round((Math.max(...phaseItems.map(i => i.minutes)) / avgMinutes) * 100);

        phases.push({
            name: phaseConfigs[p].name,
            emoji: phaseConfigs[p].emoji,
            startDay: start + 1,
            endDay: end,
            avgMinutesPerDay: Math.round(avgMins),
            totalMinutes: totalMins,
            percentRange: `${minPercent}%-${maxPercent}%`
        });
    }

    return phases;
}
