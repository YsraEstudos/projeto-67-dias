import { FALLBACK_BACKUP_KEY } from './constants';
import type { AppSnapshot } from './types';

const stringifySnapshot = (snapshot: AppSnapshot): string => JSON.stringify(snapshot, null, 2);

export const downloadSnapshot = (snapshot: AppSnapshot, fileName: string): void => {
  const data = stringifySnapshot(snapshot);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const saveFallbackSnapshot = (snapshot: AppSnapshot): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(FALLBACK_BACKUP_KEY, stringifySnapshot(snapshot));
};

export const loadFallbackSnapshotTimestamp = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(FALLBACK_BACKUP_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AppSnapshot;
    return parsed.exportedAt;
  } catch {
    return null;
  }
};

export const parseSnapshotFile = async (file: File): Promise<AppSnapshot> => {
  const text = await file.text();
  const parsed = JSON.parse(text) as AppSnapshot;

  if (!parsed.schemaVersion || !parsed.appState || !parsed.exportedAt) {
    throw new Error('Arquivo de snapshot inválido.');
  }

  return parsed;
};

export const supportsFileSystemAccess = (): boolean =>
  typeof window !== 'undefined' && 'showSaveFilePicker' in window;

export const pickBackupFileHandle = async (): Promise<FileSystemFileHandle> => {
  if (!supportsFileSystemAccess()) {
    throw new Error('File System Access API indisponível neste navegador.');
  }

  return window.showSaveFilePicker({
    suggestedName: 'concurso-backup.json',
    types: [
      {
        description: 'Arquivo JSON',
        accept: { 'application/json': ['.json'] },
      },
    ],
  });
};

export const writeSnapshotToHandle = async (
  handle: FileSystemFileHandle,
  snapshot: AppSnapshot,
): Promise<void> => {
  const writable = await handle.createWritable();
  await writable.write(stringifySnapshot(snapshot));
  await writable.close();
};

