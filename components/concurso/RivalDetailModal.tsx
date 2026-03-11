import React from 'react';
import { Shield, TrendingUp, X } from 'lucide-react';
import { CompetitionRival } from '../../types';
import { CompetitionLeaderboardEntry } from '../../utils/competitionEngine';

interface RivalDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    rival: CompetitionRival | null;
    entry: CompetitionLeaderboardEntry | null;
}

const formatCategory = (value: string) => {
    if (value === 'skillTree') return 'Skill Tree';
    const first = value.charAt(0).toUpperCase() + value.slice(1);
    return first;
};

export const RivalDetailModal: React.FC<RivalDetailModalProps> = ({
    isOpen,
    onClose,
    rival,
    entry,
}) => {
    if (!isOpen || !rival || !entry) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} aria-hidden="true" />
            <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-slate-950/95 shadow-2xl shadow-cyan-500/10">
                <div className="border-b border-slate-800 bg-gradient-to-r from-cyan-500/10 via-slate-900 to-red-500/10 p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">Rival dossier</p>
                            <h3 className="mt-2 text-3xl font-black text-white">{rival.name}</h3>
                            <p className="mt-2 text-sm text-slate-400">{rival.description}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-700 bg-slate-900/80 p-2 text-slate-400 transition hover:border-slate-500 hover:text-white"
                            aria-label="Fechar rival"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="grid gap-5 p-6 lg:grid-cols-[1fr_0.9fr]">
                    <section className="space-y-4">
                        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/60 p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-cyan-300">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{rival.archetype}</p>
                                    <p className="text-xl font-black text-white">{entry.totalScore} pts totais</p>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-center">
                                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Hoje</p>
                                    <p className="mt-1 text-lg font-black text-white">{entry.todayScore}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-center">
                                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Melhor dia</p>
                                    <p className="mt-1 text-lg font-black text-white">{entry.bestDayScore}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-center">
                                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Base</p>
                                    <p className="mt-1 text-lg font-black text-white">{Math.round(rival.basePower * 100)}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/60 p-5">
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Mensagem do dia</p>
                            <p className="mt-3 text-lg font-bold leading-relaxed text-white">{entry.taunt}</p>
                        </div>
                    </section>

                    <aside className="space-y-4">
                        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/60 p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-300">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Afinidades</p>
                                    <p className="text-sm text-slate-300">Onde esse rival arranca mais pontos.</p>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {rival.favoredCategories.map((category) => (
                                    <span
                                        key={category}
                                        className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200"
                                    >
                                        {formatCategory(category)}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/60 p-5">
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Lados fracos</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {rival.weakCategories.map((category) => (
                                    <span
                                        key={category}
                                        className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-200"
                                    >
                                        {formatCategory(category)}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/60 p-5">
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Gap para voce</p>
                            <p className={`mt-3 text-2xl font-black ${entry.gapToPlayer > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                                {entry.gapToPlayer > 0 ? '+' : ''}{entry.gapToPlayer}
                            </p>
                            <p className="mt-2 text-sm text-slate-400">
                                Valor acumulado que separa este rival do seu placar total.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};
