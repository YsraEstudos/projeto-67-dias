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
}

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayString = (): string => {
    const now = new Date();
    return now.toISOString().split('T')[0];
};

/**
 * Read current quota data from localStorage
 */
const getQuotaData = (): QuotaData => {
    if (typeof window === 'undefined') {
        return { date: getTodayString(), writes: 0, reads: 0 };
    }

    try {
        const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
        if (!raw) {
            return { date: getTodayString(), writes: 0, reads: 0 };
        }

        const data: QuotaData = JSON.parse(raw);

        // Reset if it's a new day
        if (data.date !== getTodayString()) {
            const newData = { date: getTodayString(), writes: 0, reads: 0 };
            localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(newData));
            return newData;
        }

        return data;
    } catch {
        return { date: getTodayString(), writes: 0, reads: 0 };
    }
};

/**
 * Save quota data to localStorage
 */
const saveQuotaData = (data: QuotaData): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(data));
};

/**
 * Increment write counter
 * @returns true if increment was successful, false if quota exceeded
 */
export const incrementWrites = (): boolean => {
    const data = getQuotaData();
    const total = data.writes + data.reads;

    if (total >= DAILY_LIMIT) {
        console.warn('[FirestoreQuota] Daily limit reached. Write blocked.');
        return false;
    }

    data.writes++;
    saveQuotaData(data);
    return true;
};

/**
 * Increment read counter
 * Note: Reads are tracked but not blocked to maintain usability
 */
export const incrementReads = (): void => {
    const data = getQuotaData();
    data.reads++;
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
