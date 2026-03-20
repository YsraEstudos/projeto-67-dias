import type { ReactNode } from 'react';

interface AccordionGroupProps {
  title: string;
  subtitle?: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

export const AccordionGroup = ({
  title,
  subtitle,
  count,
  defaultOpen = true,
  children,
}: AccordionGroupProps) => (
  <details className="accordion-group" open={defaultOpen}>
    <summary className="accordion-summary">
      <div>
        <strong>{title}</strong>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
      {typeof count === 'number' ? <span className="accordion-count">{count}</span> : null}
    </summary>
    <div className="accordion-panel">{children}</div>
  </details>
);
