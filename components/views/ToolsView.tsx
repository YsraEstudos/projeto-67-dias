
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
   Calculator, Ruler, Banknote, RefreshCw, ArrowRightLeft,
   TrendingUp, FileText, MousePointerClick, RotateCcw, Minus, Plus,
   AlignLeft, Type, Hash, Clock, Pilcrow, Timer, Play, Pause, Flag,
   AlarmClock, StopCircle, Coffee
} from 'lucide-react';
import { GlobalTimerState } from '../types';
import { useStorage } from '../../hooks/useStorage';

type ToolType = 'calc' | 'convert' | 'currency' | 'text' | 'clicker' | 'time';

// --- HELPERS & HOOKS ---

/**
 * Safely evaluates a mathematical expression.
 */
const safeCalculate = (expression: string): string => {
   try {
      if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
         return 'Erro';
      }
      // eslint-disable-next-line no-new-func
      return new Function('return ' + expression)().toString();
   } catch {
      return 'Erro';
   }
};

const formatTimeDisplay = (ms: number) => {
   const totalSeconds = Math.floor(ms / 1000);
   const hours = Math.floor(totalSeconds / 3600);
   const minutes = Math.floor((totalSeconds % 3600) / 60);
   const seconds = totalSeconds % 60;
   // const milliseconds = Math.floor((ms % 1000) / 10);

   const pad = (n: number) => n.toString().padStart(2, '0');

   if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
   return `${pad(minutes)}:${pad(seconds)}`;
};

const formatStopwatch = (ms: number) => {
   const totalSeconds = Math.floor(ms / 1000);
   const minutes = Math.floor(totalSeconds / 60);
   const seconds = totalSeconds % 60;
   const centiseconds = Math.floor((ms % 1000) / 10);

   const pad = (n: number) => n.toString().padStart(2, '0');
   return (
      <div className="font-mono flex items-baseline justify-center gap-1">
         <span className="text-6xl font-bold text-white">{pad(minutes)}:{pad(seconds)}</span>
         <span className="text-3xl font-medium text-slate-500">.{pad(centiseconds)}</span>
      </div>
   );
};

const useCurrencyRates = (fromCur: string, toCur: string, amount: string) => {
   const [result, setResult] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);
   const [lastUpdate, setLastUpdate] = useState<string>('');

   const fetchRates = useCallback(async () => {
      if (!amount || isNaN(parseFloat(amount))) return;

      setLoading(true);
      try {
         const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL');
         const data = await response.json();

         const getBRLValue = (code: string): number => {
            if (code === 'BRL') return 1;
            const key = `${code}BRL`;
            return parseFloat(data[key]?.bid || '0');
         };

         const fromRate = getBRLValue(fromCur);
         const toRate = getBRLValue(toCur);

         if (fromRate && toRate) {
            const val = parseFloat(amount);
            const finalValue = (val * fromRate) / toRate;
            const isCrypto = toCur === 'BTC' || toCur === 'ETH';
            const decimals = isCrypto ? 8 : 2;
            setResult(finalValue.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
            setLastUpdate(new Date().toLocaleTimeString());
         }
      } catch (error) {
         console.error(error);
         setResult('Erro API');
      } finally {
         setLoading(false);
      }
   }, [fromCur, toCur, amount]);

   return { result, loading, lastUpdate, fetchRates };
};

const TOOLS_MENU = [
   { id: 'time' as ToolType, icon: Clock, label: 'Relógio/Timer' },
   { id: 'calc' as ToolType, icon: Calculator, label: 'Calculadora' },
   { id: 'convert' as ToolType, icon: Ruler, label: 'Conversor' },
   { id: 'currency' as ToolType, icon: Banknote, label: 'Cotações' },
   { id: 'text' as ToolType, icon: FileText, label: 'Analisador Texto' },
   { id: 'clicker' as ToolType, icon: MousePointerClick, label: 'Contador' },
];

