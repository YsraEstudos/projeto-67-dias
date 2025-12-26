import React, { useState, useEffect, useMemo } from 'react';
import { X, FolderPlus, Home } from 'lucide-react';
import { SiteCategory } from '../../types';
import { siteIcons, siteColorClasses, siteIconNames, siteColorNames } from './constants';

// Local alias for backward compatibility within this file
const colorClasses = siteColorClasses;

interface SiteCategoryModalProps {
    category?: SiteCategory | null; // null = nova categoria
    categories: SiteCategory[]; // All categories for parent picker
    defaultParentId?: string | null; // Default parent when creating subcategory
    onClose: () => void;
    onSave: (category: Omit<SiteCategory, 'order'>) => void;
}

const SiteCategoryModal: React.FC<SiteCategoryModalProps> = ({
    category,
    categories,
    defaultParentId = null,
    onClose,
    onSave
}) => {
    const isEditing = !!category;

    const [name, setName] = useState(category?.name || '');
    const [color, setColor] = useState(category?.color || 'indigo');
    const [icon, setIcon] = useState(category?.icon || 'layout');
    const [parentId, setParentId] = useState<string | null>(category?.parentId ?? defaultParentId);

    const colors = siteColorNames;
    const icons = siteIconNames;

    // Build flat list with indentation for select (excluding self and descendants when editing)
    const parentOptions = useMemo(() => {
        const result: { id: string | null; label: string; depth: number }[] = [
            { id: null, label: '📁 Raiz (Nenhuma)', depth: 0 }
        ];

        // Get all descendants of current category (to exclude from options)
        const getDescendantIds = (catId: string): Set<string> => {
            const descendants = new Set<string>([catId]);
            categories
                .filter(c => c.parentId === catId)
                .forEach(child => {
                    getDescendantIds(child.id).forEach(id => descendants.add(id));
                });
            return descendants;
        };

        const excludeIds = category ? getDescendantIds(category.id) : new Set<string>();

        const buildOptions = (pId: string | null, depth: number) => {
            categories
                .filter(c => c.parentId === pId && !excludeIds.has(c.id))
                .sort((a, b) => a.order - b.order)
                .forEach(cat => {
                    const indent = '  '.repeat(depth);
                    result.push({
                        id: cat.id,
                        label: `${indent}📁 ${cat.name}`,
                        depth
                    });
                    buildOptions(cat.id, depth + 1);
                });
        };

        buildOptions(null, 1);
        return result;
    }, [categories, category]);

    useEffect(() => {
        if (category) {
            setName(category.name);
            setColor(category.color);
            setIcon(category.icon);
            setParentId(category.parentId);
        }
    }, [category]);

    const handleSave = () => {
        if (!name.trim()) return;

        onSave({
            id: category?.id || `cat_${Date.now()}`,
            name: name.trim(),
            color,
            icon,
            parentId,
            isDefault: category?.isDefault || false,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <FolderPlus size={18} className="text-indigo-400" />
                        {isEditing ? 'Editar Categoria' : (defaultParentId ? 'Nova Subcategoria' : 'Nova Categoria')}
                    </h3>
                    <button onClick={onClose} aria-label="Fechar modal">
                        <X className="text-slate-400 hover:text-white" size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    {/* Nome */}
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Nome</label>
                        <input
                            autoFocus
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                            placeholder="Ex: Trabalho, Estudos, Lazer..."
                            disabled={category?.isDefault}
                        />
                        {category?.isDefault && (
                            <p className="text-xs text-amber-400 mt-1">Categorias padrão não podem ser renomeadas</p>
                        )}
                    </div>

                    {/* Categoria Pai */}
                    {!category?.isDefault && (
                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Categoria Pai</label>
                            <select
                                value={parentId ?? ''}
                                onChange={e => setParentId(e.target.value || null)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                            >
                                {parentOptions.map(opt => (
                                    <option key={opt.id ?? 'root'} value={opt.id ?? ''}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            {parentId && (
                                <p className="text-xs text-slate-500 mt-1">
                                    Esta será uma subcategoria
                                </p>
                            )}
                        </div>
                    )}

                    {/* Cor */}
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Cor</label>
                        <div className="flex flex-wrap gap-2">
                            {colors.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    aria-label={`Selecionar cor ${c}`}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${color === c ? 'scale-110 border-white' : 'border-transparent'
                                        } ${colorClasses[c].bg}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Ícone */}
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Ícone</label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                            {icons.map(i => (
                                <button
                                    key={i}
                                    onClick={() => setIcon(i)}
                                    aria-label={`Selecionar ícone ${i}`}
                                    className={`p-2.5 rounded-lg border transition-all ${icon === i
                                        ? 'bg-indigo-600 border-indigo-500 text-white'
                                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {siteIcons[i]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        disabled={!name.trim() || category?.isDefault}
                        onClick={handleSave}
                        className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold transition-colors"
                    >
                        {isEditing ? 'Salvar' : 'Criar Categoria'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SiteCategoryModal;

