import React, { startTransition, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
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
  focus: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100',
  meal: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  dog: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  admin: 'border-slate-500/30 bg-slate-500/10 text-slate-100',
  personal: 'border-rose-500/30 bg-rose-500/10 text-rose-100',
  rest: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-100',
  buffer: 'border-orange-500/30 bg-orange-500/10 text-orange-100',
  other: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-100',
};

const summaryCardStyles = [
  'from-zinc-950 via-zinc-900 to-zinc-950',
  'from-[#120f0a] via-[#1d1710] to-[#0c0a07]',
  'from-[#07161a] via-[#0b2026] to-[#050d10]',
  'from-[#161109] via-[#231a0d] to-[#100b05]',
  'from-[#100f14] via-[#17151d] to-[#0b0a0f]',
];

const metricLabels = [
  { key: 'currentTime', label: 'Agora' },
  { key: 'sleepTime', label: 'Dormir' },
  { key: 'windDownStart', label: 'Preparar para dormir' },
  { key: 'availableMinutes', label: 'Minutos uteis' },
  { key: 'reservedMinutes', label: 'Reservado' },
  { key: 'freeBufferMinutes', label: 'Folga' },
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
    <div className="relative overflow-hidden rounded-[2rem] border border-zinc-800 bg-black text-white shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)] p-4 md:p-6">
        <aside className="space-y-4">
          <div className="overflow-hidden rounded-[1.75rem] border border-amber-500/20 bg-gradient-to-br from-[#120d08] via-black to-[#040404] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-amber-300/70">Plano do Dia IA</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Painel de manobra</h3>
              </div>
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-200">
                <Sparkles size={20} />
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-300">
              O objetivo aqui nao e espremer o seu dia ate quebrar. E encaixar o que importa, reservar o que e fixo e terminar com a cabeca leve.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {metricLabels.map((metric, index) => {
                const source = latestPlan?.timeSummary || localSummary;
                const value = source[metric.key];
                return (
                  <div
                    key={metric.key}
                    className={`rounded-2xl border border-white/8 bg-gradient-to-br ${summaryCardStyles[index % summaryCardStyles.length]} p-3`}
                  >
                    <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">{metric.label}</p>
                    <p className="mt-2 text-lg font-bold text-white">{renderMetricValue(metric.key, value)}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-4 text-sm text-cyan-100">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck size={16} />
                Regra dura do dia
              </div>
              <p className="mt-2 leading-6 text-cyan-50/90">
                Depois de <span className="font-semibold">{localSummary.windDownStart}</span> nao entra mais nada:
                esse tempo fica reservado para escovar os dentes, desacelerar e deitar.
              </p>
            </div>

            {isPastWindDown && (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle size={16} />
                  Hora de encerrar
                </div>
                <p className="mt-2 leading-6 text-amber-50/90">
                  O dia util ja acabou. Se quiser, ainda podemos registrar o que ficou para amanha sem te cobrar alem do limite.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/80 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <Clock3 size={16} className="text-amber-300" />
              Ajustes fixos do dia
            </div>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">Horario de dormir</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={5}
                  placeholder="22:00"
                  aria-label="Horario de dormir"
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
                  className="w-full rounded-2xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition focus:border-amber-400"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">Preparo antes de dormir</span>
                <input
                  type="number"
                  min={5}
                  max={90}
                  value={dayInputs.windDownMinutes}
                  onChange={(event) => updateDayInputs(today, { windDownMinutes: Number(event.target.value) || 0 })}
                  className="w-full rounded-2xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition focus:border-amber-400"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="rounded-2xl border border-zinc-800 bg-black/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                      <Utensils size={16} className="text-amber-300" />
                      Refeicao pendente
                    </div>
                    <input
                      aria-label="Falta refeicao"
                      type="checkbox"
                      checked={dayInputs.mealPending}
                      onChange={(event) => updateDayInputs(today, { mealPending: event.target.checked })}
                      className="h-4 w-4 rounded border-zinc-600 bg-black text-amber-400 focus:ring-amber-400"
                    />
                  </div>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={dayInputs.mealDurationMinutes}
                    onChange={(event) => updateDayInputs(today, { mealDurationMinutes: Number(event.target.value) || 0 })}
                    className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition focus:border-amber-400"
                  />
                </label>

                <label className="rounded-2xl border border-zinc-800 bg-black/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                      <PawPrint size={16} className="text-emerald-300" />
                      Levar Irlanda
                    </div>
                    <input
                      aria-label="Levar Irlanda"
                      type="checkbox"
                      checked={dayInputs.dogPending}
                      onChange={(event) => updateDayInputs(today, { dogPending: event.target.checked })}
                      className="h-4 w-4 rounded border-zinc-600 bg-black text-emerald-400 focus:ring-emerald-400"
                    />
                  </div>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={dayInputs.dogDurationMinutes}
                    onChange={(event) => updateDayInputs(today, { dogDurationMinutes: Number(event.target.value) || 0 })}
                    className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">O que ainda precisa caber hoje</span>
                <textarea
                  value={dayInputs.pendingTasksText}
                  onChange={(event) => updateDayInputs(today, { pendingTasksText: event.target.value })}
                  placeholder="Ex.: estudar constitucional 2h, responder mensagem importante, revisar 20 questoes..."
                  className="min-h-[140px] w-full rounded-[1.25rem] border border-zinc-800 bg-black px-4 py-3 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-400"
                />
              </label>

              <button
                type="button"
                onClick={() => handleSubmit('plan')}
                disabled={isLoading || (!dayInputs.pendingTasksText.trim() && !draftMessage.trim())}
                className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 px-4 py-3 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Gerar plano do resto do dia
              </button>
            </div>
          </div>
        </aside>

        <section className="space-y-4">
          <div className="grid gap-4 2xl:grid-cols-[minmax(0,0.92fr)_minmax(340px,0.78fr)]">
            <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/80 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                    <MessageSquareText size={16} className="text-cyan-300" />
                    Conversa e manejo
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Use a conversa para ajustar prioridade, aliviar culpa e recalcular o que realmente cabe hoje.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSubmit('replan')}
                  disabled={isLoading || !latestPlan}
                  className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 bg-black px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-cyan-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCcw size={15} />
                  Replanejar com o que ja concluí
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {messages.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-zinc-800 bg-black/50 p-5 text-sm leading-6 text-zinc-500">
                    O chat entra em acao quando voce gera o primeiro plano. Depois disso, voce pode pedir ajustes como "troca a ordem", "encaixa 30 minutos de revisao" ou "eu so tenho energia para metade".
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-[1.5rem] border px-4 py-3 text-sm leading-6 ${message.role === 'assistant'
                        ? 'border-cyan-500/15 bg-cyan-500/10 text-cyan-50'
                        : 'border-zinc-800 bg-black text-zinc-200'
                        }`}
                    >
                      <p className="mb-1 text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                        {message.role === 'assistant' ? 'Assistente' : 'Voce'}
                      </p>
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    </div>
                  ))
                )}

                {error && (
                  <div className="rounded-[1.25rem] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {error}
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-zinc-800 bg-black/70 p-4">
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-zinc-500">Continuar conversa</label>
                <textarea
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(today, event.target.value)}
                  placeholder="Ex.: eu queria encaixar 30 minutos de leitura, mas estou cansado. O que voce faria?"
                  className="min-h-[110px] w-full rounded-[1.25rem] border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-400"
                />
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleSubmit(latestPlan ? 'replan' : 'plan')}
                    disabled={isLoading || !draftMessage.trim()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-2 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    Enviar ajuste
                  </button>
                  {latestPlan?.encouragement && (
                    <div className="flex-1 rounded-2xl border border-emerald-500/15 bg-emerald-500/10 px-4 py-2 text-sm leading-6 text-emerald-50">
                      {latestPlan.encouragement}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/80 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                    <MoonStar size={16} className="text-amber-300" />
                    Timeline do que cabe hoje
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Marque direto aqui o que ja foi. Os checks ficam salvos e podem entrar no proximo replanejamento.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-right">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Blocos agendados</p>
                  <p className="mt-1 text-lg font-bold text-white">{displayPlan?.scheduledBlocks.length || 0}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {displayPlan?.scheduledBlocks.length ? (
                  displayPlan.scheduledBlocks.map((block, index) => {
                    const isCompleted = completedBlockIds.includes(block.id);
                    return (
                      <div key={block.id} className="relative pl-8">
                        <div className="absolute left-3 top-0 h-full w-px bg-gradient-to-b from-amber-400/50 via-zinc-700 to-transparent" />
                        <div className="absolute left-0 top-5 h-6 w-6 rounded-full border border-zinc-700 bg-black" />

                        <label className={`block rounded-[1.5rem] border p-4 transition ${isCompleted
                          ? 'border-emerald-500/25 bg-emerald-500/10'
                          : 'border-zinc-800 bg-black/60 hover:border-zinc-700'
                          }`}>
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              aria-label={`Marcar ${block.title} como feito`}
                              checked={isCompleted}
                              onChange={() => toggleBlockComplete(today, block.id)}
                              className="mt-1 h-4 w-4 rounded border-zinc-600 bg-black text-emerald-400 focus:ring-emerald-400"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-white">{block.title}</span>
                                <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${categoryStyles[block.category] || categoryStyles.other}`}>
                                  {block.category}
                                </span>
                                {block.required && (
                                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-100">
                                    Obrigatorio
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-100">
                                    Feito
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                                <span className="font-semibold text-zinc-200">{block.startTime} - {block.endTime}</span>
                                <span>{formatMinutes(block.durationMinutes)}</span>
                                <span className="text-zinc-500">#{index + 1}</span>
                              </div>

                              <p className="mt-3 text-sm leading-6 text-zinc-300">{block.reason}</p>
                            </div>
                          </div>
                        </label>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-zinc-800 bg-black/40 p-5 text-sm leading-6 text-zinc-500">
                    {isPastWindDown
                      ? 'Nenhum novo bloco vai entrar porque o periodo util do dia ja terminou.'
                      : 'Quando o plano for gerado, os blocos do resto do dia aparecem aqui em ordem de horario.'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/80 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <AlertTriangle size={16} className="text-amber-300" />
                O que fica para depois
              </div>
              <div className="mt-4 space-y-3">
                {latestPlan?.deferredItems.length ? (
                  latestPlan.deferredItems.map((item) => (
                    <div key={`${item.title}-${item.suggestedNextStep}`} className="rounded-[1.5rem] border border-zinc-800 bg-black/60 p-4">
                      <p className="text-sm font-bold text-white">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">{item.reason}</p>
                      <p className="mt-2 text-sm leading-6 text-cyan-200">{item.suggestedNextStep}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-zinc-800 bg-black/40 p-5 text-sm leading-6 text-zinc-500">
                    Nada adiado por enquanto. Se o plano precisar cortar algo para proteger seu limite do dia, ele aparece aqui com um proximo passo.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/80 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <CheckCircle2 size={16} className="text-emerald-300" />
                Ja concluido
              </div>
              <div className="mt-4 space-y-3">
                {completedItems.length ? (
                  completedItems.map((item) => (
                    <div key={item} className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
                      {item}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-zinc-800 bg-black/40 p-5 text-sm leading-6 text-zinc-500">
                    Seus checks aparecem aqui para o proximo replanejamento considerar o que ja saiu da frente.
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
