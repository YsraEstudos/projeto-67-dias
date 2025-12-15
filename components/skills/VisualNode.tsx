import React, { memo } from 'react';
import { CheckCircle2, Circle, Link2, Trash2 } from 'lucide-react';
import { VisualRoadmapNode } from '../../types';
import { VISUAL_NODE_STYLES, VisualNodeStyleKey } from './constants';

interface VisualNodeProps {
    node: VisualRoadmapNode;
    isSelected: boolean;
    isConnectionSource: boolean;
    isConnecting: boolean;
    scale: number;
    onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    onToggleComplete: (id: string) => void;
    onStartConnection: (id: string) => void;
    onDelete: (id: string) => void;
}

export const VisualNode = memo(({
    node,
    isSelected,
    isConnectionSource,
    isConnecting,
    scale,
    onMouseDown,
    onToggleComplete,
    onStartConnection,
    onDelete
}: VisualNodeProps) => {
    const style = VISUAL_NODE_STYLES[node.type] || VISUAL_NODE_STYLES.main;

    // For section nodes, we use a wider layout
    const isSection = node.type === 'section';

    return (
        <div
            className={`
                absolute select-none cursor-grab active:cursor-grabbing
                ${style.bg} ${style.border} ${style.text}
                border-2 rounded-lg 
                ${isSection ? 'w-[300px] h-[60px] flex items-center justify-center' : 'min-w-[160px] px-4 py-2'}
                transition-shadow duration-200
                ${isSelected ? 'ring-2 ring-white shadow-xl z-20' : 'hover:scale-[1.02] z-10'}
                ${isConnectionSource ? 'ring-2 ring-blue-400 animate-pulse' : ''}
                ${node.isCompleted ? 'opacity-60' : ''}
                group/node
            `}
            style={{
                left: 0,
                top: 0,
                transform: `translate(${node.x}px, ${node.y}px)`
            }}
            onMouseDown={(e) => onMouseDown(e, node.id)}
        >
            {/* Complete Toggle (Left side or hidden for sections if desired) */}
            {!isSection && (
                <button
                    className={`absolute -left-3 top-1/2 -translate-y-1/2 ${style.checkColor} hover:scale-110 transition-transform bg-slate-900 rounded-full`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(node.id);
                    }}
                >
                    {node.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
            )}

            {/* Title */}
            <div className={`font-medium text-sm ${node.isCompleted ? 'line-through' : ''} ${isSection ? 'text-center uppercase tracking-widest' : ''}`}>
                {node.title}
            </div>

            {/* Quick Actions (only show on hover) */}
            <div className={`absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 
                ${isSelected || isConnecting ? 'opacity-100' : 'group-hover/node:opacity-100'} 
                transition-opacity pointer-events-none group-hover/node:pointer-events-auto`}>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onStartConnection(node.id);
                    }}
                    className="p-1.5 bg-slate-800 rounded border border-slate-600 text-blue-400 hover:bg-blue-600 hover:text-white text-xs shadow-lg"
                    title="Conectar"
                    style={{ transform: `scale(${1 / scale})` }} // Counter-scale icons if needed, or just let them zoom
                >
                    <Link2 size={14} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Deletar este nó?')) onDelete(node.id);
                    }}
                    className="p-1.5 bg-slate-800 rounded border border-slate-600 text-red-400 hover:bg-red-600 hover:text-white text-xs shadow-lg"
                    title="Deletar"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Connection Handles (Visual cues) */}
            <div className="absolute top-1/2 left-0 w-2 h-2 -ml-1 bg-transparent group-hover/node:bg-white/20 rounded-full" />
            <div className="absolute top-1/2 right-0 w-2 h-2 -mr-1 bg-transparent group-hover/node:bg-white/20 rounded-full" />
            <div className="absolute bottom-0 left-1/2 w-2 h-2 -mb-1 bg-transparent group-hover/node:bg-white/20 rounded-full" />
            <div className="absolute top-0 left-1/2 w-2 h-2 -mt-1 bg-transparent group-hover/node:bg-white/20 rounded-full" />
        </div>
    );
});

VisualNode.displayName = 'VisualNode';
