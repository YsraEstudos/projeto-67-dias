/**
 * Site Category Constants
 * Extracted from SiteCategoryModal.tsx to allow proper code-splitting
 */
import React from 'react';
import {
    Layout, LayoutGrid, Folder, Star, Globe, Briefcase, GraduationCap,
    Heart, Music, Gamepad2, Code, Camera, ShoppingBag, TrendingUp,
    Calculator, Bookmark, Zap, Rocket, Target, Users, Shield,
    Wrench, Palette, Layers, Terminal, Database, Cpu
} from 'lucide-react';

// Site-specific icons
export const siteIcons: Record<string, React.ReactNode> = {
    layout: <Layout size={ 16} />,
grid: <LayoutGrid size={ 16 } />,
folder: <Folder size={ 16 } />,
star: <Star size={ 16 } />,
globe: <Globe size={ 16 } />,
briefcase: <Briefcase size={ 16 } />,
education: <GraduationCap size={ 16 } />,
health: <Heart size={ 16 } />,
music: <Music size={ 16 } />,
gaming: <Gamepad2 size={ 16 } />,
code: <Code size={ 16 } />,
photo: <Camera size={ 16 } />,
shopping: <ShoppingBag size={ 16 } />,
marketing: <TrendingUp size={ 16 } />,
math: <Calculator size={ 16 } />,
bookmark: <Bookmark size={ 16 } />,
productivity: <Zap size={ 16 } />,
startup: <Rocket size={ 16 } />,
goals: <Target size={ 16 } />,
social: <Users size={ 16 } />,
security: <Shield size={ 16 } />,
tools: <Wrench size={ 16 } />,
design: <Palette size={ 16 } />,
layers: <Layers size={ 16 } />,
terminal: <Terminal size={ 16 } />,
database: <Database size={ 16 } />,
hardware: <Cpu size={ 16 } />,
};

export const siteColorClasses: Record<string, { bg: string; text: string; border: string }> = {
    slate: { bg: 'bg-slate-500', text: 'text-slate-400', border: 'border-slate-500' },
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500' },
    rose: { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500' },
    cyan: { bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500' },
    pink: { bg: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500' },
};

export const siteIconNames = Object.keys(siteIcons);
export const siteColorNames = Object.keys(siteColorClasses);
