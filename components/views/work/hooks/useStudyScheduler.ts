import { useState, useMemo, useCallback } from 'react';
import { StudySubject, ScheduledStudyItem, DailyStudySchedule } from '../../../../stores';
import { getTodayKey } from '../utils';

// Subject colors for selection
export const SUBJECT_COLORS = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
    'bg-orange-500', 'bg-cyan-500', 'bg-red-500', 'bg-yellow-500'
];

interface UseStudySchedulerProps {
    studySubjects: StudySubject[];
    onUpdateSubjects: (subjects: StudySubject[]) => void;
    studySchedules: DailyStudySchedule[];
    onUpdateSchedules: (schedules: DailyStudySchedule[]) => void;
}

export const useStudyScheduler = ({
    studySubjects, onUpdateSubjects, studySchedules, onUpdateSchedules
}: UseStudySchedulerProps) => {
    // Subject management state
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectColor, setNewSubjectColor] = useState(SUBJECT_COLORS[0]);
    const [showAddSubject, setShowAddSubject] = useState(false);

    // --- Study Scheduler Functions ---
    const handleAddSubject = useCallback(() => {
        if (!newSubjectName.trim()) return;
        const newSubject: StudySubject = {
            id: Date.now().toString(),
            name: newSubjectName.trim(),
            color: newSubjectColor,
            createdAt: Date.now()
        };
        onUpdateSubjects([...studySubjects, newSubject]);
        setNewSubjectName('');
        setNewSubjectColor(SUBJECT_COLORS[0]);
        setShowAddSubject(false);
    }, [newSubjectName, newSubjectColor, studySubjects, onUpdateSubjects]);

    const handleDeleteSubject = useCallback((subjectId: string) => {
        onUpdateSubjects(studySubjects.filter(s => s.id !== subjectId));
        // Also remove from schedules
        const updatedSchedules = studySchedules.map(schedule => ({
            ...schedule,
            items: schedule.items.filter(item => item.subjectId !== subjectId)
        }));
        onUpdateSchedules(updatedSchedules);
    }, [studySubjects, studySchedules, onUpdateSubjects, onUpdateSchedules]);

    // Pre-compute schedule lookups for performance
    const scheduleByDate = useMemo(() => {
        const map = new Map<string, DailyStudySchedule>();
        studySchedules.forEach(s => map.set(s.date, s));
        return map;
    }, [studySchedules]);

    const getScheduleForDate = useCallback((date: string): DailyStudySchedule => {
        return scheduleByDate.get(date) || { date, items: [] };
    }, [scheduleByDate]);

    // Memoize today/tomorrow - only recalculates when day changes
    const todayKey = getTodayKey();
    const { today, tomorrow } = useMemo(() => {
        const now = new Date();
        const tmr = new Date(now);
        tmr.setDate(tmr.getDate() + 1);
        return {
            today: now.toISOString().split('T')[0],
            tomorrow: tmr.toISOString().split('T')[0]
        };
    }, [todayKey]);

    // Memoized schedule items
    const todaySchedule = useMemo(() => getScheduleForDate(today), [getScheduleForDate, today]);
    const tomorrowSchedule = useMemo(() => getScheduleForDate(tomorrow), [getScheduleForDate, tomorrow]);

    const getItemsForDateAndType = useCallback((schedule: DailyStudySchedule, type: 'VIDEO' | 'ANKI'): ScheduledStudyItem[] => {
        return schedule.items.filter(item => item.type === type);
    }, []);

    const handleAddScheduleItem = useCallback((date: string, subjectId: string, type: 'VIDEO' | 'ANKI') => {
        const schedule = getScheduleForDate(date);
        // Check if already exists
        if (schedule.items.some(item => item.subjectId === subjectId && item.type === type)) return;

        const newItem: ScheduledStudyItem = {
            subjectId,
            type,
            isCompleted: false
        };

        const updatedSchedule: DailyStudySchedule = {
            ...schedule,
            items: [...schedule.items, newItem]
        };

        const otherSchedules = studySchedules.filter(s => s.date !== date);
        onUpdateSchedules([...otherSchedules, updatedSchedule]);
    }, [getScheduleForDate, studySchedules, onUpdateSchedules]);

    const handleRemoveScheduleItem = useCallback((date: string, subjectId: string, type: 'VIDEO' | 'ANKI') => {
        const schedule = getScheduleForDate(date);
        const updatedSchedule: DailyStudySchedule = {
            ...schedule,
            items: schedule.items.filter(item => !(item.subjectId === subjectId && item.type === type))
        };

        const otherSchedules = studySchedules.filter(s => s.date !== date);
        onUpdateSchedules([...otherSchedules, updatedSchedule]);
    }, [getScheduleForDate, studySchedules, onUpdateSchedules]);

    const handleToggleComplete = useCallback((date: string, subjectId: string, type: 'VIDEO' | 'ANKI') => {
        const schedule = getScheduleForDate(date);
        const updatedSchedule: DailyStudySchedule = {
            ...schedule,
            items: schedule.items.map(item =>
                item.subjectId === subjectId && item.type === type
                    ? { ...item, isCompleted: !item.isCompleted }
                    : item
            )
        };

        const otherSchedules = studySchedules.filter(s => s.date !== date);
        onUpdateSchedules([...otherSchedules, updatedSchedule]);
    }, [getScheduleForDate, studySchedules, onUpdateSchedules]);

    return {
        newSubjectName, setNewSubjectName,
        newSubjectColor, setNewSubjectColor,
        showAddSubject, setShowAddSubject,
        handleAddSubject,
        handleDeleteSubject,
        today, tomorrow,
        todaySchedule, tomorrowSchedule,
        getItemsForDateAndType,
        handleAddScheduleItem,
        handleRemoveScheduleItem,
        handleToggleComplete
    };
};
