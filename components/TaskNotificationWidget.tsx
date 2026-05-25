import React, { useState, useMemo, useCallback, Suspense, useEffect, useRef } from 'react';
import { Bell, Clock, Tag, Trash2, X, CheckSquare } from 'lucide-react';
import { OrganizeTask } from '../types';
import { useTasks, useHabits, useTaskActions } from './../stores/selectors';
import { useStreakTracking } from '../hooks/useStreakTracking';
import { useTimerStore } from '../stores';
import { formatters } from '../utils/formatters';
import { getCategoryColor } from '../utils/styling';

const TaskModal = React.lazy(() => import('./habits/TaskModal'));

// Helper to get days difference between due date and today at local midnight
const getDaysRemaining = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = dueDateStr.split('-').map(Number);
    const due = new Date(year, month - 1, day, 0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return formatters.dayMonth.format(adjustedDate);
};

const getDaysRemainingLabel = (days: number) => {
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Amanhã';
    if (days === 3) return 'Em 3 dias';
    return `${days} dias`;
};

const getBadgeColor = (days: number) => {
    if (days === 0) return 'bg-red-500/20 text-red-400 border border-red-500/30';
    if (days === 1) return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    if (days === 3) return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
    return 'bg-slate-700 text-slate-400';
};

export const TaskNotificationWidget: React.FC = React.memo(() => {
    const tasks = useTasks();
    const habits = useHabits();
    const { updateTask, deleteTask } = useTaskActions();
    const { trackActivity } = useStreakTracking();
    const timer = useTimerStore((s) => s.timer);

    const [isOpen, setIsOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<OrganizeTask | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Filter tasks due or reminding in 0, 1, or 3 days
    const expiringTasks = useMemo(() => {
        return tasks
            .filter(t => {
                if (t.isCompleted || t.isArchived) return false;
                
                let isMatching = false;
                if (t.dueDate) {
                    const days = getDaysRemaining(t.dueDate);
                    if (days === 0 || days === 1 || days === 3) isMatching = true;
                }
                if (t.reminderDate) {
                    const days = getDaysRemaining(t.reminderDate);
                    if (days === 0 || days === 1 || days === 3) isMatching = true;
                }
                return isMatching;
            })
            .sort((a, b) => {
                const aDate = a.dueDate || a.reminderDate || '';
                const bDate = b.dueDate || b.reminderDate || '';
                return aDate.localeCompare(bDate);
            });
    }, [tasks]);

    // Categories list for TaskModal
    const categories = useMemo(() => {
        const cats = new Set([...tasks.map(t => t.category), ...habits.map(h => h.category)]);
        return Array.from(cats).sort();
    }, [tasks, habits]);

    // Detect click outside to close popover
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Toggle complete and auto-archive
    const handleToggleComplete = useCallback((id: string) => {
        updateTask(id, {
            isCompleted: true,
            isArchived: true
        });
        trackActivity();
    }, [updateTask, trackActivity]);

    // Open TaskModal
    const handleEditTask = useCallback((task: OrganizeTask) => {
        setEditingTask(task);
        setIsModalOpen(true);
    }, []);

    // Save edited task
    const handleSaveTask = useCallback((taskData: Partial<OrganizeTask>) => {
        if (editingTask) {
            updateTask(editingTask.id, taskData);
        }
        setIsModalOpen(false);
        setEditingTask(null);
    }, [editingTask, updateTask]);

    // Delete task
    const handleDeleteTask = useCallback((id: string) => {
        if (confirm('Tem certeza que deseja excluir permanentemente?')) {
            deleteTask(id);
        }
    }, [deleteTask]);

    if (expiringTasks.length === 0) return null;

    const isTimerActive = timer.status !== 'IDLE' && timer.status !== 'FINISHED';
    const positionClass = isTimerActive ? 'bottom-24 right-6' : 'bottom-6 right-6';

    return (
        <>
            <div className={`fixed z-50 flex flex-col items-end gap-2 transition-all duration-300 ${positionClass}`}>
                {isOpen && (
                    <div
                        ref={popoverRef}
                        className="glass-strong p-4 rounded-2xl shadow-2xl animate-scale-in mb-2 w-96 max-w-[calc(100vw-2rem)] flex flex-col gap-3"
                    >
                        <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                                <h3 className="font-bold text-white text-sm">Tarefas a Vencer</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Scrollable list of expiring tasks */}
                        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                            {expiringTasks.map(task => {
                                return (
                                    <div
                                        key={task.id}
                                        className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/30 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 flex items-start gap-4"
                                    >
                                        {/* Status Toggle */}
                                        <button
                                            onClick={() => handleToggleComplete(task.id)}
                                            className="transition-colors text-slate-600 hover:text-indigo-400 mt-0.5"
                                        >
                                            <div className="w-6 h-6 rounded border-2 border-current flex items-center justify-center">
                                                {task.isCompleted && <CheckSquare size={20} className="text-indigo-500" />}
                                            </div>
                                        </button>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-base font-medium truncate text-slate-200 block max-w-full">
                                                    {task.title}
                                                </span>
                                                {task.dueDate && (() => {
                                                    const days = getDaysRemaining(task.dueDate);
                                                    const label = getDaysRemainingLabel(days);
                                                    const dateFormatted = formatDate(task.dueDate);
                                                    return (
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 ${getBadgeColor(days)}`}>
                                                            <Clock size={10} />
                                                            {label} ({dateFormatted})
                                                        </span>
                                                    );
                                                })()}
                                                {task.reminderDate && (() => {
                                                    const days = getDaysRemaining(task.reminderDate);
                                                    const isExpiring = days === 0 || days === 1 || days === 3;
                                                    const dateFormatted = formatDate(task.reminderDate);
                                                    if (isExpiring) {
                                                        const label = getDaysRemainingLabel(days);
                                                        return (
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 ${getBadgeColor(days)}`} title={`Lembrete para: ${dateFormatted}`}>
                                                                <Bell size={10} className="text-yellow-500" />
                                                                Lembrete: {label} ({dateFormatted})
                                                            </span>
                                                        );
                                                    } else {
                                                        return (
                                                            <span className="text-[10px] text-slate-500 flex items-center gap-1" title={`Lembrete para: ${dateFormatted}`}>
                                                                <Bell size={10} className="text-yellow-500" /> Lembrete
                                                            </span>
                                                        );
                                                    }
                                                })()}
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider ${getCategoryColor(task.category)}`}>
                                                    {task.category.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                                            <button
                                                onClick={() => handleEditTask(task)}
                                                className="p-1.5 hover:bg-slate-700 rounded text-slate-500 hover:text-white transition-colors"
                                                title="Editar tarefa"
                                            >
                                                <Tag size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="p-1.5 hover:bg-red-900/20 rounded text-slate-500 hover:text-red-400 transition-colors"
                                                title="Excluir tarefa"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* FAB button */}
                <button
                    ref={buttonRef}
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 group
                        ${isOpen
                            ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-red-500/30'
                            : 'bg-slate-800 border border-red-500/30 text-red-400 hover:border-red-400'
                        }
                    `}
                    title="Tarefas a vencer"
                >
                    {/* Ring animation */}
                    <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping pointer-events-none" style={{ animationDuration: '2.5s' }} />
                    
                    <Bell size={24} className={`relative z-10 ${isOpen ? '' : 'animate-pulse'}`} />

                    {/* Badge Count */}
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950 shadow-md">
                        {expiringTasks.length}
                    </span>
                </button>
            </div>

            {/* TASK MODAL */}
            {isModalOpen && (
                <Suspense fallback={
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    </div>
                }>
                    <TaskModal
                        task={editingTask}
                        categories={categories}
                        onClose={() => {
                            setIsModalOpen(false);
                            setEditingTask(null);
                        }}
                        onSave={handleSaveTask}
                    />
                </Suspense>
            )}
        </>
    );
});

TaskNotificationWidget.displayName = 'TaskNotificationWidget';
