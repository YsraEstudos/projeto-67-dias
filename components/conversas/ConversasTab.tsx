import React, { useMemo, useState } from 'react';
import {
   ArrowLeft,
   ExternalLink,
   Edit2,
   FileText,
   Link as LinkIcon,
   MessageSquare,
   Plus,
   Save,
   Search,
   Trash2,
   X,
} from 'lucide-react';
import { MarkdownRenderer } from '../notes/MarkdownRenderer';

interface SavedConversation {
   id: string;
   title: string;
   sourceUrl: string;
   markdown: string;
   createdAt: number;
   updatedAt: number;
}

interface ConversationDraft {
   title: string;
   sourceUrl: string;
   markdown: string;
}

const STORAGE_KEY = 'projeto67.conversas.markdown.v1';

const createEmptyDraft = (): ConversationDraft => ({
   title: '',
   sourceUrl: '',
   markdown: '',
});

const createConversation = (draft: ConversationDraft): SavedConversation => {
   const timestamp = Date.now();

   return {
      id: timestamp.toString(),
      title: draft.title.trim() || 'Nova conversa',
      sourceUrl: draft.sourceUrl.trim(),
      markdown: draft.markdown.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
   };
};

const readStoredConversations = (): SavedConversation[] => {
   if (typeof window === 'undefined') return [];

   try {
      const rawValue = window.localStorage.getItem(STORAGE_KEY);
      if (!rawValue) return [];

      const parsedValue = JSON.parse(rawValue);
      if (!Array.isArray(parsedValue)) return [];

      return parsedValue.filter(isSavedConversation);
   } catch {
      return [];
   }
};

const isSavedConversation = (value: unknown): value is SavedConversation => {
   if (!value || typeof value !== 'object') return false;

   const candidate = value as Partial<SavedConversation>;
   return (
      typeof candidate.id === 'string' &&
      typeof candidate.title === 'string' &&
      typeof candidate.sourceUrl === 'string' &&
      typeof candidate.markdown === 'string' &&
      typeof candidate.createdAt === 'number' &&
      typeof candidate.updatedAt === 'number'
   );
};

const persistConversations = (conversations: SavedConversation[]): void => {
   if (typeof window === 'undefined') return;
   window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
};

const formatDate = (timestamp: number): string =>
   new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
   });

