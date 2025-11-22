import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Target, Clock, Coffee, Zap,
  TrendingUp, AlertTriangle, CheckCircle2,
  ArrowUp, ArrowDown, Timer
} from 'lucide-react';
import { db, auth } from '../../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// --- TYPES ---
type WorkStatus = 'PRE_BREAK' | 'BREAK' | 'POST_BREAK' | 'FINISHED';
type PaceMode = '10m' | '25m';

interface WorkMetricsInput {
  goal: number;
  startTime: string;
  endTime: string;
  breakTime: string;
  currentCount: number;
  preBreakCount: number;
  paceMode: PaceMode;
}

// --- HELPER FUNCTIONS ---

const getMinutesFromMidnight = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const formatTimeDiff = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

// --- CUSTOM HOOKS ---

/**
 * Handles the business logic for calculating work statistics, pace, and status.
 */
const useWorkMetrics = ({
  goal, startTime, endTime, breakTime, currentCount, preBreakCount, paceMode
}: WorkMetricsInput) => {
  const [now, setNow] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return useMemo(() => {
    const startMins = getMinutesFromMidnight(startTime);
    const endMins = getMinutesFromMidnight(endTime);
    const breakStartMins = getMinutesFromMidnight(breakTime);
    const breakEndMins = breakStartMins + 60; // Assuming 1h break
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // Total Work Duration (excluding 1h break)
    const totalWorkDuration = (endMins - startMins) - 60;

    // Status Determination
    let status: WorkStatus = 'PRE_BREAK';
    if (currentMins >= endMins) status = 'FINISHED';
    else if (currentMins >= breakEndMins) status = 'POST_BREAK';
    else if (currentMins >= breakStartMins) status = 'BREAK';

    // Time Remaining Calculation
    let minutesRemaining = 0;
    if (status !== 'FINISHED') {
      minutesRemaining = Math.max(0, endMins - currentMins);
      // If currently before break end, subtract the remaining break time from work time
      if (currentMins < breakEndMins) {
        const breakMinutesLeft = Math.max(0, breakEndMins - Math.max(currentMins, breakStartMins));
        minutesRemaining -= breakMinutesLeft;
      }
    }

    // Progress
    const progressPercent = Math.min(100, Math.round((currentCount / (goal || 1)) * 100));

    // Break Analysis (Performance before break)
    const expectedPreBreakRatio = (breakStartMins - startMins) / (totalWorkDuration || 1);
    const expectedPreBreakCount = Math.round(goal * expectedPreBreakRatio);
    const breakDiff = preBreakCount - expectedPreBreakCount;
    const breakPerformance = breakDiff >= 0 ? 'positive' : 'negative';

    // Pace Calculation (Required Speed)
    const itemsRemaining = Math.max(0, goal - currentCount);
    const requiredPacePerHour = minutesRemaining > 0 ? (itemsRemaining / minutesRemaining) * 60 : 0;

    const intervalPace = paceMode === '10m'
      ? requiredPacePerHour / 6
      : requiredPacePerHour * (25 / 60);

    return {
      status,
      minutesRemaining,
      progressPercent,
      expectedPreBreakCount,
      breakDiff,
      breakPerformance,
      requiredPacePerHour,
      intervalPace,
      itemsRemaining
    };
  }, [goal, startTime, endTime, breakTime, currentCount, preBreakCount, now, paceMode]);
};

/**
 * Handles persistence of work data to localStorage and Firebase
 */
interface WorkData {
  goal: number;
  startTime: string;
  endTime: string;
  breakTime: string;
  currentCount: number;
  preBreakCount: number;
  paceMode: PaceMode;
  lastUpdated: string;
}

