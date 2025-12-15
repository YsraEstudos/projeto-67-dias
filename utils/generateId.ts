/**
 * Generates a unique ID with fallback for insecure contexts.
 * 
 * Uses crypto.randomUUID() when available (modern browsers in secure contexts).
 * Falls back to timestamp + random string for older browsers or insecure contexts.
 * 
 * @returns A unique string identifier
 */
export const generateId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback for environments where crypto.randomUUID is not available
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
