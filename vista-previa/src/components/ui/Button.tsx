import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'background-color 0.15s ease',
  };

  const variants = {
    primary: { backgroundColor: 'var(--mt-text-primary)', color: 'var(--mt-bg)' },
    secondary: { backgroundColor: 'var(--mt-surface-subtle)', color: 'var(--mt-text-primary)', border: '1px solid var(--mt-border)' },
    ghost: { backgroundColor: 'transparent', color: 'var(--mt-text-secondary)' },
    danger: { backgroundColor: '#2F1517', color: '#F87171', border: '1px solid #542226' },
  };

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '13px' },
    lg: { padding: '12px 20px', fontSize: '14px' },
  };

  const style = { ...baseStyle, ...variants[variant], ...sizes[size] };

  return (
    <button style={style} className={className} {...props}>
      {children}
    </button>
  );
}
