
import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from 'recharts';
import {
    Award, BookOpen, GraduationCap, Flame, CheckCircle2,
    Calendar, TrendingUp, Target, BrainCircuit
} from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import { Habit, Book, Skill, OrganizeTask, ProjectConfig } from '../types';

const ProgressView: React.FC = () => {
    // --- DATA AGGREGATION ---
    const [habits] = useStorage<Habit[]>('p67_habits', []);
    const [books] = useStorage<Book[]>('p67_books', []);
    const [skills] = useStorage<Skill[]>('p67_skills', []);
    const [tasks] = useStorage<OrganizeTask[]>('p67_tasks', []);
    const [config] = useStorage<ProjectConfig>('p67_project_config', { startDate: new Date().toISOString(), userName: '', isGuest: false });

    // --- CALCULATIONS ---
    const stats = useMemo(() => {
        // 1. Journey Progress
        const start = new Date(config.startDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const currentDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const journeyProgress = Math.min(100, Math.round((currentDay / 67) * 100));

        // 2. Habits Consistency (Last 7 Days)
        let totalHabitChecks = 0;
        let possibleHabitChecks = 0;
        const chartData = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateKey = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' });

            let dailyCount = 0;
            habits.forEach(h => {
                if (!h.archived) {
                    possibleHabitChecks++;
                    if (h.history[dateKey]?.completed) {
                        dailyCount++;
                        totalHabitChecks++;
                    }
                }
            });
            chartData.push({ name: dayName, completed: dailyCount });
        }
        const consistency = possibleHabitChecks > 0 ? Math.round((totalHabitChecks / possibleHabitChecks) * 100) : 0;

        // 3. Books Stats
        const booksRead = books.filter(b => b.status === 'COMPLETED').length;
        const pagesRead = books.reduce((acc, b) => acc + b.current, 0);

        // 4. Skills Stats
        const totalMinutes = skills.reduce((acc, s) => acc + s.currentMinutes, 0);
        const totalHours = (totalMinutes / 60).toFixed(1);

        // 5. Tasks Stats
        const completedTasks = tasks.filter(t => t.isCompleted).length;
        const totalTasks = tasks.length; // Including archived? Let's say yes for historical view
        const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
            currentDay,
            journeyProgress,
            consistency,
            chartData,
            booksRead,
            pagesRead,
            totalHours,
            completedTasks,
            taskRate
        };
    }, [habits, books, skills, tasks, config]);

    return (
        <div className="pb-20 animate-in fade-in duration-700 space-y-8">

            {/* HERO: JOURNEY STATUS */}
            <div className="relative bg-slate-800 rounded-3xl p-8 border border-slate-700 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-widest text-sm mb-2">
                            <Calendar size={16} /> Projeto 67 Dias
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
                            Dia {Math.min(67, stats.currentDay)}
                        </h2>
                        <p className="text-slate-400 max-w-md">
                            "A excelência não é um ato, mas um hábito." Você está construindo a melhor versão de si mesmo.
                        </p>
                    </div>

                    {/* Circular Progress */}
                    <div className="relative w-40 h-40">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle className="text-slate-900 stroke-current" strokeWidth="10" cx="50" cy="50" r="40" fill="transparent"></circle>
                            <circle
                                className="text-cyan-500 stroke-current transition-all duration-1000 ease-out"
                                strokeWidth="10"
                                strokeLinecap="round"
                                cx="50" cy="50" r="40"
                                fill="transparent"
                                strokeDasharray="251.2"
                                strokeDashoffset={251.2 - (251.2 * stats.journeyProgress) / 100}
                            ></circle>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-white">{stats.journeyProgress}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* PILLARS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Habits */}
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg hover:border-orange-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                            <Flame size={24} />
                        </div>
                        <span className="text-2xl font-bold text-white">{stats.consistency}%</span>
                    </div>
                    <h3 className="text-slate-300 font-medium">Consistência</h3>
                    <p className="text-xs text-slate-500">Média de hábitos / 7 dias</p>
                </div>

                {/* Books */}
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg hover:border-yellow-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                            <BookOpen size={24} />
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-white block">{stats.booksRead}</span>
                            <span className="text-xs text-slate-400">{stats.pagesRead} págs</span>
                        </div>
                    </div>
                    <h3 className="text-slate-300 font-medium">Intelecto</h3>
                    <p className="text-xs text-slate-500">Livros finalizados</p>
                </div>

                {/* Skills */}
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg hover:border-emerald-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <GraduationCap size={24} />
                        </div>
                        <span className="text-2xl font-bold text-white">{stats.totalHours}h</span>
                    </div>
                    <h3 className="text-slate-300 font-medium">Habilidade</h3>
                    <p className="text-xs text-slate-500">Horas de estudo focado</p>
                </div>

                {/* Tasks */}
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg hover:border-blue-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <CheckCircle2 size={24} />
                        </div>
                        <span className="text-2xl font-bold text-white">{stats.completedTasks}</span>
                    </div>
                    <h3 className="text-slate-300 font-medium">Execução</h3>
                    <p className="text-xs text-slate-500">Tarefas concluídas</p>
                </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* HABIT TREND */}
                <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <TrendingUp className="text-teal-400" size={20} /> Ritmo Semanal
                        </h3>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

                {/* GAMIFICATION BADGE */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                    <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(79,70,229,0.5)] border-4 border-indigo-400">
                        <Award size={48} className="text-white" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">Nível {Math.floor(stats.currentDay / 7) + 1}</h3>
                    <p className="text-indigo-300 text-sm mb-4 font-medium">Explorador Disciplinado</p>

                    <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
                        <div className="bg-indigo-500 h-full" style={{ width: `${(stats.currentDay % 7) * 14.28}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-500">Próximo nível em {7 - (stats.currentDay % 7)} dias</p>
                </div>
            </div>

            {/* MOTIVATIONAL FOOTER */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
                <BrainCircuit size={32} className="mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400 italic">
                    "Não importa o quão devagar você vá, desde que você não pare."
                </p>
            </div>
        </div>
    );
};

export default ProgressView;
