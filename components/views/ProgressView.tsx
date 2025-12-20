import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
    Award, BookOpen, GraduationCap, Flame, CheckCircle2,
    Calendar, TrendingUp, BrainCircuit, LayoutGrid,
    Clock, Activity, Trophy, Sparkles, Camera
} from 'lucide-react';
// Zustand stores
import { useHabitsStore } from '../../stores/habitsStore';
import { useReadingStore } from '../../stores/readingStore';
import { useSkillsStore } from '../../stores/skillsStore';
import { useConfigStore } from '../../stores/configStore';
import { useReviewStore } from '../../stores/reviewStore';
import { useGamesStore } from '../../stores/gamesStore';
import {
    Habit, Book, Skill, OrganizeTask, ProjectConfig,
    JourneyReviewData, WeeklySnapshot, ImprovementPoint
} from '../../types';
import {
    calculateCurrentWeek,
    calculateCurrentDay,
    generateWeeklySnapshot,
    shouldGenerateSnapshot,
    detectImprovements,
    generateFinalSummary
} from '../../services/weeklySnapshot';
import { HabitsProgressSection } from '../progress/HabitsProgressSection';
import { TasksProgressSection } from '../progress/TasksProgressSection';
import { DailyOffensiveProgress } from '../progress/DailyOffensiveProgress';

// Lazy load heavy components
const EvolutionChart = React.lazy(() => import('../progress/EvolutionChart').then(module => ({ default: module.EvolutionChart })));
const WeeklyTimeline = React.lazy(() => import('../progress/WeeklyTimeline').then(module => ({ default: module.WeeklyTimeline })));
const WeeklyReviewCard = React.lazy(() => import('../progress/WeeklyReviewCard').then(module => ({ default: module.WeeklyReviewCard })));
const ImprovementsList = React.lazy(() => import('../progress/ImprovementsList').then(module => ({ default: module.ImprovementsList })));
const MoodEvolutionChart = React.lazy(() => import('../progress/MoodEvolutionChart').then(module => ({ default: module.MoodEvolutionChart })));
const FinalJourneySummaryComponent = React.lazy(() => import('../progress/FinalJourneySummary').then(module => ({ default: module.FinalJourneySummaryComponent })));
const SnapshotConfirmationModal = React.lazy(() => import('../progress/SnapshotConfirmationModal').then(module => ({ default: module.SnapshotConfirmationModal })));
const HabitWeeklyChart = React.lazy(() => import('../progress/HabitWeeklyChart'));

// Loading Fallback
const TabLoading = () => (
    <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mr-3"></div>
        Carregando...
    </div>
);

type TabType = 'overview' | 'weeks' | 'evolution' | 'final';

