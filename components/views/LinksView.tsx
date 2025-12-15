import React, { useState, useMemo, Suspense, useCallback } from 'react';
import {
   Globe, Search, Plus, X, Layout, LayoutGrid, Sparkles
} from 'lucide-react';
import LinkCard from '../links/LinkCard';
import { LinkItem, Prompt, PromptCategory } from '../../types';
import { useLinks, useLinkActions } from '../../stores/linksStore';
import { usePromptsStore } from '../../stores';
import { PromptSelectorModal } from '../skills/PromptSelectorModal';
import { PromptPreviewModal } from '../skills/PromptPreviewModal';

// Lazy load Components
const PromptsTab = React.lazy(() => import('../prompts/PromptsTab'));
const LinkModal = React.lazy(() => import('../links/LinkModal'));

// --- MOCK DATA ---
const INITIAL_LINKS: LinkItem[] = [
   { id: '1', title: 'Meu Portfolio', url: 'https://github.com', category: 'PERSONAL', clickCount: 12, order: 0 },
   { id: '2', title: 'Projeto React', url: 'https://react.dev', category: 'PERSONAL', clickCount: 5, order: 1 },
   { id: '3', title: 'Google', url: 'https://google.com', category: 'GENERAL', clickCount: 42, order: 0 },
   { id: '4', title: 'YouTube', url: 'https://youtube.com', category: 'GENERAL', clickCount: 150, order: 1 },
   { id: '5', title: 'ChatGPT', url: 'https://chat.openai.com', category: 'GENERAL', clickCount: 89, order: 2 },
];

const formatUrl = (url: string) => {
   if (!url) return '';
   if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
   }
   return url;
};

