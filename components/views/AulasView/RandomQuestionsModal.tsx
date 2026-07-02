import React from "react";
import { AlertTriangle, BarChart3, BrainCircuit, Check, ChevronLeft, History, Play, RotateCcw, Sparkles, Target, TrendingDown, TrendingUp, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAulasStore } from "../../../stores/aulasStore";
import { AulaBook, SmartReviewAnswer, SmartReviewQuestion, SmartReviewSession } from "../../../types";
import { generateUUID } from "../../../utils/uuid";
import { buildSmartReviewPool, buildSmartReviewSummary, selectSmartReviewQuestions, SMART_REVIEW_MAX } from "./smartReview";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  books: AulaBook[];
  onClose: () => void;
  onSetQuestionStatus?: (question: any, status: "correct" | "incorrect" | "pending") => void;
}

type Screen = "setup" | "session" | "report" | "history";

const bucketLabel = { recovery: "Recuperação", maintenance: "Manutenção", new: "Inédita" };
const bucketClass = {
  recovery: "border-rose-700/60 bg-rose-950/30 text-rose-300",
  maintenance: "border-sky-700/60 bg-sky-950/30 text-sky-300",
  new: "border-violet-700/60 bg-violet-950/30 text-violet-300",
};

type SubjectQuestionGroup = {
  key: string;
  bookTitle: string;
  subject: string;
  total: number;
  recovery: number;
  maintenance: number;
  new: number;
  difficult: number;
  overdue: number;
  questions: SmartReviewQuestion[];
  submatters: Array<{ name: string; total: number; questions: number[] }>;
};

const SECONDARY_SUBMATTER = "Secundárias / conteúdo futuro";

