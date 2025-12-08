import React, { useState, useMemo, Suspense } from 'react';
import {
   Globe, Search, Plus, Trash2, ExternalLink,
   GripVertical, Edit2, X, Layout, LayoutGrid,
   ArrowUpRight, MousePointerClick, Sparkles
} from 'lucide-react';
import { LinkItem } from '../../types';
import { useStorage } from '../../hooks/useStorage';

// Lazy load PromptsTab
const PromptsTab = React.lazy(() => import('../prompts/PromptsTab'));

// --- MOCK DATA ---
const INITIAL_LINKS: LinkItem[] = [
   { id: '1', title: 'Meu Portfolio', url: 'https://github.com', category: 'PERSONAL', clickCount: 12, order: 0 },
   { id: '2', title: 'Projeto React', url: 'https://react.dev', category: 'PERSONAL', clickCount: 5, order: 1 },
   { id: '3', title: 'Google', url: 'https://google.com', category: 'GENERAL', clickCount: 42, order: 0 },
   { id: '4', title: 'YouTube', url: 'https://youtube.com', category: 'GENERAL', clickCount: 150, order: 1 },
   { id: '5', title: 'ChatGPT', url: 'https://chat.openai.com', category: 'GENERAL', clickCount: 89, order: 2 },
];

const LinksView: React.FC = () => {
   // --- STATE ---
   const [links, setLinks] = useStorage<LinkItem[]>('p67_links', INITIAL_LINKS);

   const [activeMainTab, setActiveMainTab] = useState<'links' | 'prompts'>('links');
   const [activeTab, setActiveTab] = useState<'PERSONAL' | 'GENERAL'>('PERSONAL');
   const [searchQuery, setSearchQuery] = useState('');

   // Modal State
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

   // Drag State
   const [draggedItem, setDraggedItem] = useState<LinkItem | null>(null);

   // --- HANDLERS ---

   const handleSave = (data: Partial<LinkItem>) => {
      if (editingLink) {
         setLinks(prev => prev.map(l => l.id === editingLink.id ? { ...l, ...data } as LinkItem : l));
      } else {
         const newLink: LinkItem = {
            id: Date.now().toString(),
            title: data.title || 'Novo Link',
            url: formatUrl(data.url || ''),
            category: activeTab, // Default to current tab
            clickCount: 0,
            order: links.filter(l => l.category === activeTab).length,
            ...data
         } as LinkItem;
         setLinks(prev => [...prev, newLink]);
      }
      setIsModalOpen(false);
      setEditingLink(null);
   };

   const handleDelete = (id: string) => {
      if (confirm("Remover este link?")) {
         setLinks(prev => prev.filter(l => l.id !== id));
      }
   };

   const handleClick = (link: LinkItem) => {
      // Update stats
      setLinks(prev => prev.map(l => l.id === link.id ? {
         ...l,
         clickCount: l.clickCount + 1,
         lastClicked: Date.now()
      } : l));
      window.open(link.url, '_blank');
   };

   // Drag and Drop
   const handleDragStart = (e: React.DragEvent, item: LinkItem) => {
      setDraggedItem(item);
      e.dataTransfer.effectAllowed = "move";
   };

   const handleDragOver = (e: React.DragEvent, targetItem: LinkItem) => {
      e.preventDefault();
      if (!draggedItem || draggedItem.id === targetItem.id || draggedItem.category !== targetItem.category) return;

      // Reorder logic
      setLinks(prev => {
         const newList = [...prev];
         const sourceIndex = newList.findIndex(i => i.id === draggedItem.id);
         const targetIndex = newList.findIndex(i => i.id === targetItem.id);

         // Remove source
         newList.splice(sourceIndex, 1);
         // Insert at target
         newList.splice(targetIndex, 0, draggedItem);

         // Update order property ONLY for items in the same category
         const category = draggedItem.category;
         let orderIndex = 0;
         return newList.map(item => {
            if (item.category === category) {
               return { ...item, order: orderIndex++ };
            }
            return item;
         });
      });
   };

   const handleDragEnd = () => {
      setDraggedItem(null);
   };

   // Helpers
   const formatUrl = (url: string) => {
      if (!url) return '';
      if (!/^https?:\/\//i.test(url)) {
         return `https://${url}`;
      }
      return url;
   };

   const getFavicon = (url: string) => {
      try {
         const domain = new URL(url).hostname;
         return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      } catch {
         return '';
      }
   };

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
                     <div
                        key={link.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, link)}
                        onDragOver={(e) => handleDragOver(e, link)}
                        onDragEnd={handleDragEnd}
                        className={`group relative bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-2xl p-4 flex items-center gap-4 transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer active:cursor-grabbing ${draggedItem?.id === link.id ? 'opacity-50 border-dashed border-indigo-500' : ''}`}
                        onClick={() => handleClick(link)}
                     >
                        {/* Icon / Favicon */}
                        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-700/50 shrink-0">
                           <img
                              src={getFavicon(link.url)}
                              alt=""
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                 (e.target as HTMLImageElement).style.display = 'none';
                                 (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                           />
                           <Globe size={24} className="text-slate-600 hidden" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                           <h3 className="font-bold text-slate-200 truncate">{link.title}</h3>
                           <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                              {(() => { try { return new URL(formatUrl(link.url)).hostname.replace('www.', ''); } catch { return link.url; } })()}
                              <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                           </p>
                           {link.clickCount > 0 && (
                              <div className="text-[10px] text-indigo-400/60 mt-1 flex items-center gap-1">
                                 <MousePointerClick size={10} /> {link.clickCount} acessos
                              </div>
                           )}
                        </div>

                        {/* Drag Handle */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 text-slate-600 hover:text-white" onClick={e => e.stopPropagation()}>
                           <GripVertical size={16} />
                        </div>

                        {/* Menu Button */}
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                           <div className="flex gap-1">
                              <button onClick={() => { setEditingLink(link); setIsModalOpen(true); }} title="Editar link" className="p-1.5 bg-slate-900 hover:bg-indigo-600 hover:text-white text-slate-400 rounded-lg transition-colors border border-slate-700">
                                 <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDelete(link.id)} title="Excluir link" className="p-1.5 bg-slate-900 hover:bg-red-600 hover:text-white text-slate-400 rounded-lg transition-colors border border-slate-700">
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </>
         )}

         {/* MODAL */}
         {isModalOpen && (
            <LinkModal
               link={editingLink}
               onClose={() => setIsModalOpen(false)}
               onSave={handleSave}
            />
         )}
      </div>
   );
};

