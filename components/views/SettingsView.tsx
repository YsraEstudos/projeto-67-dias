
import React, { useRef, useState } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Database, Download, Upload, Trash2, ShieldCheck, Info, AlertTriangle, RotateCcw, CheckSquare, Square, X, Settings as SettingsIcon, RefreshCw, User, Mail, Shield } from 'lucide-react';
import { ProjectConfig } from '../../types';
import { readNamespacedStorage, writeNamespacedStorage, removeNamespacedStorage } from '../../hooks/useStorage';
import { useConfigStore, useStreakStore } from '../../stores';
import { useAuth } from '../../hooks/useAuth';
import { forceFlush } from '../../stores/persistMiddleware';
import { LoadingSimple } from '../shared/Loading';
import { StreakCard } from '../settings/StreakCard';
import { DataManagementSection } from '../settings/DataManagementSection';

const DataManagementModal = React.lazy(() => import('../modals/DataManagementModal').then(m => ({ default: m.DataManagementModal })));
const ResetProjectModal = React.lazy(() => import('../modals/ResetProjectModal'));


const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const storageScope = user?.id ?? null;
  const { config, setConfig } = useConfigStore();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  const handleClearData = () => {
    if (confirm("ATENÇÃO: Isso apagará TODOS os seus dados (tarefas, diário, skills, etc) deste navegador. Essa ação é irreversível. Deseja continuar?")) {
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

          {/* Streak System Card */}
          <StreakCard />

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
                <p className="text-sm text-slate-400">Seus dados são armazenados localmente no navegador.</p>
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
            onClose={() => setIsResetModalOpen(false)}
            onConfirm={async (options) => {
              // Reset Start Date - criar novo config com startDate de AGORA
              // Incrementar contador de reinícios
              const newStartDate = new Date().toISOString();
              // Create new config object
              const newConfig: ProjectConfig = {
                ...config,
                startDate: newStartDate,
                restartCount: (config.restartCount ?? 0) + 1
              };

              // Apply changes to both the current user scope and the guest fallback to avoid stale hydrations
              const storageScopes = Array.from(new Set([storageScope, null]));

              // 1. ATOMIC WRITE: Prepared persisted value
              const stateToPersist = {
                state: {
                  config: newConfig,
                  isLoading: false // Ensure loading is false on restore
                },
                version: 0
              };
              const stringifiedState = JSON.stringify(stateToPersist);

              // 2. CRITICAL: Write directly to storage with metadata to prevent race conditions
              // We write to both specific user scope AND default scope if they differ, just to be safe
              storageScopes.forEach(scope => {
                writeNamespacedStorage('p67_project_config', stringifiedState, scope);
              });

              // Force metadata update to now to ensure this "wins" against any cloud sync
              const now = Date.now();
              // Import writeLocalMeta from storage utils if needed, or use the exposed helper
              // Since we don't have writeLocalMeta exposed directly here, we rely on writeNamespacedStorage 
              // which keeps local state. 

              // 3. Update Zustand state immediately
              setConfig(newConfig);

              // Clear selected data
              storageScopes.forEach(scope => {
                // Core Data Options
                if (!options.keepBooks) removeNamespacedStorage('p67_books', scope);
                if (!options.keepSkills) removeNamespacedStorage('p67_skills', scope);
                if (!options.keepLinks) removeNamespacedStorage('p67_links', scope);

                // Habits & Tasks
                if (!options.keepHabits) {
                  removeNamespacedStorage('p67_habits', scope); // Old legacy just in case
                  removeNamespacedStorage('p67_habits_store', scope); // Current store
                  removeNamespacedStorage('p67_tasks', scope); // Legacy task store
                }

                // Journal & Reviews
                if (!options.keepJournal) {
                  removeNamespacedStorage('p67_journal', scope); // Old legacy
                  removeNamespacedStorage('p67_journal_store', scope); // Current store
                  removeNamespacedStorage('p67_review_store', scope); // Weekly reviews
                }

                // Planning (Sunday & Tasks)
                if (!options.keepPlanning) {
                  removeNamespacedStorage('p67_sunday_store', scope);
                  removeNamespacedStorage('p67_sunday_tasks', scope);
                }

                // NOTE: We NEVER delete 'p67_notes_store' (Notes & Tags) - deemed critical user data
                // NOTE: 'p67_games_store', 'p67_water_store', 'p67_rest_store' are also deemed permanent unless wiped manually

                // Clear streak data on reset (ALWAYS RESET STREAK on Restart)
                removeNamespacedStorage('p67_streak_store', scope);
              });

              // Reset streak in Zustand store
              useStreakStore.getState().resetStreak();

              // 4. Force synchronous flush to ensures it hits Firebase/LocalStorage before unload
              await forceFlush('p67_project_config');

              // 5. Reload to apply cleanly
              window.location.reload();
            }}
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
