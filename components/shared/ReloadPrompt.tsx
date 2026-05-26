import React, { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UPDATE_CHECK_INTERVAL_MS = 60 * 1000;

export function ReloadPrompt() {
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>();

  useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      registrationRef.current = registration;
      console.log('[PWA] SW Registered:', registration);
    },
    onRegisterError(error) {
      console.log('[PWA] SW registration error', error);
    },
  });

  // With autoUpdate + skipWaiting, the new SW activates automatically.
  // When the controller changes, reload the page so fresh assets load.
  useEffect(() => {
    const handleControllerChange = () => {
      console.log('[PWA] New SW activated, reloading for fresh assets...');
      window.location.reload();
    };

    navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange);
    return () => {
      navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // Periodically check for a new SW version in the background.
  useEffect(() => {
    const checkForUpdate = () => {
      if (document.visibilityState === 'hidden' || !navigator.onLine) return;
      void registrationRef.current?.update();
    };

    const intervalId = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
    window.addEventListener('focus', checkForUpdate);
    window.addEventListener('online', checkForUpdate);
    document.addEventListener('visibilitychange', checkForUpdate);
    checkForUpdate();

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', checkForUpdate);
      window.removeEventListener('online', checkForUpdate);
      document.removeEventListener('visibilitychange', checkForUpdate);
    };
  }, []);

  // With autoUpdate the SW handles itself — nothing to render.
  return null;
}
