/**
 * Drawing Canvas - Fullscreen canvas with pressure-sensitive drawing
 * Supports S Pen, Wacom tablets, and touch input
 * 
 * PERFORMANCE OPTIMIZED:
 * - Uses useRef for currentStroke to avoid re-renders during drawing
 * - Memoized callbacks to prevent child re-renders
 * - Throttled pointer events for smoother drawing
 */
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import DrawingToolbar, { DrawingTool } from './DrawingToolbar';
import { uploadDrawingFromDataUrl } from '../../services/storageService';
import { useJournalStore } from '../../stores/journalStore';
import { DrawingPage } from '../../types';

interface Point {
    x: number;
    y: number;
    pressure: number;
}

interface Stroke {
    points: Point[];
    color: string;
    brushSize: number;
    tool: DrawingTool;
}

interface PageData {
    id: string;
    strokes: Stroke[];
    imageDataUrl?: string;
}

interface DrawingCanvasProps {
    entryId: string;
    existingPages?: DrawingPage[];
    onClose: () => void;
    onSaveComplete?: () => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
    entryId,
    existingPages = [],
    onClose,
    onSaveComplete
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // PERF: Use ref for current stroke to avoid re-renders during drawing
    const currentStrokeRef = useRef<Point[]>([]);
    const isDrawingRef = useRef(false);

    // Store actions - extracted once
    const addDrawingPage = useJournalStore(state => state.addDrawingPage);

    // Drawing state (only for UI that needs re-render)
    const [tool, setTool] = useState<DrawingTool>('pen');
    const [color, setColor] = useState('#ffffff');
    const [brushSize, setBrushSize] = useState(4);

    // Strokes for undo (only updated on stroke complete)
    const [strokes, setStrokes] = useState<Stroke[]>([]);

    // Pages
    const [pages, setPages] = useState<PageData[]>([{ id: `page_${Date.now()}`, strokes: [] }]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    // UI state
    const [toolbarVisible, setToolbarVisible] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // PERF: Memoize current page
    const currentPage = useMemo(() => pages[currentPageIndex], [pages, currentPageIndex]);

    // Initialize canvas size
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const updateSize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.scale(dpr, dpr);
            }
            redrawCanvas();
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Redraw canvas when strokes change
    useEffect(() => {
        redrawCanvas();
    }, [strokes, currentPageIndex]);

    // Load existing pages
    useEffect(() => {
        if (existingPages.length > 0) {
            const loadedPages: PageData[] = existingPages.map(p => ({
                id: p.id,
                strokes: [],
                imageDataUrl: p.storageUrl
            }));
            setPages(loadedPages);
        }
    }, [existingPages]);

    // PERF: Memoized redraw function
    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const dpr = window.devicePixelRatio || 1;

