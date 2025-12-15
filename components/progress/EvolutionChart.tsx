import React, { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import { WeeklySnapshot } from '../../types';

interface EvolutionChartProps {
    snapshots: WeeklySnapshot[];
}

export const EvolutionChart: React.FC<EvolutionChartProps> = React.memo(({ snapshots }) => {
    // Preparar dados para o gráfico (memoized)
    const { chartData, growth } = useMemo(() => {
        const data = snapshots.map(snapshot => ({
            name: `S${snapshot.weekNumber}`,
            score: snapshot.evolution?.overallScore || 0,
            habits: snapshot.metrics.habitConsistency,
            skills: Math.min(100, (snapshot.metrics.skillMinutes / 420) * 100),
            reading: Math.min(100, snapshot.metrics.booksProgress / 100 * 100),
        }));

        // Preencher semanas vazias
        for (let i = 1; i <= 10; i++) {
            if (!data.find(d => d.name === `S${i}`)) {
                data.push({
                    name: `S${i}`,
                    score: 0,
                    habits: 0,
                    skills: 0,
                    reading: 0
                });
            }
        }

        // Ordenar por semana
        data.sort((a, b) => {
            const weekA = parseInt(a.name.replace('S', ''));
            const weekB = parseInt(b.name.replace('S', ''));
            return weekA - weekB;
        });

        // Calcular crescimento
        const firstScore = data.find(d => d.score > 0)?.score || 0;
        const lastScore = data.filter(d => d.score > 0).pop()?.score || 0;
        const growthValue = lastScore - firstScore;

        return { chartData: data, growth: growthValue };
    }, [snapshots]);

    if (snapshots.length === 0) {
        return (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                    <Activity size={20} className="text-teal-400" />
                    <h3 className="text-lg font-bold text-white">Evolução da Jornada</h3>
                </div>
                <div className="h-[250px] flex items-center justify-center text-slate-500">
                    <p>Dados de evolução aparecerão aqui após a primeira semana</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-teal-400" />
                    <h3 className="text-lg font-bold text-white">Evolução da Jornada</h3>
                </div>

                {/* Growth Badge */}
                {growth !== 0 && (
                    <div className={`
            px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1
            ${growth > 0
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }
          `}>
                        {growth > 0 ? '+' : ''}{Math.round(growth)} pts
                    </div>
                )}
            </div>

            <div className="h-[280px] w-full" style={{ minHeight: '280px', minWidth: '100px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorHabits" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorSkills" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                            ticks={[0, 25, 50, 75, 100]}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                borderColor: '#334155',
                                borderRadius: '12px',
                                color: '#f8fafc'
                            }}
                            cursor={{ stroke: '#334155' }}
                            formatter={(value: number, name: string) => {
                                const labels: Record<string, string> = {
                                    score: 'Score Geral',
                                    habits: 'Hábitos',
                                    skills: 'Skills',
                                    reading: 'Leitura'
                                };
                                return [`${Math.round(value)}%`, labels[name] || name];
                            }}
                        />

                        {/* Score Principal */}
                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#14b8a6"
                            fillOpacity={1}
                            fill="url(#colorScore)"
                            strokeWidth={3}
                            dot={{ fill: '#14b8a6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                        />

                        {/* Hábitos */}
                        <Area
                            type="monotone"
                            dataKey="habits"
                            stroke="#f97316"
                            fillOpacity={1}
                            fill="url(#colorHabits)"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                        />

                        {/* Skills */}
                        <Area
                            type="monotone"
                            dataKey="skills"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#colorSkills)"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-teal-500 rounded" />
                    <span className="text-xs text-slate-400">Score Geral</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-orange-500 rounded" style={{ background: 'repeating-linear-gradient(90deg, #f97316 0px, #f97316 4px, transparent 4px, transparent 8px)' }} />
                    <span className="text-xs text-slate-400">Hábitos</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-emerald-500 rounded" style={{ background: 'repeating-linear-gradient(90deg, #10b981 0px, #10b981 4px, transparent 4px, transparent 8px)' }} />
                    <span className="text-xs text-slate-400">Skills</span>
                </div>
            </div>
        </div>
    );
});

export default EvolutionChart;
