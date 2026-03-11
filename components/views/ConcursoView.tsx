import React, { useState } from 'react';
import { BookOpenText, Swords } from 'lucide-react';
import { CompetitionArena } from '../concurso/CompetitionArena';
import { ConcursoPlaceholderButton } from '../concurso/ConcursoPlaceholderButton';

const ConcursoView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'competicao' | 'materiais'>('competicao');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <section className="rounded-[2rem] border border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.12),transparent_26%),linear-gradient(140deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-6 shadow-[0_24px_80px_rgba(2,6,23,0.65)] sm:p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-cyan-300/80">Modulo concurso</p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black text-white sm:text-4xl">Seu projeto agora tem um campeonato interno valendo ate o ultimo dia.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
              Entre na arena para disputar com rivais fortes, enxergar o maximo de pontos do dia e usar a pressao do ranking como combustivel. Quando precisar, a aba de materiais continua guardando o painel externo e os arquivos do concurso.
            </p>
          </div>

          <div className="inline-flex rounded-2xl border border-slate-700 bg-slate-950/70 p-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('competicao')}
              className={`inline-flex items-center gap-2 rounded-[1rem] px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === 'competicao'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Swords size={16} />
              Competicao
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('materiais')}
              className={`inline-flex items-center gap-2 rounded-[1rem] px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === 'materiais'
                  ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpenText size={16} />
              Materiais
            </button>
          </div>
        </div>
      </section>

      {activeTab === 'competicao' ? <CompetitionArena /> : <ConcursoPlaceholderButton />}
    </div>
  );
};

export default ConcursoView;
