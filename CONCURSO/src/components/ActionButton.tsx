import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger';

interface SharedProps {
  tone?: ButtonTone;
  children: ReactNode;
  className?: string;
}

type ActionButtonProps =
  | (SharedProps & ButtonHTMLAttributes<HTMLButtonElement> & { to?: never; href?: never })
  | (SharedProps & { to: string; href?: never })
  | (SharedProps & { href: string; to?: never });

export const ActionButton = (props: ActionButtonProps) => {
  const tone = props.tone ?? 'primary';
  const classes = ['button', tone === 'primary' ? '' : `button-${tone}`, props.className]
    .filter(Boolean)
    .join(' ');

  if ('to' in props && props.to) {
    return (
      <Link className={classes} to={props.to}>
        {props.children}
      </Link>
    );
  }

  if ('href' in props && props.href) {
    return (
      <a className={classes} href={props.href} target="_blank" rel="noreferrer">
        {props.children}
      </a>
    );
  }

  const { children, className: _className, tone: _tone, ...buttonProps } = props;
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
};
