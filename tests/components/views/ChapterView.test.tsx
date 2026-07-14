import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChapterView, { parseQuestionNumbers, formatQuestionNumbers } from '../../../components/views/AulasView/ChapterView';

// Mock Zustand store updates
const mockUpdateChapter = vi.fn();

// Mock initial data setup for the tests
const mockBooks: any[] = [
  {
    id: 'book-1',
    folderId: 'folder-1',
    title: 'Book Title',
    coverImage: null,
    targetDate: null,
    position: 0,
    chapters: [
      {
        id: 'chapter-1',
        title: 'Aula 1',
        content: '# Aula 1\n\n## Subseção 1\n\nTexto da subseção 1\n\n## Subseção 2\n\nTexto da subseção 2',
        attachments: {},
        position: 0,
        relatedQuestions: {
          aula: 1,
          titulo: 'Aula 1',
          questoes_principais: [3, 5, 13],
          por_secao: [
            {
              secao: 'Seção de Teste',
              questoes: [3, 5]
            }
          ],
          questoes_secundarias_que_misturam_com_aulas_futuras: []
        },
        correctQuestions: [3],
        incorrectQuestions: [5],
        difficultQuestions: [],
        completedPrincipalQuestions: [3, 5],
        questionAttempts: {
          '3': {
            total: 1,
            correct: 1,
            incorrect: 0,
            history: [
              {
                status: 'correct' as const,
                timestamp: '2026-05-25T12:00:00.000Z'
              }
            ]
          },
          '5': {
            total: 1,
            correct: 0,
            incorrect: 1,
            history: [
              {
                status: 'incorrect' as const,
                timestamp: '2026-05-25T12:05:00.000Z'
              }
            ]
          }
        }
      }
    ]
  }
];

vi.mock('../../../stores/aulasStore', () => ({
  useAulasStore: () => ({
    books: mockBooks,
    updateChapter: mockUpdateChapter,
    addRecentlyStudied: vi.fn(),
    setChapterConfidence: vi.fn(),
    updateChapterStudyTime: vi.fn(),
  })
}));

