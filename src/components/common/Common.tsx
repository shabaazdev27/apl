import React from 'react';

export const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string; key?: React.Key }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${className}`}>
    {children}
  </span>
);

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="text-[10px] font-mono text-text-muted uppercase tracking-[0.2em] whitespace-nowrap">
      {children}
    </span>
    <div className="h-px w-full bg-border" />
  </div>
);

export const MetricCard = ({ 
  label, 
  value, 
  delta, 
  color = "var(--color-accent)" 
}: { 
  label: string; 
  value: string | number; 
  delta: string; 
  color?: string 
}) => (
  <div className="bg-bg-card border border-border p-4 rounded-xl text-center relative overflow-hidden group">
    <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-50 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
    <div className="font-head text-2xl font-extrabold mb-1" style={{ color }}>{value}</div>
    <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">{label}</div>
    <div className="text-[10px] font-mono text-accent mt-1">{delta}</div>
  </div>
);
