interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  emphasis?: 'blue' | 'green' | 'orange' | 'red';
}

export const MetricCard = ({
  title,
  value,
  subtitle,
  emphasis = 'blue',
}: MetricCardProps) => (
  <article className={`metric-card metric-${emphasis}`}>
    <p className="metric-title">{title}</p>
    <p className="metric-value">{value}</p>
    {subtitle ? <p className="metric-subtitle">{subtitle}</p> : null}
  </article>
);

