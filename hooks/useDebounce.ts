import { useRef, useCallback, useEffect, useState, useMemo } from 'react';

/**
 * Custom hook for debouncing values
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Custom hook for creating a debounced function
 * 
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns A debounced version of the function
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number = 300
): T {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const debouncedFn = useCallback(
        (...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                fn(...args);
            }, delay);
        },
        [fn, delay]
    ) as T;

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedFn;
}

/**
 * Custom hook for debounced search with separate input and query states
 * 
 * This pattern allows the input to update immediately for responsive UX,
 * while the actual search query is debounced for performance.
 * 
 * @param delay - Delay in milliseconds (default: 300)
 * @returns [searchQuery, searchInput, setSearchInput]
 */
export function useDebouncedSearch(delay: number = 300) {
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearchQuery = useDebounce(searchInput, delay);

    return useMemo(
        () => ({
            searchQuery: debouncedSearchQuery,
            searchInput,
            setSearchInput,
        }),
        [debouncedSearchQuery, searchInput]
    );
}
