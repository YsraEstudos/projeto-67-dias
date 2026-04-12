import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
    DAILY_PLANNER_MODEL,
    DailyPlannerAIError,
    generateDailyPlannerPlan,
    parseDailyPlannerResponse,
} from '../../services/dailyPlannerAI';

const defaultInputs = {
    sleepTime: '22:00',
    windDownMinutes: 10,
    mealPending: true,
    mealDurationMinutes: 20,
    dogPending: true,
    dogDurationMinutes: 25,
    pendingTasksText: 'Estudar o que der hoje',
};

describe('dailyPlannerAI service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('validates JSON and rebuilds the time summary locally', () => {
        const plan = parseDailyPlannerResponse(JSON.stringify({
            assistantMessage: 'Vamos focar no que cabe.',
            timeSummary: {
                currentTime: '18:00',
                sleepTime: '23:59',
                windDownStart: '23:49',
                availableMinutes: 999,
                reservedMinutes: 0,
                scheduledMinutes: 0,
                freeBufferMinutes: 999,
            },
            scheduledBlocks: [
                {
                    title: 'Revisao',
                    category: 'focus',
                    startTime: '19:00',
                    endTime: '20:00',
                    durationMinutes: 60,
                    reason: 'Bloco principal de estudo',
                    required: true,
                },
                {
                    title: 'Levar Irlanda',
                    category: 'dog',
                    startTime: '20:05',
                    endTime: '20:30',
                    durationMinutes: 25,
                    reason: 'Bloco obrigatorio da noite',
                    required: true,
                },
            ],
            deferredItems: [],
            encouragement: 'Hoje o objetivo e fechar bem, nao perfeito.',
        }), defaultInputs, new Date('2026-04-07T19:00:00'));

        expect(plan.timeSummary.sleepTime).toBe('22:00');
        expect(plan.timeSummary.windDownStart).toBe('21:50');
        expect(plan.timeSummary.reservedMinutes).toBe(45);
        expect(plan.timeSummary.scheduledMinutes).toBe(85);
        expect(plan.scheduledBlocks[0]?.id).toContain('focus');
    });

    it('throws a friendly error when the planner JSON is malformed', () => {
        expect(() => parseDailyPlannerResponse('{not-json}', defaultInputs)).toThrow(DailyPlannerAIError);
    });

    it('calls the model and converts a valid AI response into a plan', async () => {
        const generateContent = vi.fn(() => Promise.resolve({
            text: JSON.stringify({
                assistantMessage: 'Vamos reduzir o escopo com calma.',
                timeSummary: {
                    currentTime: '19:00',
                    sleepTime: '22:00',
                    windDownStart: '21:50',
                    availableMinutes: 170,
                    reservedMinutes: 45,
                    scheduledMinutes: 80,
                    freeBufferMinutes: 45,
                },
                scheduledBlocks: [
                    {
                        title: 'Estudo profundo',
                        category: 'focus',
                        startTime: '19:10',
                        endTime: '20:10',
                        durationMinutes: 60,
                        reason: 'Maior retorno antes do jantar',
                        required: true,
                    },
                ],
                deferredItems: [
                    {
                        title: 'Segunda hora de estudo',
                        reason: 'Nao cabe com folga hoje',
                        suggestedNextStep: 'Levar para o primeiro bloco de amanha',
                    },
                ],
                encouragement: 'Fazer menos hoje nao invalida o projeto.',
            }),
        }));

        vi.mocked(GoogleGenAI).mockImplementationOnce(function GoogleGenAI() {
            return {
                models: {
                    generateContent,
                },
            };
        } as never);

        const plan = await generateDailyPlannerPlan({
            date: '2026-04-07',
            latestUserMessage: 'Tenho 2 horas livres e queria estudar 4',
            dayInputs: defaultInputs,
            chatHistory: [],
            completedItems: [],
            existingPlan: null,
            now: new Date('2026-04-07T19:00:00'),
        });

        expect(vi.mocked(GoogleGenAI)).toHaveBeenCalledWith({
            apiKey: 'test-gemini-api-key',
        });

        expect(generateContent).toHaveBeenCalledWith(
            expect.objectContaining({
                model: DAILY_PLANNER_MODEL,
                contents: expect.any(String),
                config: expect.objectContaining({
                    responseMimeType: 'application/json',
                    thinkingConfig: expect.objectContaining({
                        thinkingLevel: ThinkingLevel.HIGH,
                    }),
                }),
            }),
        );
        expect(plan.assistantMessage).toContain('reduzir o escopo');
        expect(plan.deferredItems[0]?.title).toBe('Segunda hora de estudo');
        expect(plan.timeSummary.reservedMinutes).toBe(45);
    });
});
