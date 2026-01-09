import React, { useState, useMemo, useCallback } from 'react';
import {
    Target, Plus, Check, X, Trash2, Edit2, ExternalLink, Link2,
    ChevronDown, ChevronRight, Trophy, AlertCircle, RotateCcw, Ban
} from 'lucide-react';
import { useGoalsStore } from '../../stores/goalsStore';
import { useLinks } from '../../stores/linksStore';
import { useSites } from '../../stores/sitesStore';
import { YearlyGoal, GoalPriority, GoalStatus, GoalLink } from '../../types';

// --- CONSTANTS ---
const PRIORITY_CONFIG: Record<GoalPriority, { label: string; color: string; bgColor: string }> = {
    HIGH: { label: 'Alta', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/30' },
    MEDIUM: { label: 'Média', color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/30' },
    LOW: { label: 'Baixa', color: 'text-slate-400', bgColor: 'bg-slate-500/10 border-slate-500/30' }
};

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string; icon: React.ReactNode }> = {
    ACTIVE: { label: 'Ativa', color: 'text-emerald-400', icon: <Target size={14} /> },
    ACHIEVED: { label: 'Alcançada', color: 'text-amber-400', icon: <Trophy size={14} /> },
    DROPPED: { label: 'Abandonada', color: 'text-slate-500', icon: <X size={14} /> }
};

// --- SUB-COMPONENTS ---

interface GoalCardProps {
    goal: YearlyGoal;
    onEdit: (goal: YearlyGoal) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: GoalStatus) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete, onStatusChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const links = useLinks();
    const sites = useSites();

    // Resolve internal links
    const resolvedLinks = useMemo(() => {
        return goal.links.map(gl => {
            if (gl.type === 'EXTERNAL') {
                return { ...gl, resolved: true, displayTitle: gl.title || gl.url };
            }
            const found = links.find(l => l.id === gl.linkId);
            if (found) {
                const site = sites.find(s => s.id === found.siteId);
                return {
                    ...gl,
                    resolved: true,
                    displayTitle: gl.title || found.title,
                    url: found.url,
                    siteName: site?.name
                };
            }
            return { ...gl, resolved: false, displayTitle: 'Link não encontrado' };
        });
    }, [goal.links, links, sites]);

    const statusConfig = STATUS_CONFIG[goal.status];
    const priorityConfig = PRIORITY_CONFIG[goal.priority];

    const handleLinkClick = (link: GoalLink & { url?: string; resolved: boolean }) => {
        if (link.resolved && link.url) {
            window.open(link.url, '_blank');
        }
    };

    return (
        <div className={`bg-slate-800/50 rounded-2xl border transition-all hover:shadow-lg group ${goal.status === 'ACHIEVED' ? 'border-amber-500/30' :
            goal.status === 'DROPPED' ? 'border-slate-700/50 opacity-60' :
                'border-slate-700 hover:border-purple-500/30'
            }`}>
            {/* Header */}
            <div className="p-4 flex items-start gap-3">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 text-slate-400 hover:text-white transition-colors mt-0.5"
                >
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold text-lg truncate ${goal.status === 'ACHIEVED' ? 'line-through text-slate-400' : 'text-slate-200'
                            }`}>
                            {goal.title}
                        </h3>
                        <span className={`flex items-center gap-1 text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                        </span>
                    </div>

                    {goal.description && (
                        <p className="text-sm text-slate-400 line-clamp-2 mb-2">{goal.description}</p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                        {goal.category && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-purple-500/10 text-purple-400 border-purple-500/20 uppercase tracking-wider">
                                {goal.category}
                            </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityConfig.bgColor} ${priorityConfig.color} uppercase tracking-wider`}>
                            {priorityConfig.label}
                        </span>
                        {goal.links.length > 0 && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Link2 size={10} /> {goal.links.length} link{goal.links.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions - visible on mobile, hover on desktop */}
                <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {goal.status === 'ACTIVE' && (
                        <>
                            <button
                                onClick={() => onStatusChange(goal.id, 'ACHIEVED')}
                                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                title="Marcar como alcançada"
                            >
                                <Check size={16} />
                            </button>
                            <button
                                onClick={() => onStatusChange(goal.id, 'DROPPED')}
                                className="p-2 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
                                title="Abandonar meta"
                            >
                                <Ban size={16} />
                            </button>
                        </>
                    )}
                    {(goal.status === 'DROPPED' || goal.status === 'ACHIEVED') && (
                        <button
                            onClick={() => onStatusChange(goal.id, 'ACTIVE')}
                            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Reativar meta"
                        >
                            <RotateCcw size={16} />
                        </button>
                    )}
                    <button
                        onClick={() => onEdit(goal)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Editar"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(goal.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Excluir"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Expanded Content - Links */}
            {isExpanded && goal.links.length > 0 && (
                <div className="px-4 pb-4 pt-0 border-t border-slate-700/50 mt-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-3 mb-2">
                        Ações Planejadas
                    </p>
                    <div className="space-y-2">
                        {resolvedLinks.map(link => (
                            <div
                                key={link.id}
                                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${link.resolved
                                    ? 'bg-slate-900/50 hover:bg-slate-900 cursor-pointer'
                                    : 'bg-red-500/5 border border-red-500/20'
                                    }`}
                                onClick={() => handleLinkClick(link as any)}
                            >
                                {link.resolved ? (
                                    <ExternalLink size={14} className="text-purple-400 shrink-0" />
                                ) : (
                                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm truncate ${link.resolved ? 'text-slate-200' : 'text-red-400'}`}>
                                        {link.displayTitle}
                                    </p>
                                    {link.description && (
                                        <p className="text-xs text-slate-500 truncate">→ {link.description}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Progress Bar (if set) */}
            {goal.progress !== undefined && goal.progress > 0 && (
                <div className="px-4 pb-3">
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                            style={{ width: `${Math.min(100, goal.progress)}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 text-right">{goal.progress}%</p>
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---

const GoalsTab: React.FC = () => {
    const { goals, addGoal, updateGoal, deleteGoal, setGoalStatus, isLoading } = useGoalsStore();

    // Current year as default filter
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedStatus, setSelectedStatus] = useState<GoalStatus | 'ALL'>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<YearlyGoal | null>(null);

    // Available years from goals + current
    const availableYears = useMemo(() => {
        const years = new Set(goals.map(g => g.year));
        years.add(currentYear);
        years.add(currentYear + 1);
        return Array.from(years).sort((a, b) => b - a);
    }, [goals, currentYear]);

    // Filtered goals
    const filteredGoals = useMemo(() => {
        return goals
            .filter(g => g.year === selectedYear)
            .filter(g => selectedStatus === 'ALL' || g.status === selectedStatus)
            .sort((a, b) => {
                // Active first, then by priority
                if (a.status !== b.status) {
                    if (a.status === 'ACTIVE') return -1;
                    if (b.status === 'ACTIVE') return 1;
                }
                const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
    }, [goals, selectedYear, selectedStatus]);

    // Stats
    const stats = useMemo(() => ({
        total: filteredGoals.length,
        active: filteredGoals.filter(g => g.status === 'ACTIVE').length,
        achieved: filteredGoals.filter(g => g.status === 'ACHIEVED').length,
    }), [filteredGoals]);

    // Handlers
    const handleCreateGoal = useCallback(() => {
        setEditingGoal(null);
        setIsModalOpen(true);
    }, []);

    const handleEditGoal = useCallback((goal: YearlyGoal) => {
        setEditingGoal(goal);
        setIsModalOpen(true);
    }, []);

    const handleDeleteGoal = useCallback((id: string) => {
        if (confirm('Tem certeza que deseja excluir esta meta?')) {
            deleteGoal(id);
        }
    }, [deleteGoal]);

    const handleSaveGoal = useCallback((goalData: Partial<YearlyGoal>) => {
        if (editingGoal) {
            updateGoal(editingGoal.id, goalData);
        } else {
            const newGoal: YearlyGoal = {
                id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: goalData.title || 'Nova Meta',
                description: goalData.description,
                category: goalData.category,
                year: goalData.year || currentYear,
                priority: goalData.priority || 'MEDIUM',
                status: 'ACTIVE',
                links: goalData.links || [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            addGoal(newGoal);
        }
        setIsModalOpen(false);
        setEditingGoal(null);
    }, [editingGoal, addGoal, updateGoal, currentYear]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Target className="text-purple-400" size={24} />
                        Metas do Ano
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        {stats.achieved}/{stats.total} alcançadas • {stats.active} ativas
                    </p>
                </div>

                <button
                    onClick={handleCreateGoal}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-lg shadow-purple-900/20 transition-all hover:scale-105"
                >
                    <Plus size={18} /> Nova Meta
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                {/* Year Filter */}
                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
                    {availableYears.map(year => (
                        <button
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedYear === year
                                ? 'bg-purple-600 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                }`}
                        >
                            {year}
                        </button>
                    ))}
                </div>

                {/* Status Filter */}
                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
                    <button
                        onClick={() => setSelectedStatus('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedStatus === 'ALL'
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Todas
                    </button>
                    {(Object.keys(STATUS_CONFIG) as GoalStatus[]).map(status => (
                        <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${selectedStatus === status
                                ? 'bg-slate-700 text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {STATUS_CONFIG[status].icon}
                            {STATUS_CONFIG[status].label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Goals Grid */}
            {filteredGoals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20 text-slate-500">
                    <Target size={48} className="mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-slate-300 mb-2">Nenhuma meta encontrada</h3>
                    <p className="text-sm text-center max-w-xs mb-4">
                        {selectedStatus !== 'ALL'
                            ? `Não há metas com status "${STATUS_CONFIG[selectedStatus].label}" em ${selectedYear}.`
                            : `Comece a definir suas metas para ${selectedYear}!`
                        }
                    </p>
                    <button
                        onClick={handleCreateGoal}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus size={16} /> Criar primeira meta
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredGoals.map(goal => (
                        <GoalCard
                            key={goal.id}
                            goal={goal}
                            onEdit={handleEditGoal}
                            onDelete={handleDeleteGoal}
                            onStatusChange={setGoalStatus}
                        />
                    ))}
                </div>
            )}

            {/* Goal Modal - Lazy loaded */}
            {isModalOpen && (
                <GoalModal
                    goal={editingGoal}
                    defaultYear={selectedYear}
                    onClose={() => { setIsModalOpen(false); setEditingGoal(null); }}
                    onSave={handleSaveGoal}
                />
            )}
        </div>
    );
};

// --- GOAL MODAL ---
interface GoalModalProps {
    goal: YearlyGoal | null;
    defaultYear: number;
    onClose: () => void;
    onSave: (data: Partial<YearlyGoal>) => void;
}

const GoalModal: React.FC<GoalModalProps> = ({ goal, defaultYear, onClose, onSave }) => {
    const [title, setTitle] = useState(goal?.title || '');
    const [description, setDescription] = useState(goal?.description || '');
    const [category, setCategory] = useState(goal?.category || '');
    const [year, setYear] = useState(goal?.year || defaultYear);
    const [priority, setPriority] = useState<GoalPriority>(goal?.priority || 'MEDIUM');
    const [links, setLinks] = useState<GoalLink[]>(goal?.links || []);
    const [showLinkSelector, setShowLinkSelector] = useState(false);

    const allLinks = useLinks();
    const sites = useSites();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        onSave({
            title: title.trim(),
            description: description.trim() || undefined,
            category: category.trim() || undefined,
            year,
            priority,
            links
        });
    };

    const handleAddInternalLink = (linkId: string) => {
        const link = allLinks.find(l => l.id === linkId);
        if (!link) return;

        const newGoalLink: GoalLink = {
            id: `gl_${Date.now()}`,
            type: 'INTERNAL',
            linkId: link.id,
            title: link.title
        };
        setLinks([...links, newGoalLink]);
        setShowLinkSelector(false);
    };

    const handleAddExternalLink = () => {
        const url = prompt('Digite a URL:');
        if (!url) return;

        const title = prompt('Digite um título para o link:') || url;

        const newGoalLink: GoalLink = {
            id: `gl_${Date.now()}`,
            type: 'EXTERNAL',
            url,
            title
        };
        setLinks([...links, newGoalLink]);
    };

    const handleRemoveLink = (linkId: string) => {
        setLinks(links.filter(l => l.id !== linkId));
    };

    const handleUpdateLinkDescription = (linkId: string, description: string) => {
        setLinks(links.map(l =>
            l.id === linkId ? { ...l, description } : l
        ));
    };

    const handleUpdateLinkTitle = (linkId: string, title: string) => {
        setLinks(links.map(l =>
            l.id === linkId ? { ...l, title } : l
        ));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">
                        {goal ? 'Editar Meta' : 'Nova Meta'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Título *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ex: Aprender TypeScript avançado"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Descrição
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Detalhes sobre a meta..."
                            rows={3}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-purple-500 outline-none resize-none"
                        />
                    </div>

                    {/* Category & Year */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Categoria
                            </label>
                            <input
                                type="text"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                placeholder="Ex: Carreira"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Ano
                            </label>
                            <input
                                type="number"
                                value={year}
                                onChange={e => setYear(parseInt(e.target.value))}
                                min={2020}
                                max={2050}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Prioridade
                        </label>
                        <div className="flex gap-2">
                            {(Object.keys(PRIORITY_CONFIG) as GoalPriority[]).map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p)}
                                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${priority === p
                                        ? PRIORITY_CONFIG[p].bgColor + ' ' + PRIORITY_CONFIG[p].color
                                        : 'border-slate-700 text-slate-400 hover:border-slate-600'
                                        }`}
                                >
                                    {PRIORITY_CONFIG[p].label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Links Vinculados
                            </label>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => setShowLinkSelector(true)}
                                    className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
                                >
                                    <Link2 size={12} /> Meus Links
                                </button>
                                <span className="text-slate-600">|</span>
                                <button
                                    type="button"
                                    onClick={handleAddExternalLink}
                                    className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
                                >
                                    <ExternalLink size={12} /> URL
                                </button>
                            </div>
                        </div>

                        {links.length === 0 ? (
                            <div className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-700 rounded-xl">
                                Nenhum link vinculado
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {links.map(link => (
                                    <div key={link.id} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                                        <div className="flex items-center gap-2 mb-2">
                                            {link.type === 'INTERNAL' ? (
                                                <Link2 size={14} className="text-purple-400 shrink-0" />
                                            ) : (
                                                <ExternalLink size={14} className="text-blue-400 shrink-0" />
                                            )}
                                            <input
                                                type="text"
                                                value={link.title || ''}
                                                onChange={e => handleUpdateLinkTitle(link.id, e.target.value)}
                                                placeholder="Nome do link"
                                                className="flex-1 bg-transparent border-b border-slate-600 px-1 py-0.5 text-sm text-slate-200 focus:border-purple-500 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveLink(link.id)}
                                                className="p-1 text-slate-500 hover:text-red-400 transition-colors shrink-0"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        {link.type === 'EXTERNAL' && link.url && (
                                            <p className="text-[10px] text-slate-500 truncate mb-2 pl-5">{link.url}</p>
                                        )}
                                        <input
                                            type="text"
                                            value={link.description || ''}
                                            onChange={e => handleUpdateLinkDescription(link.id, e.target.value)}
                                            placeholder="O que vou fazer com isso? (opcional)"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:border-purple-500 outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit as any}
                        disabled={!title.trim()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium transition-colors"
                    >
                        {goal ? 'Salvar' : 'Criar Meta'}
                    </button>
                </div>

                {/* Link Selector Modal */}
                {showLinkSelector && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
                        <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md max-h-96 overflow-hidden flex flex-col">
                            <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                                <span className="font-bold text-white">Selecionar Link</span>
                                <button onClick={() => setShowLinkSelector(false)} className="p-1 text-slate-400 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-2">
                                {allLinks.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-8">Nenhum link disponível</p>
                                ) : (
                                    <div className="space-y-1">
                                        {allLinks.map(link => {
                                            const site = sites.find(s => s.id === link.siteId);
                                            const isAlreadyLinked = links.some(l => l.linkId === link.id);
                                            return (
                                                <button
                                                    key={link.id}
                                                    onClick={() => !isAlreadyLinked && handleAddInternalLink(link.id)}
                                                    disabled={isAlreadyLinked}
                                                    className={`w-full text-left p-2 rounded-lg transition-colors ${isAlreadyLinked
                                                        ? 'opacity-50 cursor-not-allowed bg-slate-700/50'
                                                        : 'hover:bg-slate-700'
                                                        }`}
                                                >
                                                    <p className="text-sm text-slate-200 truncate">{link.title}</p>
                                                    {site && <p className="text-[10px] text-slate-500">{site.name}</p>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoalsTab;
