import type { ButtonHTMLAttributes } from 'react';

interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  tone?: 'default' | 'danger' | 'neutral';
}

export const FilterChip = ({
  active = false,
  tone = 'default',
  className,
  children,
  ...rest
}: FilterChipProps) => {
  const classes = ['filter-chip', active ? 'filter-chip-active' : '', `filter-chip-${tone}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
};
