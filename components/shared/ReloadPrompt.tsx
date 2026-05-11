import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('[PWA] SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-slate-800 border border-slate-700 shadow-2xl rounded-2xl p-4 pr-12 max-w-sm relative">
        {needRefresh ? (
          <div>
            <div className="flex items-center gap-3 mb-2 text-cyan-400">
              <RefreshCw className="animate-spin" size={20} />
              <h3 className="font-bold">Nova atualização disponível!</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Uma nova versão do aplicativo foi baixada e está pronta para uso. Clique no botão abaixo para atualizar a página.
            </p>
            <button
              onClick={() => updateServiceWorker(true)}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-medium py-2 rounded-xl transition-colors"
            >
              Atualizar Agora
            </button>
          </div>
        ) : (
          <div>
            <h3 className="font-bold text-emerald-400 mb-1">App pronto para offline!</h3>
            <p className="text-sm text-slate-400">O aplicativo foi armazenado em cache para uso sem internet.</p>
          </div>
        )}

        <button
          onClick={close}
          className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
          aria-label="Fechar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
