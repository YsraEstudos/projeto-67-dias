import React from 'react';
import {
    Code, Palette, MessageSquare, FileText, Lightbulb, Bot, Wand2, Zap,
    Briefcase, GraduationCap, Heart, Music, Gamepad2, Globe, Camera,
    ShoppingCart, Megaphone, Calculator, Bookmark, Coffee, Rocket, Target,
    Users, Shield, Wrench, PenTool, Layers, Terminal, Database, Cpu
} from 'lucide-react';

export const categoryIcons: Record<string, React.ReactNode> = {
    'code': <Code size={14} />,
    'creative': <Palette size={14} />,
    'chat': <MessageSquare size={14} />,
    'writing': <FileText size={14} />,
    'ideas': <Lightbulb size={14} />,
    'ai': <Bot size={14} />,
    'magic': <Wand2 size={14} />,
    'default': <Zap size={14} />,
    // New icons
    'business': <Briefcase size={14} />,
    'education': <GraduationCap size={14} />,
    'health': <Heart size={14} />,
    'music': <Music size={14} />,
    'gaming': <Gamepad2 size={14} />,
    'web': <Globe size={14} />,
    'photo': <Camera size={14} />,
    'shopping': <ShoppingCart size={14} />,
    'marketing': <Megaphone size={14} />,
    'math': <Calculator size={14} />,
    'bookmark': <Bookmark size={14} />,
    'productivity': <Coffee size={14} />,
    'startup': <Rocket size={14} />,
    'goals': <Target size={14} />,
    'social': <Users size={14} />,
    'security': <Shield size={14} />,
    'tools': <Wrench size={14} />,
    'design': <PenTool size={14} />,
    'layers': <Layers size={14} />,
    'terminal': <Terminal size={14} />,
    'database': <Database size={14} />,
    'hardware': <Cpu size={14} />,
};

export const colorClasses: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    slate: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', badge: 'bg-slate-500/20 text-slate-300' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
    rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-300' },
    pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', badge: 'bg-pink-500/20 text-pink-300' },
};
