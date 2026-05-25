import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReloadPrompt } from '../../components/shared/ReloadPrompt';
import { pwaRegisterReactMock } from '../mocks/pwaRegisterReact';

describe('ReloadPrompt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pwaRegisterReactMock.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('checks for service worker updates while the app is open', () => {
    render(<ReloadPrompt />);

    expect(pwaRegisterReactMock.registrationUpdate).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(pwaRegisterReactMock.registrationUpdate).toHaveBeenCalledTimes(2);
  });

  it('shows an accessible update button when a new service worker is waiting', () => {
    pwaRegisterReactMock.needRefresh = true;
    render(<ReloadPrompt />);

    fireEvent.click(screen.getByRole('button', { name: /atualizar aplicativo/i }));

    expect(pwaRegisterReactMock.updateServiceWorker).toHaveBeenCalledWith(true);
  });
});
