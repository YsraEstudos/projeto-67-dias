import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

vi.mock('../../../hooks/useAuth', () => ({
    useAuth: () => ({ user: { id: 'u1', name: 'Ana', email: 'ana@example.com', isGuest: false } }),
}));

import SettingsView from '../../../components/views/SettingsView';
import { useConfigStore } from '../../../stores/configStore';

const ORIGINAL_TZ = process.env.TZ;

describe('SettingsView - Desafio 67 Dias', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            configurable: true,
            value: vi.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
        // Fuso positivo: meia-noite local vira o dia anterior em UTC
        process.env.TZ = 'Europe/Berlin';
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 9, 7, 12, 0, 0)); // 07/10/2026
        useConfigStore.getState()._hydrateFromFirestore(null);
    });

    afterEach(() => {
        vi.useRealTimers();
        process.env.TZ = ORIGINAL_TZ;
    });

    it('shows the local start date in the input (not the UTC date)', () => {
        useConfigStore.getState().setConfig({
            startDate: new Date(2026, 9, 1, 0, 0, 0).toISOString(), // 01/10 local = 30/09 22:00Z
            isProjectStarted: false,
        });
        render(<SettingsView />);
        fireEvent.click(screen.getByRole('button', { name: /Desafio 67 Dias/ }));
        expect(screen.getByLabelText('Data de início')).toHaveValue('2026-10-01');
    });

    it('shows Day 67 as end date and the journey progress', () => {
        useConfigStore.getState().setConfig({
            startDate: new Date(2026, 9, 1, 0, 0, 0).toISOString(),
            isProjectStarted: true,
        });
        render(<SettingsView />);
        fireEvent.click(screen.getByRole('button', { name: /Desafio 67 Dias/ }));

        // Dia 1 = 01/10 → Dia 67 = 06/12
        expect(screen.getByText(new Date(2026, 11, 6).toLocaleDateString('pt-BR'))).toBeInTheDocument();
        expect(screen.getByText('Dia 7 de 67')).toBeInTheDocument();
        expect(screen.getByText('Faltam 60 dias')).toBeInTheDocument();
        expect(screen.getByRole('progressbar', { name: /Progresso da jornada/ })).toHaveAttribute('aria-valuenow', '10');
    });

    it('shows a countdown before the journey starts', () => {
        useConfigStore.getState().setConfig({
            startDate: new Date(2026, 9, 10, 0, 0, 0).toISOString(),
            isProjectStarted: false,
        });
        render(<SettingsView />);
        fireEvent.click(screen.getByRole('button', { name: /Desafio 67 Dias/ }));
        expect(screen.getByText('Começa em 3 dias')).toBeInTheDocument();
    });
});
