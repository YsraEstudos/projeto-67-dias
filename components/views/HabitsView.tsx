
import React, { useState, useMemo, useCallback, Suspense } from 'react';
import {
    Archive, Plus, Search,
    LayoutList, CheckCircle2, Sparkles, Calendar, ChevronLeft, ChevronRight,
    Target, RotateCcw
} from 'lucide-react';

import { OrganizeTask, Habit } from '../../types';
import { useHabitsStore } from '../../stores';
import { WaterTracker } from '../habits/WaterTracker';
import { useDebounce } from '../../hooks/useDebounce';
import { useStreakTracking } from '../../hooks/useStreakTracking';
import { TaskItem } from '../habits/TaskItem';
import {
    useTasks, useHabits,
    useTaskActions, useHabitActions
} from '../../stores/selectors';
import HabitCard from '../habits/HabitCard';

const AITaskAssistantModal = React.lazy(() => import('../../components/modals/AITaskAssistantModal'));
const HabitModal = React.lazy(() => import('../habits/HabitModal'));
const TaskModal = React.lazy(() => import('../habits/TaskModal'));

const HabitsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'TASKS' | 'HABITS'>('TASKS');

    // Zustand Store - Optimized Selectors
    // Data: Using atomic selectors for optimal re-rendering
    const tasks = useTasks();
    const habits = useHabits();

    const {
        addTask,
        updateTask,
        deleteTask: removeTask,
        toggleTaskComplete,
        archiveTask,
        restoreTask
    } = useTaskActions();

    const {
        addHabit,
        updateHabit,
        deleteHabit: removeHabit,
        toggleHabitCompletion,
        logHabitValue
    } = useHabitActions();

    // View State
    const [showArchived, setShowArchived] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const searchQuery = useDebounce(searchInput, 300); // Debounced for performance

    // Habits View Specific State
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    const [editingTask, setEditingTask] = useState<OrganizeTask | null>(null);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

    // Streak Tracking
    const { trackActivity } = useStreakTracking();

    // --- COMPUTED ---

    const categories = useMemo(() => {
        const cats = new Set([...tasks.map(t => t.category), ...habits.map(h => h.category)]);
        return Array.from(cats).sort();
    }, [tasks, habits]);

    const filteredTasks = useMemo(() => {
        return tasks
            .filter(t => {
                if (showArchived) return t.isArchived;
                return !t.isArchived;
            })
            .filter(t => {
                if (filterCategory) return t.category === filterCategory;
                return true;
            })
            .filter(t => {
                if (!searchQuery) return true;
                return t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.category.toLowerCase().includes(searchQuery.toLowerCase());
            })
            .sort((a, b) => {
                if (a.dueDate && !b.dueDate) return -1;
                if (!a.dueDate && b.dueDate) return 1;
                if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
                return b.createdAt - a.createdAt;
            });
    }, [tasks, showArchived, filterCategory, searchQuery]);

    // --- HANDLERS (TASKS) ---

    const handleSaveTask = (taskData: Partial<OrganizeTask>) => {
        if (editingTask) {
            updateTask(editingTask.id, taskData);
        } else {
            const newTask: OrganizeTask = {
                id: Date.now().toString(),
                title: taskData.title || 'Nova Tarefa',
                category: taskData.category || 'Geral',
                isCompleted: false,
                isArchived: false,
                createdAt: Date.now(),
                dueDate: taskData.dueDate,
                reminderDate: taskData.reminderDate,
            };
            addTask(newTask);
        }
        setIsModalOpen(false);
        setEditingTask(null);
    };

    const handleEditTask = useCallback((task: OrganizeTask) => {
        setEditingTask(task);
        setIsModalOpen(true);
    }, []);

    const handleAIGeneratedTasks = (newTasks: { title: string, category: string, daysFromNow?: number }[]) => {
        newTasks.forEach((t, idx) => {
            const dueDate = t.daysFromNow ? new Date(new Date().setDate(new Date().getDate() + t.daysFromNow)).toISOString().split('T')[0] : undefined;
            const task: OrganizeTask = {
                id: (Date.now() + idx).toString(),
                title: t.title,
                category: t.category,
                isCompleted: false,
                isArchived: false,
                createdAt: Date.now(),
                dueDate: dueDate
            };
            addTask(task);
        });
        setIsAIModalOpen(false);
    };

    const toggleCompleteTask = useCallback((id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            const newStatus = !task.isCompleted;
            updateTask(id, {
                isCompleted: newStatus,
                isArchived: newStatus // Auto archive on complete
            });
            // Track activity for streak when completing a task
            if (newStatus) {
                trackActivity();
            }
        }
    }, [tasks, updateTask, trackActivity]);

    const restoreTaskHandler = useCallback((id: string) => {
        updateTask(id, { isCompleted: false, isArchived: false });
    }, [updateTask]);

    const deleteTask = useCallback((id: string) => {
        if (confirm('Tem certeza que deseja excluir permanentemente?')) {
            removeTask(id);
        }
    }, [removeTask]);

    // --- HANDLERS (HABITS) ---

    const handleSaveHabit = (habit: Habit) => {
        if (editingHabit) {
            // Update existing habit, preserving history
            updateHabit(editingHabit.id, {
                ...habit,
                id: editingHabit.id,
                history: editingHabit.history,
                createdAt: editingHabit.createdAt
            });
        } else {
            addHabit(habit);
        }
        setIsHabitModalOpen(false);
        setEditingHabit(null);
    };

    const deleteHabit = useCallback((id: string) => {
        if (confirm('Remover este hábito? Todo o histórico será perdido.')) {
            removeHabit(id);
        }
    }, [removeHabit]);

    const handleEditHabit = useCallback((habit: Habit) => {
        setEditingHabit(habit);
        setIsHabitModalOpen(true);
    }, []);

    const handleToggleHabitCompletion = useCallback((habitId: string, subHabitId?: string) => {
        const dateKey = selectedDate.toISOString().split('T')[0];
        const currentHabits = useHabitsStore.getState().habits;

        // Use store action
        toggleHabitCompletion(habitId, dateKey, subHabitId);

        // Special handling for parent toggle with sub-habits
        if (!subHabitId) {
            const habit = currentHabits.find(h => h.id === habitId);
            if (habit && habit.subHabits.length > 0) {
                const currentLog = habit.history[dateKey] || { completed: false, subHabitsCompleted: [] };
                const willBeComplete = !currentLog.completed;

                updateHabit(habitId, {
                    history: {
                        ...habit.history,
                        [dateKey]: {
                            ...currentLog,
                            completed: willBeComplete,
                            subHabitsCompleted: willBeComplete ? habit.subHabits.map(sh => sh.id) : []
                        }
                    }
                });
            }
        }
        // Track activity for streak when toggling a habit
        trackActivity();
    }, [selectedDate, toggleHabitCompletion, updateHabit, trackActivity]);

    const handleLogValue = useCallback((habitId: string, value: number) => {
        const dateKey = selectedDate.toISOString().split('T')[0];
        const currentHabits = useHabitsStore.getState().habits;

        const habit = currentHabits.find(h => h.id === habitId);
        if (!habit) return;

        const currentLog = habit.history[dateKey] || { completed: false, subHabitsCompleted: [], value: 0 };
        const newValue = (currentLog.value || 0) + value;

        let isCompleted = currentLog.completed;
        if (habit.targetValue) {
            if (habit.goalType === 'MIN_TIME' && habit.frequency === 'DAILY' && newValue >= habit.targetValue) {
                isCompleted = true;
            }
        }

        updateHabit(habitId, {
            history: {
                ...habit.history,
                [dateKey]: {
                    ...currentLog,
                    value: newValue,
                    completed: isCompleted
                }
            }
        });
    }, [selectedDate, updateHabit]);

    const changeDay = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    return (
        <div className="h-full flex flex-col max-w-5xl mx-auto animate-in fade-in duration-500 pb-24 relative">

            {/* HEADER & TABS */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
                    <button
                        onClick={() => setActiveTab('TASKS')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'TASKS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <LayoutList size={18} /> Tarefas & Arrumar
                    </button>
                    <button
                        onClick={() => setActiveTab('HABITS')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'HABITS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Target size={18} /> Rotina & Hábitos
                    </button>
                </div>

                {activeTab === 'TASKS' ? (
                    <button
                        onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 font-medium text-sm w-full md:w-auto justify-center"
                    >
                        <Plus size={18} /> Nova Tarefa
                    </button>
                ) : (
                    <button
                        onClick={() => setIsHabitModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 font-medium text-sm w-full md:w-auto justify-center"
                    >
                        <Plus size={18} /> Novo Há¡bito
                    </button>
                )}
            </div>

            {/* ====================== TASKS VIEW ====================== */}
            {activeTab === 'TASKS' && (
                <div className="flex flex-col gap-6">
                    {/* FILTERS BAR */}
                    <div className="flex flex-col sm:flex-row gap-3 bg-slate-800/30 p-3 rounded-xl border border-slate-800/50 backdrop-blur-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Buscar tarefas..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                            <select
                                value={filterCategory || ''}
                                onChange={(e) => setFilterCategory(e.target.value || null)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-indigo-500 outline-none"
                            >
                                <option value="">Todas Categorias</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 whitespace-nowrap ${showArchived ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'}`}
                            >
                                {showArchived ? <RotateCcw size={16} /> : <Archive size={16} />}
                                {showArchived ? 'Voltar às Ativas' : 'Ver Arquivados'}
                            </button>
                        </div>
                    </div>

                    {/* TASK LIST */}
                    <div className="space-y-2">
                        {filteredTasks.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                                <LayoutList size={48} className="text-slate-700 mb-4" />
                                <p className="text-slate-500 font-medium">{showArchived ? 'Nenhuma tarefa arquivada.' : 'Tudo organizado! Nenhuma tarefa pendente.'}</p>
                            </div>
                        )}

                        {filteredTasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                toggleCompleteTask={toggleCompleteTask}
                                restoreTask={restoreTaskHandler}
                                deleteTask={deleteTask}
                                onEdit={handleEditTask}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ====================== HABITS VIEW ====================== */}
            {activeTab === 'HABITS' && (
                <div className="flex flex-col gap-6">
                    {/* WATER TRACKER */}
                    <WaterTracker />

                    {/* Date Navigator */}
                    <div className="flex items-center justify-between bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg">
                        <button onClick={() => changeDay(-1)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                            <ChevronLeft size={24} />
                        </button>

                        <div className="flex flex-col items-center">
                            <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Registro Diário</div>
                            <div className="flex items-center gap-2 text-xl font-bold text-white">
                                <Calendar size={20} className="text-slate-400" />
                                {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                                {selectedDate.toDateString() === new Date().toDateString() && <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">Hoje</span>}
                            </div>
                        </div>

                        <button onClick={() => changeDay(1)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {habits.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                                <CheckCircle2 size={48} className="text-slate-700 mb-4" />
                                <p className="text-slate-500 font-medium">Nenhum há¡bito criado ainda.</p>
                            </div>
                        )}

                        {habits.map(habit => (
                            <HabitCard
                                key={habit.id}
                                habit={habit}
                                selectedDate={selectedDate}
                                onToggle={handleToggleHabitCompletion}
                                onLogValue={handleLogValue}
                                onEdit={handleEditHabit}
                                onDelete={deleteHabit}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* FLOATING AI BUTTON (For Tasks only) */}
            {activeTab === 'TASKS' && (
                <button
                    onClick={() => setIsAIModalOpen(true)}
                    className="fixed bottom-8 right-8 z-40 group flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:scale-110 transition-all duration-300 hover:shadow-indigo-500/50 border border-white/10"
                    title="Planejador IA"
                >
                    <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
                    <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100 duration-1000"></div>
                </button>
            )}

            {/* TASK MODAL */}
            {isModalOpen && (
                <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>}>
                    <TaskModal
                        task={editingTask}
                        categories={categories}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSaveTask}
                    />
                </Suspense>
            )}

            {/* HABIT CREATE/EDIT MODAL */}
            {isHabitModalOpen && (
                <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>}>
                    <HabitModal
                        categories={categories}
                        habit={editingHabit}
                        onClose={() => { setIsHabitModalOpen(false); setEditingHabit(null); }}
                        onSave={handleSaveHabit}
                    />
                </Suspense>
            )}

            {/* AI ASSISTANT MODAL */}
            {/* AI ASSISTANT MODAL */}
            {isAIModalOpen && (
                <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>}>
                    <AITaskAssistantModal
                        onClose={() => setIsAIModalOpen(false)}
                        onApply={handleAIGeneratedTasks}
                    />
                </Suspense>
            )}

        </div>
    );
};

export default HabitsView;
