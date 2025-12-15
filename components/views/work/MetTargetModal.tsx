import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Trophy, X } from 'lucide-react';
import type { MetTargetSession, StudySubject, DailyStudySchedule } from '../../../stores';
import { getWeekStart, isSameWeek } from './utils';

// Hooks
import { useStudyScheduler } from './hooks/useStudyScheduler';

// Components
import { SessionTab } from './met-target/SessionTab';
import { HistoryTab } from './met-target/HistoryTab';
import { SettingsTab } from './met-target/SettingsTab';
import { StudyScheduler } from './met-target/StudyScheduler';

interface WorkGoals {
    weekly: number;
    ultra: number;
    anki: number;
    ncm: number;
}

interface MetTargetModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: MetTargetSession[];
    onSaveSession: (session: MetTargetSession) => void;
    goals: WorkGoals;
    onUpdateGoals: (goals: WorkGoals) => void;
    onDeleteSession: (id: string) => void;
    // Study Scheduler Props
    studySubjects: StudySubject[];
    onUpdateSubjects: (subjects: StudySubject[]) => void;
    studySchedules: DailyStudySchedule[];
    onUpdateSchedules: (schedules: DailyStudySchedule[]) => void;
}

const MetTargetModal: React.FC<MetTargetModalProps> = ({
    isOpen, onClose, history, onSaveSession,
    goals, onUpdateGoals, onDeleteSession,
    studySubjects, onUpdateSubjects, studySchedules, onUpdateSchedules
}) => {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'SESSION' | 'HISTORY' | 'SETTINGS'>('SESSION');
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [ankiCount, setAnkiCount] = useState(0);
    const [ncmCount, setNcmCount] = useState(0);

    // Local state for goals editing
    const [localGoals, setLocalGoals] = useState(goals);

    // Pagination for history
    const [visibleHistoryCount, setVisibleHistoryCount] = useState(20);

    // Use Custom Hook for Study Scheduler Logic
    const scheduler = useStudyScheduler({
        studySubjects,
        onUpdateSubjects,
        studySchedules,
        onUpdateSchedules
    });

    // --- EFFECT: Timer ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    // --- EFFECT: Sync Local Goals ---
    useEffect(() => {
        if (isOpen) {
            setLocalGoals(goals);
        }
    }, [isOpen, goals]);

    // --- DERIVED METRICS ---
    const { weeklyPoints, weeklyProgressPercent, hasMetWeeklyGoal, hasMetUltraGoal, isInUltraPhase } = useMemo(() => {
        const currentWeekStart = getWeekStart(new Date());
        const weeklySessions = history.filter(s => isSameWeek(new Date(s.date), currentWeekStart));
        const points = weeklySessions.reduce((sum, s) => sum + s.points, 0);

        const _isInUltraPhase = points >= goals.weekly;
        const targetGoal = _isInUltraPhase ? goals.ultra : goals.weekly;
        const percent = Math.min(100, (points / targetGoal) * 100);

        return {
            weeklyPoints: points,
            weeklyProgressPercent: percent,
            hasMetWeeklyGoal: points >= goals.weekly,
            hasMetUltraGoal: points >= goals.ultra,
            isInUltraPhase: _isInUltraPhase
        };
    }, [history, goals]);

    const targetGoal = isInUltraPhase ? goals.ultra : goals.weekly;
    // Check if daily goals met for locking input
    const isInputLocked = ankiCount >= goals.anki && ncmCount >= goals.ncm;

    // --- HANDLERS ---
    const handleSaveSession = useCallback(() => {
        if (timerSeconds === 0 && ankiCount === 0 && ncmCount === 0) return;

        // Calculate points: 1 pt per min, 2 pts per Anki/NCM
        const points = Math.floor(timerSeconds / 60) + (ankiCount * 2) + (ncmCount * 2);

        const newSession: MetTargetSession = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            durationSeconds: timerSeconds,
            ankiCount: ankiCount,
            ncmCount: ncmCount,
            points
        };

        onSaveSession(newSession);

        // Reset
        setTimerSeconds(0);
        setIsRunning(false);
        setAnkiCount(0);
        setNcmCount(0);
        setActiveTab('HISTORY');
    }, [timerSeconds, ankiCount, ncmCount, onSaveSession]);

    const handleSaveSettings = useCallback(() => {
        onUpdateGoals(localGoals);
        // Visual feedback could be added here
    }, [localGoals, onUpdateGoals]);

    // Memoized history list for expensive renders
    const reversedHistory = useMemo(() => [...history].reverse(), [history]);
    const visibleHistory = useMemo(() => reversedHistory.slice(0, visibleHistoryCount), [reversedHistory, visibleHistoryCount]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
                    <div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
                            <Trophy className="text-yellow-500" /> Metas Extras
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">Superando expectativas diárias</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex p-2 bg-slate-950/50 justify-center gap-2">
                    {[
                        { id: 'SESSION', label: 'Sessão Atual' },
                        { id: 'HISTORY', label: 'Histórico' },
                        { id: 'SETTINGS', label: 'Configurações' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-slate-800 text-white shadow-lg'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'SESSION' && (
                        <SessionTab
                            timerSeconds={timerSeconds}
                            isRunning={isRunning}
                            setIsRunning={setIsRunning}
                            setTimerSeconds={setTimerSeconds}
                            ankiCount={ankiCount}
                            setAnkiCount={setAnkiCount}
                            ncmCount={ncmCount}
                            setNcmCount={setNcmCount}
                            goals={goals}
                            isInputLocked={isInputLocked}
                            onSave={handleSaveSession}
                        >
                            <StudyScheduler
                                today={scheduler.today}
                                tomorrow={scheduler.tomorrow}
                                todaySchedule={scheduler.todaySchedule}
                                tomorrowSchedule={scheduler.tomorrowSchedule}
                                studySubjects={studySubjects}
                                onToggleComplete={scheduler.handleToggleComplete}
                                onRemoveItem={scheduler.handleRemoveScheduleItem}
                                onAddItem={scheduler.handleAddScheduleItem}
                                setActiveTab={setActiveTab}
                                getItemsForDateAndType={scheduler.getItemsForDateAndType}
                            />
                        </SessionTab>
                    )}

                    {activeTab === 'HISTORY' && (
                        <HistoryTab
                            history={history}
                            visibleHistory={visibleHistory}
                            visibleHistoryCount={visibleHistoryCount}
                            setVisibleHistoryCount={setVisibleHistoryCount}
                            reversedHistoryLength={reversedHistory.length}
                            onDeleteSession={onDeleteSession}
                            weeklyPoints={weeklyPoints}
                            targetGoal={targetGoal}
                            weeklyProgressPercent={weeklyProgressPercent}
                            isInUltraPhase={isInUltraPhase}
                            goals={goals}
                            hasMetWeeklyGoal={hasMetWeeklyGoal}
                            hasMetUltraGoal={hasMetUltraGoal}
                        />
                    )}

                    {activeTab === 'SETTINGS' && (
                        <SettingsTab
                            localGoals={localGoals}
                            setLocalGoals={setLocalGoals}
                            onSaveSettings={handleSaveSettings}
                            studySubjects={studySubjects}
                            onDeleteSubject={scheduler.handleDeleteSubject}
                            showAddSubject={scheduler.showAddSubject}
                            setShowAddSubject={scheduler.setShowAddSubject}
                            newSubjectName={scheduler.newSubjectName}
                            setNewSubjectName={scheduler.setNewSubjectName}
                            newSubjectColor={scheduler.newSubjectColor}
                            setNewSubjectColor={scheduler.setNewSubjectColor}
                            onAddSubject={scheduler.handleAddSubject}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default MetTargetModal;
