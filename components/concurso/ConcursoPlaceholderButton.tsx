import React, { useMemo, useState } from 'react';
import { ExternalLink, FileText, Search, Trophy, CheckCircle2, Circle, BarChart3 } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { stripMarkdown } from '../../utils/markdownPreview';
import { CONCURSO_APP_URL } from './constants';

import analiseFccTiRaw from '../../CONCURSO/Notas de corte/Analise_Notas_Corte_FCC_TI.md?raw';
import planoCorrecaoRaw from '../../CONCURSO/Notas de corte/Plano_de_Correcao_TI.md?raw';
import analiseTiRaw from '../../CONCURSO/Notas de corte/Analise_Notas_Corte_TI.md?raw';

type ConcursoDoc = {
  id: string;
  title: string;
  category: string;
  filePath: string;
  content: string;
};

const concursoDocs: ConcursoDoc[] = [
  {
    id: 'analise-fcc-ti',
    title: 'Análise de Notas de Corte FCC - TI',
    category: 'Notas de corte',
    filePath: 'CONCURSO/Notas de corte/Analise_Notas_Corte_FCC_TI.md',
    content: analiseFccTiRaw,
  },
  {
    id: 'plano-correcao-ti',
    title: 'Plano de Correção - TI',
    category: 'Planejamento',
    filePath: 'CONCURSO/Notas de corte/Plano_de_Correcao_TI.md',
    content: planoCorrecaoRaw,
  },
  {
    id: 'analise-ti',
    title: 'Análise de Notas de Corte - TI',
    category: 'Notas de corte',
    filePath: 'CONCURSO/Notas de corte/Analise_Notas_Corte_TI.md',
    content: analiseTiRaw,
  },
];

const getInitialCheckedState = () => {
  return concursoDocs.reduce<Record<string, boolean>>((acc, doc) => {
    acc[doc.id] = false;
    return acc;
  }, {});
};

export const ConcursoPlaceholderButton: React.FC = () => {
  const [query, setQuery] = useState('');
  const [completedMap, setCompletedMap] = useLocalStorage<Record<string, boolean>>(
    'concurso-docs-progress',
    getInitialCheckedState()
  );

  const filteredDocs = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return concursoDocs;

    return concursoDocs.filter((doc) => {
      const preview = stripMarkdown(doc.content).toLowerCase();
      return (
        doc.title.toLowerCase().includes(normalized) ||
        doc.category.toLowerCase().includes(normalized) ||
        preview.includes(normalized)
      );
    });
  }, [query]);

  const totalDocs = concursoDocs.length;
  const completedCount = concursoDocs.filter((doc) => completedMap[doc.id]).length;
  const completionPercent = Math.round((completedCount / totalDocs) * 100);

  const handleToggleComplete = (docId: string) => {
    setCompletedMap((current) => ({
      ...getInitialCheckedState(),
      ...current,
      [docId]: !current[docId],
    }));
  };

  return (
    <section className="space-y-4">
      <div
        className={`
        group relative overflow-hidden
        bg-gradient-to-br from-slate-800/80 to-slate-900/80 
        hover:from-slate-800/90 hover:to-slate-900/90
        border border-slate-700/50 hover:border-slate-600/80 
        rounded-2xl p-6
        transition-all duration-500 ease-out 
        hover:scale-[1.01] hover:-translate-y-0.5
        hover:shadow-2xl hover:shadow-purple-400/20
        backdrop-blur-sm 
        flex flex-col justify-between min-h-[100px] h-auto py-4
        animate-fade-in-up
        touch-manipulation
      `}
      >
        <div className="absolute inset-0 rounded-2xl p-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-pink-500/50 animate-gradient-shift"
            style={{ backgroundSize: '200% 200%' }}
          />
        </div>

        <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-30 transition-all duration-700 blur-xl pointer-events-none bg-purple-400" />

        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="relative p-3 rounded-xl bg-slate-900/70 text-purple-400 bg-opacity-20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 bg-purple-400 blur-md" />
              <Trophy size={28} className="relative z-10 text-purple-400 transition-transform duration-300 group-hover:scale-105" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-100 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
                Concurso
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5 transition-colors duration-300 group-hover:text-slate-300">
                Materiais carregados e prontos para revisão
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-2">
            <BarChart3 size={16} className="text-purple-300" />
            <span className="text-slate-300">{completedCount}/{totalDocs} concluídos ({completionPercent}%)</span>
          </div>
        </div>

        <div className="relative z-10 mt-4 h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-700"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none">
          <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
        </div>

        <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-700 blur-2xl bg-purple-400" />
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">App principal</p>
            <p className="mt-1 text-sm text-slate-300">Abrir o painel TRT 4 com dashboard, plano diário, conteúdo e metas.</p>
          </div>
          <button
            type="button"
            onClick={() => window.location.assign(CONCURSO_APP_URL)}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/20"
          >
            Abrir sistema do concurso
            <ExternalLink size={15} />
          </button>
        </div>

        <label className="relative block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título, categoria ou conteúdo..."
            className="w-full bg-slate-950/70 border border-slate-700 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
          />
        </label>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredDocs.map((doc) => (
            <article key={doc.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-sm sm:text-base font-semibold text-slate-100 truncate">{doc.title}</h4>
                  <p className="text-xs text-slate-400">{doc.category}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleComplete(doc.id)}
                  className="text-slate-300 hover:text-emerald-300 transition-colors"
                  aria-label={completedMap[doc.id] ? 'Marcar como pendente' : 'Marcar como concluído'}
                >
                  {completedMap[doc.id] ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Circle size={18} />}
                </button>
              </header>

              <p className="text-xs text-slate-300 line-clamp-3">{stripMarkdown(doc.content)}</p>

              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <FileText size={13} />
                  Arquivo local
                </span>

                <a
                  href={new URL(`../../${doc.filePath}`, import.meta.url).href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200"
                >
                  Abrir arquivo
                  <ExternalLink size={13} />
                </a>
              </div>
            </article>
          ))}
        </div>

        {filteredDocs.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">Nenhum material encontrado para a busca informada.</p>
        )}
      </div>
    </section>
  );
};
