import React from 'react';

export function StatCard({ title, value, caption }: { title: string; value: string | React.ReactNode; caption: string }) {
  return (
    <div className="mt-stat-card">
      <div className="mt-stat-header">
        <span className="mt-stat-label">{title}</span>
      </div>
      <div className="mt-stat-value">{value}</div>
      <div className="mt-stat-caption">{caption}</div>
    </div>
  );
}
