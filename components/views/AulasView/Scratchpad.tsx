import React, { useRef, useState, useEffect } from "react";
import { X, Pencil, Eraser, Trash2, RotateCcw, Download } from "lucide-react";

interface ScratchpadProps {
  onClose: () => void;
}

export default function Scratchpad({ onClose }: ScratchpadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // Brush colors palette matching premium theme
  const colors = [
    { value: "#ffffff", label: "Branco" },
    { value: "#D4AF37", label: "Ouro" },
    { value: "#ef4444", label: "Vermelho" },
    { value: "#3b82f6", label: "Azul" },
    { value: "#10b981", label: "Verde" },
    { value: "#a855f7", label: "Roxo" },
  ];

  // Set canvas size dynamically to fill the container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      // Save drawing content
      const tempImage = canvas.toDataURL();

      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight - 80; // offset for toolbar/header

      // Set canvas background to dark slate
      ctx.fillStyle = "#020617"; // slate-950
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Restore drawing content
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = tempImage;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initial history save
    setHistory([canvas.toDataURL()]);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const currentData = canvas.toDataURL();
    setHistory((prev) => {
      const next = [...prev, currentData];
      // Keep max 20 steps
      if (next.length > 20) {
        return next.slice(next.length - 20);
      }
      return next;
    });
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length <= 1) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const previousStates = [...history];
    previousStates.pop(); // Remove current state
    const targetState = previousStates[previousStates.length - 1];

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistory(previousStates);
    };
    img.src = targetState;
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = isEraser ? "#020617" : color; // Eraser matches slate-950 background
    ctx.lineWidth = isEraser ? brushSize * 4 : brushSize;

    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveHistory();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `rascunho_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-slate-900 border-l border-slate-800 w-full animate-in slide-in-from-right duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
        <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-2">
          <span>Área de Desenho (Rascunho)</span>
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Fechar rascunho"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative bg-[#020617] overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="block w-full h-full touch-none"
        />
      </div>

      {/* Controls Footer */}
      <div className="bg-slate-950 border-t border-slate-800 p-4 space-y-4">
        {/* Brush config */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEraser(false)}
              className={`p-2 rounded border transition-colors ${
                !isEraser
                  ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37]"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850"
              }`}
              title="Lápis"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsEraser(true)}
              className={`p-2 rounded border transition-colors ${
                isEraser
                  ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37]"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850"
              }`}
              title="Borracha"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Color list */}
          {!isEraser && (
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded border border-slate-800">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`w-6 h-6 rounded-full border transition-all ${
                    color === c.value
                      ? "ring-2 ring-[#D4AF37] scale-110"
                      : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          )}

          {/* Brush Size */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Espessura:</span>
            <input
              type="range"
              min="2"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-24 accent-[#D4AF37] bg-slate-800 rounded-lg appearance-none h-1.5 cursor-pointer"
            />
            <span className="w-4 text-right font-mono">{brushSize}px</span>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center justify-between border-t border-slate-900 pt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={history.length <= 1}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                history.length > 1
                  ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-850"
                  : "border-slate-900 text-slate-600 cursor-not-allowed"
              }`}
              title="Desfazer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Undo
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-red-400 hover:text-red-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
              title="Limpar tudo"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar
            </button>
          </div>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-[#D4AF37] hover:text-[#e5c158] px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
            title="Download como PNG"
          >
            <Download className="w-3.5 h-3.5" />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
