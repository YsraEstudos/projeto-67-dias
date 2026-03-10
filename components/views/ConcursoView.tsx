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

      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-400/80">Modulo externo</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-100">Painel do concurso integrado ao Projeto 67 Dias</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Este atalho leva voce direto para o site do concurso com dashboard, plano diario, conteudo, anki e metas.
        </p>
      </div>
      <ConcursoPlaceholderButton />
    </div>
  );
};

export default ConcursoView;
