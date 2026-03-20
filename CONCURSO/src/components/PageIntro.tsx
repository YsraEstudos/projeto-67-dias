import type { ReactNode } from 'react';

interface PageIntroProps {
  kicker?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}

export const PageIntro = ({
  kicker,
  title,
  description,
  actions,
  meta,
  className,
}: PageIntroProps) => (
  <header className={className ? `page-intro ${className}` : 'page-intro'}>
    <div className="page-intro-copy">
      {kicker ? <p className="kicker-label">{kicker}</p> : null}
      <div className="page-intro-title-row">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {actions ? <div className="page-intro-actions">{actions}</div> : null}
      </div>
    </div>
    {meta ? <div className="page-intro-meta">{meta}</div> : null}
  </header>
);
