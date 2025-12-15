import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import type { User } from '../types';

// Mock lazy loaded components
vi.mock('../components/views/WorkView', () => ({ default: () => <div data-testid="work-view">Work View</div> }));
vi.mock('../components/views/RestView', () => ({ default: () => <div data-testid="rest-view">Rest View</div> }));
vi.mock('../components/views/ToolsView', () => ({ default: () => <div data-testid="tools-view">Tools View</div> }));
vi.mock('../components/views/ReadingView', () => ({ default: () => <div data-testid="reading-view">Reading View</div> }));
vi.mock('../components/views/ProgressView', () => ({ default: () => <div data-testid="progress-view">Progress View</div> }));
vi.mock('../components/views/HabitsView', () => ({ default: () => <div data-testid="habits-view">Habits View</div> }));
vi.mock('../components/views/JournalView', () => ({ default: () => <div data-testid="journal-view">Journal View</div> }));
vi.mock('../components/views/SkillsView', () => ({ default: () => <div data-testid="skills-view">Skills View</div> }));
vi.mock('../components/views/SettingsView', () => ({ default: () => <div data-testid="settings-view">Settings View</div> }));
vi.mock('../components/views/LinksView', () => ({ default: () => <div data-testid="links-view">Links View</div> }));
vi.mock('../components/views/SundayView', () => ({ default: () => <div data-testid="sunday-view">Sunday View</div> }));
vi.mock('../components/views/AuthView', () => ({
    AuthView: () => <div data-testid="auth-view">Auth View</div>
}));

const mockUseAuth = vi.fn();

vi.mock('../hooks/useAuth', () => ({
    useAuth: () => mockUseAuth()
}));

type MockFn = ReturnType<typeof vi.fn>;

interface MockAuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: MockFn;
    register: MockFn;
    loginGoogle: MockFn;
    loginGuest: MockFn;
    logout: MockFn;
    sendResetEmail: MockFn;
    clearError: MockFn;
}

const createAuthState = (overrides: Partial<MockAuthState> = {}): MockAuthState => ({
    user: null,
    loading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    loginGoogle: vi.fn(),
    loginGuest: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    sendResetEmail: vi.fn(),
    clearError: vi.fn(),
    ...overrides
});

const mockUser: User = {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
    isGuest: false
};

describe('App Component', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        mockUseAuth.mockReset();
    });

    it('renders AuthView when user is not logged in', async () => {
        mockUseAuth.mockReturnValue(createAuthState());

        render(<App />);
        await waitFor(() => {
            expect(screen.getByTestId('auth-view')).toBeInTheDocument();
        });
    });

    it('logs in and renders Dashboard', async () => {
        mockUseAuth.mockReturnValue(createAuthState({ user: mockUser }));

        render(<App />);

        await waitFor(() => {
            expect(screen.getByText('Projeto 67 Dias')).toBeInTheDocument();
            expect(screen.getByText('Test User')).toBeInTheDocument();
        });
    });

    it('navigates to Work View', async () => {
        mockUseAuth.mockReturnValue(createAuthState({ user: mockUser }));

        render(<App />);

        fireEvent.click(screen.getByText('Trabalho'));

        await waitFor(() => {
            expect(screen.getByTestId('work-view')).toBeInTheDocument();
        });
    });

    it('navigates back to Dashboard from Work View', async () => {
        mockUseAuth.mockReturnValue(createAuthState({ user: mockUser }));

        render(<App />);

        fireEvent.click(screen.getByText('Trabalho'));

        await waitFor(() => {
            expect(screen.getByTestId('work-view')).toBeInTheDocument();
        });

        const backButton = screen.getByLabelText('Voltar');
        fireEvent.click(backButton);

        await waitFor(() => {
            expect(screen.getByText('Projeto 67 Dias')).toBeInTheDocument();
        });
    });

    it('logs out correctly', async () => {
        const logoutMock = vi.fn().mockResolvedValue(undefined);

        let currentState = createAuthState({ user: mockUser, logout: logoutMock });
        mockUseAuth.mockImplementation(() => currentState);

        const { rerender } = render(<App />);

        const logoutButton = screen.getByTitle('Sair');
        fireEvent.click(logoutButton);

        // ConfirmModal should appear
        await waitFor(() => {
            expect(screen.getByText('Sair da conta')).toBeInTheDocument();
        });

        // Click the confirm button in the modal (second button with "Sair" text)
        const sairButtons = screen.getAllByRole('button', { name: 'Sair' });
        const confirmButton = sairButtons[sairButtons.length - 1]; // Modal confirm button is the last one
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(logoutMock).toHaveBeenCalled();
        });

        currentState = createAuthState();
        rerender(<App />);

        await waitFor(() => {
            expect(screen.getByTestId('auth-view')).toBeInTheDocument();
        });
    });
});
