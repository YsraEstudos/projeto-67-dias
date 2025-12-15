/**
 * UUID Utility - Robust UUID generator with fallback
 * 
 * Uses crypto.randomUUID() when available, falls back to
 * a Math.random() based generator for older browsers or
 * non-secure contexts.
 */

/**
 * Generates a UUID v4 string.
 * @returns A valid UUID string (e.g., "550e8400-e29b-41d4-a716-446655440000")
 */
export function generateUUID(): string {
    // Try native crypto.randomUUID first (available in secure contexts)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        try {
            return crypto.randomUUID();
        } catch {
            // Fall through to fallback
        }
    }

    // Fallback: Math.random based UUID v4 generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
