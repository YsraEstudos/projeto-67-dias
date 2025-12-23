import React, { Suspense } from 'react';
import { Search, RotateCcw, Archive, LayoutList, Sparkles } from 'lucide-react';
import { useTasksManager } from './hooks/useTasksManager';
import { TaskItem } from '../../habits/TaskItem';

const TaskModal = React.lazy(() => import('../../habits/TaskModal'));
const AITaskAssistantModal = React.lazy(() => import('../../../components/modals/AITaskAssistantModal'));

interface TasksPanelProps {
    manager: ReturnType<typeof useTasksManager>;
}

export const TasksPanel: React.FC<TasksPanelProps> = ({ manager }) => {
    const {
        // State
        showArchived,
        setShowArchived,
        filterCategory,
        setFilterCategory,
        searchInput,
        setSearchInput,

        // Data
        categories,
        filteredTasks,

        // Actions
        handleEditTask,
        toggleCompleteTask,
        restoreTaskHandler,
        deleteTask,

        // Modals
        isModalOpen,
        setIsModalOpen,
        editingTask,
        setEditingTask,
        handleSaveTask,

        isAIModalOpen,
        setIsAIModalOpen,
        handleAIGeneratedTasks
    } = manager;

    return (
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

            {/* FLOATING AI BUTTON (For Tasks only) */}
            <button
                onClick={() => setIsAIModalOpen(true)}
                className="fixed bottom-8 right-8 z-40 group flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:scale-110 transition-all duration-300 hover:shadow-indigo-500/50 border border-white/10"
                title="Planejador IA"
            >
                <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100 duration-1000"></div>
            </button>


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
