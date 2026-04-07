import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createStateWithTopics,
  createSubmatter,
  renderConcursoApp,
  topicIdByTitle,
} from './renderConcursoApp';

const binaryStore = new Map<string, { filename: string; mimeType: string; bytes: Uint8Array }>();
const { downloadTheoreticalContentsBundle } = vi.hoisted(() => ({
  downloadTheoreticalContentsBundle: vi.fn(async () => undefined),
}));

vi.mock('../app/contentTheoreticalFileStore', () => ({
  saveTheoreticalContentBinary: vi.fn(async (input: {
    storageKey: string;
    file: File;
  }) => {
    let bytes: Uint8Array;
    if (typeof input.file.arrayBuffer === 'function') {
      bytes = new Uint8Array(await input.file.arrayBuffer());
    } else if (typeof input.file.text === 'function') {
      bytes = new TextEncoder().encode(await input.file.text());
    } else if (typeof FileReader !== 'undefined') {
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler arquivo de teste.'));
        reader.onload = () => resolve((reader.result as ArrayBuffer) ?? new ArrayBuffer(0));
        reader.readAsArrayBuffer(input.file);
      });
      bytes = new Uint8Array(arrayBuffer);
    } else {
      bytes = new Uint8Array();
    }

    binaryStore.set(input.storageKey, {
      filename: input.file.name,
      mimeType: input.file.type,
      bytes,
    });
  }),
  loadTheoreticalContentBinary: vi.fn(async (storageKey: string) => binaryStore.get(storageKey) ?? null),
  removeTheoreticalContentBinary: vi.fn(async (storageKey: string) => {
    binaryStore.delete(storageKey);
  }),
}));

vi.mock('../app/contentTheoreticalDownloads', () => ({
  downloadTheoreticalContentsBundle,
}));

