import React, { useState, useMemo } from 'react';
import { X, Plus, LayoutList, Target, Search } from 'lucide-react';
import { useHabitsStore } from '../../../../stores';
import { IdleTask } from '../../../../types';
import { DEFAULT_IDLE_TASK_POINTS } from '../../../../stores/work';

interface IdleTaskSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    selectedTasks: IdleTask[];
    onAddTask: (task: Omit<IdleTask, 'id' | 'addedAt'>) => void;
}

/**
 * Modal to select tasks/habits from HabitsStore to add to Idle Tasks (Metas Extras)
 */
export const IdleTaskSelector: React.FC<IdleTaskSelectorProps> = ({
    isOpen,
    onClose,
    selectedTasks,
    onAddTask,
}) => {
    const [activeTab, setActiveTab] = useState<'TASKS' | 'HABITS'>('TASKS');
    const [searchTerm, setSearchTerm] = useState('');

    // Get data from HabitsStore
    const tasks = useHabitsStore((s) => s.tasks);
    const habits = useHabitsStore((s) => s.habits);

    // Today's date for habit completion check
    const today = useMemo(() => new Date().toISOString().split('T')[0], []);

    // Filter available tasks (not completed, not archived, not already selected)
    const availableTasks = useMemo(() => {
        const selectedSourceIds = new Set(
            selectedTasks.filter(t => t.sourceType === 'TASK').map(t => t.sourceId)
        );
        return tasks.filter(task =>
            !task.isCompleted &&
            !task.isArchived &&
            !selectedSourceIds.has(task.id) &&
            task.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tasks, selectedTasks, searchTerm]);

    // Filter available habits (not archived, not completed today, not already selected)
    const availableHabits = useMemo(() => {
        const selectedSourceIds = new Set(
            selectedTasks.filter(t => t.sourceType === 'HABIT').map(t => t.sourceId)
        );
        return habits.filter(habit => {
            if (habit.archived) return false;
            if (selectedSourceIds.has(habit.id)) return false;
            // Check if completed today
            const todayLog = habit.history[today];
            if (todayLog?.completed) return false;
            // Search filter
            if (!habit.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return true;
        });
    }, [habits, selectedTasks, today, searchTerm]);

    const handleAddTask = (sourceType: 'TASK' | 'HABIT', sourceId: string, title: string) => {
        onAddTask({
            sourceType,
            sourceId,
            title,
            points: DEFAULT_IDLE_TASK_POINTS,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-lg max-h-[80vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Adicionar Tarefa</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 bg-slate-950/50 gap-2">
                    <button
                        onClick={() => setActiveTab('TASKS')}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'TASKS'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        <LayoutList size={16} />
                        Tarefas ({availableTasks.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('HABITS')}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'HABITS'
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        <Target size={16} />
                        Hábitos ({availableHabits.length})
                    </button>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-slate-800">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {activeTab === 'TASKS' && (
                        <>
                            {availableTasks.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <LayoutList size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>Nenhuma tarefa disponível</p>
                                </div>
                            ) : (
                                availableTasks.map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => handleAddTask('TASK', task.id, task.title)}
                                        className="w-full p-3 bg-slate-800 hover:bg-slate-750 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all text-left group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">{task.title}</p>
                                                <p className="text-xs text-slate-500">{task.category}</p>
                                            </div>
                                            <Plus size={18} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                                        </div>
                                    </button>
                                ))
                            )}
                        </>
                    )}

                    {activeTab === 'HABITS' && (
                        <>
                            {availableHabits.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Target size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>Nenhum hábito disponível</p>
                                </div>
                            ) : (
                                availableHabits.map(habit => (
                                    <button
                                        key={habit.id}
                                        onClick={() => handleAddTask('HABIT', habit.id, habit.title)}
                                        className="w-full p-3 bg-slate-800 hover:bg-slate-750 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-all text-left group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">{habit.title}</p>
                                                <p className="text-xs text-slate-500">{habit.category}</p>
                                            </div>
                                            <Plus size={18} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
                                        </div>
                                    </button>
                                ))
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IdleTaskSelector;
