import React from 'react';

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-empty-row">
      {message}
    </div>
  );
}

export interface DataTableProps {
  columns: string[];
  children: React.ReactNode;
}

export function DataTable({ columns, children }: DataTableProps) {
  return (
    <div className="mt-panel mt-table-wrap">
      <table className="mt-table">
        <thead>
          <tr>
            {columns.map((col, idx) => <th key={idx}>{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
}
