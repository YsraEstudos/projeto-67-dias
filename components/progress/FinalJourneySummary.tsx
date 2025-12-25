import React from 'react';
import {
    Trophy, Flame, BookOpen, GraduationCap,
    CheckCircle2, PenLine, Star,
    TrendingUp, Zap
} from 'lucide-react';
import { FinalJourneySummary } from '../../types';

interface FinalJourneySummaryProps {
    summary: FinalJourneySummary;
}

export const FinalJourneySummaryComponent: React.FC<FinalJourneySummaryProps> = React.memo(({
    summary
}) => {
    const { finalStats, evolutionCurve, bestWeek, challengingWeek } = summary;

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-3xl p-8 border border-indigo-500/30 overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                <div className="relative z-10 text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-6 shadow-2xl shadow-amber-500/30">
                        <Trophy size={48} className="text-white" />
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                        🎉 Jornada Concluída!
                    </h1>
                    <p className="text-xl text-indigo-200 mb-2">
                        {summary.totalDays} dias de transformação pessoal
                    </p>
                    <p className="text-slate-400">
                        Gerado em {new Date(summary.generatedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 text-center">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-orange-500/20">
                        <Flame size={24} className="text-orange-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{finalStats.averageConsistency}%</div>
                    <div className="text-sm text-slate-400">Consistência Média</div>
                </div>

                <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 text-center">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-yellow-500/20">
                        <BookOpen size={24} className="text-yellow-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{finalStats.totalBooksRead}</div>
                    <div className="text-sm text-slate-400">Livros Lidos</div>
                    <div className="text-xs text-slate-500 mt-1">{finalStats.totalPagesRead} páginas</div>
                </div>

                <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 text-center">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-500/20">
                        <GraduationCap size={24} className="text-emerald-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{finalStats.totalSkillHours}h</div>
                    <div className="text-sm text-slate-400">Horas de Estudo</div>
                </div>

                <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 text-center">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-500/20">
                        <CheckCircle2 size={24} className="text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{finalStats.totalTasksCompleted}</div>
                    <div className="text-sm text-slate-400">Tarefas Concluídas</div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                    <Flame size={20} className="mx-auto text-orange-400 mb-2" />
                    <div className="text-2xl font-bold text-white">{finalStats.totalHabitsCompleted}</div>
                    <div className="text-xs text-slate-500">Check-ins de Hábitos</div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                    <PenLine size={20} className="mx-auto text-purple-400 mb-2" />
                    <div className="text-2xl font-bold text-white">{finalStats.totalJournalEntries}</div>
                    <div className="text-xs text-slate-500">Entradas no Diário</div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                    <TrendingUp size={20} className="mx-auto text-teal-400 mb-2" />
                    <div className="text-2xl font-bold text-white">{evolutionCurve.length}</div>
                    <div className="text-xs text-slate-500">Semanas Registradas</div>
                </div>
            </div>

            {/* Best & Challenging Weeks */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-amber-900/30 to-slate-800 rounded-2xl p-5 border border-amber-500/30">
                    <div className="flex items-center gap-3 mb-2">
                        <Star size={24} className="text-amber-400 fill-amber-400" />
                        <h3 className="text-lg font-bold text-white">Melhor Semana</h3>
                    </div>
                    <p className="text-3xl font-bold text-amber-400">Semana {bestWeek}</p>
                    <p className="text-sm text-slate-400 mt-1">
                        Score: {evolutionCurve[bestWeek - 1] || 0} pontos
                    </p>
                </div>

                <div className="bg-gradient-to-r from-slate-800 to-rose-900/30 rounded-2xl p-5 border border-rose-500/30">
                    <div className="flex items-center gap-3 mb-2">
                        <Zap size={24} className="text-rose-400" />
                        <h3 className="text-lg font-bold text-white">Semana Desafiadora</h3>
                    </div>
                    <p className="text-3xl font-bold text-rose-400">Semana {challengingWeek}</p>
                    <p className="text-sm text-slate-400 mt-1">
                        Você superou!
                    </p>
                </div>
            </div>
        </div>
    );
});

export default FinalJourneySummaryComponent;
