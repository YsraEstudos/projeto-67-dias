/**
 * Firestore Quota Tracker
 * 
 * Tracks daily read/write operations to prevent exceeding free tier limits.
 * Data is stored in localStorage and resets daily.
 * 
 * Free tier limits (as of 2024):
 * - 50,000 reads/day
 * - 20,000 writes/day
 * 
 * We use a conservative limit of 20,000 total operations for safety.
 */

const QUOTA_STORAGE_KEY = 'p67_firestore_quota';
const DAILY_LIMIT = 20000;
const WARNING_THRESHOLD = 0.85; // 85%

interface QuotaData {
    date: string; // YYYY-MM-DD
    writes: number;
    reads: number;
    moduleWrites?: Record<string, number>;
    moduleReads?: Record<string, number>;
}

// Synchronization callback
let syncCallback: ((data: QuotaData) => void) | null = null;

export const setQuotaSyncCallback = (callback: (data: QuotaData) => void): void => {
    syncCallback = callback;
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayString = (): string => {
    const now = new Date();
    return now.toISOString().split('T')[0];
};

/**
 * Read current quota data from localStorage
 */
const getQuotaData = (): QuotaData => {
    if (typeof window === 'undefined') {
        return { date: getTodayString(), writes: 0, reads: 0, moduleWrites: {}, moduleReads: {} };
    }

    try {
        const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
        if (!raw) {
            return { date: getTodayString(), writes: 0, reads: 0, moduleWrites: {}, moduleReads: {} };
        }

        const data: QuotaData = JSON.parse(raw);

        // Reset if it's a new day
        if (data.date !== getTodayString()) {
            const newData = { date: getTodayString(), writes: 0, reads: 0, moduleWrites: {}, moduleReads: {} };
            localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(newData));
            return newData;
        }

        // Ensure module structures exist
        if (!data.moduleWrites) data.moduleWrites = {};
        if (!data.moduleReads) data.moduleReads = {};

        return data;
    } catch {
        return { date: getTodayString(), writes: 0, reads: 0, moduleWrites: {}, moduleReads: {} };
    }
};

/**
 * Save quota data to localStorage
 */
const saveQuotaData = (data: QuotaData): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(data));
    if (syncCallback) {
        syncCallback(data);
    }
};

/**
 * Update quota stats from remote Firestore document
 */
export const updateQuotaFromRemote = (remoteData: any): void => {
    if (typeof window === 'undefined') return;
    if (!remoteData || remoteData.date !== getTodayString()) return;

    try {
        const localData = getQuotaData();

        const remoteWrites = typeof remoteData.writes === 'number' ? remoteData.writes : 0;
        const remoteReads = typeof remoteData.reads === 'number' ? remoteData.reads : 0;

        // Take max of local vs remote to prevent syncing losses
        const newWrites = Math.max(localData.writes, remoteWrites);
        const newReads = Math.max(localData.reads, remoteReads);

        const newModuleWrites: Record<string, number> = {};
        const localModuleWrites = localData.moduleWrites || {};
        const remoteModuleWrites = remoteData.moduleWrites || {};
        const allWriteKeys = new Set([...Object.keys(localModuleWrites), ...Object.keys(remoteModuleWrites)]);
        for (const key of allWriteKeys) {
            newModuleWrites[key] = Math.max(localModuleWrites[key] || 0, remoteModuleWrites[key] || 0);
        }

        const newModuleReads: Record<string, number> = {};
        const localModuleReads = localData.moduleReads || {};
        const remoteModuleReads = remoteData.moduleReads || {};
        const allReadKeys = new Set([...Object.keys(localModuleReads), ...Object.keys(remoteModuleReads)]);
        for (const key of allReadKeys) {
            newModuleReads[key] = Math.max(localModuleReads[key] || 0, remoteModuleReads[key] || 0);
        }

        const mergedData: QuotaData = {
            date: getTodayString(),
            writes: newWrites,
            reads: newReads,
            moduleWrites: newModuleWrites,
            moduleReads: newModuleReads
        };

        // Write directly to local storage to bypass syncCallback
        localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(mergedData));
        notifyQuotaListeners();
    } catch (e) {
        console.error('[FirestoreQuota] Failed to merge remote quota:', e);
    }
};

/**
 * Increment write counter
 * @returns true if increment was successful, false if quota exceeded
 */
export const incrementWrites = (moduleKey?: string): boolean => {
    const data = getQuotaData();
    const total = data.writes + data.reads;

    if (total >= DAILY_LIMIT) {
        console.warn('[FirestoreQuota] Daily limit reached. Write blocked.');
        return false;
    }

    data.writes++;
    
    if (moduleKey) {
        if (!data.moduleWrites) data.moduleWrites = {};
        data.moduleWrites[moduleKey] = (data.moduleWrites[moduleKey] || 0) + 1;
    }

    saveQuotaData(data);
    return true;
};

/**
 * Increment read counter
 * Note: Reads are tracked but not blocked to maintain usability
 */
export const incrementReads = (moduleKey?: string): void => {
    const data = getQuotaData();
    data.reads++;

    if (moduleKey) {
        if (!data.moduleReads) data.moduleReads = {};
        data.moduleReads[moduleKey] = (data.moduleReads[moduleKey] || 0) + 1;
    }

    saveQuotaData(data);
};

/**
 * Check if quota is exceeded
 */
export const isQuotaExceeded = (): boolean => {
    const data = getQuotaData();
    return (data.writes + data.reads) >= DAILY_LIMIT;
};

/**
 * Check if approaching quota limit (85%+)
 */
export const isQuotaWarning = (): boolean => {
    const data = getQuotaData();
    const usage = (data.writes + data.reads) / DAILY_LIMIT;
    return usage >= WARNING_THRESHOLD;
};

/**
 * Get current usage statistics
 */
export const getUsageStats = (): {
    writes: number;
    reads: number;
    total: number;
    limit: number;
    date: string;
    percentage: number;
    isWarning: boolean;
    isExceeded: boolean;
    moduleWrites: Record<string, number>;
    moduleReads: Record<string, number>;
} => {
    const data = getQuotaData();
    const total = data.writes + data.reads;
    const percentage = Math.min((total / DAILY_LIMIT) * 100, 100);

    return {
        writes: data.writes,
        reads: data.reads,
        total,
        limit: DAILY_LIMIT,
        date: data.date,
        percentage,
        isWarning: percentage >= WARNING_THRESHOLD * 100,
        isExceeded: total >= DAILY_LIMIT,
        moduleWrites: data.moduleWrites || {},
        moduleReads: data.moduleReads || {},
    };
};

/**
 * Get usage percentage (0-100)
 */
export const getUsagePercentage = (): number => {
    const data = getQuotaData();
    const total = data.writes + data.reads;
    return Math.min((total / DAILY_LIMIT) * 100, 100);
};

/**
 * Get the daily limit constant
 */
export const getDailyLimit = (): number => DAILY_LIMIT;

/**
 * Subscribe to quota changes (for reactive UI updates)
 * Returns unsubscribe function
 */
const quotaListeners: (() => void)[] = [];

export const subscribeToQuotaChanges = (listener: () => void): (() => void) => {
    quotaListeners.push(listener);
    return () => {
        const idx = quotaListeners.indexOf(listener);
        if (idx > -1) quotaListeners.splice(idx, 1);
    };
};

/**
 * Notify all quota listeners of a change
 */
export const notifyQuotaListeners = (): void => {
    quotaListeners.forEach(fn => fn());
};
