import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as cloudStorage from '../app/cloudStorage';
import { buildSnapshot } from '../app/storage';
import { createStateWithTopics, renderConcursoApp, topicIdByTitle } from './renderConcursoApp';

describe('cloud sync', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();

    vi.spyOn(cloudStorage, 'subscribeCloudAuthChanges').mockImplementation(async (callback) => {
      callback({
        uid: 'user-1',
        email: 'user@example.com',
        displayName: 'User',
        isAnonymous: false,
      });
      return () => undefined;
    });

    vi.spyOn(cloudStorage, 'loadCloudSnapshot').mockResolvedValue({
      snapshot: null,
      lastChangedAt: null,
    });

    vi.spyOn(cloudStorage, 'saveCloudSnapshot').mockResolvedValue();
  });

  it(
    'atualiza a lista de aulas em outro navegador quando chega um snapshot remoto novo',
    async () => {
    const user = userEvent.setup();
    const topicId = topicIdByTitle('Domínio da ortografia oficial.');
    const initialState = createStateWithTopics(() => undefined);
    const remoteState = createStateWithTopics((draft) => {
      draft.meta.changeToken = 3;
      draft.meta.lastChangedAt = '2026-03-23T14:00:00.000Z';
      draft.theoreticalContents = [
        {
          id: 'remote-lesson-1',
          ownerType: 'topic',
          ownerId: topicId,
          topicId,
          submatterId: null,
          filename: 'aula-remota.md',
          label: 'Aula remota',
          kind: 'markdown',
          mimeType: 'text/markdown',
          storageKey: 'remote-storage-1',
          inlineContent: '# Aula remota\n\nChegou do outro navegador.',
          sizeBytes: 128,
          order: 1,
          completedAt: null,
          createdAt: '2026-03-23T14:00:00.000Z',
          updatedAt: '2026-03-23T14:00:00.000Z',
        },
      ];
    });

    let emitRemoteSnapshot: ((result: { snapshot: ReturnType<typeof buildSnapshot> | null; lastChangedAt: string | null }) => void) | undefined;

    vi.spyOn(cloudStorage, 'subscribeCloudSnapshotChanges').mockImplementation(async (_uid, callback) => {
      emitRemoteSnapshot = callback;
      return () => undefined;
    });

    renderConcursoApp(`/conteudo/topico/${topicId}`, initialState);

    await waitFor(() => {
      expect(cloudStorage.subscribeCloudSnapshotChanges).toHaveBeenCalled();
    });

    if (!emitRemoteSnapshot) {
      throw new Error('Snapshot listener was not registered.');
    }

    const emitRemoteSnapshotFn = emitRemoteSnapshot as (result: {
      snapshot: ReturnType<typeof buildSnapshot> | null;
      lastChangedAt: string | null;
    }) => void;

    emitRemoteSnapshotFn({
      snapshot: buildSnapshot(remoteState),
      lastChangedAt: remoteState.meta.lastChangedAt,
    });

    await user.click(screen.getByRole('button', { name: 'Abrir central de arquivos' }));
    await user.click(screen.getByRole('button', { name: 'Abrir arquivos da matéria' }));

    await waitFor(() => {
      expect(screen.getByText('Aula remota')).toBeInTheDocument();
    });
    },
    30000,
  );
});
