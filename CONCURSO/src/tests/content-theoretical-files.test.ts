import { describe, expect, it } from 'vitest';
import {
  buildTheoreticalContentProgress,
  createPastedMarkdownFile,
  collectTheoreticalContentsForTopic,
  inferTheoreticalContentKind,
  listTheoreticalContentsForOwner,
  moveTheoreticalContent,
  reorderTheoreticalContent,
  toggleTheoreticalContentCompleted,
} from '../app/contentTheoreticalFiles';
import type { TheoreticalContentItem } from '../app/types';

const item = (
  id: string,
  patch: Partial<TheoreticalContentItem> = {},
): TheoreticalContentItem => ({
  id,
  ownerType: 'topic',
  ownerId: 'topic-1',
  topicId: 'topic-1',
  submatterId: null,
  filename: `${id}.md`,
  label: `${id}.md`,
  kind: 'markdown',
  mimeType: 'text/markdown',
  storageKey: `storage-${id}`,
  sizeBytes: 128,
  order: 0,
  completedAt: null,
  createdAt: '2026-03-12T10:00:00.000Z',
  updatedAt: '2026-03-12T10:00:00.000Z',
  ...patch,
});

describe('content theoretical files', () => {
  it('aceita apenas markdown e pdf', () => {
    expect(inferTheoreticalContentKind('resumo.md', 'text/markdown')).toBe('markdown');
    expect(inferTheoreticalContentKind('edital.pdf', 'application/pdf')).toBe('pdf');
    expect(inferTheoreticalContentKind('planilha.xlsx', 'application/vnd.ms-excel')).toBeNull();
  });

  it('lista arquivos ordenados dentro do mesmo contexto', () => {
    const ordered = listTheoreticalContentsForOwner(
      [
        item('b', { order: 2, label: 'b.md' }),
        item('a', { order: 1, label: 'a.md' }),
        item('x', {
          ownerType: 'submatter',
          ownerId: 'sub-9',
          topicId: 'topic-1',
          submatterId: 'sub-9',
        }),
      ],
      'topic',
      'topic-1',
    );

    expect(ordered.map((entry) => entry.label)).toEqual(['a.md', 'b.md']);
  });

  it('coleta arquivos de uma materia incluindo os ligados as submaterias', () => {
    const collected = collectTheoreticalContentsForTopic(
      [
        item('topic-file', { order: 1, label: 'topico.md' }),
        item('sub-file', {
          ownerType: 'submatter',
          ownerId: 'sub-1',
          topicId: 'topic-1',
          submatterId: 'sub-1',
          label: 'sub.pdf',
          filename: 'sub.pdf',
          kind: 'pdf',
          mimeType: 'application/pdf',
          order: 2,
        }),
        item('other-topic', { ownerId: 'topic-2', topicId: 'topic-2', label: 'fora.md', order: 1 }),
      ],
      'topic-1',
    );

    expect(collected.map((entry) => entry.label)).toEqual(['topico.md', 'sub.pdf']);
  });

  it('reordena arquivos sem afetar outros owners', () => {
    const reordered = moveTheoreticalContent(
      [
        item('a', { order: 1, label: 'a.md' }),
        item('b', { order: 2, label: 'b.md' }),
        item('c', {
          ownerType: 'submatter',
          ownerId: 'sub-1',
          topicId: 'topic-1',
          submatterId: 'sub-1',
          label: 'sub.md',
          order: 1,
        }),
      ],
      {
        ownerType: 'topic',
        ownerId: 'topic-1',
        itemId: 'a',
        direction: 'down',
      },
    );

    expect(
      listTheoreticalContentsForOwner(reordered, 'topic', 'topic-1').map((entry) => entry.label),
    ).toEqual(['b.md', 'a.md']);
    expect(
      listTheoreticalContentsForOwner(reordered, 'submatter', 'sub-1').map((entry) => entry.label),
    ).toEqual(['sub.md']);
  });

  it('cria um arquivo markdown a partir de texto colado usando o primeiro titulo como nome', async () => {
    const file = createPastedMarkdownFile({
      markdown: '# Aula de ortografia\n\nResumo rápido',
      fallbackLabel: 'Aula rápida',
    });

    expect(file.name).toBe('aula-de-ortografia.md');
    expect(file.type).toBe('text/markdown');
    expect(await file.text()).toContain('Resumo rápido');
  });

  it('reordena por alvo para suportar drag and drop sem afetar outros owners', () => {
    const reordered = reorderTheoreticalContent(
      [
        item('a', { order: 1, label: 'a.md' }),
        item('b', { order: 2, label: 'b.md' }),
        item('c', { order: 3, label: 'c.md' }),
        item('sub', {
          ownerType: 'submatter',
          ownerId: 'sub-1',
          topicId: 'topic-1',
          submatterId: 'sub-1',
          label: 'sub.md',
          order: 1,
        }),
      ],
      {
        ownerType: 'topic',
        ownerId: 'topic-1',
        itemId: 'c',
        targetItemId: 'a',
      },
    );

    expect(
      listTheoreticalContentsForOwner(reordered, 'topic', 'topic-1').map((entry) => entry.label),
    ).toEqual(['c.md', 'a.md', 'b.md']);
    expect(
      listTheoreticalContentsForOwner(reordered, 'submatter', 'sub-1').map((entry) => entry.label),
    ).toEqual(['sub.md']);
  });

  it('marca a aula como feita e calcula contadores revisados e pendentes por matéria', () => {
    const updated = toggleTheoreticalContentCompleted(
      [
        item('topic-file', { order: 1, label: 'topico.md' }),
        item('sub-file', {
          ownerType: 'submatter',
          ownerId: 'sub-1',
          topicId: 'topic-1',
          submatterId: 'sub-1',
          label: 'sub.pdf',
          filename: 'sub.pdf',
          kind: 'pdf',
          mimeType: 'application/pdf',
          order: 2,
        }),
        item('other-topic', { ownerId: 'topic-2', topicId: 'topic-2', label: 'fora.md', order: 1 }),
      ],
      {
        itemId: 'sub-file',
        completedAt: '2026-03-16T10:00:00.000Z',
      },
    );

    expect(updated.find((entry) => entry.id === 'sub-file')?.completedAt).toBe(
      '2026-03-16T10:00:00.000Z',
    );
    expect(buildTheoreticalContentProgress(updated, 'topic-1')).toEqual({
      reviewedCount: 1,
      pendingCount: 1,
      totalCount: 2,
    });
  });
});
