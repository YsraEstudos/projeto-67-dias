import {
  AulaBook,
  AulaChapter,
  QuestionAttempt,
  SmartReviewAnswer,
  SmartReviewBucket,
  SmartReviewPerformanceRow,
  SmartReviewQuestion,
  SmartReviewSession,
  SmartReviewSummary,
} from "../../../types";

export const SMART_REVIEW_MIN = 1;
export const SMART_REVIEW_MAX = 30;
export const SECONDARY_SUBMATTER = "Secundárias / conteúdo futuro";

const DAY_MS = 86_400_000;
const dateOnly = (timestamp?: string) => timestamp?.slice(0, 10) || "";

const stableHash = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
};

const collectQuestionMetadata = (chapter: AulaChapter) => {
  const metadata = new Map<number, Set<string>>();
  const related = chapter.relatedQuestions;
  if (!related) return metadata;

  const ensure = (questionNumber: number) => {
    if (questionNumber <= 0) return null;
    if (!metadata.has(questionNumber)) metadata.set(questionNumber, new Set());
    return metadata.get(questionNumber)!;
  };

  related.questoes_principais?.forEach((questionNumber) => ensure(questionNumber));
  related.por_secao?.forEach((section) => {
    section.questoes?.forEach((questionNumber) => ensure(questionNumber)?.add(section.secao));
  });
  related.questoes_secundarias_que_misturam_com_aulas_futuras?.forEach((questionNumber) => {
    ensure(questionNumber)?.add(SECONDARY_SUBMATTER);
  });

  return metadata;
};

const classifyCandidate = (
  history: QuestionAttempt[],
  difficult: boolean,
  reviewOverdue: boolean,
): SmartReviewBucket => {
  if (history.length === 0) return "new";
  const incorrect = history.filter((attempt) => attempt.status === "incorrect").length;
  const errorRate = incorrect / history.length;
  const regressed = history.length > 1 && history[0].status === "incorrect" && history[1].status === "correct";
  return history[0].status === "incorrect" || errorRate >= 0.4 || difficult || reviewOverdue || regressed
    ? "recovery"
    : "maintenance";
};

const scoreCandidate = (
  history: QuestionAttempt[],
  difficult: boolean,
  reviewOverdue: boolean,
  now: Date,
): { priority: number; reasons: string[] } => {
  const reasons: string[] = [];
  if (history.length === 0) {
    let priority = 20;
    reasons.push("Questão inédita para ampliar a cobertura");
    if (difficult) {
      priority += 25;
      reasons.push("Marcada como difícil");
    }
    if (reviewOverdue) {
      priority += 30;
      reasons.push("Revisão da matéria vencida");
    }
    return { priority, reasons };
  }

  const latest = history[0];
  const incorrect = history.filter((attempt) => attempt.status === "incorrect").length;
  const errorRate = incorrect / history.length;
  const daysSince = Math.max(0, Math.floor((now.getTime() - new Date(latest.timestamp).getTime()) / DAY_MS));
  let priority = Math.min(35, daysSince * 1.5) + errorRate * 45;

  if (latest.status === "incorrect") {
    priority += 45;
    reasons.push("Erro na tentativa mais recente");
  }
  if (errorRate >= 0.4) reasons.push(`Taxa histórica de erros de ${Math.round(errorRate * 100)}%`);
  if (daysSince >= 7) reasons.push(`Sem revisão há ${daysSince} dias`);
  if (difficult) {
    priority += 25;
    reasons.push("Marcada como difícil");
  }
  if (reviewOverdue) {
    priority += 30;
    reasons.push("Revisão da matéria vencida");
  }
  if (history.length > 1 && history[0].status === "incorrect" && history[1].status === "correct") {
    priority += 35;
    reasons.push("Regressão recente: acerto seguido de erro");
  }
  if (reasons.length === 0) reasons.push("Manutenção de conhecimento já consolidado");
  return { priority, reasons };
};

export const buildSmartReviewPool = (books: AulaBook[], now = new Date()): SmartReviewQuestion[] =>
  books.flatMap((book) =>
    (book.chapters || []).flatMap((chapter) => {
      const metadata = collectQuestionMetadata(chapter);
      return Array.from(metadata.entries()).map(([questionNumber, submatterSet]) => {
        const attempts = chapter.questionAttempts?.[String(questionNumber)]?.history || [];
        const difficult = (chapter.difficultQuestions || []).includes(questionNumber);
        const reviewOverdue = Boolean(chapter.nextReviewDate && chapter.nextReviewDate <= dateOnly(now.toISOString()));
        const { priority, reasons } = scoreCandidate(attempts, difficult, reviewOverdue, now);
        return {
          id: `${book.id}:${chapter.id}:${questionNumber}`,
          bookId: book.id,
          bookTitle: book.title,
          chapterId: chapter.id,
          subject: chapter.relatedQuestions?.titulo || chapter.title,
          questionNumber,
          submatters: submatterSet.size > 0 ? Array.from(submatterSet) : ["Geral"],
          bucket: classifyCandidate(attempts, difficult, reviewOverdue),
          priority,
          reasons,
          previousStatus: attempts[0]?.status,
          previousAttemptAt: attempts[0]?.timestamp,
          previousAttempts: attempts,
          difficult,
          reviewOverdue,
        };
      });
    }),
  );

