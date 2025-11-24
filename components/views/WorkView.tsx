import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Target, Clock, Coffee, Zap,
  TrendingUp, AlertTriangle, CheckCircle2,
  ArrowUp, ArrowDown, Timer, Trophy, History, Play, Pause, RotateCcw, Save, X, Circle
} from 'lucide-react';
import { db, auth } from '../../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useStorage } from '../../hooks/useStorage';

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

interface MetTargetSession {
  id: string;
  date: string;
  ankiCount: number;
  ncmCount: number;
  durationSeconds: number;
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

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Get start of week (Monday) for a given date
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

// Check if two dates are in the same week
const isSameWeek = (date1: Date, date2: Date): boolean => {
  const week1Start = getWeekStart(date1);
  const week2Start = getWeekStart(date2);
  return week1Start.getTime() === week2Start.getTime();
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
  }, [STORAGE_KEY]);

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
  onMetTargetClick: () => void;
}> = ({ currentCount, goal, progressPercent, onUpdate, status, minutesRemaining, onMetTargetClick }) => (
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
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-slate-400 text-sm font-medium flex items-center gap-2">
              <CheckCircle2 size={16} /> Progresso Real
            </h2>
            <button
              onClick={onMetTargetClick}
              className="text-xs bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white px-3 py-1 rounded-full font-bold shadow-lg shadow-amber-900/20 flex items-center gap-1 transition-all hover:scale-105"
            >
              <Trophy size={12} /> Bati a Meta
            </button>
          </div>
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

// --- MET TARGET MODAL ---

const MetTargetModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  history: MetTargetSession[];
  onSaveSession: (session: MetTargetSession) => void;
}> = ({ isOpen, onClose, history, onSaveSession }) => {
  const [ankiCount, setAnkiCount] = useState(0);
  const [ncmCount, setNcmCount] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'SESSION' | 'HISTORY'>('SESSION');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate weekly points
  const weeklyPoints = useMemo(() => {
    const now = new Date();
    return history
      .filter(session => isSameWeek(new Date(session.date), now))
      .reduce((sum, session) => sum + session.ankiCount + session.ncmCount, 0);
  }, [history]);

  const WEEKLY_GOAL = 125;
  const ULTRA_WEEKLY_GOAL = 250;
  const hasMetWeeklyGoal = weeklyPoints >= WEEKLY_GOAL;
  const hasMetUltraGoal = weeklyPoints >= ULTRA_WEEKLY_GOAL;
  const isInputLocked = hasMetUltraGoal;

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleSave = () => {
    const newSession: MetTargetSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ankiCount,
      ncmCount,
      durationSeconds: timerSeconds
    };
    onSaveSession(newSession);
    // Reset
    setAnkiCount(0);
    setNcmCount(0);
    setTimerSeconds(0);
    setIsRunning(false);
    setActiveTab('HISTORY');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-700 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <Trophy className="text-yellow-500" /> Bati a Meta
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('SESSION')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'SESSION' ? 'bg-slate-800 text-yellow-500 border-b-2 border-yellow-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Sessão Atual
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'HISTORY' ? 'bg-slate-800 text-yellow-500 border-b-2 border-yellow-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Histórico
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {activeTab === 'SESSION' ? (
            <div className="space-y-8">
              {/* Timer */}
              <div className="flex flex-col items-center justify-center py-6 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-6xl font-mono font-bold text-slate-200 mb-4 tracking-wider">
                  {formatDuration(timerSeconds)}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    className={`px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all ${isRunning ? 'bg-slate-800 text-red-400 hover:bg-slate-700' : 'bg-yellow-600 text-white hover:bg-yellow-500'}`}
                  >
                    {isRunning ? <><Pause size={18} /> Pausar</> : <><Play size={18} /> Iniciar</>}
                  </button>
                  <button
                    onClick={() => { setIsRunning(false); setTimerSeconds(0); }}
                    className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>
              </div>

              {/* Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Anki */}
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-col items-center">
                  <h4 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-3">Anki (Meta: 15)</h4>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setAnkiCount(Math.max(0, ankiCount - 1))}
                      disabled={isInputLocked}
                      className={`p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors ${isInputLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <ArrowDown size={20} />
                    </button>
                    <span className={`text-4xl font-bold ${ankiCount >= 15 ? 'text-green-400' : 'text-white'}`}>{ankiCount}</span>
                    <button
                      onClick={() => setAnkiCount(ankiCount + 1)}
                      disabled={isInputLocked}
                      className={`p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors ${isInputLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <ArrowUp size={20} />
                    </button>
                  </div>
                  {isInputLocked && (
                    <p className="text-xs text-amber-400 mt-2 text-center">Ultra meta atingida!</p>
                  )}
                </div>

                {/* NCM */}
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-col items-center">
                  <h4 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-3">NCM (Meta: 20)</h4>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setNcmCount(Math.max(0, ncmCount - 1))}
                      disabled={isInputLocked}
                      className={`p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors ${isInputLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <ArrowDown size={20} />
                    </button>
                    <span className={`text-4xl font-bold ${ncmCount >= 20 ? 'text-green-400' : 'text-white'}`}>{ncmCount}</span>
                    <button
                      onClick={() => setNcmCount(ncmCount + 1)}
                      disabled={isInputLocked}
                      className={`p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors ${isInputLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <ArrowUp size={20} />
                    </button>
                  </div>
                  {isInputLocked && (
                    <p className="text-xs text-amber-400 mt-2 text-center">Ultra meta atingida!</p>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isInputLocked}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${isInputLocked
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white shadow-amber-900/20 hover:scale-[1.02]'
                  }`}
              >
                <Save size={20} />
                {isInputLocked ? 'Ultra Meta Completa 🏆' : 'Salvar Sessão Extra'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Weekly Progress Bar */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-slate-200 font-bold flex items-center gap-2">
                    <TrendingUp size={18} className="text-cyan-500" />
                    Progresso Semanal
                  </h4>
                  <span className="text-xs text-slate-500">
                    {new Date(getWeekStart(new Date())).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - Agora
                  </span>
                </div>

                {/* Progress Bar Container */}
                <div className="relative h-8 bg-slate-950 rounded-full overflow-hidden border border-slate-700 mb-3">
                  {/* Goal Markers */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-green-500/50 z-10"
                    style={{ left: `${(WEEKLY_GOAL / ULTRA_WEEKLY_GOAL) * 100}%` }}
                    title="Meta Normal (125 pts)"
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-500/50 z-10"
                    style={{ left: '100%' }}
                    title="Ultra Meta (250 pts)"
                  />

                  {/* Progress Fill */}
                  <div
                    className={`h-full transition-all duration-500 ${hasMetUltraGoal
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600'
                      : hasMetWeeklyGoal
                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                      }`}
                    style={{ width: `${Math.min(100, (weeklyPoints / ULTRA_WEEKLY_GOAL) * 100)}%` }}
                  />

                  {/* Points Label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-sm drop-shadow-lg">
                      {weeklyPoints} / {ULTRA_WEEKLY_GOAL} pts
                    </span>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full border ${hasMetWeeklyGoal
                    ? 'bg-green-500/10 text-green-400 border-green-500/30'
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>
                    {hasMetWeeklyGoal ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                    Meta (125 pts)
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full border ${hasMetUltraGoal
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>
                    {hasMetUltraGoal ? <Trophy size={12} /> : <Target size={12} />}
                    Ultra Meta (250 pts)
                  </div>
                  {!hasMetWeeklyGoal && (
                    <span className="text-slate-500 ml-auto">
                      Faltam {WEEKLY_GOAL - weeklyPoints} pts para meta
                    </span>
                  )}
                  {hasMetWeeklyGoal && !hasMetUltraGoal && (
                    <span className="text-amber-400 ml-auto">
                      Faltam {ULTRA_WEEKLY_GOAL - weeklyPoints} pts para ultra meta!
                    </span>
                  )}
                </div>
              </div>

              {/* History List */}
              <div className="space-y-3">
                {history.length === 0 ? (
                  <div className="text-center text-slate-500 py-10">Nenhuma sessão extra registrada.</div>
                ) : (
                  history.slice().reverse().map((session) => {
                    const margin = (session.ankiCount + session.ncmCount) - (15 + 20);
                    return (
                      <div key={session.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div>
                          <div className="text-slate-300 font-medium text-sm">
                            {new Date(session.date).toLocaleDateString('pt-BR')} <span className="text-slate-500 text-xs">• {formatDuration(session.durationSeconds)}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Anki: {session.ankiCount} | NCM: {session.ncmCount}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-lg font-bold text-sm ${margin >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {margin > 0 ? '+' : ''}{margin}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN VIEW COMPONENT ---

const WorkView: React.FC = () => {
  // Persistence Hook
  const { loadData, saveData, saveError } = useWorkDataPersistence();
  const [metTargetHistory, setMetTargetHistory] = useStorage<MetTargetSession[]>('p67_work_met_target_history', []);

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
  const [isMetTargetModalOpen, setIsMetTargetModalOpen] = useState(false);

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
        onMetTargetClick={() => setIsMetTargetModalOpen(true)}
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

      {/* MODALS */}
      <MetTargetModal
        isOpen={isMetTargetModalOpen}
        onClose={() => setIsMetTargetModalOpen(false)}
        history={metTargetHistory}
        onSaveSession={(session) => setMetTargetHistory([...metTargetHistory, session])}
      />
    </div>
  );
};

export default WorkView;