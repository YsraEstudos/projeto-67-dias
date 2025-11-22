import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ViewState, DashboardCardProps } from '../types';

export const Card: React.FC<DashboardCardProps> = React.memo(({
  id,
  title,
  subtitle,
  icon: Icon,
  color,
  stats,
  onClick,
}) => {
  return (
    <div
      onClick={() => onClick(id)}
      className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-6 cursor-pointer transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-xl backdrop-blur-sm flex flex-col justify-between h-32 sm:h-40"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg bg-slate-900/50 ${color} bg-opacity-20`}>
            <Icon size={28} className={color} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100 group-hover:text-white transition-colors">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
      
      {stats && (
        <div className="flex justify-end items-center">
           <span className="text-xs font-mono text-slate-500 bg-slate-900/50 px-2 py-1 rounded">
            {stats}
           </span>
        </div>
      )}
      
      {/* Hover Glow Effect */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none bg-current ${color.replace('text-', 'bg-')}`} />
    </div>
  );
});

Card.displayName = 'Card';