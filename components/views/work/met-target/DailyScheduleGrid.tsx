import React, { useMemo, useCallback } from 'react';
import { useWorkStore } from '../../../../stores';
import { ScheduleTimeBlock } from './ScheduleTimeBlock';
import type { ScheduleBlockType } from '../../../../types';

interface DailyScheduleGridProps {
    onNavigateToSunday: () => void;
}

/**
 * Container for schedule-based goals. Shows 3 time blocks in a responsive grid.
 * Highlights the currently active block based on system time.
 */
export const DailyScheduleGrid: React.FC<DailyScheduleGridProps> = React.memo(({
    onNavigateToSunday,
}) => {
    // Get schedule blocks config and actions from store - atomic selectors
    const scheduleBlocks = useWorkStore((s) => s.scheduleBlocks);
    const scheduleProgress = useWorkStore((s) => s.scheduleProgress);
    const completeBlock = useWorkStore((s) => s.completeBlock);
    const uncompleteBlock = useWorkStore((s) => s.uncompleteBlock);
    const setNcmCount = useWorkStore((s) => s.setNcmCount);

    // Compute today's progress from scheduleProgress (derived state)
    const todayProgress = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const result: Record<ScheduleBlockType, { completed: boolean; count?: number }> = {
            NCM: { completed: false },
            STUDY: { completed: false },
            AJEITAR: { completed: false },
        };
        scheduleProgress
            .filter((p) => p.date === today)
            .forEach((p) => {
                result[p.blockId] = { completed: p.completed, count: p.count };
            });
        return result;
    }, [scheduleProgress]);

    // Compute active block based on current hour (stable within the same hour)
    const activeBlockId = useMemo(() => {
        const currentHour = new Date().getHours();
        const activeBlock = scheduleBlocks.find(
            (block) => currentHour >= block.startHour && currentHour < block.endHour
        );
        return activeBlock?.id ?? null;
    }, [scheduleBlocks]);

    // Memoized handlers to prevent child re-renders
    const handleNcmCountChange = useCallback((count: number) => {
        setNcmCount(count);
    }, [setNcmCount]);

    const handleComplete = useCallback((blockId: ScheduleBlockType) => {
        completeBlock(blockId);
    }, [completeBlock]);

    const handleUncomplete = useCallback((blockId: ScheduleBlockType) => {
        uncompleteBlock(blockId);
    }, [uncompleteBlock]);

    return (
        <div className="space-y-3">
            {/* Section header */}
            <h4 className="text-slate-400 font-bold uppercase tracking-wider text-xs">
                Rotina do Dia
            </h4>

            {/* Grid of time blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scheduleBlocks.map((block) => {
                    const progress = todayProgress[block.id];

                    return (
                        <ScheduleTimeBlock
                            key={block.id}
                            block={block}
                            isActive={activeBlockId === block.id}
                            isCompleted={progress?.completed || false}
                            count={progress?.count || 0}
                            onComplete={() => handleComplete(block.id)}
                            onUncomplete={() => handleUncomplete(block.id)}
                            onCountChange={block.id === 'NCM' ? handleNcmCountChange : () => { }}
                            onNavigate={block.id === 'AJEITAR' ? onNavigateToSunday : undefined}
                        />
                    );
                })}
            </div>
        </div>
    );
});

DailyScheduleGrid.displayName = 'DailyScheduleGrid';

export default DailyScheduleGrid;
