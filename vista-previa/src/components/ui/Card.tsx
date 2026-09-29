import React from 'react';

export function StatCard({ title, value, caption }: { title: React.ReactNode; value: React.ReactNode; caption: React.ReactNode }) {
  return (
    <div className="mt-stat-card">
      <div className="mt-stat-header" style={{ width: '100%' }}>
        <span className="mt-stat-label" style={{ width: '100%' }}>{title}</span>
      </div>
      <div className="mt-stat-value">{value}</div>
      <div className="mt-stat-caption">{caption}</div>
    </div>
  );
}
