import React, { useRef, useState } from 'react';
import { ImagePlus, Link2, Trash2, UploadCloud } from 'lucide-react';
import { extractImageFromClipboard, isValidImageFile } from '../../../utils/imageUtils';

interface StoryImageDropzoneProps {
    selectedFile: File | null;
    previewUrl: string | null;
    imageUrlInput: string;
    onFileSelect: (file: File | null) => void;
    onImageUrlChange: (value: string) => void;
    onError: (message: string) => void;
}

export const StoryImageDropzone: React.FC<StoryImageDropzoneProps> = ({
    selectedFile,
    previewUrl,
    imageUrlInput,
    onFileSelect,
    onImageUrlChange,
    onError,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);

    const handleFile = (file: File | null) => {
        if (!file) return;
        const validation = isValidImageFile(file);
        if (!validation.valid) {
            onError(validation.error || 'Arquivo inválido.');
            return;
        }
        onImageUrlChange('');
        onFileSelect(file);
    };

    const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
        const imageFile = await extractImageFromClipboard(e.clipboardData);
        if (!imageFile) return;
        e.preventDefault();
        handleFile(imageFile);
    };

    const activePreview = previewUrl || imageUrlInput.trim();

    return (
        <div className="space-y-3">
            <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onPaste={handlePaste}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFile(e.dataTransfer.files?.[0] || null);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        inputRef.current?.click();
                    }
                }}
                className={`group rounded-[1.75rem] border px-5 py-5 transition-all ${
                    isDragging
                        ? 'border-blue-400 bg-blue-500/10 shadow-[0_0_0_1px_rgba(96,165,250,0.35)]'
                        : 'border-slate-700 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_40%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,24,39,0.82))] hover:border-slate-500'
                }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />

                {activePreview ? (
                    <div className="space-y-4">
                        <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/70">
                            <img
                                src={activePreview}
                                alt="Preview da história"
                                className="max-h-80 w-full object-cover"
                            />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">
                                    {selectedFile ? selectedFile.name : 'Imagem por URL'}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {selectedFile
                                        ? 'Arraste outra imagem, cole do clipboard ou clique para substituir.'
                                        : 'Mantendo fallback por URL para compatibilidade.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFileSelect(null);
                                    onImageUrlChange('');
                                }}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-red-500/40 hover:text-white"
                            >
                                <Trash2 size={14} className="text-red-400" />
                                Remover imagem
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-blue-300 transition-transform group-hover:scale-105">
                            <UploadCloud size={30} />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-white">Arraste a arte da história aqui</p>
                            <p className="mt-1 text-sm text-slate-400">
                                Clique para escolher arquivo ou cole uma imagem direto do clipboard.
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-slate-400">
                            <ImagePlus size={12} />
                            jpeg png gif webp
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <button
                    type="button"
                    onClick={() => setShowUrlInput((value) => !value)}
                    className="flex items-center gap-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
                >
                    <Link2 size={14} className="text-blue-400" />
                    {showUrlInput ? 'Ocultar fallback por URL' : 'Adicionar por URL'}
                </button>

                {showUrlInput && (
                    <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => {
                            onFileSelect(null);
                            onImageUrlChange(e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="https://exemplo.com/cena.jpg"
                        className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    />
                )}
            </div>
        </div>
    );
};
