import React, { useState, useEffect } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { SiteFolder } from '../../types';
import { siteColorClasses } from './constants';

interface SiteFolderModalProps {
    folder?: SiteFolder | null;
    siteId: string;
    onClose: () => void;
    onSave: (folder: Omit<SiteFolder, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
}

const SiteFolderModal: React.FC<SiteFolderModalProps> = ({
    folder,
    siteId,
    onClose,
    onSave
}) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('indigo');

    useEffect(() => {
        if (folder) {
            setName(folder.name);
            setColor(folder.color || 'indigo');
        } else {
            setName('');
            setColor('indigo');
        }
    }, [folder]);

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({
            name: name.trim(),
            siteId,
            color,
            isCollapsed: false
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                            <FolderPlus size={22} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">
                                {folder ? 'Editar Pasta' : 'Nova Pasta'}
                            </h3>
                            <p className="text-xs text-slate-500">Agrupe links relacionados dentro do site.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                        aria-label="Fechar modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Nome da Pasta</label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Documentação, Projetos, Admin..."
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>

                    {/* Color Picker */}
                    <div className="space-y-3 px-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cor da Pasta</label>
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(siteColorClasses).map(([colorKey, colorConfig]) => (
                                <button
                                    key={colorKey}
                                    onClick={() => setColor(colorKey)}
                                    className={`w-10 h-10 rounded-full border-4 transition-all hover:scale-110 flex items-center justify-center ${colorConfig.bg} ${color === colorKey ? 'border-white' : 'border-transparent shadow-lg'
                                        }`}
                                    title={colorKey}
                                    aria-label={`Selecionar cor ${colorKey}`}
                                >
                                    {color === colorKey && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 px-6 rounded-2xl text-slate-400 font-bold hover:text-white hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className={`flex-1 py-4 px-6 rounded-2xl font-bold transition-all shadow-lg ${name.trim()
                            ? 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-indigo-500/20 active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        {folder ? 'Salvar' : 'Criar Pasta'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SiteFolderModal;
