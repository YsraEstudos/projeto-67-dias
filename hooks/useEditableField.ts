import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing inline editable fields.
 * Handles state, ref, focus management, and save/cancel operations.
 * 
 * @param initialValue - The initial value of the field
 * @param onSave - Callback when value is saved (only called if value changed)
 * @returns Object with editing state and handlers
 */
export function useEditableField<T extends string | number>(
    initialValue: T,
    onSave: (value: T) => void
) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedValue, setEditedValue] = useState<T>(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Sync with external value changes
    useEffect(() => {
        setEditedValue(initialValue);
    }, [initialValue]);

    const startEditing = useCallback(() => {
        setIsEditing(true);
    }, []);

    const save = useCallback(() => {
        if (editedValue !== initialValue) {
            onSave(editedValue);
        }
        setIsEditing(false);
    }, [editedValue, initialValue, onSave]);

    const cancel = useCallback(() => {
        setEditedValue(initialValue);
        setIsEditing(false);
    }, [initialValue]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            save();
        } else if (e.key === 'Escape') {
            cancel();
        }
    }, [save, cancel]);

    return {
        isEditing,
        editedValue,
        inputRef,
        startEditing,
        save,
        cancel,
        setEditedValue,
        handleKeyDown,
    };
}
