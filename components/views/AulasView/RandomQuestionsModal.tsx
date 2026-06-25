import React from "react";
import { AlertTriangle, BarChart3, BrainCircuit, Check, ChevronLeft, History, Play, Sparkles, Target, TrendingDown, TrendingUp, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAulasStore } from "../../../stores/aulasStore";
import { AulaBook, SmartReviewAnswer, SmartReviewQuestion, SmartReviewSession } from "../../../types";
import { generateUUID } from "../../../utils/uuid";
import { buildSmartReviewPool, buildSmartReviewSummary, selectSmartReviewQuestions, SMART_REVIEW_MAX } from "./smartReview";

interface Props {
  books: AulaBook[];
  onClose: () => void;
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

export default function RandomQuestionsModal({ books, onClose }: Props) {
  const store = useAulasStore();
  const pool = React.useMemo(() => buildSmartReviewPool(books), [books]);
  const [count, setCount] = React.useState(Math.min(15, Math.max(1, pool.length)));
  const [screen, setScreen] = React.useState<Screen>(store.activeReviewSession ? "session" : "setup");
  const [report, setReport] = React.useState<SmartReviewSession | null>(null);
  const [clock, setClock] = React.useState(Date.now());
  const [showQuestionPreview, setShowQuestionPreview] = React.useState(false);
  const preview = React.useMemo(() => selectSmartReviewQuestions(books, count), [books, count]);

  React.useEffect(() => {
    if (screen !== "session") return;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [screen]);

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
    <div className="grid lg:grid-cols-2 gap-5">
      <section className="bg-slate-950/45 border border-slate-800 rounded-xl p-5">
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[.24em] text-[#D4AF37] font-bold">Plano de hoje</span>
            <h3 className="text-xl text-slate-100 font-semibold mt-1">Defina seu volume de revisão</h3>
            <p className="text-xs text-slate-500 mt-1">De 1 a 30 questões, com redistribuição automática.</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-[#D4AF37] text-slate-950 grid place-items-center text-2xl font-black">{preview.length}</div>
        </div>
        <input
          className="w-full accent-[#D4AF37] mt-6"
          type="range"
          min={1}
          max={Math.max(1, Math.min(SMART_REVIEW_MAX, pool.length))}
          value={count}
          onChange={(event) => setCount(Number(event.target.value))}
          aria-label="Quantidade de questões"
        />
        <div className="flex justify-between text-[10px] text-slate-500"><span>1</span><span>{Math.min(SMART_REVIEW_MAX, pool.length)} disponíveis</span></div>
        <div className="grid grid-cols-5 gap-2 mt-6">
          {[
            ["Recuperação", preview.filter((q) => q.bucket === "recovery").length],
            ["Manutenção", preview.filter((q) => q.bucket === "maintenance").length],
            ["Inéditas", preview.filter((q) => q.bucket === "new").length],
            ["Difíceis", preview.filter((q) => q.difficult).length],
            ["Vencidas", preview.filter((q) => q.reviewOverdue).length],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-slate-900/70 border border-slate-800 rounded-lg p-2 text-center">
              <strong className="text-lg text-slate-100 block">{value}</strong>
              <span className="text-[8px] uppercase text-slate-500">{label}</span>
            </div>
          ))}
        </div>
        {store.activeReviewSession ? (
          <button onClick={() => setScreen("session")} className="mt-6 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg py-3 text-xs font-bold uppercase tracking-wider flex justify-center gap-2">
            <Play className="w-4 h-4" /> Retomar sessão
          </button>
        ) : (
          <button onClick={start} disabled={!preview.length} className="mt-6 w-full bg-[#D4AF37] hover:bg-[#C2A032] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded-lg py-3 text-xs font-bold uppercase tracking-wider flex justify-center gap-2">
            <Play className="w-4 h-4" /> Iniciar revisão inteligente
          </button>
        )}
      </section>
      <section className="bg-slate-950/45 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg text-slate-100 font-semibold flex items-center gap-2"><Target className="w-5 h-5 text-[#D4AF37]" /> Matérias previstas</h3>
          <button
            type="button"
            onClick={() => setShowQuestionPreview((value) => !value)}
            disabled={!preview.length}
            className="border border-slate-700 hover:border-[#D4AF37] disabled:opacity-40 disabled:hover:border-slate-700 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-300"
          >
            {showQuestionPreview ? "Ocultar questões" : "Ver questões"}
          </button>
        </div>
        <div className="space-y-3 mt-4 max-h-[28rem] overflow-y-auto pr-1">
          {previewGroups.map((group) => (
            <div key={group.key} className="border border-slate-800 bg-slate-900/60 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="text-sm text-slate-100 block leading-snug">{group.subject}</strong>
                  <span className="text-[10px] uppercase text-slate-500">{group.bookTitle}</span>
                </div>
                <span className="bg-[#D4AF37] text-slate-950 rounded-lg px-3 py-1 text-xs font-black shrink-0">{group.total}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  ["Recuperação", group.recovery, "text-rose-300"],
                  ["Manutenção", group.maintenance, "text-sky-300"],
                  ["Inéditas", group.new, "text-violet-300"],
                ].map(([label, value, color]) => (
                  <div key={String(label)} className="rounded-lg bg-slate-950/60 border border-slate-800 px-2 py-1.5 text-center">
                    <strong className={`block text-sm ${color}`}>{value}</strong>
                    <span className="text-[8px] uppercase text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1.5">
                {group.submatters.slice(0, 4).map((submatter) => (
                  <div key={submatter.name} className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/40 border border-slate-800 px-3 py-2">
                    <span className="text-xs text-slate-300 truncate">{submatter.name}</span>
                    <span className="text-[10px] text-[#D4AF37] shrink-0">{submatter.total} q.</span>
                  </div>
                ))}
                {group.submatters.length > 4 && <p className="text-[10px] text-slate-500">+ {group.submatters.length - 4} submatérias nesta revisão</p>}
              </div>
            </div>
          ))}
          {!preview.length && <p className="text-sm text-slate-500 text-center py-12">Cadastre questões nas aulas para ativar o motor.</p>}
        </div>
        {showQuestionPreview && preview.length > 0 && (
          <div className="mt-4 border border-slate-800 bg-slate-950/60 rounded-xl p-3">
            <h4 className="text-xs text-slate-200 font-bold uppercase tracking-wider mb-3">Questões selecionadas para hoje</h4>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {preview.map((question, index) => (
                <div key={question.id} className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm text-slate-100">#{index + 1} · Questão {question.questionNumber}</strong>
                    <span className={`text-[9px] uppercase border px-2 py-0.5 rounded-full ${bucketClass[question.bucket]}`}>{bucketLabel[question.bucket]}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{question.subject}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{question.submatters.join(" · ")}</p>
                  <p className="text-[10px] text-[#D4AF37] mt-2">{question.reasons.join(" · ")}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="text-xs text-slate-500 border-t border-slate-800 pt-4 mt-4">Prioriza erros, regressões, dificuldade e revisões vencidas, equilibrando matérias e submatérias.</p>
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
              <button
                type="button"
                onClick={() => setShowQuestionPreview((value) => !value)}
                disabled={!preview.length}
                className="flex-1 sm:flex-none border border-slate-700 hover:border-[#D4AF37] disabled:opacity-40 disabled:hover:border-slate-700 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300"
              >
                {showQuestionPreview ? "Ocultar questões" : "Ver questões"}
              </button>
              {store.activeReviewSession ? (
                <button onClick={() => setScreen("session")} className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg px-5 py-2 text-xs font-bold uppercase tracking-wider flex justify-center gap-2">
                  <Play className="w-4 h-4" /> Retomar
                </button>
              ) : (
                <button onClick={start} disabled={!preview.length} className="flex-1 sm:flex-none bg-[#D4AF37] hover:bg-[#C2A032] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded-lg px-5 py-2 text-xs font-bold uppercase tracking-wider flex justify-center gap-2">
                  <Play className="w-4 h-4" /> Iniciar
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
