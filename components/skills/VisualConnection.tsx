import React, { memo } from 'react';
import { VisualRoadmapConnection, VisualRoadmapNode } from '../../types';

interface VisualConnectionProps {
    connection: VisualRoadmapConnection;
    source: VisualRoadmapNode;
    target: VisualRoadmapNode;
    onToggleStyle: (id: string) => void;
    onDelete: (id: string) => void;
}

export const VisualConnection = memo(({
    connection,
    source,
    target,
    onToggleStyle,
    onDelete
}: VisualConnectionProps) => {
    // We connect from center-to-center or nearest edge.
    // For simplicity, let's use intelligent edge calculation based on relative position.

    const sourceW = source.type === 'section' ? 300 : 160;
    const sourceH = source.type === 'section' ? 60 : 40; // Approx
    const targetW = target.type === 'section' ? 300 : 160;
    const targetH = target.type === 'section' ? 60 : 40;

    const sourceX = source.x + sourceW / 2;
    const sourceY = source.y + sourceH / 2;
    const targetX = target.x + targetW / 2;
    const targetY = target.y + targetH / 2;

    // Calculate bezier control points
    const dx = Math.abs(targetX - sourceX);
    const dy = Math.abs(targetY - sourceY);

    // Curvature logic: if horizontal distance is greater, curve mostly horizontal
    let cp1x, cp1y, cp2x, cp2y;

    if (dx > dy) {
        // Horizontal dominance
        const offset = dx * 0.5;
        cp1x = sourceX + offset;
        cp1y = sourceY;
        cp2x = targetX - offset;
        cp2y = targetY;
    } else {
        // Vertical dominance
        const offset = dy * 0.5;
        cp1x = sourceX;
        cp1y = sourceY + offset;
        cp2x = targetX;
        cp2y = targetY - offset;
    }

    const pathD = `M ${sourceX} ${sourceY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${targetX} ${targetY}`;
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;

    return (
        <g className="group/conn pointer-events-auto">
            {/* Invisible wide stroke for easier selection */}
            <path
                d={pathD}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                className="cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleStyle(connection.id);
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    onDelete(connection.id);
                }}
            />
            {/* Visible Line */}
            <path
                d={pathD}
                fill="none"
                stroke={connection.style === 'dashed' ? '#94a3b8' : '#64748b'}
                strokeWidth={2}
                strokeDasharray={connection.style === 'dashed' ? '5,5' : 'none'}
                className="transition-colors group-hover/conn:stroke-blue-400"
            />

            {/* Midpoint Action (Delete) */}
            <g
                className="opacity-0 group-hover/conn:opacity-100 transition-opacity cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(connection.id);
                }}
            >
                <circle cx={midX} cy={midY} r={8} fill="#1e293b" stroke="#475569" />
                <text x={midX} y={midY} dy={3} textAnchor="middle" fontSize={10} fill="#f87171" className="font-bold">×</text>
            </g>
        </g>
    );
});

VisualConnection.displayName = 'VisualConnection';
