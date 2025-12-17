import React, { useState, useMemo, Suspense } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  Search, Plus, Trash2, X, Copy, Check, ChevronDown,
  Sparkles, Star, StarOff, FolderPlus, Image as ImageIcon, Edit2
} from 'lucide-react';
import { usePromptsStore } from '../../stores';
import { Prompt, PromptCategory } from '../../types';
import { VariableSelectorModal, parseVariables } from './VariableSelectorModal';
import { categoryIcons, colorClasses } from './constants';

// Lazy load components
const MarkdownRenderer = React.lazy(() =>
  import('../notes/MarkdownRenderer').then(module => ({ default: module.MarkdownRenderer }))
);
const PromptModal = React.lazy(() => import('./PromptModal'));
const CategoryModal = React.lazy(() => import('./CategoryModal'));



const PromptsTab: React.FC = () => {
  // --- STATE ---
  // Zustand store
  const {
    prompts,
    categories,
    addPrompt,
    updatePrompt,
    deletePrompt,
    incrementCopyCount,
    toggleFavorite: togglePromptFavorite,
    addCategory
  } = usePromptsStore(useShallow((state) => ({
    prompts: state.prompts,
    categories: state.categories,
    addPrompt: state.addPrompt,
    updatePrompt: state.updatePrompt,
    deletePrompt: state.deletePrompt,
    incrementCopyCount: state.incrementCopyCount,
    toggleFavorite: state.toggleFavorite,
    addCategory: state.addCategory
  })));

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all' | 'favorites'>('all');
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Image preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Variable selector modal state
  const [variableSelectorPrompt, setVariableSelectorPrompt] = useState<Prompt | null>(null);

  // --- HANDLERS ---
  const toggleExpand = (id: string) => {
    setExpandedPrompts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Check if content has variables and open selector modal if so
  const handleCopyClick = (prompt: Prompt) => {
    const variables = parseVariables(prompt.content);
    if (variables.length > 0) {
      // Has variables - open selector modal
      setVariableSelectorPrompt(prompt);
    } else {
      // No variables - copy directly
      copyToClipboard(prompt);
    }
  };

  const copyToClipboard = async (prompt: Prompt, processedContent?: string) => {
    const contentToCopy = processedContent || prompt.content;
    try {
      // Fallback for older browsers or when clipboard API fails
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(contentToCopy);
      } else {
        // Fallback using textarea
        const textArea = document.createElement('textarea');
        textArea.value = contentToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(prompt.id);
      incrementCopyCount(prompt.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Try fallback on error
      try {
        const textArea = document.createElement('textarea');
        textArea.value = contentToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedId(prompt.id);
        incrementCopyCount(prompt.id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy also failed:', fallbackErr);
      }
    }
  };

  // Handler when variable selector modal completes copy
  const handleVariableCopy = (processedContent: string) => {
    if (variableSelectorPrompt) {
      copyToClipboard(variableSelectorPrompt, processedContent);
    }
  };

  const toggleFavorite = (id: string) => {
    togglePromptFavorite(id);
  };

  const handleSave = (data: Partial<Prompt>) => {
    if (editingPrompt) {
      updatePrompt(editingPrompt.id, data);
    } else {
      const newPrompt: Prompt = {
        id: Date.now().toString(),
        title: data.title || 'Novo Prompt',
        content: data.content || '',
        category: data.category || 'geral',
        images: data.images || [],
        copyCount: 0,
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addPrompt(newPrompt);
    }
    setIsModalOpen(false);
    setEditingPrompt(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Remover este prompt?')) {
      deletePrompt(id);
    }
  };

  const handleAddCategory = (name: string, color: string, icon: string) => {
    const newCategory: PromptCategory = {
      id: Date.now().toString(),
      name,
      color,
      icon,
      order: categories.length,
    };
    addCategory(newCategory);
    setIsCategoryModalOpen(false);
  };

  // --- FILTERING ---
  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const matchesSearch = searchQuery
        ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const matchesCategory =
        selectedCategory === 'all' ? true :
          selectedCategory === 'favorites' ? p.isFavorite :
            p.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [prompts, searchQuery, selectedCategory]);

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-purple-400" size={22} />
            Meus Prompts
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Organize e acesse seus prompts favoritos rapidamente.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar prompts..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
            title="Nova Categoria"
          >
            <FolderPlus size={18} />
          </button>
          <button
            onClick={() => { setEditingPrompt(null); setIsModalOpen(true); }}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-purple-900/20 transition-all hover:scale-105 flex items-center gap-2 font-medium"
          >
            <Plus size={18} /> <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      {/* CATEGORY FILTERS */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === 'all'
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
            : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
        >
          Todos
        </button>
        <button
          onClick={() => setSelectedCategory('favorites')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${selectedCategory === 'favorites'
            ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/20'
            : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
        >
          <Star size={14} /> Favoritos
        </button>
        {categories.map(cat => {
          const colors = colorClasses[cat.color] || colorClasses.slate;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${selectedCategory === cat.id
                ? `${colors.bg} ${colors.text} border ${colors.border}`
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
            >
              {categoryIcons[cat.icon] || categoryIcons.default}
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* PROMPTS LIST */}
      <div className="space-y-3">
        {filteredPrompts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <Sparkles size={48} className="text-slate-600 mb-4" />
            <p className="text-slate-500">Nenhum prompt encontrado.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-3 text-purple-400 hover:underline text-sm"
            >
              Criar primeiro prompt
            </button>
          </div>
        )}

        {filteredPrompts.map(prompt => {
          const isExpanded = expandedPrompts.has(prompt.id);
          const category = getCategoryById(prompt.category);
          const colors = colorClasses[category?.color || 'slate'];
          const isCopied = copiedId === prompt.id;

          return (
            <div
              key={prompt.id}
              className={`bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-xl shadow-purple-900/10' : 'hover:border-slate-600'
                }`}
            >
              {/* Header */}
              <div
                className="p-4 flex items-center gap-3 cursor-pointer group"
                onClick={() => toggleExpand(prompt.id)}
              >
                {/* Category Badge */}
                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${colors.badge}`}>
                  {categoryIcons[category?.icon || 'default']}
                  {category?.name || 'Geral'}
                </div>

                {/* Title */}
                <h4 className="flex-1 font-semibold text-white truncate">{prompt.title}</h4>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
                  {prompt.images.length > 0 && (
                    <span className="flex items-center gap-1">
                      <ImageIcon size={12} /> {prompt.images.length}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Copy size={12} /> {prompt.copyCount}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => toggleFavorite(prompt.id)}
                    aria-label={prompt.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    className={`p-2 rounded-lg transition-colors ${prompt.isFavorite
                      ? 'text-amber-400 bg-amber-500/10'
                      : 'text-slate-500 hover:text-amber-400 hover:bg-slate-700'
                      }`}
                  >
                    {prompt.isFavorite ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                  </button>
                  <button
                    onClick={() => handleCopyClick(prompt)}
                    aria-label={isCopied ? 'Prompt copiado' : 'Copiar prompt'}
                    className={`p-2 rounded-lg transition-all ${isCopied
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-slate-500 hover:text-white hover:bg-slate-700'
                      }`}
                    title="Copiar prompt"
                  >
                    {isCopied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                {/* Expand Icon */}
                <div className={`p-1 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                  <ChevronDown size={20} />
                </div>
              </div>

              {/* Expandable Content */}
              <div
                className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
              >
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 border-t border-slate-700/50">
                    {/* Prompt Content with Markdown */}
                    <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                      <React.Suspense fallback={<div className="h-20 bg-slate-800/50 animate-pulse rounded-lg" />}>
                        <MarkdownRenderer content={prompt.content} className="text-sm" />
                      </React.Suspense>
                    </div>

                    {/* Images */}
                    {prompt.images.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                          <ImageIcon size={12} /> Imagens de Exemplo
                        </h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {prompt.images.map(img => (
                            <div
                              key={img.id}
                              className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-900 cursor-pointer hover:border-purple-500 transition-colors"
                              onClick={() => setPreviewImage(img.url)}
                            >
                              <img
                                src={img.url}
                                alt={img.caption || 'Exemplo'}
                                className="w-full h-24 object-cover transition-transform group-hover:scale-105"
                              />
                              {img.caption && (
                                <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-xs text-slate-300 truncate">
                                  {img.caption}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions Footer */}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-600">
                        Criado em {new Date(prompt.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingPrompt(prompt); setIsModalOpen(true); }}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <Edit2 size={12} /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(prompt.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 size={12} /> Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PROMPT MODAL */}
      {isModalOpen && (
        <Suspense fallback={null}>
          <PromptModal
            prompt={editingPrompt}
            categories={categories}
            onClose={() => { setIsModalOpen(false); setEditingPrompt(null); }}
            onSave={handleSave}
          />
        </Suspense>
      )}

      {/* CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <Suspense fallback={null}>
          <CategoryModal
            onClose={() => setIsCategoryModalOpen(false)}
            onSave={handleAddCategory}
          />
        </Suspense>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors"
            aria-label="Fechar visualização de imagem"
            onClick={() => setPreviewImage(null)}
          >
            <X size={24} />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* VARIABLE SELECTOR MODAL */}
      {variableSelectorPrompt && (
        <VariableSelectorModal
          content={variableSelectorPrompt.content}
          onCopy={handleVariableCopy}
          onClose={() => setVariableSelectorPrompt(null)}
        />
      )}
    </div>
  );
};

export default PromptsTab;
