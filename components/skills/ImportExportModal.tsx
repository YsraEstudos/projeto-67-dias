import React, { useState } from 'react';
import { X, Download, Layers, CheckCircle2 } from 'lucide-react';
import { Skill, SkillRoadmapItem } from '../../types';

interface ImportExportModalProps {
    skill: Skill;
    onClose: () => void;
    onImport: (roadmap: SkillRoadmapItem[]) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ skill, onClose, onImport }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [importStatus, setImportStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

    const handleExport = () => {
        const data = JSON.stringify(skill.roadmap, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${skill.name.replace(/\s+/g, '_')}_roadmap.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (Array.isArray(json)) {
                    onImport(json);
                    setImportStatus('SUCCESS');
                    setTimeout(onClose, 1500);
                } else {
                    setImportStatus('ERROR');
                }
            } catch (err) {
                setImportStatus('ERROR');
            }
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <h3 className="font-bold text-white">Importar / Exportar</h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" size={20} /></button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Export Section */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Exportar Roadmap</h4>
                        <button
                            onClick={handleExport}
                            className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl transition-colors border border-slate-600"
                        >
                            <Download size={18} /> Baixar JSON
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-slate-800 px-2 text-slate-500">Ou</span>
                        </div>
                    </div>

                    {/* Import Section */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Importar JSON</h4>
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 ${isDragging
                                ? 'border-emerald-500 bg-emerald-500/10 scale-105'
                                : importStatus === 'SUCCESS'
                                    ? 'border-emerald-500 bg-emerald-500/20'
                                    : importStatus === 'ERROR'
                                        ? 'border-red-500 bg-red-500/10'
                                        : 'border-slate-600 hover:border-slate-500 hover:bg-slate-900/50'
                                }`}
                        >
                            {importStatus === 'SUCCESS' ? (
                                <div className="animate-in zoom-in duration-300 flex flex-col items-center text-emerald-400">
                                    <CheckCircle2 size={48} className="mb-2" />
                                    <p className="font-bold">Importado com Sucesso!</p>
                                </div>
                            ) : (
                                <>
                                    <Layers size={32} className={`mb-3 ${isDragging ? 'text-emerald-400' : 'text-slate-500'}`} />
                                    <p className="text-sm text-slate-300 font-medium mb-1">Arraste o arquivo JSON aqui</p>
                                    <p className="text-xs text-slate-500">ou clique para selecionar</p>
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </>
                            )}
                            {importStatus === 'ERROR' && (
                                <p className="text-xs text-red-400 mt-2">Erro ao ler arquivo. Verifique o formato.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
