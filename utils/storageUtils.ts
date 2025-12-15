/**
 * Shared storage usage utilities
 * Centralizes logic for Namespaced LocalStorage and Metadata
 */

const META_SUFFIX = '::__meta';

export const getStorageKeyForUser = (key: string, userId?: string | null) =>
    `${userId ?? 'guest'}::${key}`;

const getMetaKeyForUser = (key: string, userId?: string | null) =>
    `${getStorageKeyForUser(key, userId)}${META_SUFFIX}`;

export const parseTimestamp = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

// READ
export const readNamespacedStorage = (key: string, userId?: string | null): string | null => {
    if (typeof window === 'undefined') return null;
    const namespacedKey = getStorageKeyForUser(key, userId);
    const scopedValue = window.localStorage.getItem(namespacedKey);
    if (scopedValue !== null) return scopedValue;
    return window.localStorage.getItem(key);
};

// WRITE
export const writeNamespacedStorage = (key: string, value: string, userId?: string | null) => {
    if (typeof window === 'undefined') return;
    const namespacedKey = getStorageKeyForUser(key, userId);
    window.localStorage.setItem(namespacedKey, value);
};

// REMOVE
export const removeNamespacedStorage = (key: string, userId?: string | null) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(getStorageKeyForUser(key, userId));
    // Also remove metadata
    window.localStorage.removeItem(getMetaKeyForUser(key, userId));
};

// META READ
export const readLocalMeta = (key: string, userId?: string | null): number => {
    if (typeof window === 'undefined') return 0;
    const metaKey = getMetaKeyForUser(key, userId);
    const raw = window.localStorage.getItem(metaKey);
    if (!raw) return 0;
    try {
        const parsed = JSON.parse(raw);
        return parseTimestamp(parsed?.updatedAt) || 0;
    } catch {
        return 0;
    }
};

// META WRITE
export const writeLocalMeta = (key: string, timestamp: number, userId?: string | null) => {
    if (typeof window === 'undefined') return;
    const metaKey = getMetaKeyForUser(key, userId);
    window.localStorage.setItem(metaKey, JSON.stringify({ updatedAt: timestamp }));
};
