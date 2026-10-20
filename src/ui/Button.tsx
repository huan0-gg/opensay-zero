import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'quiet';
  size?: 'md' | 'lg';
  block?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    'button',
    `button--${variant}`,
    size === 'lg' ? 'button--lg' : '',
    block ? 'button--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button type={type} className={classes} {...rest} />;
}
