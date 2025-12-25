import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    ArrowLeft, Save, Download, Upload, GripVertical,
    FileText, Layers, X, ZoomIn, ZoomOut, Link2, Unlink, Settings2
} from 'lucide-react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch';
import { VisualRoadmap, VisualRoadmapNode, VisualRoadmapConnection, VisualNodeType } from '../../types';
import { VISUAL_NODE_STYLES, THEME_VARIANTS, ThemeKey, VisualNodeStyleKey } from './constants';
import { getLayoutedElements } from './layoutUtils';
import { VisualNode } from './VisualNode';
import { VisualConnection } from './VisualConnection';
import { visualRoadmapSchema, safeParse } from '../../schemas';

interface VisualRoadmapEditorProps {
    skillName: string;
    visualRoadmap: VisualRoadmap;
    theme: ThemeKey;
    onClose: () => void;
    onSave: (newRoadmap: VisualRoadmap) => void;
}

export const VisualRoadmapEditor: React.FC<VisualRoadmapEditorProps> = ({
    skillName,
    visualRoadmap,
    theme,
    onClose,
    onSave
}) => {
    // State
    const [nodes, setNodes] = useState<VisualRoadmapNode[]>(visualRoadmap?.nodes || []);
    const [connections, setConnections] = useState<VisualRoadmapConnection[]>(visualRoadmap?.connections || []);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionSource, setConnectionSource] = useState<string | null>(null);

    // UI State
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState('');
    const [showLegend, setShowLegend] = useState(true);

    // Refs
    const transformRef = useRef<ReactZoomPanPinchContentRef>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Dragging Connection Line State
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const variants = THEME_VARIANTS[theme] || THEME_VARIANTS.emerald;

    // Memoized canvas bounds - dynamic size instead of fixed 5000x5000
    const canvasBounds = React.useMemo(() => {
        if (nodes.length === 0) return { width: 2000, height: 1500 };
        const maxX = Math.max(...nodes.map(n => n.x)) + 500;
        const maxY = Math.max(...nodes.map(n => n.y)) + 400;
        return {
            width: Math.max(2000, maxX),
            height: Math.max(1500, maxY)
        };
    }, [nodes]);

    // --- Layout ---
    const handleAutoLayout = useCallback(async (direction: 'TB' | 'LR' = 'LR') => {
        const layouted = await getLayoutedElements(nodes, connections, direction);
        setNodes([...layouted.nodes]);
        setConnections([...layouted.connections]);

        // Fit view after layout
        setTimeout(() => {
            if (transformRef.current) {
                transformRef.current.centerView();
            }
        }, 100);
    }, [nodes, connections]);

    // --- Node Management ---
    const addNode = useCallback((type: VisualNodeType) => {
        // Get center of viewport
        let centerX = 100;
        let centerY = 100;

        if (transformRef.current) {
            const { positionX, positionY, scale } = transformRef.current.instance.transformState;
            // Approximate center relative to canvas
            centerX = (window.innerWidth / 2 - positionX) / scale;
            centerY = (window.innerHeight / 2 - positionY) / scale;
        }

        const newNode: VisualRoadmapNode = {
            id: Date.now().toString(),
            title: type === 'section' ? 'NOVA SEÇÃO' : 'Novo Item',
            type,
            x: centerX - 80,
            y: centerY - 20,
            isCompleted: false
        };
        setNodes(prev => [...prev, newNode]);
        setSelectedNodeId(newNode.id);
    }, []);

    const updateNode = useCallback((id: string, updates: Partial<VisualRoadmapNode>) => {
        setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    }, []);

    const deleteNode = useCallback((id: string) => {
        setNodes(prev => prev.filter(n => n.id !== id));
        setConnections(prev => prev.filter(c => c.sourceId !== id && c.targetId !== id));
        if (selectedNodeId === id) setSelectedNodeId(null);
    }, [selectedNodeId]);

    const toggleComplete = useCallback((id: string) => {
        setNodes(prev => prev.map(n =>
            n.id === id ? { ...n, isCompleted: !n.isCompleted } : n
        ));
    }, []);

    // --- Connection Management ---
    const startConnection = useCallback((nodeId: string) => {
        setIsConnecting(true);
        setConnectionSource(nodeId);
    }, []);

    const completeConnection = useCallback((targetId: string) => {
        if (connectionSource && connectionSource !== targetId) {
            // Check existence
            const exists = connections.some(
                c => (c.sourceId === connectionSource && c.targetId === targetId) ||
                    (c.sourceId === targetId && c.targetId === connectionSource)
            );

            if (!exists) {
                const newConn: VisualRoadmapConnection = {
                    id: Date.now().toString(),
                    sourceId: connectionSource,
                    targetId,
                    style: 'solid'
                };
                setConnections(prev => [...prev, newConn]);
            }
        }
        setIsConnecting(false);
        setConnectionSource(null);
    }, [connectionSource, connections]);

    const toggleConnectionStyle = useCallback((connId: string) => {
        setConnections(prev => prev.map(c =>
            c.id === connId ? { ...c, style: c.style === 'solid' ? 'dashed' : 'solid' } : c
        ));
    }, []);

    const deleteConnection = useCallback((connId: string) => {
        setConnections(prev => prev.filter(c => c.id !== connId));
    }, []);

    // --- Drag Logic ---
    // We use simple drag implementation for nodes. 
    // react-zoom-pan-pinch handles the canvas pan.
    // We need to stop propagation on node mousedown to prevent panning.

    // IMPORTANT: For node dragging, since we are inside a scaled container,
    // we need to adjust the delta by the scale.

    const [draggingNode, setDraggingNode] = useState<{ id: string, startX: number, startY: number, initialNodeX: number, initialNodeY: number } | null>(null);

    const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation(); // Stop pan
        if (isConnecting) {
            completeConnection(nodeId);
            return;
        }

        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        setDraggingNode({
            id: nodeId,
            startX: e.clientX,
            startY: e.clientY,
            initialNodeX: node.x,
            initialNodeY: node.y
        });
        setSelectedNodeId(nodeId);
    }, [isConnecting, completeConnection, nodes]);

    // Refs for event handlers to avoid re-attaching listeners
    const isConnectingRef = React.useRef(isConnecting);
    const draggingNodeRef = React.useRef(draggingNode);

    React.useEffect(() => { isConnectingRef.current = isConnecting; }, [isConnecting]);
    React.useEffect(() => { draggingNodeRef.current = draggingNode; }, [draggingNode]);

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            // Update mouse pos for connection line
            if (isConnectingRef.current) {
                if (transformRef.current && canvasRef.current) {
                    const { positionX, positionY, scale } = transformRef.current.instance.transformState;
                    const x = (e.clientX - positionX) / scale;
                    const y = (e.clientY - positionY) / scale;
                    setMousePos({ x, y });
                }
            }

            // Handle Node Drag
            const currentDragging = draggingNodeRef.current;
            if (currentDragging && transformRef.current) {
                const scale = transformRef.current.instance.transformState.scale;
                const dx = (e.clientX - currentDragging.startX) / scale;
                const dy = (e.clientY - currentDragging.startY) / scale;

                setNodes(prev => prev.map(n =>
                    n.id === currentDragging.id
                        ? { ...n, x: currentDragging.initialNodeX + dx, y: currentDragging.initialNodeY + dy }
                        : n
                ));
            }
        };

        const handleGlobalMouseUp = () => {
            setDraggingNode(null);
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, []); // Empty deps - attach once, use refs for mutable values


    // --- Import / Export ---
    const exportJSON = () => {
        const data: VisualRoadmap = { nodes, connections };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${skillName.replace(/\s+/g, '_')}_roadmap.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importJSON = () => {
        try {
            const parsed = JSON.parse(importText);
            const result = safeParse(visualRoadmapSchema, parsed);

            if (result.success === true) {
                setNodes(result.data.nodes);
                setConnections(result.data.connections);
                setShowImportModal(false);
                setImportText('');
            } else {
                alert(`Erro de validação: ${result.error}`);
            }
        } catch (err) {
            alert('JSON inválido. Verifique o formato.');
        }
    };

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 shadow-md z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors" title="Fechar Editor">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <FileText size={18} className={variants.text} />
                            Editor Visual Pro
                        </h2>
                        <p className="text-xs text-slate-500">{skillName}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-2 py-1 border border-slate-700">
                        <button onClick={() => transformRef.current?.zoomOut()} className="p-1 hover:bg-slate-700 rounded text-slate-400" title="Diminuir Zoom">
                            <ZoomOut size={16} />
                        </button>
                        <button onClick={() => transformRef.current?.resetTransform()} className="px-2 text-xs text-slate-400 hover:text-white font-mono" title="Resetar Zoom">
                            100%
                        </button>
                        <button onClick={() => transformRef.current?.zoomIn()} className="p-1 hover:bg-slate-700 rounded text-slate-400" title="Aumentar Zoom">
                            <ZoomIn size={16} />
                        </button>
                    </div>

                    <button onClick={() => setShowImportModal(true)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg" title="Importar JSON">
                        <Upload size={18} />
                    </button>
                    <button onClick={exportJSON} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg" title="Exportar JSON">
                        <Download size={18} />
                    </button>

                    <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button
                            onClick={() => handleAutoLayout('LR')}
                            className="px-3 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                            title="Layout Horizontal"
                        >
                            Horizontal
                        </button>
                        <div className="w-px bg-slate-700 my-1 mx-1" />
                        <button
                            onClick={() => handleAutoLayout('TB')}
                            className="px-3 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                            title="Layout Vertical"
                        >
                            Vertical
                        </button>
                    </div>

                    <button
                        onClick={() => onSave({ nodes, connections })}
                        className={`flex items-center gap-2 px-6 py-2 ${variants.bg} text-white rounded-lg text-sm font-bold shadow-lg transition-transform active:scale-95`}
                    >
                        <Save size={18} /> Salvar
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Toolbar */}
                <div className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-2 z-10">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Item</span>
                    {(Object.keys(VISUAL_NODE_STYLES) as VisualNodeStyleKey[]).map(type => {
                        const style = VISUAL_NODE_STYLES[type];
                        return (
                            <button
                                key={type}
                                onClick={() => addNode(type)}
                                className={`w-10 h-10 rounded-lg ${style.bg} ${style.border} border flex items-center justify-center text-white text-lg font-bold transition-all hover:scale-110 active:scale-95`}
                                title={style.label}
                            >
                                {style.labelIcon || (type === 'section' ? 'S' : type[0].toUpperCase())}
                            </button>
                        );
                    })}
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-[#1e1e2e] relative overflow-hidden" ref={canvasRef}>

                    {/* Floating Legend Trigger */}
                    {!showLegend && (
                        <button
                            onClick={() => setShowLegend(true)}
                            className="absolute top-4 left-4 bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white z-20"
                        >
                            Legenda
                        </button>
                    )}

                    {/* Legend Panel */}
                    {showLegend && (
                        <div className="absolute top-4 left-4 bg-slate-900/95 border border-slate-700 rounded-xl p-4 z-20 min-w-[200px]">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Legenda</span>
                                <button onClick={() => setShowLegend(false)} className="text-slate-600 hover:text-slate-400">
                                    <X size={14} />
                                </button>
                            </div>
                            {(Object.keys(VISUAL_NODE_STYLES) as VisualNodeStyleKey[]).map(type => {
                                const style = VISUAL_NODE_STYLES[type];
                                return (
                                    <div key={type} className="flex items-center gap-2 py-1">
                                        <div className={`w-3 h-3 rounded ${style.bg}`} />
                                        <span className="text-xs text-slate-300">{style.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <TransformWrapper
                        ref={transformRef}
                        initialScale={1}
                        minScale={0.1}
                        maxScale={4}
                        centerOnInit={true}
                        wheel={{ step: 0.1 }}
                        panning={{ velocityDisabled: true }}
                        limitToBounds={false}
                    >
                        <TransformComponent
                            wrapperStyle={{ width: '100%', height: '100%' }}
                            contentStyle={{ width: '100%', height: '100%' }} // Infinite canvas simulation
                        >
                            <div className="relative bg-slate-900/0" style={{ width: canvasBounds.width, height: canvasBounds.height }}> {/* Dynamic canvas size */}
                                {/* Grid Background Pattern */}
                                <div
                                    className="absolute inset-0 opacity-20 pointer-events-none"
                                    style={{
                                        backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)',
                                        backgroundSize: '20px 20px'
                                    }}
                                />

                                {/* Interactive Layer */}
                                <div className="absolute inset-0">
                                    {/* Connections */}
                                    <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                                        {connections.map(conn => {
                                            const source = nodes.find(n => n.id === conn.sourceId);
                                            const target = nodes.find(n => n.id === conn.targetId);
                                            if (!source || !target) return null;
                                            return (
                                                <VisualConnection
                                                    key={conn.id}
                                                    connection={conn}
                                                    source={source}
                                                    target={target}
                                                    onToggleStyle={toggleConnectionStyle}
                                                    onDelete={deleteConnection}
                                                />
                                            );
                                        })}

                                        {/* Pending Connection Line */}
                                        {isConnecting && connectionSource && (
                                            (() => {
                                                const source = nodes.find(n => n.id === connectionSource);
                                                if (!source) return null;
                                                const sx = source.x + (source.type === 'section' ? 150 : 80);
                                                const sy = source.y + (source.type === 'section' ? 30 : 20);
                                                return (
                                                    <path
                                                        d={`M ${sx} ${sy} L ${mousePos.x} ${mousePos.y}`}
                                                        stroke="#60a5fa"
                                                        strokeWidth={2}
                                                        strokeDasharray="5,5"
                                                        fill="none"
                                                        className="animate-pulse"
                                                    />
                                                );
                                            })()
                                        )}
                                    </svg>

                                    {/* Nodes */}
                                    {nodes.map(node => (
                                        <VisualNode
                                            key={node.id}
                                            node={node}
                                            isSelected={selectedNodeId === node.id}
                                            isConnectionSource={connectionSource === node.id}
                                            isConnecting={isConnecting}
                                            scale={transformRef.current?.instance.transformState.scale || 1}
                                            onMouseDown={handleNodeMouseDown}
                                            onToggleComplete={toggleComplete}
                                            onStartConnection={startConnection}
                                            onDelete={deleteNode}
                                        />
                                    ))}
                                </div>
                            </div>
                        </TransformComponent>
                    </TransformWrapper>

                    {/* Canvas Controls Overlay */}
                    {isConnecting && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce cursor-pointer z-30" onClick={() => setIsConnecting(false)}>
                            <span className="text-sm font-bold">Modo de Conexão Ativo</span>
                            <span className="text-xs opacity-75">(Clique em um nó para conectar ou ESC para cancelar)</span>
                            <X size={16} />
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Properties */}
                {selectedNode && (
                    <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto z-10 animate-in slide-in-from-right-10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Settings2 size={16} className="text-slate-400" />
                                Propriedades
                            </h3>
                            <button onClick={() => setSelectedNodeId(null)} className="text-slate-500 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Título</label>
                                <input
                                    type="text"
                                    value={selectedNode.title}
                                    onChange={(e) => updateNode(selectedNode.id, { title: e.target.value })}
                                    className="w-full mt-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Tipo</label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {(Object.keys(VISUAL_NODE_STYLES) as VisualNodeStyleKey[]).map(type => {
                                        const style = VISUAL_NODE_STYLES[type];
                                        const isActive = selectedNode.type === type;
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => updateNode(selectedNode.id, { type })}
                                                className={`px-2 py-2 rounded text-xs font-medium border transition-all ${isActive
                                                    ? `${style.bg} ${style.border} text-white shadow-lg`
                                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                                                    }`}
                                            >
                                                {style.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedNode.type !== 'section' && (
                                <div className="flex items-center justify-between py-3 px-4 bg-slate-800 rounded-xl border border-slate-700">
                                    <span className="text-sm text-slate-300">Marcar como Completo</span>
                                    <button
                                        onClick={() => toggleComplete(selectedNode.id)}
                                        className={`w-10 h-6 rounded-full transition-all relative ${selectedNode.isCompleted ? 'bg-emerald-500' : 'bg-slate-600'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${selectedNode.isCompleted ? 'left-5' : 'left-1'}`} />
                                    </button>
                                </div>
                            )}

                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Descrição</label>
                                <textarea
                                    value={selectedNode.description || ''}
                                    onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                                    placeholder="Adicione notas ou detalhes..."
                                    className="w-full mt-2 px-3 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-emerald-500 outline-none resize-none h-32"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <button
                                    onClick={() => {
                                        if (confirm('Deletar este nó?')) deleteNode(selectedNode.id);
                                    }}
                                    className="w-full py-2.5 bg-red-500/10 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors"
                                >
                                    Excluir Item
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Upload size={20} className="text-blue-400" />
                                Importar JSON
                            </h3>
                            <button onClick={() => setShowImportModal(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">
                            Cole o código JSON do roadmap abaixo para restaurar um backup.
                        </p>
                        <textarea
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder='{"nodes": [...], "connections": [...]}'
                            className="w-full h-48 px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono focus:border-blue-500 outline-none resize-none mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={importJSON}
                                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                            >
                                Importar Dados
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisualRoadmapEditor;
