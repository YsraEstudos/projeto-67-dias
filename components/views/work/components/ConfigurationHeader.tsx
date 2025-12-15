import React from 'react';
import { Target, Clock, Coffee } from 'lucide-react';
import { WorkStatus } from '../types';

interface ConfigurationHeaderProps {
    goal: number;
    setGoal: (v: number) => void;
    startTime: string;
    setStartTime: (v: string) => void;
    endTime: string;
    setEndTime: (v: string) => void;
    breakTime: string;
    setBreakTime: (v: string) => void;
    status: WorkStatus;
}

export const ConfigurationHeader: React.FC<ConfigurationHeaderProps> = React.memo(({
    goal, setGoal, startTime, setStartTime, endTime, setEndTime, breakTime, setBreakTime, status
}) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700 backdrop-blur-sm">
        <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Meta Diária</label>
            <div className="flex items-center gap-2">
                <Target className="text-orange-500" size={18} />
                <input
                    type="number"
                    value={goal}
                    onChange={(e) => setGoal(Number(e.target.value))}
                    className="bg-transparent text-xl font-bold text-slate-200 focus:outline-none w-full"
                />
            </div>
        </div>
        <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Jornada</label>
            <div className="flex items-center gap-2">
                <Clock className="text-blue-500" size={18} />
                <div className="flex items-center gap-1">
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-transparent font-mono text-slate-200 focus:outline-none hover:bg-slate-800 rounded" />
                    <span className="text-slate-500">-</span>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-transparent font-mono text-slate-200 focus:outline-none hover:bg-slate-800 rounded" />
                </div>
            </div>
        </div>
        <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Início Intervalo</label>
            <div className="flex items-center gap-2">
                <Coffee className="text-amber-600" size={18} />
                <input type="time" value={breakTime} onChange={e => setBreakTime(e.target.value)} className="bg-transparent font-mono text-slate-200 focus:outline-none w-full hover:bg-slate-800 rounded" />
            </div>
        </div>
        <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Status Atual</label>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status === 'FINISHED' ? 'bg-green-500' : status === 'BREAK' ? 'bg-amber-500' : 'bg-cyan-500 animate-pulse'}`}></div>
                <span className="text-sm font-medium text-slate-300">
                    {status === 'PRE_BREAK' && 'Manhã / Pré-Intervalo'}
                    {status === 'BREAK' && 'Intervalo'}
                    {status === 'POST_BREAK' && 'Tarde / Pós-Intervalo'}
                    {status === 'FINISHED' && 'Expediente Encerrado'}
                </span>
            </div>
        </div>
    </div>
));

ConfigurationHeader.displayName = 'ConfigurationHeader';
