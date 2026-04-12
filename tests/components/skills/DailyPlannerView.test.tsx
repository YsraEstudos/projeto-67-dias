import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

vi.mock('../../../services/dailyPlannerAI', () => ({
    generateDailyPlannerPlan: vi.fn(),
}));

import { DailyPlannerView } from '../../../components/skills/DailyPlannerView';
import { generateDailyPlannerPlan } from '../../../services/dailyPlannerAI';
import { useDailyPlannerStore } from '../../../stores/dailyPlannerStore';

const today = '2026-04-07';

const mockPlan = {
    assistantMessage: 'Hoje vamos proteger o horario e fechar o essencial.',
    encouragement: 'Mesmo com menos tempo, ainda da para terminar o dia com dignidade.',
    timeSummary: {
        currentTime: '19:00',
        sleepTime: '22:00',
        windDownStart: '21:50',
        availableMinutes: 170,
        reservedMinutes: 45,
        scheduledMinutes: 85,
        freeBufferMinutes: 40,
    },
    scheduledBlocks: [
        {
            id: 'focus_estudo-1910_2010_60',
            title: 'Estudo profundo',
            category: 'focus' as const,
            startTime: '19:10',
            endTime: '20:10',
            durationMinutes: 60,
            reason: 'Maior retorno no bloco mais claro da noite.',
            required: true,
        },
        {
            id: 'dog_irlanda-2010_2035_25',
            title: 'Levar Irlanda',
            category: 'dog' as const,
            startTime: '20:10',
            endTime: '20:35',
            durationMinutes: 25,
            reason: 'Compromisso fixo e obrigatorio.',
            required: true,
        },
    ],
    deferredItems: [
        {
            title: 'Segunda hora de estudo',
            reason: 'Nao cabe hoje sem estourar a noite.',
            suggestedNextStep: 'Abrir o dia de amanha com 40 minutos desse conteudo.',
        },
    ],
    generatedAt: Date.now(),
};

describe('DailyPlannerView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-04-07T19:00:00'));
        useDailyPlannerStore.getState()._reset();
        useDailyPlannerStore.getState()._hydrateFromFirestore(null);
        useDailyPlannerStore.getState().ensureSession(today);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows 45 reserved minutes when meal and Irlanda are pending', () => {
        useDailyPlannerStore.getState().updateDayInputs(today, {
            mealPending: true,
            dogPending: true,
        });

        render(<DailyPlannerView />);

        expect(screen.getByText('Reservado')).toBeInTheDocument();
        expect(screen.getAllByText('45 min').length).toBeGreaterThan(0);
    });

    it('allows editing the sleep time field', () => {
        render(<DailyPlannerView />);

        fireEvent.change(screen.getByLabelText('Horario de dormir'), {
            target: { value: '21:30' },
        });

        expect(useDailyPlannerStore.getState().sessionsByDate[today]?.dayInputs.sleepTime).toBe('21:30');
        expect(screen.getByLabelText('Horario de dormir')).toHaveValue('21:30');
    });

    it('shows a closing guidance when the day is already inside wind-down time', () => {
        vi.setSystemTime(new Date('2026-04-07T21:55:00'));

        render(<DailyPlannerView />);

        expect(screen.getByText('Hora de encerrar')).toBeInTheDocument();
        expect(screen.getByText(/O dia util ja acabou/i)).toBeInTheDocument();
    });

    it('renders a partial plan without guilt and moves the overflow to deferred items', async () => {
        vi.mocked(generateDailyPlannerPlan).mockResolvedValue(mockPlan);

        render(<DailyPlannerView />);

        fireEvent.change(screen.getByPlaceholderText(/Ex\.: estudar constitucional/i), {
            target: { value: 'Estudar 4 horas ainda hoje' },
        });

        await act(async () => {
            fireEvent.click(screen.getByText('Gerar plano do resto do dia'));
        });

        expect(screen.getByText('Estudo profundo')).toBeInTheDocument();
        expect(screen.getByText('Segunda hora de estudo')).toBeInTheDocument();
        expect(screen.getAllByText(/Mesmo com menos tempo/i).length).toBeGreaterThan(0);
    });

    it('adds a markable closing routine for the wind-down window', async () => {
        vi.mocked(generateDailyPlannerPlan).mockResolvedValue(mockPlan);

        render(<DailyPlannerView />);

        fireEvent.change(screen.getByPlaceholderText(/Ex\.: estudar constitucional/i), {
            target: { value: 'Fechar o dia sem passar das 22:00' },
        });

        await act(async () => {
            fireEvent.click(screen.getByText('Gerar plano do resto do dia'));
        });

        const closingRoutine = screen.getByLabelText(
            /Marcar Escovar os dentes e preparar para dormir como feito/i,
        );

        expect(screen.getByText('Escovar os dentes e preparar para dormir')).toBeInTheDocument();

        fireEvent.click(closingRoutine);

        expect(useDailyPlannerStore.getState().sessionsByDate[today]?.completedBlockIds).toContain(
            'wind-down_close-the-day',
        );
    });

    it('keeps completed blocks in store and sends them on replan', async () => {
        vi.mocked(generateDailyPlannerPlan)
            .mockResolvedValueOnce(mockPlan)
            .mockResolvedValueOnce({
                ...mockPlan,
                encouragement: 'Voce ja tirou uma parte grande da frente.',
            });

        render(<DailyPlannerView />);

        fireEvent.change(screen.getByPlaceholderText(/Ex\.: estudar constitucional/i), {
            target: { value: 'Estudar 2 horas e jantar' },
        });
        await act(async () => {
            fireEvent.click(screen.getByText('Gerar plano do resto do dia'));
        });

        expect(screen.getByText('Estudo profundo')).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText('Marcar Estudo profundo como feito'));

        expect(useDailyPlannerStore.getState().sessionsByDate[today]?.completedBlockIds).toContain(
            'focus_estudo-1910_2010_60',
        );

        fireEvent.change(screen.getByPlaceholderText(/eu queria encaixar 30 minutos/i), {
            target: { value: 'Reordena isso para eu ficar mais leve' },
        });
        await act(async () => {
            fireEvent.click(screen.getByText('Replanejar com o que ja concluí'));
        });

        expect(vi.mocked(generateDailyPlannerPlan)).toHaveBeenCalledTimes(2);
        const secondCall = vi.mocked(generateDailyPlannerPlan).mock.calls[1]?.[0];
        expect(secondCall?.completedItems).toEqual(['Estudo profundo (19:10-20:10)']);
    });
});
