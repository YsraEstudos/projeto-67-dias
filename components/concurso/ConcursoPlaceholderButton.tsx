import React from 'react';
import { Trophy } from 'lucide-react';

export const ConcursoPlaceholderButton: React.FC = () => {
  return (
    <button
      type="button"
      disabled
      className={`
        group relative overflow-hidden
        bg-gradient-to-br from-slate-800/80 to-slate-900/80
        border border-slate-700/50
        rounded-2xl p-6
        transition-all duration-500 ease-out
        backdrop-blur-sm
        w-full text-left
        flex flex-col justify-between min-h-[100px] h-auto py-4 sm:h-40
        animate-fade-in-up
        touch-manipulation
        cursor-not-allowed opacity-95
      `}
      aria-label="Concurso - aguardando projeto"
    >
      <div className="absolute inset-0 rounded-2xl p-[1px] pointer-events-none">
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/30 via-purple-500/40 to-pink-500/30 animate-gradient-shift"
          style={{ backgroundSize: '200% 200%' }}
        />
      </div>

      <div className="absolute -inset-1 rounded-2xl opacity-20 blur-xl pointer-events-none bg-purple-400" />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative p-3 rounded-xl bg-slate-900/70 text-purple-400 bg-opacity-20">
            <div className="absolute inset-0 rounded-xl opacity-40 bg-purple-400 blur-md" />
            <Trophy size={28} className="relative z-10 text-purple-400" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-100">Concurso</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Esperando um projeto que ainda vou fazer</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex justify-end items-center">
        <span className="text-xs font-mono px-3 py-1.5 rounded-lg border text-slate-300 bg-slate-900/70 border-slate-700/50">
          EM BREVE
        </span>
      </div>

      <div className="absolute inset-0 -translate-x-1/3 pointer-events-none">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
      </div>

      <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-20 transition-all duration-700 blur-2xl bg-purple-400" />
    </button>
  );
};
