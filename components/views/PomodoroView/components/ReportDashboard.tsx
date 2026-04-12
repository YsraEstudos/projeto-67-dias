import React, { useState } from 'react';
import { X, Clock, CheckCircle2, Flame } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { cn } from '../lib/utils';

export function ReportDashboard() {
  const { setReportOpen, tasks, records, projects, settings } = useStore();
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  // Week start (depends on settings.weekStartsOn)
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 && settings.weekStartsOn === 1 ? -6 : settings.weekStartsOn);
  const weekStart = new Date(now.getFullYear(), now.getMonth(), diff).getTime();

  // 1. Focus Time Stats (in minutes)
  let totalFocusMinutes = 0;
  let weekFocusMinutes = 0;
  let todayFocusMinutes = 0;

  records.forEach(record => {
    totalFocusMinutes += record.duration;
    const recordTime = new Date(record.endTime).getTime();
    if (recordTime >= todayStart) {
      todayFocusMinutes += record.duration;
    }
    if (recordTime >= weekStart) {
      weekFocusMinutes += record.duration;
    }
  });

  // 2. Tasks Stats
  let totalTasksCompleted = 0;
  let weekTasksCompleted = 0;
  let todayTasksCompleted = 0;

  tasks.forEach(task => {
    if (task.completed) {
      totalTasksCompleted++;
      if (task.completedAt) {
        const completedTime = new Date(task.completedAt).getTime();
        if (completedTime >= todayStart) {
          todayTasksCompleted++;
        }
        if (completedTime >= weekStart) {
          weekTasksCompleted++;
        }
      }
    }
  });

  // 3. Chart Data
  const chartData = [];
  const daysToShow = timeRange === 'daily' ? 7 : timeRange === 'weekly' ? 14 : 30;
  
  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    
    const dayMinutes = records
      .filter(r => {
        const t = new Date(r.endTime).getTime();
        return t >= dayStart && t < dayEnd;
      })
      .reduce((acc, r) => acc + r.duration, 0);

    chartData.push({
      name: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      shortName: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      minutes: dayMinutes,
      isToday: i === 0
    });
  }

  // 4. Project Breakdown (All Time)
  const projectStats = projects.map(p => {
    const projectTasks = tasks.filter(t => t.projectId === p.id).map(t => t.id);
    const projectMinutes = records
      .filter(r => r.taskId && projectTasks.includes(r.taskId))
      .reduce((acc, r) => acc + r.duration, 0);
    return { ...p, minutes: projectMinutes };
  }).filter(p => p.minutes > 0).sort((a, b) => b.minutes - a.minutes);

  // Helper to format hours/minutes
  const formatHM = (minutes: number, colorClass: string = "text-[var(--color-primary)]") => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return <><span className={colorClass}>{m}</span><span className="text-xs text-[var(--color-text-muted)] ml-1">m</span></>;
    return <><span className={colorClass}>{h}</span><span className="text-xs text-[var(--color-text-muted)] ml-1 mr-1">h</span><span className={colorClass}>{m}</span><span className="text-xs text-[var(--color-text-muted)] ml-1">m</span></>;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-3 rounded-lg shadow-xl">
          <p className="text-[var(--color-text-muted)] text-xs mb-1">{label}</p>
          <p className="font-medium text-[var(--color-primary)]">
            {payload[0].value} minutos
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) setReportOpen(false);
      }}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-[var(--color-bg)] w-full max-w-6xl h-full max-h-[800px] rounded-2xl shadow-2xl border border-[var(--color-border)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-[var(--color-border)] shrink-0">
          <h2 className="text-lg font-medium flex items-center">
            <BarChart className="w-5 h-5 mr-2 text-[var(--color-primary)]" />
            Estatísticas e Relatórios
          </h2>
          <button 
            onClick={() => setReportOpen(false)}
            className="p-2 hover:bg-[var(--color-surface)] rounded-md transition-colors text-[var(--color-text-muted)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-6 gap-4 mb-6">
            <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-colors">
              <div className="flex items-center text-[11px] font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-[var(--color-primary)] mr-1.5" />
                Foco Total
              </div>
              <div className="text-2xl font-light">
                {formatHM(totalFocusMinutes)}
              </div>
            </div>
            <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-colors">
              <div className="flex items-center text-[11px] font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-[var(--color-primary)] mr-1.5" />
                Foco na Semana
              </div>
              <div className="text-2xl font-light">
                {formatHM(weekFocusMinutes)}
              </div>
            </div>
            <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-colors">
              <div className="flex items-center text-[11px] font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-[var(--color-primary)] mr-1.5" />
                Foco Hoje
              </div>
              <div className="text-2xl font-light">
                {formatHM(todayFocusMinutes)}
              </div>
            </div>
            <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] hover:border-[#00a8ff]/50 transition-colors">
              <div className="flex items-center text-[11px] font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00a8ff] mr-1.5" />
                Tarefas Totais
              </div>
              <div className="text-2xl font-light text-[#00a8ff]">
                {totalTasksCompleted}
              </div>
            </div>
            <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] hover:border-[#00a8ff]/50 transition-colors">
              <div className="flex items-center text-[11px] font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00a8ff] mr-1.5" />
                Tarefas na Semana
              </div>
              <div className="text-2xl font-light text-[#00a8ff]">
                {weekTasksCompleted}
              </div>
            </div>
            <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] hover:border-[#00a8ff]/50 transition-colors">
              <div className="flex items-center text-[11px] font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00a8ff] mr-1.5" />
                Tarefas Hoje
              </div>
              <div className="text-2xl font-light text-[#00a8ff]">
                {todayTasksCompleted}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Chart Area */}
            <div className="col-span-2 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium">Histórico de Foco (Minutos)</h3>
                <div className="flex bg-[var(--color-bg)] rounded-lg p-1">
                  {(['daily', 'weekly', 'monthly'] as const).map((tab) => (
                    <button 
                      key={tab} 
                      onClick={() => setTimeRange(tab)}
                      className={cn(
                        "text-xs py-1.5 px-4 rounded-md transition-colors capitalize",
                        timeRange === tab ? "bg-[var(--color-surface-hover)] text-[var(--color-text)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      )}
                    >
                      {tab === 'daily' ? '7 Dias' : tab === 'weekly' ? '14 Dias' : '30 Dias'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis 
                      dataKey={timeRange === 'daily' ? 'shortName' : 'name'} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} 
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-hover)', opacity: 0.4 }} />
                    <Bar dataKey="minutes" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isToday ? 'var(--color-primary)' : 'var(--color-primary)'} fillOpacity={entry.isToday ? 1 : 0.6} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Project Breakdown */}
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 flex flex-col">
              <h3 className="text-sm font-medium mb-6">Distribuição por Projeto</h3>
              
              {projectStats.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-muted)] opacity-50">
                  <div className="w-12 h-12 border-2 border-dashed border-current rounded-full mb-3 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-sm text-center">Nenhum tempo registrado<br/>em projetos ainda.</span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  {projectStats.map(project => {
                    const percentage = Math.round((project.minutes / totalFocusMinutes) * 100);
                    return (
                      <div key={project.id} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center">
                            <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: project.color }} />
                            <span className="text-sm font-medium group-hover:text-white transition-colors">{project.name}</span>
                          </div>
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {formatHM(project.minutes, "text-[var(--color-text)]")} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--color-bg)] rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full rounded-full" 
                            style={{ backgroundColor: project.color }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
