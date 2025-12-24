import React, { useState, Suspense, useMemo } from 'react';
import {
    Bot, Plus, X, CheckCircle2, Circle,
    Layers, Download, Maximize2, ListTodo, Map, Loader2, Lock
} from 'lucide-react';
import { SkillRoadmapItem, VisualRoadmap, RoadmapViewMode } from '../../types';
import { VisualRoadmapView } from './VisualRoadmapView';
import { THEME_VARIANTS, ThemeKey } from './constants';
import { SectionContextMenu } from './SectionContextMenu';

// Lazy load heavy modals (~72KB combined) - loaded only when opened
const ImportExportModal = React.lazy(() => import('./ImportExportModal').then(m => ({ default: m.ImportExportModal })));

const FullRoadmapEditor = React.lazy(() => import('./FullRoadmapEditor').then(m => ({ default: m.FullRoadmapEditor })));
const VisualRoadmapEditor = React.lazy(() => import('./VisualRoadmapEditor').then(m => ({ default: m.VisualRoadmapEditor })));

interface RoadmapSectionProps {
    roadmap: SkillRoadmapItem[];
    visualRoadmap?: VisualRoadmap;
    skillName: string;
    skillLevel: string;
    skillColorTheme: string;
    viewMode?: RoadmapViewMode;
    onUpdate: (roadmap: SkillRoadmapItem[]) => void;
    onUpdateVisual?: (visualRoadmap: VisualRoadmap) => void;
    onViewModeChange?: (mode: RoadmapViewMode) => void;
    // Anti-Anxiety: Section visibility
    unlockedSections?: string[];
    onUnlockSection?: (sectionId: string) => void;
    onLockSection?: (sectionId: string) => void;
}

/**
 * Roadmap section component with dual modes:
 * - Tasks: Traditional checklist-style roadmap with sections
 * - Visual: Node-based visual roadmap similar to roadmap.sh
 */
