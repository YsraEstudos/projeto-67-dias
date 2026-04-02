import React, { useMemo } from 'react';
import { Trophy, TrendingUp, Shield, Zap, Target, Flame, ChevronUp, Activity, Info } from 'lucide-react';
import { useCompetitionStore } from '../../stores/competitionStore';
import { calculateLeagueStanding, generateCumulativeHistory, generateSimulatedRivals } from '../../utils/competitionEngine';
import { getTodayISO } from '../../utils/dateUtils';
import { CompetitionDailyRecord } from '../../types';

export const ChampionshipView: React.FC = () => {
  const { competition } = useCompetitionStore();
  const todayKey = getTodayISO();
  const todayRecord: CompetitionDailyRecord | undefined = competition.dailyRecords[todayKey];
  const completionPercent = todayRecord ? Math.round(todayRecord.completionRate * 100) : 0;
  const rawTodayActivity = todayRecord?.activityScore ?? todayRecord?.breakdown.reduce((sum, item) => sum + item.points, 0) ?? 0;

  const totalScore = useMemo(() => {
    return Object.values(competition.dailyRecords).reduce((acc, rec) => acc + rec.score, 0);
  }, [competition.dailyRecords]);

  const { currentLeague, currentRank, nextLeague, pointsToNext } = calculateLeagueStanding(totalScore);

  const history = useMemo(() => generateCumulativeHistory(competition.dailyRecords, 10), [competition.dailyRecords]);
  const rivals = useMemo(() => generateSimulatedRivals(totalScore, currentRank), [totalScore, currentRank]);

  // Find max for chart scaling
  const maxHistoryDaily = Math.max(1, ...history.map(h => h.playerDaily));
  const maxHistoryTotal = Math.max(1, ...history.map(h => Math.max(h.playerTotal, h.simulatedRivalTotal)));

  return (
    <div className="animate-in fade-in duration-700 pb-20 space-y-6">
      
      {/* HEADER HERO ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main MMR / League Card */}
        <div className="lg:col-span-2 group relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {/* Animated Glow Background */}
          <div className="absolute -inset-1 opacity-20 blur-xl bg-gradient-to-r from-purple-600 via-cyan-600 to-emerald-600 group-hover:opacity-40 transition-opacity duration-700" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-stretch gap-8">
            <div className="flex-shrink-0 flex flex-col items-center justify-center p-6 bg-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm shadow-inner min-w-[160px]">
              <Shield size={80} className={`${currentLeague.color} drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] animate-pulse`} style={{ animationDuration: '3s' }} />
              <div className="mt-4 text-center">
                <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Liga Atual</span>
                <h2 className={`text-2xl font-black tracking-tight ${currentLeague.color}`}>{currentLeague.name}</h2>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center w-full">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy size={16} className="text-yellow-500" />
                    <span className="text-sm font-semibold text-slate-300 tracking-wide">PONTUAÇÃO GLOBAL</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white tracking-tighter shadow-sm">{totalScore.toLocaleString('pt-BR')}</span>
                    <span className="text-sm text-emerald-400 font-bold flex items-center gap-0.5">
                      <ChevronUp size={14} /> {(todayRecord?.score || 0).toLocaleString('pt-BR')} hoje
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Rank Atual</div>
                  <div className="text-2xl md:text-3xl font-black text-white">#{currentRank.toLocaleString('pt-BR')}</div>
                </div>
              </div>

              {nextLeague && (
                <div className="mt-6">
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className={currentLeague.color}>{currentLeague.name}</span>
                    <span className="text-slate-500">Próxima: <span className={nextLeague.color}>{nextLeague.name}</span></span>
                  </div>
                  <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner relative">
                    <div 
                      className={`absolute top-0 bottom-0 left-0 ${currentLeague.color.replace('text-', 'bg-')} transition-all duration-1000 ease-out`}
                      style={{ 
                        width: `${Math.min(100, Math.max(0, ((totalScore - currentLeague.minPoints) / (nextLeague.minPoints - currentLeague.minPoints)) * 100))}%` 
                      }}
                    >
                      {/* Inner shine */}
                      <div className="w-full h-full bg-gradient-to-b from-white/20 to-transparent"></div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 text-right tracking-wide">
                    +{pointsToNext.toLocaleString('pt-BR')} XP para a promoção
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Daily Earnings Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Zap size={100} className="text-yellow-400" />
          </div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h4 className="text-md font-bold text-white flex items-center gap-2">
              <Activity size={18} className="text-emerald-400" />
              Ganhos de Hoje
            </h4>
            <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-1 px-3 rounded-full text-xs font-black shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              +{todayRecord?.score || 0} XP oficial
            </div>
          </div>

          {todayRecord && (
            <div className="relative z-10 mb-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400">Pontuacao adaptativa</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {rawTodayActivity.toLocaleString('pt-BR')} XP bruto com {completionPercent}% de aproveitamento do que estava disponivel.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-white">{todayRecord.score.toLocaleString('pt-BR')}</div>
                  <div className="text-[11px] text-slate-500">multiplicador {todayRecord.difficultyMultiplier.toFixed(2)}x</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-2 space-y-2 relative z-10 styled-scrollbar h-48 lg:h-auto">
            {todayRecord && todayRecord.breakdown.length > 0 && todayRecord.breakdown.some(i => i.points > 0) ? (
              todayRecord.breakdown.filter(i => i.points > 0).map((item) => (
                <div key={item.id} className="group bg-slate-950/50 hover:bg-slate-800/80 rounded-2xl p-3 flex justify-between items-center border border-slate-800/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-150 transition-transform shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                    <div>
                      <h5 className="text-sm font-bold text-slate-200">{item.label}</h5>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{item.summary}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-emerald-400 group-hover:text-emerald-300 group-hover:-translate-y-0.5 transition-transform">
                    +{item.points} bruto
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-4">
                <Target size={32} className="mb-3 text-slate-500" />
                <p className="text-xs text-slate-400 font-medium max-w-[200px]">Nenhuma atividade<br/>Hoje é o dia de começar!</p>
              </div>
            )}
          </div>

          <div className="relative z-10 mt-4 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-4 text-xs text-slate-300">
            O campeonato sobe pelo desempenho do dia, nao apenas pelo volume bruto. Dias mais cheios recebem um bonus moderado, e os XP por modulo continuam visiveis para transparencia.
          </div>
        </div>
      </div>

      {/* GRAPH & LEADERBOARD ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Performance Graph (Weekly history) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-8 z-10">
            <div>
              <h4 className="text-md font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-cyan-400" />
                Ascensão no Ranking (Últimos 10 dias)
              </h4>
              <p className="text-xs text-slate-500 mt-1">Comparando sua pontuação total com o crescimento orgânico da liga.</p>
            </div>
          </div>
          
          <div className="flex-1 flex items-end gap-2 md:gap-4 h-[240px] relative pt-10 min-w-full overflow-x-auto overflow-y-hidden styled-scrollbar pb-2">
            {/* Y-axis labels mock */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] font-bold text-slate-600 py-4 pointer-events-none">
              <span>Máx</span>
              <span>Méd</span>
              <span>Min</span>
            </div>
            
            <div className="w-full flex justify-between h-full gap-2 relative min-w-[500px]">
                {history.map((day, idx) => {
                  const heightPercentDaily = maxHistoryDaily > 0 ? (day.playerDaily / maxHistoryDaily) * 100 : 0;
                  const isToday = idx === history.length - 1;
                  
                  return (
                    <div key={day.date} className="relative flex-1 flex flex-col justify-end h-full group z-10" style={{ maxWidth: '80px'}}>
                      {/* Tooltip */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 p-2 rounded-xl text-center shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 w-32">
                         <p className="text-[10px] font-bold text-slate-400 mb-1">{day.fullDateLabel}</p>
                         <p className="text-xs font-black text-emerald-400">+{day.playerDaily} XP Diário</p>
                         <p className="text-[10px] font-semibold text-white mt-1 border-t border-slate-700 pt-1">Total: {day.playerTotal.toLocaleString()}</p>
                      </div>
                      
                      {/* Daily Bar */}
                      <div 
                        className={`w-full rounded-t-sm transition-all duration-1000 ${isToday ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-slate-700 group-hover:bg-slate-500'}`}
                        style={{ height: `${Math.max(2, heightPercentDaily * 0.5)}%` }}
                      />
                      
                      <div className={`mt-3 text-center text-[10px] font-bold ${isToday ? 'text-cyan-400' : 'text-slate-500'}`}>
                        {day.dateLabel}
                      </div>
                    </div>
                  );
                })}

                {/* Total Line overlay (Absolute positioned SVG connecting dots) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible pb-12 pt-4" preserveAspectRatio="none">
                   <defs>
                     <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#2dd4bf" />
                     </linearGradient>
                   </defs>
                   {history.map((day, idx) => {
                     if (idx === 0) return null;
                     const prevDay = history[idx - 1];
                     
                     // Approximate centering within flex boxes. Each box takes up approx 100/N % of width, but flex gap complicates this slightly. We use relative percentages.
                     const getCenteredX = (index: number) => {
                        const count = history.length;
                        const factor = index / (count - 1);
                        return `calc(${factor * 100}% - ${factor * 0}px)`; // Close enough for purely visual lines
                     };

                     const x1 = getCenteredX(idx - 1);
                     const x2 = getCenteredX(idx);
                     
                     const y1 = `${100 - (prevDay.playerTotal / maxHistoryTotal) * 100}%`;
                     const y2 = `${100 - (day.playerTotal / maxHistoryTotal) * 100}%`;
                     
                     const ry1 = `${100 - (prevDay.simulatedRivalTotal / maxHistoryTotal) * 100}%`;
                     const ry2 = `${100 - (day.simulatedRivalTotal / maxHistoryTotal) * 100}%`;

                     return (
                       <g key={`lines-${idx}`}>
                         <line x1={x1} y1={ry1} x2={x2} y2={ry2} stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
                         <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#lineGrad)" strokeWidth="3" className="drop-shadow-md" />
                       </g>
                     );
                   })}
                   
                   {history.map((day, idx) => {
                     const getCenteredX = (index: number) => {
                        const count = history.length;
                        const factor = index / (count - 1);
                        return `calc(${factor * 100}% - ${factor * 0}px)`;
                     };
                     const cx = getCenteredX(idx);
                     const cy = `${100 - (day.playerTotal / maxHistoryTotal) * 100}%`;
                     const isToday = idx === history.length - 1;
                     return (
                       <circle 
                         key={`dot-${idx}`} 
                         cx={cx} 
                         cy={cy} 
                         r={isToday ? "5" : "3"} 
                         fill={isToday ? "#2dd4bf" : "#1e293b"} 
                         stroke={isToday ? "#fff" : "#8b5cf6"} 
                         strokeWidth="2" 
                         className="transition-all duration-500 origin-center"
                       />
                     );
                   })}
                </svg>
            </div>
            
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-4 mt-6 pt-4 border-t border-slate-800 w-full">
             <div className="flex items-center gap-2">
                <div className="w-3 h-1 rounded bg-gradient-to-r from-purple-500 to-teal-400"></div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Seu Total</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 border-t-2 border-dashed border-slate-600"></div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Crescimento Orgânico</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-slate-700"></div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Ganhos Diários</span>
             </div>
          </div>
        </div>

        {/* Global Matchmaking Rivals (10.000 limit) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col">
           <div className="flex items-center justify-between mb-6">
            <h4 className="text-md font-bold text-white flex items-center gap-2">
              <Flame size={18} className="text-rose-500" />
              Radar de Rivais
            </h4>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded font-black border border-slate-700 border-b-2">/ 10.000</span>
          </div>

          <div className="flex-1 flex flex-col gap-3">
             {rivals.map((rival) => {
               const isPlayer = rival.rank === currentRank;
               return (
                 <div 
                   key={rival.id} 
                   className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                     isPlayer 
                       ? 'bg-slate-800 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] scale-[1.02] z-10' 
                       : 'bg-slate-950/50 border-slate-800/80 grayscale opacity-80'
                   }`}
                 >
                   <div className="flex items-center gap-3">
                     <span className={`text-base font-black w-8 text-center ${isPlayer ? 'text-emerald-400' : 'text-slate-500'}`}>
                       #{rival.rank}
                     </span>
                     <div>
                       <h5 className={`text-sm font-bold ${isPlayer ? 'text-white' : 'text-slate-300'}`}>
                         {isPlayer ? 'Você' : rival.name}
                       </h5>
                       {isPlayer && <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider block mt-0.5">Subindo 🔥</span>}
                     </div>
                   </div>
                   <div className={`text-sm font-black ${isPlayer ? 'text-white' : 'text-slate-400'}`}>
                     {rival.score.toLocaleString('pt-BR')} 
                     <span className="text-[10px] text-slate-500 ml-1">XP</span>
                   </div>
                 </div>
               );
             })}
          </div>
          
          <div className="mt-6 text-[10px] font-semibold text-slate-500 text-center flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
             <Info size={14} className="text-blue-400 shrink-0" />
             <p className="leading-snug">Baseado em simulações demográficas. Seja consistente para se destacar e pular de Liga.</p>
          </div>
        </div>
        
      </div>
    </div>
  );
};
