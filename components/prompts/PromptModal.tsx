import React, { useState, useMemo } from 'react';
import { X, Plus, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Prompt, PromptCategory, PromptImage } from '../../types';
import { categoryIcons, colorClasses } from './constants';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { UnsavedChangesModal } from '../shared/UnsavedChangesModal';

interface PromptModalProps {
    prompt: Prompt | null;
    categories: PromptCategory[];
    onClose: () => void;
    onSave: (data: Partial<Prompt>) => void;
}

const PromptModal: React.FC<PromptModalProps> = ({ prompt, categories, onClose, onSave }) => {
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

    const [showUnsavedModal, setShowUnsavedModal] = useState(false);

    // Memoize initial values for comparison
    const initialValues = useMemo(() => ({
        title: prompt?.title || '',
        content: prompt?.content || '',
        category: prompt?.category || 'geral',
        images: prompt?.images || [],
    }), []);

    // Track unsaved changes
    const { hasChanges } = useUnsavedChanges({
        initialValue: initialValues,
        currentValue: formData,
    });

    // Intercept close to check for unsaved changes
    const handleClose = () => {
        if (hasChanges) {
            setShowUnsavedModal(true);
        } else {
            onClose();
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                {/* Clickable backdrop */}
                <div className="absolute inset-0" onClick={handleClose} aria-hidden="true" />
                <div className="relative bg-slate-800 w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 shrink-0">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Sparkles size={18} className="text-purple-400" />
                            {prompt ? 'Editar Prompt' : 'Novo Prompt'}
                        </h3>
                        <button onClick={handleClose} aria-label="Fechar modal de prompt">
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
                                            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${formData.category === cat.id
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
                                placeholder={`Digite seu prompt aqui...\n\nUse [PLACEHOLDERS] para indicar onde o usuário deve inserir informações.`}
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
                            onClick={handleClose}
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

            {/* Unsaved Changes Confirmation Modal */}
            <UnsavedChangesModal
                isOpen={showUnsavedModal}
                onSave={() => {
                    setShowUnsavedModal(false);
                    onSave(formData);
                }}
                onDiscard={() => {
                    setShowUnsavedModal(false);
                    onClose();
                }}
                onCancel={() => setShowUnsavedModal(false)}
            />
        </>
    );
};

export default PromptModal;