export const RoadmapSection: React.FC<RoadmapSectionProps> = ({
    roadmap,
    visualRoadmap,
    skillName,
    skillLevel,
    skillColorTheme,
    viewMode = 'tasks',
    onUpdate,
    onUpdateVisual,
    onViewModeChange,
    unlockedSections = [],
    onUnlockSection,
    onLockSection
}) => {

    const [isFullEditorOpen, setIsFullEditorOpen] = useState(false);
    const [isVisualEditorOpen, setIsVisualEditorOpen] = useState(false);
    const [isImportExportOpen, setIsImportExportOpen] = useState(false);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAddingDivider, setIsAddingDivider] = useState(false);
    const [newDividerTitle, setNewDividerTitle] = useState('');
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

    // Context menu state for section lock/unlock
    const [contextMenu, setContextMenu] = useState<{
        position: { x: number; y: number };
        sectionId: string;
        sectionTitle: string;
        isUnlocked: boolean;
    } | null>(null);

    const theme = (skillColorTheme as ThemeKey) || 'emerald';
    const variants = THEME_VARIANTS[theme];

    // Current mode
    const currentMode = viewMode || 'tasks';

    // Calculate which section each item belongs to (for visibility logic)
    // Returns an object: itemId -> { sectionId, sectionIndex }
    const itemSectionMap = useMemo(() => {
        const map: Record<string, { sectionId: string | null; sectionIndex: number }> = {};
        let currentSectionId: string | null = null;
        let sectionIndex = 0;

        for (const item of roadmap) {
            if (item.type === 'SECTION') {
                // First section before any SECTION divider is index 0
                if (currentSectionId !== null || sectionIndex === 0) {
                    sectionIndex++;
                }
                currentSectionId = item.id;
            }
            map[item.id] = { sectionId: currentSectionId, sectionIndex };
        }
        return map;
    }, [roadmap]);

    // Check if a section is visible (first section always visible, others need to be unlocked)
    const isSectionVisible = (sectionId: string | null, sectionIndex: number): boolean => {
        // First section (index 0 or 1 depending on if first item is SECTION) is always visible
        if (sectionIndex <= 1) return true;
        // If no sectionId, item is visible
        if (!sectionId) return true;
        // Check if section is unlocked
        return unlockedSections.includes(sectionId);
    };

    // Flatten all tasks including subtasks for progress calculation
    const flattenTasks = (items: SkillRoadmapItem[]): SkillRoadmapItem[] => {
        return items.reduce<SkillRoadmapItem[]>((acc, item) => {
            if (item.type === 'SECTION') return acc;
            const subs = item.subTasks ? flattenTasks(item.subTasks) : [];
            return [...acc, item, ...subs];
        }, []);
    };

    // Roadmap Stats (for Tasks mode) - includes subtasks
    const allTasks = flattenTasks(roadmap);
    const completedTasks = allTasks.filter(i => i.isCompleted).length;
    const totalTasks = allTasks.length;
    const roadmapProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Item Handlers
    const toggleRoadmapItem = (itemId: string) => {
        onUpdate(roadmap.map(i => i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i));
    };

    // Subtask toggle with auto-complete parent logic
    const toggleSubTask = (parentId: string, subTaskId: string) => {
        onUpdate(roadmap.map(item => {
            if (item.id !== parentId || !item.subTasks) return item;
            const updatedSubs = item.subTasks.map(sub =>
                sub.id === subTaskId ? { ...sub, isCompleted: !sub.isCompleted } : sub
            );
            const allSubsComplete = updatedSubs.every(s => s.isCompleted);
            return { ...item, subTasks: updatedSubs, isCompleted: allSubsComplete };
        }));
    };

    const removeItem = (itemId: string) => {
        onUpdate(roadmap.filter(r => r.id !== itemId));
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

    // Visual roadmap handlers
    const handleToggleVisualNode = (nodeId: string) => {
        if (!visualRoadmap || !onUpdateVisual) return;
        const updatedNodes = visualRoadmap.nodes.map(n =>
            n.id === nodeId ? { ...n, isCompleted: !n.isCompleted } : n
        );
        onUpdateVisual({ ...visualRoadmap, nodes: updatedNodes });
    };

    const handleSaveVisualRoadmap = (newVisualRoadmap: VisualRoadmap) => {
        if (onUpdateVisual) {
            onUpdateVisual(newVisualRoadmap);
        }
        setIsVisualEditorOpen(false);
    };

    return (
        <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col min-h-[500px]">
            {/* Header with Mode Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Bot size={18} className="text-purple-400" /> Roadmap Inteligente
                    </h3>

                    {/* Mode Toggle */}
                    <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                        <button
                            onClick={() => onViewModeChange?.('tasks')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${currentMode === 'tasks'
                                ? `${variants.bg} text-white`
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <ListTodo size={14} /> Tarefas
                        </button>
                        <button
                            onClick={() => onViewModeChange?.('visual')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${currentMode === 'visual'
                                ? `${variants.bg} text-white`
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Map size={14} /> Roadmap
                        </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportExportOpen(true)}
                        className="text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 px-3 py-1.5 rounded-lg border border-slate-600 flex items-center gap-1 transition-colors"
                        title="Importar / Exportar"
                    >
                        <Download size={12} /> Importar / Exportar
                    </button>
                    {currentMode === 'tasks' ? (
                        <>
                            <button
                                onClick={() => setIsFullEditorOpen(true)}
                                className="text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 px-3 py-1.5 rounded-lg border border-slate-600 flex items-center gap-1 transition-colors"
                                title="Abrir Editor Completo"
                            >
                                <Maximize2 size={12} /> Editor
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

                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsVisualEditorOpen(true)}
                                className={`text-xs ${variants.bgLight} ${variants.text} ${variants.bgHover} px-3 py-1.5 rounded-lg border ${variants.borderLight} flex items-center gap-1 transition-colors`}
                            >
                                <Maximize2 size={12} /> Abrir Editor Visual
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content based on mode */}
            {currentMode === 'tasks' ? (
                <>
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
                                <ListTodo size={48} className="mb-4" />
                                <p>Adicione tarefas para montar seu plano de estudos.</p>
                            </div>
                        )}

                        {roadmap.map((item) => {
                            const sectionInfo = itemSectionMap[item.id];
                            const isVisible = sectionInfo ? isSectionVisible(sectionInfo.sectionId, sectionInfo.sectionIndex) : true;

                            if (item.type === 'SECTION') {
                                const isUnlocked = unlockedSections.includes(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        draggable={isVisible}
                                        onDragStart={(e) => isVisible && handleDragStart(e, item.id)}
                                        onDragOver={(e) => handleDragOver(e, item.id)}
                                        onDragEnd={handleDragEnd}
                                        onContextMenu={(e) => {
                                            if (sectionInfo && sectionInfo.sectionIndex > 1) {
                                                e.preventDefault();
                                                setContextMenu({
                                                    position: { x: e.clientX, y: e.clientY },
                                                    sectionId: item.id,
                                                    sectionTitle: item.title,
                                                    isUnlocked
                                                });
                                            }
                                        }}
                                        className={`flex items-center gap-4 py-4 group ${isVisible ? 'cursor-move' : 'cursor-pointer'} ${draggedItemId === item.id ? 'opacity-50' : ''}`}
                                    >
                                        <div className={`h-px flex-1 ${isVisible ? 'bg-slate-700' : 'bg-slate-800'}`}></div>
                                        <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isVisible ? 'text-slate-400' : 'text-slate-600'}`}>
                                            {!isVisible && <Lock size={12} className="text-amber-500/70" />}
                                            {item.title}
                                        </span>
                                        <div className={`h-px flex-1 relative ${isVisible ? 'bg-slate-700' : 'bg-slate-800'}`}>
                                            {isVisible && (
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="absolute right-0 -top-2.5 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 p-1 bg-slate-800 rounded-full"
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            // For TASK items - apply blur if section is locked
                            if (!isVisible) {
                                return (
                                    <div
                                        key={item.id}
                                        className="group/item opacity-40 blur-[2px] select-none pointer-events-none"
                                    >
                                        <div className="flex items-start gap-3 p-4 rounded-xl border bg-slate-900/50 border-slate-800">
                                            <Circle size={20} className="text-slate-700 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm text-slate-600">Conteúdo bloqueado</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={item.id} className="group/item">
                                    <div
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
                                        <button onClick={() => removeItem(item.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <X size={14} />
                                        </button>
                                    </div>

                                    {/* Render Subtasks if any - clickable with auto-complete */}
                                    {item.subTasks && item.subTasks.length > 0 && (
                                        <div className="ml-8 pl-4 border-l border-slate-700 mt-2 space-y-1">
                                            {item.subTasks.map((subTask) => (
                                                <div
                                                    key={subTask.id}
                                                    className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer rounded-lg transition-all
                                                        ${subTask.isCompleted
                                                            ? 'opacity-50 bg-slate-900/30'
                                                            : 'hover:bg-slate-800/50'}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSubTask(item.id, subTask.id);
                                                    }}
                                                >
                                                    <button
                                                        className={`transition-colors flex-shrink-0 ${subTask.isCompleted
                                                            ? variants.checkbox
                                                            : `text-slate-600 ${variants.hoverIcon}`}`}
                                                    >
                                                        {subTask.isCompleted
                                                            ? <CheckCircle2 size={14} />
                                                            : <Circle size={14} />}
                                                    </button>
                                                    <p className={`text-xs flex-1 ${subTask.isCompleted
                                                        ? 'line-through text-slate-500'
                                                        : 'text-slate-300'}`}>
                                                        {typeof subTask === 'string' ? subTask : subTask.title}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
                </>
            ) : (
                /* Visual Mode */
                <VisualRoadmapView
                    visualRoadmap={visualRoadmap}
                    theme={theme}
                    onOpenEditor={() => setIsVisualEditorOpen(true)}
                    onToggleComplete={handleToggleVisualNode}
                />
            )}

            {/* Modals - Lazy loaded for performance */}
            <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-400" size={32} /></div>}>

                {isImportExportOpen && (
                    <ImportExportModal
                        skill={{ roadmap, name: skillName } as any}
                        onClose={() => setIsImportExportOpen(false)}
                        onImport={(newRoadmap) => onUpdate(newRoadmap)}
                    />
                )}

                {isFullEditorOpen && (
                    <FullRoadmapEditor
                        skillName={skillName}
                        roadmap={roadmap}
                        theme={theme}
                        onClose={() => setIsFullEditorOpen(false)}
                        onSave={(newRoadmap) => {
                            onUpdate(newRoadmap);
                            setIsFullEditorOpen(false);
                        }}
                    />
                )}

                {isVisualEditorOpen && (
                    <VisualRoadmapEditor
                        skillName={skillName}
                        visualRoadmap={visualRoadmap || { nodes: [], connections: [] }}
                        theme={theme}
                        onClose={() => setIsVisualEditorOpen(false)}
                        onSave={handleSaveVisualRoadmap}
                    />
                )}
            </Suspense>

            {/* Section Context Menu for lock/unlock */}
            {contextMenu && (
                <SectionContextMenu
                    position={contextMenu.position}
                    sectionTitle={contextMenu.sectionTitle}
                    isUnlocked={contextMenu.isUnlocked}
                    onUnlock={() => onUnlockSection?.(contextMenu.sectionId)}
                    onLock={() => onLockSection?.(contextMenu.sectionId)}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
};
