import React, { useState } from 'react';
import { LayoutList, Target, Plus } from 'lucide-react';

import { useHabitsManager } from './habits/hooks/useHabitsManager';
import { useTasksManager } from './habits/hooks/useTasksManager';
import { HabitsPanel } from './habits/HabitsPanel';
import { TasksPanel } from './habits/TasksPanel';

const HabitsView: React.FC = () => {
    // We lift the active tab state here to toggle panels
    const [activeTab, setActiveTab] = useState<'TASKS' | 'HABITS'>('TASKS');

    // Instantiate controllers
    const habitsManager = useHabitsManager();
    const tasksManager = useTasksManager();

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
                        onClick={() => {
                            tasksManager.setEditingTask(null);
                            tasksManager.setIsModalOpen(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 font-medium text-sm w-full md:w-auto justify-center"
                    >
                        <Plus size={18} /> Nova Tarefa
                    </button>
                ) : (
                    <button
                        onClick={() => habitsManager.setIsHabitModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 font-medium text-sm w-full md:w-auto justify-center"
                    >
                        <Plus size={18} /> Novo Hábito
                    </button>
                )}
            </div>

            {/* PANELS */}
            {activeTab === 'TASKS' ? (
                <TasksPanel manager={tasksManager} />
            ) : (
                <HabitsPanel manager={habitsManager} categories={tasksManager.categories} />
            )}

        </div>
    );
};

export default HabitsView;
