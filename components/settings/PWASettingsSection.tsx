/**
 * PWA Settings Section
 * 
 * Displays PWA installation status and provides install button.
 * Shows different UI based on: installable, installed, not supported, iOS.
 */
import React from 'react';
import { Download, CheckCircle, Wifi, WifiOff, Smartphone, Monitor, Share } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

// Detect iOS for special instructions
const isIOS = () => {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Detect Safari on iOS
const isIOSSafari = () => {
    if (!isIOS()) return false;
    const ua = navigator.userAgent;
    return /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
};

export const PWASettingsSection: React.FC = () => {
    const { isInstallable, isInstalled, isOnline, isSupported, promptInstall } = usePWA();
    const [isInstalling, setIsInstalling] = React.useState(false);

    const handleInstall = async () => {
        setIsInstalling(true);
        try {
            await promptInstall();
        } finally {
            setIsInstalling(false);
        }
    };

    // Detect device type for appropriate messaging
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const deviceLabel = isMobile ? 'celular' : 'computador';
    const DeviceIcon = isMobile ? Smartphone : Monitor;

    return (
        <div className="p-6 space-y-6">
            {/* Online/Offline Status */}
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${isOnline
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                {isOnline ? (
                    <>
                        <Wifi className="w-5 h-5 text-emerald-400" />
                        <div>
                            <p className="text-sm font-medium text-emerald-400">Online</p>
                            <p className="text-xs text-slate-400">Dados sincronizando normalmente</p>
                        </div>
                    </>
                ) : (
                    <>
                        <WifiOff className="w-5 h-5 text-amber-400" />
                        <div>
                            <p className="text-sm font-medium text-amber-400">Modo Offline</p>
                            <p className="text-xs text-slate-400">Alterações serão sincronizadas ao reconectar</p>
                        </div>
                    </>
                )}
            </div>

            {/* Installation Status/Action */}
            {isInstalled ? (
                // Already installed
                <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <CheckCircle className="w-6 h-6 text-purple-400" />
                    <div>
                        <p className="text-sm font-medium text-purple-400">App Instalado</p>
                        <p className="text-xs text-slate-400">
                            Acesse pela tela inicial do seu {deviceLabel}
                        </p>
                    </div>
                </div>
            ) : isInstallable ? (
                // Can install
                <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                        <DeviceIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-white">Instale o App</p>
                            <p className="text-xs text-slate-400 mt-1">
                                Adicione o Projeto 67 Dias à tela inicial do seu {deviceLabel} para acesso rápido,
                                mesmo offline.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleInstall}
                        disabled={isInstalling}
                        className={`
              w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
              font-medium transition-all
              ${isInstalling
                                ? 'bg-purple-500/50 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-500 active:scale-[0.98]'
                            }
            `}
                    >
                        <Download className="w-5 h-5" />
                        {isInstalling ? 'Instalando...' : 'Instalar Aplicativo'}
                    </button>
                </div>
            ) : isIOS() ? (
                // iOS special instructions
                <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                        <Smartphone className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-white">Instalar no iPhone/iPad</p>
                            <p className="text-xs text-slate-400 mt-2">
                                {isIOSSafari() ? (
                                    <>
                                        Para instalar, toque em{' '}
                                        <Share className="w-3.5 h-3.5 inline-block mx-1 text-blue-400" />
                                        <span className="text-blue-400">Compartilhar</span> na barra inferior,
                                        depois em <span className="text-blue-400">"Adicionar à Tela Inicial"</span>.
                                    </>
                                ) : (
                                    <>
                                        Abra este site no <span className="text-blue-400">Safari</span>,
                                        depois toque em Compartilhar → "Adicionar à Tela Inicial".
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            ) : !isSupported ? (
                // Not supported
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                    <DeviceIcon className="w-6 h-6 text-slate-500 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-slate-400">Navegador não suportado</p>
                        <p className="text-xs text-slate-500">
                            Use Chrome, Edge ou Safari para instalar o app
                        </p>
                    </div>
                </div>
            ) : (
                // Waiting for prompt (may not be offered by browser)
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                    <DeviceIcon className="w-6 h-6 text-slate-500 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-slate-400">Instalação não disponível</p>
                        <p className="text-xs text-slate-500">
                            O navegador não ofereceu a instalação. Tente recarregar a página.
                        </p>
                    </div>
                </div>
            )}
            {/* Debug Info (Temporary) */}
            <div className="mt-8 p-4 bg-gray-900 rounded-lg text-xs font-mono text-gray-400">
                <p className="font-bold text-gray-300 mb-2">Debug PWA Status:</p>
                <p>isInstallable: {String(isInstallable)}</p>
                <p>isInstalled: {String(isInstalled)}</p>
                <p>isSupported: {String(isSupported)}</p>
                <p>isOnline: {String(isOnline)}</p>
                <p>Secure Context: {typeof window !== 'undefined' ? String(window.isSecureContext) : '?'}</p>
                <p>SW Controller: {typeof navigator !== 'undefined' && navigator.serviceWorker?.controller ? 'Active' : 'None'}</p>
            </div>
        </div>
    );
};

export default PWASettingsSection;
