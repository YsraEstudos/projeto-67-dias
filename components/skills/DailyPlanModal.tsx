import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { X, Calendar, BarChart3, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Skill } from '../../types';
import { calculateDailyPlan, DailyPlanItem } from '../../utils/skillPrediction';
import { useSkillsStore } from '../../stores/skillsStore';
import { THEME_VARIANTS, ThemeKey } from './constants';

interface DailyPlanModalProps {
    skill: Skill;
    onClose: () => void;
}

const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Premium modal showing detailed daily study plan with:
 * - Intensity slider for curve adjustment
 * - Visual bar chart of daily distribution
 * - Phase summary table
 * - Day-by-day list with exclusion toggles
 */
export const DailyPlanModal: React.FC<DailyPlanModalProps> = ({ skill: initialSkill, onClose }) => {
    const {
        skills,
        setDistributionType,
        setExponentialIntensity,
        toggleExcludedDay
    } = useSkillsStore();

    // Get current skill from store for reactivity
    const skill = skills.find(s => s.id === initialSkill.id) || initialSkill;

    const [localIntensity, setLocalIntensity] = useState(skill.exponentialIntensity ?? 1.0);
    const deferredIntensity = useDeferredValue(localIntensity);
    const isPending = localIntensity !== deferredIntensity;
    const isExponential = skill.distributionType === 'EXPONENTIAL';
    const theme = (skill.colorTheme as ThemeKey) || 'emerald';
    const variants = THEME_VARIANTS[theme] || THEME_VARIANTS.emerald;

    // Debounce intensity updates to Firestore (increased to 500ms)
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (localIntensity !== (skill.exponentialIntensity ?? 1.0)) {
                setExponentialIntensity(skill.id, localIntensity);
            }
        }, 500);
        return () => clearTimeout(timeout);
    }, [localIntensity, skill.id, skill.exponentialIntensity, setExponentialIntensity]);

    // Memoized plan calculation with deferred intensity for smooth preview
    const plan = useMemo(() => {
        // Create a temporary skill with the deferred intensity for preview
        const previewSkill: Skill = {
            ...skill,
            exponentialIntensity: deferredIntensity
        };
        return calculateDailyPlan(previewSkill);
    }, [skill, deferredIntensity]);

    const handleToggleDistribution = () => {
        setDistributionType(skill.id, isExponential ? 'LINEAR' : 'EXPONENTIAL');
    };

    const handleToggleDay = (dayOfWeek: number) => {
        toggleExcludedDay(skill.id, dayOfWeek);
    };

    const getIntensityLabel = (intensity: number): string => {
        if (intensity < 0.33) return 'Suave';
        if (intensity < 0.66) return 'Moderado';
        return 'Intenso';
    };

    const getIntensityRange = (intensity: number): string => {
        const min = Math.round((1 - 0.7 * intensity) * 100);
        const max = Math.round((1 + 0.7 * intensity) * 100);
        return `${min}% - ${max}%`;
    };

    // Calculate max minutes for bar chart scaling
    const maxMinutes = useMemo(() => {
        if (!plan) return 60;
        return Math.max(...plan.items.filter(i => !i.isExcluded).map(i => i.minutes), 1);
    }, [plan]);

    // Simple pure function - no need for useCallback
    const formatTime = (minutes: number): string => {
        if (minutes < 60) return `${minutes}min`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h ${m}min` : `${h}h`;
    };

    if (!plan) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-slate-800 rounded-2xl p-6 text-center">
                    <AlertTriangle className="mx-auto mb-3 text-amber-400" size={32} />
                    <p className="text-white">Defina um deadline para ver o plano diário.</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-700 rounded-lg text-white">
                        Fechar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            <Calendar className={variants.text} size={20} />
                            Plano Diário: {skill.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            {plan.effectiveDays} dias úteis • {formatTime(plan.remainingMinutes)} restantes
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="text-slate-400 hover:text-white" size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Distribution Toggle & Intensity Slider */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Distribution Type Toggle */}
                        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                            <label className="text-xs text-slate-500 uppercase font-bold block mb-3">
                                Tipo de Distribuição
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setDistributionType(skill.id, 'LINEAR')}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${!isExponential
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    📊 Linear
                                </button>
                                <button
                                    onClick={() => setDistributionType(skill.id, 'EXPONENTIAL')}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${isExponential
                                        ? 'bg-purple-600 text-white shadow-lg'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    📈 Exponencial
                                </button>
                            </div>
                        </div>

                        {/* Intensity Slider */}
                        <div className={`bg-slate-900 rounded-xl p-4 border border-slate-700 transition-opacity ${isExponential ? '' : 'opacity-50 pointer-events-none'
                            }`}>
                            <label className="text-xs text-slate-500 uppercase font-bold block mb-3">
                                🎚️ Intensidade da Curva
                            </label>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className={`font-medium ${localIntensity > 0.66 ? 'text-purple-400' : localIntensity > 0.33 ? 'text-blue-400' : 'text-emerald-400'}`}>
                                        {getIntensityLabel(localIntensity)}
                                    </span>
                                    <span className="text-slate-500">{getIntensityRange(localIntensity)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={localIntensity}
                                    onChange={(e) => setLocalIntensity(parseFloat(e.target.value))}
                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    style={{
                                        background: `linear-gradient(to right, #10b981 0%, #3b82f6 50%, #a855f7 100%)`
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Visual Bar Chart */}
                    <div className={`bg-slate-900 rounded-xl p-4 border border-slate-700 transition-opacity duration-200 ${isPending ? 'opacity-70' : ''}`}>
                        <label className="text-xs text-slate-500 uppercase font-bold block mb-3 flex items-center gap-2">
                            📊 Distribuição Visual
                            {isPending && <span className="animate-pulse text-purple-400">Calculando...</span>}
                        </label>
                        <div className="flex items-end gap-1 h-32 overflow-x-auto pb-2">
                            {plan.items.map((item, idx) => {
                                const height = item.isExcluded ? 4 : (item.minutes / maxMinutes) * 100;
                                const isWeekend = item.dayOfWeek === 0 || item.dayOfWeek === 6;
                                return (
                                    <div
                                        key={idx}
                                        className="flex flex-col items-center group flex-shrink-0"
                                        style={{ minWidth: '20px' }}
                                    >
                                        <div
                                            className={`w-4 rounded-t transition-all relative ${item.isExcluded
                                                ? 'bg-slate-700'
                                                : isWeekend
                                                    ? 'bg-amber-500/70'
                                                    : variants.bg
                                                }`}
                                            style={{ height: `${height}%`, minHeight: '4px' }}
                                            title={`${item.dayOfWeekName}: ${formatTime(item.minutes)}`}
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                <div className="bg-slate-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                                                    <div className="font-medium">{item.dayOfWeekName}</div>
                                                    <div className="text-slate-300">{formatTime(item.minutes)}</div>
                                                    <div className="text-slate-400 text-[10px]">{item.percentOfAverage}% da média</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1 px-1">
                            <span>Dia 1</span>
                            <span>Dia {plan.items.length}</span>
                        </div>
                    </div>

                    {/* Phase Summary */}
                    {plan.phases.length > 0 && (
                        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                            <label className="text-xs text-slate-500 uppercase font-bold block mb-3">
                                🎯 Resumo de Fases
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {plan.phases.map((phase, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-slate-800 rounded-lg p-3 text-center border border-slate-700"
                                    >
                                        <div className="text-2xl mb-1">{phase.emoji}</div>
                                        <div className="text-sm font-bold text-white">{phase.name}</div>
                                        <div className="text-xs text-slate-500">Dias {phase.startDay}-{phase.endDay}</div>
                                        <div className={`text-lg font-mono font-bold ${variants.text} mt-1`}>
                                            {formatTime(phase.avgMinutesPerDay)}
                                        </div>
                                        <div className="text-[10px] text-slate-500">/dia ({phase.percentRange})</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Day Exclusion Settings */}
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                        <label className="text-xs text-slate-500 uppercase font-bold block mb-3">
                            📅 Dias Excluídos (dias "off")
                        </label>
                        <div className="flex gap-2 justify-center">
                            {DAY_NAMES_SHORT.map((name, dayOfWeek) => {
                                const isExcluded = skill.excludedDays?.includes(dayOfWeek);
                                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                return (
                                    <button
                                        key={dayOfWeek}
                                        onClick={() => handleToggleDay(dayOfWeek)}
                                        className={`w-12 h-12 rounded-xl font-medium text-sm transition-all ${isExcluded
                                            ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50'
                                            : isWeekend
                                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:border-amber-500/50'
                                                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                                            }`}
                                        title={isExcluded ? 'Clique para incluir' : 'Clique para excluir'}
                                    >
                                        {name}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-slate-500 text-center mt-2">
                            Clique nos dias que você não vai estudar
                        </p>
                    </div>

                    {/* Daily Details List */}
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                        <label className="text-xs text-slate-500 uppercase font-bold block mb-3">
                            📋 Detalhes por Dia ({plan.items.length} dias)
                        </label>
                        <div className="max-h-96 overflow-y-auto space-y-1">
                            {plan.items.map((item, idx) => (
                                <DayRow
                                    key={idx}
                                    item={item}
                                    idx={idx + 1}
                                    avgMinutes={plan.avgMinutesPerDay}
                                    variants={variants}
                                    formatTime={formatTime}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-between items-center">
                    <div className="text-sm text-slate-400">
                        <Clock size={14} className="inline mr-1" />
                        Média: <span className={`font-bold ${variants.text}`}>{formatTime(Math.round(plan.avgMinutesPerDay))}</span>/dia
                    </div>
                    <button
                        onClick={onClose}
                        className={`px-6 py-2 ${variants.button} rounded-xl font-bold transition-colors`}
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper component for day rows
interface DayRowProps {
    item: DailyPlanItem;
    idx: number;
    avgMinutes: number;
    variants: typeof THEME_VARIANTS[keyof typeof THEME_VARIANTS];
    formatTime: (minutes: number) => string;
}

const DayRow: React.FC<DayRowProps> = React.memo(({ item, idx, avgMinutes, variants, formatTime }) => {
    const percentDiff = item.isExcluded ? 0 : Math.round((item.minutes / avgMinutes) * 100) - 100;

    return (
        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${item.isExcluded ? 'opacity-40' : 'hover:bg-slate-800'
            }`}>
            <div className="w-8 text-xs text-slate-500 font-mono">{idx}</div>
            <div className="w-24">
                <div className="text-sm text-white font-medium">{item.dayOfWeekName}</div>
                <div className="text-[10px] text-slate-500">{item.formattedDate}</div>
            </div>
            <div className="flex-1">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${item.isExcluded ? 'bg-slate-600' : variants.bg} transition-all`}
                        style={{ width: `${item.isExcluded ? 0 : Math.min(100, item.percentOfAverage)}%` }}
                    />
                </div>
            </div>
            <div className="w-20 text-right">
                {item.isExcluded ? (
                    <span className="text-xs text-red-400 font-medium">OFF</span>
                ) : (
                    <span className={`text-sm font-bold ${variants.text}`}>{formatTime(item.minutes)}</span>
                )}
            </div>
            <div className="w-16 text-right text-xs">
                {!item.isExcluded && (
                    <span className={percentDiff >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                        {percentDiff >= 0 ? '+' : ''}{percentDiff}%
                    </span>
                )}
            </div>
        </div>
    );
});

DayRow.displayName = 'DayRow';
