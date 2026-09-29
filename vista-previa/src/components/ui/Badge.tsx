import React from 'react';

export interface BadgeProps {
  status: 'success' | 'warning' | 'danger' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ status, children, className = '' }: BadgeProps) {
  return (
    <span className={`mt-badge ${status} ${className}`}>
      {children}
    </span>
  );
}
