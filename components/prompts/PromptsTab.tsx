import React, { useState, useMemo } from 'react';
import {
  Search, Plus, Trash2, X, Copy, Check, ChevronDown,
  Sparkles, Star, StarOff, FolderPlus, Image as ImageIcon,
  Edit2, Zap, Code, Palette, MessageSquare,
  FileText, Lightbulb, Bot, Wand2
} from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import { Prompt, PromptCategory, PromptImage } from '../../types';

// --- CATEGORY ICONS MAP ---
const categoryIcons: Record<string, React.ReactNode> = {
  'code': <Code size={14} />,
  'creative': <Palette size={14} />,
  'chat': <MessageSquare size={14} />,
  'writing': <FileText size={14} />,
  'ideas': <Lightbulb size={14} />,
  'ai': <Bot size={14} />,
  'magic': <Wand2 size={14} />,
  'default': <Zap size={14} />,
};

// --- DEFAULT CATEGORIES ---
const DEFAULT_CATEGORIES: PromptCategory[] = [
  { id: 'geral', name: 'Geral', color: 'slate', icon: 'default', order: 0 },
  { id: 'codigo', name: 'Código', color: 'emerald', icon: 'code', order: 1 },
  { id: 'escrita', name: 'Escrita', color: 'blue', icon: 'writing', order: 2 },
  { id: 'criativo', name: 'Criativo', color: 'purple', icon: 'creative', order: 3 },
  { id: 'ideias', name: 'Ideias', color: 'amber', icon: 'ideas', order: 4 },
];

// --- SAMPLE PROMPTS ---
const SAMPLE_PROMPTS: Prompt[] = [
  {
    id: '1',
    title: 'Refatorar Código',
    content: 'Analise o código abaixo e sugira melhorias de performance, legibilidade e boas práticas. Explique cada mudança sugerida.\n\n```\n[COLE SEU CÓDIGO AQUI]\n```',
    category: 'codigo',
    images: [],
    copyCount: 5,
    isFavorite: true,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: '2',
    title: 'Revisar Texto',
    content: 'Revise o texto abaixo corrigindo erros gramaticais, melhorando a clareza e mantendo o tom original. Destaque as principais mudanças feitas.\n\n[COLE SEU TEXTO AQUI]',
    category: 'escrita',
    images: [],
    copyCount: 3,
    isFavorite: false,
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000,
  },
];

// --- COLOR CLASSES ---
const colorClasses: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  slate: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', badge: 'bg-slate-500/20 text-slate-300' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-300' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', badge: 'bg-pink-500/20 text-pink-300' },
};

