import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, Plus, Settings, Sparkles, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { useSkillsStore } from '../../../stores/skillsStore';
import { useWeeklyAgendaStore } from '../../../stores/weeklyAgendaStore';
import { DayColumn } from './DayColumn';
import { DayPlanModal } from './DayPlanModal';
import { TomorrowModal } from './TomorrowModal';
import { ActivityModal } from './ActivityModal';
import {
    getWeekDates,
    calculateWeekProgress,
    calculateDayProgress,
    getDayOfWeek,
    getEffectiveDayPlan,
    formatMinutes,
    getTomorrowDate
} from '../../../utils/weeklyAgendaUtils';

const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const WeeklyAgenda: React.FC = () => {
    const { skills } = useSkillsStore();
    const { weeklyPlan, overrides, activities, logActivityTime } = useWeeklyAgendaStore();

    // State for modals
    const [showDayPlanModal, setShowDayPlanModal] = useState<number | null>(null);
    const [showTomorrowModal, setShowTomorrowModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState<string | boolean>(false);
    const [weekOffset, setWeekOffset] = useState(0);

    // Calculate week dates with offset
    const baseDate = useMemo(() => {
        const date = new Date();
        date.setDate(date.getDate() + weekOffset * 7);
        return date.toISOString().split('T')[0];
    }, [weekOffset]);

    const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);

    // Calculate weekly progress
    const weekProgress = useMemo(() =>
        calculateWeekProgress(skills, activities, weeklyPlan, overrides, baseDate),
        [skills, activities, weeklyPlan, overrides, baseDate]
    );

    // Pre-compute maps for O(1) lookups
    const skillsMap = useMemo(() => {
        const map = new Map<string, typeof skills[0]>();
        skills.forEach(s => map.set(s.id, s));
        return map;
    }, [skills]);

    const activitiesMap = useMemo(() => {
        const map = new Map<string, typeof activities[0]>();
        activities.forEach(a => map.set(a.id, a));
        return map;
    }, [activities]);

    // Build day details for each column
    const dayDetails = useMemo(() => {
        return weekDates.map(date => {
            const dayOfWeek = getDayOfWeek(date);
            const plan = getEffectiveDayPlan(date, weeklyPlan, overrides);
            const progress = calculateDayProgress(date, skills, activities, weeklyPlan, overrides);

            // Add color info to details using O(1) map lookup
            const detailsWithColors = progress.details.map(d => {
                if (d.type === 'skill') {
                    const skill = skillsMap.get(d.id);
                    return { ...d, color: skill?.colorTheme || 'emerald' };
                } else {
                    const activity = activitiesMap.get(d.id);
                    return { ...d, color: activity?.color || 'blue' };
                }
            });

            return {
                date,
                dayOfWeek,
                percentage: progress.percentage,
                details: detailsWithColors,
                isOverride: plan.isOverride,
                overrideReason: plan.reason
            };
        });
    }, [weekDates, skills, activities, weeklyPlan, overrides, skillsMap, activitiesMap]);

    // Handle adding time - memoized for performance
    const handleAddTime = useCallback((id: string) => {
        const minutesStr = prompt('Quantos minutos adicionar?', '30');
        if (!minutesStr) return;
        const minutes = parseInt(minutesStr);
        if (isNaN(minutes) || minutes <= 0) return;

        // Check if it's a skill or activity
        const skill = skills.find(s => s.id === id);
        if (skill) {
            // Use skills store to add log
            useSkillsStore.getState().addLog(id, {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                minutes
            });
        } else {
            // It's an activity
            logActivityTime(id, minutes);
        }
    }, [skills, logActivityTime]);

    // Memoize tomorrow override lookup
    const tomorrowOverride = useMemo(() =>
        overrides.find(o => o.date === getTomorrowDate()),
        [overrides]
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => setWeekOffset(o => o - 1)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="text-center">
                        <div className="text-white font-bold">
                            {weekOffset === 0 ? 'Esta Semana' : weekOffset === 1 ? 'Próxima Semana' : weekOffset === -1 ? 'Semana Passada' : `Semana ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
                        </div>
                        <div className="text-xs text-slate-500">
                            {weekDates[0]} → {weekDates[6]}
                        </div>
                    </div>

                    <button
                        onClick={() => setWeekOffset(o => o + 1)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Weekly Progress Bar */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-400 flex items-center gap-2">
                            <BarChart3 size={16} />
                            Progresso Semanal
                        </span>
                        <span className={`font-bold ${weekProgress.percentage >= 80 ? 'text-emerald-400' : weekProgress.percentage >= 50 ? 'text-blue-400' : 'text-slate-400'}`}>
                            {weekProgress.percentage}%
                        </span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-700 ${weekProgress.percentage >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                                weekProgress.percentage >= 50 ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                                    'bg-slate-500'
                                }`}
                            style={{ width: `${Math.min(100, weekProgress.percentage)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>{formatMinutes(weekProgress.completedMinutes)} concluído</span>
                        <span>{formatMinutes(weekProgress.targetMinutes)} meta</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setShowActivityModal(true)}
                        className="flex-1 min-w-[140px] px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus size={16} />
                        Nova Atividade
                    </button>
                    <button
                        onClick={() => setShowTomorrowModal(true)}
                        className="flex-1 min-w-[140px] px-3 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                        <Sparkles size={16} />
                        Ajustar Amanhã
                    </button>
                </div>
            </div>

            {/* Day Plan Configuration Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {DAY_NAMES_SHORT.map((name, idx) => {
                    const hasPlan = weeklyPlan.some(p => p.dayOfWeek === idx);
                    return (
                        <button
                            key={idx}
                            onClick={() => setShowDayPlanModal(idx)}
                            className={`flex-shrink-0 px-3 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${hasPlan
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                                }`}
                        >
                            <Settings size={12} />
                            {name}
                        </button>
                    );
                })}
            </div>

            {/* Weekly Grid */}
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory">
                {dayDetails.map((day) => (
                    <div key={day.date} className="snap-start">
                        <DayColumn
                            date={day.date}
                            dayOfWeek={day.dayOfWeek}
                            percentage={day.percentage}
                            details={day.details}
                            isOverride={day.isOverride}
                            overrideReason={day.overrideReason}
                            onAddTime={handleAddTime}
                        />
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {weeklyPlan.length === 0 && activities.length === 0 && (
                <div className="text-center py-12 bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-700">
                    <Calendar size={48} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-white font-bold text-lg mb-2">Sua Agenda está vazia</h3>
                    <p className="text-slate-500 text-sm mb-4">
                        Configure os dias da semana para definir metas diárias
                    </p>
                    <button
                        onClick={() => setShowDayPlanModal(1)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition-colors"
                    >
                        Configurar Segunda-feira
                    </button>
                </div>
            )}

            {/* Modals */}
            {showDayPlanModal !== null && (
                <DayPlanModal
                    dayOfWeek={showDayPlanModal}
                    skills={skills}
                    activities={activities}
                    existingPlan={weeklyPlan.find(p => p.dayOfWeek === showDayPlanModal)}
                    onClose={() => setShowDayPlanModal(null)}
                />
            )}

            {showTomorrowModal && (
                <TomorrowModal
                    skills={skills}
                    activities={activities}
                    weeklyPlan={weeklyPlan}
                    existingOverride={tomorrowOverride}
                    onClose={() => setShowTomorrowModal(false)}
                />
            )}

            {showActivityModal && (
                <ActivityModal
                    existingActivity={typeof showActivityModal === 'string' ? activities.find(a => a.id === showActivityModal) : undefined}
                    onClose={() => setShowActivityModal(false)}
                />
            )}
        </div>
    );
};

export default WeeklyAgenda;