const ConversasTab: React.FC = () => {
   const [conversations, setConversations] = useState<SavedConversation[]>(readStoredConversations);
   const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
   const [viewingConversationId, setViewingConversationId] = useState<string | null>(null);
   const [draft, setDraft] = useState<ConversationDraft>(createEmptyDraft);
   const [searchQuery, setSearchQuery] = useState('');

   const sortedConversations = useMemo(
      () => [...conversations].sort((left, right) => right.updatedAt - left.updatedAt),
      [conversations]
   );

   const filteredConversations = useMemo(() => {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      if (!normalizedQuery) return sortedConversations;

      return sortedConversations.filter(conversation =>
         `${conversation.title} ${conversation.sourceUrl} ${conversation.markdown}`
            .toLowerCase()
            .includes(normalizedQuery)
      );
   }, [searchQuery, sortedConversations]);

   const selectedConversation = conversations.find(
      conversation => conversation.id === editingConversationId
   );

   const viewingConversation = conversations.find(
      conversation => conversation.id === viewingConversationId
   );

   const isEditing = editingConversationId !== null;

   const openNewConversation = (): void => {
      setViewingConversationId(null);
      setEditingConversationId('new');
      setDraft(createEmptyDraft());
   };

   const openConversationViewer = (conversation: SavedConversation): void => {
      setViewingConversationId(conversation.id);
   };

   const openConversationEditor = (conversation: SavedConversation): void => {
      setViewingConversationId(null);
      setEditingConversationId(conversation.id);
      setDraft({
         title: conversation.title,
         sourceUrl: conversation.sourceUrl,
         markdown: conversation.markdown,
      });
   };

   const closeEditor = (): void => {
      setEditingConversationId(null);
      setDraft(createEmptyDraft());
   };

   const closeViewer = (): void => {
      setViewingConversationId(null);
   };

   const updateDraft = (field: keyof ConversationDraft, value: string): void => {
      setDraft(currentDraft => ({ ...currentDraft, [field]: value }));
   };

   const saveConversation = (): void => {
      const trimmedMarkdown = draft.markdown.trim();
      if (!trimmedMarkdown) return;

      const nextConversations =
         editingConversationId && editingConversationId !== 'new'
            ? conversations.map(conversation =>
                 conversation.id === editingConversationId
                    ? {
                         ...conversation,
                         title: draft.title.trim() || 'Conversa sem titulo',
                         sourceUrl: draft.sourceUrl.trim(),
                         markdown: trimmedMarkdown,
                         updatedAt: Date.now(),
                      }
                    : conversation
              )
            : [createConversation(draft), ...conversations];

      setConversations(nextConversations);
      persistConversations(nextConversations);
      closeEditor();
   };

   const deleteConversation = (conversationId: string): void => {
      if (!window.confirm('Remover esta conversa?')) return;

      const nextConversations = conversations.filter(conversation => conversation.id !== conversationId);
      setConversations(nextConversations);
      persistConversations(nextConversations);
      setViewingConversationId(null);
      closeEditor();
   };

   if (viewingConversation) {
      return (
         <div className="animate-in fade-in zoom-in-95 duration-300">
            <section className="min-h-[calc(100vh-220px)] max-w-5xl mx-auto bg-slate-950/90 border border-slate-800 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden flex flex-col">
               <header className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/70 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                     <div className="min-w-0">
                        <button
                           onClick={closeViewer}
                           className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors w-fit mb-3"
                        >
                           <ArrowLeft size={16} /> Voltar
                        </button>
                        <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight break-words">
                           {viewingConversation.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-2">
                           Atualizado em {formatDate(viewingConversation.updatedAt)}
                        </p>
                     </div>
                     <div className="flex items-center gap-2 shrink-0">
                        <button
                           onClick={() => deleteConversation(viewingConversation.id)}
                           className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-xl transition-colors"
                           title="Excluir conversa"
                        >
                           <Trash2 size={18} />
                        </button>
                        <button
                           onClick={() => openConversationEditor(viewingConversation)}
                           className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/20 font-bold flex items-center gap-2 transition-all"
                        >
                           <Edit2 size={18} /> Editar
                        </button>
                     </div>
                  </div>

                  {viewingConversation.sourceUrl && (
                     <a
                        href={viewingConversation.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full min-w-0 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-emerald-300 hover:text-emerald-200 flex items-center gap-2 transition-colors"
                     >
                        <ExternalLink size={15} className="shrink-0" />
                        <span className="truncate">{viewingConversation.sourceUrl}</span>
                     </a>
                  )}
               </header>

               <div className="flex-1 overflow-y-auto p-5 sm:p-8">
                  <div className="max-w-3xl mx-auto">
                     <MarkdownRenderer content={viewingConversation.markdown} />
                  </div>
               </div>
            </section>
         </div>
      );
   }

   if (isEditing) {
      return (
         <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col gap-4 bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                     onClick={closeEditor}
                     className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors w-fit"
                  >
                     <ArrowLeft size={16} /> Voltar
                  </button>
                  <div className="flex items-center gap-2">
                     {selectedConversation && (
                        <button
                           onClick={() => deleteConversation(selectedConversation.id)}
                           className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-xl transition-colors"
                           title="Excluir conversa"
                        >
                           <Trash2 size={18} />
                        </button>
                     )}
                     <button
                        onClick={saveConversation}
                        disabled={!draft.markdown.trim()}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl shadow-lg shadow-emerald-900/20 font-bold flex items-center gap-2 transition-all"
                     >
                        <Save size={18} /> Salvar
                     </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4">
                  <div className="flex flex-col gap-3">
                     <label className="flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                           Titulo
                        </span>
                        <input
                           value={draft.title}
                           onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                              updateDraft('title', event.target.value)
                           }
                           placeholder="Nome da conversa"
                           className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                        />
                     </label>

                     <label className="flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                           Link da conversa consultada
                        </span>
                        <div className="relative">
                           <LinkIcon
                              size={16}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                           />
                           <input
                              value={draft.sourceUrl}
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                 updateDraft('sourceUrl', event.target.value)
                              }
                              placeholder="https://..."
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                           />
                        </div>
                     </label>

                     <label className="flex flex-col gap-2 flex-1 min-h-[360px]">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                           Markdown completo
                        </span>
                        <textarea
                           value={draft.markdown}
                           onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                              updateDraft('markdown', event.target.value)
                           }
                           placeholder={`Cole ou escreva aqui em Markdown...\n\n# Resumo\n\n- Ponto importante\n- Decisoes\n\n## Trechos relevantes\n\n> ...`}
                           className="min-h-[360px] flex-1 resize-y bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 font-mono leading-relaxed outline-none focus:border-emerald-500 transition-colors"
                        />
                     </label>
                  </div>

                  <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 overflow-hidden">
                     <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
                        <div className="min-w-0">
                           <h4 className="font-bold text-slate-100 truncate">
                              {draft.title.trim() || 'Previa da conversa'}
                           </h4>
                           {draft.sourceUrl.trim() && (
                              <a
                                 href={draft.sourceUrl.trim()}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-xs text-emerald-300 hover:text-emerald-200 flex items-center gap-1 mt-1 truncate"
                              >
                                 <ExternalLink size={12} /> {draft.sourceUrl.trim()}
                              </a>
                           )}
                        </div>
                     </div>
                     {draft.markdown.trim() ? (
                        <div className="max-h-[560px] overflow-y-auto pr-2">
                           <MarkdownRenderer content={draft.markdown} className="text-sm" />
                        </div>
                     ) : (
                        <div className="min-h-[260px] flex items-center justify-center text-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                           <span className="text-sm font-medium">A previa aparece aqui.</span>
                        </div>
                     )}
                  </section>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
            <div>
               <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                  <MessageSquare size={24} />
                  Minhas Conversas
               </h3>
               <p className="text-sm text-slate-400 mt-1">
                  Guarde a conversa consultada no topo e o conteudo completo em Markdown.
               </p>
            </div>
            <button
               onClick={openNewConversation}
               className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/20 font-bold flex items-center gap-2 transition-all"
            >
               <Plus size={18} /> Nova Conversa
            </button>
         </div>

         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
               value={searchQuery}
               onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(event.target.value)}
               placeholder="Buscar por titulo, link ou conteudo..."
               className="w-full bg-slate-900/70 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
               <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  aria-label="Limpar busca"
               >
                  <X size={16} />
               </button>
            )}
         </div>

         {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-center">
               <FileText size={44} className="text-slate-600 mb-4" />
               <p className="text-slate-400 font-medium">
                  {conversations.length === 0 ? 'Nenhuma conversa salva ainda.' : 'Nenhuma conversa encontrada.'}
               </p>
               <button
                  onClick={openNewConversation}
                  className="mt-3 text-emerald-300 hover:text-emerald-200 text-sm font-bold"
               >
                  Adicionar conversa em Markdown
               </button>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {filteredConversations.map(conversation => (
                  <article
                     key={conversation.id}
                     onClick={() => openConversationViewer(conversation)}
                     className="bg-slate-800/40 border border-slate-700 hover:border-emerald-500/50 p-4 rounded-2xl cursor-pointer transition-all flex flex-col gap-3 group min-w-0"
                  >
                     <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                           <div className="p-2.5 bg-slate-700 group-hover:bg-emerald-500/20 rounded-xl text-slate-400 group-hover:text-emerald-400 transition-colors">
                              <FileText size={20} />
                           </div>
                           <div className="min-w-0">
                              <h4 className="font-bold text-slate-100 truncate">{conversation.title}</h4>
                              <p className="text-xs text-slate-500">
                                 Atualizado em {formatDate(conversation.updatedAt)}
                              </p>
                           </div>
                        </div>
                     </div>
                     {conversation.sourceUrl && (
                        <a
                           href={conversation.sourceUrl}
                           onClick={(event: React.MouseEvent<HTMLAnchorElement>) => event.stopPropagation()}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-xs text-emerald-300 hover:text-emerald-200 flex items-center gap-1 truncate"
                        >
                           <ExternalLink size={12} /> {conversation.sourceUrl}
                        </a>
                     )}
                     <p className="text-sm text-slate-400 line-clamp-3 whitespace-pre-line">
                        {conversation.markdown}
                     </p>
                  </article>
               ))}
            </div>
         )}
      </div>
   );
};

export default ConversasTab;
