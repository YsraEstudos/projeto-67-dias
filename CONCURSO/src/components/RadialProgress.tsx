import type { CSSProperties } from 'react';

interface RadialProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  className?: string;
}

export const RadialProgress = ({
  progress,
  size = 64,
  strokeWidth = 6,
  color = 'var(--color-primary)',
  trackColor = 'rgba(255,255,255,0.05)',
  className = '',
}: RadialProgressProps) => {
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  const roundedProgress = Math.round(normalizedProgress);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (normalizedProgress / 100) * circumference;

  return (
    <div
      className={`radial-progress-wrapper ${className}`}
      role="progressbar"
      aria-label="Progresso"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={roundedProgress}
      aria-valuetext={`${roundedProgress}%`}
      style={
        {
          '--size': `${size}px`,
          width: 'var(--size)',
          height: 'var(--size)',
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        } as CSSProperties
      }
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        className="radial-progress-label"
        style={{
          position: 'absolute',
          fontSize: size > 50 ? '0.9rem' : '0.75rem',
          fontWeight: 600,
          color: 'var(--text-main)',
        }}
      >
        {roundedProgress}%
      </div>
    </div>
  );
};
