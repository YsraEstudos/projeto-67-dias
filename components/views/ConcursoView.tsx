import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { ConcursoPlaceholderButton } from '../concurso/ConcursoPlaceholderButton';
import { useUIStore } from '../../stores';
import { ViewState } from '../../types';

const ConcursoView: React.FC = () => {
  const setActiveView = useUIStore((state) => state.setActiveView);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <button
        type="button"
        onClick={() => setActiveView(ViewState.DASHBOARD)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white"
      >
        <ArrowLeft size={16} />
        Voltar para o painel
      </button>

      <ConcursoPlaceholderButton />
    </div>
  );
};

export default ConcursoView;
