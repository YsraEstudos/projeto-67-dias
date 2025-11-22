import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { ViewState } from '../types';

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
    AuthView: ({ onLogin }: { onLogin: (user: any) => void }) => (
        <div data-testid="auth-view">
            <button onClick={() => onLogin({ uid: '123', name: 'Test User', isGuest: false })}>Login</button>
        </div>
    )
}));

describe('App Component', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders AuthView when user is not logged in', () => {
        render(<App />);
        expect(screen.getByTestId('auth-view')).toBeInTheDocument();
    });

    it('logs in and renders Dashboard', async () => {
        render(<App />);

        // Click login
        fireEvent.click(screen.getByText('Login'));

        // Check if Dashboard is rendered
        await waitFor(() => {
            expect(screen.getByText('Projeto 67 Dias')).toBeInTheDocument();
            expect(screen.getByText('Test User')).toBeInTheDocument();
        });
    });

    it('navigates to Work View', async () => {
        render(<App />);
        fireEvent.click(screen.getByText('Login'));

        await waitFor(() => {
            expect(screen.getByText('Trabalho')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Trabalho'));

        await waitFor(() => {
            expect(screen.getByTestId('work-view')).toBeInTheDocument();
        });
    });

    it('navigates back to Dashboard from Work View', async () => {
        render(<App />);
        fireEvent.click(screen.getByText('Login'));

        await waitFor(() => {
            expect(screen.getByText('Trabalho')).toBeInTheDocument();
        });

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
        // Mock confirm dialog
        window.confirm = vi.fn(() => true);

        render(<App />);
        fireEvent.click(screen.getByText('Login'));

        await waitFor(() => {
            expect(screen.getByText('Projeto 67 Dias')).toBeInTheDocument();
        });

        const logoutButton = screen.getByTitle('Sair');
        fireEvent.click(logoutButton);

        expect(window.confirm).toHaveBeenCalled();

        await waitFor(() => {
            expect(screen.getByTestId('auth-view')).toBeInTheDocument();
        });
    });
});
