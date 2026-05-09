import React, { useMemo } from 'react';
import { X, Clock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { usePomodoroStore } from '../../stores/pomodoroStore';

interface PomodoroChartModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PomodoroChartModal: React.FC<PomodoroChartModalProps> = ({ isOpen, onClose }) => {
    const tasks = usePomodoroStore(s => s.tasks);
    const projects = usePomodoroStore(s => s.projects);

    const data = useMemo(() => {
        const projectTotals: Record<string, { name: string, pomodoros: number, color: string }> = {};
        
        projectTotals['none'] = { name: 'Sem Categoria', pomodoros: 0, color: '#64748b' };
        
        projects.forEach(p => {
            projectTotals[p.id] = { name: p.name, pomodoros: 0, color: p.color || '#3b82f6' };
        });

        tasks.forEach(t => {
            if (t.completedPomodoros > 0) {
                const pId = t.projectId || 'none';
                if (projectTotals[pId]) {
                    projectTotals[pId].pomodoros += t.completedPomodoros;
                }
            }
        });

        return Object.values(projectTotals).filter(p => p.pomodoros > 0).sort((a, b) => b.pomodoros - a.pomodoros);
    }, [tasks, projects]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                            <Clock size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Execução por Tipo de Tarefa</h2>
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
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}p`} />
                                <Tooltip
                                    cursor={{ fill: '#334155', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                                    formatter={(value: number) => [`${value} Pomodoros`, 'Execução']}
                                />
                                <Bar dataKey="pomodoros" radius={[6, 6, 0, 0]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500">
                            Nenhum Pomodoro registrado ainda.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
