export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
}

export interface ReadingLog {
  id: string;
  date: string;        // YYYY-MM-DD
  pagesRead: number;
  bookId: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  genre: string;

  unit: 'PAGES' | 'CHAPTERS' | 'HOURS';
  total: number;
  current: number;

  status: 'READING' | 'TO_READ' | 'COMPLETED' | 'PAUSED' | 'ABANDONED';
  rating: number;
  folderId: string | null;

  notes: string;
  addedAt: string | Date; // Permite string ISO para persistência fácil

  // Daily Progress Tracking
  dailyGoal?: number; // Meta diária (páginas/capítulos)
  logs?: ReadingLog[];

  // Exponential Distribution
  deadline?: string;                              // ISO date (YYYY-MM-DD)
  distributionType?: 'LINEAR' | 'EXPONENTIAL';    // LINEAR = padrão
  excludedDays?: number[];                        // 0=dom, 1=seg, ..., 6=sáb
  exponentialIntensity?: number;                  // 0.0-1.0 intensidade da curva
}