describe('ChapterView - Question Performance Evolution & Pill Styles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset test book structure to same-day attempts
    mockBooks[0].chapters[0].correctQuestions = [3];
    mockBooks[0].chapters[0].incorrectQuestions = [5];
    mockBooks[0].chapters[0].difficultQuestions = [];
    mockBooks[0].chapters[0].completedPrincipalQuestions = [3, 5];
    mockBooks[0].chapters[0].questionAttempts = {
      '3': {
        total: 1,
        correct: 1,
        incorrect: 0,
        history: [
          {
            status: 'correct' as const,
            timestamp: '2026-05-25T12:00:00.000Z'
          }
        ]
      },
      '5': {
        total: 1,
        correct: 0,
        incorrect: 1,
        history: [
          {
            status: 'incorrect' as const,
            timestamp: '2026-05-25T12:05:00.000Z'
          }
        ]
      }
    };
  });

  it('renders correctly and has sticky outline and sticky header classes', () => {
    render(<ChapterView bookId="book-1" chapterId="chapter-1" onBack={vi.fn()} />);

    // Header element should be sticky
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('sticky');
    expect(header).toHaveClass('top-16');

    // Sidebar navigation should be sticky
    const sidebars = screen.getAllByRole('complementary', { hidden: true });
    expect(sidebars.length).toBeGreaterThan(0);
    const mainSidebar = sidebars[0];
    expect(mainSidebar).toHaveClass('sticky');
    expect(mainSidebar).toHaveClass('top-[120px]');
    expect(mainSidebar).toHaveClass('h-[calc(100vh-120px)]');
  });

  it('calculates stats as stable (Estável) when all attempts happened on the same day', () => {
    render(<ChapterView bookId="book-1" chapterId="chapter-1" onBack={vi.fn()} />);

    // Open General Stats modal
    fireEvent.click(screen.getByText('Desempenho & Evolução'));

    // Assert that the general evolution is marked as Stable
    expect(screen.getAllByText('Estável ➖').length).toBeGreaterThan(0);
    expect(screen.getByText('Média mantida')).toBeInTheDocument();
  });

  it('calculates stats correctly showing improvement (+33% Melhorou!) when attempts happened on different days', () => {
    // Simulate question 5 having a cross-day improvement:
    // Oldest attempt: 2026-05-24 (incorrect)
    // Newest attempt: 2026-05-25 (correct)
    mockBooks[0].chapters[0].correctQuestions = [3, 5];
    mockBooks[0].chapters[0].incorrectQuestions = [];
    mockBooks[0].chapters[0].completedPrincipalQuestions = [3, 5];
    mockBooks[0].chapters[0].questionAttempts = {
      '3': {
        total: 1,
        correct: 1,
        incorrect: 0,
        history: [
          {
            status: 'correct' as const,
            timestamp: '2026-05-25T12:00:00.000Z'
          }
        ]
      },
      '5': {
        total: 2,
        correct: 1,
        incorrect: 1,
        history: [
          {
            status: 'correct' as const,
            timestamp: '2026-05-25T12:10:00.000Z'
          },
          {
            status: 'incorrect' as const,
            timestamp: '2026-05-24T10:00:00.000Z'
          }
        ]
      }
    };

    render(<ChapterView bookId="book-1" chapterId="chapter-1" onBack={vi.fn()} />);

    // Open General Stats modal
    fireEvent.click(screen.getByText('Desempenho & Evolução'));

    // Expected current rate: 2/3 correct (67%)
    // Expected initial rate: 1/3 correct (33%)
    // Evolution: +33%
    expect(screen.getByText('67%')).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument();
    expect(screen.getByText('+33% 📈')).toBeInTheDocument();
    expect(screen.getByText('Sua média melhorou!')).toBeInTheDocument();
  });

  it('correctly falls back to current question status when history is empty (legacy questions)', () => {
    // Simulate question 3 having no history entries but marked correct
    // Question 5 has no history but marked incorrect
    mockBooks[0].chapters[0].correctQuestions = [3];
    mockBooks[0].chapters[0].incorrectQuestions = [5];
    mockBooks[0].chapters[0].completedPrincipalQuestions = [3, 5];
    mockBooks[0].chapters[0].questionAttempts = {}; // Empty history

    render(<ChapterView bookId="book-1" chapterId="chapter-1" onBack={vi.fn()} />);

    // Open General Stats modal
    fireEvent.click(screen.getByText('Desempenho & Evolução'));

    // Current correct: 1/3 (33%)
    // Initial fallback: 1/3 (33%)
    // Since history is empty, general status shows "Sem tentativas ainda"
    expect(screen.getAllByText('33%').length).toBeGreaterThan(0);
    expect(screen.getByText('Sem tentativas ainda')).toBeInTheDocument();

  });

  it('renders QuestionPill with borderless, transparent, and min-height-override buttons', () => {
    render(<ChapterView bookId="book-1" chapterId="chapter-1" onBack={vi.fn()} />);

    // Find the question buttons
    const questionButtons = screen.getAllByRole('button', { name: '3' });
    expect(questionButtons.length).toBeGreaterThan(0);

    for (const questionButton of questionButtons) {
      // Verify classes to resolve double-border, dark background, and mobile vertical stretching
      expect(questionButton).toHaveClass('min-h-0');
      expect(questionButton).toHaveClass('border-none');
      expect(questionButton).toHaveClass('bg-transparent');
      expect(questionButton).toHaveClass('outline-none');
      expect(questionButton).toHaveClass('rounded-[inherit]');
    }
  });

  it('marks an incorrect question as difficult from the question button context menu', () => {
    render(<ChapterView bookId="book-1" chapterId="chapter-1" onBack={vi.fn()} />);

    const questionButton = screen.getAllByRole('button', { name: '5' })[0];
    fireEvent.contextMenu(questionButton);

    expect(mockUpdateChapter).toHaveBeenCalledWith('book-1', 'chapter-1', {
      difficultQuestions: [5],
    });
  });

  describe('parseQuestionNumbers helper', () => {
    it('parses empty inputs and plain numbers', () => {
      expect(parseQuestionNumbers('')).toEqual([]);
      expect(parseQuestionNumbers('  ')).toEqual([]);
      expect(parseQuestionNumbers('5')).toEqual([5]);
      expect(parseQuestionNumbers('1,2,3')).toEqual([1, 2, 3]);
      expect(parseQuestionNumbers(' 1 ,  4 , 2 ')).toEqual([1, 2, 4]); // sorted, trimmed
    });

    it('parses simple ranges and complex mix', () => {
      expect(parseQuestionNumbers('1-5')).toEqual([1, 2, 3, 4, 5]);
      expect(parseQuestionNumbers('10-12, 15, 20-22')).toEqual([10, 11, 12, 15, 20, 21, 22]);
      expect(parseQuestionNumbers('3-1, 5')).toEqual([1, 2, 3, 5]); // reversed range
    });

    it('avoids duplicates and handles invalid inputs gracefully', () => {
      expect(parseQuestionNumbers('1, 1, 2-3, 3, abc')).toEqual([1, 2, 3]);
      expect(parseQuestionNumbers('-3, 0, 5')).toEqual([5]); // filters <= 0
    });
  });

  describe('formatQuestionNumbers helper', () => {
    it('formats empty lists and plain numbers', () => {
      expect(formatQuestionNumbers([])).toBe('');
      expect(formatQuestionNumbers([5])).toBe('5');
      expect(formatQuestionNumbers([1, 3, 5])).toBe('1, 3, 5');
    });

    it('formats consecutive ranges', () => {
      expect(formatQuestionNumbers([1, 2, 3, 4, 5])).toBe('1-5');
      expect(formatQuestionNumbers([1, 2, 3, 5, 7, 8, 9])).toBe('1-3, 5, 7-9');
      expect(formatQuestionNumbers([10, 11, 12, 15, 20, 21, 22])).toBe('10-12, 15, 20-22');
    });
  });
});
