interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  emphasis?: 'blue' | 'green' | 'orange' | 'red';
  kicker?: string;
  tone?: 'default' | 'emphasis' | 'alert' | 'success';
  density?: 'comfortable' | 'compact';
  surface?: 'flat' | 'elevated' | 'glass';
}

export const MetricCard = ({
  title,
  value,
  subtitle,
  emphasis = 'blue',
  kicker,
  tone,
  density = 'comfortable',
  surface = 'elevated',
}: MetricCardProps) => (
  <article
    className={`metric-card metric-${emphasis} metric-tone-${tone ?? emphasis} metric-density-${density} metric-surface-${surface}`}
  >
    {kicker ? <p className="metric-kicker">{kicker}</p> : null}
    <p className="metric-title">{title}</p>
    <p className="metric-value">{value}</p>
    {subtitle ? <p className="metric-subtitle">{subtitle}</p> : null}
  </article>
);

