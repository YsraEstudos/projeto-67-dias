import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('[PWA] SW registration error', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <button
      onClick={() => updateServiceWorker(true)}
      title="Atualização disponível. Clique para aplicar."
      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-cyan-900/30 border border-cyan-800/50 transition-all hover:bg-cyan-800/50 hover:border-cyan-500/50 animate-in fade-in zoom-in group cursor-pointer"
    >
      <RefreshCw size={14} className="text-cyan-400 animate-[spin_3s_linear_infinite]" />
      <span className="text-[10px] font-medium text-cyan-400 hidden sm:inline">Atualizar</span>
    </button>
  );
}

