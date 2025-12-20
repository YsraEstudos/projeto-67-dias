import React from 'react';
import { createPortal } from 'react-dom';
import { BarChart3, Calendar, X } from 'lucide-react';
import { Skill } from '../../types';

interface SkillContextMenuProps {
    x: number;
    y: number;
    skill: Skill;
    onClose: () => void;
    onToggleDistribution: () => void;
    onViewDailyPlan: () => void;
}

/**
 * Context menu for skill cards - appears on right-click.
 * Uses React Portal to render outside card hierarchy for proper event handling.
 */
export const SkillContextMenu: React.FC<SkillContextMenuProps> = ({
    x,
    y,
    skill,
    onClose,
    onToggleDistribution,
    onViewDailyPlan
}) => {
    const isExponential = skill.distributionType === 'EXPONENTIAL';
    const hasDeadline = !!skill.deadline;

    // Adjust position to stay within viewport
    const menuLeft = Math.min(x, window.innerWidth - 260);
    const menuTop = Math.min(y, window.innerHeight - 220);

    const menuContent = (
        <>
            {/* Backdrop - captures clicks outside menu */}
            <div
                className="fixed inset-0"
                style={{ zIndex: 99998, backgroundColor: 'transparent' }}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    onClose();
                }}
            />

            {/* Menu container */}
            <div
                style={{
                    position: 'fixed',
                    left: menuLeft,
                    top: menuTop,
                    zIndex: 99999
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 border-2 border-slate-600 rounded-xl shadow-2xl overflow-hidden min-w-[230px]"
            >
                {/* Header */}
                <div className="p-2 border-b border-slate-700 flex items-center justify-between bg-slate-900">
                    <span className="text-xs font-bold text-slate-300 uppercase px-2">⚙️ Opções</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                    {/* Toggle Distribution Type */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleDistribution();
                            onClose();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-700 rounded-lg transition-colors text-left"
                    >
                        <div className={`p-2 rounded-lg ${isExponential ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            <BarChart3 size={18} />
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-bold text-white">
                                {isExponential ? '📈 Exponencial' : '📊 Linear'}
                            </div>
                            <div className="text-xs text-slate-400">
                                {isExponential
                                    ? 'Mudar para Linear'
                                    : 'Mudar para Exponencial'}
                            </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${isExponential ? 'bg-purple-400' : 'bg-blue-400'}`} />
                    </button>

                    {/* View Daily Plan - only if has deadline */}
                    {hasDeadline && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewDailyPlan();
                                onClose();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-700 rounded-lg transition-colors text-left mt-1"
                        >
                            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                                <Calendar size={18} />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-bold text-white">📅 Ver Plano Diário</div>
                                <div className="text-xs text-slate-400">Detalhes por dia</div>
                            </div>
                        </button>
                    )}

                    {!hasDeadline && (
                        <div className="px-3 py-3 text-xs text-slate-500 italic text-center mt-1 bg-slate-900 rounded-lg">
                            ⚠️ Defina um deadline primeiro
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    // Use Portal to render menu at document body level
    return createPortal(menuContent, document.body);
};

