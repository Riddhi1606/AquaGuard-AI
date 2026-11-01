import React from 'react';
import { RiskCategory } from '../types';

interface RiskBadgeProps {
  category: RiskCategory | string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ category, score, size = 'md' }) => {
  const cat = (category || 'LOW').toUpperCase();

  let colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let dotColor = 'bg-emerald-400';

  if (cat === 'MODERATE') {
    colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    dotColor = 'bg-amber-400';
  } else if (cat === 'HIGH') {
    colorClasses = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    dotColor = 'bg-orange-400';
  } else if (cat === 'CRITICAL' || cat === 'EXTREME') {
    colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse';
    dotColor = 'bg-rose-500';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full border ${colorClasses} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      <span>{cat}</span>
      {score !== undefined && (
        <span className="opacity-75 font-mono">({score.toFixed(0)}%)</span>
      )}
    </span>
  );
};
