import React from 'react';
import { Target, Clock, Coffee, Calendar } from 'lucide-react';
import { WorkStatus } from '../types';

interface ConfigurationHeaderProps {
    goal: number;
    setGoal: (v: number) => void;
    workDays: number;
    setWorkDays: (v: number) => void;
    startTime: string;
    setStartTime: (v: string) => void;
    endTime: string;
    setEndTime: (v: string) => void;
    breakTime: string;
    setBreakTime: (v: string) => void;
    status: WorkStatus;
    weekLabel?: string; // Ex: "Semana 52 de 2024"
}

export const ConfigurationHeader: React.FC<ConfigurationHeaderProps> = React.memo(({
    goal, setGoal, workDays, setWorkDays, startTime, setStartTime, endTime, setEndTime, breakTime, setBreakTime, status, weekLabel
}) => (
    <div className="space-y-2">
        {/* Week indicator (if provided) */}
        {weekLabel && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar size={12} />
                <span>{weekLabel}</span>
                <span className="text-slate-600">•</span>
                <span className="text-orange-500/70">Meta semanal dividida pelos dias de trabalho</span>
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700 backdrop-blur-sm">
            <div className="flex flex-col gap-1 sm:col-span-1 lg:col-span-2 min-w-0">
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Meta Semanal</label>
                <div className="flex items-center gap-2 min-h-[32px]">
                    <Target className="text-orange-500 flex-shrink-0" size={18} />
                    <input
                        type="number"
                        value={goal}
                        onChange={(e) => setGoal(Number(e.target.value))}
                        className="bg-transparent text-xl font-bold text-slate-200 focus:outline-none w-full"
                        min={0}
                    />
                </div>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-1 lg:col-span-2 min-w-0">
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Dias na Semana</label>
                <div className="flex items-center gap-2 min-h-[32px]">
                    <Calendar className="text-emerald-500 flex-shrink-0" size={18} />
                    <input
                        type="number"
                        value={workDays}
                        onChange={(e) => setWorkDays(Number(e.target.value))}
                        className="bg-transparent text-xl font-bold text-slate-200 focus:outline-none w-full"
                        min={1}
                        max={7}
                    />
                </div>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-4 min-w-0">
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Jornada</label>
                <div className="flex items-center gap-2 min-h-[32px]">
                    <Clock className="text-blue-500 flex-shrink-0" size={18} />
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <input
                            type="time"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                            className="bg-slate-900/60 border border-slate-700/60 font-mono text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-blue-500 hover:bg-slate-800 rounded-lg px-2 py-1 transition-colors"
                        />
                        <span className="text-slate-500 font-medium">-</span>
                        <input
                            type="time"
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                            className="bg-slate-900/60 border border-slate-700/60 font-mono text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-blue-500 hover:bg-slate-800 rounded-lg px-2 py-1 transition-colors"
                        />
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-1 lg:col-span-2 min-w-0">
                <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider truncate">Início Intervalo</label>
                    <button
                        onClick={() => setBreakTime(breakTime ? '' : '12:00')}
                        className={`text-[10px] px-1.5 py-0.5 rounded transition-all font-semibold uppercase tracking-wider flex-shrink-0 ${
                            !breakTime 
                                ? 'bg-amber-600/20 text-amber-500 border border-amber-600/30' 
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title={breakTime ? "Remover Intervalo" : "Adicionar Intervalo"}
                    >
                        {breakTime ? 'Remover' : 'Sem Intervalo'}
                    </button>
                </div>
                <div className="flex items-center gap-2 min-h-[32px]">
                    <Coffee className={`${breakTime ? 'text-amber-500' : 'text-slate-600'} flex-shrink-0`} size={18} />
                    {breakTime ? (
                        <input 
                            type="time" 
                            value={breakTime} 
                            onChange={e => setBreakTime(e.target.value)} 
                            className="bg-slate-900/60 border border-slate-700/60 font-mono text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500 hover:bg-slate-800 rounded-lg px-2 py-1 transition-colors" 
                        />
                    ) : (
                        <span className="text-xs font-medium text-slate-500 italic">Desativado</span>
                    )}
                </div>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-1 lg:col-span-2 min-w-0">
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Status Atual</label>
                <div className="flex items-center gap-2 min-h-[32px]">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${status === 'FINISHED' ? 'bg-green-500' : status === 'BREAK' ? 'bg-amber-500' : 'bg-cyan-500 animate-pulse'}`}></div>
                    <span className="text-xs sm:text-sm font-medium text-slate-300 leading-tight">
                        {status === 'PRE_BREAK' && (breakTime ? 'Manhã / Pré-Intervalo' : 'Trabalhando (Sem Intervalo)')}
                        {status === 'BREAK' && 'Intervalo'}
                        {status === 'POST_BREAK' && 'Tarde / Pós-Intervalo'}
                        {status === 'FINISHED' && 'Expediente Encerrado'}
                    </span>
                </div>
            </div>
        </div>
    </div>
));

ConfigurationHeader.displayName = 'ConfigurationHeader';

