import React, { useState, useMemo, Suspense, useCallback } from 'react';
import {
   Globe, Search, Plus, X, Sparkles, FolderPlus, MoreVertical, Trash2, Edit2
} from 'lucide-react';
import LinkCard from '../links/LinkCard';
import { LinkItem, SiteCategory } from '../../types';
import { useLinks, useLinkActions } from '../../stores/linksStore';
import { usePromptsStore, useSiteCategories, useSiteCategoryActions } from '../../stores';
import { PromptPreviewModal } from '../skills/PromptPreviewModal';
import { siteIcons, siteColorClasses } from '../links/constants';

// Lazy load Components
const PromptsTab = React.lazy(() => import('../prompts/PromptsTab'));
const LinkModal = React.lazy(() => import('../links/LinkModal'));
const SiteCategoryModal = React.lazy(() => import('../links/SiteCategoryModal'));

// --- MOCK DATA (deprecated - data comes from store now) ---
const _INITIAL_LINKS: LinkItem[] = [
   { id: '1', title: 'Meu Portfolio', url: 'https://github.com', categoryId: 'personal', clickCount: 12, order: 0, promptIds: [] },
   { id: '2', title: 'Projeto React', url: 'https://react.dev', categoryId: 'personal', clickCount: 5, order: 1, promptIds: [] },
   { id: '3', title: 'Google', url: 'https://google.com', categoryId: 'general', clickCount: 42, order: 0, promptIds: [] },
   { id: '4', title: 'YouTube', url: 'https://youtube.com', categoryId: 'general', clickCount: 150, order: 1, promptIds: [] },
   { id: '5', title: 'ChatGPT', url: 'https://chat.openai.com', categoryId: 'general', clickCount: 89, order: 2, promptIds: [] },
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
   const siteCategories = useSiteCategories();
   const { addCategory: addSiteCategory, updateCategory: updateSiteCategory, deleteCategory: deleteSiteCategory } = useSiteCategoryActions();

   const [activeMainTab, setActiveMainTab] = useState<'links' | 'prompts'>('links');
   const [activeTab, setActiveTab] = useState(siteCategories[0]?.id || 'personal');
   const [searchQuery, setSearchQuery] = useState('');

   // Site Category Modal State
   const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
   const [editingCategory, setEditingCategory] = useState<SiteCategory | null>(null);
   const [categoryMenuOpen, setCategoryMenuOpen] = useState<string | null>(null);

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
            categoryId: activeTab,
            clickCount: 0,
            order: links.filter(l => l.categoryId === activeTab).length,
            promptIds: [],
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
      if (!draggedItem || draggedItem.id === targetItem.id || draggedItem.categoryId !== targetItem.categoryId) return;

      // Reorder logic using Zustand
      const newList = [...links];
      const sourceIndex = newList.findIndex(i => i.id === draggedItem.id);
      const targetIndex = newList.findIndex(i => i.id === targetItem.id);

      // Remove source
      newList.splice(sourceIndex, 1);
      // Insert at target
      newList.splice(targetIndex, 0, draggedItem);

      // Update order property ONLY for items in the same category
      const categoryId = draggedItem.categoryId;
      let orderIndex = 0;
      const reorderedList = newList.map(item => {
         if (item.categoryId === categoryId) {
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

   // Pre-compute linked prompts map for all links (prevents recreating arrays on each render)
   const linkedPromptsMap = useMemo(() => {
      const map = new Map<string, typeof prompts>();
      for (const link of links) {
         if (link.promptIds && link.promptIds.length > 0) {
            const linkedPrompts = link.promptIds
               .map(id => prompts.find(p => p.id === id))
               .filter((p): p is typeof prompts[number] => !!p);
            map.set(link.id, linkedPrompts);
         } else {
            map.set(link.id, []);
         }
      }
      return map;
   }, [links, prompts]);

   // Filtering
   const filteredLinks = useMemo(() => {
      return links
         .filter(l => l.categoryId === activeTab)
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
               <div className="flex flex-wrap gap-2 mb-8">
                  {siteCategories.map(cat => {
                     const isActive = activeTab === cat.id;
                     const IconComponent = siteIcons[cat.icon];
                     const linkCount = links.filter(l => l.categoryId === cat.id).length;

                     return (
                        <div key={cat.id} className="relative">
                           <button
                              onClick={() => setActiveTab(cat.id)}
                              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isActive
                                 ? 'bg-indigo-600 text-white shadow-md'
                                 : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700'
                                 }`}
                           >
                              {IconComponent}
                              {cat.name}
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                                 {linkCount}
                              </span>
                           </button>

                           {/* Context menu button for non-default categories */}
                           {!cat.isDefault && (
                              <button
                                 onClick={(e) => { e.stopPropagation(); setCategoryMenuOpen(categoryMenuOpen === cat.id ? null : cat.id); }}
                                 className="absolute -top-1 -right-1 p-1 bg-slate-700 rounded-full opacity-0 group-hover:opacity-100 hover:bg-slate-600 transition-opacity"
                                 title="Opções"
                              >
                                 <MoreVertical size={12} />
                              </button>
                           )}

                           {/* Context menu dropdown */}
                           {categoryMenuOpen === cat.id && !cat.isDefault && (
                              <div className="absolute top-full right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1 min-w-32">
                                 <button
                                    onClick={() => { setEditingCategory(cat); setIsCategoryModalOpen(true); setCategoryMenuOpen(null); }}
                                    className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                 >
                                    <Edit2 size={14} /> Editar
                                 </button>
                                 <button
                                    onClick={() => { if (confirm(`Excluir categoria "${cat.name}"?`)) { deleteSiteCategory(cat.id); setCategoryMenuOpen(null); } }}
                                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
                                 >
                                    <Trash2 size={14} /> Excluir
                                 </button>
                              </div>
                           )}
                        </div>
                     );
                  })}

                  {/* Add Category Button */}
                  <button
                     onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }}
                     className="px-3 py-2.5 rounded-xl text-sm font-medium bg-slate-800/30 border border-dashed border-slate-600 text-slate-500 hover:text-indigo-400 hover:border-indigo-500 transition-all flex items-center gap-1.5"
                     title="Nova categoria"
                  >
                     <FolderPlus size={16} /> Nova
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
                        linkedPrompts={linkedPromptsMap.get(link.id) || []}
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

         {/* SITE CATEGORY MODAL */}
         {isCategoryModalOpen && (
            <Suspense fallback={null}>
               <SiteCategoryModal
                  category={editingCategory}
                  onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
                  onSave={(category) => {
                     if (editingCategory) {
                        updateSiteCategory(editingCategory.id, category);
                     } else {
                        addSiteCategory({ ...category, order: siteCategories.length });
                     }
                     setIsCategoryModalOpen(false);
                     setEditingCategory(null);
                  }}
               />
            </Suspense>
         )}
      </div>
   );
};



export default LinksView;