const groupQuestionsBySubject = (questions: SmartReviewQuestion[]): SubjectQuestionGroup[] => {
  const groups = new Map<string, SubjectQuestionGroup & { submatterMap: Map<string, Set<number>> }>();

  questions.forEach((question) => {
    const key = `${question.bookId}:${question.chapterId}`;
    const group =
      groups.get(key) ||
      {
        key,
        bookTitle: question.bookTitle,
        subject: question.subject,
        total: 0,
        recovery: 0,
        maintenance: 0,
        new: 0,
        difficult: 0,
        overdue: 0,
        questions: [],
        submatters: [],
        submatterMap: new Map<string, Set<number>>(),
      };

    group.total += 1;
    group[question.bucket] += 1;
    if (question.difficult) group.difficult += 1;
    if (question.reviewOverdue) group.overdue += 1;
    group.questions.push(question);
    question.submatters.forEach((submatter) => {
      const numbers = group.submatterMap.get(submatter) || new Set<number>();
      numbers.add(question.questionNumber);
      group.submatterMap.set(submatter, numbers);
    });
    groups.set(key, group);
  });

  return [...groups.values()]
    .map(({ submatterMap, ...group }) => ({
      ...group,
      questions: group.questions.sort((a, b) => a.questionNumber - b.questionNumber),
      submatters: [...submatterMap.entries()]
        .map(([name, numbers]) => ({ name, total: numbers.size, questions: [...numbers].sort((a, b) => a - b) }))
        .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => b.total - a.total || a.subject.localeCompare(b.subject));
};

export default function RandomQuestionsModal({ books, onClose, onSetQuestionStatus }: Props) {
  const store = useAulasStore();
  const pool = React.useMemo(() => buildSmartReviewPool(books), [books]);
  const [count, setCount] = React.useState(Math.min(15, Math.max(1, pool.length)));
  const [screen, setScreen] = React.useState<Screen>(store.activeReviewSession ? "session" : "setup");
  const [report, setReport] = React.useState<SmartReviewSession | null>(null);
  const [clock, setClock] = React.useState(Date.now());
  const [showQuestionPreview, setShowQuestionPreview] = React.useState(false);
  const preview = React.useMemo(() => selectSmartReviewQuestions(books, count), [books, count]);

  const [activeTab, setActiveTab] = React.useState<"todo" | "solved" | "forecast">("todo");

  React.useEffect(() => {
    if (screen !== "session") return;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [screen]);

  const solvedToday = React.useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const solved: Array<SmartReviewQuestion & { latestAttempt: { status: "correct" | "incorrect"; timestamp: string } }> = [];

    books.forEach((book) => {
      (book.chapters || []).forEach((chapter) => {
        const attempts = chapter.questionAttempts || {};
        Object.entries(attempts).forEach(([qNumberStr, stats]) => {
          const qNumber = parseInt(qNumberStr, 10);
          const history = stats.history || [];
          if (history.length > 0) {
            const latest = history[0];
            if (latest.timestamp.startsWith(todayStr)) {
              const difficult = (chapter.difficultQuestions || []).includes(qNumber);
              const reviewOverdue = Boolean(chapter.nextReviewDate && chapter.nextReviewDate <= todayStr);
              
              const submatterSet = new Set<string>();
              const related = chapter.relatedQuestions;
              if (related) {
                if (related.questoes_principais?.includes(qNumber)) {}
                related.por_secao?.forEach((section) => {
                  if (section.questoes?.includes(qNumber)) submatterSet.add(section.secao);
                });
                if (related.questoes_secundarias_que_misturam_com_aulas_futuras?.includes(qNumber)) {
                  submatterSet.add(SECONDARY_SUBMATTER);
                }
              }

              const classifyCandidateLocal = (
                hist: any[],
                diff: boolean,
                overdue: boolean,
              ): any => {
                if (hist.length === 0) return "new";
                const incorrect = hist.filter((attempt) => attempt.status === "incorrect").length;
                const errorRate = incorrect / hist.length;
                const regressed = hist.length > 1 && hist[0].status === "incorrect" && hist[1].status === "correct";
                return hist[0].status === "incorrect" || errorRate >= 0.4 || diff || overdue || regressed
                  ? "recovery"
                  : "maintenance";
              };

              solved.push({
                id: `${book.id}:${chapter.id}:${qNumber}`,
                bookId: book.id,
                bookTitle: book.title,
                chapterId: chapter.id,
                subject: chapter.relatedQuestions?.titulo || chapter.title,
                questionNumber: qNumber,
                submatters: submatterSet.size > 0 ? Array.from(submatterSet) : ["Geral"],
                bucket: classifyCandidateLocal(history, difficult, reviewOverdue),
                priority: 0,
                reasons: ["Resolvida hoje"],
                previousStatus: history[1]?.status,
                previousAttemptAt: history[1]?.timestamp,
                previousAttempts: history,
                difficult,
                reviewOverdue,
                latestAttempt: {
                  status: latest.status as "correct" | "incorrect",
                  timestamp: latest.timestamp,
                }
              });
            }
          }
        });
      });
    });

    return solved.sort((a, b) => new Date(b.latestAttempt.timestamp).getTime() - new Date(a.latestAttempt.timestamp).getTime());
  }, [books]);

  const start = () => {
    const questions = selectSmartReviewQuestions(books, count);
    if (!questions.length) return;
    const now = new Date().toISOString();
    store.saveActiveReviewSession({
      id: generateUUID(),
      status: "active",
      requestedCount: count,
      questions,
      answers: Object.fromEntries(questions.map((question) => [question.id, "pending"])),
      startedAt: now,
      updatedAt: now,
    });
    setScreen("session");
  };

  const finish = () => {
    const active = store.activeReviewSession;
    if (!active || active.questions.some((question) => !["correct", "incorrect"].includes(active.answers[question.id]))) return;
    const completedAt = new Date().toISOString();
    const completed: SmartReviewSession = {
      ...active,
      status: "completed",
      completedAt,
      updatedAt: completedAt,
      summary: buildSmartReviewSummary(active.questions, active.answers),
    };
    store.completeReviewSession(completed);
    setReport(completed);
    setScreen("report");
  };

  const previewGroups = React.useMemo(() => groupQuestionsBySubject(preview), [preview]);

  const markMany = (questionIds: string[], answer: SmartReviewAnswer) => {
    store.setReviewAnswers(questionIds, answer);
  };

  const setup = (
    <div className="grid lg:grid-cols-3 gap-6 h-full min-h-0 items-stretch">
      {/* Coluna Esquerda: Configurações & Métricas (1/3) */}
      <section className="lg:col-span-1 bg-slate-950/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
        <div className="space-y-6">
          <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-850">
            <div>
              <span className="text-[10px] uppercase tracking-[.24em] text-[#D4AF37] font-extrabold block">Revisão Inteligente</span>
              <h3 className="text-lg text-slate-100 font-bold mt-1">Plano de Revisão</h3>
              <p className="text-xs text-slate-500 mt-1">Redistribuição dinâmica de matérias previstas para hoje.</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#bfa032] text-slate-950 flex flex-col items-center justify-center shadow-lg shadow-[#D4AF37]/10 shrink-0">
              <strong className="text-xl font-black leading-none">{preview.length}</strong>
              <span className="text-[8px] uppercase font-bold tracking-wider mt-0.5">questões</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="question-volume-slider" className="text-xs font-semibold text-slate-350">Volume selecionado</label>
              <span className="text-xs text-[#D4AF37] font-bold">{count} de {Math.min(SMART_REVIEW_MAX, pool.length)}</span>
            </div>
            <input
              id="question-volume-slider"
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
              type="range"
              min={1}
              max={Math.max(1, Math.min(SMART_REVIEW_MAX, pool.length))}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-semibold px-0.5">
              <span>1 questão</span>
              <span>{Math.min(SMART_REVIEW_MAX, pool.length)} disponíveis</span>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Sua carga para hoje</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Recuperação", value: preview.filter((q) => q.bucket === "recovery").length, colorClass: "border-rose-900/40 bg-rose-950/10 text-rose-300" },
                { label: "Manutenção", value: preview.filter((q) => q.bucket === "maintenance").length, colorClass: "border-sky-900/40 bg-sky-950/10 text-sky-300" },
                { label: "Inéditas", value: preview.filter((q) => q.bucket === "new").length, colorClass: "border-violet-900/40 bg-violet-950/10 text-violet-300" },
                { label: "Difíceis", value: preview.filter((q) => q.difficult).length, colorClass: "border-amber-900/40 bg-amber-950/10 text-amber-300" },
              ].map(({ label, value, colorClass }) => (
                <div key={label} className={`border rounded-xl p-3 flex flex-col justify-between ${colorClass}`}>
                  <span className="text-[8px] uppercase tracking-wider font-bold opacity-75">{label}</span>
                  <strong className="text-xl font-bold mt-1 block">{value}</strong>
                </div>
              ))}
              <div className="col-span-2 border border-slate-800 bg-slate-900/40 rounded-xl p-3 flex justify-between items-center text-slate-400">
                <span className="text-[8px] uppercase tracking-wider font-bold">Revisões Vencidas</span>
                <strong className="text-sm font-bold text-[#D4AF37]">{preview.filter((q) => q.reviewOverdue).length}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-805 mt-6 space-y-3">
          {store.activeReviewSession ? (
            <button onClick={() => setScreen("session")} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl py-3.5 text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-2 shadow-lg shadow-amber-950/20 active:scale-[0.98] transition-all cursor-pointer">
              <Play className="w-4 h-4 fill-slate-950" /> Retomar sessão cronometrada
            </button>
          ) : (
            <button onClick={start} disabled={!preview.length} className="w-full bg-gradient-to-r from-[#D4AF37] to-[#bfa032] hover:from-[#e5c158] hover:to-[#D4AF37] disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none text-slate-950 rounded-xl py-3.5 text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-2 shadow-lg shadow-[#D4AF37]/15 active:scale-[0.98] transition-all cursor-pointer">
              <Play className="w-4 h-4 fill-slate-950" /> Iniciar Sessão Cronometrada
            </button>
          )}
          <p className="text-[10px] text-slate-500 text-center leading-relaxed">
            As alterações nas questões feitas diretamente no painel à direita atualizam seu progresso instantaneamente.
          </p>
        </div>
      </section>

      {/* Coluna Direita: Gerenciador de Questões Interativo (2/3) */}
      <section className="lg:col-span-2 bg-slate-900/20 border border-slate-800/50 rounded-2xl flex flex-col h-full min-h-0 shadow-lg overflow-hidden">
        {/* Abas */}
        <div className="bg-slate-950/40 border-b border-slate-800 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            {[
              { id: "todo", label: "A Fazer Hoje", count: preview.length, color: "bg-[#D4AF37]" },
              { id: "solved", label: "Resolvidas Hoje", count: solvedToday.length, color: "bg-emerald-500" },
              { id: "forecast", label: "Matérias Previstas", count: previewGroups.length, color: "bg-slate-505" },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    active ? "text-slate-100 bg-slate-800/50" : "text-slate-500 hover:text-slate-355"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`px-1.5 py-0.2 text-[8px] rounded-full text-slate-950 font-black ${tab.id === "todo" ? "bg-[#D4AF37]" : tab.id === "solved" ? "bg-emerald-400" : "bg-slate-700 text-slate-300"}`}>
                        {tab.count}
                      </span>
                    )}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.id === "todo" ? "bg-[#D4AF37]" : tab.id === "solved" ? "bg-emerald-400" : "bg-slate-500"}`}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo da Aba */}
        <div className="flex-1 min-h-0 p-4 max-h-[62vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <AnimatePresence mode="popLayout">
            {activeTab === "todo" && (
              <motion.div
                key="todo-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {preview.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                      <Check className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300">Tudo em dia!</p>
                      <p className="text-xs text-slate-500 mt-0.5">Você revisou todas as questões previstas para hoje.</p>
                    </div>
                  </div>
                ) : (
                  preview.map((question, index) => (
                    <motion.div
                      key={question.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -100, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      className="bg-slate-950/50 hover:bg-slate-950/80 border border-slate-805 hover:border-slate-700/80 rounded-xl p-4 transition-all duration-200 group flex flex-col md:flex-row justify-between gap-4 shadow-sm"
                    >
                      <div className="min-w-0 flex-1 flex gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-905 border border-slate-800/80 text-[#D4AF37] flex items-center justify-center text-xs font-black shrink-0 shadow-inner">
                          {String(index + 1).padStart(2, "0")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-slate-100 text-sm font-semibold">Questão {question.questionNumber}</strong>
                            <span className="text-[10px] text-slate-500">•</span>
                            <span className="text-xs text-slate-400 font-medium truncate max-w-[200px] md:max-w-xs" title={question.bookTitle}>{question.bookTitle}</span>
                            <span className={`text-[8px] uppercase font-bold tracking-wider border px-2 py-0.5 rounded-full ${bucketClass[question.bucket]}`}>
                              {bucketLabel[question.bucket]}
                            </span>
                            {question.difficult && (
                              <span className="text-[8px] uppercase font-bold tracking-wider border px-2 py-0.5 rounded-full border-amber-500/40 bg-amber-950/20 text-amber-300">
                                Difícil
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-350 font-bold mt-1.5">{question.subject}</p>
                          {question.submatters.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {question.submatters.map((sub) => (
                                <span key={sub} className="text-[9px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
                                  {sub}
                                </span>
                              ))}
                            </div>
                          )}
                          {question.reasons.length > 0 && (
                            <div className="mt-2.5 flex items-center gap-1.5 text-[9px] text-[#D4AF37] bg-[#D4AF37]/5 px-2 py-1 rounded-lg w-fit border border-[#D4AF37]/10">
                              <Sparkles className="w-3 h-3 shrink-0" />
                              <span className="font-medium">{question.reasons.join(" · ")}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <button
                          onClick={() => store.recordQuestionAttemptDirectly(question.bookId, question.chapterId, question.questionNumber, "correct")}
                          className="bg-emerald-550/10 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/30 text-emerald-450 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 active:scale-[0.95] cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Acertei
                        </button>
                        <button
                          onClick={() => store.recordQuestionAttemptDirectly(question.bookId, question.chapterId, question.questionNumber, "incorrect")}
                          className="bg-rose-550/10 hover:bg-rose-500 hover:text-slate-950 border border-rose-500/30 text-rose-455 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 active:scale-[0.95] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Errei
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === "solved" && (
              <motion.div
                key="solved-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {solvedToday.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                      <Play className="w-5 h-5 opacity-40 rotate-90" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-350">Nenhuma questão resolvida</p>
                      <p className="text-xs text-slate-500 mt-0.5">As questões resolvidas hoje aparecerão listadas aqui.</p>
                    </div>
                  </div>
                ) : (
                  solvedToday.map((question) => (
                    <motion.div
                      key={question.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: 100, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4 shadow-sm"
                    >
                      <div className="min-w-0 flex-1 flex gap-3.5">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-inner ${
                          question.latestAttempt.status === "correct" 
                            ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400" 
                            : "bg-rose-950/20 border-rose-500/30 text-rose-400"
                        }`}>
                          {question.latestAttempt.status === "correct" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-slate-200 text-sm font-semibold">Questão {question.questionNumber}</strong>
                            <span className="text-[10px] text-slate-500">•</span>
                            <span className="text-xs text-slate-400 truncate max-w-[200px]" title={question.bookTitle}>{question.bookTitle}</span>
                            <span className={`text-[8px] uppercase font-bold tracking-wider border px-2 py-0.2 rounded-full ${
                              question.latestAttempt.status === "correct" 
                                ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300" 
                                : "border-rose-500/40 bg-rose-950/20 text-rose-300"
                            }`}>
                              {question.latestAttempt.status === "correct" ? "Acerto" : "Erro"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{question.subject}</p>
                          <span className="text-[9px] text-slate-500 block mt-1.5">
                            Resolvida em: {new Date(question.latestAttempt.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center shrink-0 self-end md:self-center">
                        <button
                          onClick={() => store.recordQuestionAttemptDirectly(question.bookId, question.chapterId, question.questionNumber, "pending")}
                          className="text-slate-400 hover:text-slate-250 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-lg px-3.5 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Desfazer
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === "forecast" && (
              <motion.div
                key="forecast-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {previewGroups.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-12">Nenhuma matéria prevista.</p>
                ) : (
                  previewGroups.map((group) => (
                    <div key={group.key} className="border border-slate-800 bg-slate-950/40 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <strong className="text-sm text-slate-200 block leading-snug">{group.subject}</strong>
                          <span className="text-[10px] uppercase text-slate-505 font-semibold">{group.bookTitle}</span>
                        </div>
                        <span className="bg-[#D4AF37] text-slate-950 rounded-lg px-2.5 py-1 text-xs font-black shrink-0 shadow-md shadow-[#D4AF37]/5">{group.total} q.</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3.5">
                        {[
                          ["Recuperação", group.recovery, "text-rose-300"],
                          ["Manutenção", group.maintenance, "text-sky-300"],
                          ["Inéditas", group.new, "text-violet-300"],
                        ].map(([label, val, color]) => (
                          <div key={String(label)} className="rounded-lg bg-slate-900/35 border border-slate-800/80 px-2 py-1.5 text-center">
                            <strong className={`block text-sm ${color}`}>{val}</strong>
                            <span className="text-[8px] uppercase text-slate-500 font-bold">{label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3.5 space-y-1.5">
                        {group.submatters.slice(0, 4).map((submatter) => (
                          <div key={submatter.name} className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/20 border border-slate-800/50 px-3 py-2">
                            <span className="text-xs text-slate-350 truncate">{submatter.name}</span>
                            <span className="text-[10px] text-[#D4AF37] font-semibold shrink-0">{submatter.total} q.</span>
                          </div>
                        ))}
                        {group.submatters.length > 4 && <p className="text-[10px] text-slate-500 font-semibold mt-1">+ {group.submatters.length - 4} submatérias nesta revisão</p>}
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );

  const active = store.activeReviewSession;
  const answered = active?.questions.filter((q) => ["correct", "incorrect"].includes(active.answers[q.id])).length || 0;
  const correct = active?.questions.filter((q) => active.answers[q.id] === "correct").length || 0;
  const incorrect = active?.questions.filter((q) => active.answers[q.id] === "incorrect").length || 0;
  const elapsed = active ? Math.floor((clock - new Date(active.startedAt).getTime()) / 1000) : 0;
  const activeGroups = React.useMemo(() => groupQuestionsBySubject(active?.questions || []), [active?.questions]);

  const session = active ? (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
        {[
          ["Progresso", `${answered}/${active.questions.length}`],
          ["Acertos", correct],
          ["Erros", incorrect],
          ["Pendentes", active.questions.length - answered],
          ["Tempo", `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`],
        ].map(([label, value]) => <div key={String(label)} className="bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-center"><strong className="text-base text-slate-100 block">{value}</strong><span className="text-[9px] uppercase text-slate-500">{label}</span></div>)}
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full mb-4 overflow-hidden"><div className="h-full bg-gradient-to-r from-[#D4AF37] to-emerald-500" style={{ width: `${(answered / active.questions.length) * 100}%` }} /></div>
      <div className="space-y-3">
        {activeGroups.map((group) => {
          const groupAnswers = group.questions.map((question) => active.answers[question.id] || "pending");
          const groupCorrect = groupAnswers.filter((answer) => answer === "correct").length;
          const groupIncorrect = groupAnswers.filter((answer) => answer === "incorrect").length;
          const groupPending = group.total - groupCorrect - groupIncorrect;
          const questionIds = group.questions.map((question) => question.id);

          return (
            <section key={group.key} className="border border-slate-800 bg-slate-950/30 rounded-xl overflow-hidden">
              <div className="bg-slate-950/70 border-b border-slate-800 p-3">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-[.2em] text-slate-500">{group.bookTitle}</span>
                    <h3 className="text-base text-slate-100 font-semibold leading-snug">{group.subject}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {group.submatters.map((submatter) => (
                        <span key={submatter.name} className="text-[10px] bg-slate-900 border border-slate-700 rounded-full px-2 py-1 text-slate-300">
                          {submatter.name} · {submatter.total}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col lg:flex-row gap-2 shrink-0">
                    <div className="grid grid-cols-3 gap-1 text-center min-w-44">
                      <div className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5"><strong className="text-emerald-400 block">{groupCorrect}</strong><span className="text-[8px] uppercase text-slate-500">Acertos</span></div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5"><strong className="text-rose-400 block">{groupIncorrect}</strong><span className="text-[8px] uppercase text-slate-500">Erros</span></div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5"><strong className="text-slate-300 block">{groupPending}</strong><span className="text-[8px] uppercase text-slate-500">Pend.</span></div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => markMany(questionIds, "correct")} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider">
                        Marcar matéria como acertei
                      </button>
                      <button type="button" onClick={() => markMany(questionIds, "incorrect")} className="bg-rose-500 hover:bg-rose-400 text-slate-950 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider">
                        Marcar matéria como errei
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-2 space-y-2">
                {group.questions.map((question) => {
                  const globalIndex = active.questions.findIndex((item) => item.id === question.id) + 1;
                  const answer = active.answers[question.id] || "pending";
                  return (
                    <article key={question.id} className={`border rounded-xl p-3 ${answer === "correct" ? "border-emerald-700 bg-emerald-950/20" : answer === "incorrect" ? "border-rose-700 bg-rose-950/20" : "border-slate-800 bg-slate-900/50"}`}>
                      <div className="flex flex-col lg:flex-row gap-3 lg:items-start">
                        <div className="flex gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 text-[#D4AF37] grid place-items-center text-xs font-black shrink-0">{String(globalIndex).padStart(2, "0")}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap gap-2 items-center">
                              <h4 className="text-sm font-semibold text-slate-100">Questão {question.questionNumber}</h4>
                              <span className={`text-[9px] uppercase border px-2 py-0.5 rounded-full ${bucketClass[question.bucket]}`}>{bucketLabel[question.bucket]}</span>
                              {answer !== "pending" && <span className={answer === "correct" ? "text-[9px] uppercase text-emerald-300" : "text-[9px] uppercase text-rose-300"}>{answer === "correct" ? "Marcada como acerto" : "Marcada como erro"}</span>}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">{question.submatters.map((name) => <span key={name} className="text-[10px] bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300">{name}</span>)}</div>
                            <p className="text-xs text-slate-400 mt-3 flex gap-1"><Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />{question.reasons.join(" · ")}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 lg:w-64">
                          <button onClick={() => store.setReviewAnswer(question.id, answer === "correct" ? "pending" : "correct")} className={`rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 ${answer === "correct" ? "bg-emerald-500 border-emerald-400 text-slate-950" : "bg-slate-950 border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-300"}`} aria-label={`Marcar questão ${question.questionNumber} como correta`}>
                            <Check className="w-4 h-4" /> Acertei
                          </button>
                          <button onClick={() => store.setReviewAnswer(question.id, answer === "incorrect" ? "pending" : "incorrect")} className={`rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 ${answer === "incorrect" ? "bg-rose-500 border-rose-400 text-slate-950" : "bg-slate-950 border-slate-700 text-slate-300 hover:border-rose-500 hover:text-rose-300"}`} aria-label={`Marcar questão ${question.questionNumber} como incorreta`}>
                            <X className="w-4 h-4" /> Errei
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <div className="flex justify-between gap-3 mt-5 pt-4 border-t border-slate-800">
        <button onClick={() => { if (confirm("Descartar a sessão?")) { store.saveActiveReviewSession(null); setScreen("setup"); } }} className="border border-rose-900 text-rose-400 rounded-lg px-4 py-2 text-xs font-bold uppercase">Descartar</button>
        <button onClick={finish} disabled={answered !== active.questions.length} className="bg-[#D4AF37] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded-lg px-5 py-2 text-xs font-bold uppercase">{answered === active.questions.length ? "Finalizar e analisar" : `Faltam ${active.questions.length - answered}`}</button>
      </div>
    </>
  ) : setup;

  const summary = report?.summary;
  const timeline = React.useMemo(() => {
    const source = [...store.reviewSessions, ...(report ? [report] : [])];
    return source
      .filter((item, index) => item.summary && source.findIndex((candidate) => candidate.id === item.id) === index)
      .sort((a, b) => new Date(a.completedAt || a.updatedAt).getTime() - new Date(b.completedAt || b.updatedAt).getTime())
      .slice(-10)
      .map((item) => ({ date: new Date(item.completedAt || item.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), taxa: item.summary?.percentage || 0 }));
  }, [store.reviewSessions, report]);

  const reportView = summary ? (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-6 gap-2">
        {[["Aproveitamento", `${summary.percentage}%`], ["Acertos", summary.correct], ["Erros", summary.incorrect], ["Recuperadas", summary.recovered], ["Regressões", summary.regressed], ["Linha de base", summary.baseline]].map(([label, value]) => <div key={String(label)} className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-center"><strong className="text-xl text-[#D4AF37] block">{value}</strong><span className="text-[8px] uppercase text-slate-500">{label}</span></div>)}
      </div>
      <div className={`border rounded-xl p-4 flex gap-3 ${(summary.deltaFromPrevious || 0) >= 0 ? "border-emerald-800 bg-emerald-950/20" : "border-rose-800 bg-rose-950/20"}`}>
        {(summary.deltaFromPrevious || 0) >= 0 ? <TrendingUp className="text-emerald-400" /> : <TrendingDown className="text-rose-400" />}
        <div><strong className="text-sm text-slate-100">{summary.deltaFromPrevious === null ? "Primeira linha de base para estas questões" : `${summary.deltaFromPrevious >= 0 ? "+" : ""}${summary.deltaFromPrevious} pontos percentuais`}</strong><p className="text-xs text-slate-500">Comparação com as tentativas anteriores das mesmas questões.</p></div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Evolução das sessões" icon={<TrendingUp className="w-4 h-4 text-[#D4AF37]" />}>
          <ResponsiveContainer width="100%" height="100%"><LineChart data={timeline}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" /><XAxis dataKey="date" stroke="#64748b" fontSize={10} /><YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} /><Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} /><Line dataKey="taxa" stroke="#D4AF37" strokeWidth={3} /></LineChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Desempenho por matéria" icon={<BarChart3 className="w-4 h-4 text-[#D4AF37]" />}>
          <ResponsiveContainer width="100%" height="100%"><BarChart data={summary.subjects.slice(0, 8)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" /><XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={10} /><YAxis type="category" dataKey="label" width={100} stroke="#64748b" fontSize={9} /><Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} /><Bar dataKey="percentage" fill="#D4AF37" /></BarChart></ResponsiveContainer>
        </ChartCard>
      </div>
      <section className="bg-slate-950/45 border border-slate-800 rounded-xl p-4"><h3 className="text-sm text-slate-200 font-semibold mb-3">Matérias e submatérias</h3><div className="grid md:grid-cols-2 gap-2">{summary.submatters.map((row) => <div key={row.key} className="bg-slate-900/70 border border-slate-800 rounded-lg p-3"><div className="flex justify-between gap-3"><div><strong className="text-xs text-slate-200 block">{row.label}</strong><span className="text-[10px] text-slate-500">{row.parentLabel}</span></div><strong className={row.percentage >= 70 ? "text-emerald-400" : "text-rose-400"}>{row.percentage}%</strong></div><div className="h-1.5 bg-slate-800 rounded mt-2"><div className={row.percentage >= 70 ? "h-full bg-emerald-500" : "h-full bg-rose-500"} style={{ width: `${row.percentage}%` }} /></div><span className="text-[9px] text-slate-500">{row.correct} acertos · {row.incorrect} erros</span></div>)}</div></section>
      <QuestionTimeline session={report} />
      <section className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4"><h3 className="text-sm text-amber-300 font-semibold flex gap-2"><AlertTriangle className="w-4 h-4" /> Próxima revisão</h3>{summary.recommendations.map((item) => <p key={item} className="text-xs text-slate-300 mt-2">• {item}</p>)}</section>
    </div>
  ) : setup;

  const history = <div className="space-y-2 max-h-[68vh] overflow-y-auto">{store.reviewSessions.map((item) => <button key={item.id} onClick={() => { setReport(item); setScreen("report"); }} className="w-full bg-slate-950/50 border border-slate-800 hover:border-[#D4AF37] rounded-xl p-4 flex justify-between text-left"><div><strong className="text-sm text-slate-200 block">{new Date(item.completedAt || item.updatedAt).toLocaleDateString("pt-BR", { dateStyle: "long" })}</strong><span className="text-[10px] uppercase text-slate-500">{item.questions.length} questões · {item.summary?.correct || 0} acertos</span></div><strong className="text-xl text-[#D4AF37]">{item.summary?.percentage || 0}%</strong></button>)}{!store.reviewSessions.length && <p className="text-center text-slate-500 py-16">Nenhuma sessão concluída ainda.</p>}</div>;

  const title = screen === "setup" ? "Central de revisão" : screen === "session" ? "Sessão inteligente" : screen === "report" ? "Diagnóstico da sessão" : "Histórico de revisões";
  return (
    <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-3 z-50 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="smart-review-title"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-[96rem] max-h-[calc(100dvh-1rem)] shadow-2xl overflow-hidden flex flex-col"
      >
        <header className="px-5 py-4 border-b border-slate-800 bg-slate-950/50 flex justify-between shrink-0">
          <div className="flex gap-3">{screen !== "setup" && <button onClick={() => setScreen(screen === "report" && store.reviewSessions.length ? "history" : "setup")} className="p-2 border border-slate-800 rounded-lg text-slate-400"><ChevronLeft className="w-4 h-4" /></button>}<div><span className="text-[10px] uppercase tracking-[.28em] text-[#D4AF37] font-bold flex gap-2"><BrainCircuit className="w-4 h-4" /> Revisão adaptativa</span><h2 id="smart-review-title" className="text-2xl font-serif italic text-slate-100">{title}</h2><p className="text-xs text-slate-500">Livro → matéria → submatéria → questão</p></div></div>
          <div className="flex gap-2">{screen === "setup" && <button onClick={() => setScreen("history")} className="p-2 border border-slate-800 rounded-lg text-slate-400" title="Histórico"><History className="w-4 h-4" /></button>}<button onClick={onClose} className="p-2 border border-slate-800 rounded-lg text-slate-400"><X className="w-4 h-4" /></button></div>
        </header>
        <main data-testid="random-questions-content" className="p-3 md:p-4 min-h-0 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">{screen === "setup" ? setup : screen === "session" ? session : screen === "report" ? reportView : history}</main>
        {screen === "setup" && (
          <footer className="shrink-0 border-t border-slate-800 bg-slate-950/80 px-4 md:px-5 py-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <p className="text-[11px] text-slate-500">
              {preview.length ? `${preview.length} questões prontas para revisar hoje.` : "Cadastre questões nas aulas para iniciar uma revisão."}
            </p>
            <div className="flex gap-2">
              {store.activeReviewSession ? (
                <button onClick={() => setScreen("session")} className="flex-1 sm:flex-none bg-amber-550 hover:bg-amber-400 text-slate-950 rounded-lg px-5 py-2 text-xs font-bold uppercase tracking-wider flex justify-center gap-2 cursor-pointer">
                  <Play className="w-4 h-4 fill-slate-950" /> Retomar Sessão
                </button>
              ) : (
                <button onClick={start} disabled={!preview.length} className="flex-1 sm:flex-none bg-[#D4AF37] hover:bg-[#C2A032] disabled:bg-slate-800 disabled:text-slate-505 text-slate-950 rounded-lg px-5 py-2 text-xs font-bold uppercase tracking-wider flex justify-center gap-2 cursor-pointer">
                  <Play className="w-4 h-4 fill-slate-950" /> Iniciar Sessão
                </button>
              )}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="bg-slate-950/45 border border-slate-800 rounded-xl p-4"><h3 className="text-sm text-slate-200 font-semibold flex gap-2 mb-3">{icon}{title}</h3><div className="h-56">{children}</div></section>;
}

function QuestionTimeline({ session }: { session: SmartReviewSession }) {
  const rows = session.questions.flatMap((question) => {
    const current = session.answers[question.id];
    const attempts = [
      ...(current === "correct" || current === "incorrect"
        ? [{ timestamp: session.completedAt || session.updatedAt, status: current }]
        : []),
      ...question.previousAttempts,
    ].slice(0, 4);
    return attempts.map((attempt, index) => ({
      id: `${question.id}:${attempt.timestamp}:${index}`,
      question: question.questionNumber,
      subject: question.subject,
      submatter: question.submatters.join(", "),
      timestamp: attempt.timestamp,
      status: attempt.status,
    }));
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <section className="bg-slate-950/45 border border-slate-800 rounded-xl p-4">
      <h3 className="text-sm text-slate-200 font-semibold mb-3">Linha do tempo das questões</h3>
      <div className="max-h-64 overflow-y-auto space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <strong className="text-xs text-slate-200 block">Questão {row.question} · {row.subject}</strong>
              <span className="text-[10px] text-slate-500 block truncate">{row.submatter}</span>
            </div>
            <div className="text-right shrink-0">
              <span className={row.status === "correct" ? "text-xs font-bold text-emerald-400" : "text-xs font-bold text-rose-400"}>
                {row.status === "correct" ? "Acerto" : "Erro"}
              </span>
              <span className="text-[9px] text-slate-500 block">
                {new Date(row.timestamp).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
