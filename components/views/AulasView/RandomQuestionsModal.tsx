import React from "react";
import { RefreshCw, Sparkles, X } from "lucide-react";
import { AulaBook } from "../../../types";
import { buildRandomQuestionPool, drawRandomQuestions, RandomQuestionItem } from "./randomQuestions";

interface RandomQuestionsModalProps {
  books: AulaBook[];
  onClose: () => void;
}

export default function RandomQuestionsModal({ books, onClose }: RandomQuestionsModalProps) {
  const totalQuestions = React.useMemo(() => buildRandomQuestionPool(books).length, [books]);
  const [questions, setQuestions] = React.useState<RandomQuestionItem[]>(() => drawRandomQuestions(books));

  const redrawQuestions = React.useCallback(() => {
    setQuestions(drawRandomQuestions(books));
  }, [books]);

  React.useEffect(() => {
    redrawQuestions();
  }, [redrawQuestions]);

  return (
    <div className="fixed inset-0 bg-slate-950/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-3xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/40 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#D4AF37] mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Treino rapido</span>
            </div>
            <h2 className="text-2xl font-serif italic text-slate-100">Questões aleatórias</h2>
            <p className="text-xs text-slate-400 mt-1">
              15 questões sorteadas de conteúdos variados, com no máximo 3 do mesmo conteúdo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-850 transition-colors"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {totalQuestions === 0 ? (
            <div className="text-center py-14 border border-dashed border-slate-800 rounded-lg bg-slate-950/30">
              <Sparkles className="w-8 h-8 text-slate-650 mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-medium">Nenhuma questão encontrada na estante.</p>
              <p className="text-xs text-slate-500 mt-1">
                As questões aparecem aqui quando as aulas tiverem vínculos em questões principais, seções ou secundárias.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="bg-slate-950/50 border border-slate-800 rounded p-3">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Selecionadas</span>
                  <strong className="block text-xl text-slate-100 mt-1">{questions.length}</strong>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 rounded p-3">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Disponiveis</span>
                  <strong className="block text-xl text-slate-100 mt-1">{totalQuestions}</strong>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 rounded p-3">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Limite por conteudo</span>
                  <strong className="block text-xl text-slate-100 mt-1">3</strong>
                </div>
              </div>

              <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="flex items-start gap-3 bg-slate-950/40 border border-slate-800 hover:border-slate-700 rounded p-3 transition-colors"
                  >
                    <div className="w-8 h-8 shrink-0 rounded bg-[#D4AF37] text-slate-950 flex items-center justify-center text-[10px] font-black">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-100 font-medium leading-snug">
                        Questão {question.questionNumber} <span className="text-[#D4AF37]">{question.chapterTitle}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 truncate">
                        {question.bookTitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
            Mostrando apenas numero da questao e titulo geral da aula.
          </span>
          <button
            type="button"
            onClick={redrawQuestions}
            disabled={totalQuestions === 0}
            className="inline-flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#C2A032] disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Sortear de novo
          </button>
        </div>
      </div>
    </div>
  );
}

