import React from 'react';
import { Play, Pause, RotateCcw, ArrowDown, ArrowUp, Save } from 'lucide-react';
import { formatDuration } from '../utils';

interface WorkGoals {
    weekly: number;
    ultra: number;
    anki: number;
    ncm: number;
}

interface SessionTabProps {
    timerSeconds: number;
    isRunning: boolean;
    setIsRunning: (v: boolean) => void;
    setTimerSeconds: (v: number) => void;
    ankiCount: number;
    setAnkiCount: (v: number) => void;
    ncmCount: number;
    setNcmCount: (v: number) => void;
    goals: WorkGoals;
    isInputLocked: boolean;
    onSave: () => void;
    children?: React.ReactNode; // For StudyScheduler
}

export const SessionTab: React.FC<SessionTabProps> = React.memo(({
    timerSeconds, isRunning, setIsRunning, setTimerSeconds,
    ankiCount, setAnkiCount, ncmCount, setNcmCount,
    goals, isInputLocked, onSave, children
}) => {
    return (
        <div className="space-y-8">
            {/* Timer */}
            <div className="flex flex-col items-center justify-center py-6 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-6xl font-mono font-bold text-slate-200 mb-4 tracking-wider">
                    {formatDuration(timerSeconds)}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        className={`px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all ${isRunning ? 'bg-slate-800 text-red-400 hover:bg-slate-700' : 'bg-yellow-600 text-white hover:bg-yellow-500'}`}
                    >
                        {isRunning ? <><Pause size={18} /> Pausar</> : <><Play size={18} /> Iniciar</>}
                    </button>
                    <button
                        onClick={() => { setIsRunning(false); setTimerSeconds(0); }}
                        className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Anki */}
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-col items-center">
                    <h4 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-3">Anki (Meta: {goals.anki})</h4>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setAnkiCount(Math.max(0, ankiCount - 1))}
                            disabled={isInputLocked}
                            className={`p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors ${isInputLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <ArrowDown size={20} />
                        </button>
                        <span className={`text-4xl font-bold ${ankiCount >= goals.anki ? 'text-green-400' : 'text-white'}`}>{ankiCount}</span>
                        <button
                            onClick={() => setAnkiCount(ankiCount + 1)}
                            disabled={isInputLocked}
                            className={`p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors ${isInputLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <ArrowUp size={20} />
                        </button>
                    </div>
                    {isInputLocked && (
                        <p className="text-xs text-amber-400 mt-2 text-center">Ultra meta atingida!</p>
                    )}
                </div>

                {/* NCM */}
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-col items-center">
                    <h4 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-3">NCM (Meta: {goals.ncm})</h4>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setNcmCount(Math.max(0, ncmCount - 1))}
                            disabled={isInputLocked}
                            className={`p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors ${isInputLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <ArrowDown size={20} />
                        </button>
                        <span className={`text-4xl font-bold ${ncmCount >= goals.ncm ? 'text-green-400' : 'text-white'}`}>{ncmCount}</span>
                        <button
                            onClick={() => setNcmCount(ncmCount + 1)}
                            disabled={isInputLocked}
                            className={`p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors ${isInputLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <ArrowUp size={20} />
                        </button>
                    </div>
                    {isInputLocked && (
                        <p className="text-xs text-amber-400 mt-2 text-center">Ultra meta atingida!</p>
                    )}
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={onSave}
                disabled={isInputLocked}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${isInputLocked
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20 hover:scale-[1.02]'
                    }`}
            >
                <Save size={20} />
                {isInputLocked ? 'Ultra Meta Completa 🏆' : 'Salvar Sessão Extra'}
            </button>

            {/* Scheduler inserted here */}
            {children}
        </div>
    );
});

SessionTab.displayName = 'SessionTab';
