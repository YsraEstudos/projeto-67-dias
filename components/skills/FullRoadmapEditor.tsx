import React, { useState } from 'react';
import {
    ArrowLeft,
    Save,
    Download,
    Plus,
    Trash2,
    GripVertical,
    CheckCircle2,
    Circle,
    FileText,
    Layers,
    X,
    FileDown
} from 'lucide-react';
import { SkillRoadmapItem } from '../../types';
import { THEME_VARIANTS, ThemeKey } from './constants';

interface FullRoadmapEditorProps {
    skillName: string;
    roadmap: SkillRoadmapItem[];
    theme: ThemeKey;
    onClose: () => void;
    onSave: (newRoadmap: SkillRoadmapItem[]) => void;
}

export const FullRoadmapEditor: React.FC<FullRoadmapEditorProps> = ({
    skillName,
    roadmap,
    theme,
    onClose,
    onSave
}) => {
    // Local state for editing to prevent constant parent updates
    const [items, setItems] = useState<SkillRoadmapItem[]>(JSON.parse(JSON.stringify(roadmap)));
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(roadmap.map(i => i.id)));
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    // Drag and Drop state
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

    const variants = THEME_VARIANTS[theme] || THEME_VARIANTS.emerald;

    // --- Actions ---

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleComplete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setItems(prev => prev.map(item => {
            if (item.id === id) return { ...item, isCompleted: !item.isCompleted };
            // Also check subtasks if we go deeper later
            return item;
        }));
    };

    const updateItemTitle = (id: string, newTitle: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, title: newTitle } : item
        ));
    };

    const updateSubTaskTitle = (parentId: string, subTaskId: string, newTitle: string) => {
        setItems(prev => prev.map(item => {
            if (item.id !== parentId || !item.subTasks) return item;
            return {
                ...item,
                subTasks: item.subTasks.map(sub =>
                    sub.id === subTaskId ? { ...sub, title: newTitle } : sub
                )
            };
        }));
    };

    const deleteSubTask = (parentId: string, subTaskId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setItems(prev => prev.map(item => {
            if (item.id !== parentId || !item.subTasks) return item;
            return {
                ...item,
                subTasks: item.subTasks.filter(sub => sub.id !== subTaskId)
            };
        }));
    };

    const deleteItem = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja excluir este item?')) {
            setItems(prev => prev.filter(item => item.id !== id));
            if (selectedItemId === id) setSelectedItemId(null);
        }
    };

    const addNewItem = (type: 'TASK' | 'SECTION' = 'TASK') => {
        const newItem: SkillRoadmapItem = {
            id: Date.now().toString(),
            title: type === 'SECTION' ? 'NOVA SEÇÃO' : 'Nova Tarefa',
            isCompleted: false,
            type,
            subTasks: []
        };
        setItems(prev => [...prev, newItem]);
        setSelectedItemId(newItem.id);
    };

    const addSubTask = (parentId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setItems(prev => prev.map(item => {
            if (item.id === parentId) {
                const newSub = {
                    id: Date.now().toString(),
                    title: 'Nova Sub-tarefa',
                    isCompleted: false,
                    type: 'TASK' as const
                };
                // Ensure subTasks array exists
                const currentSubs = item.subTasks || [];
                return { ...item, subTasks: [...currentSubs, newSub] };
            }
            return item;
        }));
        // Auto expand parent
        setExpandedIds(prev => new Set(prev).add(parentId));
    };

    // --- Drag & Drop Handlers ---
    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedItemId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedItemId || draggedItemId === targetId) return;

        const sourceIndex = items.findIndex(i => i.id === draggedItemId);
        const targetIndex = items.findIndex(i => i.id === targetId);

        if (sourceIndex === -1 || targetIndex === -1) return;

        const newItems = [...items];
        const [removed] = newItems.splice(sourceIndex, 1);
        newItems.splice(targetIndex, 0, removed);

        setItems(newItems);
    };

    const handleDragEnd = () => {
        setDraggedItemId(null);
    };

    // --- PDF Export ---
    const handlePrint = () => {
        window.print();
    };

    // --- Markdown Export ---
    const generateMarkdown = (itemsList: SkillRoadmapItem[]): string => {
        let md = `# ${skillName} - Plano de Estudos\n\n`;
        md += `> Gerado via Projeto 67 Dias\n\n`;

        for (const item of itemsList) {
            if (item.type === 'SECTION') {
                md += `\n## ${item.title}\n\n`;
            } else {
                const check = item.isCompleted ? 'x' : ' ';
                md += `- [${check}] ${item.title}\n`;
                if (item.subTasks && item.subTasks.length > 0) {
                    for (const sub of item.subTasks) {
                        const subCheck = sub.isCompleted ? 'x' : ' ';
                        const subTitle = typeof sub === 'string' ? sub : sub.title;
                        md += `  - [${subCheck}] ${subTitle}\n`;
                    }
                }
            }
        }
        return md;
    };

    const handleExportMarkdown = () => {
        const markdown = generateMarkdown(items);
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${skillName.replace(/\s+/g, '_')}_roadmap.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in fade-in duration-300">
            {/* Header / Toolbar */}
            <div className={`h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 shadow-md`}>
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <FileText size={18} className={variants.text} />
                            Editor de Roadmap
                        </h2>
                        <p className="text-xs text-slate-500">Editando: <span className="text-slate-300">{skillName}</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportMarkdown}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700"
                        title="Baixar como Markdown"
                    >
                        <FileDown size={16} /> Markdown
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700"
                        title="Exportar como PDF"
                    >
                        <Download size={16} /> PDF
                    </button>

                    <div className="h-6 w-px bg-slate-800 mx-2" />

                    <button
                        onClick={() => onSave(items)}
                        className={`flex items-center gap-2 px-6 py-2 ${variants.bg} hover:${variants.bgHover} text-white rounded-lg text-sm font-bold shadow-lg transition-transform active:scale-95`}
                    >
                        <Save size={18} /> Salvar Alterações
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Visual Editor (Tree View) */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-950 scrollbar-thin print:bg-white print:text-black print:overflow-visible">
                    <div className="max-w-4xl mx-auto space-y-2 print:space-y-4">

                        {/* Print Header */}
                        <div className="hidden print:block mb-8 border-b pb-4">
                            <h1 className="text-3xl font-bold mb-2">{skillName} - Plano de Estudos</h1>
                            <p className="text-gray-500">Gerado via Projeto 67 Dias</p>
                        </div>

                        {items.length === 0 && (
                            <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                                <p>Nenhum item no roadmap.</p>
                                <button onClick={() => addNewItem('SECTION')} className={`mt-4 ${variants.text} hover:underline`}>
                                    Adicionar Primeira Seção
                                </button>
                            </div>
                        )}

                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                className={`group animate-in slide-in-from-bottom-2 duration-300 delay-75 ${draggedItemId === item.id ? 'opacity-50' : ''}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, item.id)}
                                onDragOver={(e) => handleDragOver(e, item.id)}
                                onDragEnd={handleDragEnd}
                            >
                                {/* SECTION RENDER */}
                                {item.type === 'SECTION' ? (
                                    <div className="mt-8 mb-4 print:mt-6 print:mb-2 print:break-inside-avoid">
                                        <div className="flex items-center gap-4 group/section">
                                            <div className="cursor-move p-1 text-slate-600 hover:text-slate-400 print:hidden">
                                                <GripVertical size={16} />
                                            </div>
                                            <input
                                                value={item.title}
                                                onChange={(e) => updateItemTitle(item.id, e.target.value)}
                                                className="bg-transparent text-xl font-bold text-emerald-500 uppercase tracking-widest outline-none border-b border-transparent focus:border-emerald-500/50 transition-all placeholder:text-slate-700 w-full print:text-black"
                                                placeholder="NOME DA SEÇÃO"
                                            />
                                            <button
                                                onClick={(e) => deleteItem(item.id, e)}
                                                className="opacity-0 group-hover/section:opacity-100 p-2 text-slate-600 hover:text-red-400 print:hidden transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="h-0.5 bg-gradient-to-r from-emerald-900 to-transparent mt-1 print:bg-slate-300" />
                                    </div>
                                ) : (
                                    // TASK RENDER
                                    <div
                                        className={`
                                            relative flex flex-col bg-slate-900/40 border border-slate-800 rounded-lg hover:border-slate-700 transition-all cursor-move
                                            ${selectedItemId === item.id ? 'ring-1 ring-emerald-500/50 bg-slate-900/80 shadow-lg' : ''}
                                            print:border-none print:bg-transparent print:shadow-none print:mb-2 print:break-inside-avoid
                                        `}
                                        onClick={() => setSelectedItemId(item.id)}
                                    >
                                        {/* Main Task Row */}
                                        <div className="flex items-center gap-3 p-3">
                                            <div className="text-slate-700 hover:text-slate-500 print:hidden">
                                                <GripVertical size={16} />
                                            </div>

                                            <button
                                                onClick={(e) => toggleComplete(item.id, e)}
                                                className={`transition-colors ${item.isCompleted ? 'text-emerald-500' : 'text-slate-600 hover:text-emerald-400'} print:text-black`}
                                            >
                                                {item.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                            </button>

                                            <div className="flex-1">
                                                <input
                                                    value={item.title}
                                                    onChange={(e) => updateItemTitle(item.id, e.target.value)}
                                                    className={`
                                                        bg-transparent w-full outline-none text-sm font-medium transition-all
                                                        ${item.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}
                                                        print:text-black
                                                    `}
                                                />
                                            </div>

                                            <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity print:hidden">
                                                <button
                                                    onClick={(e) => addSubTask(item.id, e)}
                                                    className="p-1.5 text-slate-500 hover:text-emerald-400 rounded hover:bg-slate-800"
                                                    title="Adicionar Sub-tarefa"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => deleteItem(item.id, e)}
                                                    className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Subtasks Container */}
                                        {item.subTasks && item.subTasks.length > 0 && (
                                            <div className="pl-10 pr-3 pb-3 space-y-1 print:pl-8">
                                                {item.subTasks.map((sub) => {
                                                    const subTitle = typeof sub === 'string' ? sub : sub.title;
                                                    const subId = typeof sub === 'string' ? sub : sub.id;
                                                    return (
                                                        <div key={subId} className="flex items-center gap-2 group/sub">
                                                            <div className="w-1.5 h-1.5 bg-slate-700 rounded-full print:bg-slate-400" />
                                                            <input
                                                                value={subTitle}
                                                                onChange={(e) => updateSubTaskTitle(item.id, subId, e.target.value)}
                                                                className="flex-1 bg-transparent border-none outline-none text-xs text-slate-400 focus:text-slate-200 print:text-black"
                                                            />
                                                            <button
                                                                onClick={(e) => deleteSubTask(item.id, subId, e)}
                                                                className="opacity-0 group-hover/sub:opacity-100 text-slate-600 hover:text-red-400 scale-75 print:hidden"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Quick Add at Bottom */}
                        <div className="mt-8 flex gap-4 justify-center print:hidden">
                            <button
                                onClick={() => addNewItem('SECTION')}
                                className="px-4 py-3 bg-slate-900 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-2 text-sm font-bold"
                            >
                                <Layers size={16} /> Nova Seção
                            </button>
                            <button
                                onClick={() => addNewItem('TASK')}
                                className="px-6 py-3 bg-emerald-600/10 border border-emerald-600/30 hover:bg-emerald-600/20 rounded-xl text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-2 text-sm font-bold shadow-lg shadow-emerald-900/20"
                            >
                                <Plus size={16} /> Nova Tarefa
                            </button>
                        </div>

                        <div className="h-20" /> {/* Spacer */}
                    </div>
                </div>
            </div>

            {/* Global Print Styles */}
            <style>{`
                @media print {
                    @page { 
                        margin: 2cm;
                        size: A4;
                    }
                    body { 
                        background: white !important; 
                        color: black !important;
                        font-size: 12pt;
                    }
                    .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                    .print\\:text-black { color: black !important; }
                    .print\\:bg-white { background: white !important; }
                    .print\\:break-inside-avoid { 
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    .print\\:overflow-visible {
                        overflow: visible !important;
                        max-height: none !important;
                    }
                    /* Ensure all content is visible */
                    .overflow-y-auto {
                        overflow: visible !important;
                    }
                    .scrollbar-thin {
                        overflow: visible !important;
                    }
                }
            `}</style>
        </div>
    );
};
