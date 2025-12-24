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
  // Map color classes to glow colors
  const glowMap: Record<string, string> = {
    'text-orange-500': 'hover:shadow-orange-500/20',
    'text-orange-400': 'hover:shadow-orange-400/20',
    'text-pink-500': 'hover:shadow-pink-500/20',
    'text-indigo-400': 'hover:shadow-indigo-400/20',
    'text-yellow-500': 'hover:shadow-yellow-500/20',
    'text-emerald-400': 'hover:shadow-emerald-400/20',
    'text-purple-500': 'hover:shadow-purple-500/20',
    'text-purple-400': 'hover:shadow-purple-400/20',
    'text-teal-500': 'hover:shadow-teal-500/20',
    'text-cyan-400': 'hover:shadow-cyan-400/20',
    'text-slate-400': 'hover:shadow-slate-400/20',
  };

  // Tailwind purge-safe background colors matching the text accents
  const bgMap: Record<string, string> = {
    'text-orange-500': 'bg-orange-500',
    'text-orange-400': 'bg-orange-400',
    'text-pink-500': 'bg-pink-500',
    'text-indigo-400': 'bg-indigo-400',
    'text-yellow-500': 'bg-yellow-500',
    'text-emerald-400': 'bg-emerald-400',
    'text-purple-500': 'bg-purple-500',
    'text-purple-400': 'bg-purple-400',
    'text-teal-500': 'bg-teal-500',
    'text-cyan-400': 'bg-cyan-400',
    'text-slate-400': 'bg-slate-400',
  };

  const glowClass = glowMap[color] || 'hover:shadow-cyan-500/20';
  const accentBgClass = bgMap[color] || 'bg-cyan-500';

  return (
    <div
      onClick={() => onClick(id)}
      className={`
        group relative overflow-hidden
        bg-gradient-to-br from-slate-800/80 to-slate-900/80 
        hover:from-slate-800/90 hover:to-slate-900/90
        border border-slate-700/50 hover:border-slate-600/80 
        rounded-2xl p-6 cursor-pointer 
        transition-all duration-500 ease-out 
        hover:scale-[1.03] hover:-translate-y-1
        hover:shadow-2xl ${glowClass}
        backdrop-blur-sm 
        flex flex-col justify-between min-h-[100px] h-auto py-4 sm:h-40
        animate-fade-in-up
        touch-manipulation
      `}
      style={{ animationDelay: `${(id.charCodeAt(0) % 10) * 20}ms` }}
    >
      {/* Animated gradient border on hover */}
      <div className="absolute inset-0 rounded-2xl p-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-pink-500/50 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />
      </div>

      {/* Background gradient glow */}
      <div className={`absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-30 transition-all duration-700 blur-xl pointer-events-none ${accentBgClass}`} />

      {/* Content */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* Icon container with premium effects */}
          <div className={`relative p-3 rounded-xl bg-slate-900/70 ${color} bg-opacity-20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            {/* Icon glow ring */}
            <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 ${accentBgClass} blur-md`} />
            <Icon size={28} className={`relative z-10 ${color} transition-transform duration-300 group-hover:scale-105`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-400 font-medium mt-0.5 transition-colors duration-300 group-hover:text-slate-300">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {stats && (
        <div className="relative z-10 flex justify-end items-center">
          <span className="text-xs font-mono text-slate-500 bg-slate-900/70 px-3 py-1.5 rounded-lg border border-slate-700/50 group-hover:border-slate-600 group-hover:text-slate-300 transition-all duration-300">
            {stats}
          </span>
        </div>
      )}

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
      </div>

      {/* Corner accent */}
      <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-700 blur-2xl ${accentBgClass}`} />
    </div>
  );
});

Card.displayName = 'Card';