import React, { startTransition, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquareText,
  MoonStar,
  PawPrint,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { generateDailyPlannerPlan } from '../../services/dailyPlannerAI';
import { useDailyPlannerStore } from '../../stores/dailyPlannerStore';
import { DailyPlannerBlock } from '../../types';
import { getTodayISO } from '../../utils/dateUtils';
import {
  buildDailyPlannerTimeSummary,
  createDailyPlannerSession,
  ensureWindDownBlock,
  getCompletedBlockSummaries,
} from '../../utils/dailyPlannerUtils';

const categoryStyles: Record<string, string> = {
  focus: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-300',
  meal: 'border-amber-500/20 bg-amber-500/5 text-amber-300',
  dog: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300',
  admin: 'border-slate-700 bg-slate-800/30 text-slate-300',
  personal: 'border-rose-500/20 bg-rose-500/5 text-rose-300',
  rest: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-300',
  buffer: 'border-orange-500/20 bg-orange-500/5 text-orange-300',
  other: 'border-slate-800 bg-slate-900/50 text-slate-400',
};

const metricConfigs = {
  currentTime: {
    label: 'Agora',
    border: 'border-slate-800/80 hover:border-blue-500/30',
    bg: 'bg-slate-900/20 hover:bg-slate-900/40 hover:shadow-blue-500/5',
    text: 'text-blue-400',
  },
  sleepTime: {
    label: 'Dormir',
    border: 'border-slate-800/80 hover:border-purple-500/30',
    bg: 'bg-slate-900/20 hover:bg-slate-900/40 hover:shadow-purple-500/5',
    text: 'text-purple-400',
  },
  windDownStart: {
    label: 'Preparar para dormir',
    border: 'border-slate-800/80 hover:border-pink-500/30',
    bg: 'bg-slate-900/20 hover:bg-slate-900/40 hover:shadow-pink-500/5',
    text: 'text-pink-400',
  },
  availableMinutes: {
    label: 'Minutos úteis',
    border: 'border-slate-800/80 hover:border-cyan-500/30',
    bg: 'bg-slate-900/20 hover:bg-slate-900/40 hover:shadow-cyan-500/5',
    text: 'text-cyan-400',
  },
  reservedMinutes: {
    label: 'Reservado',
    border: 'border-slate-800/80 hover:border-slate-600/30',
    bg: 'bg-slate-900/20 hover:bg-slate-900/40 hover:shadow-slate-500/5',
    text: 'text-slate-400',
  },
  freeBufferMinutes: {
    label: 'Folga',
    border: 'border-slate-800/80 hover:border-emerald-500/30',
    bg: 'bg-slate-900/20 hover:bg-slate-900/40 hover:shadow-emerald-500/5',
    text: 'text-emerald-400',
  },
} as const;

const metricLabels = [
  { key: 'currentTime' },
  { key: 'sleepTime' },
  { key: 'windDownStart' },
  { key: 'availableMinutes' },
  { key: 'reservedMinutes' },
  { key: 'freeBufferMinutes' },
] as const;

const formatMinutes = (minutes: number): string => {
  if (minutes <= 0) return '0 min';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

const renderMetricValue = (key: (typeof metricLabels)[number]['key'], value: string | number): string =>
  typeof value === 'number' ? formatMinutes(value) : value;

const blockTitle = (block: DailyPlannerBlock) =>
  `${block.startTime}-${block.endTime} ${block.title}`;

const isValidPlannerTime = (value: string): boolean =>
  /^\d{2}:\d{2}$/.test(value) &&
  Number.parseInt(value.slice(0, 2), 10) >= 0 &&
  Number.parseInt(value.slice(0, 2), 10) <= 23 &&
  Number.parseInt(value.slice(3, 5), 10) >= 0 &&
  Number.parseInt(value.slice(3, 5), 10) <= 59;

export const DailyPlannerView: React.FC = () => {
  const today = getTodayISO();
  const preferences = useDailyPlannerStore((state) => state.preferences);
  const storedSession = useDailyPlannerStore((state) => state.sessionsByDate[today]);
  const ensureSession = useDailyPlannerStore((state) => state.ensureSession);
  const updateDayInputs = useDailyPlannerStore((state) => state.updateDayInputs);
  const setDraftMessage = useDailyPlannerStore((state) => state.setDraftMessage);
  const addMessage = useDailyPlannerStore((state) => state.addMessage);
  const setPlan = useDailyPlannerStore((state) => state.setPlan);
  const toggleBlockComplete = useDailyPlannerStore((state) => state.toggleBlockComplete);
  const setLoading = useDailyPlannerStore((state) => state.setLoading);
  const setError = useDailyPlannerStore((state) => state.setError);

  const [now, setNow] = useState(() => new Date());
  const session = storedSession ?? createDailyPlannerSession(today, preferences);
  const { dayInputs, latestPlan, completedBlockIds, messages, draftMessage, error, isLoading } = session;

  useEffect(() => {
    ensureSession(today);
  }, [ensureSession, today]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  const displayPlan = useMemo(
    () => ensureWindDownBlock(latestPlan, dayInputs),
    [dayInputs, latestPlan],
  );

  const localSummary = useMemo(
    () => buildDailyPlannerTimeSummary(dayInputs, displayPlan?.scheduledBlocks || [], now),
    [dayInputs, displayPlan?.scheduledBlocks, now],
  );

  const completedItems = useMemo(
    () => getCompletedBlockSummaries(displayPlan?.scheduledBlocks || [], completedBlockIds),
    [completedBlockIds, displayPlan?.scheduledBlocks],
  );

  const canGenerate = Boolean(dayInputs.pendingTasksText.trim() || draftMessage.trim() || latestPlan);
  const isPastWindDown = localSummary.availableMinutes <= 0;

  const handleSubmit = async (mode: 'plan' | 'replan') => {
    if (!canGenerate) return;

    const latestUserMessage = mode === 'replan'
      ? (draftMessage.trim() || 'Replaneje meu resto do dia considerando o que eu ja concluí.')
      : (draftMessage.trim() || dayInputs.pendingTasksText.trim());

    if (!latestUserMessage) return;

    addMessage(today, { role: 'user', text: latestUserMessage });
    setLoading(today, true);
    setError(today, null);

    try {
      const plan = await generateDailyPlannerPlan({
        date: today,
        latestUserMessage,
        dayInputs,
        chatHistory: [...messages, {
          id: 'pending-user-message',
          role: 'user',
          text: latestUserMessage,
          createdAt: Date.now(),
        }],
        completedItems,
        existingPlan: displayPlan,
        now,
      });

      setPlan(today, ensureWindDownBlock(plan, dayInputs));
      addMessage(today, {
        role: 'assistant',
        text: `${plan.assistantMessage}\n\n${plan.encouragement}`.trim(),
      });
      startTransition(() => setDraftMessage(today, ''));
    } catch (submitError) {
      if ((submitError as Error)?.name === 'AbortError') {
        setError(today, 'Planejamento cancelado antes de terminar.');
      } else {
        setError(today, (submitError as Error).message);
      }
    } finally {
      setLoading(today, false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/40 text-white shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.08),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative grid gap-8 xl:grid-cols-[380px_1fr] p-5 md:p-8">
        <aside className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-slate-850 bg-slate-900/40 p-6 backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-amber-500/20">
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-500/5 blur-2xl" />
            
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400/80">Plano do Dia IA</p>
                <h3 className="mt-1 text-xl font-bold tracking-tight text-white">Painel de manobra</h3>
              </div>
              <div className="rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-500/20 to-amber-600/5 p-2.5 text-amber-300 shadow-inner">
                <Sparkles size={18} />
              </div>
            </div>
            <p className="mt-3.5 text-xs leading-relaxed text-slate-400">
              O objetivo aqui não é espremer o seu dia até quebrar. É encaixar o que importa, reservar o que é fixo e terminar com a cabeça leve.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {metricLabels.map((metric) => {
                const source = latestPlan?.timeSummary || localSummary;
                const value = source[metric.key];
                const config = metricConfigs[metric.key];
                return (
                  <div
                    key={metric.key}
                    className={`rounded-xl border ${config.border} ${config.bg} p-3 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5`}
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{config.label}</p>
                    <p className={`mt-1.5 font-mono text-base font-extrabold ${config.text}`}>{renderMetricValue(metric.key, value)}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/25 via-cyan-950/5 to-transparent p-4 text-xs text-cyan-300">
              <div className="flex items-center gap-2 font-bold text-cyan-200 uppercase tracking-wider">
                <ShieldCheck size={15} />
                Regra dura do dia
              </div>
              <p className="mt-2 leading-relaxed text-slate-400">
                Depois de <span className="font-semibold text-cyan-300 font-mono">{localSummary.windDownStart}</span> não entra mais nada:
                esse tempo fica reservado para escovar os dentes, desacelerar e deitar.
              </p>
            </div>

            {isPastWindDown && (
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 via-amber-950/5 to-transparent p-4 text-xs text-amber-300">
                <div className="flex items-center gap-2 font-bold text-amber-200 uppercase tracking-wider">
                  <AlertTriangle size={15} />
                  Hora de encerrar
                </div>
                <p className="mt-2 leading-relaxed text-slate-400">
                  O dia útil já acabou. Se quiser, ainda podemos registrar o que ficou para amanhã sem te cobrar além do limite.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-850 bg-slate-900/30 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-slate-200">
              <Clock3 size={15} className="text-amber-400" />
              Ajustes fixos do dia
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Horário de dormir</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={5}
                  placeholder="22:00"
                  aria-label="Horário de dormir"
                  value={dayInputs.sleepTime}
                  onChange={(event) => updateDayInputs(today, { sleepTime: event.target.value })}
                  onBlur={(event) => {
                    const nextValue = event.target.value.trim();
                    if (!nextValue) {
                      updateDayInputs(today, { sleepTime: preferences.defaultSleepTime });
                      return;
                    }

                    if (isValidPlannerTime(nextValue)) {
                      updateDayInputs(today, { sleepTime: nextValue });
                    }
                  }}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-700 outline-none transition duration-200 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Preparo antes de dormir (minutos)</span>
                <input
                  type="number"
                  min={5}
                  max={90}
                  value={dayInputs.windDownMinutes}
                  onChange={(event) => updateDayInputs(today, { windDownMinutes: Number(event.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition duration-200 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="group/card relative flex flex-col justify-between rounded-xl border border-slate-850 bg-slate-900/10 p-4 transition-all hover:border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <Utensils size={14} className="text-amber-400" />
                      Refeição pendente
                    </div>
                    <input
                      aria-label="Falta refeicao"
                      type="checkbox"
                      checked={dayInputs.mealPending}
                      onChange={(event) => updateDayInputs(today, { mealPending: event.target.checked })}
                      className="h-4.5 w-4.5 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500/30 focus:ring-offset-slate-950 transition duration-150"
                    />
                  </div>
                  <div className="mt-3 relative">
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={dayInputs.mealDurationMinutes}
                      onChange={(event) => updateDayInputs(today, { mealDurationMinutes: Number(event.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-850 bg-slate-950/80 px-3 py-1.5 pr-10 text-xs text-white outline-none transition focus:border-amber-500/50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-bold uppercase">min</span>
                  </div>
                </label>

                <label className="group/card relative flex flex-col justify-between rounded-xl border border-slate-850 bg-slate-900/10 p-4 transition-all hover:border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <PawPrint size={14} className="text-emerald-400" />
                      Levar Irlanda
                    </div>
                    <input
                      aria-label="Levar Irlanda"
                      type="checkbox"
                      checked={dayInputs.dogPending}
                      onChange={(event) => updateDayInputs(today, { dogPending: event.target.checked })}
                      className="h-4.5 w-4.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-slate-950 transition duration-150"
                    />
                  </div>
                  <div className="mt-3 relative">
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={dayInputs.dogDurationMinutes}
                      onChange={(event) => updateDayInputs(today, { dogDurationMinutes: Number(event.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-850 bg-slate-950/80 px-3 py-1.5 pr-10 text-xs text-white outline-none transition focus:border-emerald-500/50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-bold uppercase">min</span>
                  </div>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">O que ainda precisa caber hoje</span>
                <textarea
                  value={dayInputs.pendingTasksText}
                  onChange={(event) => updateDayInputs(today, { pendingTasksText: event.target.value })}
                  placeholder="Ex.: estudar constitucional 2h, responder mensagem importante, revisar 20 questões..."
                  className="min-h-[120px] w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm leading-relaxed text-white placeholder-slate-700 outline-none transition duration-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                />
              </label>

              <button
                type="button"
                onClick={() => handleSubmit('plan')}
                disabled={isLoading || (!dayInputs.pendingTasksText.trim() && !draftMessage.trim())}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-orange-950/10 transition duration-200 hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:scale-100"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Gerar plano do resto do dia
              </button>
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col justify-between rounded-2xl border border-slate-850 bg-slate-900/30 p-6 backdrop-blur-md">
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <MessageSquareText size={20} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">Conversa e manejo</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Ajuste prioridades e recalcule o dia com a IA.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSubmit('replan')}
                    disabled={isLoading || !latestPlan}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-300 transition duration-200 hover:border-cyan-500/30 hover:text-cyan-300 hover:bg-slate-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <RefreshCcw size={13} className={isLoading ? 'animate-spin' : ''} />
                    Replanejar com concluídos
                  </button>
                </div>

                <div className="mt-6 space-y-4 max-h-[360px] overflow-y-auto pr-1">
                  {messages.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/20 p-5 text-xs leading-relaxed text-slate-500">
                      O chat entra em ação quando você gera o primeiro plano. Depois disso, você pode pedir ajustes como "troca a ordem", "encaixa 30 minutos de revisão" ou "eu só tenho energia para metade".
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`relative rounded-xl border p-4 text-xs leading-relaxed transition-all ${
                          message.role === 'assistant'
                            ? 'border-cyan-500/10 bg-cyan-950/5 text-cyan-100/90 shadow-sm'
                            : 'border-slate-800/80 bg-slate-950/40 text-slate-300'
                        }`}
                      >
                        <div className={`absolute top-4 right-4 h-1.5 w-1.5 rounded-full ${message.role === 'assistant' ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                        <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                          {message.role === 'assistant' ? 'Assistente IA' : 'Você'}
                        </p>
                        <p className="whitespace-pre-wrap">{message.text}</p>
                      </div>
                    ))
                  )}

                  {error && (
                    <div className="rounded-xl border border-red-500/10 bg-red-950/10 px-4 py-3 text-xs text-red-400">
                      {error}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-slate-850 bg-slate-950/30 p-4 transition-all focus-within:border-slate-800">
                <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Continuar conversa</label>
                <textarea
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(today, event.target.value)}
                  placeholder="Ex.: eu queria encaixar 30 minutos de leitura, mas estou cansado. O que você faria?"
                  className="min-h-[80px] w-full bg-transparent text-xs leading-relaxed text-white placeholder-slate-700 outline-none resize-none"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => handleSubmit(latestPlan ? 'replan' : 'plan')}
                    disabled={isLoading || !draftMessage.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-3.5 py-2 text-xs font-bold text-slate-950 transition duration-200 active:scale-95 disabled:scale-100 disabled:opacity-40"
                  >
                    {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Enviar ajuste
                  </button>
                  {latestPlan?.encouragement && (
                    <div className="flex-1 text-[10px] italic leading-normal text-emerald-400 bg-emerald-950/10 border border-emerald-500/5 rounded-lg px-2.5 py-1.5 w-fit">
                      ✨ "{latestPlan.encouragement}"
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-850 bg-slate-900/30 p-6 backdrop-blur-md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <MoonStar size={20} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Timeline do dia</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Seus blocos de tarefas agendados.</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-1 text-right">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Blocos</p>
                  <p className="text-sm font-black text-white">{displayPlan?.scheduledBlocks.length || 0}</p>
                </div>
              </div>

              <div className="mt-6 space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {displayPlan?.scheduledBlocks.length ? (
                  displayPlan.scheduledBlocks.map((block, index) => {
                    const isCompleted = completedBlockIds.includes(block.id);
                    return (
                      <div key={block.id} className="relative pl-7 pb-4 last:pb-1">
                        <div className="absolute left-3 top-2 h-full w-[1px] bg-slate-800 last:hidden" />
                        <div className={`absolute left-1 top-2.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border transition-all duration-300 ${
                          isCompleted
                            ? 'border-emerald-500 bg-emerald-950/80 text-emerald-400 shadow-sm shadow-emerald-900/20'
                            : 'border-slate-700 bg-slate-950 text-slate-500'
                        }`}>
                          {isCompleted ? <Check size={10} strokeWidth={3} /> : <div className="h-1 w-1 rounded-full bg-slate-600" />}
                        </div>

                        <label className={`block rounded-xl border p-4 transition duration-200 cursor-pointer ${isCompleted
                          ? 'border-emerald-500/15 bg-emerald-950/5 hover:bg-emerald-950/10'
                          : 'border-slate-850 bg-slate-900/10 hover:border-slate-750 hover:bg-slate-900/20'
                          }`}>
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              aria-label={`Marcar ${block.title} como feito`}
                              checked={isCompleted}
                              onChange={() => toggleBlockComplete(today, block.id)}
                              className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-slate-950 transition duration-150"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-sm font-bold text-white transition duration-200 ${isCompleted ? 'line-through text-slate-500 font-medium' : ''}`}>{block.title}</span>
                                <span className={`rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${categoryStyles[block.category] || categoryStyles.other}`}>
                                  {block.category}
                                </span>
                                {block.required && (
                                  <span className="rounded-md border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                                    Obrigatório
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                <span className="font-semibold text-slate-200 font-mono">{block.startTime} - {block.endTime}</span>
                                <span className="text-slate-600">•</span>
                                <span>{formatMinutes(block.durationMinutes)}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-500 font-mono text-[10px]">#{index + 1}</span>
                              </div>

                              {block.reason && (
                                <p className="mt-3 text-xs leading-relaxed text-slate-400">{block.reason}</p>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/20 p-5 text-xs leading-relaxed text-slate-500">
                    {isPastWindDown
                      ? 'Nenhum novo bloco vai entrar porque o período útil do dia já terminou.'
                      : 'Quando o plano for gerado, os blocos do resto do dia aparecem aqui em ordem de horário.'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-850 bg-slate-900/30 p-6 backdrop-blur-md">
              <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-slate-200">
                <AlertTriangle size={15} className="text-amber-400" />
                O que fica para depois
              </div>
              <div className="mt-5 space-y-3">
                {latestPlan?.deferredItems.length ? (
                  latestPlan.deferredItems.map((item) => (
                    <div key={`${item.title}-${item.suggestedNextStep}`} className="rounded-xl border border-slate-850 bg-slate-950/40 p-4 transition hover:border-slate-800">
                      <p className="text-xs font-bold text-white">{item.title}</p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.reason}</p>
                      <p className="mt-3 text-xs font-semibold text-cyan-400 flex items-center gap-2 bg-cyan-950/15 border border-cyan-500/10 rounded-lg px-2.5 py-1.5 w-fit">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        Próximo passo: {item.suggestedNextStep}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/20 p-5 text-xs leading-relaxed text-slate-500">
                    Nada adiado por enquanto. Se o plano precisar cortar algo para proteger seu limite do dia, ele aparece aqui com um próximo passo.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-850 bg-slate-900/30 p-6 backdrop-blur-md">
              <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-slate-200">
                <CheckCircle2 size={15} className="text-emerald-400" />
                Já concluído
              </div>
              <div className="mt-5 space-y-3">
                {completedItems.length ? (
                  completedItems.map((item) => (
                    <div key={item} className="flex items-center gap-2.5 rounded-xl border border-emerald-500/15 bg-emerald-950/5 px-4 py-2.5 text-xs font-semibold text-emerald-400 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {item}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/20 p-5 text-xs leading-relaxed text-slate-500">
                    Seus checks aparecem aqui para o próximo replanejamento considerar o que já saiu da frente.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DailyPlannerView;
