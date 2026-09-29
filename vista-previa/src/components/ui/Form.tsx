import React from 'react';
import { Search } from 'lucide-react';

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      className={`mt-filter-select ${className}`} 
      style={{ padding: '8px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
      {...props} 
    />
  );
}

export function Select({ options, className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: {label: string, value: string}[] }) {
  return (
    <select className={`mt-filter-select ${className}`} {...props}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function SearchField({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mt-text-secondary)' }} />
      <input type="text" className="mt-filter-search" style={{ paddingLeft: '32px', width: '100%', boxSizing: 'border-box' }} {...props} />
    </div>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-filter-bar">
      {children}
    </div>
  );
}
