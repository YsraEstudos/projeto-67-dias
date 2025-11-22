import React, { useState } from 'react';
import {
    Clock, Plus, Link as LinkIcon, Trash2, Bot, Sparkles, X, CheckCircle2, Circle,
    Youtube, FileText, ArrowLeft, Layers, Download
} from 'lucide-react';
import { Skill, SkillResource, SkillRoadmapItem } from '../../types';
import { ImportExportModal } from './ImportExportModal';
import { AIRoadmapModal } from './AIRoadmapModal';

interface SkillDetailViewProps {
    skill: Skill;
    onBack: () => void;
    onUpdate: (u: Partial<Skill>) => void;
    onDelete: () => void;
}

export const SkillDetailView: React.FC<SkillDetailViewProps> = ({ skill, onBack, onUpdate, onDelete }) => {
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isImportExportOpen, setIsImportExportOpen] = useState(false);
    const [newResourceUrl, setNewResourceUrl] = useState('');

    // Manual Add State
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAddingDivider, setIsAddingDivider] = useState(false);
    const [newDividerTitle, setNewDividerTitle] = useState('');

    // Drag and Drop State
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

    const percentage = Math.min(100, Math.round((skill.currentMinutes / (skill.goalMinutes || 1)) * 100));
    const remainingHours = Math.max(0, (skill.goalMinutes - skill.currentMinutes) / 60);

    // Roadmap Stats
    const roadmapTasks = skill.roadmap.filter(i => i.type !== 'SECTION');
    const completedTasks = roadmapTasks.filter(i => i.isCompleted).length;
    const totalTasks = roadmapTasks.length;
    const roadmapProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Resource Handling
    const addResource = () => {
        if (!newResourceUrl) return;
        const newResource: SkillResource = {
            id: Date.now().toString(),
            title: newResourceUrl.replace(/^https?:\/\//, '').split('/')[0], // Simple domain extraction
            url: newResourceUrl,
            type: newResourceUrl.includes('youtube') ? 'VIDEO' : 'OTHER'
        };
        onUpdate({ resources: [...skill.resources, newResource] });
        setNewResourceUrl('');
    };

    const removeResource = (rId: string) => {
        onUpdate({ resources: skill.resources.filter(r => r.id !== rId) });
    };

    // Roadmap Handling
    const toggleRoadmapItem = (itemId: string) => {
        onUpdate({
            roadmap: skill.roadmap.map(i => i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i)
        });
    };

    const handleAIRoadmap = (items: string[]) => {
        const newItems: SkillRoadmapItem[] = items.map((t, i) => ({
            id: Date.now().toString() + i,
            title: t,
            isCompleted: false,
            type: 'TASK'
        }));
        onUpdate({ roadmap: [...skill.roadmap, ...newItems] });
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
        onUpdate({ roadmap: [...skill.roadmap, newTask] });
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
        onUpdate({ roadmap: [...skill.roadmap, newSection] });
        setNewDividerTitle('');
        setIsAddingDivider(false);
    };

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedItemId(id);
        e.dataTransfer.effectAllowed = 'move';
        // Create a ghost image if needed, or let browser handle it
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedItemId || draggedItemId === targetId) return;

        const sourceIndex = skill.roadmap.findIndex(i => i.id === draggedItemId);
        const targetIndex = skill.roadmap.findIndex(i => i.id === targetId);

        if (sourceIndex === -1 || targetIndex === -1) return;

        // Reorder
        const newRoadmap = [...skill.roadmap];
        const [removed] = newRoadmap.splice(sourceIndex, 1);
        newRoadmap.splice(targetIndex, 0, removed);

        onUpdate({ roadmap: newRoadmap });
    };

    const handleDragEnd = () => {
        setDraggedItemId(null);
    };

    return (
        <div className="animate-in slide-in-from-right-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-white">{skill.name}</h2>
                    <p className="text-slate-400 flex items-center gap-2 text-sm">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">{skill.level}</span>
                        • Criado em {new Date(skill.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                </div>
                <div className="ml-auto">
                    <button onClick={onDelete} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN: Stats & Log */}
                <div className="space-y-6">
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-700">
                            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${percentage}%` }}></div>
                        </div>

                        <div className="text-center py-4">
                            <div className="text-5xl font-bold text-white font-mono">{(skill.currentMinutes / 60).toFixed(1)}<span className="text-xl text-slate-500">h</span></div>
                            <div className="text-sm text-slate-400 mt-1">de {(skill.goalMinutes / 60)}h meta (Tempo)</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="bg-slate-900 p-3 rounded-xl text-center">
                                <div className="text-xs text-slate-500 uppercase">Restam</div>
                                <div className="text-lg font-bold text-emerald-400">{remainingHours.toFixed(1)}h</div>
                            </div>
                            <div className="bg-slate-900 p-3 rounded-xl text-center">
                                <div className="text-xs text-slate-500 uppercase">Sessões</div>
                                <div className="text-lg font-bold text-blue-400">{skill.logs.length}</div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                const mins = prompt("Adicionar quantos minutos?", "60");
                                if (mins) {
                                    const m = parseInt(mins);
                                    onUpdate({
                                        currentMinutes: skill.currentMinutes + m,
                                        logs: [...skill.logs, { id: Date.now().toString(), date: new Date().toISOString(), minutes: m }]
                                    });
                                }
                            }}
                            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/20"
                        >
                            <Clock size={18} /> Registrar Estudo
                        </button>
                    </div>

                    {/* Resources Vault */}
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <LinkIcon size={18} className="text-blue-400" /> Cofre de Recursos
                        </h3>

                        <div className="flex gap-2 mb-4">
                            <input
                                value={newResourceUrl}
                                onChange={e => setNewResourceUrl(e.target.value)}
                                placeholder="Cole um link aqui..."
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                            />
                            <button onClick={addResource} className="bg-slate-700 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors">
                                <Plus size={18} />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                            {skill.resources.map(res => (
                                <div key={res.id} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-600 group">
                                    <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                                        {res.type === 'VIDEO' ? <Youtube size={16} /> : <FileText size={16} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <a href={res.url} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline truncate block font-medium">
                                            {res.title || res.url}
                                        </a>
                                    </div>
                                    <button onClick={() => removeResource(res.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-opacity">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {skill.resources.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Nenhum link salvo.</p>}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Roadmap */}
                <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col min-h-[500px]">
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
                                className="text-xs bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 px-3 py-1.5 rounded-lg border border-emerald-600/20 flex items-center gap-1 transition-colors"
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

                    {/* Roadmap Progress Bar */}
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

                    <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin">
                        {skill.roadmap.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60 min-h-[200px]">
                                <Sparkles size={48} className="mb-4" />
                                <p>Gere um plano de estudos com IA para começar.</p>
                            </div>
                        )}

                        {skill.roadmap.map((item, index) => {
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
                                                onClick={() => onUpdate({ roadmap: skill.roadmap.filter(r => r.id !== item.id) })}
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
                                        : 'bg-slate-900/80 border-slate-700 hover:border-emerald-500/30'
                                        } ${draggedItemId === item.id ? 'opacity-50 border-dashed border-slate-500' : ''}`}
                                >
                                    <button
                                        onClick={() => toggleRoadmapItem(item.id)}
                                        className={`mt-0.5 transition-colors ${item.isCompleted ? 'text-emerald-500' : 'text-slate-600 hover:text-emerald-400'}`}
                                    >
                                        {item.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                    </button>
                                    <div className="flex-1">
                                        <p className={`text-sm leading-relaxed ${item.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                            {item.title}
                                        </p>
                                    </div>
                                    <button onClick={() => onUpdate({ roadmap: skill.roadmap.filter(r => r.id !== item.id) })} className="text-slate-600 hover:text-red-400">
                                        <X size={14} />
                                    </button>
                                </div>
                            );
                        })}

                        {/* Inline Add Divider */}
                        {isAddingDivider && (
                            <div className="flex items-center gap-4 py-4 animate-in fade-in slide-in-from-left-4">
                                <div className="h-px bg-emerald-500/50 flex-1"></div>
                                <input
                                    autoFocus
                                    value={newDividerTitle}
                                    onChange={e => setNewDividerTitle(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddDivider()}
                                    onBlur={() => setIsAddingDivider(false)}
                                    placeholder="Nome da Seção..."
                                    className="bg-slate-900 border border-emerald-500/50 rounded px-2 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400 outline-none w-40 text-center"
                                />
                                <div className="h-px bg-emerald-500/50 flex-1"></div>
                            </div>
                        )}

                        {/* Inline Add Task */}
                        {isAddingTask ? (
                            <div className="flex items-center gap-2 p-4 bg-slate-900/50 border border-emerald-500/50 rounded-xl animate-in fade-in slide-in-from-bottom-2">
                                <Circle size={20} className="text-emerald-500/50" />
                                <input
                                    autoFocus
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                                    onBlur={() => setIsAddingTask(false)}
                                    placeholder="Descreva a nova tarefa..."
                                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                                />
                                <button onClick={handleAddTask} className="text-emerald-400 hover:text-emerald-300"><CheckCircle2 size={18} /></button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAddingTask(true)}
                                className="w-full py-3 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-slate-900/50 transition-all flex items-center justify-center gap-2 text-sm font-medium group"
                            >
                                <Plus size={16} className="group-hover:scale-110 transition-transform" /> Adicionar Tarefa
                            </button>
                        )}

                    </div>
                </div>
            </div>

            {isAIModalOpen && (
                <AIRoadmapModal
                    skillName={skill.name}
                    level={skill.level}
                    onClose={() => setIsAIModalOpen(false)}
                    onGenerate={handleAIRoadmap}
                />
            )}

            {isImportExportOpen && (
                <ImportExportModal
                    skill={skill}
                    onClose={() => setIsImportExportOpen(false)}
                    onImport={(roadmap) => onUpdate({ roadmap })}
                />
            )}
        </div>
    );
};
