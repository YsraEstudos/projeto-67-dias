import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import {
  buildTheoreticalContentDownloadEntries,
  downloadTheoreticalContentsBundle,
  downloadTheoreticalContentsMarkdown,
} from '../app/contentTheoreticalDownloads';
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

  it('download global gera zip parcial e inclui manifesto de ausentes', async () => {
    let capturedBlob: Blob | null = null;
    let capturedFilename = '';

    const summary = await downloadTheoreticalContentsBundle({
      scope: { kind: 'global' },
      items: [
        item('topic-1-file', { filename: 'resumo.md', label: 'resumo.md', order: 1 }),
        item('topic-1-missing', {
          filename: 'lista.pdf',
          label: 'lista.pdf',
          kind: 'pdf',
          mimeType: 'application/pdf',
          storageKey: 'storage-topic-1-missing',
          order: 2,
        }),
      ],
      topics: [topic],
      topicSubmattersByTopic: {
        'topic-1': [submatter],
      },
      loadBinary: async (storageKey) => {
        if (storageKey === 'storage-topic-1-file') {
          return {
            storageKey,
            filename: 'resumo.md',
            mimeType: 'text/markdown',
            bytes: new Uint8Array([1, 2, 3]),
          };
        }

        return null;
      },
      saveBlob: (blob, filename) => {
        capturedBlob = blob;
        capturedFilename = filename;
      },
    });

    expect(summary.requestedCount).toBe(2);
    expect(summary.downloadedCount).toBe(1);
    expect(summary.missingCount).toBe(1);
    expect(summary.isPartial).toBe(true);
    expect(summary.manifestIncluded).toBe(true);
    expect(capturedFilename).toMatch(/^conteudo-pragmatico-\d{4}-\d{2}-\d{2}\.zip$/);
    expect(capturedBlob).not.toBeNull();

    if (!capturedBlob) {
      throw new Error('Esperava um blob de download global.');
    }

    const downloadBlob: Blob = capturedBlob;
    const zip = await JSZip.loadAsync(await downloadBlob.arrayBuffer());
    const zippedPaths = Object.keys(zip.files);
    expect(zippedPaths).toContain('dominio-da-ortografia-oficial/01-resumo.md');
    expect(zippedPaths).toContain('arquivos-ausentes.txt');

    const manifestFile = zip.file('arquivos-ausentes.txt');
    if (!manifestFile) {
      throw new Error('Esperava o manifesto de ausentes no zip.');
    }

    const manifest = await manifestFile.async('text');
    expect(manifest).toContain('lista.pdf');
    expect(manifest).toContain('dominio-da-ortografia-oficial/02-lista.pdf');
  });

  it('usa inlineContent de markdown quando o binario local nao existe', async () => {
    let capturedBlob: Blob | null = null;

    const summary = await downloadTheoreticalContentsBundle({
      scope: { kind: 'global' },
      items: [
        item('topic-1-inline', {
          filename: 'aula-colada.md',
          label: 'Aula colada',
          inlineContent: '# Aula colada\n\nResumo da revisão',
          storageKey: 'storage-topic-1-inline',
          kind: 'markdown',
          mimeType: 'text/markdown',
        }),
      ],
      topics: [topic],
      topicSubmattersByTopic: {
        'topic-1': [submatter],
      },
      loadBinary: async () => null,
      saveBlob: (blob) => {
        capturedBlob = blob;
      },
    });

    expect(summary.requestedCount).toBe(1);
    expect(summary.downloadedCount).toBe(1);
    expect(summary.missingCount).toBe(0);
    expect(summary.isPartial).toBe(false);

    if (!capturedBlob) {
      throw new Error('Esperava um blob de download global.');
    }

    const downloadBlob: Blob = capturedBlob;
    const zip = await JSZip.loadAsync(await downloadBlob.arrayBuffer());
    const lessonFile = zip.file('dominio-da-ortografia-oficial/01-aula-colada.md');
    if (!lessonFile) {
      throw new Error('Esperava a aula em markdown no zip.');
    }

    const lessonContent = await lessonFile.async('text');

    expect(lessonContent).toContain('Resumo da revisão');
  });

  it('gera um unico md consolidado agrupando os arquivos por materia', async () => {
    let capturedBlob: Blob | null = null;
    let capturedFilename = '';

    const summary = await downloadTheoreticalContentsMarkdown({
      scope: { kind: 'global' },
      items: [
        item('topic-1-first', {
          filename: 'resumo-1.md',
          label: 'Resumo 1',
          order: 1,
          inlineContent: '# Resumo 1\n\nTexto base da materia.',
        }),
        item('topic-1-second', {
          filename: 'resumo-2.md',
          label: 'Resumo 2',
          order: 2,
          inlineContent: '# Resumo 2\n\nComplemento do assunto.',
        }),
        item('sub-1-file', {
          ownerType: 'submatter',
          ownerId: 'sub-1',
          topicId: 'topic-1',
          submatterId: 'sub-1',
          filename: 'lista.pdf',
          label: 'Lista em PDF',
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
      saveBlob: (blob, filename) => {
        capturedBlob = blob;
        capturedFilename = filename;
      },
    });

    expect(summary.requestedCount).toBe(3);
    expect(summary.topicCount).toBe(1);
    expect(capturedFilename).toMatch(/^conteudo-pragmatico-\d{4}-\d{2}-\d{2}\.md$/);
    expect(capturedBlob).not.toBeNull();

    const blob = capturedBlob;

    if (!blob) {
      throw new Error('Esperava um blob de markdown consolidado.');
    }

    const markdown = await (blob as Blob).text();
    expect((markdown.match(/## Domínio da ortografia oficial\./g) ?? []).length).toBe(1);
    expect(markdown).toContain('### Conteúdo da matéria');
    expect(markdown).toContain('Resumo 1');
    expect(markdown).toContain('Resumo 2');
    expect(markdown).toContain('### Casos especiais');
    expect(markdown).toContain('Arquivo PDF original preservado no app: lista.pdf.');
  });
});
