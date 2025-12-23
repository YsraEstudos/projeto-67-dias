import { useState, useCallback } from 'react';
import { Habit } from '../../../../types';
import { useHabitActions, useHabits } from '../../../../stores/selectors';
import { useStreakTracking } from '../../../../hooks/useStreakTracking';

export const useHabitsManager = () => {
    // Global State
    const habits = useHabits();
    const {
        addHabit,
        updateHabit,
        deleteHabit: removeHabit,
        toggleHabitCompletion,
    } = useHabitActions();

    // Local State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);

    const { trackActivity } = useStreakTracking();

    // Computed
    const dateKey = selectedDate.toISOString().split('T')[0];

    // Handlers
    const changeDay = useCallback((days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    }, [selectedDate]);

    const handleEditHabit = useCallback((habit: Habit) => {
        setEditingHabit(habit);
        setIsHabitModalOpen(true);
    }, []);

    const deleteHabit = useCallback((id: string) => {
        if (confirm('Remover este hábito? Todo o histórico será perdido.')) {
            removeHabit(id);
        }
    }, [removeHabit]);

    const handleSaveHabit = useCallback((habit: Habit) => {
        if (editingHabit) {
            updateHabit(editingHabit.id, {
                ...habit,
                id: editingHabit.id,
                history: editingHabit.history,
                createdAt: editingHabit.createdAt
            });
        } else {
            addHabit(habit);
        }
        setIsHabitModalOpen(false);
        setEditingHabit(null);
    }, [editingHabit, updateHabit, addHabit]);

    const handleToggleHabitCompletion = useCallback((habitId: string, subHabitId?: string) => {
        // Use store action
        toggleHabitCompletion(habitId, dateKey, subHabitId);

        // Special handling for parent toggle with sub-habits (Mark all sub-habits as done if parent is done)
        if (!subHabitId) {
            const habit = habits.find(h => h.id === habitId);

            if (habit && habit.subHabits.length > 0) {
                const currentLog = habit.history[dateKey] || { completed: false, subHabitsCompleted: [] };
                const willBeComplete = !currentLog.completed;

                updateHabit(habitId, {
                    history: {
                        ...habit.history,
                        [dateKey]: {
                            ...currentLog,
                            completed: willBeComplete,
                            subHabitsCompleted: willBeComplete ? habit.subHabits.map(sh => sh.id) : []
                        }
                    }
                });
            }
        }

        trackActivity();
    }, [habits, dateKey, toggleHabitCompletion, updateHabit, trackActivity]);

    const handleLogValue = useCallback((habitId: string, value: number) => {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;

        const currentLog = habit.history[dateKey] || { completed: false, subHabitsCompleted: [], value: 0 };
        const newValue = (currentLog.value || 0) + value;

        let isCompleted = currentLog.completed;
        if (habit.targetValue) {
            if (habit.goalType === 'MIN_TIME' && habit.frequency === 'DAILY' && newValue >= habit.targetValue) {
                isCompleted = true;
            }
        }

        updateHabit(habitId, {
            history: {
                ...habit.history,
                [dateKey]: {
                    ...currentLog,
                    value: newValue,
                    completed: isCompleted
                }
            }
        });
    }, [habits, dateKey, updateHabit]);

    return {
        habits,
        selectedDate,
        dateKey,
        isHabitModalOpen,
        editingHabit,
        setEditingHabit,
        setIsHabitModalOpen,
        changeDay,
        handleEditHabit,
        deleteHabit,
        handleSaveHabit,
        handleToggleHabitCompletion,
        handleLogValue
    };
};
