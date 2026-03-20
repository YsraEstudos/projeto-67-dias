import type { HTMLAttributes, ReactNode } from 'react';

interface ContextBarProps {
  children: ReactNode;
  className?: string;
}

export const ContextBar = ({
  children,
  className,
  ...rest
}: ContextBarProps & HTMLAttributes<HTMLElement>) => (
  <section className={className ? `context-bar ${className}` : 'context-bar'} {...rest}>
    {children}
  </section>
);
