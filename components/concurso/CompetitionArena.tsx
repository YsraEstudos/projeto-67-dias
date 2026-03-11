import React, { useMemo, useState } from 'react';
import {
    Crown,
    Flame,
    Gauge,
    ListOrdered,
    ShieldAlert,
    Sparkles,
    Swords,
    Target,
    TrendingUp,
} from 'lucide-react';
import { useCompetitionStore } from '../../stores';
import {
    buildCompetitionLeaderboard,
    CompetitionLeaderboardEntry,
    getCompetitionDayCount,
    getCompetitionStartedLabel,
    getTopOpportunity,
} from '../../utils/competitionEngine';
import { getTodayISO } from '../../utils/dateUtils';
import { CompetitionRulesModal } from './CompetitionRulesModal';
import { RivalDetailModal } from './RivalDetailModal';

const progressClass = (ratio: number) => {
    if (ratio >= 0.75) return 'from-emerald-400 via-cyan-400 to-cyan-300';
    if (ratio >= 0.45) return 'from-amber-400 via-orange-400 to-red-300';
    return 'from-slate-500 via-slate-400 to-slate-300';
};

export const CompetitionArena: React.FC = () => {
    const competition = useCompetitionStore((state) => state.competition);
    const todayKey = getTodayISO();
    const todayRecord = competition.dailyRecords[todayKey] || null;

    const leaderboard = useMemo(() => (
        buildCompetitionLeaderboard(competition.roster, competition.dailyRecords)
    ), [competition.dailyRecords, competition.roster]);

    const playerEntry = leaderboard.find((entry) => entry.id === 'player') || null;
    const leaderEntry = leaderboard[0] || null;
    const rivalsOnly = leaderboard.filter((entry) => entry.id !== 'player');
    const topOpportunity = getTopOpportunity(todayRecord);
    const remainingCategories = todayRecord
        ? todayRecord.breakdown.filter((entry) => entry.remainingPoints > 0)
        : [];

    const [isRulesOpen, setIsRulesOpen] = useState(false);
    const [selectedRival, setSelectedRival] = useState<CompetitionLeaderboardEntry | null>(null);

    const selectedRivalConfig = competition.roster.find((rival) => rival.id === selectedRival?.id) || null;

    const gapToLeader = playerEntry ? Math.abs(playerEntry.gapToLeader) : 0;
    const playerRatio = todayRecord && todayRecord.maxScore > 0
        ? todayRecord.score / todayRecord.maxScore
        : 0;

    return (
        <>
            <div className="space-y-6">
                <section className="relative overflow-hidden rounded-[2rem] border border-amber-500/20 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_26%),linear-gradient(145deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-6 shadow-[0_30px_90px_rgba(15,23,42,0.65)] sm:p-8">
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_0,transparent_96%,rgba(148,163,184,0.1)_96%,rgba(148,163,184,0.1)_100%),linear-gradient(90deg,transparent_0,transparent_96%,rgba(148,163,184,0.08)_96%,rgba(148,163,184,0.08)_100%)] bg-[size:22px_22px] opacity-20" />

                    <div className="relative z-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-amber-200">
                                <Flame size={14} />
                                Arena 67 Days
                            </div>

                            <h3 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl">
                                O campeonato interno agora esta valendo dentro do seu proprio projeto.
                            </h3>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                                Cada ponto nasce do que voce conclui de verdade. Os rivais usam o mesmo teto do seu dia, entao a briga fica mais justa, mais cruel e bem mais divertida.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRulesOpen(true)}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:border-amber-300 hover:bg-amber-400/20"
                                >
                                    <Gauge size={16} />
                                    Como pontua
                                </button>
                                <div className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100">
                                    <Sparkles size={16} />
                                    Tracking exato desde o inicio da competicao
                                </div>
                            </div>

                            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-4">
                                    <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Dia do projeto</p>
                                    <p className="mt-2 text-3xl font-black text-white">{todayRecord?.projectDay || 0}</p>
                                </div>
                                <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-4">
                                    <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Dia da competicao</p>
                                    <p className="mt-2 text-3xl font-black text-white">
                                        {getCompetitionDayCount(competition.competitionStartedAt, todayKey)}
                                    </p>
                                </div>
                                <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-4">
                                    <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Sua posicao</p>
                                    <p className="mt-2 text-3xl font-black text-white">#{playerEntry?.rank || '-'}</p>
                                </div>
                                <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-4">
                                    <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Inicio</p>
                                    <p className="mt-2 text-xl font-black text-white">{getCompetitionStartedLabel(competition.competitionStartedAt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Placar do dia</p>
                                    <p className="mt-2 text-5xl font-black text-white">
                                        {todayRecord ? todayRecord.score : 0}
                                    </p>
                                    <p className="mt-2 text-sm text-slate-400">
                                        {todayRecord
                                            ? `${todayRecord.maxScore} possiveis hoje · ${todayRecord.theoreticalMaxScore} teto teorico`
                                            : 'Aguardando o primeiro snapshot do dia'}
                                    </p>
                                </div>
                                <div className="rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 p-4 text-center">
                                    <p className="text-[10px] uppercase tracking-[0.28em] text-amber-200/70">Gap lider</p>
                                    <p className={`mt-2 text-3xl font-black ${playerEntry?.rank === 1 ? 'text-emerald-300' : 'text-amber-100'}`}>
                                        {playerEntry?.rank === 1 ? 'Na frente' : `${gapToLeader} pts`}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-500">
                                    <span>Pressao do dia</span>
                                    <span>{Math.round(playerRatio * 100)}%</span>
                                </div>
                                <div className="h-4 overflow-hidden rounded-full border border-slate-800 bg-slate-900">
                                    <div
                                        className={`h-full rounded-full bg-gradient-to-r ${progressClass(playerRatio)} transition-all duration-700`}
                                        style={{ width: `${Math.min(100, Math.round(playerRatio * 100))}%` }}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-[1.35rem] border border-slate-800 bg-slate-900/70 p-4">
                                    <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Hoje ainda vivos</p>
                                    <p className="mt-2 text-2xl font-black text-white">{todayRecord?.remainingScore || 0}</p>
                                </div>
                                <div className="rounded-[1.35rem] border border-slate-800 bg-slate-900/70 p-4">
                                    <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Lider atual</p>
                                    <p className="mt-2 text-lg font-black text-white">{leaderEntry?.name || 'Sem rival'}</p>
                                </div>
                                <div className="rounded-[1.35rem] border border-slate-800 bg-slate-900/70 p-4">
                                    <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Rivais ativos</p>
                                    <p className="mt-2 text-2xl font-black text-white">{rivalsOnly.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <section className="space-y-6">
                        <div className="rounded-[1.8rem] border border-slate-800 bg-slate-900/60 p-5">
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
                                        <ListOrdered size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Leaderboard acumulado</p>
                                        <h4 className="text-xl font-black text-white">Quem leva a coroa no fim</h4>
                                    </div>
                                </div>
                                <div className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                                    Total ate agora
                                </div>
                            </div>

                            <div className="space-y-3">
                                {leaderboard.map((entry) => {
                                    const isPlayer = entry.id === 'player';
                                    return (
                                        <button
                                            key={entry.id}
                                            type="button"
                                            onClick={() => !isPlayer && setSelectedRival(entry)}
                                            className={`w-full rounded-[1.45rem] border p-4 text-left transition ${isPlayer
                                                ? 'border-amber-400/30 bg-amber-400/10 shadow-[0_0_0_1px_rgba(251,191,36,0.12)]'
                                                : 'border-slate-800 bg-slate-950/70 hover:border-cyan-400/30 hover:bg-slate-950'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-lg font-black ${isPlayer
                                                        ? 'border-amber-400/30 bg-amber-400/15 text-amber-100'
                                                        : 'border-slate-700 bg-slate-900 text-slate-200'
                                                        }`}>
                                                        #{entry.rank}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-lg font-black text-white">{entry.name}</p>
                                                            {entry.rank === 1 && (
                                                                <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-yellow-200">
                                                                    <Crown size={12} className="mr-1 inline" />
                                                                    Lider
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-400">{entry.archetype}</p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-white">{entry.totalScore}</p>
                                                    <p className={`text-xs ${entry.id === 'player' ? 'text-amber-200/80' : 'text-slate-500'}`}>
                                                        hoje {entry.todayScore}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-[1.8rem] border border-slate-800 bg-slate-900/60 p-5">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300">
                                    <Target size={20} />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Pontos do dia</p>
                                    <h4 className="text-xl font-black text-white">Quanto ainda da para arrancar</h4>
                                </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                {(todayRecord?.breakdown || []).map((entry) => {
                                    const ratio = entry.maxPoints > 0 ? entry.points / entry.maxPoints : 0;
                                    return (
                                        <article key={entry.id} className="rounded-[1.45rem] border border-slate-800 bg-slate-950/70 p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-bold text-white">{entry.label}</p>
                                                    <p className="mt-1 text-xs leading-6 text-slate-400">{entry.summary}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-white">{entry.points}</p>
                                                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">de {entry.maxPoints}</p>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                                    <span>Ritmo atual</span>
                                                    <span>{Math.round(ratio * 100)}%</span>
                                                </div>
                                                <div className="h-3 overflow-hidden rounded-full border border-slate-800 bg-slate-900">
                                                    <div
                                                        className={`h-full rounded-full bg-gradient-to-r ${progressClass(ratio)} transition-all duration-700`}
                                                        style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <div className="rounded-[1.8rem] border border-slate-800 bg-slate-900/60 p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-300">
                                    <ShieldAlert size={20} />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Pressao imediata</p>
                                    <h4 className="text-xl font-black text-white">O golpe mais valioso agora</h4>
                                </div>
                            </div>

                            <div className="mt-5 rounded-[1.5rem] border border-red-500/20 bg-red-500/10 p-4">
                                <p className="text-sm font-bold text-white">{topOpportunity?.label || 'Sem teto vivo no momento'}</p>
                                <p className="mt-2 text-3xl font-black text-red-100">
                                    {topOpportunity ? `${topOpportunity.remainingPoints} pts ainda vivos` : '0'}
                                </p>
                                <p className="mt-3 text-sm leading-6 text-red-100/80">
                                    {topOpportunity?.summary || 'Quando o dia estiver todo drenado, este painel mostra que voce ja arrancou tudo o que podia dele.'}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-[1.8rem] border border-slate-800 bg-slate-900/60 p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-300">
                                    <Swords size={20} />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Rivais mais perto</p>
                                    <h4 className="text-xl font-black text-white">Quem esta te rondando</h4>
                                </div>
                            </div>

                            <div className="mt-5 space-y-3">
                                {rivalsOnly.slice(0, 4).map((entry) => (
                                    <button
                                        key={entry.id}
                                        type="button"
                                        onClick={() => setSelectedRival(entry)}
                                        className="w-full rounded-[1.35rem] border border-slate-800 bg-slate-950/70 p-4 text-left transition hover:border-cyan-400/30"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-white">{entry.name}</p>
                                                <p className="mt-1 text-xs text-slate-400">{entry.taunt}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-white">{entry.totalScore}</p>
                                                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                                                    {entry.gapToPlayer > 0 ? `+${entry.gapToPlayer}` : entry.gapToPlayer} vs voce
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[1.8rem] border border-slate-800 bg-slate-900/60 p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-300">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Categorias ainda abertas</p>
                                    <h4 className="text-xl font-black text-white">Onde ainda existe sangue</h4>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2">
                                {remainingCategories.length > 0 ? remainingCategories.map((entry) => (
                                    <span
                                        key={entry.id}
                                        className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200"
                                    >
                                        {entry.label}: {entry.remainingPoints}
                                    </span>
                                )) : (
                                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                                        Dia drenado
                                    </span>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <CompetitionRulesModal
                isOpen={isRulesOpen}
                onClose={() => setIsRulesOpen(false)}
                record={todayRecord}
            />

            <RivalDetailModal
                isOpen={Boolean(selectedRival)}
                onClose={() => setSelectedRival(null)}
                rival={selectedRivalConfig}
                entry={selectedRival}
            />
        </>
    );
};
