
import React, { useState } from 'react';
import { Database, Download, Trash2, ShieldCheck, Info, AlertTriangle, RotateCcw, CheckSquare, Square, X } from 'lucide-react';
import { ProjectConfig } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const SettingsView: React.FC = () => {
  const [config, setConfig] = useLocalStorage<ProjectConfig>('p67_project_config', {
      startDate: new Date().toISOString(),
      userName: 'User',
      isGuest: false
  });
  
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleExportData = () => {
    const data = {
      p67_session: localStorage.getItem('p67_session'),
      p67_tasks: localStorage.getItem('p67_tasks'),
      p67_journal: localStorage.getItem('p67_journal'),
      p67_skills: localStorage.getItem('p67_skills'),
      p67_links: localStorage.getItem('p67_links'),
      p67_books: localStorage.getItem('p67_books'),
      p67_habits: localStorage.getItem('p67_habits'),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projeto-67-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (confirm("ATENÇÃO: Isso apagará TODOS os seus dados (tarefas, diário, skills, etc) deste navegador. Essa ação é irreversível. Deseja continuar?")) {
      const session = localStorage.getItem('p67_session'); // Preserve session if possible, or clear everything
      localStorage.clear();
      if (session) localStorage.setItem('p67_session', session);
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Configurações</h2>
        <p className="text-slate-400">Gerencie seus dados e preferências do sistema.</p>
      </div>

      <div className="space-y-6">
        
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
          </div>
        </div>

        {/* Data Management Card */}
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
             <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col justify-between">
                <div className="mb-4">
                   <h4 className="text-white font-medium flex items-center gap-2 mb-2">
                      <Download size={18} className="text-blue-400"/> Exportar Backup
                   </h4>
                   <p className="text-xs text-slate-400 leading-relaxed">
                      Baixe uma cópia de todos os seus registros (JSON) para segurança ou para importar em outro navegador.
                   </p>
                </div>
                <button 
                  onClick={handleExportData}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-blue-900/20"
                >
                   Baixar Dados
                </button>
             </div>
             
             {/* Reset Project Option */}
             <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col justify-between">
                <div className="mb-4">
                   <h4 className="text-white font-medium flex items-center gap-2 mb-2">
                      <RotateCcw size={18} className="text-orange-400"/> Reiniciar Projeto
                   </h4>
                   <p className="text-xs text-slate-400 leading-relaxed">
                      Volte ao Dia 1. Você pode escolher manter seus livros e habilidades, mas reiniciará a contagem e tarefas.
                   </p>
                </div>
                <button 
                  onClick={() => setIsResetModalOpen(true)}
                  className="w-full py-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 hover:border-orange-500/50 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                   Opções de Reset
                </button>
             </div>

             <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col justify-between md:col-span-2">
                <div className="mb-4">
                   <h4 className="text-white font-medium flex items-center gap-2 mb-2">
                      <Trash2 size={18} className="text-red-400"/> Zona de Perigo
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

      {isResetModalOpen && (
          <ResetProjectModal 
            onClose={() => setIsResetModalOpen(false)} 
            onConfirm={(options) => {
                // Reset Start Date
                setConfig(prev => ({ ...prev, startDate: new Date().toISOString() }));
                
                // Clear selected data
                if (!options.keepBooks) localStorage.removeItem('p67_books');
                if (!options.keepSkills) localStorage.removeItem('p67_skills');
                if (!options.keepLinks) localStorage.removeItem('p67_links');
                
                // Always clear daily tracking stuff on a reset
                localStorage.removeItem('p67_habits'); // History needs to go, maybe keep definitions?
                localStorage.removeItem('p67_tasks');
                localStorage.removeItem('p67_journal');
                localStorage.removeItem('p67_sunday_tasks');
                
                // Reload to apply
                window.location.reload();
            }}
          />
      )}
    </div>
  );
};

const ResetProjectModal: React.FC<{
    onClose: () => void;
    onConfirm: (options: { keepBooks: boolean; keepSkills: boolean; keepLinks: boolean }) => void;
}> = ({ onClose, onConfirm }) => {
    const [options, setOptions] = useState({
        keepBooks: true,
        keepSkills: true,
        keepLinks: true
    });

    const toggle = (key: keyof typeof options) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-700 bg-gradient-to-r from-orange-900/20 to-slate-900 flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <RotateCcw className="text-orange-500" /> Reiniciar Projeto
                    </h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                </div>
                
                <div className="p-6">
                    <p className="text-slate-300 mb-6 text-sm">
                        Isso irá redefinir o contador para o <strong>Dia 1</strong>. 
                        O histórico de hábitos, tarefas diárias e diário serão apagados.
                        Escolha o que deseja <span className="text-emerald-400 font-bold">MANTER</span>:
                    </p>

                    <div className="space-y-3">
                        <div 
                            onClick={() => toggle('keepBooks')}
                            className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all bg-slate-900/50 border-slate-700 hover:border-slate-600"
                        >
                            {options.keepBooks ? <CheckSquare className="text-emerald-500" /> : <Square className="text-slate-600" />}
                            <div className="flex-1">
                                <div className="text-sm font-bold text-white">Progresso de Leitura</div>
                                <div className="text-xs text-slate-500">Manter livros e páginas lidas.</div>
                            </div>
                        </div>

                        <div 
                            onClick={() => toggle('keepSkills')}
                            className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all bg-slate-900/50 border-slate-700 hover:border-slate-600"
                        >
                            {options.keepSkills ? <CheckSquare className="text-emerald-500" /> : <Square className="text-slate-600" />}
                            <div className="flex-1">
                                <div className="text-sm font-bold text-white">Skill Tree</div>
                                <div className="text-xs text-slate-500">Manter habilidades e horas estudadas.</div>
                            </div>
                        </div>
                        
                         <div 
                            onClick={() => toggle('keepLinks')}
                            className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all bg-slate-900/50 border-slate-700 hover:border-slate-600"
                        >
                            {options.keepLinks ? <CheckSquare className="text-emerald-500" /> : <Square className="text-slate-600" />}
                            <div className="flex-1">
                                <div className="text-sm font-bold text-white">Links Salvos</div>
                                <div className="text-xs text-slate-500">Manter sua coleção de links.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium">Cancelar</button>
                    <button onClick={() => onConfirm(options)} className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition-colors shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2">
                        Confirmar Reset
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SettingsView;
