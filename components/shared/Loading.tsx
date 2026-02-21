import React, { useState, useEffect } from 'react';

const MESSAGES = [
  'Carregando módulo...',
  'Preparando experiência...',
  'Quase lá...',
  'Organizando elementos...',
];

export const Loading: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center h-64 w-full animate-fade-in-up"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Multi-ring spinner */}
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-slate-800/50 rounded-full" />

        {/* Spinning ring - primary */}
        <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin" />

        {/* Inner spinning ring - accent */}
        <div
          className="absolute inset-2 border-3 border-transparent border-t-purple-500/60 rounded-full animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        />

        {/* Center glow */}
        <div className="absolute inset-4 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full animate-pulse blur-sm" />

        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-xl animate-pulse" />
      </div>

      <span className="sr-only">Carregando conteúdo</span>

      {/* Rotating messages */}
      <div className="mt-6 h-6 overflow-hidden">
        <p
          key={messageIndex}
          className="text-slate-400 text-sm font-medium animate-fade-in-up"
        >
          {MESSAGES[messageIndex]}
        </p>
      </div>

      {/* Subtle progress dots */}
      <div className="flex gap-1.5 mt-4">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  );
};

// Simplified version for Suspense fallback (no interval, no state updates)
export const LoadingSimple: React.FC = () => (
  <div
    className="flex flex-col items-center justify-center h-64 w-full animate-fade-in-up"
    role="status"
    aria-busy="true"
    aria-live="polite"
  >
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 border-4 border-slate-800/50 rounded-full" />
      <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin" />
      <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-xl animate-pulse" />
    </div>
    <span className="sr-only">Carregando conteúdo</span>
    <p className="mt-6 text-slate-400 text-sm font-medium">Carregando...</p>
  </div>
);
