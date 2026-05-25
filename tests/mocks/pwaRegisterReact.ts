import { vi } from 'vitest';

export const pwaRegisterReactMock = {
    needRefresh: false,
    updateServiceWorker: vi.fn(),
    registrationUpdate: vi.fn(),
    reset() {
        this.needRefresh = false;
        this.updateServiceWorker.mockClear();
        this.registrationUpdate.mockClear();
    },
};

export const useRegisterSW = vi.fn((options = {}) => {
    const registerOptions = options as {
        onRegisteredSW?: (swUrl: string, registration: ServiceWorkerRegistration) => void;
    };

    registerOptions.onRegisteredSW?.('/sw.js', {
        update: pwaRegisterReactMock.registrationUpdate,
    } as unknown as ServiceWorkerRegistration);

    return {
        needRefresh: [pwaRegisterReactMock.needRefresh, vi.fn()],
        offlineReady: [false, vi.fn()],
        updateServiceWorker: pwaRegisterReactMock.updateServiceWorker,
    };
});
