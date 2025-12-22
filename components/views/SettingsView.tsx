
import React, { useState } from 'react';
import { Database, Trash2, ShieldCheck, Info, AlertTriangle, RotateCcw, Settings as SettingsIcon, RefreshCw, User, Mail, Shield, CalendarDays } from 'lucide-react';
import { useConfigStore } from '../../stores';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSimple } from '../shared/Loading';
import { StreakCard } from '../settings/StreakCard';
import { DataManagementSection } from '../settings/DataManagementSection';

import { OffensiveSettingsSection } from '../settings/OffensiveSettingsSection';
import { ThemeSettingsSection } from '../settings/ThemeSettingsSection';

const DataManagementModal = React.lazy(() => import('../modals/DataManagementModal').then(m => ({ default: m.DataManagementModal })));
const ResetProjectModal = React.lazy(() => import('../modals/ResetProjectModal'));


const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const storageScope = user?.id ?? null;
  const { config, setConfig } = useConfigStore();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  const handleClearData = () => {
    if (confirm("Isto limpa apenas o cache local deste navegador. Seus dados no Firestore permanecem, mas você precisará re-sincronizar após o reload. Continuar?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Configurações</h2>
        <p className="text-slate-400">Gerencie seus dados e preferências do sistema.</p>
      </div>

      {/* Content */}
      <div className="animate-in fade-in duration-300">
        <div className="space-y-6">
          {/* Account Info Card - Mostra nome do usuário (especialmente importante para mobile) */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
            <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-indigo-500/20 rounded-full">
                  <User size={24} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white truncate">{user?.name || 'Usuário'}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    {user?.email ? (
                      <>
                        <Mail size={14} className="flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </>
                    ) : (
                      <span>{user?.isGuest ? 'Conta de Visitante' : 'Conta Autenticada'}</span>
                    )}
                  </div>
                </div>
                <span className={`flex-shrink-0 text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-full ${user?.isGuest
                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                  {user?.isGuest ? 'Visitante' : 'Membro'}
                </span>
              </div>
              {user?.isGuest && (
                <div className="mt-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Shield size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-300/80">
                      Seus dados estão salvos apenas neste dispositivo. Crie uma conta para sincronizar entre dispositivos.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* System Info Card */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
            <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                <Info size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Informações do Sistema</h3>
                <p className="text-sm text-slate-400">Status das integrações e versão.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-emerald-400" size={20} />
                  <span className="text-slate-300 font-medium">Google Gemini AI</span>
                </div>
                <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">
                  ATIVO (ENV VAR)
                </span>
              </div>
              <p className="text-xs text-slate-500 px-1">
                A inteligência artificial está configurada via variáveis de ambiente seguras. Nenhuma ação é necessária.
              </p>

              {/* Contador de Reinícios */}
              <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <RefreshCw className="text-orange-400" size={20} />
                  <div>
                    <span className="text-slate-300 font-medium">Reinícios do Plano</span>
                    <p className="text-xs text-slate-500">Vezes que você recomeçou sem completar os 67 dias</p>
                  </div>
                </div>
                <span className="text-lg font-bold bg-orange-500/10 text-orange-400 px-3 py-1.5 rounded-lg border border-orange-500/20 min-w-[3rem] text-center">
                  {config.restartCount ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Challenge Settings Card */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
            <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <CalendarDays size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Configurações do Desafio</h3>
                <p className="text-sm text-slate-400">Defina as datas do seu projeto de 67 dias.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Data de Início</label>
                  <input
                    type="date"
                    value={config.startDate ? config.startDate.split('T')[0] : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const newDate = new Date(e.target.value + 'T00:00:00');
                        setConfig({ startDate: newDate.toISOString() });
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Data de Término</label>
                  <div className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300">
                    {config.startDate
                      ? new Date(new Date(config.startDate).getTime() + 67 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
                      : '-'}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Calculado automaticamente (67 dias)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Streak System Card */}
          <StreakCard />

          {/* Theme Settings Card */}
          <ThemeSettingsSection />

          {/* Offensive Settings Card */}
          <OffensiveSettingsSection />

          {/* Sync & Defaults Section */}
          <DataManagementSection />

          {/* Advanced Data (Backup & Reset) */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
            <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Database size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Gerenciamento de Dados</h3>
                <p className="text-sm text-slate-400">Dados sincronizados pelo Firestore com cache offline automático. Use esta área para backup/import ou limpar o cache local.</p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col justify-between md:col-span-2">
                <div className="mb-4">
                  <h4 className="text-white font-medium flex items-center gap-2 mb-2">
                    <Database size={18} className="text-blue-400" /> Central de Backup
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Exporte seus dados para segurança ou importe backups anteriores.
                    Agora você pode escolher exatamente o que deseja salvar ou restaurar.
                  </p>
                </div>
                <button
                  onClick={() => setIsDataModalOpen(true)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                >
                  <SettingsIcon size={16} /> Gerenciar Dados (Importar / Exportar)
                </button>
              </div>

              {/* Reset Project Option */}
              <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col justify-between">
                <div className="mb-4">
                  <h4 className="text-white font-medium flex items-center gap-2 mb-2">
                    <RotateCcw size={18} className="text-orange-400" /> Reiniciar Projeto
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Volte ao Dia 1. Você pode escolher manter seus livros e habilidades, mas reiniciará a contagem e tarefas.
                  </p>
                </div>
                <button
                  onClick={() => setIsResetModalOpen(true)}
                  className="w-full py-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 hover:border-orange-500/50 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <SettingsIcon size={16} />
                  Opções de Reset
                </button>
              </div>

              <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col justify-between md:col-span-2">
                <div className="mb-4">
                  <h4 className="text-white font-medium flex items-center gap-2 mb-2">
                    <Trash2 size={18} className="text-red-400" /> Zona de Perigo
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Limpar todo o armazenamento local. Isso resetará o aplicativo para o estado inicial.
                  </p>
                </div>
                <button
                  onClick={handleClearData}
                  className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/50 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={14} /> Limpar Tudo (Fábrica)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isResetModalOpen && (
        <React.Suspense fallback={<LoadingSimple />}>
          <ResetProjectModal
            isOpen={isResetModalOpen}
            onClose={() => setIsResetModalOpen(false)}
          />
        </React.Suspense>
      )}

      {isDataModalOpen && (
        <React.Suspense fallback={<LoadingSimple />}>
          <DataManagementModal
            isOpen={isDataModalOpen}
            onClose={() => setIsDataModalOpen(false)}
            userId={storageScope}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default SettingsView;
