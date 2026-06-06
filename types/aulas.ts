export interface AulaFolder {
  id: string;
  name: string;
  position: number;
  parentId?: string;
}

export interface AulaCollection {
  id: string;
  name: string;
  description?: string;
  position: number;
  bookIds: string[];
}

export interface AulaStorageAsset {
  storageUrl: string;
  storagePath: string;
  width: number;
  height: number;
}

export interface AulaAttachmentMap {
  [headingSlug: string]: string;
}

export interface AulaChapterComment {
  id: string;
  selectedText: string;
  body: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AulaRelatedQuestionsSection {
  secao: string;
  questoes: number[];
}

export interface AulaRelatedQuestions {
  aula: number;
  titulo: string;
  questoes_principais: number[];
  por_secao: AulaRelatedQuestionsSection[];
  questoes_secundarias_que_misturam_com_aulas_futuras: number[];
  observacao?: string;
}

export interface QuestionAttempt {
  timestamp: string;
  status: 'correct' | 'incorrect';
}

export interface QuestionStats {
  total: number;
  correct: number;
  incorrect: number;
  history: QuestionAttempt[];
}

export interface AulaChapter {
  id: string;
  title: string;
  content: string; // Markdown text
  attachments: AulaAttachmentMap;
  position: number;
  lastReadSlug?: string;
  readAt?: string;
  relatedQuestions?: AulaRelatedQuestions;
  completedPrincipalQuestions?: number[];
  correctQuestions?: number[];
  incorrectQuestions?: number[];
  difficultQuestions?: number[];
  confidence?: 'easy' | 'medium' | 'hard';
  nextReviewDate?: string;
  studyTimeSeconds?: number;
  timerSeconds?: number;
  comments?: AulaChapterComment[];
  questionAttempts?: Record<string, QuestionStats>;
}

export interface RecentlyStudiedItem {
  bookId: string;
  chapterId: string;
  bookTitle: string;
  chapterTitle: string;
  accessedAt: string;
}

export interface AulaBook {
  id: string;
  folderId: string;
  title: string;
  coverImage: string | null;
  targetDate: string | null; // Data ISO
  position: number;
  chapters: AulaChapter[];
}

export interface AulaAppState {
  folders: AulaFolder[];
  collections: AulaCollection[];
}