const useWorkDataPersistence = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<boolean>(false);
  const STORAGE_KEY = 'workview_data';

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  // Load data from localStorage and Firebase
  const loadData = useCallback(async (): Promise<Partial<WorkData>> => {
    // First, try localStorage (instant)
    const localData = localStorage.getItem(STORAGE_KEY);
    let data: Partial<WorkData> = {};

    if (localData) {
      try {
        data = JSON.parse(localData);
      } catch (e) {
        console.error('Error parsing localStorage data:', e);
      }
    }

    // If user is authenticated, try Firebase (may have more recent data)
    if (auth.currentUser) {
      try {
        const uid = auth.currentUser.uid;
        const docRef = doc(db, 'users', uid, 'modules', 'work');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const firebaseData = docSnap.data() as WorkData;
          // Use Firebase data if it's more recent
          if (!data.lastUpdated ||
            (firebaseData.lastUpdated && firebaseData.lastUpdated > data.lastUpdated)) {
            data = firebaseData;
          }
        }
      } catch (e) {
        console.error('Error loading from Firebase:', e);
      }
    }

    return data;
  }, [STORAGE_KEY]); // userId dependency removed from callback to avoid recreation, using auth.currentUser directly or ensuring userId is stable enough

  // Save data to localStorage and Firebase
  const saveData = useCallback(async (data: WorkData) => {
    const dataWithTimestamp = {
      ...data,
      lastUpdated: new Date().toISOString()
    };

    setSaveError(false);

    // Always save to localStorage (instant, works offline)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithTimestamp));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
      setSaveError(true);
    }

    // If authenticated, also save to Firebase (syncs across devices)
    if (auth.currentUser) {
      try {
        const uid = auth.currentUser.uid;
        const docRef = doc(db, 'users', uid, 'modules', 'work');
        await setDoc(docRef, dataWithTimestamp);
      } catch (e) {
        console.error('Error saving to Firebase:', e);
        // We don't setSaveError(true) here if localStorage worked, 
        // as the user can still continue working offline.
        // Optionally, we could have a separate "sync error" state.
      }
    }
  }, [STORAGE_KEY]);

  return { loadData, saveData, userId, saveError };
};

// --- SUB-COMPONENTS ---

