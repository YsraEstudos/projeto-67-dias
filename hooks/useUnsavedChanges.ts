import { useRef, useCallback, useMemo } from 'react';

/**
 * Deep equal comparison using JSON.stringify.
 * Works well for simple objects, arrays, and primitives.
 */
const isEqual = (a: unknown, b: unknown): boolean => {
    return JSON.stringify(a) === JSON.stringify(b);
};

interface UseUnsavedChangesOptions<T> {
    /** The initial value to compare against (typically from props) */
    initialValue: T;
    /** The current value (typically from local state) */
    currentValue: T;
    /** Optional custom comparison function */
    compareFunction?: (initial: T, current: T) => boolean;
}

interface UseUnsavedChangesReturn {
    /** Whether there are unsaved changes */
    hasChanges: boolean;
    /** Reset the initial value to current (call after save) */
    resetInitial: () => void;
}

/**
 * Hook to detect unsaved changes by comparing initial and current values.
 * 
 * @example
 * ```tsx
 * const { hasChanges, resetInitial } = useUnsavedChanges({
 *   initialValue: { title: note?.title || '', content: note?.content || '' },
 *   currentValue: { title, content },
 * });
 * 
 * const handleClose = () => {
 *   if (hasChanges) {
 *     setShowConfirmModal(true);
 *   } else {
 *     onClose();
 *   }
 * };
 * 
 * const handleSave = () => {
 *   // ... save logic
 *   resetInitial();
 *   onClose();
 * };
 * ```
 */
export function useUnsavedChanges<T>({
    initialValue,
    currentValue,
    compareFunction = isEqual,
}: UseUnsavedChangesOptions<T>): UseUnsavedChangesReturn {
    // Store the initial value in a ref so it persists across renders
    const initialRef = useRef<T>(initialValue);

    // Memoize the comparison to avoid recalculating on every render
    const hasChanges = useMemo(() => {
        return !compareFunction(initialRef.current, currentValue);
    }, [currentValue, compareFunction]);

    // Reset the initial value (call after saving)
    const resetInitial = useCallback(() => {
        initialRef.current = currentValue;
    }, [currentValue]);

    return { hasChanges, resetInitial };
}

export default useUnsavedChanges;
