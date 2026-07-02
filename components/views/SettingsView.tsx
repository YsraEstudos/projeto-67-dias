
import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, Info, AlertTriangle, RotateCcw, Settings as SettingsIcon, RefreshCw, User, Mail, Shield, CalendarDays, Flame, Palette, Target, Smartphone, HardDrive, Image, X } from 'lucide-react';
import { useConfigStore } from '../../stores';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSimple } from '../shared/Loading';
import { StreakCard } from '../settings/StreakCard';
import { DataManagementSection } from '../settings/DataManagementSection';
import { OffensiveSettingsSection } from '../settings/OffensiveSettingsSection';
import { ThemeSettingsSection } from '../settings/ThemeSettingsSection';
import { PWASettingsSection } from '../settings/PWASettingsSection';
import { SettingsCategory } from '../settings/SettingsCategory';
import { getUsageStats, subscribeToQuotaChanges, getDailyLimit } from '../../utils/firestoreQuota';
import { MAX_IMAGE_SIZE } from '../../utils/imageUtils';

const DataManagementModal = React.lazy(() => import('../modals/DataManagementModal').then(m => ({ default: m.DataManagementModal })));
const ResetProjectModal = React.lazy(() => import('../modals/ResetProjectModal'));

const MODULE_NAME_MAPPING: Record<string, string> = {
  'p67_project_config': 'Configuração do Desafio',
  'p67_habits_store': 'Hábitos & Rotinas',
  'p67_work_store': 'Trabalho & Foco',
  'p67_notes_store': 'Notas & Anotações',
  'p67_notes_store_items': 'Itens de Notas',
  'p67_sunday_store': 'Domingo de Planejamento',
  'p67_journal_store': 'Diário',
  'p67_links_store': 'Links Úteis',
  'p67_skills_store': 'Habilidades',
  'p67_reading_store': 'Leitura de Livros',
  'p67_rest_store': 'Descanso / Lazer',
  'p67_prompts_store': 'Prompts IA',
  'games-storage': 'Jogos / Exercícios',
  'p67_games_store': 'Jogos / Desafios',
  'p67_review_store': 'Revisão Periódica',
  'p67_water_store': 'Consumo de Água',
  'p67_streak_store': 'Ofensivas (Streaks)',
  'p67_tool_timer': 'Timer de Ferramentas',
  'p67_site_categories_store': 'Categorias de Sites',
  'p67_sites_store': 'Sites Favoritos',
  'p67_site_folders_store': 'Pastas de Sites',
  'p67_sunday_timer': 'Timer de Domingo',
  'p67_goals_store': 'Metas do Desafio',
  'p67_competition_store': 'Competição / Ranking',
  'p67_daily_planner_store': 'Planejador Diário',
  'pomodoro-storage': 'Timer Pomodoro',
  'p67_aulas_config': 'Configuração de Aulas',
  'p67_aulas_books': 'Livros de Aulas',
  'p67_firestore_quota': 'Sincronização de Cotas',
};

