import React, { Suspense, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useHabitsManager } from './hooks/useHabitsManager';
import { WaterTracker } from '../../habits/WaterTracker';
import HabitCard from '../../habits/HabitCard';
import { getActiveConsequences, getConsequenceSummary, getConsequencesForTomorrow, getTomorrowTriggerSummary } from '../../../utils/habitConsequences';

const HabitModal = React.lazy(() => import('../../habits/HabitModal'));

interface HabitsPanelProps {
    manager: ReturnType<typeof useHabitsManager>;
    categories: string[]; // Start passing categories if needed for the modal, or use the one from tasks? 
    // Wait, the HabitModal needs categories. Logic in View was computing categories from both tasks and habits.
    // I should probably separate that or accept it as prop.
    // The useTasksManager computes categories. useHabitsManager does not.
    // I'll accept `categories` as prop.
}

export const HabitsPanel: React.FC<HabitsPanelProps> = ({ manager, categories }) => {
    const {
        habits,
        selectedDate,
        changeDay,
        handleToggleHabitCompletion,
        handleLogValue,
        handleEditHabit,
        deleteHabit,
        isHabitModalOpen,
        setIsHabitModalOpen,
        setEditingHabit,
        editingHabit,
        handleSaveHabit
    } = manager;

    // Calculate active consequences for the selected date
    const dateKey = selectedDate.toISOString().split('T')[0];
    const activeConsequences = useMemo(
        () => getActiveConsequences(habits, dateKey),
        [habits, dateKey]
    );

    // Calculate consequences accumulated today for tomorrow
    const tomorrowConsequences = useMemo(
        () => getConsequencesForTomorrow(habits, dateKey),
        [habits, dateKey]
    );

    const isToday = selectedDate.toDateString() === new Date().toDateString();
    
    const confirmedTomorrow = useMemo(
        () => tomorrowConsequences.filter(c => c.status === 'CONFIRMED'),
        [tomorrowConsequences]
    );

    const threatenedTomorrow = useMemo(
        () => tomorrowConsequences.filter(c => c.status === 'THREATENED'),
        [tomorrowConsequences]
    );

    return (
        <div className="flex flex-col gap-6">
            {/* WATER TRACKER */}
            <WaterTracker />

            {/* Date Navigator */}
            <div className="flex items-center justify-between bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg">
                <button onClick={() => changeDay(-1)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>

                <div className="flex flex-col items-center">
                    <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Registro Diário</div>
                    <div className="flex items-center gap-2 text-xl font-bold text-white">
                        <Calendar size={20} className="text-slate-400" />
                        {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                        {selectedDate.toDateString() === new Date().toDateString() && <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">Hoje</span>}
                    </div>
                </div>

                <button onClick={() => changeDay(1)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* CONSEQUENCES BANNER */}
            {activeConsequences.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 shadow-lg animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={18} className="text-amber-400" />
                        <span className="text-sm font-bold text-amber-300 uppercase tracking-wide">
                            Consequências Ativas Hoje (Falhas de Ontem)
                        </span>
                    </div>
                    <div className="space-y-2">
                        {activeConsequences.map((ac, i) => (
                            <div key={i} className="flex items-start gap-2 bg-amber-900/20 rounded-lg p-2.5">
                                <span className="text-amber-400 font-bold text-sm">⚡</span>
                                <div>
                                    <div className="text-sm font-bold text-amber-200">{ac.consequence.description}</div>
                                    <div className="text-xs text-amber-400/70 mt-0.5">
                                        {getConsequenceSummary(ac)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* LIVE TOMORROW CONSEQUENCES FOR TODAY */}
            {isToday && tomorrowConsequences.length > 0 && (
                <div className="flex flex-col gap-3 p-4 bg-slate-800/40 border border-slate-700 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                            Impacto para Amanhã (Feedback em Tempo Real)
                        </span>
                    </div>
                    
                    {/* Confirmed Consequences (Red/Amber) */}
                    {confirmedTomorrow.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                            <div className="text-xs font-bold text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                ❌ Confirmado para amanhã (Falhou hoje)
                            </div>
                            <div className="space-y-2">
                                {confirmedTomorrow.map((tc, i) => (
                                    <div key={i} className="bg-red-950/20 border border-red-900/20 rounded-lg p-2 flex flex-col gap-0.5">
                                        <span className="text-sm font-bold text-red-200">🎯 {tc.consequence.description}</span>
                                        <span className="text-[10px] text-red-400/80">{getTomorrowTriggerSummary(tc)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Threatened/Pending Consequences (Yellow) */}
                    {threatenedTomorrow.length > 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                            <div className="text-xs font-bold text-yellow-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                ⚠️ Em risco para amanhã (Realize o hábito para sumir)
                            </div>
                            <div className="space-y-2">
                                {threatenedTomorrow.map((tc, i) => (
                                    <div key={i} className="bg-yellow-950/20 border border-yellow-900/20 rounded-lg p-2 flex flex-col gap-0.5">
                                        <span className="text-sm font-bold text-yellow-200">⏳ {tc.consequence.description}</span>
                                        <span className="text-[10px] text-yellow-400/80">{getTomorrowTriggerSummary(tc)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-4">
                {habits.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                        <CheckCircle2 size={48} className="text-slate-700 mb-4" />
                        <p className="text-slate-500 font-medium">Nenhum hábito criado ainda.</p>
                    </div>
                )}

                {habits.map(habit => (
                    <HabitCard
                        key={habit.id}
                        habit={habit}
                        selectedDate={selectedDate}
                        onToggle={handleToggleHabitCompletion}
                        onLogValue={handleLogValue}
                        onEdit={handleEditHabit}
                        onDelete={deleteHabit}
                    />
                ))}
            </div>

            {/* HABIT CREATE/EDIT MODAL */}
            {isHabitModalOpen && (
                <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>}>
                    <HabitModal
                        categories={categories}
                        habit={editingHabit}
                        allHabits={habits}
                        onClose={() => { setIsHabitModalOpen(false); setEditingHabit(null); }}
                        onSave={handleSaveHabit}
                    />
                </Suspense>
            )}
        </div>
    );
};
