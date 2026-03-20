import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const DEV_SW_RESET_KEY = 'p67-dev-sw-reset';

const disablePwaInDev = async (): Promise<boolean> => {
  if (
    !import.meta.env.DEV ||
    import.meta.env.VITE_ENABLE_PWA_DEV === 'true' ||
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator)
  ) {
    return false;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  const sameOriginRegistrations = registrations.filter((registration) => {
    try {
      return new URL(registration.scope).origin === window.location.origin;
    } catch {
      return false;
    }
  });

  if (sameOriginRegistrations.length === 0) {
    window.sessionStorage.removeItem(DEV_SW_RESET_KEY);
    return false;
  }

  await Promise.all(sameOriginRegistrations.map((registration) => registration.unregister()));

  if ('caches' in window) {
    const cacheKeys = await window.caches.keys();
    await Promise.all(
      cacheKeys
        .filter(
          (cacheKey) =>
            cacheKey.startsWith('workbox-') ||
            cacheKey.includes('google-fonts') ||
            cacheKey.includes(window.location.origin),
        )
        .map((cacheKey) => window.caches.delete(cacheKey)),
    );
  }

  if (!window.sessionStorage.getItem(DEV_SW_RESET_KEY)) {
    window.sessionStorage.setItem(DEV_SW_RESET_KEY, '1');
    window.location.reload();
    return true;
  }

  window.sessionStorage.removeItem(DEV_SW_RESET_KEY);
  return false;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const boot = async () => {
  const reloadingForDevPwaReset = await disablePwaInDev();
  if (reloadingForDevPwaReset) {
    return;
  }

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

void boot();