const LinkModal: React.FC<{ link: LinkItem | null, onClose: () => void, onSave: (data: Partial<LinkItem>) => void }> = ({ link, onClose, onSave }) => {
   const [formData, setFormData] = useState<{ title: string; url: string; category: 'PERSONAL' | 'GENERAL' }>({
      title: link?.title || '',
      url: link?.url || '',
      category: link?.category || 'PERSONAL'
   });

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
         <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
               <h3 className="font-bold text-white">{link ? 'Editar Link' : 'Novo Link'}</h3>
               <button onClick={onClose} title="Fechar"><X className="text-slate-400 hover:text-white" size={20} /></button>
            </div>

            <div className="p-6 space-y-4">
               <div>
                  <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Título do Site</label>
                  <input
                     autoFocus
                     value={formData.title}
                     onChange={e => setFormData({ ...formData, title: e.target.value })}
                     className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                     placeholder="Ex: Github"
                  />
               </div>
               <div>
                  <label className="block text-xs text-slate-500 uppercase font-bold mb-1">URL (Endereço)</label>
                  <div className="relative">
                     <input
                        value={formData.url}
                        onChange={e => setFormData({ ...formData, url: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:border-indigo-500 outline-none font-mono text-sm"
                        placeholder="google.com"
                     />
                     <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  </div>
               </div>
               <div>
                  <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Categoria</label>
                  <div className="flex gap-2">
                     <button
                        onClick={() => setFormData({ ...formData, category: 'PERSONAL' })}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${formData.category === 'PERSONAL' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                     >
                        Meus Sites
                     </button>
                     <button
                        onClick={() => setFormData({ ...formData, category: 'GENERAL' })}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${formData.category === 'GENERAL' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                     >
                        Sites Gerais
                     </button>
                  </div>
               </div>
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3">
               <button onClick={onClose} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium">Cancelar</button>
               <button
                  disabled={!formData.title || !formData.url}
                  onClick={() => onSave(formData)}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
               >
                  <ArrowUpRight size={18} /> Salvar
               </button>
            </div>
         </div>
      </div>
   );
}

export default LinksView;