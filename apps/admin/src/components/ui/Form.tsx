import React from 'react';
import { Search } from 'lucide-react';
import { Input as UIInput, Select as UISelect, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@mitron/ui';

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <UIInput className={className} {...props} />
  );
}

export function Select({ options, className = '', value, onChange, placeholder }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: {label: string, value: string}[], placeholder?: string }) {
  return (
    <UISelect value={value as string} onValueChange={(val) => {
        if(onChange) {
            onChange({ target: { value: val } } as any);
        }
    }}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder || "Seleccione..."} />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => (
           <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </UISelect>
  );
}

export function SearchField({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative flex-1 min-w-[180px]">
      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mt-text-secondary z-10" />
      <UIInput className="pl-8" {...props} />
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
