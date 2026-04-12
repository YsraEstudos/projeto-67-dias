import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { z } from 'zod';
import {
  DailyPlannerBlock,
  DailyPlannerBlockCategory,
  DailyPlannerDayInputs,
  DailyPlannerMessage,
  DailyPlannerPlan,
} from '../types';
import {
  buildDailyPlannerTimeSummary,
  createPlannerBlockId,
} from '../utils/dailyPlannerUtils';

export const DAILY_PLANNER_MODEL = 'gemini-3-pro-preview';
const DAILY_PLANNER_TIMEOUT_MS = 30000;

const CATEGORY_VALUES: DailyPlannerBlockCategory[] = [
  'focus',
  'meal',
  'dog',
  'wind-down',
  'admin',
  'personal',
  'rest',
  'buffer',
  'other',
];

const plannerResponseSchema = z.object({
  assistantMessage: z.string().min(1),
  timeSummary: z.object({
    currentTime: z.string().min(1),
    sleepTime: z.string().min(1),
    windDownStart: z.string().min(1),
    availableMinutes: z.number().nonnegative(),
    reservedMinutes: z.number().nonnegative(),
    scheduledMinutes: z.number().nonnegative(),
    freeBufferMinutes: z.number(),
  }),
  scheduledBlocks: z.array(z.object({
    title: z.string().min(1),
    category: z.string().min(1),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    durationMinutes: z.number().positive(),
    reason: z.string().min(1),
    required: z.boolean(),
  })),
  deferredItems: z.array(z.object({
    title: z.string().min(1),
    reason: z.string().min(1),
    suggestedNextStep: z.string().min(1),
  })),
  encouragement: z.string().min(1),
});

const responseSchema = {
  type: 'object',
  properties: {
    assistantMessage: { type: 'string' },
    timeSummary: {
      type: 'object',
      properties: {
        currentTime: { type: 'string' },
        sleepTime: { type: 'string' },
        windDownStart: { type: 'string' },
        availableMinutes: { type: 'number' },
        reservedMinutes: { type: 'number' },
        scheduledMinutes: { type: 'number' },
        freeBufferMinutes: { type: 'number' },
      },
      required: [
        'currentTime',
        'sleepTime',
        'windDownStart',
        'availableMinutes',
        'reservedMinutes',
        'scheduledMinutes',
        'freeBufferMinutes',
      ],
    },
    scheduledBlocks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          category: { type: 'string' },
          startTime: { type: 'string' },
          endTime: { type: 'string' },
          durationMinutes: { type: 'number' },
          reason: { type: 'string' },
          required: { type: 'boolean' },
        },
        required: [
          'title',
          'category',
          'startTime',
          'endTime',
          'durationMinutes',
          'reason',
          'required',
        ],
      },
    },
    deferredItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          reason: { type: 'string' },
          suggestedNextStep: { type: 'string' },
        },
        required: ['title', 'reason', 'suggestedNextStep'],
      },
    },
    encouragement: { type: 'string' },
  },
  required: [
    'assistantMessage',
    'timeSummary',
    'scheduledBlocks',
    'deferredItems',
    'encouragement',
  ],
} as const;

const DAILY_PLANNER_SYSTEM_INSTRUCTION = `
Você é um planejador diário acolhedor, direto e pragmático. Responda sempre em português do Brasil.

Regras obrigatórias:
- Nunca culpe o usuário.
- Nunca proponha tarefas depois do início do preparo para dormir.
- O início do preparo para dormir é um limite duro.
- Se não houver tempo suficiente, monte um plano parcial honesto, com folga quando possível.
- Quando refeição pendente ou levar a Irlanda estiverem marcados, trate esses blocos como obrigatórios.
- O usuário quer apoio, motivação e manejo realista do tempo.
- Não devolva HTML. Devolva apenas JSON válido compatível com o schema.
- Em scheduledBlocks, use categorias curtas como focus, meal, dog, admin, personal, rest, buffer ou other.
- Em deferredItems, mova para depois o que não couber sem tom de culpa.
`.trim();

