import React, { useState, useMemo, Suspense, useCallback } from 'react';
import {
   Globe, Search, Plus, X, Sparkles, FolderPlus, MoreVertical, Trash2, Edit2, ChevronRight, Home
} from 'lucide-react';
import SiteCard from '../links/SiteCard';
import { LinkItem, SiteCategory, Site } from '../../types';
import { useLinks, useLinkActions } from '../../stores/linksStore';
import { usePromptsStore, useSiteCategories, useIsSiteCategoriesLoading, useSiteCategoryActions, useSites, useSiteActions, useSiteFolders } from '../../stores';
import { PromptPreviewModal } from '../skills/PromptPreviewModal';
import { siteIcons } from '../links/constants';

// Lazy load Components
const PromptsTab = React.lazy(() => import('../prompts/PromptsTab'));
const LinkModal = React.lazy(() => import('../links/LinkModal'));
const SiteModal = React.lazy(() => import('../links/SiteModal'));
const SiteCategoryModal = React.lazy(() => import('../links/SiteCategoryModal'));

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
   const isSiteCategoriesLoading = useIsSiteCategoriesLoading();
   const { addCategory: addSiteCategory, updateCategory: updateSiteCategory, deleteCategory: deleteSiteCategory, getCategoryPath } = useSiteCategoryActions();

   const sites = useSites();
   const { addSite, updateSite, deleteSite, reorderSites } = useSiteActions();
   const folders = useSiteFolders();

   const [activeMainTab, setActiveMainTab] = useState<'links' | 'prompts'>('links');
   const [activeTab, setActiveTab] = useState('personal');
   const [searchQuery, setSearchQuery] = useState('');

   // Site Category Modal State
   const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
   const [editingCategory, setEditingCategory] = useState<SiteCategory | null>(null);
   const [categoryMenuOpen, setCategoryMenuOpen] = useState<string | null>(null);

   // Link Modal State
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
   const [linkDefaultSiteId, setLinkDefaultSiteId] = useState<string | undefined>(undefined);

   // Site Modal State
   const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
   const [editingSite, setEditingSite] = useState<Site | null>(null);
   const [openPromptSelectorOnModal, setOpenPromptSelectorOnModal] = useState(false);

   // Drag State
   const [draggedSite, setDraggedSite] = useState<Site | null>(null);

   // Prompt Modal States
   const [previewPromptId, setPreviewPromptId] = useState<string | null>(null);

   // --- HANDLERS ---

   // Links Handlers
   const handleSaveLink = useCallback((data: Partial<LinkItem>) => {
      if (editingLink) {
         updateLink(editingLink.id, data);
      } else {
         // If in 'all' view, use the first category (Personal/Meus Sites) as default if no site selected
         const targetCategory = activeTab === 'all' ? (siteCategories[0]?.id || 'personal') : activeTab;

         // If siteId is provided in data (selected in modal), use it.
         // Otherwise, if we started adding from a site card (linkDefaultSiteId), use that.

         const newLink: LinkItem = {
            id: Date.now().toString(),
            title: data.title || 'Novo Link',
            url: formatUrl(data.url || ''),
            categoryId: targetCategory, // Legacy support
            siteId: data.siteId || linkDefaultSiteId || '',
            folderId: data.folderId || null,
            clickCount: 0,
            order: data.siteId
               ? links.filter(l => l.siteId === data.siteId).length // Add to end of site
               : links.filter(l => !l.siteId && l.categoryId === targetCategory).length, // Add to end of category orphans
            promptIds: [],
            ...data
         } as LinkItem;
         addLink(newLink);
      }
      setIsModalOpen(false);
      setEditingLink(null);
      setLinkDefaultSiteId(undefined);
   }, [editingLink, activeTab, links, linkDefaultSiteId, updateLink, addLink, siteCategories]);

   const handleDeleteLink = useCallback((id: string) => {
      if (confirm("Remover este link?")) {
         removeLink(id);
      }
   }, [removeLink]);

   const handleClickLink = useCallback((link: LinkItem) => {
      incrementClickCount(link.id);
      window.open(link.url, '_blank');
   }, [incrementClickCount]);

   const handleEditLink = useCallback((link: LinkItem) => {
      setEditingLink(link);
      setLinkDefaultSiteId(link.siteId);
      setIsModalOpen(true);
   }, []);

   // Sites Handlers
   const handleSaveSite = useCallback((siteData: Partial<Site>, newLinks?: Partial<LinkItem>[]) => {
      let siteId = siteData.id;

      if (editingSite) {
         updateSite(editingSite.id, siteData);
         siteId = editingSite.id;
      } else {
         // Create new site
         const newSite: Site = {
            id: siteData.id || `site_${Date.now()}`,
            name: siteData.name || 'Novo Site',
            categoryId: siteData.categoryId || (activeTab === 'all' ? 'personal' : activeTab),
            order: sites.filter(s => s.categoryId === (siteData.categoryId || activeTab)).length,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ...siteData
         } as Site;
         addSite(newSite);
         siteId = newSite.id;
      }

      // Add any new links created within the site modal
      if (newLinks && newLinks.length > 0) {
         newLinks.forEach((linkData, index) => {
            const newLink: LinkItem = {
               id: Date.now().toString() + index, // Ensure unique IDs
               title: linkData.title || 'Novo Link',
               url: formatUrl(linkData.url || ''),
               siteId: siteId!,
               categoryId: siteData.categoryId || activeTab,
               clickCount: 0,
               order: index, // Start orders from 0 for these new links
               promptIds: [],
               ...linkData
            } as LinkItem;
            addLink(newLink);
         });
      }

      setIsSiteModalOpen(false);
      setEditingSite(null);
   }, [editingSite, activeTab, sites, addSite, updateSite, addLink]);

   const handleDeleteSite = useCallback((siteId: string) => {
      if (confirm("Tem certeza que deseja excluir este site? Todos os links dentro dele serão movidos para 'Sem Site'.")) {
         deleteSite(siteId);
         // NOTE: Ideally we should update links to remove siteId, but for now they will become orphans
         // which is handled by the store or UI automatically if they just have empty siteId key?
         // Actually, if we delete the site, the links still reference it. 
         // Implementation detail: we should probably update links here, but for now user can delete them manually
         // or they will just disappear from site view and appear in generic list if we filter right.
      }
   }, [deleteSite]);

   const handleEditSite = useCallback((site: Site) => {
      setEditingSite(site);
      setIsSiteModalOpen(true);
   }, []);

   const handleAddLinkToSite = useCallback((siteId: string) => {
      setLinkDefaultSiteId(siteId);
      setEditingLink(null);
      setIsModalOpen(true);
   }, []);

   const handlePreviewPrompt = useCallback((id: string) => {
      setPreviewPromptId(id);
   }, []);

   const handleLinkPromptToSite = useCallback((siteId: string) => {
      const site = sites.find(s => s.id === siteId);
      if (site) {
         setEditingSite(site);
         setOpenPromptSelectorOnModal(true);
         setIsSiteModalOpen(true);
      }
   }, [sites]);



   const handleDragStartSite = useCallback((e: React.DragEvent, site: Site) => {
      setDraggedSite(site);
      e.dataTransfer.effectAllowed = "move";
      e.stopPropagation();
   }, []);

   const handleDragOver = useCallback((e: React.DragEvent, _targetItem?: LinkItem, targetSite?: Site) => {
      e.preventDefault();
      if (activeTab === 'all') return; // Disable reordering in 'All' view

      // Handle Site Reordering
      if (draggedSite && targetSite && draggedSite.id !== targetSite.id && draggedSite.categoryId === targetSite.categoryId) {
         const newList = [...sites];
         const sourceIndex = newList.findIndex(s => s.id === draggedSite.id);
         const targetIndex = newList.findIndex(s => s.id === targetSite.id);

         if (sourceIndex > -1 && targetIndex > -1) {
            newList.splice(sourceIndex, 1);
            newList.splice(targetIndex, 0, draggedSite);

            // Update orders
            const categoryId = draggedSite.categoryId;
            let orderIndex = 0;
            const reorderedList = newList.map(s => {
               if (s.categoryId === categoryId) return { ...s, order: orderIndex++ };
               return s;
            });
            reorderSites(reorderedList);
         }
      }
   }, [draggedSite, sites, reorderSites, activeTab]);

   const handleDragEnd = useCallback(() => {
      setDraggedSite(null);
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

   const getPromptById = (promptId: string) => prompts.find(p => p.id === promptId);
   const getCategoryById = (catId: string) => promptCategories.find(c => c.id === catId);

   // Pre-compute linked prompts map
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

   // --- FILTERING & DATA PREP ---

   // 1. Filter Sites
   const filteredSites = useMemo(() => {
      if (activeTab === 'all') {
         return sites
            .filter(s =>
               searchQuery
                  ? s.name.toLowerCase().includes(searchQuery.toLowerCase())
                  : true
            )
            .sort((a, b) => a.order - b.order);
      }
      return sites
         .filter(s => s.categoryId === activeTab)
         .filter(s =>
            searchQuery
               ? s.name.toLowerCase().includes(searchQuery.toLowerCase())
               : true
         )
         .sort((a, b) => a.order - b.order);
   }, [sites, activeTab, searchQuery]);



   // Get current category info
   const currentCategory = siteCategories.find(c => c.id === activeTab);
   const categoryPath = currentCategory ? getCategoryPath(activeTab) : [];
   const hasParent = currentCategory?.parentId !== null && currentCategory?.parentId !== undefined;
   const rootCategories = siteCategories.filter(c => c.parentId === null);

   // Simple helper to get links for a site (for SiteCard)
   const getLinksForSite = (siteId: string) => {
      return links
         .filter(l => l.siteId === siteId)
         .sort((a, b) => a.order - b.order);
   };

   // Loading State
   if (isSiteCategoriesLoading) {
      return (
         <div className="max-w-6xl mx-auto pb-20 flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4">
               <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
               <p className="text-slate-400 text-sm">Carregando categorias...</p>
            </div>
         </div>
      );
   }

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

         {/* MAIN TABS */}
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
               {/* LINKS ACTIONS BAR */}
               <div className="flex flex-col sm:flex-row w-full gap-3 mb-6">
                  <div className="relative flex-1">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                     <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Buscar sites e links..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                     />
                     {searchQuery && (
                        <button onClick={() => setSearchQuery('')} title="Limpar busca" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                           <X size={14} />
                        </button>
                     )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                     {/* ADD SITE BUTTON */}
                     <button
                        onClick={() => { setEditingSite(null); setIsSiteModalOpen(true); }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl shadow-lg shadow-indigo-900/20 transition-all hover:scale-105 flex items-center gap-2 font-medium"
                     >
                        <Plus size={20} /> <span className="hidden sm:inline">Novo Site</span>
                     </button>
                  </div>
               </div>

               {/* BREADCRUMB */}
               {hasParent && categoryPath.length > 0 && (
                  <div className="flex items-center gap-1 mb-4 text-sm text-slate-400 flex-wrap">
                     <button
                        onClick={() => setActiveTab('all')}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                     >
                        <Home size={14} />
                        <span>Início</span>
                     </button>
                     {categoryPath.map((cat, idx) => (
                        <React.Fragment key={cat.id}>
                           <ChevronRight size={14} className="text-slate-600" />
                           <button
                              onClick={() => setActiveTab(cat.id)}
                              className={`hover:text-white transition-colors ${idx === categoryPath.length - 1 ? 'text-white font-medium' : ''}`}
                           >
                              {cat.name}
                           </button>
                        </React.Fragment>
                     ))}
                  </div>
               )}


               {/* TAB NAVIGATOR */}
               <div className="flex flex-wrap gap-2 mb-4">
                  {/* "Todos" Tab */}
                  <button
                     onClick={() => setActiveTab('all')}
                     className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'all'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700'
                        }`}
                  >
                     <Globe size={16} />
                     Todos
                     <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'all' ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                        {sites.length}
                     </span>
                  </button>

                  {/* Root Categories */}
                  {rootCategories.map(cat => {
                     const isActive = activeTab === cat.id;
                     const IconComponent = siteIcons[cat.icon];
                     // Count sites in this category
                     const siteCount = sites.filter(s => s.categoryId === cat.id).length;

                     return (
                        <div key={cat.id} className="relative group">
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
                                 {siteCount}
                              </span>
                           </button>

                           {/* Category Menu (Edit/Delete) - Only for non-default */}
                           {!cat.isDefault && (
                              <button
                                 onClick={(e) => { e.stopPropagation(); setCategoryMenuOpen(categoryMenuOpen === cat.id ? null : cat.id); }}
                                 className="absolute -top-1 -right-1 p-1 bg-slate-700 rounded-full md:opacity-0 md:group-hover:opacity-100 hover:bg-slate-600 transition-opacity"
                                 title="Opções"
                              >
                                 <MoreVertical size={12} />
                              </button>
                           )}

                           {/* Dropdown */}
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

               {/* SUBCATEGORIES */}
               {(() => {
                  const subcategories = siteCategories.filter(c => c.parentId === activeTab);
                  if (subcategories.length === 0) return null;
                  return (
                     <div className="mb-6">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-2">Subcategorias</p>
                        <div className="flex flex-wrap gap-2">
                           {subcategories.map(sub => {
                              const SubIcon = siteIcons[sub.icon];
                              const subCount = sites.filter(s => s.categoryId === sub.id).length;
                              return (
                                 <button
                                    key={sub.id}
                                    onClick={() => setActiveTab(sub.id)}
                                    className="px-3 py-2 rounded-lg text-sm bg-slate-800/70 border border-slate-700 text-slate-300 hover:text-white hover:border-indigo-500 hover:bg-slate-700 transition-all flex items-center gap-2"
                                 >
                                    {SubIcon || <FolderPlus size={14} />}
                                    {sub.name}
                                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-600">{subCount}</span>
                                 </button>
                              );
                           })}
                        </div>
                     </div>
                  );
               })()}

               {/* GRID - SITES FIRST, THEN LINKS */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

                  {/* 1. RENDER SITES */}
                  {filteredSites.map(site => (
                     <SiteCard
                        key={site.id}
                        site={site}
                        links={getLinksForSite(site.id)}
                        sitePrompts={site.promptIds?.map(id => prompts.find(p => p.id === id)).filter((p): p is typeof prompts[0] => !!p)}
                        linkedPromptsMap={linkedPromptsMap}
                        isDragging={draggedSite?.id === site.id}
                        onEditSite={handleEditSite}
                        onLinkPrompt={handleLinkPromptToSite}
                        onDeleteSite={handleDeleteSite}
                        onAddLink={handleAddLinkToSite}
                        onClickLink={handleClickLink}
                        onEditLink={handleEditLink}
                        onDeleteLink={handleDeleteLink}
                        onPreviewPrompt={handlePreviewPrompt}
                        getFavicon={getFavicon}
                        formatUrl={formatUrl}
                        onDragStart={handleDragStartSite}
                        onDragOver={(e, s) => handleDragOver(e, undefined, s)}
                        onDragEnd={handleDragEnd}
                     />
                  ))}

                  {/* EMPTY STATE */}
                  {filteredSites.length === 0 && (
                     <div className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20 text-slate-500">
                        <Globe size={48} className="mb-4 opacity-50" />
                        <p>Nenhum site encontrado nesta categoria.</p>
                        <button
                           onClick={() => { setEditingSite(null); setIsSiteModalOpen(true); }}
                           className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                        >
                           Criar novo Site
                        </button>
                     </div>
                  )}
               </div>
            </>
         )}

         {/* LINK MODAL */}
         {
            isModalOpen && (
               <Suspense fallback={null}>
                  <LinkModal
                     link={editingLink}
                     prompts={prompts}
                     promptCategories={promptCategories}
                     siteCategories={siteCategories}
                     sites={sites}
                     folders={folders}
                     defaultSiteId={linkDefaultSiteId}
                     onClose={() => setIsModalOpen(false)}
                     onSave={handleSaveLink}
                  />
               </Suspense>
            )
         }

         {/* SITE MODAL */}
         {
            isSiteModalOpen && (
               <Suspense fallback={null}>
                  <SiteModal
                     site={editingSite}
                     categories={siteCategories}
                     links={editingSite ? getLinksForSite(editingSite.id) : []}
                     prompts={prompts}
                     promptCategories={promptCategories}
                     defaultCategoryId={activeTab === 'all' ? 'personal' : activeTab}
                     initialOpenPromptSelector={openPromptSelectorOnModal}
                     onClose={() => {
                        setIsSiteModalOpen(false);
                        setOpenPromptSelectorOnModal(false);
                     }}
                     onSave={handleSaveSite}
                  />
               </Suspense>
            )
         }

         {/* PREVIEW MODAL */}
         {
            previewPromptId && getPromptById(previewPromptId) && (
               <PromptPreviewModal
                  prompt={getPromptById(previewPromptId)!}
                  category={getCategoryById(getPromptById(previewPromptId)!.category)}
                  onClose={() => setPreviewPromptId(null)}
               />
            )
         }

         {/* CATEGORY MODAL */}
         {
            isCategoryModalOpen && (
               <Suspense fallback={null}>
                  <SiteCategoryModal
                     category={editingCategory}
                     categories={siteCategories}
                     defaultParentId={null}
                     onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
                     onSave={(category) => {
                        if (editingCategory) {
                           updateSiteCategory(editingCategory.id, category);
                        } else {
                           addSiteCategory({ ...category, order: siteCategories.length } as SiteCategory);
                        }
                        setIsCategoryModalOpen(false);
                        setEditingCategory(null);
                     }}
                  />
               </Suspense>
            )
         }
      </div >
   );
};

export default LinksView;