const chooseWithDiversity = (
  candidates: SmartReviewQuestion[],
  targetSize: number,
  selected: SmartReviewQuestion[],
  requestedCount: number,
) => {
  const subjectCounts = new Map<string, number>();
  const submatterCounts = new Map<string, number>();
  selected.forEach((item) => {
    subjectCounts.set(item.chapterId, (subjectCounts.get(item.chapterId) || 0) + 1);
    item.submatters.forEach((name) => {
      const key = `${item.chapterId}:${name}`;
      submatterCounts.set(key, (submatterCounts.get(key) || 0) + 1);
    });
  });
  const subjectLimit = Math.max(3, Math.ceil(requestedCount * 0.3));
  const submatterLimit = Math.max(2, Math.ceil(requestedCount * 0.2));
  const sorted = [...candidates].sort((a, b) => b.priority - a.priority || stableHash(a.id) - stableHash(b.id));

  for (const item of sorted) {
    if (selected.length >= targetSize || selected.some((chosen) => chosen.id === item.id)) continue;
    const subjectCount = subjectCounts.get(item.chapterId) || 0;
    const allSubmattersFull = item.submatters.every(
      (name) => (submatterCounts.get(`${item.chapterId}:${name}`) || 0) >= submatterLimit,
    );
    if (subjectCount >= subjectLimit || allSubmattersFull) continue;
    selected.push(item);
    subjectCounts.set(item.chapterId, subjectCount + 1);
    item.submatters.forEach((name) => {
      const key = `${item.chapterId}:${name}`;
      submatterCounts.set(key, (submatterCounts.get(key) || 0) + 1);
    });
  }
};

export const selectSmartReviewQuestions = (
  books: AulaBook[],
  requestedCount: number,
  now = new Date(),
): SmartReviewQuestion[] => {
  const limit = Math.max(SMART_REVIEW_MIN, Math.min(SMART_REVIEW_MAX, Math.round(requestedCount)));
  const pool = buildSmartReviewPool(books, now);
  const today = dateOnly(now.toISOString());
  const notAnsweredToday = pool.filter((item) => dateOnly(item.previousAttemptAt) !== today);
  const source = notAnsweredToday.length >= limit ? notAnsweredToday : pool;
  const selected: SmartReviewQuestion[] = [];
  const recoveryQuota = Math.round(limit * 0.6);
  const maintenanceQuota = Math.round(limit * 0.2);
  const quotas: Record<SmartReviewBucket, number> = {
    recovery: recoveryQuota,
    maintenance: maintenanceQuota,
    new: limit - recoveryQuota - maintenanceQuota,
  };

  (["recovery", "maintenance", "new"] as SmartReviewBucket[]).forEach((bucket) => {
    chooseWithDiversity(
      source.filter((item) => item.bucket === bucket),
      selected.length + quotas[bucket],
      selected,
      limit,
    );
  });
  chooseWithDiversity(source, limit, selected, limit);

  if (selected.length < limit) {
    [...source].sort((a, b) => b.priority - a.priority).forEach((item) => {
      if (selected.length < limit && !selected.some((chosen) => chosen.id === item.id)) selected.push(item);
    });
  }
  return selected.slice(0, limit);
};

const aggregateRows = (
  questions: SmartReviewQuestion[],
  answers: Record<string, SmartReviewAnswer>,
  kind: "subject" | "submatter",
): SmartReviewPerformanceRow[] => {
  const rows = new Map<string, SmartReviewPerformanceRow>();
  questions.forEach((question) => {
    const answer = answers[question.id];
    if (answer !== "correct" && answer !== "incorrect") return;
    const labels = kind === "subject" ? [question.subject] : question.submatters;
    labels.forEach((label) => {
      const key = kind === "subject" ? question.chapterId : `${question.chapterId}:${label}`;
      const current = rows.get(key) || {
        key,
        label,
        parentLabel: kind === "submatter" ? question.subject : question.bookTitle,
        total: 0,
        correct: 0,
        incorrect: 0,
        percentage: 0,
      };
      current.total += 1;
      current[answer] += 1;
      current.percentage = Math.round((current.correct / current.total) * 100);
      rows.set(key, current);
    });
  });
  return Array.from(rows.values()).sort((a, b) => a.percentage - b.percentage || b.total - a.total);
};

export const buildSmartReviewSummary = (
  questions: SmartReviewQuestion[],
  answers: Record<string, SmartReviewAnswer>,
): SmartReviewSummary => {
  const completed = questions.filter((question) => ["correct", "incorrect"].includes(answers[question.id]));
  const correct = completed.filter((question) => answers[question.id] === "correct").length;
  const percentage = completed.length ? Math.round((correct / completed.length) * 100) : 0;
  const comparable = completed.filter((question) => question.previousStatus);
  const previousRate = comparable.length
    ? Math.round((comparable.filter((question) => question.previousStatus === "correct").length / comparable.length) * 100)
    : null;
  const subjects = aggregateRows(completed, answers, "subject");
  const submatters = aggregateRows(completed, answers, "submatter");
  const recommendations = submatters
    .filter((row) => row.percentage < 70)
    .slice(0, 3)
    .map((row) => `Revisar ${row.parentLabel} → ${row.label} (${row.percentage}% de acertos).`);

  if (recommendations.length === 0 && percentage >= 80) {
    recommendations.push("Bom domínio geral: aumente gradualmente o intervalo até a próxima revisão.");
  }
  if (completed.some((question) => answers[question.id] === "incorrect" && question.previousStatus === "correct")) {
    recommendations.push("Priorize as regressões na próxima sessão para impedir perda de retenção.");
  }

  return {
    total: completed.length,
    correct,
    incorrect: completed.length - correct,
    percentage,
    recovered: completed.filter((question) => question.previousStatus === "incorrect" && answers[question.id] === "correct").length,
    regressed: completed.filter((question) => question.previousStatus === "correct" && answers[question.id] === "incorrect").length,
    baseline: completed.filter((question) => !question.previousStatus).length,
    deltaFromPrevious: previousRate === null ? null : percentage - previousRate,
    subjects,
    submatters,
    recommendations,
  };
};
