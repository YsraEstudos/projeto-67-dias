import React, { useState } from 'react';
import { X, Download, Layers, CheckCircle2, FileText } from 'lucide-react';
import { Skill, SkillRoadmapItem } from '../../types';
import { normalizeRoadmap, MAX_ROADMAP_BYTES } from '../../stores/skills/roadmapValidator';

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

    const handleExportMarkdown = () => {
        let md = `# Roadmap: ${skill.name}\n\n`;

        skill.roadmap.forEach(item => {
            if (item.type === 'SECTION') {
                md += `\n## ${item.title}\n\n`;
            } else {
                const status = item.isCompleted ? '[x]' : '[ ]';
                md += `- ${status} ${item.title}\n`;
                if (item.subTasks) {
                    item.subTasks.forEach(sub => {
                        const subTitle = typeof sub === 'string' ? sub : sub.title;
                        const subStatus = typeof sub !== 'string' && sub.isCompleted ? '[x]' : '[ ]';
                        md += `  - ${subStatus} ${subTitle}\n`;
                    });
                }
            }
        });

        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${skill.name.replace(/\s+/g, '_')}_roadmap.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const processFile = (file: File) => {
        if (file.size > MAX_ROADMAP_BYTES) {
            setImportStatus('ERROR');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target?.result as string);
                const normalized = normalizeRoadmap(parsed);
                if (!normalized) {
                    setImportStatus('ERROR');
                    return;
                }
                onImport(normalized);
                setImportStatus('SUCCESS');
                setTimeout(onClose, 1500);
            } catch {
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
                        <button
                            onClick={handleExportMarkdown}
                            className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl transition-colors border border-slate-600"
                        >
                            <FileText size={18} /> Baixar Markdown
                        </button>
                    </div>

                    {/* Download Example Section */}
                    <div>
                        <button
                            onClick={() => {
                                const sampleRoadmap: SkillRoadmapItem[] = [
                                    {
                                        id: '1',
                                        title: 'Fase 1: Fundamentos (Seção)',
                                        isCompleted: false,
                                        type: 'SECTION',
                                        subTasks: [
                                            {
                                                id: '1-1',
                                                title: 'Tarefa Principal',
                                                isCompleted: false,
                                                type: 'TASK',
                                                subTasks: [
                                                    {
                                                        id: '1-1-1',
                                                        title: 'Subtarefa Detalhada',
                                                        isCompleted: false,
                                                        type: 'TASK'
                                                    }
                                                ]
                                            },
                                            {
                                                id: '1-2',
                                                title: 'Leitura de Documentação',
                                                isCompleted: true,
                                                type: 'TASK'
                                            }
                                        ]
                                    },
                                    {
                                        id: '2',
                                        title: 'Fase 2: Prática Avançada (Seção)',
                                        isCompleted: false,
                                        type: 'SECTION',
                                        subTasks: [
                                            {
                                                id: '2-1',
                                                title: 'Projeto Prático',
                                                isCompleted: false,
                                                type: 'TASK'
                                            }
                                        ]
                                    }
                                ];
                                const data = JSON.stringify(sampleRoadmap, null, 2);
                                const blob = new Blob([data], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'roadmap_exemplo.json';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                            }}
                            className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs py-2 rounded-lg transition-colors border border-slate-700"
                        >
                            <Download size={14} /> Baixar Exemplo (Template)
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
