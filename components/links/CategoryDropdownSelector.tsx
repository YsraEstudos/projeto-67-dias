import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, FolderPlus, Check } from 'lucide-react';
import { SiteCategory } from '../../types';
import { siteIcons, siteColorClasses } from './constants';

interface CategoryDropdownSelectorProps {
    categories: SiteCategory[];
    selectedId: string;
    onChange: (categoryId: string) => void;
    onCreateCategory?: (parentId: string | null) => void;
}

const CategoryDropdownSelector: React.FC<CategoryDropdownSelectorProps> = ({
    categories,
    selectedId,
    onChange,
    onCreateCategory
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Get the currently selected category
    const selectedCategory = categories.find(c => c.id === selectedId);

    // Build hierarchical category tree
    const rootCategories = useMemo(() =>
        categories.filter(c => c.parentId === null).sort((a, b) => a.order - b.order),
        [categories]
    );

    const getChildren = (parentId: string) =>
        categories.filter(c => c.parentId === parentId).sort((a, b) => a.order - b.order);

    const hasChildren = (categoryId: string) =>
        categories.some(c => c.parentId === categoryId);

    const toggleExpand = (e: React.MouseEvent, categoryId: string) => {
        e.stopPropagation();
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    const handleSelect = (categoryId: string) => {
        onChange(categoryId);
        setIsOpen(false);
    };

    // Render a single category item
    const renderCategoryItem = (category: SiteCategory, depth: number = 0) => {
        const isSelected = category.id === selectedId;
        const children = getChildren(category.id);
        const isExpanded = expandedIds.has(category.id);
        const colorClass = siteColorClasses[category.color] || siteColorClasses.slate;
        const IconElement = siteIcons[category.icon];

        return (
            <div key={category.id}>
                <button
                    onClick={() => handleSelect(category.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all group ${isSelected
                            ? 'bg-indigo-600/20 border border-indigo-500/50'
                            : 'hover:bg-slate-700/50 border border-transparent'
                        }`}
                    style={{ paddingLeft: `${12 + depth * 16}px` }}
                >
                    {/* Expand/Collapse toggle for categories with children */}
                    {children.length > 0 ? (
                        <button
                            onClick={(e) => toggleExpand(e, category.id)}
                            className="p-0.5 hover:bg-slate-600 rounded transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronDown size={14} className="text-slate-400" />
                            ) : (
                                <ChevronRight size={14} className="text-slate-400" />
                            )}
                        </button>
                    ) : (
                        <div className="w-5" /> // Spacer for alignment
                    )}

                    {/* Category icon with color */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorClass.bg}/20 ${colorClass.text}`}>
                        {IconElement || <FolderPlus size={14} />}
                    </div>

                    {/* Category name */}
                    <span className={`flex-1 text-left text-sm ${isSelected ? 'text-white font-medium' : 'text-slate-300'}`}>
                        {category.name}
                    </span>

                    {/* Selected indicator */}
                    {isSelected && (
                        <Check size={16} className="text-indigo-400" />
                    )}
                </button>

                {/* Render children if expanded */}
                {isExpanded && children.length > 0 && (
                    <div className="mt-0.5">
                        {children.map(child => renderCategoryItem(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-slate-900 border rounded-lg p-3 flex items-center gap-3 transition-all ${isOpen ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-slate-700 hover:border-slate-600'
                    }`}
            >
                {/* Selected category icon */}
                {selectedCategory && (
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${siteColorClasses[selectedCategory.color]?.bg || 'bg-slate-600'
                        }/20 ${siteColorClasses[selectedCategory.color]?.text || 'text-slate-400'}`}>
                        {siteIcons[selectedCategory.icon] || <FolderPlus size={16} />}
                    </div>
                )}

                {/* Selected category name */}
                <span className="flex-1 text-left text-white">
                    {selectedCategory?.name || 'Selecione uma categoria'}
                </span>

                {/* Dropdown arrow */}
                <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-72 overflow-y-auto p-2 space-y-0.5">
                        {rootCategories.map(cat => renderCategoryItem(cat, 0))}
                    </div>

                    {/* Create new category option */}
                    {onCreateCategory && (
                        <div className="border-t border-slate-700 p-2">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    onCreateCategory(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 transition-all"
                            >
                                <FolderPlus size={16} />
                                <span className="text-sm">Nova Categoria</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CategoryDropdownSelector;
