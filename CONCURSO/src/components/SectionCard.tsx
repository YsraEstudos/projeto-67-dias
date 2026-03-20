import type { HTMLAttributes, ReactNode } from 'react';

type SectionCardTone = 'default' | 'emphasis' | 'alert' | 'success';
type SectionCardSurface = 'elevated' | 'glass' | 'flat';

interface SectionCardProps extends HTMLAttributes<HTMLElement> {
  as?: 'section' | 'article' | 'div';
  kicker?: string;
  title?: string;
  aside?: ReactNode;
  tone?: SectionCardTone;
  surface?: SectionCardSurface;
  children: ReactNode;
}

export const SectionCard = ({
  as = 'section',
  kicker,
  title,
  aside,
  tone = 'default',
  surface = 'elevated',
  className,
  children,
  ...rest
}: SectionCardProps) => {
  const Component = as;
  const classes = ['section-card', `section-card-${tone}`, `section-card-${surface}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={classes} {...rest}>
      {kicker || title || aside ? (
        <div className="section-card-head">
          <div>
            {kicker ? <p className="kicker-label">{kicker}</p> : null}
            {title ? <h3>{title}</h3> : null}
          </div>
          {aside ? <div className="section-card-aside">{aside}</div> : null}
        </div>
      ) : null}
      {children}
    </Component>
  );
};