const readGeminiApiKey = (): string | undefined => {
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (typeof rawKey !== 'string') return undefined;

  const normalizedKey = rawKey.trim();
  return normalizedKey.length > 0 ? normalizedKey : undefined;
};

export interface GenerateDailyPlannerPlanInput {
  date: string;
  latestUserMessage: string;
  dayInputs: DailyPlannerDayInputs;
  chatHistory: DailyPlannerMessage[];
  completedItems: string[];
  existingPlan: DailyPlannerPlan | null;
  now?: Date;
}

export interface GenerateDailyPlannerPlanOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export class DailyPlannerAIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DailyPlannerAIError';
  }
}

let plannerClient: GoogleGenAI | null = null;

const getPlannerClient = () => {
  if (!plannerClient) {
    const apiKey = readGeminiApiKey();

    if (!apiKey) {
      throw new DailyPlannerAIError(
        'Defina VITE_GEMINI_API_KEY no .env.local para usar o Google AI Studio.',
      );
    }

    plannerClient = new GoogleGenAI({ apiKey });
  }

  return plannerClient;
};

const normalizeCategory = (category: string): DailyPlannerBlockCategory => {
  const normalized = category.trim().toLowerCase() as DailyPlannerBlockCategory;
  return CATEGORY_VALUES.includes(normalized) ? normalized : 'other';
};

const normalizeBlocks = (blocks: z.infer<typeof plannerResponseSchema>['scheduledBlocks']): DailyPlannerBlock[] =>
  blocks.map((block) => {
    const normalizedBlock: Omit<DailyPlannerBlock, 'id'> = {
      title: block.title.trim(),
      category: normalizeCategory(block.category),
      startTime: block.startTime.trim(),
      endTime: block.endTime.trim(),
      durationMinutes: Math.max(1, Math.round(block.durationMinutes)),
      reason: block.reason.trim(),
      required: block.required,
    };

    return {
      ...normalizedBlock,
      id: createPlannerBlockId(normalizedBlock),
    };
  });

const extractResponseText = (response: unknown): string => {
  const responseText = (response as { text?: string })?.text?.trim();
  if (responseText) {
    return responseText;
  }

  const candidateParts = (response as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  })?.candidates?.[0]?.content?.parts;

  if (!candidateParts?.length) {
    throw new DailyPlannerAIError('A IA não retornou nenhum conteúdo legível.');
  }

  return candidateParts
    .map((part) => part.text || '')
    .join('')
    .trim();
};

const createAbortError = (): Error =>
  Object.assign(new Error('Aborted'), { name: 'AbortError' });

const withAbortAndTimeout = async <T>(
  work: Promise<T>,
  signal: AbortSignal | undefined,
  timeoutMs: number,
): Promise<T> => {
  const cleanups: Array<() => void> = [];
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  try {
    if (signal?.aborted) {
      throw createAbortError();
    }

    const races: Promise<never>[] = [];

    if (signal) {
      races.push(
        new Promise<never>((_, reject) => {
          const onAbort = () => reject(createAbortError());
          signal.addEventListener('abort', onAbort, { once: true });
          cleanups.push(() => signal.removeEventListener('abort', onAbort));
        }),
      );
    }

    if (timeoutMs > 0) {
      races.push(
        new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new DailyPlannerAIError('A IA demorou demais para responder. Tente novamente.'));
          }, timeoutMs);
        }),
      );
    }

    return await Promise.race([work, ...races]);
  } finally {
    if (timeoutHandle !== null) {
      clearTimeout(timeoutHandle);
    }

    cleanups.forEach((cleanup) => cleanup());
  }
};

const cleanJsonText = (rawText: string): string =>
  rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

