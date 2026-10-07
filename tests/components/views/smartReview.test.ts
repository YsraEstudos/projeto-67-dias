import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AulaBook, SmartReviewAnswer } from "../../../types";
import {
  buildSmartReviewPool,
  buildSmartReviewSummary,
  SECONDARY_SUBMATTER,
  selectSmartReviewQuestions,
  toLocalDayKey,
} from "../../../components/views/AulasView/smartReview";

const now = new Date("2026-06-23T12:00:00.000Z");

const makeBook = (): AulaBook => ({
  id: "book-1",
  folderId: "folder-1",
  title: "Matemática",
  coverImage: null,
  targetDate: null,
  position: 0,
  chapters: [{
    id: "chapter-1",
    title: "Aula 1 — Razão e proporção",
    content: "",
    attachments: {},
    position: 0,
    nextReviewDate: "2026-06-20",
    difficultQuestions: [2],
    relatedQuestions: {
      aula: 1,
      titulo: "Razão e proporção",
      questoes_principais: [1, 2, 3, 4],
      por_secao: [
        { secao: "Razão, equivalência e composição de razões", questoes: [1, 2] },
        { secao: "Divisão diretamente proporcional", questoes: [3] },
      ],
      questoes_secundarias_que_misturam_com_aulas_futuras: [4],
    },
    questionAttempts: {
      "1": {
        total: 2,
        correct: 1,
        incorrect: 1,
        history: [
          { timestamp: "2026-06-10T10:00:00.000Z", status: "incorrect" },
          { timestamp: "2026-05-10T10:00:00.000Z", status: "correct" },
        ],
      },
      "3": {
        total: 1,
        correct: 1,
        incorrect: 0,
        history: [{ timestamp: "2026-06-01T10:00:00.000Z", status: "correct" }],
      },
    },
  }],
});

describe("smart review engine", () => {
  it("classifies sections, secondary questions and adaptive buckets", () => {
    const pool = buildSmartReviewPool([makeBook()], now);
    expect(pool.find((item) => item.questionNumber === 1)?.bucket).toBe("recovery");
    expect(pool.find((item) => item.questionNumber === 2)?.reasons).toContain("Marcada como difícil");
    expect(pool.find((item) => item.questionNumber === 3)?.bucket).toBe("recovery");
    expect(pool.find((item) => item.questionNumber === 4)?.submatters).toContain(SECONDARY_SUBMATTER);
  });

  it("respects the requested limit and keeps unique questions", () => {
    const selected = selectSmartReviewQuestions([makeBook()], 3, now);
    expect(selected).toHaveLength(3);
    expect(new Set(selected.map((item) => item.id)).size).toBe(3);
  });

  it("avoids questions answered today when alternatives exist", () => {
    const book = makeBook();
    book.chapters[0].questionAttempts!["2"] = {
      total: 1,
      correct: 0,
      incorrect: 1,
      history: [{ timestamp: "2026-06-23T08:00:00.000Z", status: "incorrect" }],
    };
    const selected = selectSmartReviewQuestions([book], 1, now);
    expect(selected[0].questionNumber).not.toBe(2);
  });

  it("caps sessions at 30 and returns all available questions when the pool is smaller", () => {
    const book = makeBook();
    book.chapters[0].relatedQuestions!.questoes_principais = Array.from({ length: 40 }, (_, index) => index + 1);
    expect(selectSmartReviewQuestions([book], 50, now)).toHaveLength(30);
    expect(selectSmartReviewQuestions([makeBook()], 30, now)).toHaveLength(4);
  });

  it("calculates recovery, regression and submatter percentages", () => {
    const questions = buildSmartReviewPool([makeBook()], now);
    const answers: Record<string, SmartReviewAnswer> = Object.fromEntries(
      questions.map((question) => [question.id, question.questionNumber === 3 ? "incorrect" : "correct"]),
    );
    const summary = buildSmartReviewSummary(questions, answers);
    expect(summary.recovered).toBe(1);
    expect(summary.regressed).toBe(1);
    expect(summary.baseline).toBe(2);
    expect(summary.submatters.some((row) => row.label === SECONDARY_SUBMATTER)).toBe(true);
  });

  describe("local calendar days (UTC-3)", () => {
    let originalTz: string | undefined;
    beforeEach(() => {
      originalTz = process.env.TZ;
      process.env.TZ = "America/Sao_Paulo";
    });
    afterEach(() => {
      if (originalTz === undefined) delete process.env.TZ;
      else process.env.TZ = originalTz;
    });

    it("maps late-evening timestamps to the local day and keeps date-only strings", () => {
      expect(toLocalDayKey("2026-06-24T01:30:00.000Z")).toBe("2026-06-23");
      expect(toLocalDayKey("2026-06-20")).toBe("2026-06-20");
      expect(toLocalDayKey(undefined)).toBe("");
    });

    it("treats an attempt made this local evening as answered today", () => {
      // 22:00 in Sao Paulo on 2026-06-23 (already 2026-06-24 in UTC).
      const evening = new Date("2026-06-24T01:00:00.000Z");
      const book = makeBook();
      book.chapters[0].questionAttempts!["2"] = {
        total: 1,
        correct: 0,
        incorrect: 1,
        history: [{ timestamp: "2026-06-23T13:00:00.000Z", status: "incorrect" }],
      };
      const selected = selectSmartReviewQuestions([book], 1, evening);
      expect(selected[0].questionNumber).not.toBe(2);
    });

    it("does not flag a review as overdue before the local due day arrives", () => {
      // 22:00 local on 2026-06-19; review is due on 2026-06-20.
      const pool = buildSmartReviewPool([makeBook()], new Date("2026-06-20T01:00:00.000Z"));
      expect(pool.every((item) => !item.reviewOverdue)).toBe(true);
    });
  });
});
