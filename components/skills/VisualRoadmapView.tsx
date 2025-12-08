import React, { useState } from 'react';
import {
    Maximize2, CheckCircle2, Circle, Layers
} from 'lucide-react';
import { VisualRoadmap, VisualRoadmapNode, VisualRoadmapConnection } from '../../types';
import { VISUAL_NODE_STYLES, VisualNodeStyleKey, THEME_VARIANTS, ThemeKey } from './constants';

interface VisualRoadmapViewProps {
    visualRoadmap?: VisualRoadmap;
    theme: ThemeKey;
    onOpenEditor: () => void;
    onToggleComplete: (nodeId: string) => void;
}

/**
 * Compact view of the visual roadmap for embedding in RoadmapSection.
 * Shows a minimap-style preview of the nodes with basic interaction.
 */
export const VisualRoadmapView: React.FC<VisualRoadmapViewProps> = ({
    visualRoadmap,
    theme,
    onOpenEditor,
    onToggleComplete
}) => {
    const variants = THEME_VARIANTS[theme] || THEME_VARIANTS.emerald;

    const nodes = visualRoadmap?.nodes || [];
    const connections = visualRoadmap?.connections || [];

    // Calculate stats
    const totalNodes = nodes.filter(n => n.type !== 'section' && n.type !== 'info').length;
    const completedNodes = nodes.filter(n => n.isCompleted && n.type !== 'section' && n.type !== 'info').length;
    const progress = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

    // Calculate bounds for auto-scaling the preview
    const getBounds = () => {
        if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 400, maxY: 300 };
        const xs = nodes.map(n => n.x);
        const ys = nodes.map(n => n.y);
        return {
            minX: Math.min(...xs) - 50,
            minY: Math.min(...ys) - 50,
            maxX: Math.max(...xs) + 200,
            maxY: Math.max(...ys) + 100
        };
    };

    const bounds = getBounds();
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const scale = Math.min(1, 400 / width, 250 / height);

    // Render connection lines
    const renderConnections = () => {
        return connections.map(conn => {
            const source = nodes.find(n => n.id === conn.sourceId);
            const target = nodes.find(n => n.id === conn.targetId);
            if (!source || !target) return null;

            const x1 = (source.x - bounds.minX + 80) * scale;
            const y1 = (source.y - bounds.minY + 15) * scale;
            const x2 = (target.x - bounds.minX + 80) * scale;
            const y2 = (target.y - bounds.minY + 15) * scale;

            return (
                <line
                    key={conn.id}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={conn.style === 'dashed' ? '#3b82f6' : '#10b981'}
                    strokeWidth={1.5}
                    strokeDasharray={conn.style === 'dashed' ? '4,4' : 'none'}
                />
            );
        });
    };

    if (nodes.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-60 min-h-[200px]">
                <Layers size={48} className="mb-4" />
                <p className="text-center">Crie um roadmap visual para visualizar aqui.</p>
                <button
                    onClick={onOpenEditor}
                    className={`mt-4 px-4 py-2 ${variants.bgLight} ${variants.text} rounded-lg border ${variants.borderLight} hover:${variants.bgHover} transition-colors text-sm font-medium`}
                >
                    Abrir Editor Visual
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4">
            {/* Progress Bar */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex justify-between items-center mb-2 text-xs font-bold uppercase text-slate-500 tracking-wider">
                    <span>Progresso de Nós</span>
                    <span>{completedNodes} / {totalNodes}</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="text-right mt-1 text-xs text-purple-400 font-mono">{progress}% Completo</div>
            </div>

            {/* Visual Preview */}
            <div className="relative bg-[#1e1e2e] rounded-xl border border-slate-700 overflow-hidden min-h-[250px]">
                {/* Open Editor Button */}
                <button
                    onClick={onOpenEditor}
                    className="absolute top-3 right-3 z-10 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-600 flex items-center gap-1.5 transition-colors"
                >
                    <Maximize2 size={14} /> Editar
                </button>

                {/* Grid Background */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)',
                        backgroundSize: '15px 15px'
                    }}
                />

                {/* SVG for Connections */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {renderConnections()}
                </svg>

                {/* Nodes */}
                <div className="relative p-4" style={{ minHeight: `${height * scale + 40}px` }}>
                    {nodes.map(node => {
                        const style = VISUAL_NODE_STYLES[node.type as VisualNodeStyleKey];
                        const x = (node.x - bounds.minX) * scale;
                        const y = (node.y - bounds.minY) * scale;

                        return (
                            <div
                                key={node.id}
                                className={`
                                    absolute select-none cursor-pointer
                                    ${style.bg} ${style.border} ${style.text}
                                    border rounded-md px-2 py-1
                                    text-[10px] font-medium
                                    transition-all hover:scale-105
                                    ${node.isCompleted ? 'opacity-50' : ''}
                                    flex items-center gap-1
                                `}
                                style={{ left: x, top: y, maxWidth: '120px' }}
                                onClick={() => onToggleComplete(node.id)}
                            >
                                {node.isCompleted ? (
                                    <CheckCircle2 size={10} className={style.checkColor} />
                                ) : (
                                    <Circle size={10} className="opacity-50" />
                                )}
                                <span className={`truncate ${node.isCompleted ? 'line-through' : ''}`}>
                                    {node.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend (compact) */}
            <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
                {(Object.keys(VISUAL_NODE_STYLES) as VisualNodeStyleKey[]).slice(0, 3).map(type => {
                    const style = VISUAL_NODE_STYLES[type];
                    return (
                        <div key={type} className="flex items-center gap-1">
                            {style.labelIcon && (
                                <span className={style.labelColor}>{style.labelIcon}</span>
                            )}
                            {!style.labelIcon && (
                                <span className={`w-2 h-2 rounded-sm ${style.bg}`} />
                            )}
                            <span>{style.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
