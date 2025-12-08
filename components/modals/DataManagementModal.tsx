import React, { useState, useMemo, useEffect } from 'react';
import {
    X,
    Download,
    Upload,
    CheckSquare,
    Square,
    AlertTriangle,
    FileJson,
    CheckCircle2,
    RefreshCw
} from 'lucide-react';
import { DATA_CATEGORIES, DataCategory } from '../../constants/dataCategories';
import { readNamespacedStorage, writeNamespacedStorage, removeNamespacedStorage } from '../../hooks/useStorage';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface DataManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
}

type Mode = 'MENU' | 'EXPORT' | 'IMPORT_SELECT';

export const DataManagementModal: React.FC<DataManagementModalProps> = ({ isOpen, onClose, userId }) => {
    const [mode, setMode] = useState<Mode>('MENU');
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [importData, setImportData] = useState<Record<string, any> | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setMode('MENU');
            setSelectedKeys([]);
            setImportData(null);
            setImportFile(null);
            setIsProcessing(false);
        }
    }, [isOpen]);

    // Filter categories based on what's available in the import file (if importing)
    const availableCategories = useMemo(() => {
        if (mode === 'IMPORT_SELECT' && importData) {
            return DATA_CATEGORIES.filter(cat => Object.prototype.hasOwnProperty.call(importData, cat.key));
        }
        return DATA_CATEGORIES;
    }, [mode, importData]);

    // Early return AFTER all hooks are defined (React rules of hooks)
    if (!isOpen) return null;

    // --- ACTIONS ---

    const toggleKey = (key: string) => {
        setSelectedKeys(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const toggleAll = () => {
        if (selectedKeys.length === availableCategories.length) {
            setSelectedKeys([]);
        } else {
            setSelectedKeys(availableCategories.map(c => c.key));
        }
    };

    const handleExport = () => {
        setIsProcessing(true);
        try {
            const data: Record<string, any> = {};

            selectedKeys.forEach(key => {
                const value = readNamespacedStorage(key, userId);
                if (value) {
                    try {
                        data[key] = JSON.parse(value);
                    } catch {
                        data[key] = value;
                    }
                }
            });

            data.exportedAt = new Date().toISOString();
            data.version = '2.0';

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `projeto-67-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            onClose();
        } catch (error) {
            console.error('Export error:', error);
            alert('Erro ao exportar dados.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (typeof data !== 'object' || !data) {
                throw new Error('Invalid JSON');
            }

            setImportData(data);
            setImportFile(file);
            setMode('IMPORT_SELECT');
            // Auto-select all available keys in the file
            const keysInFile = DATA_CATEGORIES.filter(c => Object.prototype.hasOwnProperty.call(data, c.key)).map(c => c.key);
            setSelectedKeys(keysInFile);

        } catch (error) {
            alert('Arquivo inválido. Por favor selecione um backup JSON válido.');
        }
    };

    const handleImport = async () => {
        if (!importData || selectedKeys.length === 0) return;

        if (!confirm(`Tem certeza que deseja importar ${selectedKeys.length} categorias? Os dados atuais destas categorias serão substituídos.`)) {
            return;
        }

        setIsProcessing(true);
        const batch = userId ? writeBatch(db) : null;
        let hasUpdates = false;

        try {
            for (const key of selectedKeys) {
                const value = importData[key];

                if (value === undefined || value === null) continue;

                const normalizedValue = typeof value === 'string' ? value : JSON.stringify(value);

                // 1. Local Storage
                writeNamespacedStorage(key, normalizedValue, userId);

                // 2. Firestore (if logged in)
                if (batch && userId) {
                    const docRef = doc(db, 'users', userId, 'data', key);
                    batch.set(docRef, {
                        value: normalizedValue,
                        updatedAt: new Date().toISOString()
                    });
                    hasUpdates = true;
                }
            }

            if (batch && hasUpdates) {
                await batch.commit();
            }

            // Small delay for UI feedback
            await new Promise(resolve => setTimeout(resolve, 800));

            alert('Importação concluída com sucesso!');
            window.location.reload();

        } catch (error) {
            console.error('Import error:', error);
            alert('Erro ao importar dados. Verifique o console para mais detalhes.');
        } finally {
            setIsProcessing(false);
        }
    };

    // --- RENDERERS ---

    const renderCategoryGrid = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {availableCategories.map((cat) => {
                const isSelected = selectedKeys.includes(cat.key);
                const Icon = cat.icon;

                return (
                    <div
                        key={cat.key}
                        onClick={() => toggleKey(cat.key)}
                        className={`
              relative p-4 rounded-xl border cursor-pointer transition-all duration-200 group
              ${isSelected
                                ? 'bg-slate-800 border-cyan-500/50 shadow-lg shadow-cyan-900/10'
                                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                            }
            `}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`
                p-3 rounded-lg transition-colors
                ${isSelected ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-950 text-slate-500 group-hover:text-slate-400'}
              `}>
                                <Icon size={20} />
                            </div>

                            <div className="flex-1">
                                <h4 className={`font-semibold mb-1 ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                    {cat.label}
                                </h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    {cat.description}
                                </p>
                            </div>

                            <div className={`
                absolute top-4 right-4 transition-colors
                ${isSelected ? 'text-cyan-500' : 'text-slate-700'}
              `}>
                                {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-slate-950 w-full max-w-4xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            {mode === 'MENU' && <><RefreshCw className="text-slate-400" /> Gerenciar Dados</>}
                            {mode === 'EXPORT' && <><Download className="text-blue-400" /> Exportar Dados</>}
                            {mode === 'IMPORT_SELECT' && <><Upload className="text-emerald-400" /> Importar Dados</>}
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            {mode === 'MENU' && 'Escolha uma operação para continuar'}
                            {mode === 'EXPORT' && 'Selecione o que você deseja salvar'}
                            {mode === 'IMPORT_SELECT' && 'Selecione o que você deseja restaurar'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden p-6">

                    {mode === 'MENU' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-center justify-center max-w-2xl mx-auto">
                            <button
                                onClick={() => setMode('EXPORT')}
                                className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:bg-slate-800 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-900/10 transition-all group"
                            >
                                <div className="p-6 bg-blue-500/10 rounded-full text-blue-400 group-hover:scale-110 transition-transform duration-300">
                                    <Download size={48} />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-white mb-2">Exportar</h3>
                                    <p className="text-slate-400 text-sm">Salvar um arquivo JSON com seus dados</p>
                                </div>
                            </button>

                            <label className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:bg-slate-800 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-900/10 transition-all group cursor-pointer">
                                <input
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                <div className="p-6 bg-emerald-500/10 rounded-full text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                                    <Upload size={48} />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-white mb-2">Importar</h3>
                                    <p className="text-slate-400 text-sm">Restaurar dados de um arquivo JSON</p>
                                </div>
                            </label>
                        </div>
                    )}

                    {(mode === 'EXPORT' || mode === 'IMPORT_SELECT') && (
                        <div className="space-y-4 h-full flex flex-col">

                            {/* Toolbar */}
                            <div className="flex justify-between items-center pb-4">
                                <button
                                    onClick={toggleAll}
                                    className="text-sm font-medium text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
                                >
                                    {selectedKeys.length === availableCategories.length ? (
                                        <><CheckSquare size={16} className="text-cyan-500" /> Desmarcar Todos</>
                                    ) : (
                                        <><Square size={16} /> Selecionar Todos</>
                                    )}
                                </button>
                                <span className="text-sm text-slate-500">
                                    {selectedKeys.length} selecionados
                                </span>
                            </div>

                            {/* Grid */}
                            <div className="flex-1 overflow-hidden">
                                {renderCategoryGrid()}
                            </div>

                            {/* Warning for Import */}
                            {mode === 'IMPORT_SELECT' && (
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex items-start gap-3">
                                    <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                                    <p className="text-xs text-orange-200">
                                        Atenção: A importação substituirá os dados atuais das categorias selecionadas.
                                        Dados não selecionados serão mantidos intactos.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Footer */}
                {(mode === 'EXPORT' || mode === 'IMPORT_SELECT') && (
                    <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center gap-4">
                        <button
                            onClick={() => setMode('MENU')}
                            className="px-6 py-3 rounded-xl text-slate-400 hover:bg-slate-800 font-medium transition-colors"
                        >
                            Voltar
                        </button>

                        <button
                            onClick={mode === 'EXPORT' ? handleExport : handleImport}
                            disabled={selectedKeys.length === 0 || isProcessing}
                            className={`
                flex-1 max-w-xs px-6 py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all
                ${mode === 'EXPORT'
                                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'
                                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
                                }
                ${(selectedKeys.length === 0 || isProcessing) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
              `}
                        >
                            {isProcessing ? (
                                <><RefreshCw className="animate-spin" size={20} /> Processando...</>
                            ) : (
                                <>
                                    {mode === 'EXPORT' ? <Download size={20} /> : <Upload size={20} />}
                                    {mode === 'EXPORT' ? 'Exportar Selecionados' : 'Importar Selecionados'}
                                </>
                            )}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};
