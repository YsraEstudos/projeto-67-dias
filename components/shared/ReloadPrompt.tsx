import React, { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

const UPDATE_CHECK_INTERVAL_MS = 60 * 1000;

export function ReloadPrompt() {
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      registrationRef.current = registration;
      console.log('[PWA] SW Registered:', registration);
    },
    onRegisterError(error) {
      console.log('[PWA] SW registration error', error);
    },
  });

  useEffect(() => {
    const checkForUpdate = () => {
      if (document.visibilityState === 'hidden' || !navigator.onLine) {
        return;
      }

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

  if (!needRefresh) return null;

  return (
    <button
      onClick={() => updateServiceWorker(true)}
      aria-label="Atualizar aplicativo"
      title="Atualização disponível. Clique para aplicar."
      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-cyan-900/30 border border-cyan-800/50 transition-all hover:bg-cyan-800/50 hover:border-cyan-500/50 animate-in fade-in zoom-in group cursor-pointer"
    >
      <RefreshCw size={14} className="text-cyan-400 animate-[spin_3s_linear_infinite]" />
      <span className="text-[10px] font-medium text-cyan-400 hidden sm:inline">Atualizar</span>
    </button>
  );
}
