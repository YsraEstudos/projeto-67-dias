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
    // Aliases for workStore compatibility
    addStudySubject: (subject: StudySubject) => void;
    updateStudySubject: (id: string, updates: Partial<StudySubject>) => void;
    deleteStudySubject: (id: string) => void;
    setStudySchedule: (date: string, schedule: DailyStudySchedule) => void;
    clearStudySchedule: (date: string) => void;
}

export const createSchedulerSlice: StateCreator<
    SchedulerSlice,
    [],
    [],
    SchedulerSlice
> = (set) => ({
    studySubjects: [],
    studySchedules: [],

    setStudySubjects: (subjects) => set((state) => {
        state.studySubjects = subjects;
    }),

    addSubject: (subject) => set((state) => {
        state.studySubjects.push(subject);
    }),

    updateSubject: (id, updates) => set((state) => {
        const subject = state.studySubjects.find(s => s.id === id);
        if (subject) Object.assign(subject, updates);
    }),

    deleteSubject: (id) => set((state) => {
        const idx = state.studySubjects.findIndex(s => s.id === id);
        if (idx !== -1) state.studySubjects.splice(idx, 1);
    }),

    setSchedules: (schedules) => set((state) => {
        state.studySchedules = schedules;
    }),

    updateSchedule: (date, schedule) => set((state) => {
        const existing = state.studySchedules.find(s => s.date === date);
        if (existing) {
            Object.assign(existing, schedule);
        } else {
            state.studySchedules.push(schedule);
        }
    }),

    toggleScheduleItem: (date, itemId) => set((state) => {
        const schedule = state.studySchedules.find(s => s.date === date);
        if (schedule) {
            const item = schedule.items.find(i => i.subjectId === itemId);
            if (item) item.isCompleted = !item.isCompleted;
        }
    }),

    // Aliases for workStore compatibility
    addStudySubject: (subject) => set((state) => {
        state.studySubjects.push(subject);
    }),

    updateStudySubject: (id, updates) => set((state) => {
        const subject = state.studySubjects.find(s => s.id === id);
        if (subject) Object.assign(subject, updates);
    }),

    deleteStudySubject: (id) => set((state) => {
        const idx = state.studySubjects.findIndex(s => s.id === id);
        if (idx !== -1) state.studySubjects.splice(idx, 1);
    }),

    setStudySchedule: (date, schedule) => set((state) => {
        const existing = state.studySchedules.find(s => s.date === date);
        if (existing) {
            Object.assign(existing, schedule);
        } else {
            state.studySchedules.push(schedule);
        }
    }),

    clearStudySchedule: (date) => set((state) => {
        const idx = state.studySchedules.findIndex(s => s.date === date);
        if (idx !== -1) state.studySchedules.splice(idx, 1);
    }),
});

