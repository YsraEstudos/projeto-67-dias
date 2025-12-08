import React, { useState } from 'react';
import {
    Bot, Plus, Sparkles, X, CheckCircle2, Circle,
    Layers, Download
} from 'lucide-react';
import { SkillRoadmapItem } from '../../types';
import { ImportExportModal } from './ImportExportModal';
import { AIRoadmapModal } from './AIRoadmapModal';
import { THEME_VARIANTS, ThemeKey } from './constants';

interface RoadmapSectionProps {
    roadmap: SkillRoadmapItem[];
    skillName: string;
    skillLevel: string;
    skillColorTheme: string;
    onUpdate: (roadmap: SkillRoadmapItem[]) => void;
}

/**
 * Roadmap section component with drag & drop, AI generation, and import/export.
 */
export const RoadmapSection: React.FC<RoadmapSectionProps> = ({
    roadmap,
    skillName,
    skillLevel,
    skillColorTheme,
    onUpdate
}) => {
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isImportExportOpen, setIsImportExportOpen] = useState(false);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAddingDivider, setIsAddingDivider] = useState(false);
    const [newDividerTitle, setNewDividerTitle] = useState('');
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

    const theme = (skillColorTheme as ThemeKey) || 'emerald';
    const variants = THEME_VARIANTS[theme];

    // Roadmap Stats
    const roadmapTasks = roadmap.filter(i => i.type !== 'SECTION');
    const completedTasks = roadmapTasks.filter(i => i.isCompleted).length;
    const totalTasks = roadmapTasks.length;
    const roadmapProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Item Handlers
    const toggleRoadmapItem = (itemId: string) => {
        onUpdate(roadmap.map(i => i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i));
    };

    const removeItem = (itemId: string) => {
        onUpdate(roadmap.filter(r => r.id !== itemId));
    };

    const handleAIRoadmap = (items: string[]) => {
        const newItems: SkillRoadmapItem[] = items.map((t, i) => ({
            id: Date.now().toString() + i,
            title: t,
            isCompleted: false,
            type: 'TASK'
        }));
        onUpdate([...roadmap, ...newItems]);
        setIsAIModalOpen(false);
    };

    // Manual Add Handlers
    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;
        const newTask: SkillRoadmapItem = {
            id: Date.now().toString(),
            title: newTaskTitle,
            isCompleted: false,
            type: 'TASK'
        };
        onUpdate([...roadmap, newTask]);
        setNewTaskTitle('');
        setIsAddingTask(false);
    };

    const handleAddDivider = () => {
        if (!newDividerTitle.trim()) return;
        const newSection: SkillRoadmapItem = {
            id: Date.now().toString(),
            title: newDividerTitle,
            isCompleted: false,
            type: 'SECTION'
        };
        onUpdate([...roadmap, newSection]);
        setNewDividerTitle('');
        setIsAddingDivider(false);
    };

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedItemId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedItemId || draggedItemId === targetId) return;

        const sourceIndex = roadmap.findIndex(i => i.id === draggedItemId);
        const targetIndex = roadmap.findIndex(i => i.id === targetId);

        if (sourceIndex === -1 || targetIndex === -1) return;

        const newRoadmap = [...roadmap];
        const [removed] = newRoadmap.splice(sourceIndex, 1);
        newRoadmap.splice(targetIndex, 0, removed);

        onUpdate(newRoadmap);
    };

    const handleDragEnd = () => {
        setDraggedItemId(null);
    };

    return (
        <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col min-h-[500px]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bot size={18} className="text-purple-400" /> Roadmap Inteligente
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportExportOpen(true)}
                        className="text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 px-3 py-1.5 rounded-lg border border-slate-600 flex items-center gap-1 transition-colors"
                        title="Importar / Exportar"
                    >
                        <Download size={12} /> Importar / Exportar
                    </button>
                    <button
                        onClick={() => setIsAddingDivider(true)}
                        className="text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 px-3 py-1.5 rounded-lg border border-slate-600 flex items-center gap-1 transition-colors"
                        title="Adicionar Separador"
                    >
                        <Layers size={12} /> Divisória
                    </button>
                    <button
                        onClick={() => setIsAddingTask(true)}
                        className={`text-xs ${variants.bgLight} ${variants.text} ${variants.bgHover} px-3 py-1.5 rounded-lg border ${variants.borderLight} flex items-center gap-1 transition-colors`}
                        title="Adicionar Tarefa Manualmente"
                    >
                        <Plus size={12} /> Tarefa
                    </button>
                    <button
                        onClick={() => setIsAIModalOpen(true)}
                        className="text-xs bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg border border-purple-500/30 flex items-center gap-1 transition-colors"
                    >
                        <Sparkles size={12} /> Gerar com IA
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6 bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex justify-between items-center mb-2 text-xs font-bold uppercase text-slate-500 tracking-wider">
                    <span>Progresso de Tarefas</span>
                    <span>{completedTasks} / {totalTasks}</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-700 ease-out"
                        style={{ width: `${roadmapProgress}%` }}
                    />
                </div>
                <div className="text-right mt-1 text-xs text-purple-400 font-mono">{roadmapProgress}% Completo</div>
            </div>

            {/* Roadmap Items */}
            <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin">
                {roadmap.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60 min-h-[200px]">
                        <Sparkles size={48} className="mb-4" />
                        <p>Gere um plano de estudos com IA para começar.</p>
                    </div>
                )}

                {roadmap.map((item) => {
                    if (item.type === 'SECTION') {
                        return (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, item.id)}
                                onDragOver={(e) => handleDragOver(e, item.id)}
                                onDragEnd={handleDragEnd}
                                className={`flex items-center gap-4 py-4 group cursor-move ${draggedItemId === item.id ? 'opacity-50' : ''}`}
                            >
                                <div className="h-px bg-slate-700 flex-1"></div>
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{item.title}</span>
                                <div className="h-px bg-slate-700 flex-1 relative">
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="absolute right-0 -top-2.5 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 p-1 bg-slate-800 rounded-full"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onDragOver={(e) => handleDragOver(e, item.id)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-move ${item.isCompleted
                                ? 'bg-slate-900/30 border-slate-800 opacity-50'
                                : `bg-slate-900/80 border-slate-700 ${variants.hoverBorderLight}`
                                } ${draggedItemId === item.id ? 'opacity-50 border-dashed border-slate-500' : ''}`}
                        >
                            <button
                                onClick={() => toggleRoadmapItem(item.id)}
                                className={`mt-0.5 transition-colors ${item.isCompleted ? variants.checkbox : `text-slate-600 ${variants.hoverIcon}`}`}
                            >
                                {item.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                            </button>
                            <div className="flex-1">
                                <p className={`text-sm leading-relaxed ${item.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                    {item.title}
                                </p>
                            </div>
                            <button onClick={() => removeItem(item.id)} className="text-slate-600 hover:text-red-400">
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}

                {/* Inline Add Divider */}
                {isAddingDivider && (
                    <div className="flex items-center gap-4 py-4 animate-in fade-in slide-in-from-left-4">
                        <div className={`h-px ${variants.bgLight} flex-1`}></div>
                        <input
                            autoFocus
                            value={newDividerTitle}
                            onChange={e => setNewDividerTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddDivider()}
                            onBlur={() => setIsAddingDivider(false)}
                            placeholder="Nome da Seção..."
                            className={`bg-slate-900 border ${variants.borderLight} rounded px-2 py-1 text-xs font-bold uppercase tracking-widest ${variants.text} outline-none w-40 text-center`}
                        />
                        <div className={`h-px ${variants.bgLight} flex-1`}></div>
                    </div>
                )}

                {/* Inline Add Task */}
                {isAddingTask ? (
                    <div className={`flex items-center gap-2 p-4 bg-slate-900/50 border ${variants.borderLight} rounded-xl animate-in fade-in slide-in-from-bottom-2`}>
                        <Circle size={20} className={`${variants.text} opacity-50`} />
                        <input
                            autoFocus
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                            onBlur={() => setIsAddingTask(false)}
                            placeholder="Descreva a nova tarefa..."
                            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                        />
                        <button onClick={handleAddTask} className={`${variants.icon} hover:opacity-80`}><CheckCircle2 size={18} /></button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAddingTask(true)}
                        className={`w-full py-3 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 ${variants.hoverBorderLight} ${variants.hoverText} hover:bg-slate-900/50 transition-all flex items-center justify-center gap-2 text-sm font-medium group`}
                    >
                        <Plus size={16} className="group-hover:scale-110 transition-transform" /> Adicionar Tarefa
                    </button>
                )}
            </div>

            {/* Modals */}
            {isAIModalOpen && (
                <AIRoadmapModal
                    skillName={skillName}
                    level={skillLevel}
                    onClose={() => setIsAIModalOpen(false)}
                    onGenerate={handleAIRoadmap}
                />
            )}

            {isImportExportOpen && (
                <ImportExportModal
                    skill={{ roadmap, name: skillName } as any}
                    onClose={() => setIsImportExportOpen(false)}
                    onImport={(newRoadmap) => onUpdate(newRoadmap)}
                />
            )}
        </div>
    );
};
