import React, { useState, useMemo } from 'react';
import {
    Target, Check, X, Trash2, Edit2, ExternalLink, Link2,
    ChevronDown, ChevronRight, Trophy, AlertCircle, RotateCcw, Ban
} from 'lucide-react';
import { useLinks } from '../../stores/linksStore';
import { useSites } from '../../stores/sitesStore';
import { YearlyGoal, GoalPriority, GoalStatus, GoalLink } from '../../types';

export const PRIORITY_CONFIG: Record<GoalPriority, { label: string; color: string; bgColor: string }> = {
    HIGH: { label: 'Alta', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/30' },
    MEDIUM: { label: 'Média', color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/30' },
    LOW: { label: 'Baixa', color: 'text-slate-400', bgColor: 'bg-slate-500/10 border-slate-500/30' }
};

export const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string; icon: React.ReactNode }> = {
    ACTIVE: { label: 'Ativa', color: 'text-emerald-400', icon: <Target size={14} /> },
    ACHIEVED: { label: 'Alcançada', color: 'text-amber-400', icon: <Trophy size={14} /> },
    DROPPED: { label: 'Abandonada', color: 'text-slate-500', icon: <X size={14} /> }
};

interface GoalCardProps {
    goal: YearlyGoal;
    onEdit: (goal: YearlyGoal) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: GoalStatus) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete, onStatusChange }) => {
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

    const hasExpandableContent = goal.links.length > 0 || (goal.description && goal.description.length > 100);

    return (
        <div className={`bg-slate-800/50 rounded-2xl border transition-all hover:shadow-lg group ${goal.status === 'ACHIEVED' ? 'border-amber-500/30' :
            goal.status === 'DROPPED' ? 'border-slate-700/50 opacity-60' :
                'border-slate-700 hover:border-purple-500/30'
            }`}>
            {/* Header */}
            <div className="p-4 flex items-start gap-3">
                {hasExpandableContent ? (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 text-slate-400 hover:text-white transition-colors mt-0.5"
                    >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                ) : (
                    <div className="w-[26px] h-6 shrink-0" />
                )}

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
                        <p className={`text-sm text-slate-400 mb-2 ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {goal.description}
                        </p>
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