const CURRENCIES = [
   { code: 'BRL', name: 'Real Brasileiro', icon: '🇧🇷' },
   { code: 'USD', name: 'Dólar Americano', icon: '🇺🇸' },
   { code: 'EUR', name: 'Euro', icon: '🇪🇺' },
   { code: 'BTC', name: 'Bitcoin', icon: '₿' },
   { code: 'ETH', name: 'Ethereum', icon: 'Ξ' }
];

// --- MAIN COMPONENT ---

const ToolsView: React.FC = () => {
   const [activeTool, setActiveTool] = useState<ToolType>('time');

   // Timer Global State
   const [timerState, setTimerState] = useStorage<GlobalTimerState>('p67_tool_timer', {
      mode: 'TIMER',
      status: 'IDLE',
      startTime: null,
      endTime: null,
      accumulated: 0,
      totalDuration: 25 * 60 * 1000, // Default 25m
      label: 'Pomodoro'
   });

   // Local display state for Timer/Stopwatch (updated via interval)
   const [displayTime, setDisplayTime] = useState(0);
   const [timerInput, setTimerInput] = useState(25); // Minutes

   // Calculator State
   const [calcDisplay, setCalcDisplay] = useState('');

   // Conversion State
   const [weightInput, setWeightInput] = useState('');
   const [weightResult, setWeightResult] = useState<string | null>(null);

   // Currency State
   const [amount, setAmount] = useState('1');
   const [fromCur, setFromCur] = useState('USD');
   const [toCur, setToCur] = useState('BRL');
   const { result: exchangeResult, loading: loadingRates, lastUpdate, fetchRates } = useCurrencyRates(fromCur, toCur, amount);

   // Text Analyzer State
   const [textInput, setTextInput] = useState('');

   // Clicker State
   const [count, setCount] = useState(0);

   // --- TIMER LOGIC ---

   useEffect(() => {
      let interval: ReturnType<typeof setInterval>;

      const update = () => {
         const now = Date.now();

         if (timerState.status === 'IDLE') {
            if (timerState.mode === 'TIMER') setDisplayTime(timerState.totalDuration);
            else setDisplayTime(0);
            return;
         }

         if (timerState.status === 'PAUSED') {
            if (timerState.mode === 'TIMER') {
               // On timer, accumulated is how much was remaining
               setDisplayTime(timerState.accumulated);
            } else {
               setDisplayTime(timerState.accumulated);
            }
            return;
         }

         if (timerState.status === 'RUNNING') {
            if (timerState.mode === 'TIMER' && timerState.endTime) {
               const remaining = Math.max(0, timerState.endTime - now);
               setDisplayTime(remaining);
               if (remaining === 0) {
                  setTimerState(prev => ({ ...prev, status: 'FINISHED' }));
                  new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(() => { });
               }
            } else if (timerState.mode === 'STOPWATCH' && timerState.startTime) {
               const elapsed = now - timerState.startTime + timerState.accumulated;
               setDisplayTime(elapsed);
            }
         }
      };

      // Run immediately and then interval
      update();
      interval = setInterval(update, 50);

      return () => clearInterval(interval);
   }, [timerState, setTimerState]);

   const toggleTimer = () => {
      const now = Date.now();

      if (timerState.status === 'IDLE' || timerState.status === 'FINISHED') {
         // START
         if (timerState.mode === 'TIMER') {
            setTimerState(prev => ({
               ...prev,
               status: 'RUNNING',
               endTime: now + prev.totalDuration,
               accumulated: 0
            }));
         } else {
            setTimerState(prev => ({
               ...prev,
               status: 'RUNNING',
               startTime: now,
               accumulated: 0
            }));
         }
      } else if (timerState.status === 'RUNNING') {
         // PAUSE
         if (timerState.mode === 'TIMER') {
            const remaining = Math.max(0, (timerState.endTime || now) - now);
            setTimerState(prev => ({
               ...prev,
               status: 'PAUSED',
               accumulated: remaining
            }));
         } else {
            const elapsed = now - (timerState.startTime || now);
            setTimerState(prev => ({
               ...prev,
               status: 'PAUSED',
               accumulated: prev.accumulated + elapsed
            }));
         }
      } else if (timerState.status === 'PAUSED') {
         // RESUME
         if (timerState.mode === 'TIMER') {
            setTimerState(prev => ({
               ...prev,
               status: 'RUNNING',
               endTime: now + prev.accumulated
            }));
         } else {
            setTimerState(prev => ({
               ...prev,
               status: 'RUNNING',
               startTime: now
            }));
         }
      }
   };

   const resetTimer = () => {
      setTimerState(prev => ({
         ...prev,
         status: 'IDLE',
         startTime: null,
         endTime: null,
         accumulated: 0
      }));
   };

   const setPreset = (minutes: number, label: string) => {
      setTimerState({
         mode: 'TIMER',
         status: 'IDLE',
         startTime: null,
         endTime: null,
         accumulated: 0,
         totalDuration: minutes * 60 * 1000,
         label
      });
   };

   const switchMode = (mode: 'STOPWATCH' | 'TIMER') => {
      setTimerState({
         mode,
         status: 'IDLE',
         startTime: null,
         endTime: null,
         accumulated: 0,
         totalDuration: timerState.totalDuration,
         label: mode === 'TIMER' ? 'Temporizador' : 'Cronômetro'
      });
   };

   // --- OTHER HANDLERS ---

   const handleCalcInput = (val: string) => {
      if (val === 'C') {
         setCalcDisplay('');
      } else if (val === '=') {
         setCalcDisplay(prev => safeCalculate(prev));
      } else {
         setCalcDisplay(prev => prev + val);
      }
   };

   const handleWeightConvert = () => {
      const val = parseFloat(weightInput);
      if (!isNaN(val)) {
         setWeightResult(`${val} kg = ${(val * 2.20462).toFixed(2)} lbs`);
      }
   };

   const handleSwapCurrencies = () => {
      setFromCur(toCur);
      setToCur(fromCur);
   };

   const textStats = useMemo(() => {
      const trimmed = textInput.trim();
      if (!trimmed) return { words: 0, chars: 0, charsNoSpace: 0, lines: 0, paragraphs: 0, tokens: 0, readTime: 0 };

      const words = trimmed.split(/\s+/).length;
      const chars = textInput.length;
      const charsNoSpace = textInput.replace(/\s/g, '').length;
      const lines = textInput.split(/\n/).length;
      const paragraphs = textInput.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
      const tokens = Math.ceil(chars / 4);
      const readTime = Math.ceil(words / 225);

      return { words, chars, charsNoSpace, lines, paragraphs, tokens, readTime };
   }, [textInput]);

   useEffect(() => {
      if (activeTool === 'currency' && !exchangeResult) {
         fetchRates();
      }
   }, [activeTool, exchangeResult, fetchRates]);

   return (
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 animate-in fade-in duration-500">
         {/* Sidebar */}
         <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
            {TOOLS_MENU.map((item) => (
               <button
                  key={item.id}
                  onClick={() => setActiveTool(item.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all min-w-[160px] ${activeTool === item.id
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                     }`}
               >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
               </button>
            ))}
         </div>

         {/* Content Area */}
         <div className="bg-slate-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-slate-700 shadow-xl min-h-[400px] flex flex-col justify-center relative">

            {/* --- TIME / CLOCK UI --- */}
            {activeTool === 'time' && (
               <div className="w-full max-w-md mx-auto animate-in zoom-in-95 duration-300">
                  {/* Header / Toggle */}
                  <div className="flex justify-center mb-8">
                     <div className="bg-slate-900 p-1 rounded-xl border border-slate-700 flex">
                        <button
                           onClick={() => switchMode('TIMER')}
                           className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${timerState.mode === 'TIMER' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                           <Timer size={16} /> Temporizador
                        </button>
                        <button
                           onClick={() => switchMode('STOPWATCH')}
                           className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${timerState.mode === 'STOPWATCH' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                           <AlarmClock size={16} /> Cronômetro
                        </button>
                     </div>
                  </div>

                  {/* Main Display */}
                  <div className="text-center mb-10">
                     <div className="relative w-64 h-64 mx-auto mb-6 flex items-center justify-center bg-slate-900 rounded-full border-8 border-slate-800 shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)]">
                        {/* Progress Ring for Timer */}
                        {timerState.mode === 'TIMER' && (
                           <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                              <circle
                                 cx="50" cy="50" r="44"
                                 fill="transparent" stroke="#1e293b" strokeWidth="4"
                              />
                              <circle
                                 cx="50" cy="50" r="44"
                                 fill="transparent" stroke={timerState.status === 'FINISHED' ? '#ef4444' : '#4f46e5'} strokeWidth="4"
                                 strokeDasharray="276"
                                 strokeDashoffset={276 - (276 * (displayTime / (timerState.totalDuration || 1)))}
                                 strokeLinecap="round"
                                 className="transition-all duration-500 ease-linear"
                              />
                           </svg>
                        )}

                        <div className="z-10 flex flex-col items-center">
                           {timerState.mode === 'STOPWATCH' ? (
                              formatStopwatch(displayTime)
                           ) : (
                              <>
                                 <span className={`text-6xl font-mono font-bold tracking-tighter ${timerState.status === 'FINISHED' ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                    {formatTimeDisplay(displayTime)}
                                 </span>
                                 <span className="text-slate-500 text-sm mt-2 font-medium uppercase tracking-widest">{timerState.label || 'Timer'}</span>
                              </>
                           )}
                        </div>
                     </div>

                     {/* Controls */}
                     <div className="flex items-center justify-center gap-4">
                        <button
                           onClick={toggleTimer}
                           className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 ${timerState.status === 'RUNNING'
                                 ? 'bg-amber-500 text-white hover:bg-amber-600'
                                 : 'bg-indigo-600 text-white hover:bg-indigo-500'
                              }`}
                        >
                           {timerState.status === 'RUNNING' ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>
                        <button
                           onClick={resetTimer}
                           className="w-12 h-12 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-600 transition-all hover:rotate-180 duration-500"
                        >
                           <RotateCcw size={20} />
                        </button>
                     </div>
                  </div>

                  {/* Presets (Timer Only) */}
                  {timerState.mode === 'TIMER' && (
                     <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => setPreset(25, 'Pomodoro')} className="flex flex-col items-center p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-red-500/50 hover:bg-slate-800 transition-colors group">
                           <span className="text-2xl font-bold text-slate-300 group-hover:text-red-400">25</span>
                           <span className="text-[10px] uppercase text-slate-500">Pomodoro</span>
                        </button>
                        <button onClick={() => setPreset(5, 'Pausa Curta')} className="flex flex-col items-center p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-colors group">
                           <span className="text-2xl font-bold text-slate-300 group-hover:text-blue-400">05</span>
                           <span className="text-[10px] uppercase text-slate-500">Pausa</span>
                        </button>
                        <button onClick={() => setPreset(15, 'Pausa Longa')} className="flex flex-col items-center p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800 transition-colors group">
                           <span className="text-2xl font-bold text-slate-300 group-hover:text-emerald-400">15</span>
                           <span className="text-[10px] uppercase text-slate-500">Descanso</span>
                        </button>
                     </div>
                  )}
               </div>
            )}

            {/* --- CALCULATOR UI --- */}
            {activeTool === 'calc' && (
               <div className="w-full max-w-[300px] mx-auto animate-in zoom-in-95 duration-300">
                  <div className="bg-slate-900 p-5 rounded-xl mb-5 text-right text-3xl font-mono text-white min-h-[80px] flex items-center justify-end overflow-x-auto border border-slate-700 shadow-inner">
                     {calcDisplay || '0'}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                     {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', 'C', '0', '=', '+'].map(btn => (
                        <button
                           key={btn}
                           onClick={() => handleCalcInput(btn)}
                           className={`p-4 rounded-xl font-bold text-lg transition-transform active:scale-95 ${btn === '=' ? 'bg-indigo-600 hover:bg-indigo-500 text-white col-span-1 shadow-lg shadow-indigo-900/30' :
                                 btn === 'C' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' :
                                    ['/', '*', '-', '+'].includes(btn) ? 'bg-slate-700 hover:bg-slate-600 text-indigo-300' :
                                       'bg-slate-700/50 hover:bg-slate-600 text-slate-200 border border-slate-600/50'
                              }`}
                        >
                           {btn}
                        </button>
                     ))}
                  </div>
               </div>
            )}

            {/* --- WEIGHT CONVERTER UI --- */}
            {activeTool === 'convert' && (
               <div className="space-y-6 max-w-sm mx-auto animate-in zoom-in-95 duration-300">
                  <h3 className="text-xl font-semibold text-indigo-400 flex items-center gap-2">
                     <Ruler size={20} /> Conversor de Peso
                  </h3>
                  <div className="flex flex-col gap-2">
                     <label className="text-sm text-slate-400 font-medium uppercase tracking-wider">Kilogramas (kg)</label>
                     <input
                        type="number"
                        value={weightInput}
                        onChange={e => setWeightInput(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        placeholder="Digite o valor..."
                     />
                  </div>
                  <button
                     onClick={handleWeightConvert}
                     className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/20"
                  >
                     Converter para Libras
                  </button>
                  {weightResult && (
                     <div className="mt-6 p-6 bg-slate-900/50 rounded-xl text-center border border-indigo-500/30 animate-in zoom-in-95">
                        <span className="text-slate-400 text-sm block mb-1">Resultado</span>
                        <span className="text-2xl font-bold text-indigo-300">{weightResult}</span>
                     </div>
                  )}
               </div>
            )}

            {/* --- CURRENCY CONVERTER UI --- */}
            {activeTool === 'currency' && (
               <div className="space-y-8 max-w-sm mx-auto animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xl font-semibold text-indigo-400 flex items-center gap-2">
                        <TrendingUp size={20} /> Câmbio & Crypto
                     </h3>
                     {lastUpdate && (
                        <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded">
                           Atualizado às {lastUpdate}
                        </span>
                     )}
                  </div>

                  <div className="space-y-4">
                     <div className="flex flex-col gap-2">
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Valor</label>
                        <input
                           type="number"
                           value={amount}
                           onChange={e => setAmount(e.target.value)}
                           className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-xl font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                           placeholder="1.00"
                        />
                     </div>

                     <div className="relative grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
                        <div className="flex flex-col gap-2">
                           <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">De</label>
                           <select
                              value={fromCur}
                              onChange={(e) => setFromCur(e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                           >
                              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.icon} {c.code}</option>)}
                           </select>
                        </div>

                        <button
                           onClick={handleSwapCurrencies}
                           className="p-3 mb-1 rounded-lg bg-slate-800 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all border border-slate-700 hover:border-indigo-500"
                        >
                           <ArrowRightLeft size={18} />
                        </button>

                        <div className="flex flex-col gap-2">
                           <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Para</label>
                           <select
                              value={toCur}
                              onChange={(e) => setToCur(e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                           >
                              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.icon} {c.code}</option>)}
                           </select>
                        </div>
                     </div>
                  </div>

                  <div className="relative mt-6 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl text-center border border-slate-700 shadow-inner min-h-[120px] flex flex-col justify-center">
                     {loadingRates && (
                        <div className="absolute top-2 right-2 animate-spin text-indigo-500">
                           <RefreshCw size={14} />
                        </div>
                     )}

                     <span className="text-slate-500 text-sm mb-2 font-medium">
                        {amount} {CURRENCIES.find(c => c.code === fromCur)?.name} =
                     </span>

                     <div className="text-3xl md:text-4xl font-bold text-indigo-300 tracking-tight break-all">
                        {loadingRates ? '...' : exchangeResult || '---'}
                        <span className="text-lg text-indigo-500/50 ml-2 font-medium">{toCur}</span>
                     </div>
                  </div>

                  <button
                     onClick={fetchRates}
                     className="w-full flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 py-3 rounded-xl font-medium transition-all border border-indigo-500/30 hover:border-indigo-500/50 text-sm"
                  >
                     <RefreshCw size={16} className={loadingRates ? 'animate-spin' : ''} /> Atualizar Cotação
                  </button>
               </div>
            )}

            {/* --- TEXT ANALYZER UI --- */}
            {activeTool === 'text' && (
               <div className="flex flex-col h-full gap-6 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xl font-semibold text-indigo-400 flex items-center gap-2">
                        <FileText size={20} /> Analisador de Texto
                     </h3>
                     <button
                        onClick={() => setTextInput('')}
                        className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded bg-slate-900 hover:bg-slate-700 transition-colors"
                     >
                        Limpar
                     </button>
                  </div>

                  <textarea
                     value={textInput}
                     onChange={e => setTextInput(e.target.value)}
                     className="flex-1 min-h-[200px] bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-slate-200 font-mono text-sm focus:border-indigo-500 focus:outline-none resize-none scrollbar-thin"
                     placeholder="Cole seu texto aqui para analisar..."
                  />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                           <Hash size={12} /> Tokens (Est.)
                        </div>
                        <div className="text-xl font-bold text-indigo-400">{textStats.tokens}</div>
                     </div>
                     <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                           <AlignLeft size={12} /> Palavras
                        </div>
                        <div className="text-xl font-bold text-slate-200">{textStats.words}</div>
                     </div>
                     <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                           <Type size={12} /> Caracteres
                        </div>
                        <div className="text-xl font-bold text-slate-200">{textStats.chars}</div>
                        <div className="text-[10px] text-slate-600">Sem espaços: {textStats.charsNoSpace}</div>
                     </div>
                     <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                           <Clock size={12} /> Tempo Leitura
                        </div>
                        <div className="text-xl font-bold text-green-400">~{textStats.readTime} min</div>
                     </div>
                     <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 col-span-2">
                        <div className="flex items-center gap-4">
                           <div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><AlignLeft size={12} /> Linhas</div>
                              <div className="font-bold text-slate-200">{textStats.lines}</div>
                           </div>
                           <div className="w-px h-8 bg-slate-800"></div>
                           <div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><Pilcrow size={12} /> Parágrafos</div>
                              <div className="font-bold text-slate-200">{textStats.paragraphs}</div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* --- CLICKER COUNTER UI --- */}
            {activeTool === 'clicker' && (
               <div className="flex flex-col items-center justify-center h-full gap-8 animate-in zoom-in-95 duration-300">
                  <h3 className="text-xl font-semibold text-indigo-400 flex items-center gap-2">
                     <MousePointerClick size={20} /> Contador Manual
                  </h3>

                  <div className="w-48 h-48 bg-slate-900 rounded-full border-4 border-slate-700 flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.1)]">
                     <span className="text-7xl font-bold text-white font-mono tracking-tighter">{count}</span>
                  </div>

                  <div className="flex gap-4 items-center">
                     <button
                        onClick={() => setCount(Math.max(0, count - 1))}
                        className="p-4 rounded-xl bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-300 transition-all active:scale-95"
                     >
                        <Minus size={24} />
                     </button>

                     <button
                        onClick={() => setCount(count + 1)}
                        className="p-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95 hover:scale-105"
                     >
                        <Plus size={32} />
                     </button>

                     <button
                        onClick={() => setCount(0)}
                        className="p-4 rounded-xl bg-slate-700 hover:bg-yellow-500/20 hover:text-yellow-400 text-slate-300 transition-all active:scale-95"
                        title="Resetar"
                     >
                        <RotateCcw size={24} />
                     </button>
                  </div>
               </div>
            )}

         </div>
      </div>
   );
};

export default ToolsView;