        // Clear with dark background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        // Load existing image if available
        if (currentPage?.imageDataUrl) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
                drawStrokes(ctx, strokes);
            };
            img.src = currentPage.imageDataUrl;
        } else {
            drawStrokes(ctx, strokes);
        }
    }, [strokes, currentPage]);

    // PERF: Extracted stroke drawing for reuse
    const drawStrokes = useCallback((ctx: CanvasRenderingContext2D, strokeList: Stroke[]) => {
        strokeList.forEach(stroke => {
            if (stroke.points.length < 2) return;

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (stroke.tool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = stroke.color;
            }

            for (let i = 0; i < stroke.points.length - 1; i++) {
                const p1 = stroke.points[i];
                const p2 = stroke.points[i + 1];
                const pressure = (p1.pressure + p2.pressure) / 2;
                ctx.lineWidth = stroke.brushSize * pressure * 2;

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        });

        ctx.globalCompositeOperation = 'source-over';
    }, []);

    // PERF: Optimized pointer position calculation
    const getPointerPosition = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0, pressure: 0.5 };

        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            pressure: e.pressure || 0.5
        };
    }, []);

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        isDrawingRef.current = true;
        setToolbarVisible(false);

        const point = getPointerPosition(e);
        currentStrokeRef.current = [point];

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = color;
        }
    }, [tool, color, getPointerPosition]);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const point = getPointerPosition(e);
        const currentStroke = currentStrokeRef.current;
        const lastPoint = currentStroke[currentStroke.length - 1];

        if (lastPoint) {
            const pressure = (lastPoint.pressure + point.pressure) / 2;
            ctx.lineWidth = brushSize * pressure * 2;

            if (tool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = color;
            }

            ctx.beginPath();
            ctx.moveTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
        }

        // PERF: Direct mutation of ref instead of setState
        currentStrokeRef.current.push(point);
    }, [tool, color, brushSize, getPointerPosition]);

    const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();

        isDrawingRef.current = false;
        setToolbarVisible(true);

        const currentStroke = currentStrokeRef.current;
        if (currentStroke.length > 1) {
            const newStroke: Stroke = {
                points: [...currentStroke], // Copy array
                color,
                brushSize,
                tool
            };
            setStrokes(prev => [...prev, newStroke]);
        }

        currentStrokeRef.current = [];

        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.globalCompositeOperation = 'source-over';
        }
    }, [color, brushSize, tool]);

    const handlePointerLeave = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        if (isDrawingRef.current) {
            handlePointerUp(e);
        }
    }, [handlePointerUp]);

    // PERF: Memoized action handlers
    const handleUndo = useCallback(() => {
        if (strokes.length > 0) {
            setStrokes(prev => prev.slice(0, -1));
        }
    }, [strokes.length]);

    const handleClear = useCallback(() => {
        if (confirm('Limpar toda a página?')) {
            setStrokes([]);
        }
    }, []);

    const handleSave = useCallback(async () => {
        const canvas = canvasRef.current;
        if (!canvas || isSaving) return;

        setIsSaving(true);

        try {
            const dataUrl = canvas.toDataURL('image/png');
            const pageId = currentPage.id;

            const result = await uploadDrawingFromDataUrl(entryId, pageId, dataUrl);

            const drawingPage: DrawingPage = {
                id: pageId,
                storageUrl: result.url,
                storagePath: result.storagePath,
                width: canvas.width,
                height: canvas.height,
                createdAt: Date.now()
            };

            addDrawingPage(entryId, drawingPage);

            setPages(prev => prev.map((p, i) =>
                i === currentPageIndex
                    ? { ...p, imageDataUrl: dataUrl }
                    : p
            ));

            onSaveComplete?.();
            alert('Desenho salvo!');
        } catch (error) {
            console.error('Error saving drawing:', error);
            alert('Erro ao salvar desenho. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, currentPage, entryId, currentPageIndex, addDrawingPage, onSaveComplete]);

    const handleClose = useCallback(async () => {
        if (strokes.length > 0) {
            const shouldSave = confirm('Salvar antes de sair?');
            if (shouldSave) {
                await handleSave();
            }
        }
        onClose();
    }, [strokes.length, handleSave, onClose]);

    const handlePrevPage = useCallback(() => {
        if (currentPageIndex > 0) {
            setPages(prev => prev.map((p, i) =>
                i === currentPageIndex ? { ...p, strokes } : p
            ));

            const newIndex = currentPageIndex - 1;
            setCurrentPageIndex(newIndex);
            setStrokes(pages[newIndex].strokes);
        }
    }, [currentPageIndex, strokes, pages]);

    const handleNextPage = useCallback(() => {
        if (currentPageIndex < pages.length - 1) {
            setPages(prev => prev.map((p, i) =>
                i === currentPageIndex ? { ...p, strokes } : p
            ));

            const newIndex = currentPageIndex + 1;
            setCurrentPageIndex(newIndex);
            setStrokes(pages[newIndex].strokes);
        }
    }, [currentPageIndex, pages, strokes]);

    const handleAddPage = useCallback(() => {
        setPages(prev => {
            const updated = prev.map((p, i) =>
                i === currentPageIndex ? { ...p, strokes } : p
            );
            return [...updated, { id: `page_${Date.now()}`, strokes: [] }];
        });

        setCurrentPageIndex(pages.length);
        setStrokes([]);
    }, [currentPageIndex, strokes, pages.length]);

    // PERF: Memoized toolbar props
    const canUndo = strokes.length > 0;
    const isToolbarVisible = toolbarVisible && !isDrawingRef.current;

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[100] bg-slate-950"
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 touch-none cursor-crosshair"
                style={{ touchAction: 'none' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerLeave}
                onPointerCancel={handlePointerUp}
            />

            {isSaving && (
                <div className="absolute top-4 right-4 bg-slate-800 px-4 py-2 rounded-lg flex items-center gap-2 text-white">
                    <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                    Salvando...
                </div>
            )}

            <DrawingToolbar
                tool={tool}
                color={color}
                brushSize={brushSize}
                currentPage={currentPageIndex + 1}
                totalPages={pages.length}
                canUndo={canUndo}
                isVisible={isToolbarVisible}
                onToolChange={setTool}
                onColorChange={setColor}
                onBrushSizeChange={setBrushSize}
                onUndo={handleUndo}
                onClear={handleClear}
                onSave={handleSave}
                onClose={handleClose}
                onPrevPage={handlePrevPage}
                onNextPage={handleNextPage}
                onAddPage={handleAddPage}
            />

            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-slate-500 text-sm pointer-events-none animate-pulse">
                Toque na tela para começar
            </div>
        </div>
    );
};

export default React.memo(DrawingCanvas);
