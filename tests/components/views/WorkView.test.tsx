import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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
        const metTargetButton = screen.getByRole('button', { name: /Bati a Meta/i });
        fireEvent.click(metTargetButton);

        // Verify the modal opened
        expect(screen.getByText('Sessão Atual')).toBeInTheDocument();
        expect(screen.getByText('Histórico')).toBeInTheDocument();
    });

    it('starts and pauses the timer', async () => {
        render(<WorkView />);
        fireEvent.click(screen.getByText('Bati a Meta'));

        const startButton = screen.getByText('Iniciar');
        fireEvent.click(startButton);

        expect(screen.getByText('Pausar')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Pausar'));
        expect(screen.getByText('Iniciar')).toBeInTheDocument();
    });

    it('displays Anki and NCM counters', () => {
        render(<WorkView />);
        fireEvent.click(screen.getByText('Bati a Meta'));

        expect(screen.getByText('Anki (Meta: 15)')).toBeInTheDocument();
        expect(screen.getByText('NCM (Meta: 20)')).toBeInTheDocument();
    });

    it('saves a session and shows it in history', async () => {
        render(<WorkView />);
        fireEvent.click(screen.getByText('Bati a Meta'));

        // Click Save
        fireEvent.click(screen.getByText('Salvar Sessão Extra'));

        // Should switch to History tab automatically and show the entry
        // We look for the text pattern "Anki: 0 | NCM: 0"
        expect(screen.getByText(/Anki: 0 \| NCM: 0/)).toBeInTheDocument();
    });
});
