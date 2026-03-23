import { describe, expect, it } from 'vitest';
import { buildTheoreticalContentDownloadEntries } from '../app/contentTheoreticalDownloads';
import type { TheoreticalContentItem, TopicNode, TopicSubmatter } from '../app/types';

const topic: TopicNode = {
  id: 'topic-1',
  subject: 'portugues',
  title: 'Domínio da ortografia oficial.',
  sourceRef: 'art. 1',
  parentId: 'section-1',
  isLeaf: true,
  priority: 'media',
};

const submatter: TopicSubmatter = {
  id: 'sub-1',
  title: 'Casos especiais',
  grade: 'C',
  lastReviewedAt: null,
  errorNote: '',
  actionNote: '',
  createdAt: '2026-03-12T10:00:00.000Z',
  updatedAt: '2026-03-12T10:00:00.000Z',
};

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
  inlineContent: null,
  sizeBytes: 128,
  order: 1,
  completedAt: null,
  createdAt: '2026-03-12T10:00:00.000Z',
  updatedAt: '2026-03-12T10:00:00.000Z',
  ...patch,
});

describe('content theoretical downloads', () => {
  it('monta entradas ordenadas para download da materia incluindo submaterias', async () => {
    const entries = await buildTheoreticalContentDownloadEntries({
      scope: { kind: 'topic', topicId: 'topic-1' },
      items: [
        item('topic-summary', { filename: 'resumo.md', label: 'resumo.md', order: 1 }),
        item('sub-list', {
          ownerType: 'submatter',
          ownerId: 'sub-1',
          topicId: 'topic-1',
          submatterId: 'sub-1',
          filename: 'lista.pdf',
          label: 'lista.pdf',
          kind: 'pdf',
          mimeType: 'application/pdf',
          order: 1,
        }),
      ],
      topics: [topic],
      topicSubmattersByTopic: {
        'topic-1': [submatter],
      },
      loadBinary: async (storageKey) => {
        if (storageKey === 'storage-topic-summary') {
          return {
            storageKey,
            filename: 'resumo.md',
            mimeType: 'text/markdown',
            bytes: new Uint8Array([1, 2, 3]),
          };
        }

        return {
          storageKey,
          filename: 'lista.pdf',
          mimeType: 'application/pdf',
          bytes: new Uint8Array([4, 5, 6]),
        };
      },
    });

    expect(entries.map((entry) => entry.path)).toEqual([
      'dominio-da-ortografia-oficial/01-resumo.md',
      'dominio-da-ortografia-oficial/submaterias/casos-especiais/01-lista.pdf',
    ]);
  });

  it('monta entradas globais separadas por materia', async () => {
    const entries = await buildTheoreticalContentDownloadEntries({
      scope: { kind: 'global' },
      items: [
        item('topic-1-file', { filename: 'resumo.md', label: 'resumo.md', order: 1 }),
        item('topic-2-file', {
          ownerId: 'topic-2',
          topicId: 'topic-2',
          filename: 'questoes.pdf',
          label: 'questoes.pdf',
          kind: 'pdf',
          mimeType: 'application/pdf',
          storageKey: 'storage-topic-2-file',
          order: 1,
        }),
      ],
      topics: [
        topic,
        {
          ...topic,
          id: 'topic-2',
          title: 'Emprego da acentuação gráfica.',
        },
      ],
      topicSubmattersByTopic: {
        'topic-1': [submatter],
        'topic-2': [],
      },
      loadBinary: async (storageKey) => ({
        storageKey,
        filename: storageKey.includes('topic-2') ? 'questoes.pdf' : 'resumo.md',
        mimeType: storageKey.includes('topic-2') ? 'application/pdf' : 'text/markdown',
        bytes: new Uint8Array([1]),
      }),
    });

    expect(entries.map((entry) => entry.path)).toEqual([
      'dominio-da-ortografia-oficial/01-resumo.md',
      'emprego-da-acentuacao-grafica/01-questoes.pdf',
    ]);
  });

  it('falha quando falta o binario de um arquivo teorico selecionado', async () => {
    await expect(
      buildTheoreticalContentDownloadEntries({
        scope: { kind: 'submatter', topicId: 'topic-1', submatterId: 'sub-1' },
        items: [
          item('sub-list', {
            ownerType: 'submatter',
            ownerId: 'sub-1',
            topicId: 'topic-1',
            submatterId: 'sub-1',
            filename: 'lista.pdf',
            label: 'lista.pdf',
            kind: 'pdf',
            mimeType: 'application/pdf',
            order: 1,
          }),
        ],
        topics: [topic],
        topicSubmattersByTopic: {
          'topic-1': [submatter],
        },
        loadBinary: async () => null,
      }),
    ).rejects.toThrow('Arquivo teórico indisponível para download: lista.pdf');
  });
});
