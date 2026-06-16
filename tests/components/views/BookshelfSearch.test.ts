import { describe, expect, it } from 'vitest';
import {
  buildBookshelfSearchIndex,
  buildBookshelfSearchResults,
  searchBookshelfIndex,
} from '../../../components/views/AulasView/Bookshelf';
import type { AulaBook, AulaChapter } from '../../../types';

const createBook = (overrides: Partial<AulaBook> = {}): AulaBook => ({
  id: 'book-1',
  folderId: 'folder-1',
  title: 'Curso Base',
  coverImage: null,
  targetDate: null,
  position: 0,
  chapters: [],
  ...overrides,
});

const createChapter = (overrides: Partial<AulaChapter> = {}): AulaChapter => ({
  id: 'chapter-1',
  title: 'Aula Base',
  content: '',
  attachments: {},
  position: 0,
  ...overrides,
});

describe('buildBookshelfSearchResults', () => {
  it('returns empty result sets for blank queries', () => {
    const results = buildBookshelfSearchResults([
      createBook({
        chapters: [
          createChapter({
            title: 'Direito Administrativo',
            content: 'Atos administrativos',
          }),
        ],
      }),
    ], '   ');

    expect(results).toEqual({ chapters: [], comments: [], questions: [] });
  });

  it('finds chapters, comments, and linked questions', () => {
    const index = buildBookshelfSearchIndex([
      createBook({
        chapters: [
          createChapter({
            title: 'Direito Administrativo',
            content: 'Poder de policia e atos administrativos',
            comments: [
              {
                id: 'comment-1',
                body: 'Revisar jurisprudencia do STF',
                selectedText: 'controle',
                createdAt: '2026-04-13T12:00:00.000Z',
              },
            ],
            relatedQuestions: {
              aula: 1,
              titulo: 'Direito Administrativo',
              questoes_principais: [42],
              questoes_secundarias_que_misturam_com_aulas_futuras: [7],
              por_secao: [{ secao: 'Atos', questoes: [99] }],
              observacao: 'Caiu em prova discursiva',
            },
          }),
        ],
      }),
    ]);
    const results = searchBookshelfIndex(index, '42');

    expect(results.questions).toHaveLength(1);
    expect(results.questions[0]).toMatchObject({
      questionNumber: 42,
      category: 'Questao Principal',
    });

    const textResults = buildBookshelfSearchResults([
      createBook({
        chapters: [
          createChapter({
            title: 'Direito Administrativo',
            content: 'Poder de policia e atos administrativos',
            comments: [
              {
                id: 'comment-1',
                body: 'Revisar jurisprudencia do STF',
                selectedText: 'controle',
                createdAt: '2026-04-13T12:00:00.000Z',
              },
            ],
          }),
        ],
      }),
    ], 'jurisprudencia');

    expect(textResults.chapters).toHaveLength(0);
    expect(textResults.comments).toHaveLength(1);
  });

  it('limits each result group to 15 entries', () => {
    const results = buildBookshelfSearchResults([
      createBook({
        chapters: Array.from({ length: 20 }, (_, index) => ({
          ...createChapter(),
          id: `chapter-${index}`,
          title: `React performance ${index}`,
          content: 'memoizacao e renderizacao',
          position: index,
        })),
      }),
    ], 'react');

    expect(results.chapters).toHaveLength(15);
  });

  it('builds a reusable flat index for repeated searches', () => {
    const index = buildBookshelfSearchIndex([
      createBook({
        chapters: [
          createChapter({
            title: 'Arquitetura de Computadores',
            content: 'Cache, memoria e pipeline',
          }),
        ],
      }),
    ]);

    expect(index.chapters).toHaveLength(1);
    expect(searchBookshelfIndex(index, 'pipeline').chapters).toHaveLength(1);
    expect(searchBookshelfIndex(index, 'cache').chapters).toHaveLength(1);
  });
});
