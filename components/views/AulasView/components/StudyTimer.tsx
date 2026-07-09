import React, { useState, useEffect } from "react";
import { cn } from "../utils";

interface StudyTimerProps {
  timerActive: boolean;
  timerRemaining: number;
  timerDuration: number; // in minutes
  timerEnded: boolean;
  completedBeforeTimer: boolean;
  onStart: () => void;
  onPause: () => void;
  onSaveSettings: (durationMinutes: number) => void;
}

export function StudyTimer({
  timerActive,
  timerRemaining,
  timerDuration,
  timerEnded,
  completedBeforeTimer,
  onStart,
  onPause,
  onSaveSettings,
}: StudyTimerProps) {
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [localDuration, setLocalDuration] = useState(timerDuration);

  // Keep local settings input draft synced with parent state prop
  useEffect(() => {
    setLocalDuration(timerDuration);
  }, [timerDuration]);

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSaveSettings = () => {
    const val = Math.max(1, localDuration);
    onSaveSettings(val);
    setShowTimerSettings(false);
  };

  return (
    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded text-xs select-none relative">
      <span
        className={cn(
          "font-mono cursor-pointer hover:text-[#D4AF37] select-none text-[11px]",
          timerActive && "text-yellow-400 animate-pulse font-semibold",
          timerEnded && "text-red-400 font-bold"
        )}
        onClick={() => setShowTimerSettings(!showTimerSettings)}
        title="Configurar timer"
      >
        ⏱️ {formatTime(timerRemaining)}
      </span>

      {timerActive ? (
        <button
          onClick={onPause}
          className="px-1 hover:text-[#D4AF37] text-slate-400 text-[9px] font-bold uppercase cursor-pointer bg-transparent border-0 outline-none"
        >
          Pausar
        </button>
      ) : (
        <button
          onClick={onStart}
          className="px-1 hover:text-[#D4AF37] text-slate-400 text-[9px] font-bold uppercase cursor-pointer bg-transparent border-0 outline-none"
          disabled={completedBeforeTimer}
        >
          Iniciar
        </button>
      )}

      {showTimerSettings && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowTimerSettings(false)} />
          <div className="absolute top-12 right-0 bg-slate-900 border border-slate-800 rounded-lg p-3 shadow-2xl z-50 w-44">
            <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1.5 font-sans">
              Duração (minutos)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="120"
                value={localDuration}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  setLocalDuration(val);
                }}
                className="bg-slate-950 border border-slate-800 text-slate-100 px-2 py-1 rounded text-xs w-full focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                onClick={handleSaveSettings}
                className="bg-[#D4AF37] text-slate-950 px-2 py-1 rounded text-xs font-bold font-sans"
              >
                OK
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