const serializeHistory = (history: DailyPlannerMessage[]): string =>
  history.length === 0
    ? 'Sem histórico anterior.'
    : history
      .map((message) => `${message.role === 'assistant' ? 'Assistente' : 'Usuário'}: ${message.text}`)
      .join('\n');

const buildPlannerPrompt = (input: GenerateDailyPlannerPlanInput, now: Date): string => {
  const localSummary = buildDailyPlannerTimeSummary(input.dayInputs, [], now);

  return [
    'Monte um plano para o restante do dia usando o estado abaixo.',
    'Respeite o limite duro de windDownStart e seja realista.',
    'Se algo nao couber, mova para deferredItems com linguagem acolhedora.',
    '',
    JSON.stringify({
      context: {
        date: input.date,
        nowIso: now.toISOString(),
        timeSummary: localSummary,
        dayInputs: input.dayInputs,
        latestUserMessage: input.latestUserMessage,
        completedItems: input.completedItems,
        existingPlanSummary: input.existingPlan
          ? {
            scheduledBlocks: input.existingPlan.scheduledBlocks.map((block) => ({
              title: block.title,
              startTime: block.startTime,
              endTime: block.endTime,
              required: block.required,
            })),
            deferredItems: input.existingPlan.deferredItems,
          }
          : null,
        visibleChatHistory: serializeHistory(input.chatHistory),
      },
      outputRules: {
        mustRespectHardStopAt: localSummary.windDownStart,
        mustIncludePendingMeal: input.dayInputs.mealPending,
        mustIncludePendingDogWalk: input.dayInputs.dogPending,
        reservedMinutesAlreadyKnown: localSummary.reservedMinutes,
        desiredTone: 'acolhedor, honesto, motivador e sem culpa',
      },
    }, null, 2),
  ].join('\n');
};

export const parseDailyPlannerResponse = (
  rawText: string,
  dayInputs: DailyPlannerDayInputs,
  now = new Date(),
): DailyPlannerPlan => {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(cleanJsonText(rawText));
  } catch (error) {
    throw new DailyPlannerAIError(`Resposta JSON inválida do planner: ${(error as Error).message}`);
  }

  const validated = plannerResponseSchema.parse(parsedJson);
  const scheduledBlocks = normalizeBlocks(validated.scheduledBlocks);
  const timeSummary = buildDailyPlannerTimeSummary(dayInputs, scheduledBlocks, now);

  return {
    assistantMessage: validated.assistantMessage.trim(),
    encouragement: validated.encouragement.trim(),
    scheduledBlocks,
    deferredItems: validated.deferredItems.map((item) => ({
      title: item.title.trim(),
      reason: item.reason.trim(),
      suggestedNextStep: item.suggestedNextStep.trim(),
    })),
    timeSummary,
    generatedAt: Date.now(),
  };
};

export const generateDailyPlannerPlan = async (
  input: GenerateDailyPlannerPlanInput,
  options: GenerateDailyPlannerPlanOptions = {},
): Promise<DailyPlannerPlan> => {
  const now = input.now ?? new Date();
  const client = getPlannerClient();
  const prompt = buildPlannerPrompt(input, now);

  const generationPromise = client.models.generateContent({
    model: DAILY_PLANNER_MODEL,
    contents: prompt,
    config: {
      systemInstruction: DAILY_PLANNER_SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseJsonSchema: responseSchema,
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH,
      },
      temperature: 1,
    },
  });

  try {
    const result = await withAbortAndTimeout(
      generationPromise,
      options.signal,
      options.timeoutMs ?? DAILY_PLANNER_TIMEOUT_MS,
    );
    const rawText = extractResponseText(result);
    return parseDailyPlannerResponse(rawText, input.dayInputs, now);
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') {
      throw error;
    }

    if (error instanceof DailyPlannerAIError || error instanceof z.ZodError) {
      throw new DailyPlannerAIError(error.message);
    }

    throw new DailyPlannerAIError(
      'Nao consegui montar um plano agora. Tente novamente em alguns instantes.',
    );
  }
};
