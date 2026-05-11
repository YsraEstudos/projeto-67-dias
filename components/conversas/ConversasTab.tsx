import React from 'react';
import { MessageSquare, Folder, Plus, FileText } from 'lucide-react';

const ConversasTab: React.FC = () => {
   return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         {/* HEADER */}
         <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-800/30 p-6 rounded-3xl border border-slate-700/50">
            <div>
               <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                  <MessageSquare size={24} />
                  Minhas Conversas
               </h3>
               <p className="text-sm text-slate-400 mt-1">
                  Organize seus textos em Markdown por categorias e pastas.
               </p>
            </div>
            <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/20 font-bold flex items-center gap-2 transition-all">
               <Plus size={18} /> Nova Conversa
            </button>
         </div>

         {/* FOLDERS MOCKUP */}
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/40 border border-slate-700 hover:border-emerald-500/50 p-4 rounded-2xl cursor-pointer transition-all flex flex-col gap-3 group">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-700 group-hover:bg-emerald-500/20 rounded-xl text-slate-400 group-hover:text-emerald-400 transition-colors">
                     <Folder size={20} />
                  </div>
                  <h4 className="font-bold text-slate-200">Ideias & Projetos</h4>
               </div>
               <p className="text-xs text-slate-500 font-medium">3 conversas</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700 hover:border-emerald-500/50 p-4 rounded-2xl cursor-pointer transition-all flex flex-col gap-3 group">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-700 group-hover:bg-emerald-500/20 rounded-xl text-slate-400 group-hover:text-emerald-400 transition-colors">
                     <Folder size={20} />
                  </div>
                  <h4 className="font-bold text-slate-200">Reflexões</h4>
               </div>
               <p className="text-xs text-slate-500 font-medium">1 conversa</p>
            </div>
            
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2 text-slate-500 hover:text-emerald-400">
               <Plus size={20} />
               <span className="font-bold">Nova Pasta</span>
            </div>
         </div>

         {/* RECENT FILES MOCKUP */}
         <div className="mt-4">
            <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Recentes</h4>
            <div className="flex flex-col gap-2">
               <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                     <FileText size={18} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
                     <span className="text-slate-300 font-medium">Planejamento do Aplicativo</span>
                  </div>
                  <span className="text-xs text-slate-500">Ontem</span>
               </div>
               
               <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                     <FileText size={18} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
                     <span className="text-slate-300 font-medium">Rascunho de Artigo</span>
                  </div>
                  <span className="text-xs text-slate-500">2 dias atrás</span>
               </div>
            </div>
         </div>
      </div>
   );
};

export default ConversasTab;