describe('ContentTopicPage', () => {
  beforeEach(() => {
    binaryStore.clear();
    downloadTheoreticalContentsBundle.mockClear();
  });

  it('mantem a tela inicial limpa e leva os arquivos para a central dedicada', async () => {
    const user = userEvent.setup();
    const topicId = topicIdByTitle('Domínio da ortografia oficial.');

    renderConcursoApp(`/conteudo/topico/${topicId}`);

    expect(screen.queryByTestId('topic-theoretical-content-upload')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir central de arquivos' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Abrir central de arquivos' }));

    expect(screen.getByTestId('topic-files-overlay')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir arquivos da matéria' })).toBeInTheDocument();
  });

  it('exibe a nota atual no detalhe e preserva o cadastro de submateria', async () => {
    const user = userEvent.setup();
    const topicId = topicIdByTitle('Domínio da ortografia oficial.');
    const state = createStateWithTopics((draft) => {
      draft.topicSubmattersByTopic[topicId] = [
        createSubmatter('orthography-e', { title: 'Ortografia aplicada', grade: 'E' }),
      ];
    });

    renderConcursoApp(`/conteudo/topico/${topicId}`, state);

    expect(screen.getByRole('heading', { name: 'Domínio da ortografia oficial.' })).toBeInTheDocument();
    expect(screen.getByText('Nota atual E')).toBeInTheDocument();

    await user.type(screen.getByTestId('submatter-create-title'), 'Casos especiais');
    await user.click(screen.getByTestId('submatter-create-submit'));

    expect(screen.getByDisplayValue('Casos especiais')).toBeInTheDocument();
  }, 10000);

  it('mostra o nome padronizado do topico e migra a submateria padrao legada', () => {
    const topicId = topicIdByTitle(
      'Arquitetura de computadores: processador, memória principal/secundária e dispositivos de E/S.',
    );
    const state = createStateWithTopics((draft) => {
      draft.topicSubmattersByTopic[topicId] = [
        createSubmatter('architecture-e', {
          title: 'Arquitetura de computadores: processador, memória principal/secundária e dispositivos de E/S.',
          grade: 'E',
        }),
      ];
    });

    renderConcursoApp(`/conteudo/topico/${topicId}`, state);

    expect(screen.getByRole('heading', { name: 'Arquitetura: CPU, memória e I/O' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Arquitetura: CPU, memória e I/O')).toBeInTheDocument();
  });

  it(
    'lista arquivos teoricos da materia, permite reordenar e preserva a ordem apos recarregar',
    async () => {
    const user = userEvent.setup();
    const topicId = topicIdByTitle('Domínio da ortografia oficial.');
    const state = createStateWithTopics((draft) => {
      draft.topicSubmattersByTopic[topicId] = [
        createSubmatter('orthography-e', { title: 'Ortografia aplicada', grade: 'E' }),
      ];
    });

    const firstRender = renderConcursoApp(`/conteudo/topico/${topicId}`, state);

    await user.click(screen.getByRole('button', { name: 'Abrir central de arquivos' }));
    await user.click(screen.getByRole('button', { name: 'Abrir arquivos da matéria' }));
    await screen.findByTestId('topic-theoretical-content-upload');

    const uploadInput = screen.getByTestId('topic-theoretical-content-upload') as HTMLInputElement;
    await user.upload(uploadInput, [
      new File(['# resumo'], 'resumo.md', { type: 'text/markdown' }),
      new File(['pdf-content'], 'questoes.pdf', { type: 'application/pdf' }),
    ]);

    await waitFor(() => {
      expect(screen.getByText('resumo.md')).toBeInTheDocument();
      expect(screen.getByText('questoes.pdf')).toBeInTheDocument();
    });

    const listBefore = within(screen.getByTestId('topic-theoretical-content-list'))
      .getAllByRole('listitem')
      .map((item) => item.textContent ?? '');
    expect(listBefore[0]).toContain('resumo.md');
    expect(listBefore[1]).toContain('questoes.pdf');

    await user.click(screen.getByRole('button', { name: 'Mover resumo.md para baixo' }));

    const listAfterMove = within(screen.getByTestId('topic-theoretical-content-list'))
      .getAllByRole('listitem')
      .map((item) => item.textContent ?? '');
    expect(listAfterMove[0]).toContain('questoes.pdf');
    expect(listAfterMove[1]).toContain('resumo.md');

    firstRender.unmount();
    renderConcursoApp(`/conteudo/topico/${topicId}`);

    await user.click(screen.getByRole('button', { name: 'Abrir central de arquivos' }));
    await user.click(screen.getByRole('button', { name: 'Abrir arquivos da matéria' }));
    await screen.findByTestId('topic-theoretical-content-list');

    const listAfterReload = within(screen.getByTestId('topic-theoretical-content-list'))
      .getAllByRole('listitem')
      .map((item) => item.textContent ?? '');
    expect(listAfterReload[0]).toContain('questoes.pdf');
    expect(listAfterReload[1]).toContain('resumo.md');
    },
    15000,
  );

  it(
    'permite cadastrar conteudo teorico por submateria e baixar arquivos por contexto',
    async () => {
    const user = userEvent.setup();
    const topicId = topicIdByTitle('Domínio da ortografia oficial.');
    const state = createStateWithTopics((draft) => {
      draft.topicSubmattersByTopic[topicId] = [
        createSubmatter('orthography-e', { title: 'Ortografia aplicada', grade: 'E' }),
      ];
      draft.theoreticalContents = [
        {
          id: 'topic-file-1',
          ownerType: 'topic',
          ownerId: topicId,
          topicId,
          submatterId: null,
          filename: 'resumo.md',
          label: 'resumo.md',
          kind: 'markdown',
          mimeType: 'text/markdown',
          storageKey: 'storage-topic-file-1',
          inlineContent: null,
          sizeBytes: 42,
          order: 1,
          completedAt: null,
          createdAt: '2026-03-12T10:00:00.000Z',
          updatedAt: '2026-03-12T10:00:00.000Z',
        },
      ];
    });

    renderConcursoApp(`/conteudo/topico/${topicId}`, state);

    await user.click(screen.getByRole('button', { name: 'Abrir central de arquivos' }));
    await user.click(screen.getByRole('button', { name: 'Abrir arquivos da submatéria Ortografia aplicada' }));
    await screen.findByTestId('submatter-theoretical-content-upload-orthography-e');

    const submatterUpload = screen.getByTestId(
      'submatter-theoretical-content-upload-orthography-e',
    ) as HTMLInputElement;

    await user.upload(submatterUpload, [
      new File(['# casos'], 'casos-especiais.md', { type: 'text/markdown' }),
      new File(['pdf-content'], 'lista.pdf', { type: 'application/pdf' }),
    ]);

    await waitFor(() => {
      expect(screen.getByText('casos-especiais.md')).toBeInTheDocument();
      expect(screen.getByText('lista.pdf')).toBeInTheDocument();
    });

    const submatterList = within(
      screen.getByTestId('submatter-theoretical-content-list-orthography-e'),
    )
      .getAllByRole('listitem')
      .map((item) => item.textContent ?? '');

    expect(submatterList[0]).toContain('casos-especiais.md');
    expect(submatterList[1]).toContain('lista.pdf');

    await user.click(screen.getByRole('button', { name: 'Voltar para central' }));
    await user.click(screen.getByRole('button', { name: 'Abrir arquivos da matéria' }));
    await user.click(screen.getByRole('button', { name: 'Baixar arquivos da matéria' }));

    await user.click(screen.getByRole('button', { name: 'Voltar para central' }));
    await user.click(screen.getByRole('button', { name: 'Abrir arquivos da submatéria Ortografia aplicada' }));
    await user.click(
      screen.getByRole('button', { name: 'Baixar arquivos da submatéria Ortografia aplicada' }),
    );

    expect(downloadTheoreticalContentsBundle).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        scope: { kind: 'topic', topicId },
      }),
    );
    expect(downloadTheoreticalContentsBundle).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        scope: { kind: 'submatter', topicId, submatterId: 'orthography-e' },
      }),
    );
    },
    15000,
  );

  it(
    'permite colar markdown, abrir a aula no site, marcar como feita e reordenar por drag and drop',
    async () => {
    const user = userEvent.setup();
    const topicId = topicIdByTitle('Domínio da ortografia oficial.');
    const state = createStateWithTopics((draft) => {
      draft.theoreticalContents = [
        {
          id: 'topic-file-1',
          ownerType: 'topic',
          ownerId: topicId,
          topicId,
          submatterId: null,
          filename: 'guia-base.md',
          label: 'Guia base',
          kind: 'markdown',
          mimeType: 'text/markdown',
          storageKey: 'storage-topic-file-1',
          inlineContent: null,
          sizeBytes: 42,
          order: 1,
          completedAt: null,
          createdAt: '2026-03-12T10:00:00.000Z',
          updatedAt: '2026-03-12T10:00:00.000Z',
        },
      ];
    });
    binaryStore.set('storage-topic-file-1', {
      filename: 'guia-base.md',
      mimeType: 'text/markdown',
      bytes: new TextEncoder().encode('# Guia base\n\nBase antiga'),
    });

    const firstRender = renderConcursoApp(`/conteudo/topico/${topicId}`, state);

    await user.click(screen.getByRole('button', { name: 'Abrir central de arquivos' }));
    await user.click(screen.getByRole('button', { name: 'Abrir arquivos da matéria' }));
    await screen.findByTestId('topic-theoretical-content-paste');

    const pasteField = screen.getByTestId('topic-theoretical-content-paste');
    await user.click(pasteField);
    fireEvent.change(pasteField, {
      target: {
        value: '# Aula colada\n\nResumo importante da revisão',
      },
    });

    expect((pasteField as HTMLTextAreaElement).value).toBe('# Aula colada\n\nResumo importante da revisão');

    await user.click(screen.getByRole('button', { name: 'Salvar aula colada na matéria' }));

    await waitFor(() => {
      expect(screen.getByText('Aula colada')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Abrir aula Aula colada' }));
    await waitFor(() => {
      expect(screen.getByTestId('theoretical-content-viewer')).toHaveTextContent(
        'Resumo importante da revisão',
      );
    });

    await user.click(screen.getByRole('button', { name: 'Voltar para arquivos da matéria' }));
    expect(screen.getByTestId('topic-theoretical-content-list')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Marcar Aula colada como feita' }));
    expect(screen.getByText('Feita')).toBeInTheDocument();

    const draggedCard = within(screen.getByTestId('topic-theoretical-content-list'))
      .getAllByTestId(/theoretical-content-card-/)
      .find((node) => node.textContent?.includes('Aula colada'));
    const targetCard = within(screen.getByTestId('topic-theoretical-content-list'))
      .getAllByTestId(/theoretical-content-card-/)
      .find((node) => node.textContent?.includes('Guia base'));

    expect(draggedCard).toBeDefined();
    expect(targetCard).toBeDefined();

    fireEvent.dragStart(draggedCard as HTMLElement, {
      dataTransfer: {
        setData: () => undefined,
        effectAllowed: 'move',
      },
    });
    fireEvent.dragOver(targetCard as HTMLElement, {
      dataTransfer: {
        dropEffect: 'move',
      },
    });
    fireEvent.drop(targetCard as HTMLElement, {
      dataTransfer: {
        getData: () => '',
        dropEffect: 'move',
      },
    });

    const listAfterDrop = within(screen.getByTestId('topic-theoretical-content-list'))
      .getAllByTestId(/theoretical-content-card-/)
      .map((item) => item.textContent ?? '');
    expect(listAfterDrop[0]).toContain('Aula colada');
    expect(listAfterDrop[1]).toContain('Guia base');

    firstRender.unmount();
    renderConcursoApp(`/conteudo/topico/${topicId}`);

    await user.click(screen.getByRole('button', { name: 'Abrir central de arquivos' }));
    await user.click(screen.getByRole('button', { name: 'Abrir arquivos da matéria' }));
    await screen.findByTestId('topic-theoretical-content-list');

    const listAfterReload = within(screen.getByTestId('topic-theoretical-content-list'))
      .getAllByTestId(/theoretical-content-card-/)
      .map((item) => item.textContent ?? '');
    expect(listAfterReload[0]).toContain('Aula colada');
    expect(listAfterReload[1]).toContain('Guia base');
    expect(screen.getByText('Feita')).toBeInTheDocument();
    },
    15000,
  );

  it('renderiza markdown no estilo GitHub com GFM e sem executar HTML bruto', async () => {
    const user = userEvent.setup();
    const topicId = topicIdByTitle('Domínio da ortografia oficial.');
    const markdown = [
      '# Aula renderizada',
      '',
      'Texto com **negrito** e [link externo](https://example.com).',
      '',
      '- Primeiro item',
      '- Segundo item',
      '',
      '| Coluna | Valor |',
      '| --- | --- |',
      '| Nota | A |',
      '',
      '- [x] Revisado',
      '- [ ] Pendente',
      '',
      '> Bloco importante',
      '',
      '```ts',
      'const grade = "A";',
      '```',
      '',
      '<span data-testid="raw-html">HTML bruto</span>',
    ].join('\n');

    const state = createStateWithTopics((draft) => {
      draft.theoreticalContents = [
        {
          id: 'topic-file-1',
          ownerType: 'topic',
          ownerId: topicId,
          topicId,
          submatterId: null,
          filename: 'aula-renderizada.md',
          label: 'Aula renderizada',
          kind: 'markdown',
          mimeType: 'text/markdown',
          storageKey: 'storage-topic-file-1',
          inlineContent: markdown,
          sizeBytes: 420,
          order: 1,
          completedAt: null,
          createdAt: '2026-03-12T10:00:00.000Z',
          updatedAt: '2026-03-12T10:00:00.000Z',
        },
      ];
    });

    binaryStore.set('storage-topic-file-1', {
      filename: 'aula-renderizada.md',
      mimeType: 'text/markdown',
      bytes: new TextEncoder().encode(markdown),
    });

    renderConcursoApp(`/conteudo/topico/${topicId}`, state);

    await user.click(screen.getByRole('button', { name: 'Abrir central de arquivos' }));
    await user.click(screen.getByRole('button', { name: 'Abrir arquivos da matéria' }));

    await user.click(screen.getByRole('button', { name: 'Abrir aula Aula renderizada' }));

    const viewer = await screen.findByTestId('theoretical-content-viewer');

    expect(within(viewer).getByRole('heading', { name: 'Aula renderizada' })).toBeInTheDocument();
    expect(within(viewer).getByText('Primeiro item')).toBeInTheDocument();
    expect(within(viewer).getByRole('link', { name: 'link externo' })).toHaveAttribute(
      'href',
      'https://example.com',
    );
    expect(within(viewer).getByRole('link', { name: 'link externo' })).toHaveAttribute(
      'target',
      '_blank',
    );
    expect(within(viewer).getByRole('table')).toBeInTheDocument();
    const taskCheckboxes = within(viewer).getAllByRole('checkbox');
    expect(taskCheckboxes).toHaveLength(2);
    expect(taskCheckboxes[0]).toBeChecked();
    expect(taskCheckboxes[1]).not.toBeChecked();
    expect(within(viewer).getByText('Revisado')).toBeInTheDocument();
    expect(within(viewer).getByText('Pendente')).toBeInTheDocument();
    expect(within(viewer).getByText('Bloco importante')).toBeInTheDocument();
    expect(within(viewer).getByText('const grade = "A";')).toBeInTheDocument();
    expect(within(viewer).queryByTestId('raw-html')).not.toBeInTheDocument();
  });

  it('abre aula markdown sincronizada mesmo quando o binario local nao existe neste navegador', async () => {
    const user = userEvent.setup();
    const topicId = topicIdByTitle('Domínio da ortografia oficial.');
    const state = createStateWithTopics((draft) => {
      draft.theoreticalContents = [
        {
          id: 'topic-file-inline',
          ownerType: 'topic',
          ownerId: topicId,
          topicId,
          submatterId: null,
          filename: 'aula-remota.md',
          label: 'Aula remota',
          kind: 'markdown',
          mimeType: 'text/markdown',
          storageKey: 'storage-topic-file-inline',
          inlineContent: '# Aula remota\n\nConteúdo vindo da nuvem.',
          sizeBytes: 120,
          order: 1,
          completedAt: null,
          createdAt: '2026-03-12T10:00:00.000Z',
          updatedAt: '2026-03-12T10:00:00.000Z',
        },
      ];
    });

    renderConcursoApp(`/conteudo/topico/${topicId}`, state);

    await user.click(screen.getByRole('button', { name: 'Abrir central de arquivos' }));
    await user.click(screen.getByRole('button', { name: 'Abrir arquivos da matéria' }));
    await user.click(screen.getByRole('button', { name: 'Abrir aula Aula remota' }));

    await waitFor(() => {
      expect(screen.getByTestId('theoretical-content-viewer')).toHaveTextContent(
        'Conteúdo vindo da nuvem.',
      );
    });
  });
}, 20000);
