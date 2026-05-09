import React from 'react';
import { X, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { Skill } from '../../types';

interface SkillChartModalProps {
    isOpen: boolean;
    onClose: () => void;
    skills: Skill[];
}

export const SkillChartModal: React.FC<SkillChartModalProps> = ({ isOpen, onClose, skills }) => {
    if (!isOpen) return null;

    const data = skills.map(skill => ({
        name: skill.name,
        hours: Number((skill.currentMinutes / 60).toFixed(1)),
        colorTheme: skill.colorTheme || '#10b981'
    })).sort((a, b) => b.hours - a.hours);

    // Mapeamento de classes do tailwind para HEX para o Recharts
    const getHexColor = (themeStr: string) => {
        if (!themeStr) return '#10b981';
        if (themeStr.startsWith('#')) return themeStr;
        
        // Mapeamento simples de cores comuns
        if (themeStr.includes('emerald')) return '#10b981';
        if (themeStr.includes('blue')) return '#3b82f6';
        if (themeStr.includes('indigo')) return '#6366f1';
        if (themeStr.includes('purple')) return '#a855f7';
        if (themeStr.includes('rose')) return '#f43f5e';
        if (themeStr.includes('orange')) return '#f97316';
        if (themeStr.includes('amber')) return '#f59e0b';
        if (themeStr.includes('cyan')) return '#06b6d4';
        
        return '#10b981'; // default
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                            <BarChart2 size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Distribuição de Habilidades</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 h-[400px]">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
                                <Tooltip
                                    cursor={{ fill: '#334155', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                                    formatter={(value: number) => [`${value}h`, 'Horas de Foco']}
                                />
                                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getHexColor(entry.colorTheme)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500">
                            Nenhuma habilidade registrada ainda.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