const ProgressView: React.FC = () => {
    // --- DATA AGGREGATION (Zustand Stores - Optimized Selectors) ---
    // Using atomic selectors to prevent unnecessary re-renders
    const habits = useHabitsStore((s) => s.habits);
    const tasks = useHabitsStore((s) => s.tasks);
    const books = useReadingStore((s) => s.books);
    const skills = useSkillsStore((s) => s.skills);
    const config = useConfigStore((s) => s.config);
    const games = useGamesStore((s) => s.games);

    // Review store - data and actions
    const reviewData = useReviewStore((s) => s.reviewData);
    const addSnapshot = useReviewStore((s) => s.addSnapshot);
    const addSnapshotWithImprovements = useReviewStore((s) => s.addSnapshotWithImprovements);
    const toggleImprovementAddressed = useReviewStore((s) => s.toggleImprovementAddressed);
    const setFinalSummary = useReviewStore((s) => s.setFinalSummary);


    // UI State
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingSnapshot, setPendingSnapshot] = useState<WeeklySnapshot | null>(null);

    const currentWeek = useMemo(() => calculateCurrentWeek(config.startDate), [config.startDate]);
    const currentDay = useMemo(() => calculateCurrentDay(config.startDate), [config.startDate]);
    const journeyComplete = currentDay >= 67;

    // --- GRANULAR STATS CALCULATIONS ---

    // 1. Journey Progress
    const progressStats = useMemo(() => {
        // Use standardized calculation consistent with Weekly Snapshot / Calendar
        const dayNum = calculateCurrentDay(config.startDate);
        const journeyProgress = Math.min(100, Math.round((dayNum / 67) * 100));
        return { currentDay: dayNum, journeyProgress };
    }, [config.startDate]);

    // 2. Habits Consistency (Last 7 Days)
    const habitStats = useMemo(() => {
        let totalHabitChecks = 0;
        let possibleHabitChecks = 0;
        const chartData = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateKey = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' });

            let dailyCount = 0;
            habits.forEach(h => {
                if (!h.archived) {
                    possibleHabitChecks++;
                    if (h.history[dateKey]?.completed) {
                        dailyCount++;
                        totalHabitChecks++;
                    }
                }
            });
            chartData.push({ name: dayName, completed: dailyCount });
        }
        const consistency = possibleHabitChecks > 0 ? Math.round((totalHabitChecks / possibleHabitChecks) * 100) : 0;
        return { consistency, chartData };
    }, [habits]);

    // 3. Books Stats
    const bookStats = useMemo(() => {
        const booksRead = books.filter(b => b.status === 'COMPLETED').length;
        const pagesRead = books.reduce((acc, b) => acc + b.current, 0);
        return { booksRead, pagesRead };
    }, [books]);

    // 4. Skills Stats
    const skillStats = useMemo(() => {
        const totalMinutes = skills.reduce((acc, s) => acc + s.currentMinutes, 0);
        const totalHours = (totalMinutes / 60).toFixed(1);
        return { totalHours };
    }, [skills]);

    // 5. Tasks Stats
    const taskStats = useMemo(() => {
        const completedTasks = tasks.filter(t => t.isCompleted).length;
        const totalTasks = tasks.length;
        const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        return { completedTasks, taskRate };
    }, [tasks]);

    // Combined stats for easy access (reference will change if any internal stat changes, but calculations are cheap)
    const stats = useMemo(() => ({
        ...progressStats,
        ...habitStats,
        ...bookStats,
        ...skillStats,
        ...taskStats
    }), [progressStats, habitStats, bookStats, skillStats, taskStats]);

    // --- AUTO SNAPSHOT DETECTION ---
    useEffect(() => {
        if (shouldGenerateSnapshot(reviewData.lastSnapshotWeek, config.startDate)) {
            const previousSnapshot = reviewData.snapshots.length > 0
                ? reviewData.snapshots[reviewData.snapshots.length - 1]
                : null;

            const journalEntryCount = 0; // Would need journal data

            const newSnapshot = generateWeeklySnapshot(
                currentWeek,
                config.startDate,
                habits,
                skills,
                books,
                tasks,
                games,
                journalEntryCount,
                previousSnapshot
            );

            // Auto-confirm first week snapshot without showing modal
            if (reviewData.snapshots.length === 0 && currentWeek === 1) {
                const confirmedSnapshot = { ...newSnapshot, status: 'CONFIRMED' as const };
                const newImprovements = detectImprovements([confirmedSnapshot]);
                addSnapshotWithImprovements(confirmedSnapshot, newImprovements);
            } else {
                // Show confirmation modal for subsequent weeks
                setPendingSnapshot(newSnapshot);
                setShowConfirmModal(true);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentWeek, reviewData.lastSnapshotWeek, config.startDate, reviewData.snapshots.length, addSnapshotWithImprovements]);

    // --- HANDLERS ---
    const handleConfirmSnapshot = useCallback(() => {
        if (!pendingSnapshot) return;

        const confirmedSnapshot = { ...pendingSnapshot, status: 'CONFIRMED' as const };
        const newImprovements = detectImprovements([...reviewData.snapshots, confirmedSnapshot]);
        addSnapshotWithImprovements(confirmedSnapshot, newImprovements);

        setPendingSnapshot(null);
        setShowConfirmModal(false);
    }, [pendingSnapshot, reviewData.snapshots, addSnapshotWithImprovements]);

    const handleSkipSnapshot = useCallback(() => {
        if (!pendingSnapshot) return;

        const skippedSnapshot = { ...pendingSnapshot, status: 'SKIPPED' as const };
        addSnapshot(skippedSnapshot);

        setPendingSnapshot(null);
        setShowConfirmModal(false);
    }, [pendingSnapshot, addSnapshot]);

    const handleEditArea = useCallback((area: 'habits' | 'skills' | 'reading' | 'tasks' | 'journal') => {
        // Navigate to the respective view for editing
        setShowConfirmModal(false);
        // TODO: Could emit an event or callback to navigate to the specific view
        alert(`Navegue para a sessão de ${area} no menu lateral para editar os dados.`);
    }, []);

    const handleToggleImprovement = useCallback((id: string) => {
        toggleImprovementAddressed(id);
    }, [toggleImprovementAddressed]);

    const handleGenerateFinalSummary = useCallback(() => {
        if (reviewData.snapshots.length === 0) return;

        const summary = generateFinalSummary(reviewData.snapshots, reviewData.improvements);
        setFinalSummary(summary);
    }, [reviewData.snapshots, reviewData.improvements, setFinalSummary]);


    // Find best week
    const bestWeek = useMemo(() => {
        if (reviewData.snapshots.length === 0) return 1;

        let best = 1;
        let bestScore = 0;
        reviewData.snapshots.forEach(s => {
            const score = s.evolution?.overallScore || 0;
            if (score > bestScore) {
                bestScore = score;
                best = s.weekNumber;
            }
        });
        return best;
    }, [reviewData.snapshots]);

    // --- TABS ---
    const tabs: { id: TabType; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
        { id: 'overview', label: 'Visão Geral', icon: <LayoutGrid size={16} /> },
        { id: 'weeks', label: 'Semanas', icon: <Clock size={16} /> },
        { id: 'evolution', label: 'Evolução', icon: <Activity size={16} /> },
        { id: 'final', label: 'Resumo Final', icon: <Trophy size={16} />, disabled: !journeyComplete && reviewData.snapshots.length < 5 }
    ];

    return (
        <div className="pb-20 animate-in fade-in duration-700 space-y-6">
            {/* Snapshot Confirmation Modal */}
            {showConfirmModal && pendingSnapshot && (
                <React.Suspense fallback={null}>
                    <SnapshotConfirmationModal
                        snapshot={pendingSnapshot}
                        onConfirm={handleConfirmSnapshot}
                        onSkip={handleSkipSnapshot}
                        onClose={() => setShowConfirmModal(false)}
                        onEdit={handleEditArea}
                    />
                </React.Suspense>
            )}

            {/* TABS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => !tab.disabled && setActiveTab(tab.id)}
                        disabled={tab.disabled}
                        className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all
                            ${activeTab === tab.id
                                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                                : tab.disabled
                                    ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }
                        `}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.id === 'weeks' && reviewData.snapshots.length > 0 && (
                            <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px]">{reviewData.snapshots.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'overview' && (
                <>
                    {/* HERO: JOURNEY STATUS */}
                    <div className="relative bg-slate-800 rounded-3xl p-8 border border-slate-700 overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div>
                                <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-widest text-sm mb-2">
                                    <Calendar size={16} /> Projeto 67 Dias
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
                                    Dia {Math.min(67, stats.currentDay)}
                                </h2>
                                <p className="text-slate-400 max-w-md">
                                    "A excelência não é um ato, mas um hábito." Você está construindo a melhor versão de si mesmo.
                                </p>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="text-sm text-slate-500">Semana {currentWeek}/10</span>
                                    {reviewData.snapshots.length > 0 && (
                                        <span className="px-2 py-0.5 bg-teal-500/20 text-teal-400 text-xs rounded-full">
                                            {reviewData.snapshots.length} snapshots
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Circular Progress */}
                            <div className="relative w-40 h-40">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle className="text-slate-900 stroke-current" strokeWidth="10" cx="50" cy="50" r="40" fill="transparent"></circle>
                                    <circle
                                        className="text-cyan-500 stroke-current transition-all duration-1000 ease-out"
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                        cx="50" cy="50" r="40"
                                        fill="transparent"
                                        strokeDasharray="251.2"
                                        strokeDashoffset={251.2 - (251.2 * stats.journeyProgress) / 100}
                                    ></circle>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-white">{stats.journeyProgress}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DAILY OFFENSIVE PROGRESS */}
                    <div className="mb-6">
                        <DailyOffensiveProgress />
                    </div>

                    {/* PILLARS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg hover:border-orange-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                    <Flame size={24} />
                                </div>
                                <span className="text-2xl font-bold text-white">{stats.consistency}%</span>
                            </div>
                            <h3 className="text-slate-300 font-medium">Consistência</h3>
                            <p className="text-xs text-slate-500">Média de hábitos / 7 dias</p>
                        </div>

                        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg hover:border-yellow-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                                    <BookOpen size={24} />
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-white block">{stats.booksRead}</span>
                                    <span className="text-xs text-slate-400">{stats.pagesRead} págs</span>
                                </div>
                            </div>
                            <h3 className="text-slate-300 font-medium">Intelecto</h3>
                            <p className="text-xs text-slate-500">Livros finalizados</p>
                        </div>

                        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg hover:border-emerald-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                    <GraduationCap size={24} />
                                </div>
                                <span className="text-2xl font-bold text-white">{stats.totalHours}h</span>
                            </div>
                            <h3 className="text-slate-300 font-medium">Habilidade</h3>
                            <p className="text-xs text-slate-500">Horas de estudo focado</p>
                        </div>

                        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg hover:border-blue-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    <CheckCircle2 size={24} />
                                </div>
                                <span className="text-2xl font-bold text-white">{stats.completedTasks}</span>
                            </div>
                            <h3 className="text-slate-300 font-medium">Execução</h3>
                            <p className="text-xs text-slate-500">Tarefas concluídas</p>
                        </div>
                    </div>

                    {/* CHARTS SECTION */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Mood Evolution Chart */}
                            <React.Suspense fallback={<div className="h-[250px] bg-slate-800 rounded-2xl animate-pulse" />}>
                                <MoodEvolutionChart dayCount={30} />
                            </React.Suspense>

                            <React.Suspense fallback={<div className="h-[300px] bg-slate-800 rounded-2xl animate-pulse" />}>
                                <HabitWeeklyChart chartData={stats.chartData} />
                            </React.Suspense>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                            <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(79,70,229,0.5)] border-4 border-indigo-400">
                                <Award size={48} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">Nível {Math.floor(stats.currentDay / 7) + 1}</h3>
                            <p className="text-indigo-300 text-sm mb-4 font-medium">Explorador Disciplinado</p>
                            <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
                                <div className="bg-indigo-500 h-full" style={{ width: `${(stats.currentDay % 7) * 14.28}%` }}></div>
                            </div>
                            <p className="text-xs text-slate-500">Próximo nível em {7 - (stats.currentDay % 7)} dias</p>
                        </div>
                    </div>

                    {/* HABITS & TASKS SECTION */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <HabitsProgressSection habits={habits} />
                        <TasksProgressSection tasks={tasks} />
                    </div>

                    {/* MOTIVATIONAL FOOTER */}
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
                        <BrainCircuit size={32} className="mx-auto text-slate-600 mb-3" />
                        <p className="text-slate-400 italic">
                            "Não importa o quão devagar você vá, desde que você não pare."
                        </p>
                    </div>
                </>
            )}

            {activeTab === 'weeks' && (
                <div className="space-y-6">
                    <React.Suspense fallback={<TabLoading />}>
                        {/* Timeline */}
                        <WeeklyTimeline
                            snapshots={reviewData.snapshots}
                            currentWeek={currentWeek}
                            selectedWeek={selectedWeek}
                            bestWeek={bestWeek}
                            onSelectWeek={setSelectedWeek}
                        />

                        {/* Weekly Cards Grid */}
                        {reviewData.snapshots.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {reviewData.snapshots.map(snapshot => (
                                    <WeeklyReviewCard
                                        key={snapshot.id}
                                        snapshot={snapshot}
                                        isCurrentWeek={snapshot.weekNumber === currentWeek}
                                        isBestWeek={snapshot.weekNumber === bestWeek}
                                        onClick={() => setSelectedWeek(snapshot.weekNumber)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-800 rounded-2xl p-12 border border-slate-700 text-center">
                                <Clock size={48} className="mx-auto text-slate-600 mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2">Nenhum Snapshot Ainda</h3>
                                <p className="text-slate-400 max-w-md mx-auto">
                                    Os snapshots semanais serão gerados automaticamente a cada 7 dias para registrar sua evolução.
                                </p>
                            </div>
                        )}
                    </React.Suspense>

                    {/* Manual Snapshot Trigger for Testing */}
                    {!pendingSnapshot && currentWeek > reviewData.lastSnapshotWeek && (
                        <button
                            onClick={() => {
                                const previousSnapshot = reviewData.snapshots.length > 0
                                    ? reviewData.snapshots[reviewData.snapshots.length - 1]
                                    : null;

                                const newSnapshot = generateWeeklySnapshot(
                                    currentWeek,
                                    config.startDate,
                                    habits,
                                    skills,
                                    books,
                                    tasks,
                                    games,
                                    0,
                                    previousSnapshot
                                );

                                setPendingSnapshot(newSnapshot);
                                setShowConfirmModal(true);
                            }}
                            className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Camera size={18} />
                            Gerar Snapshot da Semana {currentWeek}
                        </button>
                    )}
                </div>
            )}

            {activeTab === 'evolution' && (
                <div className="space-y-6">
                    {/* Evolution Chart */}
                    <React.Suspense fallback={<TabLoading />}>
                        <EvolutionChart snapshots={reviewData.snapshots} />

                        {/* Improvements List */}
                        <ImprovementsList
                            improvements={reviewData.improvements}
                            onToggleAddressed={handleToggleImprovement}
                        />
                    </React.Suspense>
                </div>
            )}

            {activeTab === 'final' && (
                <div>
                    <React.Suspense fallback={<TabLoading />}>
                        {reviewData.finalSummary ? (
                            <FinalJourneySummaryComponent
                                summary={reviewData.finalSummary}
                                onGenerateAIReflection={() => {
                                    // TODO: Integrate with Gemini AI
                                    console.log('Generate AI reflection');
                                }}
                            />
                        ) : (
                            <div className="bg-slate-800 rounded-2xl p-12 border border-slate-700 text-center">
                                <Trophy size={64} className="mx-auto text-amber-500/50 mb-6" />
                                <h3 className="text-2xl font-bold text-white mb-3">Resumo Final</h3>
                                <p className="text-slate-400 max-w-md mx-auto mb-6">
                                    {journeyComplete
                                        ? 'Parabéns! Você completou os 67 dias. Gere seu resumo final da jornada.'
                                        : `O resumo final estará disponível após completar a jornada de 67 dias. Você está no dia ${currentDay}.`
                                    }
                                </p>
                                {(journeyComplete || reviewData.snapshots.length >= 5) && (
                                    <button
                                        onClick={handleGenerateFinalSummary}
                                        className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-bold flex items-center gap-2 mx-auto transition-colors hover:scale-105"
                                    >
                                        <Sparkles size={18} />
                                        Gerar Resumo Final
                                    </button>
                                )}
                            </div>
                        )}
                    </React.Suspense>
                </div>
            )}
        </div>
    );
};

export default ProgressView;
