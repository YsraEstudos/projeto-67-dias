import React from 'react';

export const Loading: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-64 w-full">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-4 text-slate-500 text-sm animate-pulse">Carregando módulo...</p>
  </div>
);