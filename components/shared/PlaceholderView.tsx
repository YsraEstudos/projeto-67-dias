import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PlaceholderProps {
    title: string;
    icon: LucideIcon;
}

const PlaceholderView: React.FC<PlaceholderProps> = ({ title, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 animate-in fade-in duration-700">
    <div className="p-8 bg-slate-800/50 rounded-full mb-6 border border-slate-700">
      <Icon size={64} strokeWidth={1.5} className="text-slate-600" />
    </div>
    <h2 className="text-2xl font-bold text-slate-300 mb-2">{title}</h2>
    <p className="text-slate-500 bg-slate-800/50 px-4 py-2 rounded-full text-sm border border-slate-700/50">
      Módulo em desenvolvimento
    </p>
  </div>
);

export default PlaceholderView;