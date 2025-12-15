
import React, { useState, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
    CalendarCheck, CheckSquare, Plus, Trash2,
    Archive, RotateCcw,
    ChevronDown, ChevronRight, StickyNote
} from 'lucide-react';
import { SundayTask } from '../../types';
import { SundayTimer } from './SundayTimer';
import { useSundayStore } from '../../stores/sundayStore';
import { useAuth } from '../../hooks/useAuth';
import { NotesTabSkeleton } from '../notes/NotesTabSkeleton';

const NotesTab = React.lazy(() => import('../notes/NotesTab').then(module => ({ default: module.NotesTab })));


/**
 * SundayView - Componente principal para a seção "Ajeitar Rápido".
 * 
 * @description Gerencia tarefas de organização semanal e integra o módulo de Notas.
 * Inclui um timer de sessão de trabalho focado.
 */
const SundayView: React.FC = () => {
    // --- ALL HOOKS FIRST (Regra dos Hooks) ---
    // Zustand store
    // Zustand store
    const {
        tasks,
        addTask: storeAddTask,
        archiveTask: storeArchiveTask,
        restoreTask,
        deleteTask: storeDeleteTask,
        addSubTask: storeAddSubTask,
        toggleSubTaskComplete,
        deleteSubTask
    } = useSundayStore(useShallow((state) => ({
        tasks: state.tasks,
        addTask: state.addTask,
        archiveTask: state.archiveTask,
        restoreTask: state.restoreTask,
        deleteTask: state.deleteTask,
        addSubTask: state.addSubTask,
        toggleSubTaskComplete: state.toggleSubTaskComplete,
        deleteSubTask: state.deleteSubTask
    })));
    const [showArchived, setShowArchived] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [activeTab, setActiveTab] = useState<'resumo' | 'notas'>('resumo');
    const { loading: authLoading } = useAuth();


    // --- DERIVED STATE ---
    const activeTasks = useMemo(() => tasks.filter(t => !t.isArchived), [tasks]);
    const archivedTasks = useMemo(() => tasks.filter(t => t.isArchived), [tasks]);
    const isSunday = useMemo(() => new Date().getDay() === 0, []);


    // --- TASK HANDLERS ---

    const handleAddTask = useCallback(() => {
        if (!newTaskTitle.trim()) return;
        const newTask: SundayTask = {
            id: Date.now().toString(),
            title: newTaskTitle,
            subTasks: [],
            isArchived: false,
            createdAt: Date.now()
        };
        storeAddTask(newTask);
        setNewTaskTitle('');
    }, [newTaskTitle, storeAddTask]);

    const handleArchiveTask = useCallback((id: string) => {
        storeArchiveTask(id);
    }, [storeArchiveTask]);

    const handleUnarchiveTask = useCallback((id: string) => {
        restoreTask(id);
    }, [restoreTask]);

    const handleDeleteTask = useCallback((id: string) => {
        if (confirm('Excluir permanentemente esta tarefa?')) {
            storeDeleteTask(id);
        }
    }, [storeDeleteTask]);

    const handleAddSubTask = useCallback((taskId: string, title: string) => {
        storeAddSubTask(taskId, { id: Date.now().toString(), title, isCompleted: false });
    }, [storeAddSubTask]);

    const handleToggleSubTask = useCallback((taskId: string, subTaskId: string) => {
        toggleSubTaskComplete(taskId, subTaskId);
    }, [toggleSubTaskComplete]);

    const handleRemoveSubTask = useCallback((taskId: string, subTaskId: string) => {
        deleteSubTask(taskId, subTaskId);
    }, [deleteSubTask]);


    // --- RENDER ---
    return (
        <div className="max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">

            {/* HEADER & TIMER */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <CalendarCheck className="text-pink-500" /> Ajeitar Rápido
                        </h2>
                        <p className="text-slate-400 mt-1 text-sm">
                            {isSunday
                                ? "Hoje é domingo! Hora de organizar a semana."
                                : "Prepare suas tarefas para o próximo domingo."}
                        </p>
                    </div>

                    <SundayTimer />
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-2 mb-8 border-b border-slate-700" role="tablist">
                <button
                    role="tab"
                    aria-selected={activeTab === 'resumo'}
                    onClick={() => setActiveTab('resumo')}
                    className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 relative ${activeTab === 'resumo'
                        ? 'text-white border-b-2 border-pink-500'
                        : 'text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <CheckSquare size={18} />
                    Resumo
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'notas'}
                    onClick={() => setActiveTab('notas')}
                    className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 relative ${activeTab === 'notas'
                        ? 'text-white border-b-2 border-purple-500'
                        : 'text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <StickyNote size={18} />
                    Minhas Notas
                </button>
            </div>

            {activeTab === 'notas' ? (
                <React.Suspense fallback={<NotesTabSkeleton />}>
                    <NotesTab isAuthLoading={authLoading} />
                </React.Suspense>
            ) : (
                <>
                    {/* ADD TASK INPUT */}
                    <div className="flex items-center gap-2 mb-8 group bg-slate-900 border border-slate-700 rounded-2xl p-2 pl-4 focus-within:border-pink-500 focus-within:ring-1 focus-within:ring-pink-500 transition-all shadow-lg">
                        <input
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                            className="flex-1 bg-transparent text-lg text-white outline-none placeholder:text-slate-500"
                            placeholder="O que precisa ser ajeitado neste domingo?"
                        />
                        <button
                            onClick={handleAddTask}
                            disabled={!newTaskTitle.trim()}
                            className="bg-pink-600 hover:bg-pink-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-2.5 rounded-xl transition-colors shadow-lg shadow-pink-900/20 shrink-0"
                            aria-label="Adicionar tarefa"
                        >
                            <Plus size={24} />
                        </button>
                    </div>

                    {/* ACTIVE TASKS */}
                    <div className="space-y-4">
                        {activeTasks.length === 0 && (
                            <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                                <p>Lista vazia.</p>
                                <p className="text-sm">Adicione as tarefas que você realiza religiosamente todo domingo.</p>
                            </div>
                        )}

                        {activeTasks.map(task => (
                            <SundayTaskCard
                                key={task.id}
                                task={task}
                                onArchive={() => handleArchiveTask(task.id)}
                                onDelete={() => handleDeleteTask(task.id)}
                                onAddSubTask={handleAddSubTask}
                                onToggleSubTask={handleToggleSubTask}
                                onRemoveSubTask={handleRemoveSubTask}
                            />
                        ))}
                    </div>

                    {/* ARCHIVED SECTION */}
                    <div className="mt-12">
                        <button
                            onClick={() => setShowArchived(prev => !prev)}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors mb-4"
                        >
                            <Archive size={16} />
                            {showArchived ? 'Ocultar Arquivados' : `Mostrar Arquivados (${archivedTasks.length})`}
                        </button>

                        {showArchived && (
                            <div className="space-y-3 animate-in slide-in-from-top-2">
                                {archivedTasks.map(task => (
                                    <div key={task.id} className="flex items-center justify-between bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-slate-500">
                                        <span className="line-through decoration-pink-500/50">{task.title}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleUnarchiveTask(task.id)} className="p-2 hover:bg-slate-800 rounded-lg hover:text-pink-400 transition-colors" title="Restaurar">
                                                <RotateCcw size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteTask(task.id)} className="p-2 hover:bg-slate-800 rounded-lg hover:text-red-400 transition-colors" title="Excluir Definitivamente">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {archivedTasks.length === 0 && <p className="text-xs text-slate-600 pl-2">Nenhum item arquivado.</p>}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// --- SUB COMPONENT: TASK CARD ---

interface SundayTaskCardProps {
    task: SundayTask;
    onArchive: () => void;
    onDelete: () => void;
    onAddSubTask: (id: string, title: string) => void;
    onToggleSubTask: (id: string, subId: string) => void;
    onRemoveSubTask: (id: string, subId: string) => void;
}

const SundayTaskCard: React.FC<SundayTaskCardProps> = React.memo(({ task, onArchive, onDelete, onAddSubTask, onToggleSubTask, onRemoveSubTask }) => {
    const [expanded, setExpanded] = useState(task.subTasks.length > 0);
    const [subInput, setSubInput] = useState('');

    const handleAdd = useCallback(() => {
        if (subInput.trim()) {
            onAddSubTask(task.id, subInput);
            setSubInput('');
        }
    }, [subInput, onAddSubTask, task.id]);

    const progress = useMemo(() => {
        if (task.subTasks.length === 0) return 0;
        return Math.round((task.subTasks.filter(s => s.isCompleted).length / task.subTasks.length) * 100);
    }, [task.subTasks]);

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-pink-500/30">
            {/* Card Header */}
            <div className="p-4 flex items-center gap-3">
                <button onClick={() => setExpanded(prev => !prev)} className="text-slate-500 hover:text-white transition-colors" aria-label={expanded ? "Recolher" : "Expandir"}>
                    {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>

                <div className="flex-1">
                    <h3 className="text-lg font-medium text-slate-200">{task.title}</h3>
                    {task.subTasks.length > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-pink-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-500">{progress}%</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={onArchive}
                    className="p-2 bg-pink-500/10 text-pink-400 hover:bg-pink-500 hover:text-white rounded-lg transition-all border border-pink-500/20"
                    title="Concluir e Arquivar"
                >
                    <CheckSquare size={20} />
                </button>
            </div>

            {/* Subtasks Area */}
            {expanded && (
                <div className="bg-slate-900/50 border-t border-slate-700/50 p-4 animate-in slide-in-from-top-1">
                    {/* Subtask List */}
                    <div className="space-y-2 mb-4">
                        {task.subTasks.map(sub => (
                            <div key={sub.id} className="flex items-center gap-3 group">
                                <button
                                    onClick={() => onToggleSubTask(task.id, sub.id)}
                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${sub.isCompleted ? 'bg-pink-600 border-pink-600' : 'border-slate-600 hover:border-pink-500'}`}
                                    aria-label={sub.isCompleted ? "Marcar como pendente" : "Marcar como concluído"}
                                >
                                    {sub.isCompleted && <CheckSquare size={12} className="text-white" />}
                                </button>
                                <span className={`text-sm flex-1 ${sub.isCompleted ? 'text-slate-500 line-through decoration-slate-600' : 'text-slate-300'}`}>
                                    {sub.title}
                                </span>
                                <button onClick={() => onRemoveSubTask(task.id, sub.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-opacity" aria-label="Remover subtarefa">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add Subtask Input */}
                    <div className="flex gap-2">
                        <input
                            value={subInput}
                            onChange={e => setSubInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            placeholder="Adicionar subtarefa..."
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-pink-500 outline-none"
                        />
                        <button onClick={handleAdd} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg" aria-label="Adicionar subtarefa">
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-800 flex justify-end">
                        <button onClick={onDelete} className="text-xs text-slate-600 hover:text-red-400 flex items-center gap-1 transition-colors">
                            <Trash2 size={12} /> Remover Lista
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});
SundayTaskCard.displayName = 'SundayTaskCard';

export default SundayView;