const getFriendlyModuleName = (key: string): string => {
  if (MODULE_NAME_MAPPING[key]) {
    return MODULE_NAME_MAPPING[key];
  }
  return key
    .replace(/^p67_/, '')
    .replace(/_store$/, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const storageScope = user?.id ?? null;
  const { config, setConfig } = useConfigStore();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [showStartConfirmation, setShowStartConfirmation] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [quotaStats, setQuotaStats] = useState(getUsageStats());

  // Subscribe to quota changes for real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToQuotaChanges(() => {
      setQuotaStats(getUsageStats());
    });
    return unsubscribe;
  }, []);

  const handleStartProject = () => {
    setConfig({ isProjectStarted: true });
    setShowStartConfirmation(false);
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };



  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Configurações</h2>
        <p className="text-slate-400">Toque em uma categoria para ver as opções.</p>
      </div>

      {/* Categories */}
      <div className="animate-in fade-in duration-300">
        <div className="space-y-4">

          {/* ACCOUNT CATEGORY */}
          <SettingsCategory
            id="account"
            title="Conta"
            description={user?.name || 'Informações do usuário'}
            icon={<User size={22} className="text-indigo-400" />}
            iconBgColor="bg-indigo-500/20"
            isExpanded={expandedCategories.has('account')}
            onToggle={() => toggleCategory('account')}
          >
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
          </SettingsCategory>

          {/* CHALLENGE CATEGORY */}
          <SettingsCategory
            id="challenge"
            title="Desafio 67 Dias"
            description="Datas, streaks e metas do projeto"
            icon={<CalendarDays size={22} className="text-purple-400" />}
            iconBgColor="bg-purple-500/20"
            isExpanded={expandedCategories.has('challenge')}
            onToggle={() => toggleCategory('challenge')}
          >
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data de Início
                    {config.isProjectStarted && (
                      <span className="ml-2 text-xs font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                        🔒 Bloqueado
                      </span>
                    )}
                  </label>

                  {config.isProjectStarted ? (
                    <div className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300">
                      {config.startDate
                        ? new Date(config.startDate).toLocaleDateString('pt-BR')
                        : '-'}
                    </div>
                  ) : (
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
                  )}

                  {!config.isProjectStarted && (
                    <p className="text-xs text-slate-500 mt-1">
                      Escolha a data de início antes de iniciar o projeto
                    </p>
                  )}
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

            {/* Start Project Button or Status */}
            {!config.isProjectStarted ? (
              <div className="p-6 border-t border-slate-700">
                <button
                  onClick={() => setShowStartConfirmation(true)}
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 border border-violet-500/20 flex items-center justify-center gap-2 group"
                >
                  <Flame size={18} />
                  Iniciar Projeto de 67 Dias
                </button>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Após iniciar, a data de início ficará bloqueada para evitar alterações acidentais.
                </p>
              </div>
            ) : (
              <div className="p-4 mx-6 mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck size={18} />
                  <span className="text-sm font-medium">Projeto em andamento!</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Data de início bloqueada. Para alterar, use "Reiniciar Projeto" na seção Dados.
                </p>
              </div>
            )}

            {/* Streak Card embedded */}
            <StreakCard />
          </SettingsCategory>

          {/* SYSTEM CATEGORY */}
          <SettingsCategory
            id="system"
            title="Sistema"
            description="Integrações e informações técnicas"
            icon={<Info size={22} className="text-cyan-400" />}
            iconBgColor="bg-cyan-500/20"
            isExpanded={expandedCategories.has('system')}
            onToggle={() => toggleCategory('system')}
          >
            <div className="p-6 space-y-4">

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

              {/* Firestore Usage Quota */}
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HardDrive className={`${quotaStats.isWarning ? 'text-amber-400' : quotaStats.isExceeded ? 'text-red-400' : 'text-cyan-400'}`} size={20} />
                    <div>
                      <span className="text-slate-300 font-medium">Uso do Firestore Hoje</span>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-x-2 text-xs text-slate-500">
                        <span>{quotaStats.total.toLocaleString('pt-BR')} de {getDailyLimit().toLocaleString('pt-BR')} operações</span>
                        <span className="hidden sm:inline text-slate-700">•</span>
                        <span>(L: {quotaStats.reads.toLocaleString('pt-BR')} | G: {quotaStats.writes.toLocaleString('pt-BR')})</span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-bold px-2 py-1 rounded ${quotaStats.isExceeded
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : quotaStats.isWarning
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    }`}>
                    {quotaStats.percentage.toFixed(1)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${quotaStats.isExceeded
                      ? 'bg-red-500'
                      : quotaStats.isWarning
                        ? 'bg-amber-500'
                        : 'bg-cyan-500'
                      }`}
                    style={{ width: `${Math.min(quotaStats.percentage, 100)}%` }}
                  />
                </div>

                {/* Warning/Critical Alert */}
                {quotaStats.isWarning && (
                  <div className={`p-3 rounded-lg ${quotaStats.isExceeded ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className={quotaStats.isExceeded ? 'text-red-400 mt-0.5' : 'text-amber-400 mt-0.5'} />
                      <p className={`text-xs ${quotaStats.isExceeded ? 'text-red-300' : 'text-amber-300'}`}>
                        {quotaStats.isExceeded
                          ? 'Limite diário atingido! A sincronização está pausada até amanhã.'
                          : 'Atenção: Uso elevado. Evite sincronizações desnecessárias para não exceder o limite.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800/60 flex justify-end">
                  <button
                    onClick={() => setIsDetailsModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Info size={14} />
                    Ver Detalhes por Módulo
                  </button>
                </div>
              </div>

              {/* Image Size Limit Info */}
              <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <Image className="text-purple-400" size={20} />
                  <div>
                    <span className="text-slate-300 font-medium">Limite de Upload de Imagens</span>
                    <p className="text-xs text-slate-500">Tamanho máximo por arquivo em notas</p>
                  </div>
                </div>
                <span className="text-sm font-bold bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20">
                  {(MAX_IMAGE_SIZE / 1024 / 1024).toFixed(0)}MB
                </span>
              </div>
            </div>
          </SettingsCategory>

          {/* APPEARANCE CATEGORY */}
          <SettingsCategory
            id="appearance"
            title="Aparência"
            description="Tema e personalização visual"
            icon={<Palette size={22} className="text-pink-400" />}
            iconBgColor="bg-pink-500/20"
            isExpanded={expandedCategories.has('appearance')}
            onToggle={() => toggleCategory('appearance')}
          >
            <ThemeSettingsSection />
          </SettingsCategory>

          {/* PWA INSTALLATION CATEGORY */}
          <SettingsCategory
            id="pwa"
            title="Instalação"
            description="Baixe o app no seu dispositivo"
            icon={<Smartphone size={22} className="text-green-400" />}
            iconBgColor="bg-green-500/20"
            isExpanded={expandedCategories.has('pwa')}
            onToggle={() => toggleCategory('pwa')}
          >
            <PWASettingsSection />
          </SettingsCategory>

          {/* OFFENSIVE CATEGORY */}
          <SettingsCategory
            id="offensive"
            title="Metas de Ofensiva"
            description="Pesos, prioridades e configurações de performance"
            icon={<Target size={22} className="text-amber-400" />}
            iconBgColor="bg-amber-500/20"
            isExpanded={expandedCategories.has('offensive')}
            onToggle={() => toggleCategory('offensive')}
          >
            <OffensiveSettingsSection />
          </SettingsCategory>

          {/* DATA MANAGEMENT CATEGORY */}
          <SettingsCategory
            id="data"
            title="Dados"
            description="Backup, sincronização e gerenciamento"
            icon={<Database size={22} className="text-blue-400" />}
            iconBgColor="bg-blue-500/20"
            isExpanded={expandedCategories.has('data')}
            onToggle={() => toggleCategory('data')}
          >
            {/* Sync Section */}
            <DataManagementSection />

            {/* Advanced Data Section */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-700">
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
            </div>
          </SettingsCategory>

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

      {/* Start Project Confirmation Modal */}
      {showStartConfirmation && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-full">
                <Flame size={24} className="text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Iniciar Projeto?</h3>
            </div>

            <p className="text-slate-300 text-sm mb-4">
              Ao iniciar, sua data de início será <strong className="text-white">bloqueada</strong> e você
              começará oficialmente sua jornada de 67 dias.
            </p>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-300/80">
                  Para alterar a data após iniciar, você precisará usar "Reiniciar Projeto".
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowStartConfirmation(false)}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleStartProject}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-bold transition-colors border border-violet-500/20 shadow-lg shadow-violet-500/20"
              >
                Iniciar Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Firestore Usage Details Modal */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900/95 border border-slate-700/50 rounded-2xl p-6 max-w-xl w-full animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <HardDrive size={22} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Detalhamento de Requisições</h3>
                  <p className="text-xs text-slate-400">Operações acumuladas por módulo hoje</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-slate-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Summary Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 bg-slate-800/40 border border-slate-800/60 rounded-xl text-center">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-0.5">Total</span>
                <span className="text-lg font-extrabold text-white">{quotaStats.total.toLocaleString('pt-BR')}</span>
              </div>
              <div className="p-3 bg-slate-850/40 border border-slate-800/60 rounded-xl text-center">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-500 block mb-0.5 font-mono">Leituras</span>
                <span className="text-lg font-extrabold text-emerald-400">{quotaStats.reads.toLocaleString('pt-BR')}</span>
              </div>
              <div className="p-3 bg-slate-850/40 border border-slate-800/60 rounded-xl text-center">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-cyan-500 block mb-0.5 font-mono">Gravações</span>
                <span className="text-lg font-extrabold text-cyan-400">{quotaStats.writes.toLocaleString('pt-BR')}</span>
              </div>
            </div>

            {/* Content / Module list */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[45vh] scrollbar-thin scrollbar-thumb-slate-800">
              {Object.keys({ ...quotaStats.moduleWrites, ...quotaStats.moduleReads }).length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Nenhuma requisição registrada hoje.
                </div>
              ) : (
                (() => {
                  const moduleKeys = Array.from(new Set([
                    ...Object.keys(quotaStats.moduleWrites || {}),
                    ...Object.keys(quotaStats.moduleReads || {})
                  ]));

                  const modulesData = moduleKeys.map(key => {
                    const writes = quotaStats.moduleWrites[key] || 0;
                    const reads = quotaStats.moduleReads[key] || 0;
                    const total = writes + reads;
                    return { key, writes, reads, total };
                  }).sort((a, b) => b.total - a.total);

                  const maxModuleTotal = Math.max(...modulesData.map(m => m.total), 1);

                  return (
                    <div className="space-y-4 pr-1">
                      {modulesData.map(mod => {
                        const barWidth = (mod.total / maxModuleTotal) * 100;

                        return (
                          <div key={mod.key} className="p-3 bg-slate-900/40 border border-slate-800/50 rounded-xl space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="min-w-0">
                                <span className="text-sm font-semibold text-slate-200 block truncate">
                                  {getFriendlyModuleName(mod.key)}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono block truncate">
                                  {mod.key}
                                </span>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-sm font-bold text-slate-100 block">
                                  {mod.total} <span className="text-[10px] text-slate-500 font-normal">ops</span>
                                </span>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  L: {mod.reads} | G: {mod.writes}
                                </span>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>As cotas reiniciam diariamente à meia-noite.</span>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
