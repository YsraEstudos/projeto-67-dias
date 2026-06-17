import { AulaBook, AulaChapter } from "../../../types";

export interface RandomQuestionItem {
  id: string;
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  questionNumber: number;
}

const QUESTION_LIMIT = 15;
const MAX_PER_CONTENT = 3;

const shuffle = <T,>(items: T[]): T[] => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const collectChapterQuestionNumbers = (chapter: AulaChapter): number[] => {
  const relatedQuestions = chapter.relatedQuestions;
  if (!relatedQuestions) return [];

  const numbers = new Set<number>();

  relatedQuestions.questoes_principais?.forEach((questionNumber) => {
    if (questionNumber > 0) numbers.add(questionNumber);
  });

  relatedQuestions.por_secao?.forEach((section) => {
    section.questoes?.forEach((questionNumber) => {
      if (questionNumber > 0) numbers.add(questionNumber);
    });
  });

  relatedQuestions.questoes_secundarias_que_misturam_com_aulas_futuras?.forEach((questionNumber) => {
    if (questionNumber > 0) numbers.add(questionNumber);
  });

  return Array.from(numbers);
};

export const buildRandomQuestionPool = (books: AulaBook[]): RandomQuestionItem[] =>
  books.flatMap((book) =>
    (book.chapters || []).flatMap((chapter) =>
      collectChapterQuestionNumbers(chapter).map((questionNumber) => ({
        id: `${book.id}:${chapter.id}:${questionNumber}`,
        bookId: book.id,
        bookTitle: book.title,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        questionNumber,
      })),
    ),
  );

export const drawRandomQuestions = (
  books: AulaBook[],
  limit = QUESTION_LIMIT,
  maxPerContent = MAX_PER_CONTENT,
): RandomQuestionItem[] => {
  const contentCounts = new Map<string, number>();

  return shuffle(buildRandomQuestionPool(books)).filter((item) => {
    if (contentCounts.size === 0 && limit <= 0) return false;

    const currentCount = contentCounts.get(item.bookId) || 0;
    if (currentCount >= maxPerContent) return false;

    contentCounts.set(item.bookId, currentCount + 1);
    return true;
  }).slice(0, limit);
};