const LinksView: React.FC = () => {
   // --- STATE ---
   // Zustand stores (Atomic Selectors)
   const links = useLinks();
   const { addLink, updateLink, deleteLink: removeLink, incrementClickCount, reorderLinks } = useLinkActions();
   const { prompts, categories: promptCategories } = usePromptsStore();

   const [activeMainTab, setActiveMainTab] = useState<'links' | 'prompts'>('links');
   const [activeTab, setActiveTab] = useState<'PERSONAL' | 'GENERAL'>('PERSONAL');
   const [searchQuery, setSearchQuery] = useState('');

   // Modal State
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

   // Drag State
   const [draggedItem, setDraggedItem] = useState<LinkItem | null>(null);

   // Prompt Modal States
   const [promptSelectorFor, setPromptSelectorFor] = useState<string | null>(null);
   const [previewPromptId, setPreviewPromptId] = useState<string | null>(null);

   // --- HANDLERS ---

   const handleSave = useCallback((data: Partial<LinkItem>) => {
      if (editingLink) {
         updateLink(editingLink.id, data);
      } else {
         const newLink: LinkItem = {
            id: Date.now().toString(),
            title: data.title || 'Novo Link',
            url: formatUrl(data.url || ''),
            category: activeTab, // This depends on activeTab, so it will update when tab changes
            clickCount: 0,
            order: links.filter(l => l.category === activeTab).length,
            ...data
         } as LinkItem;
         addLink(newLink);
      }
      setIsModalOpen(false);
      setEditingLink(null);
   }, [editingLink, activeTab, links, updateLink, addLink]); // Note: formatUrl needs to be defined before usage or stable

   const handleDelete = useCallback((id: string) => {
      if (confirm("Remover este link?")) {
         removeLink(id);
      }
   }, [removeLink]);

   const handleClick = useCallback((link: LinkItem) => {
      // Update stats using Zustand action
      incrementClickCount(link.id);
      window.open(link.url, '_blank');
   }, [incrementClickCount]);

   const handleEdit = useCallback((link: LinkItem) => {
      setEditingLink(link);
      setIsModalOpen(true);
   }, []);

   const handlePreviewPrompt = useCallback((id: string) => {
      setPreviewPromptId(id);
   }, []);

   // Drag and Drop
   const handleDragStart = useCallback((e: React.DragEvent, item: LinkItem) => {
      setDraggedItem(item);
      e.dataTransfer.effectAllowed = "move";
   }, []);

   const handleDragOver = useCallback((e: React.DragEvent, targetItem: LinkItem) => {
      e.preventDefault();
      if (!draggedItem || draggedItem.id === targetItem.id || draggedItem.category !== targetItem.category) return;

      // Reorder logic using Zustand
      const newList = [...links];
      const sourceIndex = newList.findIndex(i => i.id === draggedItem.id);
      const targetIndex = newList.findIndex(i => i.id === targetItem.id);

      // Remove source
      newList.splice(sourceIndex, 1);
      // Insert at target
      newList.splice(targetIndex, 0, draggedItem);

      // Update order property ONLY for items in the same category
      const category = draggedItem.category;
      let orderIndex = 0;
      const reorderedList = newList.map(item => {
         if (item.category === category) {
            return { ...item, order: orderIndex++ };
         }
         return item;
      });
      reorderLinks(reorderedList);
   }, [draggedItem, links, reorderLinks]);

   const handleDragEnd = useCallback(() => {
      setDraggedItem(null);
   }, []);

   // Helpers
   const getFavicon = useCallback((url: string) => {
      try {
         const domain = new URL(url).hostname;
         return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      } catch {
         return '';
      }
   }, []);

   // Prompt Helpers
   const getPromptById = (promptId: string) => prompts.find(p => p.id === promptId);
   const getCategoryById = (catId: string) => promptCategories.find(c => c.id === catId);

   // Filtering
   const filteredLinks = useMemo(() => {
      return links
         .filter(l => l.category === activeTab)
         .filter(l =>
            searchQuery
               ? l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.url.toLowerCase().includes(searchQuery.toLowerCase())
               : true
         )
         .sort((a, b) => a.order - b.order);
   }, [links, activeTab, searchQuery]);

   return (
      <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

         {/* HEADER & CONTROLS */}
         <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="w-full md:w-auto flex flex-col gap-1">
               <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                  <Globe className="text-indigo-400" /> Central de Links & Prompts
               </h2>
               <p className="text-slate-400 text-sm">Gerencie seus atalhos, portais e prompts favoritos.</p>
            </div>
         </div>

         {/* MAIN TABS - Links vs Prompts */}
         <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700 mb-8 w-full max-w-md">
            <button
               onClick={() => setActiveMainTab('links')}
               className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeMainTab === 'links' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
               <Globe size={18} /> Meus Links
            </button>
            <button
               onClick={() => setActiveMainTab('prompts')}
               className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeMainTab === 'prompts' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
               <Sparkles size={18} /> Meus Prompts
            </button>
         </div>

         {/* CONTENT */}
         {activeMainTab === 'prompts' ? (
            <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div></div>}>
               <PromptsTab />
            </Suspense>
         ) : (
            <>
               {/* LINKS CONTROLS */}
               <div className="flex w-full gap-3 mb-6">
                  <div className="relative flex-1 md:w-64">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                     <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Buscar sites..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                     />
                     {searchQuery && (
                        <button onClick={() => setSearchQuery('')} title="Limpar busca" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                           <X size={14} />
                        </button>
                     )}
                  </div>
                  <button
                     onClick={() => { setEditingLink(null); setIsModalOpen(true); }}
                     className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl shadow-lg shadow-indigo-900/20 transition-all hover:scale-105 flex items-center gap-2 font-medium"
                  >
                     <Plus size={20} /> <span className="hidden sm:inline">Novo Link</span>
                  </button>
               </div>

               {/* LINK CATEGORY TABS */}
               <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700 mb-8 w-full max-w-md">
                  <button
                     onClick={() => setActiveTab('PERSONAL')}
                     className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'PERSONAL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  >
                     <Layout size={16} /> Meus Sites
                  </button>
                  <button
                     onClick={() => setActiveTab('GENERAL')}
                     className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'GENERAL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  >
                     <LayoutGrid size={16} /> Sites Gerais
                  </button>
               </div>

               {/* GRID */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredLinks.length === 0 && (
                     <div className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20 text-slate-500">
                        <Globe size={48} className="mb-4 opacity-50" />
                        <p>Nenhum link encontrado nesta categoria.</p>
                        <button onClick={() => setIsModalOpen(true)} className="mt-2 text-indigo-400 hover:underline">Adicionar primeiro link</button>
                     </div>
                  )}

                  {filteredLinks.map(link => (
                     <LinkCard
                        key={link.id}
                        link={link}
                        isDragging={draggedItem?.id === link.id}
                        getFavicon={getFavicon}
                        formatUrl={formatUrl}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onClick={handleClick}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onPreviewPrompt={handlePreviewPrompt}
                        hasLinkedPrompt={!!(link.promptId && getPromptById(link.promptId))}
                     />
                  ))}
               </div>
            </>
         )}

         {/* MODAL */}
         {isModalOpen && (
            <Suspense fallback={null}>
               <LinkModal
                  link={editingLink}
                  prompts={prompts}
                  promptCategories={promptCategories}
                  onClose={() => setIsModalOpen(false)}
                  onSave={handleSave}
               />
            </Suspense>
         )}

         {/* PROMPT PREVIEW MODAL */}
         {previewPromptId && getPromptById(previewPromptId) && (
            <PromptPreviewModal
               prompt={getPromptById(previewPromptId)!}
               category={getCategoryById(getPromptById(previewPromptId)!.category)}
               onClose={() => setPreviewPromptId(null)}
            />
         )}
      </div>
   );
};



export default LinksView;