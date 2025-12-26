import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, FolderPlus, MoreVertical, Edit2, Trash2, Folder, FolderOpen } from 'lucide-react';
import { SiteCategory } from '../../types';
import { siteIcons, siteColorClasses } from './constants';

interface CategoryTreeViewProps {
    categories: SiteCategory[];
    selectedCategoryId: string | null;
    onSelectCategory: (categoryId: string) => void;
    onCreateCategory: (parentId: string | null) => void;
    onEditCategory: (category: SiteCategory) => void;
    onDeleteCategory: (categoryId: string) => void;
    onToggleCollapse: (categoryId: string) => void;
    getSiteCount: (categoryId: string) => number;
}

interface CategoryItemProps {
    category: SiteCategory;
    depth: number;
    isSelected: boolean;
    hasChildren: boolean;
    siteCount: number;
    onSelect: () => void;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onCreateSubcategory: () => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
    category,
    depth,
    isSelected,
    hasChildren,
    siteCount,
    onSelect,
    onToggle,
    onEdit,
    onDelete,
    onCreateSubcategory
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    const IconComponent = siteIcons[category.icon];
    const colorClass = siteColorClasses[category.color];
    const isCollapsed = category.isCollapsed ?? false;

    return (
        <div className="group relative">
            <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all
                    ${isSelected
                        ? 'bg-indigo-600/20 border border-indigo-500/50 text-white'
                        : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
                    }`}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                onClick={onSelect}
            >
                {/* Expand/Collapse toggle */}
                {hasChildren ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggle(); }}
                        className="p-0.5 hover:bg-slate-600 rounded transition-colors"
                    >
                        {isCollapsed
                            ? <ChevronRight size={14} className="text-slate-400" />
                            : <ChevronDown size={14} className="text-slate-400" />
                        }
                    </button>
                ) : (
                    <span className="w-5" /> // Spacer
                )}

                {/* Folder Icon */}
                <div className={`w-5 h-5 flex items-center justify-center ${colorClass?.text || 'text-slate-400'}`}>
                    {IconComponent || (hasChildren && !isCollapsed ? <FolderOpen size={16} /> : <Folder size={16} />)}
                </div>

                {/* Name */}
                <span className="flex-1 text-sm font-medium truncate">{category.name}</span>

                {/* Site count badge */}
                {siteCount > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-400">
                        {siteCount}
                    </span>
                )}

                {/* Context menu button */}
                {!category.isDefault && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-600 rounded transition-all"
                    >
                        <MoreVertical size={14} />
                    </button>
                )}
            </div>

            {/* Context menu dropdown */}
            {menuOpen && !category.isDefault && (
                <div
                    ref={menuRef}
                    className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-30 py-1 min-w-36 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    <button
                        onClick={() => { onCreateSubcategory(); setMenuOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                    >
                        <FolderPlus size={14} /> Nova Subcategoria
                    </button>
                    <button
                        onClick={() => { onEdit(); setMenuOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                    >
                        <Edit2 size={14} /> Editar
                    </button>
                    <hr className="my-1 border-slate-700" />
                    <button
                        onClick={() => { onDelete(); setMenuOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
                    >
                        <Trash2 size={14} /> Excluir
                    </button>
                </div>
            )}
        </div>
    );
};

const CategoryTreeView: React.FC<CategoryTreeViewProps> = ({
    categories,
    selectedCategoryId,
    onSelectCategory,
    onCreateCategory,
    onEditCategory,
    onDeleteCategory,
    onToggleCollapse,
    getSiteCount
}) => {
    // Render categories recursively
    const renderTree = (parentId: string | null, depth: number = 0): React.ReactNode => {
        return categories
            .filter(cat => cat.parentId === parentId)
            .sort((a, b) => a.order - b.order)
            .map(cat => {
                const children = categories.filter(c => c.parentId === cat.id);
                const hasChildren = children.length > 0;
                const isCollapsed = cat.isCollapsed ?? false;
                const siteCount = getSiteCount(cat.id);

                return (
                    <div key={cat.id}>
                        <CategoryItem
                            category={cat}
                            depth={depth}
                            isSelected={selectedCategoryId === cat.id}
                            hasChildren={hasChildren}
                            siteCount={siteCount}
                            onSelect={() => onSelectCategory(cat.id)}
                            onToggle={() => onToggleCollapse(cat.id)}
                            onEdit={() => onEditCategory(cat)}
                            onDelete={() => onDeleteCategory(cat.id)}
                            onCreateSubcategory={() => onCreateCategory(cat.id)}
                        />
                        {/* Render children if not collapsed */}
                        {hasChildren && !isCollapsed && (
                            <div className="animate-in slide-in-from-top-1 duration-200">
                                {renderTree(cat.id, depth + 1)}
                            </div>
                        )}
                    </div>
                );
            });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Categorias</h3>
                <button
                    onClick={() => onCreateCategory(null)}
                    className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Nova categoria raiz"
                >
                    <FolderPlus size={16} />
                </button>
            </div>

            {/* Tree */}
            <div className="flex-1 overflow-y-auto py-2 px-1 space-y-0.5">
                {renderTree(null)}
            </div>
        </div>
    );
};

export default CategoryTreeView;
