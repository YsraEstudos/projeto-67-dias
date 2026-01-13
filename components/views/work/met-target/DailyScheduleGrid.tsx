import React, { useState, useMemo, useCallback } from 'react';
import { useWorkStore } from '../../../../stores';
import { ScheduleTimeBlock } from './ScheduleTimeBlock';
import { GoalAssignmentModal } from './GoalAssignmentModal';
import { CreateCustomGoalModal } from './CreateCustomGoalModal';
import type { GoalInputMode } from '../../../../types';

interface DailyScheduleGridProps {
    onNavigateToSunday?: () => void;
}

/**
 * Container for schedule-based goals. Shows 4 time slots in a responsive grid.
 * Each slot can have multiple tasks assigned.
 */
export const DailyScheduleGrid: React.FC<DailyScheduleGridProps> = React.memo(({
    onNavigateToSunday,
}) => {
    // State for modals
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isCreateGoalModalOpen, setIsCreateGoalModalOpen] = useState(false);

    // Get store state and actions - atomic selectors
    const timeSlots = useWorkStore((s) => s.timeSlots);
    const availableGoals = useWorkStore((s) => s.availableGoals);
    const tasks = useWorkStore((s) => s.tasks);
    const assignGoalToSlot = useWorkStore((s) => s.assignGoalToSlot);
    const removeTask = useWorkStore((s) => s.removeTask);
    const toggleTaskComplete = useWorkStore((s) => s.toggleTaskComplete);
    const updateTaskCount = useWorkStore((s) => s.updateTaskCount);
    const updateTaskMinutes = useWorkStore((s) => s.updateTaskMinutes);
    const createCustomGoal = useWorkStore((s) => s.createCustomGoal);
    const getGoalById = useWorkStore((s) => s.getGoalById);
    const getActiveSlotId = useWorkStore((s) => s.getActiveSlotId);
    const getTasksForSlot = useWorkStore((s) => s.getTasksForSlot);

    // Get today's date
    const today = useMemo(() => new Date().toISOString().split('T')[0], []);

    // Get active slot
    const activeSlotId = useMemo(() => getActiveSlotId(), [getActiveSlotId]);

    // Get tasks per slot for today
    const getSlotTasks = useCallback((slotId: string) => {
        return tasks.filter(t => t.slotId === slotId && t.date === today);
    }, [tasks, today]);

    // Get assigned goal IDs for a slot (to prevent duplicates)
    const getAssignedGoalIds = useCallback((slotId: string) => {
        return getSlotTasks(slotId).map(t => t.goalId);
    }, [getSlotTasks]);

    // Handlers
    const handleOpenGoalModal = useCallback((slotId: string) => {
        setSelectedSlotId(slotId);
        setIsGoalModalOpen(true);
    }, []);

    const handleCloseGoalModal = useCallback(() => {
        setIsGoalModalOpen(false);
        setSelectedSlotId(null);
    }, []);

    const handleSelectGoal = useCallback((goalId: string) => {
        if (selectedSlotId) {
            assignGoalToSlot(selectedSlotId, goalId);
        }
    }, [selectedSlotId, assignGoalToSlot]);

    const handleOpenCreateGoalModal = useCallback(() => {
        setIsGoalModalOpen(false);
        setIsCreateGoalModalOpen(true);
    }, []);

    const handleCloseCreateGoalModal = useCallback(() => {
        setIsCreateGoalModalOpen(false);
        // Reopen goal selection modal
        if (selectedSlotId) {
            setIsGoalModalOpen(true);
        }
    }, [selectedSlotId]);

    const handleCreateGoal = useCallback((goal: { label: string; icon: string; color: string; inputMode: GoalInputMode }) => {
        createCustomGoal(goal);
    }, [createCustomGoal]);

    return (
        <>
            <div className="space-y-3">
                {/* Section header */}
                <h4 className="text-slate-400 font-bold uppercase tracking-wider text-xs">
                    Rotina do Dia (Metas Extras)
                </h4>

                {/* Grid of time slots - 2 columns on desktop, 1 on mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {timeSlots.map((slot) => {
                        const slotTasks = getSlotTasks(slot.id);

                        return (
                            <ScheduleTimeBlock
                                key={slot.id}
                                slot={slot}
                                tasks={slotTasks}
                                getGoalById={getGoalById}
                                isActive={activeSlotId === slot.id}
                                onToggleComplete={toggleTaskComplete}
                                onUpdateCount={updateTaskCount}
                                onUpdateMinutes={updateTaskMinutes}
                                onRemoveTask={removeTask}
                                onAddTask={() => handleOpenGoalModal(slot.id)}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Goal Assignment Modal */}
            <GoalAssignmentModal
                isOpen={isGoalModalOpen}
                onClose={handleCloseGoalModal}
                slotId={selectedSlotId || ''}
                availableGoals={availableGoals}
                assignedGoalIds={selectedSlotId ? getAssignedGoalIds(selectedSlotId) : []}
                onSelectGoal={handleSelectGoal}
                onCreateNew={handleOpenCreateGoalModal}
            />

            {/* Create Custom Goal Modal */}
            <CreateCustomGoalModal
                isOpen={isCreateGoalModalOpen}
                onClose={handleCloseCreateGoalModal}
                onSave={handleCreateGoal}
            />
        </>
    );
});

DailyScheduleGrid.displayName = 'DailyScheduleGrid';

export default DailyScheduleGrid;
