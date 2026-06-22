import React from "react";
import { BookCheck, Check, History, RefreshCw, Sparkles, X, Zap } from "lucide-react";
import { AulaBook } from "../../../types";
import {
  buildRandomQuestionPool,
  drawRandomQuestions,
  QuestionHistoryFilter,
  RandomQuestionItem,
} from "./randomQuestions";

type QuestionStatus = "correct" | "incorrect" | "pending";

interface RandomQuestionsModalProps {
  books: AulaBook[];
  onClose: () => void;
  onSetQuestionStatus: (question: RandomQuestionItem, status: QuestionStatus) => void;
}

export default function RandomQuestionsModal({ books, onClose, onSetQuestionStatus }: RandomQuestionsModalProps) {
  const [onlyReadContent, setOnlyReadContent] = React.useState(false);
  const [historyFilter, setHistoryFilter] = React.useState<QuestionHistoryFilter>("all");
  const allQuestionsCount = React.useMemo(() => buildRandomQuestionPool(books).length, [books]);
  const totalQuestions = React.useMemo(
    () => buildRandomQuestionPool(books, onlyReadContent, historyFilter).length,
    [books, onlyReadContent, historyFilter],
  );
  const [questions, setQuestions] = React.useState<RandomQuestionItem[]>(() => drawRandomQuestions(books));
  const [sessionStatuses, setSessionStatuses] = React.useState<Record<string, QuestionStatus>>({});

  const redrawQuestions = React.useCallback(() => {
    setQuestions(drawRandomQuestions(books, 15, 3, onlyReadContent, historyFilter));
    setSessionStatuses({});
  }, [books, onlyReadContent, historyFilter]);

  const toggleOnlyReadContent = () => {
    const nextOnlyReadContent = !onlyReadContent;
    setOnlyReadContent(nextOnlyReadContent);
    setQuestions(drawRandomQuestions(books, 15, 3, nextOnlyReadContent, historyFilter));
    setSessionStatuses({});
  };

  const toggleHistoryFilter = (filter: Exclude<QuestionHistoryFilter, "all">) => {
    const nextHistoryFilter = historyFilter === filter ? "all" : filter;
    setHistoryFilter(nextHistoryFilter);
    setQuestions(drawRandomQuestions(books, 15, 3, onlyReadContent, nextHistoryFilter));
    setSessionStatuses({});
  };

  const getQuestionStatus = (question: RandomQuestionItem): QuestionStatus => {
    if (Object.prototype.hasOwnProperty.call(sessionStatuses, question.id)) {
      return sessionStatuses[question.id];
    }

    const chapter = books
      .find((book) => book.id === question.bookId)
      ?.chapters?.find((item) => item.id === question.chapterId);

    if (!chapter) return "pending";

    const latestAttempt = chapter.questionAttempts?.[question.questionNumber.toString()]?.history?.[0];
    if (!latestAttempt) return "pending";

    const attemptDate = new Date(latestAttempt.timestamp);
    const today = new Date();
    const wasAnsweredToday =
      attemptDate.getFullYear() === today.getFullYear() &&
      attemptDate.getMonth() === today.getMonth() &&
      attemptDate.getDate() === today.getDate();

    return wasAnsweredToday ? latestAttempt.status : "pending";
  };

  const setQuestionStatus = (question: RandomQuestionItem, status: QuestionStatus) => {
    setSessionStatuses((current) => ({ ...current, [question.id]: status }));
    onSetQuestionStatus(question, status);
  };

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
          {allQuestionsCount === 0 ? (
            <div className="text-center py-14 border border-dashed border-slate-800 rounded-lg bg-slate-950/30">
              <Sparkles className="w-8 h-8 text-slate-650 mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-medium">Nenhuma questão encontrada na estante.</p>
              <p className="text-xs text-slate-500 mt-1">
                As questões aparecem aqui quando as aulas tiverem vínculos em questões principais, seções ou secundárias.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-slate-950/50 border border-slate-800 rounded p-3">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Selecionadas</span>
                  <strong className="block text-xl text-slate-100 mt-1">{questions.length}</strong>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 rounded p-3">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Disponiveis</span>
                  <strong className="block text-xl text-slate-100 mt-1">{totalQuestions}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <button
                  type="button"
                  onClick={toggleOnlyReadContent}
                  className={`group relative overflow-hidden p-3 rounded-lg border text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                    onlyReadContent
                      ? "bg-emerald-950/50 border-emerald-500/80 text-emerald-300 shadow-emerald-950/60"
                      : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                  aria-pressed={onlyReadContent}
                  title="Sortear somente questões de aulas marcadas como lidas"
                >
                  <span className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-[500%]" />
                  <span className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold">
                    <BookCheck className={`w-4 h-4 transition-transform duration-300 ${onlyReadContent ? "scale-110 -rotate-6" : "group-hover:scale-110"}`} />
                    Apenas conteúdos lidos
                  </span>
                  <strong className="block text-sm mt-2">
                    {onlyReadContent ? "Filtro ativado" : "Ativar filtro"}
                  </strong>
                </button>
                <button
                  type="button"
                  onClick={() => toggleHistoryFilter("unanswered")}
                  className={`group relative overflow-hidden p-3 rounded-lg border text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                    historyFilter === "unanswered"
                      ? "bg-sky-950/50 border-sky-500/80 text-sky-300 shadow-sky-950/60"
                      : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-sky-800 hover:text-sky-300"
                  }`}
                  aria-pressed={historyFilter === "unanswered"}
                  title="Sortear somente questões nunca respondidas"
                >
                  <span className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-[500%]" />
                  <span className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold">
                    <Zap className={`w-4 h-4 transition-transform duration-300 ${historyFilter === "unanswered" ? "scale-110 -rotate-6" : "group-hover:scale-110"}`} />
                    Nunca respondidas
                  </span>
                  <strong className="block text-sm mt-2">
                    {historyFilter === "unanswered" ? "Filtro ativado" : "Ativar filtro"}
                  </strong>
                </button>
                <button
                  type="button"
                  onClick={() => toggleHistoryFilter("answered")}
                  className={`group relative overflow-hidden p-3 rounded-lg border text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                    historyFilter === "answered"
                      ? "bg-violet-950/50 border-violet-500/80 text-violet-300 shadow-violet-950/60"
                      : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-violet-800 hover:text-violet-300"
                  }`}
                  aria-pressed={historyFilter === "answered"}
                  title="Sortear somente questões já respondidas"
                >
                  <span className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-[500%]" />
                  <span className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold">
                    <History className={`w-4 h-4 transition-transform duration-300 ${historyFilter === "answered" ? "scale-110 -rotate-12" : "group-hover:-rotate-12"}`} />
                    Já respondidas
                  </span>
                  <strong className="block text-sm mt-2">
                    {historyFilter === "answered" ? "Filtro ativado" : "Ativar filtro"}
                  </strong>
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800 rounded bg-slate-950/30">
                  <BookCheck className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-300 font-medium">Nenhuma questão em conteúdos lidos.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Marque aulas como lidas ou desative o filtro para sortear novamente.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {questions.map((question, index) => {
                  const status = getQuestionStatus(question);

                  return (
                    <div
                      key={question.id}
                      className={`flex items-start gap-3 border rounded p-3 transition-colors ${
                        status === "correct"
                          ? "bg-emerald-950/20 border-emerald-800/60"
                          : status === "incorrect"
                            ? "bg-rose-950/20 border-rose-800/60"
                            : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                      }`}
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
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setQuestionStatus(question, status === "correct" ? "pending" : "correct")}
                        className={`w-9 h-9 rounded border flex items-center justify-center transition-colors ${
                          status === "correct"
                            ? "bg-emerald-500 border-emerald-400 text-slate-950"
                            : "bg-slate-900 border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-700"
                        }`}
                        title={status === "correct" ? "Remover acerto" : "Marcar como acertada"}
                        aria-label={status === "correct" ? "Remover acerto" : "Marcar como acertada"}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuestionStatus(question, status === "incorrect" ? "pending" : "incorrect")}
                        className={`w-9 h-9 rounded border flex items-center justify-center transition-colors ${
                          status === "incorrect"
                            ? "bg-rose-500 border-rose-400 text-slate-950"
                            : "bg-slate-900 border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-700"
                        }`}
                        title={status === "incorrect" ? "Remover erro" : "Marcar como errada"}
                        aria-label={status === "incorrect" ? "Remover erro" : "Marcar como errada"}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  );
                  })}
                </div>
              )}
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
