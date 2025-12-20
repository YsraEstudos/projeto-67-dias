import React from 'react';
import {
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface HabitWeeklyChartProps {
    chartData: { name: string; completed: number }[];
}

export const HabitWeeklyChart: React.FC<HabitWeeklyChartProps> = ({ chartData }) => {
    return (
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="text-teal-400" size={20} /> Ritmo Semanal
                </h3>
            </div>
            <div className="h-[250px] w-full" style={{ minHeight: '250px', minWidth: '100px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorHabit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            cursor={{ stroke: '#334155' }}
                        />
                        <Area type="monotone" dataKey="completed" stroke="#14b8a6" fillOpacity={1} fill="url(#colorHabit)" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default HabitWeeklyChart;
