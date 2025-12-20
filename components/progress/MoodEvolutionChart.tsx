import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useJournalStore } from '../../stores/journalStore';
import { Mood, MOOD_CONFIG } from '../../types';
import { TrendingUp, Smile, Frown } from 'lucide-react';

export const MoodEvolutionChart: React.FC<{ dayCount: number }> = ({ dayCount }) => {
    const { entries } = useJournalStore();

    const data = useMemo(() => {
        // Pre-index entries by date for O(1) lookup
        const entriesMap = new Map<string, typeof entries[0]>();
        entries.forEach(e => {
            if (e.date) {
                // Store using only the date part YYYY-MM-DD
                const dateKey = e.date.split('T')[0];
                entriesMap.set(dateKey, e);
            }
        });

        // Generate last 30 days or dayCount range
        const days = [];
        const today = new Date();
        const range = 30; // Show last 30 days for better readability than 67 crammed

        for (let i = range - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);

            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
            const entry = entriesMap.get(dateStr);

            let value = 0; // 0 = No Data
            let moodLabel = '';

            if (entry && entry.mood && MOOD_CONFIG[entry.mood]) {
                value = MOOD_CONFIG[entry.mood].value;
                moodLabel = MOOD_CONFIG[entry.mood].label;
            }

            days.push({
                date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                fullDate: date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }),
                value,
                mood: entry?.mood,
                label: moodLabel
            });
        }
        return days;
    }, [entries]);

    // Calculate stats
    const stats = useMemo(() => {
        const moodValues = entries
            .filter(e => e.mood && MOOD_CONFIG[e.mood])
            .map(e => MOOD_CONFIG[e.mood!].value);

        if (moodValues.length === 0) return { average: 0, trend: 'stable' };

        const average = moodValues.reduce((a, b) => a + b, 0) / moodValues.length;

        // Simple trend: compare last 3 vs prev 3
        const recent = moodValues.slice(-3);
        const prev = moodValues.slice(-6, -3);
        const recentAvg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
        const prevAvg = prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : 0;

        return {
            average,
            trend: recentAvg > prevAvg ? 'up' : recentAvg < prevAvg ? 'down' : 'stable'
        };
    }, [entries]);

    const getGradientColor = (value: number) => {
        if (value >= 4.5) return "#4ade80"; // green-400
        if (value >= 3.5) return "#facc15"; // yellow-400
        if (value >= 2.5) return "#60a5fa"; // blue-400
        if (value >= 1.5) return "#fb923c"; // orange-400
        return "#f87171"; // red-400
    };

    const avgColor = getGradientColor(stats.average);

    return (
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Smile className="text-pink-400" size={20} /> Bem-estar Emocional
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Últimos 30 dias</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white leading-none">
                            {stats.average.toFixed(1)}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Média</div>
                    </div>
                    {stats.trend === 'up' && <TrendingUp className="text-green-400" size={24} />}
                    {stats.trend === 'down' && <TrendingUp className="text-red-400 rotate-180" size={24} />}
                </div>
            </div>

            <div className="h-[200px] w-full" style={{ minHeight: '200px', minWidth: '100px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={avgColor} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={avgColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            minTickGap={15}
                        />
                        <YAxis
                            domain={[0, 6]}
                            hide
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    const hasData = data.value > 0;
                                    return (
                                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
                                            <p className="text-slate-400 text-xs mb-1">{data.fullDate}</p>
                                            {hasData ? (
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold ${data.value >= 4 ? 'text-green-400' :
                                                        data.value >= 3 ? 'text-yellow-400' : 'text-orange-400'
                                                        }`}>
                                                        {data.label}
                                                    </span>
                                                    <span className="text-xs text-slate-600">({data.value}/5)</span>
                                                </div>
                                            ) : (
                                                <p className="text-slate-500 text-sm italic">Sem registro</p>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={avgColor}
                            fillOpacity={1}
                            fill="url(#colorMood)"
                            strokeWidth={3}
                            activeDot={{ r: 6, fill: avgColor, stroke: '#1e293b', strokeWidth: 2 }}
                            connectNulls
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex justify-between mt-4 text-xs text-slate-500 border-t border-slate-700/50 pt-3">
                <div className="flex items-center gap-1">
                    <Frown size={14} />
                    <span>Difícil</span>
                </div>
                <div className="flex items-center gap-1">
                    <span>Incrível</span>
                    <Smile size={14} />
                </div>
            </div>
        </div>
    );
};
