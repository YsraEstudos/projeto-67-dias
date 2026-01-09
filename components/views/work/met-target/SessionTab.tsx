import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Save, Plus } from 'lucide-react';
import { formatDuration } from '../utils';
import { IdleTask } from '../../../../types';
import { IdleTaskItem } from './IdleTaskItem';
import { IdleTaskSelector } from './IdleTaskSelector';
import { DailyScheduleGrid } from './DailyScheduleGrid';

// Timer presets in minutes
const TIMER_PRESETS = [5, 10, 15, 25, 30];

interface SessionTabProps {
    timeRemaining: number;
    isRunning: boolean;
    setIsRunning: (v: boolean) => void;
    timerFinished: boolean;
    initialTimerMinutes: number;
    onSetPreset: (minutes: number) => void;
    onResetTimer: () => void;
    isInputLocked: boolean;
    onSave: () => void;
    onNavigateToSunday: () => void;
    children?: React.ReactNode;
    // Idle Tasks props
    selectedIdleTasks: IdleTask[];
    onAddIdleTask: (task: Omit<IdleTask, 'id' | 'addedAt'>) => void;
    onRemoveIdleTask: (id: string) => void;
    onCompleteIdleTask: (task: IdleTask) => void;
    onUpdateIdleTaskPoints: (id: string, points: number) => void;
}

export const SessionTab: React.FC<SessionTabProps> = React.memo(({
    timeRemaining, isRunning, setIsRunning, timerFinished,
    initialTimerMinutes, onSetPreset, onResetTimer,
    isInputLocked, onSave, onNavigateToSunday, children,
    // Idle Tasks
    selectedIdleTasks, onAddIdleTask, onRemoveIdleTask, onCompleteIdleTask, onUpdateIdleTaskPoints
}) => {
    const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);
    return (
        <div className="space-y-8">
            {/* Countdown Timer */}
            <div className={`flex flex-col items-center justify-center py-6 rounded-2xl border transition-all ${timerFinished
                ? 'bg-red-950/50 border-red-500/50 animate-pulse'
                : 'bg-slate-950 border-slate-800'
                }`}>
                {/* Timer Presets */}
                <div className="flex gap-2 mb-4">
                    {TIMER_PRESETS.map(minutes => (
                        <button
                            key={minutes}
                            onClick={() => onSetPreset(minutes)}
                            disabled={isRunning}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${initialTimerMinutes === minutes && !timerFinished
                                ? 'bg-yellow-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {minutes}m
                        </button>
                    ))}
                </div>

                {/* Timer Display */}
                <div className={`text-6xl font-mono font-bold mb-4 tracking-wider ${timerFinished ? 'text-red-400' : 'text-slate-200'
                    }`}>
                    {formatDuration(timeRemaining)}
                </div>

                {/* Timer Controls */}
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        disabled={timerFinished}
                        className={`px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all ${timerFinished
                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            : isRunning
                                ? 'bg-slate-800 text-red-400 hover:bg-slate-700'
                                : 'bg-yellow-600 text-white hover:bg-yellow-500'
                            }`}
                    >
                        {isRunning ? <><Pause size={18} /> Pausar</> : <><Play size={18} /> Iniciar</>}
                    </button>
                    <button
                        onClick={onResetTimer}
                        className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Resetar timer"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>

                {/* Finished Message */}
                {timerFinished && (
                    <p className="mt-4 text-red-400 font-bold text-sm animate-bounce">
                        ⏰ Tempo esgotado! Clique em resetar para continuar.
                    </p>
                )}
            </div>

            {/* Schedule-Based Goals (Rotina do Dia) */}
            <DailyScheduleGrid onNavigateToSunday={onNavigateToSunday} />

            {isInputLocked && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center animate-pulse">
                    <p className="text-sm text-amber-400 font-bold">🏆 Ultra metas diárias atingidas!</p>
                </div>
            )}

            {/* Idle Tasks Section (Metas Extras) */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-slate-400 font-bold uppercase tracking-wider text-xs">
                        Tarefas do Dia
                    </h4>
                    <button
                        onClick={() => setIsTaskSelectorOpen(true)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors"
                    >
                        <Plus size={14} />
                        Adicionar
                    </button>
                </div>

                {selectedIdleTasks.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">
                        Nenhuma tarefa selecionada. Clique em "Adicionar" para escolher tarefas ou hábitos.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {selectedIdleTasks.map(task => (
                            <IdleTaskItem
                                key={task.id}
                                task={task}
                                onComplete={() => onCompleteIdleTask(task)}
                                onRemove={() => onRemoveIdleTask(task.id)}
                                onEditPoints={(pts) => onUpdateIdleTaskPoints(task.id, pts)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Task Selector Modal */}
            <IdleTaskSelector
                isOpen={isTaskSelectorOpen}
                onClose={() => setIsTaskSelectorOpen(false)}
                selectedTasks={selectedIdleTasks}
                onAddTask={onAddIdleTask}
            />

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
