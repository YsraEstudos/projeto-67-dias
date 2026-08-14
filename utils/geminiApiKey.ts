import {
  readNamespacedStorage,
  removeNamespacedStorage,
  writeNamespacedStorage,
} from './storageUtils';

const GEMINI_API_KEY_STORAGE_KEY = 'p67_gemini_api_key';
const LAST_UID_STORAGE_KEY = 'p67_last_uid';

const getCurrentUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(LAST_UID_STORAGE_KEY);
};

export const readSavedGeminiApiKey = (): string | null => {
  if (typeof window === 'undefined') return null;
  const userId = getCurrentUserId();
  const rawKey = readNamespacedStorage(GEMINI_API_KEY_STORAGE_KEY, userId);
  if (rawKey === null) return null;

  const normalizedKey = rawKey.trim();
  return normalizedKey.length > 0 ? normalizedKey : null;
};

export const saveGeminiApiKey = (key: string): void => {
  if (typeof window === 'undefined') return;
  const userId = getCurrentUserId();
  writeNamespacedStorage(GEMINI_API_KEY_STORAGE_KEY, key, userId);
};

export const clearSavedGeminiApiKey = (): void => {
  if (typeof window === 'undefined') return;
  const userId = getCurrentUserId();
  removeNamespacedStorage(GEMINI_API_KEY_STORAGE_KEY, userId);
};