const PromptsTab: React.FC = () => {
  // --- STATE ---
  const [prompts, setPrompts] = useStorage<Prompt[]>('p67_prompts', SAMPLE_PROMPTS);
  const [categories, setCategories] = useStorage<PromptCategory[]>('p67_prompt_categories', DEFAULT_CATEGORIES);

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

  const copyToClipboard = async (prompt: Prompt) => {
    try {
      // Fallback for older browsers or when clipboard API fails
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(prompt.content);
      } else {
        // Fallback using textarea
        const textArea = document.createElement('textarea');
        textArea.value = prompt.content;
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
      setPrompts(prev => prev.map(p =>
        p.id === prompt.id ? { ...p, copyCount: p.copyCount + 1 } : p
      ));
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Try fallback on error
      try {
        const textArea = document.createElement('textarea');
        textArea.value = prompt.content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedId(prompt.id);
        setPrompts(prev => prev.map(p =>
          p.id === prompt.id ? { ...p, copyCount: p.copyCount + 1 } : p
        ));
        setTimeout(() => setCopiedId(null), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy also failed:', fallbackErr);
      }
    }
  };

  const toggleFavorite = (id: string) => {
    setPrompts(prev => prev.map(p =>
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  };

  const handleSave = (data: Partial<Prompt>) => {
    if (editingPrompt) {
      setPrompts(prev => prev.map(p =>
        p.id === editingPrompt.id ? { ...p, ...data, updatedAt: Date.now() } as Prompt : p
      ));
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
      setPrompts(prev => [...prev, newPrompt]);
    }
    setIsModalOpen(false);
    setEditingPrompt(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Remover este prompt?')) {
      setPrompts(prev => prev.filter(p => p.id !== id));
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
    setCategories(prev => [...prev, newCategory]);
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
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
              : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setSelectedCategory('favorites')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
            selectedCategory === 'favorites'
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
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
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
              className={`bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden transition-all duration-300 ${
                isExpanded ? 'shadow-xl shadow-purple-900/10' : 'hover:border-slate-600'
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
                    className={`p-2 rounded-lg transition-colors ${
                      prompt.isFavorite
                        ? 'text-amber-400 bg-amber-500/10'
                        : 'text-slate-500 hover:text-amber-400 hover:bg-slate-700'
                    }`}
                  >
                    {prompt.isFavorite ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(prompt)}
                    aria-label={isCopied ? 'Prompt copiado' : 'Copiar prompt'}
                    className={`p-2 rounded-lg transition-all ${
                      isCopied
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
                className={`grid transition-all duration-500 ease-in-out ${
                  isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 border-t border-slate-700/50">
                    {/* Prompt Content */}
                    <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                      <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                        {prompt.content}
                      </pre>
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
        <PromptModal
          prompt={editingPrompt}
          categories={categories}
          onClose={() => { setIsModalOpen(false); setEditingPrompt(null); }}
          onSave={handleSave}
        />
      )}

      {/* CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <CategoryModal
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={handleAddCategory}
        />
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
    </div>
  );
};

// --- PROMPT MODAL ---
const PromptModal: React.FC<{
  prompt: Prompt | null;
  categories: PromptCategory[];
  onClose: () => void;
  onSave: (data: Partial<Prompt>) => void;
}> = ({ prompt, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: prompt?.title || '',
    content: prompt?.content || '',
    category: prompt?.category || 'geral',
    images: prompt?.images || [] as PromptImage[],
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    const newImage: PromptImage = {
      id: Date.now().toString(),
      url: newImageUrl.trim(),
      caption: newImageCaption.trim() || undefined,
    };
    setFormData(prev => ({ ...prev, images: [...prev.images, newImage] }));
    setNewImageUrl('');
    setNewImageCaption('');
  };

  const removeImage = (id: string) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter(img => img.id !== id) }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-800 w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 shrink-0">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-purple-400" />
            {prompt ? 'Editar Prompt' : 'Novo Prompt'}
          </h3>
          <button onClick={onClose} aria-label="Fechar modal de prompt">
            <X className="text-slate-400 hover:text-white" size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs text-slate-500 uppercase font-bold mb-1">
              Título do Prompt
            </label>
            <input
              autoFocus
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
              placeholder="Ex: Refatorar código Python"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-slate-500 uppercase font-bold mb-2">
              Categoria
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => {
                const colors = colorClasses[cat.color] || colorClasses.slate;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      formData.category === cat.id
                        ? `${colors.bg} ${colors.text} border-2 ${colors.border}`
                        : 'bg-slate-900 text-slate-400 border border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {categoryIcons[cat.icon] || categoryIcons.default}
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs text-slate-500 uppercase font-bold mb-1">
              Conteúdo do Prompt
            </label>
            <textarea
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none font-mono text-sm resize-none"
              placeholder={`Digite seu prompt aqui...

Use [PLACEHOLDERS] para indicar onde o usuário deve inserir informações.`}
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-1">
              <ImageIcon size={12} /> Imagens de Exemplo (opcional)
            </label>

            {/* Existing Images */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {formData.images.map(img => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.url}
                      alt={img.caption || 'Exemplo'}
                      className="w-full h-20 object-cover rounded-lg border border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remover imagem do prompt"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Image */}
            <div className="flex gap-2">
              <input
                value={newImageUrl}
                onChange={e => setNewImageUrl(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-purple-500 outline-none"
                placeholder="URL da imagem..."
              />
              <input
                value={newImageCaption}
                onChange={e => setNewImageCaption(e.target.value)}
                className="w-32 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-purple-500 outline-none"
                placeholder="Legenda"
              />
              <button
                type="button"
                onClick={addImage}
                disabled={!newImageUrl.trim()}
                aria-label="Adicionar imagem de exemplo"
                className="px-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            disabled={!formData.title.trim() || !formData.content.trim()}
            onClick={() => onSave(formData)}
            className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold transition-colors shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
          >
            <Sparkles size={18} /> Salvar Prompt
          </button>
        </div>
      </div>
    </div>
  );
};

// --- CATEGORY MODAL ---
const CategoryModal: React.FC<{
  onClose: () => void;
  onSave: (name: string, color: string, icon: string) => void;
}> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('slate');
  const [icon, setIcon] = useState('default');

  const colors = ['slate', 'emerald', 'blue', 'purple', 'amber', 'rose', 'cyan', 'pink'];
  const icons = ['default', 'code', 'creative', 'chat', 'writing', 'ideas', 'ai', 'magic'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h3 className="font-bold text-white flex items-center gap-2">
            <FolderPlus size={18} className="text-purple-400" />
            Nova Categoria
          </h3>
          <button onClick={onClose} aria-label="Fechar modal de categorias">
            <X className="text-slate-400 hover:text-white" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Nome</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
              placeholder="Ex: Marketing"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Cor</label>
            <div className="flex flex-wrap gap-2">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Selecionar cor ${c}`}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    color === c ? 'scale-110 border-white' : 'border-transparent'
                  } ${colorClasses[c].bg}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {icons.map(i => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  aria-label={`Selecionar ícone ${i}`}
                  className={`p-2.5 rounded-lg border transition-all ${
                    icon === i
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {categoryIcons[i]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium">
            Cancelar
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => onSave(name.trim(), color, icon)}
            className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold transition-colors"
          >
            Criar Categoria
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptsTab;
