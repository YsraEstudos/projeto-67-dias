import React from 'react';
import { Play, Pause, Square, SkipForward } from 'lucide-react';
import { cn } from '../lib/utils';

export interface TimerControlsProps {
  isActive: boolean;
  isAlertCountdown: boolean;
  onReset: () => void;
  onToggle: () => void;
  onSkip: () => void;
  variant?: 'expanded' | 'fullscreen';
}

export const TimerControls = React.memo(function TimerControls({
  isActive,
  isAlertCountdown,
  onReset,
  onToggle,
  onSkip,
  variant = 'expanded',
}: TimerControlsProps) {
  const isFullscreen = variant === 'fullscreen';
  const sideButtonClass = isFullscreen
    ? 'w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white/20 hover:bg-white/10 flex items-center justify-center transition-colors text-white'
    : 'w-12 h-12 rounded-full border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] flex items-center justify-center transition-colors text-[var(--color-text-muted)]';
  const mainButtonClass = isFullscreen
    ? 'w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-2xl shadow-[var(--color-primary)]/30'
    : 'w-16 h-16 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-[var(--color-primary)]/20';

  return (
    <div className="flex justify-center items-center space-x-6">
      <button
        onClick={onReset}
        disabled={isAlertCountdown}
        className={cn(
          sideButtonClass,
          isAlertCountdown && "opacity-45 cursor-not-allowed hover:bg-transparent"
        )}
        title="Reiniciar"
      >
        <Square className={isFullscreen ? "w-5 h-5 sm:w-6 sm:h-6" : "w-4 h-4"} />
      </button>
      <button
        onClick={onToggle}
        disabled={isAlertCountdown}
        className={cn(
          mainButtonClass,
          isAlertCountdown && "opacity-45 cursor-not-allowed hover:scale-100"
        )}
      >
        {isActive ? (
          <Pause className={isFullscreen ? "w-8 h-8 sm:w-10 sm:h-10" : "w-6 h-6"} />
        ) : (
          <Play className={isFullscreen ? "w-8 h-8 sm:w-10 sm:h-10 ml-1.5 sm:ml-2" : "w-6 h-6 ml-1"} />
        )}
      </button>
      <button
        onClick={onSkip}
        disabled={isAlertCountdown}
        className={cn(
          sideButtonClass,
          isAlertCountdown && "opacity-45 cursor-not-allowed hover:bg-transparent"
        )}
        title="Pular fase"
      >
        <SkipForward className={isFullscreen ? "w-5 h-5 sm:w-6 sm:h-6" : "w-4 h-4"} />
      </button>
    </div>
  );
});
