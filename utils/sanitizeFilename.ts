/**
 * Sanitizes a filename for safe download across all operating systems.
 * - Removes special characters
 * - Prevents Windows reserved names (CON, PRN, AUX, NUL, COM1, LPT1, etc.)
 * - Limits length to 100 characters
 */
export const sanitizeFilename = (name: string): string => {
    const safe = name.replace(/[^a-z0-9]/gi, '_');
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'LPT1', 'LPT2'];
    const baseName = reservedNames.includes(safe.toUpperCase()) ? `_${safe}` : safe;
    return baseName.slice(0, 100) || 'nota';
};
