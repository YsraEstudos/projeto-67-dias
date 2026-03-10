import { FALLBACK_BACKUP_KEY, SCHEMA_VERSION, STORAGE_KEY } from './constants';
import type { AppSnapshot, AppState } from './types';

export const buildSnapshot = (state: AppState): AppSnapshot => ({
  schemaVersion: SCHEMA_VERSION,
  exportedAt: new Date().toISOString(),
  appState: state,
});

const isQuotaExceededError = (error: unknown): boolean => {
  if (!(error instanceof DOMException)) {
    return false;
  }

  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  );
};

const compactStateForStorage = (state: AppState): AppState => ({
  ...state,
  topicProgress: Object.fromEntries(
    Object.entries(state.topicProgress).map(([topicId, progress]) => [
      topicId,
      { ...progress, evidenceNote: '' },
    ]),
  ),
});

let hasWarnedStorageQuota = false;

export const saveStateSnapshot = (state: AppState): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const writeSnapshot = (snapshotState: AppState): void => {
    const snapshot = buildSnapshot(snapshotState);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  };

  try {
    writeSnapshot(state);
    return;
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      if (!hasWarnedStorageQuota) {
        hasWarnedStorageQuota = true;
        console.warn('Falha ao salvar snapshot no localStorage.', error);
      }
      return;
    }
  }

  try {
    // Free space reserved by backup fallback before trying again.
    window.localStorage.removeItem(FALLBACK_BACKUP_KEY);
    writeSnapshot(state);
    return;
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      if (!hasWarnedStorageQuota) {
        hasWarnedStorageQuota = true;
        console.warn('Falha ao salvar snapshot no localStorage após limpeza.', error);
      }
      return;
    }
  }

  try {
    // Last fallback: trim legacy evidence text to preserve core app state.
    writeSnapshot(compactStateForStorage(state));
  } catch (error) {
    if (!hasWarnedStorageQuota) {
      hasWarnedStorageQuota = true;
      console.warn('Sem espaço para persistir snapshot no localStorage.', error);
    }
  }
};

const isValidSnapshot = (value: unknown): value is AppSnapshot => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AppSnapshot>;
  return (
    typeof candidate.schemaVersion === 'number' &&
    typeof candidate.exportedAt === 'string' &&
    candidate.appState !== undefined
  );
};

export const loadStateSnapshot = (): AppSnapshot | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidSnapshot(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

