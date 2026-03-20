interface ProgressBarProps {
  value: number;
  label?: string;
  compact?: boolean;
}

export const ProgressBar = ({ value, label, compact = false }: ProgressBarProps) => {
  const bounded = Math.max(0, Math.min(value, 100));

  return (
    <div className={compact ? 'progress-wrap progress-wrap-compact' : 'progress-wrap'}>
      {label ? <div className="progress-label">{label}</div> : null}
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={bounded}
      >
        <div className="progress-fill" style={{ width: `${bounded}%` }} />
      </div>
      <div className="progress-value">{bounded}%</div>
    </div>
  );
};

