import type { ReactNode } from 'react';

interface TopicRowProps {
  title: string;
  subtitle: string;
  grade: string;
  badges?: ReactNode;
  stats?: ReactNode;
  footer?: ReactNode;
}

export const TopicRow = ({ title, subtitle, grade, badges, stats, footer }: TopicRowProps) => (
  <article className={`topic-row-shell topic-row-shell-${grade.toLowerCase()}`}>
    <div className="topic-row-main">
      <div className="topic-row-marker" aria-hidden="true" />
      <div className="topic-row-copy">
        <h4>{title}</h4>
        <p>{subtitle}</p>
      </div>
      {badges ? <div className="topic-row-badges">{badges}</div> : null}
    </div>
    {stats ? <div className="topic-row-stats">{stats}</div> : null}
    {footer ? <div className="topic-row-footer">{footer}</div> : null}
  </article>
);
