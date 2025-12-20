import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Layout, LayoutGrid, Folder, Star, Globe, Briefcase, GraduationCap, Heart, Music, Gamepad2, Code, Camera, ShoppingBag, TrendingUp, Calculator, Bookmark, Zap, Rocket, Target, Users, Shield, Wrench, Palette, Layers, Terminal, Database, Cpu } from 'lucide-react';
import { SiteCategory } from '../../types';

// Site-specific icons
const siteIcons: Record<string, React.ReactNode> = {
    layout: <Layout size={16} />,
    grid: <LayoutGrid size={16} />,
    folder: <Folder size={16} />,
    star: <Star size={16} />,
    globe: <Globe size={16} />,
    briefcase: <Briefcase size={16} />,
    education: <GraduationCap size={16} />,
    health: <Heart size={16} />,
    music: <Music size={16} />,
    gaming: <Gamepad2 size={16} />,
    code: <Code size={16} />,
    photo: <Camera size={16} />,
    shopping: <ShoppingBag size={16} />,
    marketing: <TrendingUp size={16} />,
    math: <Calculator size={16} />,
    bookmark: <Bookmark size={16} />,
    productivity: <Zap size={16} />,
    startup: <Rocket size={16} />,
    goals: <Target size={16} />,
    social: <Users size={16} />,
    security: <Shield size={16} />,
    tools: <Wrench size={16} />,
    design: <Palette size={16} />,
    layers: <Layers size={16} />,
    terminal: <Terminal size={16} />,
    database: <Database size={16} />,
    hardware: <Cpu size={16} />,
};

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    slate: { bg: 'bg-slate-500', text: 'text-slate-400', border: 'border-slate-500' },
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500' },
    rose: { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500' },
    cyan: { bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500' },
    pink: { bg: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500' },
};

interface SiteCategoryModalProps {
    category?: SiteCategory | null; // null = nova categoria
    onClose: () => void;
    onSave: (category: Omit<SiteCategory, 'order'>) => void;
}

const SiteCategoryModal: React.FC<SiteCategoryModalProps> = ({ category, onClose, onSave }) => {
    const isEditing = !!category;

    const [name, setName] = useState(category?.name || '');
    const [color, setColor] = useState(category?.color || 'indigo');
    const [icon, setIcon] = useState(category?.icon || 'layout');

    const colors = Object.keys(colorClasses);
    const icons = Object.keys(siteIcons);

    useEffect(() => {
        if (category) {
            setName(category.name);
            setColor(category.color);
            setIcon(category.icon);
        }
    }, [category]);

    const handleSave = () => {
        if (!name.trim()) return;

        onSave({
            id: category?.id || `cat_${Date.now()}`,
            name: name.trim(),
            color,
            icon,
            isDefault: category?.isDefault || false,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <FolderPlus size={18} className="text-indigo-400" />
                        {isEditing ? 'Editar Categoria' : 'Nova Categoria de Site'}
                    </h3>
                    <button onClick={onClose} aria-label="Fechar modal">
                        <X className="text-slate-400 hover:text-white" size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
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
export { siteIcons, colorClasses as siteColorClasses };
