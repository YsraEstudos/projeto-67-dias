import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../stores/firestoreSync', async () => {
    const actual = await vi.importActual('../../../stores/firestoreSync');
    return { ...actual, writeToFirestore: vi.fn() };
});

import { SundayTimer } from '../../../components/views/SundayTimer';
import { SundayTimerWidget } from '../../../components/SundayTimerWidget';
import { useSundayTimerStore } from '../../../stores/sundayTimerStore';

const hydrateRunning = (startOffsetMs: number) => {
    useSundayTimerStore.getState()._reset();
    useSundayTimerStore.getState()._hydrateFromFirestore({
        timer: {
            status: 'RUNNING',
            startTime: Date.now() - startOffsetMs,
            pausedAt: null,
            accumulated: 0,
            totalDuration: 60_000,
            widgetPosition: 'bottom-right',
        },
    });
};

describe('SundayTimer', () => {
    beforeEach(() => vi.clearAllMocks());

    it('auto-finishes an expired session and shows the finished state', () => {
        hydrateRunning(61_000);
        render(<SundayTimer />);

        expect(useSundayTimerStore.getState().timer.status).toBe('FINISHED');
        expect(screen.getByRole('status')).toHaveTextContent('Sessão concluída!');
        expect(screen.getByText('Nova Sessão')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Resetar timer' })).toBeInTheDocument();
    });
});

describe('SundayTimerWidget', () => {
    it('finishes the session on its own when time runs out outside the Sunday view', () => {
        vi.useFakeTimers();
        try {
            hydrateRunning(58_000);
            render(<SundayTimerWidget onClick={() => {}} />);
            expect(screen.getByTestId('sunday-timer-widget')).toBeInTheDocument();

            act(() => { vi.advanceTimersByTime(3_000); });

            expect(useSundayTimerStore.getState().timer.status).toBe('FINISHED');
            expect(screen.queryByTestId('sunday-timer-widget')).not.toBeInTheDocument();
        } finally {
            vi.useRealTimers();
        }
    });
});
