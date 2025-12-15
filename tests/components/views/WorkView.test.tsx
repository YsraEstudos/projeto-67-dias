import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkView from '../../../components/views/WorkView';

// Mock useStorage
vi.mock('../../../hooks/useStorage', () => ({
    useStorage: (key: string, initialValue: any) => {
        const [val, setVal] = React.useState(initialValue);
        return [val, setVal];
    },
    readNamespacedStorage: vi.fn(() => null),
    writeNamespacedStorage: vi.fn(),
    removeNamespacedStorage: vi.fn(),
}));

// Mock Firebase
vi.mock('../../../services/firebase', () => ({
    db: {},
    auth: { currentUser: { uid: 'test-uid' } }
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    setDoc: vi.fn(),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
    onSnapshot: vi.fn((_ref, onNext) => {
        if (typeof onNext === 'function') {
            onNext({ exists: () => false, data: () => ({}) });
        }
        return vi.fn();
    })
}));

vi.mock('firebase/auth', () => ({
    onAuthStateChanged: vi.fn((auth, callback) => {
        callback({ uid: 'test-uid' });
        return () => { };
    })
}));

describe('WorkView - Met Target Feature', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('opens the Met Target modal when button is clicked', () => {
        render(<WorkView />);

        // Find the button specifically by its role to avoid matching the modal title
        const metTargetButton = screen.getByRole('button', { name: /Metas Extras/i });
        fireEvent.click(metTargetButton);

        // Verify the modal opened
        expect(screen.getByText('Sessão Atual')).toBeInTheDocument();
        expect(screen.getByText('Histórico')).toBeInTheDocument();
    });

    it('starts and pauses the timer', async () => {
        render(<WorkView />);
        fireEvent.click(screen.getByText('Metas Extras'));

        const startButton = screen.getByText('Iniciar');
        fireEvent.click(startButton);

        expect(screen.getByText('Pausar')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Pausar'));
        expect(screen.getByText('Iniciar')).toBeInTheDocument();
    });

    it('displays Anki and NCM counters', () => {
        render(<WorkView />);
        fireEvent.click(screen.getByText('Metas Extras'));

        expect(screen.getByText('Anki (Meta: 15)')).toBeInTheDocument();
        expect(screen.getByText('NCM (Meta: 20)')).toBeInTheDocument();
    });

    it('saves a session and shows it in history', async () => {
        render(<WorkView />);
        fireEvent.click(screen.getByText('Metas Extras'));

        // Click Save
        fireEvent.click(screen.getByText('Salvar Sessão Extra'));

        // Should switch to History tab automatically and show the entry
        // We look for the text pattern "Anki: 0 | NCM: 0"
        expect(screen.getByText(/Anki: 0 \| NCM: 0/)).toBeInTheDocument();
    });

    it('updates weekly progress correctly when a session is saved', async () => {
        render(<WorkView />);

        // Open Modal
        fireEvent.click(screen.getByText('Metas Extras'));

        // Increase Anki count to 10
        // Find Anki section by the header text
        const ankiHeader = screen.getByText(/Anki \(Meta: 15\)/i);
        const ankiContainer = ankiHeader.parentElement!; // The div containing header and controls
        // Find the Up arrow in this container (2nd button)
        const ankiButtons = within(ankiContainer).getAllByRole('button');
        const ankiUp = ankiButtons[1];

        for (let i = 0; i < 10; i++) {
            fireEvent.click(ankiUp);
        }

        // Increase NCM count to 5
        const ncmHeader = screen.getByText(/NCM \(Meta: 20\)/i);
        const ncmContainer = ncmHeader.parentElement!;
        const ncmButtons = within(ncmContainer).getAllByRole('button');
        const ncmUp = ncmButtons[1];

        for (let i = 0; i < 5; i++) {
            fireEvent.click(ncmUp);
        }

        // Save
        fireEvent.click(screen.getByText('Salvar Sessão Extra'));

        // Verify Progress in "Progresso Semanal" (which is in the HISTORY tab, active after save)

        // Total points = 10 + 5 = 15
        // Text should be "15 / 250 pts" (assuming default goals)
        expect(screen.getByText(/15 \/ 250 pts/)).toBeInTheDocument();

        // Verify visual marker based on Weekly Goal (125 - 15 = 110)
        expect(screen.getByText(/Faltam 110 pts para meta/)).toBeInTheDocument();
    });
});