const ConfigurationHeader: React.FC<{
  goal: number; setGoal: (v: number) => void;
  startTime: string; setStartTime: (v: string) => void;
  endTime: string; setEndTime: (v: string) => void;
  breakTime: string; setBreakTime: (v: string) => void;
  status: WorkStatus;
}> = React.memo(({ goal, setGoal, startTime, setStartTime, endTime, setEndTime, breakTime, setBreakTime, status }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700 backdrop-blur-sm">
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Meta Diária</label>
      <div className="flex items-center gap-2">
        <Target className="text-orange-500" size={18} />
        <input
          type="number"
          value={goal}
          onChange={(e) => setGoal(Number(e.target.value))}
          className="bg-transparent text-xl font-bold text-slate-200 focus:outline-none w-full"
        />
      </div>
    </div>
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Jornada</label>
      <div className="flex items-center gap-2">
        <Clock className="text-blue-500" size={18} />
        <div className="flex items-center gap-1">
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-transparent font-mono text-slate-200 focus:outline-none hover:bg-slate-800 rounded" />
          <span className="text-slate-500">-</span>
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-transparent font-mono text-slate-200 focus:outline-none hover:bg-slate-800 rounded" />
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Início Intervalo</label>
      <div className="flex items-center gap-2">
        <Coffee className="text-amber-600" size={18} />
        <input type="time" value={breakTime} onChange={e => setBreakTime(e.target.value)} className="bg-transparent font-mono text-slate-200 focus:outline-none w-full hover:bg-slate-800 rounded" />
      </div>
    </div>
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Status Atual</label>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status === 'FINISHED' ? 'bg-green-500' : status === 'BREAK' ? 'bg-amber-500' : 'bg-cyan-500 animate-pulse'}`}></div>
        <span className="text-sm font-medium text-slate-300">
          {status === 'PRE_BREAK' && 'Manhã / Pré-Intervalo'}
          {status === 'BREAK' && 'Intervalo'}
          {status === 'POST_BREAK' && 'Tarde / Pós-Intervalo'}
          {status === 'FINISHED' && 'Expediente Encerrado'}
        </span>
      </div>
    </div>
  </div>
));
ConfigurationHeader.displayName = 'ConfigurationHeader';

const MainTracker: React.FC<{
  currentCount: number;
  goal: number;
  progressPercent: number;
  onUpdate: (newCount: number) => void;
  status: WorkStatus;
  minutesRemaining: number;
}> = ({ currentCount, goal, progressPercent, onUpdate, status, minutesRemaining }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Main Tracker */}
    <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-700">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 w-full">
          <h2 className="text-slate-400 text-sm font-medium mb-2 flex items-center gap-2">
            <CheckCircle2 size={16} /> Progresso Real
          </h2>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-6xl font-bold text-white tracking-tight">{currentCount}</span>
            <span className="text-xl text-slate-500">/ {goal}</span>
          </div>

          {/* Quick Add Controls */}
          <div className="flex gap-3">
            <button onClick={() => onUpdate(Math.max(0, currentCount - 1))} className="p-3 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><ArrowDown size={20} /></button>
            <input
              type="number"
              value={currentCount}
              onChange={(e) => onUpdate(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-xl w-24 text-center text-xl font-bold focus:border-orange-500 focus:outline-none"
            />
            <button onClick={() => onUpdate(currentCount + 1)} className="p-3 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><ArrowUp size={20} /></button>
            <button onClick={() => onUpdate(currentCount + 10)} className="px-4 rounded-xl bg-orange-600/20 text-orange-500 hover:bg-orange-600 hover:text-white transition-all font-bold text-sm">+10</button>
          </div>
        </div>

        {/* Circular Progress Indicator */}
        <div className="relative w-40 h-40 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle className="text-slate-900 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
            <circle
              className="text-orange-500 progress-ring__circle stroke-current transition-all duration-1000 ease-out"
              strokeWidth="8"
              strokeLinecap="round"
              cx="50" cy="50" r="40"
              fill="transparent"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
            ></circle>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-200">{progressPercent}%</span>
          </div>
        </div>
      </div>
    </div>

    {/* Time Remaining Card */}
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
      <h3 className="text-slate-400 font-medium flex items-center gap-2 mb-4">
        <Timer size={18} className="text-blue-400" /> Tempo Restante
      </h3>

      {status === 'FINISHED' ? (
        <div className="text-green-400 font-bold text-2xl">Dia Finalizado</div>
      ) : (
        <>
          <div className="text-5xl font-mono font-bold text-slate-100 tracking-tighter mb-2">
            {formatTimeDiff(minutesRemaining)}
          </div>
          <p className="text-xs text-slate-500 max-w-[200px]">
            Descontando intervalo de 1 hora se ainda não realizado.
          </p>
        </>
      )}
    </div>
  </div>
);

// --- MAIN VIEW COMPONENT ---

const WorkView: React.FC = () => {
  // Persistence Hook
  const { loadData, saveData, saveError } = useWorkDataPersistence();

  // Configuration State
  const [goal, setGoal] = useState(300);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [breakTime, setBreakTime] = useState('12:00');

  // Tracking State
  const [currentCount, setCurrentCount] = useState(0);
  const [preBreakCount, setPreBreakCount] = useState(0);

  // UI State
  const [paceMode, setPaceMode] = useState<PaceMode>('10m');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    const initializeData = async () => {
      const savedData = await loadData();

      if (savedData.goal !== undefined) setGoal(savedData.goal);
      if (savedData.startTime) setStartTime(savedData.startTime);
      if (savedData.endTime) setEndTime(savedData.endTime);
      if (savedData.breakTime) setBreakTime(savedData.breakTime);
      if (savedData.currentCount !== undefined) setCurrentCount(savedData.currentCount);
      if (savedData.preBreakCount !== undefined) setPreBreakCount(savedData.preBreakCount);
      if (savedData.paceMode) setPaceMode(savedData.paceMode);

      setIsLoaded(true);
    };

    initializeData();
  }, []);

  // Auto-save whenever data changes (after initial load)
  useEffect(() => {
    if (!isLoaded) return; // Don't save during initial load

    const workData: WorkData = {
      goal,
      startTime,
      endTime,
      breakTime,
      currentCount,
      preBreakCount,
      paceMode,
      lastUpdated: new Date().toISOString()
    };

    // Debounce saves to avoid excessive writes
    setIsSaving(true);
    const timeoutId = setTimeout(async () => {
      await saveData(workData);
      setIsSaving(false);
      // Show "saved" indicator briefly
      setTimeout(() => setIsSaving(false), 1000);
    }, 500); // Save 500ms after last change

    return () => clearTimeout(timeoutId);
  }, [goal, startTime, endTime, breakTime, currentCount, preBreakCount, paceMode, isLoaded]);

  const stats = useWorkMetrics({
    goal, startTime, endTime, breakTime, currentCount, preBreakCount, paceMode
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">

      {/* Auto-save Indicator - Error Only */}
      {saveError && (
        <div className="flex justify-end">
          <div className="text-xs flex items-center gap-2 px-3 py-1.5 rounded-full transition-all bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertTriangle size={12} />
            Erro ao salvar
          </div>
        </div>
      )}

      <ConfigurationHeader
        goal={goal} setGoal={setGoal}
        startTime={startTime} setStartTime={setStartTime}
        endTime={endTime} setEndTime={setEndTime}
        breakTime={breakTime} setBreakTime={setBreakTime}
        status={stats.status}
      />

      <MainTracker
        currentCount={currentCount}
        goal={goal}
        progressPercent={stats.progressPercent}
        onUpdate={setCurrentCount}
        status={stats.status}
        minutesRemaining={stats.minutesRemaining}
      />

      {/* ANALYSIS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Break Analysis */}
        <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-slate-200 font-semibold flex items-center gap-2">
              <Coffee size={20} className="text-amber-500" /> Análise de Intervalo
            </h3>
            <span className="text-xs bg-slate-900 text-slate-400 px-2 py-1 rounded border border-slate-700">1h Duração</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
              <span className="text-sm text-slate-400">Feito Pré-Almoço</span>
              <input
                type="number"
                value={preBreakCount}
                onChange={(e) => setPreBreakCount(Number(e.target.value))}
                placeholder="0"
                className="bg-slate-800 border border-slate-600 rounded w-20 text-right px-2 py-1 text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="text-xs text-slate-500">
                Meta Esperada: <span className="text-slate-300 font-mono">{stats.expectedPreBreakCount}</span>
              </div>
              <div className={`flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full border ${stats.breakPerformance === 'positive' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                {stats.breakDiff > 0 ? '+' : ''}{stats.breakDiff}
                {stats.breakPerformance === 'positive' ? <TrendingUp size={14} /> : <AlertTriangle size={14} />}
              </div>
            </div>

            <p className="text-xs text-slate-500 italic border-t border-slate-700/50 pt-3 mt-2">
              {stats.breakPerformance === 'positive'
                ? "Ótimo ritmo! Você está adiantado em relação à meta para o período da manhã."
                : "Atenção: Você fechou a manhã com déficit. Aumente o ritmo à tarde."}
            </p>
          </div>
        </div>

        {/* Pace Calculator */}
        <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-slate-200 font-semibold flex items-center gap-2">
              <Zap size={20} className="text-yellow-500" /> Ritmo Necessário
            </h3>
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setPaceMode('10m')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${paceMode === '10m' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                10min
              </button>
              <button
                onClick={() => setPaceMode('25m')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${paceMode === '25m' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                25min
              </button>
            </div>
          </div>

          {stats.itemsRemaining <= 0 ? (
            <div className="h-32 flex items-center justify-center text-green-400 font-medium bg-green-500/5 rounded-xl border border-green-500/20">
              Meta atingida! Aproveite o resto do dia.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700/50 flex flex-col justify-center">
                <span className="text-xs text-slate-500 mb-1">Por Hora</span>
                <span className="text-2xl font-bold text-white">{Math.ceil(stats.requiredPacePerHour)}</span>
                <span className="text-[10px] text-slate-600">itens/h</span>
              </div>
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-4 rounded-xl border border-blue-500/50 flex flex-col justify-center shadow-lg">
                <span className="text-xs text-blue-100 mb-1">A cada {paceMode === '10m' ? '10 min' : '25 min'}</span>
                <span className="text-3xl font-bold text-white">{Math.ceil(stats.intervalPace)}</span>
                <span className="text-[10px] text-blue-200">itens para bater a meta</span>
              </div>
            </div>
          )}

          {stats.itemsRemaining > 0 && (
            <div className="mt-4 text-xs text-slate-500 text-center">
              Faltam <strong className="text-slate-300">{stats.itemsRemaining}</strong> itens em {formatTimeDiff(stats.minutesRemaining)}.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default WorkView;