import React from 'react';
import { Gauge, Sword, X } from 'lucide-react';
import { CompetitionDailyRecord } from '../../types';
import { COMPETITION_THEORETICAL_DAILY_MAX } from '../../utils/competitionEngine';

interface CompetitionRulesModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: CompetitionDailyRecord | null;
}

const RULES = [
    {
        title: 'Questoes',
        points: 350,
        body: 'Conta o maior valor entre o tracker principal e os counters de Questoes. Vai ate 250 e ainda libera bonus em 50, 100 e 150.',
    },
    {
        title: 'Habitos',
        points: 160,
        body: 'Divide os pontos entre habitos positivos scoreaveis. Cada habito tem teto de 40 e negativos ficam fora do v1.',
    },
    {
        title: 'Tarefas',
        points: 110,
        body: 'As primeiras 5 tarefas concluidas do dia valem 22 pontos cada.',
    },
    {
        title: 'Skill Tree',
        points: 220,
        body: 'Soma ofensiva de estudo, nos fechados hoje no roadmap e micro-vitorias concluidas no dia.',
    },
    {
        title: 'Leitura',
        points: 90,
        body: 'Converte a ofensiva de leitura do dia diretamente em pontos.',
    },
    {
        title: 'Extras',
        points: 70,
        body: 'Junta sessoes de metas extras e goals nao-questoes feitos nos blocos do dia.',
    },
];

export const CompetitionRulesModal: React.FC<CompetitionRulesModalProps> = ({
    isOpen,
    onClose,
    record,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} aria-hidden="true" />
            <div className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-amber-500/20 bg-slate-950/95 shadow-2xl shadow-amber-500/10">
                <div className="border-b border-slate-800 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.32em] text-amber-300/80">Como pontua</p>
                            <h3 className="mt-2 text-2xl font-black text-white">Manual da arena</h3>
                            <p className="mt-2 max-w-2xl text-sm text-slate-400">
                                O sistema tem teto teorico fixo de {COMPETITION_THEORETICAL_DAILY_MAX} pontos, mas o maximo realmente disponivel hoje depende do que esta configurado e aberto no seu dia.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-700 bg-slate-900/80 p-2 text-slate-400 transition hover:border-slate-500 hover:text-white"
                            aria-label="Fechar regras"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <section className="space-y-3">
                        {RULES.map((rule) => (
                            <article
                                key={rule.title}
                                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-amber-500/30"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-base font-bold text-white">{rule.title}</h4>
                                        <p className="mt-1 text-sm text-slate-400">{rule.body}</p>
                                    </div>
                                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-right">
                                        <div className="text-lg font-black text-amber-200">{rule.points}</div>
                                        <div className="text-[10px] uppercase tracking-[0.24em] text-amber-300/70">max</div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>

                    <aside className="space-y-4">
                        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/60 p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-300">
                                    <Gauge size={20} />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Hoje</p>
                                    <p className="text-2xl font-black text-white">
                                        {record ? `${record.score}/${record.maxScore}` : `0/${COMPETITION_THEORETICAL_DAILY_MAX}`}
                                    </p>
                                </div>
                            </div>
                            <p className="mt-4 text-sm text-slate-400">
                                O painel principal sempre mostra o que ja entrou, o maximo possivel hoje e quanto ainda resta vivo em cada categoria.
                            </p>
                        </div>

                        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/60 p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-red-300">
                                    <Sword size={20} />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Pressao</p>
                                    <p className="text-lg font-bold text-white">Rivais usam o mesmo teto do seu dia</p>
                                </div>
                            </div>
                            <p className="mt-4 text-sm text-slate-400">
                                Cada rival herda o mesmo maximo disponivel que voce tem naquele dia e distribui os pontos com afinidades, variacao e resposta ao placar.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};
