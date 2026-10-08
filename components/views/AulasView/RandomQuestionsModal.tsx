import React from "react";
import { useShallow } from "zustand/react/shallow";
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  Check,
  ChevronLeft,
  Clock,
  Flame,
  Folder,
  FolderOpen,
  History,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  CheckCircle2,
  XCircle,
  BookOpen,
  Layers,
  Zap,
  Award,
  Filter,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAulasStore } from "../../../stores/aulasStore";
import { AulaBook, AulaFolder, SmartReviewAnswer, SmartReviewQuestion, SmartReviewSession } from "../../../types";
import { generateUUID } from "../../../utils/uuid";
import { buildSmartReviewPool, buildSmartReviewSummary, selectSmartReviewQuestions, SMART_REVIEW_MAX } from "./smartReview";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  books: AulaBook[];
  onClose: () => void;
  onSetQuestionStatus?: (question: any, status: "correct" | "incorrect" | "pending") => void;
  initialFolderId?: string;
  folders?: AulaFolder[];
}

type Screen = "setup" | "session" | "report" | "history";

const bucketLabel: Record<string, string> = {
  recovery: "Recuperação",
  maintenance: "Manutenção",
  new: "Inédita",
};

const bucketClass: Record<string, string> = {
  recovery: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  maintenance: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  new: "border-violet-500/40 bg-violet-500/10 text-violet-300",
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

const getFolderAndSubfolderIds = (folderId: string, allFolders: AulaFolder[]): Set<string> => {
  const ids = new Set<string>([folderId]);
  let added = true;
  while (added) {
    added = false;
    allFolders.forEach((f) => {
      if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) {
        ids.add(f.id);
        added = true;
      }
    });
  }
  return ids;
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

export default function RandomQuestionsModal({ books, onClose, initialFolderId, folders: foldersProp }: Props) {
  const {
    folders: storeFolders,
    reviewSessions,
    activeReviewSession,
    saveActiveReviewSession,
    completeReviewSession,
    setReviewAnswers,
    setReviewAnswer,
    recordQuestionAttemptDirectly,
  } = useAulasStore(
    useShallow((state) => ({
      folders: state.folders,
      reviewSessions: state.reviewSessions,
      activeReviewSession: state.activeReviewSession,
      saveActiveReviewSession: state.saveActiveReviewSession,
      completeReviewSession: state.completeReviewSession,
      setReviewAnswers: state.setReviewAnswers,
      setReviewAnswer: state.setReviewAnswer,
      recordQuestionAttemptDirectly: state.recordQuestionAttemptDirectly,
    }))
  );

  const effectiveFolders = React.useMemo(() => {
    return foldersProp && foldersProp.length > 0 ? foldersProp : storeFolders || [];
  }, [foldersProp, storeFolders]);

  // Estado para escolher a pasta da revisão ('all' ou folderId)
  const [selectedFolderId, setSelectedFolderId] = React.useState<string>(initialFolderId || "all");

  // Livros filtrados pela pasta selecionada (inclui subpastas recursivamente)
  const filteredBooks = React.useMemo(() => {
    if (selectedFolderId === "all") return books;
    const folderIds = getFolderAndSubfolderIds(selectedFolderId, effectiveFolders);
    return books.filter((b) => folderIds.has(b.folderId));
  }, [books, selectedFolderId, effectiveFolders]);

  // Contagem de questões disponíveis em cada pasta
  const folderCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    effectiveFolders.forEach((folder) => {
      const subIds = getFolderAndSubfolderIds(folder.id, effectiveFolders);
      const fBooks = books.filter((b) => subIds.has(b.folderId));
      const fPool = buildSmartReviewPool(fBooks);
      map.set(folder.id, fPool.length);
    });
    return map;
  }, [books, effectiveFolders]);

  const allPool = React.useMemo(() => buildSmartReviewPool(books), [books]);
  const pool = React.useMemo(() => buildSmartReviewPool(filteredBooks), [filteredBooks]);

  const maxAvailable = Math.max(1, Math.min(SMART_REVIEW_MAX, pool.length));
  const [count, setCount] = React.useState(Math.min(15, maxAvailable));
  const [screen, setScreen] = React.useState<Screen>(activeReviewSession ? "session" : "setup");
  const [report, setReport] = React.useState<SmartReviewSession | null>(null);

  // Ajusta o count quando o pool da pasta mudar
  React.useEffect(() => {
    if (pool.length > 0) {
      setCount((prev) => Math.min(Math.max(1, prev), maxAvailable));
    }
  }, [pool.length, maxAvailable]);

  const preview = React.useMemo(() => selectSmartReviewQuestions(filteredBooks, count), [filteredBooks, count]);

  const [activeTab, setActiveTab] = React.useState<"todo" | "solved" | "forecast">("todo");

  const solvedToday = React.useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const solved: Array<SmartReviewQuestion & { latestAttempt: { status: "correct" | "incorrect"; timestamp: string } }> = [];

    filteredBooks.forEach((book) => {
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

              const classifyCandidateLocal = (hist: any[], diff: boolean, overdue: boolean): "recovery" | "maintenance" | "new" => {
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
                },
              });
            }
          }
        });
      });
    });

    return solved.sort((a, b) => new Date(b.latestAttempt.timestamp).getTime() - new Date(a.latestAttempt.timestamp).getTime());
  }, [filteredBooks]);

  const start = () => {
    const questions = selectSmartReviewQuestions(filteredBooks, count);
    if (!questions.length) return;
    const now = new Date().toISOString();
    saveActiveReviewSession({
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
    const active = activeReviewSession;
    if (!active || active.questions.some((question) => !["correct", "incorrect"].includes(active.answers[question.id]))) return;
    const completedAt = new Date().toISOString();
    const completed: SmartReviewSession = {
      ...active,
      status: "completed",
      completedAt,
      updatedAt: completedAt,
      summary: buildSmartReviewSummary(active.questions, active.answers),
    };
    completeReviewSession(completed);
    setReport(completed);
    setScreen("report");
  };

  const previewGroups = React.useMemo(() => groupQuestionsBySubject(preview), [preview]);

  const markMany = (questionIds: string[], answer: SmartReviewAnswer) => {
    setReviewAnswers(questionIds, answer);
  };

  const handleSetReviewAnswer = React.useCallback(
    (questionId: string, nextStatus: SmartReviewAnswer) => {
      setReviewAnswer(questionId, nextStatus);
    },
    [setReviewAnswer]
  );

  // Presets rápidos de volume
  const quickVolumePresets = React.useMemo(() => {
    if (pool.length === 0) return [1];
    const presets = [5, 10, 15, 20, 25, maxAvailable];
    return Array.from(new Set(presets.filter((p) => p > 0 && p <= maxAvailable)));
  }, [maxAvailable, pool.length]);

  // Nome da pasta selecionada
  const selectedFolderName = React.useMemo(() => {
    if (selectedFolderId === "all") return "Todas as Pastas";
    const f = effectiveFolders.find((folder) => folder.id === selectedFolderId);
    return f ? f.name : "Pasta Selecionada";
  }, [selectedFolderId, effectiveFolders]);

  const setup = (
    <div className="grid lg:grid-cols-3 gap-6 h-full min-h-0 items-stretch">
      {/* Coluna Esquerda: Configurações, Pasta & Métricas (1/3) */}
      <section className="lg:col-span-1 bg-slate-950/60 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
        {/* Glow decorativo sutil de fundo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-5 relative z-10">
          {/* Header do Card com o Badge Dourado de Destaque */}
          <div className="flex justify-between items-center gap-4 pb-4 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                <span className="text-[10px] uppercase tracking-[.24em] text-[#D4AF37] font-extrabold block">
                  Revisão Adaptativa
                </span>
              </div>
              <h3 className="text-lg text-slate-100 font-bold mt-1">Plano Diário</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedFolderId === "all"
                  ? "Cobring todas as pastas cadastradas."
                  : `Filtrando por: ${selectedFolderName}`}
              </p>
            </div>

            {/* BADGE DOURADO DE DESTAQUE: protegido contra tema preto via force-color, badge-gold e estilo inline */}
            <div className="relative group shrink-0" data-force-color="true">
              <div className="absolute -inset-1 rounded-2xl bg-amber-400/30 blur-sm group-hover:bg-amber-400/50 transition-all opacity-70" />
              <div
                data-force-color="true"
                className="relative w-14 h-14 rounded-2xl force-color badge-gold text-slate-950 flex flex-col items-center justify-center shadow-lg shadow-amber-500/25 ring-2 ring-amber-300/60 shrink-0 transform transition-transform group-hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #FDE047 0%, #EAB308 50%, #CA8A04 100%)",
                  color: "#020617",
                }}
              >
                <strong className="text-xl font-black leading-none text-slate-950">
                  {preview.length}
                </strong>
                <span className="text-[8px] uppercase font-black tracking-wider text-slate-950/90 mt-0.5">
                  questões
                </span>
              </div>
            </div>
          </div>

          {/* SELETOR DE PASTA DE ESTUDO */}
          <div className="space-y-2 bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex justify-between items-center">
              <label htmlFor="folder-selector" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                Pasta de Revisão
              </label>
              <span className="text-[10px] text-[#D4AF37] font-bold px-2 py-0.5 bg-[#D4AF37]/10 rounded-md border border-[#D4AF37]/20">
                {pool.length} disponíveis
              </span>
            </div>

            {/* Dropdown Select Customizado */}
            <select
              id="folder-selector"
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 hover:border-amber-500/40 text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer transition-all shadow-inner"
            >
              <option value="all">
                📁 Todas as Pastas ({allPool.length} questões)
              </option>
              {effectiveFolders.map((folder) => {
                const countInFolder = folderCounts.get(folder.id) || 0;
                const isSub = Boolean(folder.parentId);
                return (
                  <option key={folder.id} value={folder.id}>
                    {isSub ? "   ↳ " : "📂 "}{folder.name} ({countInFolder} questões)
                  </option>
                );
              })}
            </select>

            {/* Pills Rápidos de Pasta (Carrossel Horizontal) */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <button
                type="button"
                onClick={() => setSelectedFolderId("all")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${
                  selectedFolderId === "all"
                    ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37] shadow-sm"
                    : "border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                Todas ({allPool.length})
              </button>
              {effectiveFolders.map((folder) => {
                const isSelected = selectedFolderId === folder.id;
                const c = folderCounts.get(folder.id) || 0;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${
                      isSelected
                        ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37] shadow-sm"
                        : "border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    {folder.name} ({c})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controle de Volume com Slider & Atalhos Rápidos */}
          <div className="space-y-2.5 bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex justify-between items-center">
              <label htmlFor="question-volume-slider" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#D4AF37]" />
                Volume da Sessão
              </label>
              <span className="text-xs text-[#D4AF37] font-bold px-2 py-0.5 bg-[#D4AF37]/10 rounded-md border border-[#D4AF37]/20">
                {count} de {maxAvailable}
              </span>
            </div>

            <input
              id="question-volume-slider"
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
              type="range"
              min={1}
              max={maxAvailable}
              value={count}
              disabled={pool.length === 0}
              onChange={(event) => setCount(Number(event.target.value))}
            />

            {/* Botões Rápidos de Volume */}
            <div className="flex gap-1.5 pt-0.5">
              {quickVolumePresets.map((val) => {
                const isSelected = count === val;
                const isMax = val === maxAvailable;
                return (
                  <button
                    key={val}
                    type="button"
                    disabled={pool.length === 0}
                    onClick={() => setCount(val)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected
                        ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37] shadow-sm"
                        : "border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    {isMax ? "Máx" : val}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards da Carga de Hoje */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Composição do Lote
              </h4>
              <span className="text-[10px] text-slate-400 font-medium">
                {pool.length} no banco desta pasta
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Recuperação",
                  value: preview.filter((q) => q.bucket === "recovery").length,
                  icon: RotateCcw,
                  badgeStyle: "border-rose-500/30 bg-rose-500/10 text-rose-300",
                },
                {
                  label: "Manutenção",
                  value: preview.filter((q) => q.bucket === "maintenance").length,
                  icon: ShieldCheck,
                  badgeStyle: "border-sky-500/30 bg-sky-500/10 text-sky-300",
                },
                {
                  label: "Inéditas",
                  value: preview.filter((q) => q.bucket === "new").length,
                  icon: Sparkles,
                  badgeStyle: "border-violet-500/30 bg-violet-500/10 text-violet-300",
                },
                {
                  label: "Difíceis",
                  value: preview.filter((q) => q.difficult).length,
                  icon: Flame,
                  badgeStyle: "border-amber-500/30 bg-amber-500/10 text-amber-300",
                },
              ].map(({ label, value, icon: Icon, badgeStyle }) => (
                <div
                  key={label}
                  className={`border rounded-xl p-2.5 flex flex-col justify-between transition-all hover:brightness-110 ${badgeStyle}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-wider font-bold opacity-80">
                      {label}
                    </span>
                    <Icon className="w-3.5 h-3.5 opacity-70" />
                  </div>
                  <strong className="text-lg font-black mt-1 block">
                    {value}
                  </strong>
                </div>
              ))}

              <div className="col-span-2 border border-amber-500/20 bg-amber-500/5 rounded-xl p-2.5 flex justify-between items-center text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-300">
                    Revisões Vencidas
                  </span>
                </div>
                <strong className="text-xs font-black text-[#D4AF37] px-2 py-0.5 bg-[#D4AF37]/15 rounded-md border border-[#D4AF37]/25">
                  {preview.filter((q) => q.reviewOverdue).length}
                </strong>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            {activeReviewSession ? (
              <button
                onClick={() => setScreen("session")}
                className="w-full force-color badge-gold text-slate-950 font-black rounded-xl py-3 text-xs uppercase tracking-wider flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #FDE047 0%, #EAB308 50%, #CA8A04 100%)",
                  color: "#020617",
                }}
              >
                <Play className="w-4 h-4 fill-slate-950" /> Retomar Sessão Cronometrada
              </button>
            ) : (
              <button
                onClick={start}
                disabled={!preview.length}
                className="w-full force-color badge-gold text-slate-950 font-black rounded-xl py-3 text-xs uppercase tracking-wider flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                style={{
                  background: preview.length
                    ? "linear-gradient(135deg, #FDE047 0%, #EAB308 50%, #CA8A04 100%)"
                    : "#334155",
                  color: preview.length ? "#020617" : "#94a3b8",
                }}
              >
                <Play className="w-4 h-4 fill-current" /> Iniciar Sessão Cronometrada
              </button>
            )}
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              Você pode resolver as questões diretamente pelo painel à direita ou entrar no modo cronometrado.
            </p>
          </div>
        </div>
      </section>

      {/* Coluna Direita: Gerenciador de Questões Interativo (2/3) */}
      <section className="lg:col-span-2 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex flex-col h-full min-h-0 shadow-xl overflow-hidden backdrop-blur-md">
        {/* Abas Superiores Estilo Segmented Control */}
        <div className="bg-slate-950/70 border-b border-slate-800 px-4 md:px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            {[
              { id: "todo", label: "A Fazer Hoje", count: preview.length, accent: "text-[#D4AF37]" },
              { id: "solved", label: "Resolvidas Hoje", count: solvedToday.length, accent: "text-emerald-400" },
              { id: "forecast", label: "Matérias Previstas", count: previewGroups.length, accent: "text-sky-400" },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                    active
                      ? "text-slate-100 bg-slate-800/70 border border-slate-700/80 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      data-force-color="true"
                      className={`px-2 py-0.5 text-[9px] rounded-full font-black ${
                        tab.id === "todo"
                          ? "bg-[#D4AF37] text-slate-950"
                          : tab.id === "solved"
                          ? "bg-emerald-400 text-slate-950"
                          : "bg-slate-700 text-slate-200"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                  {active && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#D4AF37]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo da Aba Ativa */}
        <div className="flex-1 min-h-0 p-4 md:p-5 max-h-[62vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
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
                  <div className="text-center py-20 text-slate-400 flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-200">
                        {pool.length === 0
                          ? `Nenhuma questão pendente para revisão em "${selectedFolderName}".`
                          : "Tudo em dia!"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        {pool.length === 0 ? (
                          <span>
                            Experimente selecionar outra pasta ou clique em{" "}
                            <button
                              type="button"
                              onClick={() => setSelectedFolderId("all")}
                              className="text-[#D4AF37] underline font-bold hover:text-amber-300"
                            >
                              Todas as Pastas
                            </button>{" "}
                            para ver a carga global de hoje.
                          </span>
                        ) : (
                          "Você revisou todas as questões programadas para hoje nesta pasta. Ótimo trabalho!"
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  preview.map((question, index) => (
                    <motion.div
                      key={question.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -100, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      className="bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all duration-200 group flex flex-col md:flex-row justify-between gap-4 shadow-sm"
                    >
                      <div className="min-w-0 flex-1 flex gap-3.5">
                        {/* Número da questão */}
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-amber-500/30 text-[#D4AF37] flex items-center justify-center text-xs font-black shrink-0 shadow-inner">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-slate-100 text-sm font-bold">
                              Questão {question.questionNumber}
                            </strong>
                            <span className="text-[10px] text-slate-500">•</span>
                            <span className="text-xs text-slate-400 font-medium truncate max-w-[220px] md:max-w-xs" title={question.bookTitle}>
                              {question.bookTitle}
                            </span>
                            <span className={`text-[8px] uppercase font-bold tracking-wider border px-2 py-0.5 rounded-full ${bucketClass[question.bucket]}`}>
                              {bucketLabel[question.bucket]}
                            </span>
                            {question.difficult && (
                              <span className="text-[8px] uppercase font-bold tracking-wider border px-2 py-0.5 rounded-full border-amber-500/40 bg-amber-500/10 text-amber-300">
                                Difícil
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-200 font-bold mt-1.5 leading-snug">
                            {question.subject}
                          </p>

                          {question.submatters.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {question.submatters.map((sub) => (
                                <span
                                  key={sub}
                                  className="text-[9px] bg-slate-900/80 border border-slate-700/80 px-2 py-0.5 rounded-md text-slate-300 font-medium"
                                >
                                  {sub}
                                </span>
                              ))}
                            </div>
                          )}

                          {question.reasons.length > 0 && (
                            <div className="mt-2.5 flex items-center gap-1.5 text-[9px] text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-lg w-fit border border-[#D4AF37]/20">
                              <Sparkles className="w-3 h-3 shrink-0" />
                              <span className="font-semibold">{question.reasons.join(" · ")}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botões de Ação Direta no Card */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <button
                          onClick={() => recordQuestionAttemptDirectly(question.bookId, question.chapterId, question.questionNumber, "correct")}
                          className="bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm"
                          title="Marcar como acerto"
                        >
                          <Check className="w-4 h-4" /> Acertei
                        </button>
                        <button
                          onClick={() => recordQuestionAttemptDirectly(question.bookId, question.chapterId, question.questionNumber, "incorrect")}
                          className="bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-slate-950 border border-rose-500/30 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm"
                          title="Marcar como erro"
                        >
                          <X className="w-4 h-4" /> Errei
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
                  <div className="text-center py-20 text-slate-400 flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-300">Nenhuma questão resolvida hoje nesta pasta</p>
                      <p className="text-xs text-slate-500 mt-1">
                        As questões respondidas hoje aparecerão listadas aqui com horário e opção de desfazer.
                      </p>
                    </div>
                  </div>
                ) : (
                  solvedToday.map((question) => {
                    const isCorrect = question.latestAttempt.status === "correct";
                    return (
                      <motion.div
                        key={question.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                        className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-4 shadow-sm"
                      >
                        <div className="min-w-0 flex-1 flex gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-inner ${
                              isCorrect
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                            }`}
                          >
                            {isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <strong className="text-slate-100 text-sm font-bold">
                                Questão {question.questionNumber}
                              </strong>
                              <span className="text-[10px] text-slate-500">•</span>
                              <span className="text-xs text-slate-400 truncate max-w-[200px]" title={question.bookTitle}>
                                {question.bookTitle}
                              </span>
                              <span
                                className={`text-[8px] uppercase font-bold tracking-wider border px-2 py-0.5 rounded-full ${
                                  isCorrect
                                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                    : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                                }`}
                              >
                                {isCorrect ? "Acerto" : "Erro"}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 font-semibold mt-1">
                              {question.subject}
                            </p>

                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-2">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>
                                Resolvida às{" "}
                                {new Date(question.latestAttempt.timestamp).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center shrink-0 self-end md:self-center">
                          <button
                            onClick={() => recordQuestionAttemptDirectly(question.bookId, question.chapterId, question.questionNumber, "pending")}
                            className="text-slate-400 hover:text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Desfazer
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
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
                  <p className="text-sm text-slate-400 text-center py-16">Nenhuma matéria prevista nesta pasta para hoje.</p>
                ) : (
                  previewGroups.map((group) => (
                    <div key={group.key} className="border border-slate-800 bg-slate-900/40 rounded-2xl p-4 md:p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <strong className="text-sm text-slate-100 font-bold block leading-snug">
                            {group.subject}
                          </strong>
                          <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                            {group.bookTitle}
                          </span>
                        </div>
                        <span
                          data-force-color="true"
                          className="bg-[#D4AF37] text-slate-950 rounded-xl px-3 py-1 text-xs font-black shrink-0 shadow-md shadow-amber-500/10"
                        >
                          {group.total} q.
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3.5">
                        {[
                          ["Recuperação", group.recovery, "text-rose-300", "border-rose-500/20 bg-rose-500/5"],
                          ["Manutenção", group.maintenance, "text-sky-300", "border-sky-500/20 bg-sky-500/5"],
                          ["Inéditas", group.new, "text-violet-300", "border-violet-500/20 bg-violet-500/5"],
                        ].map(([label, val, textColor, boxClass]) => (
                          <div key={String(label)} className={`rounded-xl border px-2 py-2 text-center ${boxClass}`}>
                            <strong className={`block text-base font-black ${textColor}`}>{val}</strong>
                            <span className="text-[8px] uppercase text-slate-400 font-bold tracking-wider">{label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3.5 space-y-1.5">
                        {group.submatters.slice(0, 4).map((submatter) => (
                          <div
                            key={submatter.name}
                            className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/60 border border-slate-800/80 px-3 py-2"
                          >
                            <span className="text-xs text-slate-300 truncate">{submatter.name}</span>
                            <span className="text-[10px] text-[#D4AF37] font-bold shrink-0">{submatter.total} q.</span>
                          </div>
                        ))}
                        {group.submatters.length > 4 && (
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">
                            + {group.submatters.length - 4} outras submatérias nesta revisão
                          </p>
                        )}
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

  const active = activeReviewSession;
  const answered = active?.questions.filter((q) => ["correct", "incorrect"].includes(active.answers[q.id])).length || 0;
  const correct = active?.questions.filter((q) => active.answers[q.id] === "correct").length || 0;
  const incorrect = active?.questions.filter((q) => active.answers[q.id] === "incorrect").length || 0;
  const activeGroups = React.useMemo(() => groupQuestionsBySubject(active?.questions || []), [active?.questions]);

  const session = active ? (
    <div className="space-y-4">
      {/* Grade de Métricas da Sessão */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          ["Progresso", `${answered}/${active.questions.length}`, "text-[#D4AF37]"],
          ["Acertos", correct, "text-emerald-400"],
          ["Erros", incorrect, "text-rose-400"],
          ["Pendentes", active.questions.length - answered, "text-slate-300"],
        ].map(([label, value, textColor]) => (
          <div key={String(label)} className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-center shadow-sm">
            <strong className={`text-lg font-black block ${textColor}`}>{value}</strong>
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{label}</span>
          </div>
        ))}
        <TimerCell startedAt={active.startedAt} />
      </div>

      {/* Barra de Progresso com Proteção AMOLED */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner" data-force-color="true">
        <div
          data-force-color="true"
          className="h-full force-color transition-all duration-300"
          style={{
            width: `${(answered / active.questions.length) * 100}%`,
            background: "linear-gradient(90deg, #FDE047 0%, #10B981 100%)",
          }}
        />
      </div>

      {/* Agrupamento das Questões da Sessão */}
      <div className="space-y-4">
        {activeGroups.map((group) => {
          const groupAnswers = group.questions.map((question) => active.answers[question.id] || "pending");
          const groupCorrect = groupAnswers.filter((answer) => answer === "correct").length;
          const groupIncorrect = groupAnswers.filter((answer) => answer === "incorrect").length;
          const groupPending = group.total - groupCorrect - groupIncorrect;
          const questionIds = group.questions.map((question) => question.id);

          return (
            <section key={group.key} className="border border-slate-800 bg-slate-950/40 rounded-2xl overflow-hidden shadow-md">
              <div className="bg-slate-950/80 border-b border-slate-800 p-4">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-[.2em] text-[#D4AF37] font-bold">
                      {group.bookTitle}
                    </span>
                    <h3 className="text-base text-slate-100 font-bold leading-snug mt-0.5">
                      {group.subject}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {group.submatters.map((submatter) => (
                        <span
                          key={submatter.name}
                          className="text-[10px] bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-slate-300"
                        >
                          {submatter.name} · {submatter.total}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-2.5 shrink-0">
                    <div className="grid grid-cols-3 gap-1.5 text-center min-w-44">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5">
                        <strong className="text-emerald-400 font-bold block">{groupCorrect}</strong>
                        <span className="text-[8px] uppercase text-slate-400 font-bold">Acertos</span>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5">
                        <strong className="text-rose-400 font-bold block">{groupIncorrect}</strong>
                        <span className="text-[8px] uppercase text-slate-400 font-bold">Erros</span>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5">
                        <strong className="text-slate-300 font-bold block">{groupPending}</strong>
                        <span className="text-[8px] uppercase text-slate-400 font-bold">Pend.</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => markMany(questionIds, "correct")}
                        className="bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-500/40 text-emerald-300 hover:text-slate-950 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all"
                      >
                        Acertar Matéria
                      </button>
                      <button
                        type="button"
                        onClick={() => markMany(questionIds, "incorrect")}
                        className="bg-rose-500/20 hover:bg-rose-500 border border-rose-500/40 text-rose-300 hover:text-slate-950 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all"
                      >
                        Errar Matéria
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 space-y-2.5">
                {group.questions.map((question) => {
                  const globalIndex = active.questions.findIndex((item) => item.id === question.id) + 1;
                  const answer = active.answers[question.id] || "pending";
                  return (
                    <SessionQuestionCard
                      key={question.id}
                      question={question}
                      globalIndex={globalIndex}
                      answer={answer}
                      onSetAnswer={handleSetReviewAnswer}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Ações Inferiores da Sessão */}
      <div className="flex justify-between items-center gap-3 mt-6 pt-4 border-t border-slate-800">
        <button
          onClick={() => {
            if (confirm("Deseja realmente descartar esta sessão de revisão?")) {
              saveActiveReviewSession(null);
              setScreen("setup");
            }
          }}
          className="border border-rose-800 hover:bg-rose-950/40 text-rose-400 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
        >
          Descartar Sessão
        </button>

        <button
          onClick={finish}
          disabled={answered !== active.questions.length}
          className="force-color badge-gold text-slate-950 font-black rounded-xl px-6 py-2.5 text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: answered === active.questions.length
              ? "linear-gradient(135deg, #FDE047 0%, #EAB308 50%, #CA8A04 100%)"
              : "#334155",
            color: answered === active.questions.length ? "#020617" : "#94a3b8",
          }}
        >
          {answered === active.questions.length ? "Finalizar e Analisar Desempenho" : `Faltam ${active.questions.length - answered} questões`}
        </button>
      </div>
    </div>
  ) : null;

  const summary = report?.summary;
  const timeline = React.useMemo(() => {
    const source = [...reviewSessions, ...(report ? [report] : [])];
    return source
      .filter((item, index) => item.summary && source.findIndex((candidate) => candidate.id === item.id) === index)
      .sort((a, b) => new Date(a.completedAt || a.updatedAt).getTime() - new Date(b.completedAt || b.updatedAt).getTime())
      .slice(-10)
      .map((item) => ({
        date: new Date(item.completedAt || item.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        taxa: item.summary?.percentage || 0,
      }));
  }, [reviewSessions, report]);

  const reportView = summary ? (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
      {/* KPIs do Diagnóstico */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          ["Aproveitamento", `${summary.percentage}%`, "text-[#D4AF37]"],
          ["Acertos", summary.correct, "text-emerald-400"],
          ["Erros", summary.incorrect, "text-rose-400"],
          ["Recuperadas", summary.recovered, "text-sky-400"],
          ["Regressões", summary.regressed, "text-amber-400"],
          ["Linha de base", summary.baseline, "text-slate-300"],
        ].map(([label, value, textColor]) => (
          <div key={String(label)} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-center shadow-sm">
            <strong className={`text-2xl font-black block ${textColor}`}>{value}</strong>
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{label}</span>
          </div>
        ))}
      </div>

      {/* Delta em Relação a Sessões Anteriores */}
      <div
        className={`border rounded-2xl p-4 flex items-center gap-3.5 ${
          (summary.deltaFromPrevious || 0) >= 0
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-rose-500/30 bg-rose-500/10"
        }`}
      >
        {(summary.deltaFromPrevious || 0) >= 0 ? (
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
        )}
        <div>
          <strong className="text-sm font-bold text-slate-100">
            {summary.deltaFromPrevious === null
              ? "Primeira linha de base registrada para estas questões"
              : `${summary.deltaFromPrevious >= 0 ? "+" : ""}${summary.deltaFromPrevious} pontos percentuais`}
          </strong>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparação direta com o histórico anterior destas mesmas questões.
          </p>
        </div>
      </div>

      {/* Gráficos com Recharts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Evolução das Sessões" icon={<TrendingUp className="w-4 h-4 text-[#D4AF37]" />}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
              <Line dataKey="taxa" stroke="#D4AF37" strokeWidth={3} dot={{ fill: "#D4AF37", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Desempenho por Matéria" icon={<BarChart3 className="w-4 h-4 text-[#D4AF37]" />}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.subjects.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={10} />
              <YAxis type="category" dataKey="label" width={110} stroke="#64748b" fontSize={9} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
              <Bar dataKey="percentage" fill="#D4AF37" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Detalhamento de Matérias e Submatérias */}
      <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm text-slate-100 font-bold mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#D4AF37]" /> Matérias e Submatérias Analisadas
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {summary.submatters.map((row) => (
            <div key={row.key} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <strong className="text-xs text-slate-200 block truncate">{row.label}</strong>
                  <span className="text-[10px] text-slate-400 block truncate">{row.parentLabel}</span>
                </div>
                <strong className={`text-sm font-black ${row.percentage >= 70 ? "text-emerald-400" : "text-rose-400"}`}>
                  {row.percentage}%
                </strong>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
                <div
                  className={`h-full ${row.percentage >= 70 ? "bg-emerald-500" : "bg-rose-500"}`}
                  style={{ width: `${row.percentage}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400 block mt-1.5 font-medium">
                {row.correct} acertos · {row.incorrect} erros
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Linha do Tempo das Questões */}
      <QuestionTimeline session={report} />

      {/* Recomendações da Próxima Revisão */}
      <section className="bg-amber-500/5 border border-amber-500/25 rounded-2xl p-5">
        <h3 className="text-sm text-amber-300 font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#D4AF37]" /> Recomendações do Algoritmo
        </h3>
        <div className="mt-2.5 space-y-1.5">
          {summary.recommendations.map((item, idx) => (
            <p key={idx} className="text-xs text-slate-300 flex items-start gap-2">
              <span className="text-[#D4AF37] font-bold mt-0.5">•</span>
              <span>{item}</span>
            </p>
          ))}
        </div>
      </section>
    </div>
  ) : setup;

  const history = (
    <div className="space-y-3 max-h-[68vh] overflow-y-auto pr-1">
      {reviewSessions.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            setReport(item);
            setScreen("report");
          }}
          className="w-full bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 flex justify-between items-center text-left transition-all group cursor-pointer"
        >
          <div>
            <strong className="text-sm text-slate-200 group-hover:text-amber-300 font-bold block transition-colors">
              {new Date(item.completedAt || item.updatedAt).toLocaleDateString("pt-BR", { dateStyle: "long" })}
            </strong>
            <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
              {item.questions.length} questões · {item.summary?.correct || 0} acertos
            </span>
          </div>

          <div className="flex items-center gap-3">
            <strong className="text-xl font-black text-[#D4AF37]">
              {item.summary?.percentage || 0}%
            </strong>
            <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      ))}

      {!reviewSessions.length && (
        <div className="text-center text-slate-400 py-20 flex flex-col items-center justify-center gap-3">
          <History className="w-10 h-10 text-slate-600" />
          <p className="text-sm font-semibold">Nenhuma sessão concluída ainda.</p>
          <p className="text-xs text-slate-500">As sessões finalizadas ficarão salvas aqui para análise.</p>
        </div>
      )}
    </div>
  );

  const title =
    screen === "setup"
      ? "Central de revisão"
      : screen === "session"
      ? "Sessão inteligente"
      : screen === "report"
      ? "Diagnóstico da sessão"
      : "Histórico de revisões";

  return (
    <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-3 z-50 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="smart-review-title"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-[96rem] max-h-[calc(100dvh-1rem)] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Cabeçalho do Modal */}
        <header className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            {screen !== "setup" && (
              <button
                onClick={() => setScreen(screen === "report" && reviewSessions.length ? "history" : "setup")}
                className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-850 rounded-xl text-slate-300 transition-colors cursor-pointer"
                title="Voltar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                  <BrainCircuit className="w-3.5 h-3.5" />
                </span>
                <span className="text-[10px] uppercase tracking-[.28em] text-[#D4AF37] font-bold">
                  Revisão Adaptativa
                </span>
              </div>
              <h2 id="smart-review-title" className="text-2xl font-serif italic text-slate-100 font-bold mt-0.5">
                {title}
              </h2>
              <p className="text-xs text-slate-400">Livro → matéria → submatéria → questão</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {screen === "setup" && (
              <button
                onClick={() => setScreen("history")}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-800 hover:border-amber-500/40 bg-slate-900/60 hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
                title="Ver Histórico de Revisões"
              >
                <History className="w-4 h-4 text-[#D4AF37]" />
                <span className="hidden sm:inline">Histórico</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-850 rounded-xl text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Conteúdo Principal do Modal */}
        <main
          data-testid="random-questions-content"
          className="p-4 md:p-6 min-h-0 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
        >
          {screen === "setup" ? setup : screen === "session" ? session : screen === "report" ? reportView : history}
        </main>

        {/* Rodapé no Setup */}
        {screen === "setup" && (
          <footer className="shrink-0 border-t border-slate-800 bg-slate-950/80 px-5 py-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between pb-safe">
            <p className="text-xs text-slate-400">
              {preview.length
                ? `${preview.length} questões selecionadas em "${selectedFolderName}" prontas para revisar hoje.`
                : `Nenhuma questão pendente para revisão hoje em "${selectedFolderName}".`}
            </p>
            <div className="flex gap-2">
              {activeReviewSession ? (
                <button
                  onClick={() => setScreen("session")}
                  className="flex-1 sm:flex-none force-color badge-gold text-slate-950 font-black rounded-xl px-5 py-2.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #FDE047 0%, #EAB308 50%, #CA8A04 100%)",
                    color: "#020617",
                  }}
                >
                  <Play className="w-4 h-4 fill-slate-950" /> Retomar Sessão
                </button>
              ) : (
                <button
                  onClick={start}
                  disabled={!preview.length}
                  className="flex-1 sm:flex-none force-color badge-gold text-slate-950 font-black rounded-xl px-5 py-2.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: preview.length
                      ? "linear-gradient(135deg, #FDE047 0%, #EAB308 50%, #CA8A04 100%)"
                      : "#334155",
                    color: preview.length ? "#020617" : "#94a3b8",
                  }}
                >
                  <Play className="w-4 h-4 fill-current" /> Iniciar Sessão
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
  return (
    <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm text-slate-100 font-bold flex items-center gap-2 mb-3">
        {icon}
        {title}
      </h3>
      <div className="h-56">{children}</div>
    </section>
  );
}

function QuestionTimeline({ session }: { session: SmartReviewSession }) {
  const rows = session.questions
    .flatMap((question) => {
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
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm text-slate-100 font-bold mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#D4AF37]" /> Linha do Tempo das Questões
      </h3>
      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
        {rows.map((row) => (
          <div
            key={row.id}
            className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <strong className="text-xs text-slate-200 block truncate">
                Questão {row.question} · {row.subject}
              </strong>
              <span className="text-[10px] text-slate-400 block truncate">{row.submatter}</span>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`text-xs font-bold ${
                  row.status === "correct" ? "text-emerald-400" : "text-rose-400"
                }`}
              >
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

function TimerCell({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    const startedTime = new Date(startedAt).getTime();
    const update = () => {
      setElapsed(Math.floor((Date.now() - startedTime) / 1000));
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-center shadow-sm">
      <strong className="text-lg font-black text-slate-100 block tracking-wider">
        {minutes}:{seconds}
      </strong>
      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Tempo</span>
    </div>
  );
}

interface SessionQuestionCardProps {
  question: SmartReviewQuestion;
  globalIndex: number;
  answer: SmartReviewAnswer;
  onSetAnswer: (questionId: string, nextStatus: SmartReviewAnswer) => void;
}

const SessionQuestionCard = React.memo(function SessionQuestionCard({
  question,
  globalIndex,
  answer,
  onSetAnswer,
}: SessionQuestionCardProps) {
  const isCorrect = answer === "correct";
  const isIncorrect = answer === "incorrect";

  return (
    <article
      className={`border rounded-2xl p-4 transition-all duration-200 ${
        isCorrect
          ? "border-emerald-500/40 bg-emerald-500/10 shadow-sm shadow-emerald-500/5"
          : isIncorrect
          ? "border-rose-500/40 bg-rose-500/10 shadow-sm shadow-rose-500/5"
          : "border-slate-800 bg-slate-900/50"
      }`}
    >
      <div className="flex flex-col lg:flex-row gap-3 lg:items-start">
        <div className="flex gap-3.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[#D4AF37] flex items-center justify-center text-xs font-black shrink-0 shadow-inner">
            {String(globalIndex).padStart(2, "0")}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2 items-center">
              <h4 className="text-sm font-bold text-slate-100">Questão {question.questionNumber}</h4>
              <span className={`text-[9px] uppercase border px-2 py-0.5 rounded-full font-bold ${bucketClass[question.bucket]}`}>
                {bucketLabel[question.bucket]}
              </span>
              {answer !== "pending" && (
                <span
                  className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    isCorrect
                      ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                      : "border-rose-500/40 bg-rose-500/20 text-rose-300"
                  }`}
                >
                  {isCorrect ? "Marcada como acerto" : "Marcada como erro"}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-200 font-semibold mt-1">{question.subject}</p>

            <div className="flex flex-wrap gap-1 mt-2">
              {question.submatters.map((name) => (
                <span key={name} className="text-[10px] bg-slate-800/80 border border-slate-700 rounded-md px-2 py-0.5 text-slate-300 font-medium">
                  {name}
                </span>
              ))}
            </div>

            {question.reasons.length > 0 && (
              <p className="text-xs text-slate-400 mt-2.5 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                {question.reasons.join(" · ")}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:w-64 self-end lg:self-center shrink-0">
          <button
            onClick={() => onSetAnswer(question.id, isCorrect ? "pending" : "correct")}
            className={`rounded-xl border px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isCorrect
                ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]"
                : "bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300"
            }`}
            aria-label={`Marcar questão ${question.questionNumber} como correta`}
          >
            <Check className="w-4 h-4" /> Acertei
          </button>

          <button
            onClick={() => onSetAnswer(question.id, isIncorrect ? "pending" : "incorrect")}
            className={`rounded-xl border px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isIncorrect
                ? "bg-rose-500 border-rose-400 text-slate-950 shadow-md shadow-rose-500/20 scale-[1.02]"
                : "bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-rose-500/50 hover:text-rose-300"
            }`}
            aria-label={`Marcar questão ${question.questionNumber} como incorreta`}
          >
            <X className="w-4 h-4" /> Errei
          </button>
        </div>
      </div>
    </article>
  );
});
