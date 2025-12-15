/**
 * Study Scheduler Slice - Study subjects and schedules
 */
import { StateCreator } from 'zustand';

export interface StudySubject {
    id: string;
    name: string;
    color: string;
    createdAt?: number;
}

export interface ScheduledStudyItem {
    subjectId: string;
    type: 'VIDEO' | 'ANKI';
    isCompleted: boolean;
}

export interface DailyStudySchedule {
    date: string;
    items: ScheduledStudyItem[];
}

export interface SchedulerSlice {
    studySubjects: StudySubject[];
    studySchedules: DailyStudySchedule[];
    setStudySubjects: (subjects: StudySubject[]) => void;
    addSubject: (subject: StudySubject) => void;
    updateSubject: (id: string, updates: Partial<StudySubject>) => void;
    deleteSubject: (id: string) => void;
    setSchedules: (schedules: DailyStudySchedule[]) => void;
    updateSchedule: (date: string, schedule: DailyStudySchedule) => void;
    toggleScheduleItem: (date: string, itemId: string) => void;
}

export const createSchedulerSlice: StateCreator<
    SchedulerSlice,
    [],
    [],
    SchedulerSlice
> = (set) => ({
    studySubjects: [],
    studySchedules: [],

    setStudySubjects: (subjects) => set({ studySubjects: subjects }),

    addSubject: (subject) => set((state) => ({
        studySubjects: [...state.studySubjects, subject]
    })),

    updateSubject: (id, updates) => set((state) => ({
        studySubjects: state.studySubjects.map(s =>
            s.id === id ? { ...s, ...updates } : s
        )
    })),

    deleteSubject: (id) => set((state) => ({
        studySubjects: state.studySubjects.filter(s => s.id !== id)
    })),

    setSchedules: (schedules) => set({ studySchedules: schedules }),

    updateSchedule: (date, schedule) => set((state) => ({
        studySchedules: state.studySchedules.some(s => s.date === date)
            ? state.studySchedules.map(s => s.date === date ? schedule : s)
            : [...state.studySchedules, schedule]
    })),

    toggleScheduleItem: (date, itemId) => set((state) => ({
        studySchedules: state.studySchedules.map(schedule => {
            if (schedule.date !== date) return schedule;
            return {
                ...schedule,
                items: schedule.items.map(item =>
                    item.subjectId === itemId ? { ...item, isCompleted: !item.isCompleted } : item
                )
            };
        })
    })),
});
