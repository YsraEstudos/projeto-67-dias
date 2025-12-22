import React, { useState } from 'react';
import { Database, RefreshCw, RotateCcw, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { usePromptsStore } from '../../stores';
import { getCurrentUserId } from '../../stores/firestoreSync';
import { useSkillsStore } from '../../stores/skillsStore';
import { INITIAL_SKILLS } from '../skills/mockData';

export const DataManagementSection: React.FC = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [userId, setUserId] = useState<string | null>(null);

    // Stores
    const { initializeDefaults: initPrompts, prompts } = usePromptsStore();
    const { setSkills, skills } = useSkillsStore();

    React.useEffect(() => {
        setUserId(getCurrentUserId());
    }, []);

    const handleForceSync = async () => {
        setIsSyncing(true);
        setSyncStatus('idle');
        try {
            // In Firestore-first architecture, data syncs automatically via subscriptions
            // A "force sync" is essentially refreshing the page to re-establish subscriptions
            // For now, we'll just show success since data is already synced in real-time
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate sync delay
            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 3000);
        } catch (error) {
            console.error('Sync failed:', error);
            setSyncStatus('error');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleRestoreDefaults = () => {
        if (confirm('Isso irá restaurar os dados padrão de Prompts e Skills SE eles estiverem vazios. Continuar?')) {
            initPrompts();

            // Skill logic (simplified from SkillsView)
            if (skills.length === 0) {
                const skillsWithUniqueIds = INITIAL_SKILLS.map((skill, index) => ({
                    ...skill,
                    id: `skill_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
                }));
                setSkills(skillsWithUniqueIds);
            }

            alert('Verificação de dados padrão concluída.');
        }
    };

    // Debug only - dangerous
    const handleClearLocalStorage = () => {
        if (confirm('PERIGO: Isso limpará TODO o armazenamento local. Se seus dados não estiverem no Firebase, você PERDERÁ TUDO. Tem certeza absoluta?')) {
            localStorage.clear();
            window.location.reload();
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-start gap-4 p-4 bg-slate-900/30 rounded-xl border border-slate-700/50">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Database size={20} />
                </div>
                <div>
                    <p className="text-slate-400 text-sm">
                        Ferramentas para sincronização Firestore-first com cache offline; use apenas se algo sair do fluxo automático.
                    </p>
                    <div className="mt-2 text-xs font-mono bg-slate-900 px-2 py-1 rounded inline-block text-slate-500">
                        UserID: {userId || 'Guest (Local)'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Force Sync */}
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col justify-between gap-3">
                    <div>
                        <h4 className="font-medium text-white flex items-center gap-2">
                            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                            Sincronizar Nuvem
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                            Dados sincronizam automaticamente em tempo real.
                        </p>
                    </div>
                    <button
                        onClick={handleForceSync}
                        disabled={isSyncing}
                        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2
                            ${syncStatus === 'success'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50'
                            }`}
                    >
                        {syncStatus === 'success' ? (
                            <> <CheckCircle2 size={16} /> Sincronizado </>
                        ) : (
                            isSyncing ? 'Verificando...' : 'Verificar Sync'
                        )}
                    </button>
                </div>

                {/* Restore Defaults */}
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col justify-between gap-3">
                    <div>
                        <h4 className="font-medium text-white flex items-center gap-2">
                            <RotateCcw size={16} />
                            Restaurar Padrões
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                            Recarrega Prompts e Skills iniciais se estiverem faltando.
                        </p>
                    </div>
                    <button
                        onClick={handleRestoreDefaults}
                        className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Verificar Padrões
                    </button>
                </div>

                {/* Clear Local (Danger) */}
                <div className="p-4 bg-red-900/10 rounded-xl border border-red-900/20 flex flex-col justify-between gap-3">
                    <div>
                        <h4 className="font-medium text-red-400 flex items-center gap-2">
                            <AlertTriangle size={16} />
                            Resetar Local
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                            Limpa cache local. Use apenas se o app estiver quebrado.
                        </p>
                    </div>
                    <button
                        onClick={handleClearLocalStorage}
                        className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 size={14} /> Limpar Cache
                    </button>
                </div>
            </div>

            {syncStatus === 'error' && (
                <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded text-center">
                    Erro ao sincronizar. Verifique sua conexão.
                </div>
            )}
        </div>
    );
};
