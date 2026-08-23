import React, { useState, useMemo } from 'react';
import { DUO_THEORY_DATABASE } from '../data/theoryDatabase';
import { DuoTheory } from '../types';
import { Search, BookOpen, Play, Copy, Check, Sparkles, AlertTriangle, ArrowRight, Tag } from 'lucide-react';
import { playDuoSound } from '../utils/soundEffects';

interface TheoryWikiViewProps {
  initialSearchQuery?: string;
  onPracticeConcept: (conceptId: string) => void;
}

const CATEGORIES = [
  'Todos',
  'Fundamentos',
  'Controle de Fluxo',
  'Funções',
  'Coleções & Arrays',
  'POO & Protótipos',
  'Assíncrono',
  'DOM & Web',
  'Avançado',
] as const;

export const TheoryWikiView: React.FC<TheoryWikiViewProps> = ({
  initialSearchQuery = '',
  onPracticeConcept,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [activeTheoryId, setActiveTheoryId] = useState<string>(
    DUO_THEORY_DATABASE[0]?.id || ''
  );
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [sandboxOutputs, setSandboxOutputs] = useState<Record<number, string>>({});

  // Filter theories
  const filteredTheories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return DUO_THEORY_DATABASE.filter((t) => {
      const matchesCategory =
        selectedCategory === 'Todos' || t.category === selectedCategory;

      if (!matchesCategory) return false;
      if (!query) return true;

      const inTitle = t.title.toLowerCase().includes(query);
      const inSummary = t.summary.toLowerCase().includes(query);
      const inWhat = t.whatIsIt.toLowerCase().includes(query);
      const inTags = t.tags.some((tag) => tag.toLowerCase().includes(query));
      const inConcept = t.conceptId.toLowerCase().includes(query);

      return inTitle || inSummary || inWhat || inTags || inConcept;
    });
  }, [searchQuery, selectedCategory]);

  const activeTheory = useMemo(() => {
    return (
      filteredTheories.find((t) => t.id === activeTheoryId) ||
      filteredTheories[0] ||
      DUO_THEORY_DATABASE[0]
    );
  }, [filteredTheories, activeTheoryId]);

  // Copy code helper
  const handleCopyCode = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeIndex(index);
      playDuoSound('gem');
      setTimeout(() => setCopiedCodeIndex(null), 2000);
    } catch {
      // ignore
    }
  };

  // Safe client-side JS Sandbox runner
  const handleRunCode = (code: string, index: number) => {
    playDuoSound('click');
    const logs: string[] = [];

    // Capture console.log
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    try {
      console.log = (...args: unknown[]) => {
        logs.push(
          args
            .map((arg) =>
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            )
            .join(' ')
        );
      };
      console.error = (...args: unknown[]) => {
        logs.push('[Erro]: ' + args.join(' '));
      };
      console.warn = (...args: unknown[]) => {
        logs.push('[Aviso]: ' + args.join(' '));
      };

      // Execute code in a scoped function
      // eslint-disable-next-line no-new-func
      const runner = new Function(code);
      runner();

      if (logs.length === 0) {
        logs.push('(Código executado com sucesso sem chamadas a console.log)');
      }
      setSandboxOutputs((prev) => ({ ...prev, [index]: logs.join('\n') }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSandboxOutputs((prev) => ({ ...prev, [index]: `⚠️ Erro: ${msg}` }));
    } finally {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Top Search & Filter Bar */}
      <div className="mb-6 space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="text-[#1cb0f6]" /> Enciclopédia & Dicionário JS
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pesquise qualquer conceito JavaScript, entenda a teoria profunda e execute exemplos na hora.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar (ex: var, let, closure, event loop)..."
              className="w-full bg-[#161f2e] border-2 border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-[#1cb0f6] transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  playDuoSound('click');
                  setSelectedCategory(cat);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                  isSelected
                    ? 'bg-[#1cb0f6] text-white border-[#1cb0f6] shadow-md shadow-sky-500/20'
                    : 'bg-[#161f2e] text-slate-400 border-slate-700/80 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Split (List on Left, Detailed Article on Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">
        {/* Left Side: Theory Cards Index */}
        <div className="lg:col-span-4 flex flex-col space-y-3 overflow-y-auto pr-1 custom-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            {filteredTheories.length} artigo{filteredTheories.length !== 1 ? 's' : ''} encontrado{filteredTheories.length !== 1 ? 's' : ''}
          </span>

          {filteredTheories.length === 0 ? (
            <div className="p-8 text-center bg-[#161f2e] border-2 border-slate-800 rounded-3xl space-y-2">
              <p className="text-sm font-bold text-slate-300">Nenhum conceito encontrado</p>
              <p className="text-xs text-slate-500">Tente buscar por termos como "var", "let", "map" ou "promessa".</p>
            </div>
          ) : (
            filteredTheories.map((theory) => {
              const isSelected = activeTheory?.id === theory.id;
              return (
                <div
                  key={theory.id}
                  onClick={() => {
                    playDuoSound('click');
                    setActiveTheoryId(theory.id);
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col space-y-2 ${
                    isSelected
                      ? 'bg-sky-950/40 border-[#1cb0f6] shadow-lg shadow-sky-500/10'
                      : 'bg-[#161f2e] border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {theory.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">#{theory.conceptId}</span>
                  </div>
                  <h3 className="font-extrabold text-sm text-white leading-snug">{theory.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{theory.summary}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Detailed Theory View */}
        <div className="lg:col-span-8 bg-[#131f31] border-2 border-slate-800 rounded-3xl p-5 sm:p-7 overflow-y-auto custom-scrollbar flex flex-col space-y-6 shadow-2xl">
          {activeTheory ? (
            <>
              {/* Header */}
              <div className="border-b border-slate-800/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {activeTheory.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ID: {activeTheory.conceptId}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white mt-2 leading-tight">
                    {activeTheory.title}
                  </h1>
                </div>

                {/* Direct Practice Button */}
                <button
                  onClick={() => {
                    playDuoSound('click');
                    onPracticeConcept(activeTheory.conceptId);
                  }}
                  className="bg-[#58cc02] hover:bg-[#46a302] active:translate-y-1 shadow-[0_4px_0_#46a302] text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shrink-0 self-start sm:self-center"
                >
                  <Sparkles size={16} />
                  <span>Praticar Lição</span>
                </button>
              </div>

              {/* Summary Pill */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                💡 <strong>Em resumo:</strong> {activeTheory.summary}
              </div>

              {/* What is it Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-sky-400 flex items-center gap-2">
                  <BookOpen size={16} /> O que é e Como Funciona?
                </h3>
                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-[#0e1726] p-4 rounded-2xl border border-slate-800">
                  {activeTheory.whatIsIt}
                </div>
              </div>

              {/* Why it Matters Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Sparkles size={16} /> Por que isso é importante?
                </h3>
                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-[#0e1726] p-4 rounded-2xl border border-slate-800">
                  {activeTheory.whyItMatters}
                </div>
              </div>

              {/* Comparison Table if available */}
              {activeTheory.comparison && (
                <div className="space-y-3">
                  <h3 className="text-sm font-black uppercase tracking-wider text-purple-400">
                    📊 Tabela Comparativa Detalhada
                  </h3>
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs border-collapse bg-[#0e1726]">
                      <thead>
                        <tr className="bg-slate-800/80 text-white font-black border-b border-slate-700">
                          {activeTheory.comparison.headers.map((h, idx) => (
                            <th key={idx} className="p-3">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                        {activeTheory.comparison.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-800/30 transition">
                            <td className="p-3 font-bold text-amber-300">{row.feature}</td>
                            {activeTheory.comparison?.headers.slice(1).map((headerKey) => (
                              <td key={headerKey} className="p-3 text-slate-200">
                                {row.values[headerKey] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Code Examples with Live Sandbox */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Play size={16} /> Exemplos de Código & Playground Interativo
                </h3>

                <div className="space-y-4">
                  {activeTheory.codeExamples.map((ex, eIdx) => {
                    const isCopied = copiedCodeIndex === eIdx;
                    const output = sandboxOutputs[eIdx];

                    return (
                      <div
                        key={eIdx}
                        className="bg-slate-950 border-2 border-slate-800 rounded-2xl overflow-hidden shadow-xl"
                      >
                        <div className="bg-[#182232] px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs">
                          <span className="font-bold text-slate-300">{ex.title}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyCode(ex.code, eIdx)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-[11px] transition flex items-center gap-1"
                              title="Copiar código para a área de transferência"
                            >
                              {isCopied ? (
                                <>
                                  <Check size={12} className="text-emerald-400" />
                                  <span className="text-emerald-400">Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  <span>Copiar</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleRunCode(ex.code, eIdx)}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-[11px] transition flex items-center gap-1 shadow-sm"
                              title="Executar código neste navegador agora"
                            >
                              <Play size={11} className="fill-slate-950" />
                              <span>Executar</span>
                            </button>
                          </div>
                        </div>

                        <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto custom-scrollbar leading-relaxed">
                          {ex.code}
                        </pre>

                        {output !== undefined && (
                          <div className="border-t border-slate-800 bg-[#0c1421] p-3 text-xs font-mono text-slate-200">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase mb-1">
                              <span>Console de Saída:</span>
                              <button
                                onClick={() =>
                                  setSandboxOutputs((prev) => {
                                    const next = { ...prev };
                                    delete next[eIdx];
                                    return next;
                                  })
                                }
                                className="text-slate-500 hover:text-slate-300"
                              >
                                Limpar
                              </button>
                            </div>
                            <pre className="text-amber-300 whitespace-pre-wrap">{output}</pre>
                          </div>
                        )}

                        <div className="bg-slate-900/60 p-3 text-[11px] text-slate-400 border-t border-slate-800/80">
                          {ex.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pitfalls & Gotchas */}
              {activeTheory.pitfalls.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
                    <AlertTriangle size={16} /> Armadilhas Comuns & Cuidado
                  </h3>
                  <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4 space-y-2 text-xs text-rose-200 leading-relaxed">
                    {activeTheory.pitfalls.map((pitfall, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{pitfall}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags & Related Concepts */}
              <div className="border-t border-slate-800 pt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Tag size={12} /> Tags:
                </span>
                {activeTheory.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      playDuoSound('click');
                      setSearchQuery(tag);
                    }}
                    className="text-[11px] font-mono font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-xl border border-slate-700 transition"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Selecione um artigo na lista à esquerda para ler a teoria completa.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
