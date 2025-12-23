import { useState, useMemo, useCallback } from 'react';
import { OrganizeTask } from '../../../../types';
import { useTasks, useHabits, useTaskActions } from '../../../../stores/selectors';
import { useDebounce } from '../../../../hooks/useDebounce';
import { useStreakTracking } from '../../../../hooks/useStreakTracking';

export const useTasksManager = () => {
    // Global State
    const tasks = useTasks();
    const habits = useHabits();
    const {
        addTask,
        updateTask,
        deleteTask: removeTask,
    } = useTaskActions();

    const { trackActivity } = useStreakTracking();

    // Local State
    const [showArchived, setShowArchived] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<OrganizeTask | null>(null);

    const searchQuery = useDebounce(searchInput, 300);

    // Computed
    const categories = useMemo(() => {
        const cats = new Set([...tasks.map(t => t.category), ...habits.map(h => h.category)]);
        return Array.from(cats).sort();
    }, [tasks, habits]);

    const filteredTasks = useMemo(() => {
        return tasks
            .filter(t => {
                if (showArchived) return t.isArchived;
                return !t.isArchived;
            })
            .filter(t => {
                if (filterCategory) return t.category === filterCategory;
                return true;
            })
            .filter(t => {
                if (!searchQuery) return true;
                return t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.category.toLowerCase().includes(searchQuery.toLowerCase());
            })
            .sort((a, b) => {
                if (a.dueDate && !b.dueDate) return -1;
                if (!a.dueDate && b.dueDate) return 1;
                if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
                return b.createdAt - a.createdAt;
            });
    }, [tasks, showArchived, filterCategory, searchQuery]);

    // Handlers
    const handleEditTask = useCallback((task: OrganizeTask) => {
        setEditingTask(task);
        setIsModalOpen(true);
    }, []);

    const handleSaveTask = useCallback((taskData: Partial<OrganizeTask>) => {
        if (editingTask) {
            updateTask(editingTask.id, taskData);
        } else {
            const newTask: OrganizeTask = {
                id: Date.now().toString(),
                title: taskData.title || 'Nova Tarefa',
                category: taskData.category || 'Geral',
                isCompleted: false,
                isArchived: false,
                createdAt: Date.now(),
                dueDate: taskData.dueDate,
                reminderDate: taskData.reminderDate,
            };
            addTask(newTask);
        }
        setIsModalOpen(false);
        setEditingTask(null);
    }, [editingTask, addTask, updateTask]);

    const toggleCompleteTask = useCallback((id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            const newStatus = !task.isCompleted;
            updateTask(id, {
                isCompleted: newStatus,
                isArchived: newStatus // Auto archive on complete
            });
            if (newStatus) {
                trackActivity();
            }
        }
    }, [tasks, updateTask, trackActivity]);

    const restoreTaskHandler = useCallback((id: string) => {
        updateTask(id, { isCompleted: false, isArchived: false });
    }, [updateTask]);

    const deleteTask = useCallback((id: string) => {
        if (confirm('Tem certeza que deseja excluir permanentemente?')) {
            removeTask(id);
        }
    }, [removeTask]);

    const handleAIGeneratedTasks = useCallback((newTasks: { title: string, category: string, daysFromNow?: number }[]) => {
        newTasks.forEach((t, idx) => {
            const dueDate = t.daysFromNow ? new Date(new Date().setDate(new Date().getDate() + t.daysFromNow)).toISOString().split('T')[0] : undefined;
            const task: OrganizeTask = {
                id: (Date.now() + idx).toString(),
                title: t.title,
                category: t.category,
                isCompleted: false,
                isArchived: false,
                createdAt: Date.now(),
                dueDate: dueDate
            };
            addTask(task);
        });
        setIsAIModalOpen(false);
    }, [addTask]);

    return {
        // State
        showArchived,
        setShowArchived,
        filterCategory,
        setFilterCategory,
        searchInput,
        setSearchInput,
        isModalOpen,
        setIsModalOpen,
        isAIModalOpen,
        setIsAIModalOpen,
        editingTask,
        setEditingTask,

        // Data
        categories,
        filteredTasks,

        // Actions
        handleEditTask,
        handleSaveTask,
        toggleCompleteTask,
        restoreTaskHandler,
        deleteTask,
        handleAIGeneratedTasks
    };
};
