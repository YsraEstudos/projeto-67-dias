import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Book as IBook } from '../../../types';
import { useBookAI } from '../../../hooks/useBookAI';
import BookForm from '../BookForm';
import { X, ArrowLeft, Bot, Search, Book, Sparkles } from 'lucide-react';
import { generateUUID } from '../../../utils/uuid';

interface AddBookModalProps {
    onClose: () => void;
    onAdd: (b: IBook) => void;
    currentFolderId: string | null;
}

const AddBookModal: React.FC<AddBookModalProps> = ({ onClose, onAdd, currentFolderId }) => {
    const [mode, setMode] = useState<'MANUAL' | 'GOOGLE' | 'JIKAN' | 'AI'>('MANUAL');
    const [step, setStep] = useState<'SEARCH' | 'EDIT'>('SEARCH');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [tempData, setTempData] = useState<Partial<IBook>>({});
    const [aiPrompt, setAiPrompt] = useState('');

    const { generateBookFromPrompt, isLoading: aiLoading, error: aiError } = useBookAI();

    // AbortController to cancel previous API requests
    const abortControllerRef = useRef<AbortController | null>(null);

    // Reset step when mode changes
    useEffect(() => {
        setStep(mode === 'MANUAL' ? 'EDIT' : 'SEARCH');
        setResults([]);
        setQuery('');
        setTempData({});
        setAiPrompt('');
        // Cancel any pending request when mode changes
        abortControllerRef.current?.abort();
    }, [mode]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    const searchApi = useCallback(async () => {
        if (!query.trim()) return;

        // Cancel previous request if any
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        setLoading(true);
        try {
            const url = mode === 'GOOGLE'
                ? `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`
                : `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}`;

            const res = await fetch(url, { signal: abortControllerRef.current.signal });
            const data = await res.json();
            setResults(mode === 'GOOGLE' ? (data.items || []) : (data.data || []));
        } catch (e) {
            // Ignore abort errors
            if (e instanceof Error && e.name !== 'AbortError') {
                console.error(e);
            }
        }
        finally { setLoading(false); }
    }, [query, mode]);

    const handleSelect = (item: any) => {
        const isGoogle = mode === 'GOOGLE';

        const mappedData: Partial<IBook> = {
            title: isGoogle ? item.volumeInfo.title : item.title,
            author: isGoogle ? (item.volumeInfo.authors?.[0] || 'Desconhecido') : (item.authors?.[0]?.name || 'Mangaká'),
            genre: isGoogle ? (item.volumeInfo.categories?.[0] || 'Geral') : 'Manga',
            total: isGoogle ? (item.volumeInfo.pageCount || 0) : (item.chapters || 0),
            unit: isGoogle ? 'PAGES' : 'CHAPTERS',
            coverUrl: isGoogle ? item.volumeInfo.imageLinks?.thumbnail : item.images?.jpg?.image_url,
            current: 0,
        };

        setTempData(mappedData);
        setStep('EDIT'); // Move to edit step
    };

    const handleFinalSave = (data: any) => {
        onAdd({
            ...data,
            id: generateUUID(), // Use robust UUID instead of Date.now()
            status: 'TO_READ',
            rating: 0,
            notes: data.notes || '',
            folderId: currentFolderId,
            addedAt: new Date().toISOString() // Store as ISO string for better persistence serialization
        });
        onClose();
    };

    const handleGenerateAI = async () => {
        const userPrompt = aiPrompt.trim();
        if (!userPrompt) return;

        const result = await generateBookFromPrompt(userPrompt);

        if (result) {
            setTempData(result);
            setStep('EDIT');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[85vh]">
                <div className="p-5 border-b border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {step === 'EDIT' && mode !== 'MANUAL' && (
                            <button onClick={() => setStep('SEARCH')} className="text-slate-400 hover:text-white p-1 -ml-2 rounded-full hover:bg-slate-700">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h2 className="text-xl font-bold text-white">Adicionar Novo Livro</h2>
                    </div>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                </div>

                {/* Mode Switcher - Only visible in search step */}
                {step === 'SEARCH' && (
                    <div className="flex p-2 gap-2 bg-slate-900/50">
                        {['MANUAL', 'GOOGLE', 'JIKAN', 'AI'].map(m => (
                            <button
                                key={m}
                                onClick={() => setMode(m as any)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${mode === m ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                            >
                                {m === 'JIKAN' ? 'MANGA (Jikan)' : m === 'GOOGLE' ? 'LIVRO (Google)' : m === 'AI' ? 'IA (Gemini)' : 'MANUAL'}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto flex flex-col">
                    {step === 'SEARCH' ? (
                        mode === 'AI' ? (
                            <div className="p-6 space-y-5 overflow-y-auto">
                                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-300"><Bot size={18} /></div>
                                        <div>
                                            <p className="text-sm text-slate-200 font-semibold">Gerar livro com Gemini</p>
                                            <p className="text-xs text-slate-500">Modelo gemini-2.5-flash</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-3">
                                        Descreva o tema, público, tamanho desejado ou referências. A IA vai sugerir título, autor ideal e plano de leitura.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Briefing para IA</label>
                                    <textarea
                                        value={aiPrompt}
                                        onChange={e => setAiPrompt(e.target.value)}
                                        placeholder="Ex: Quero um guia prático de finanças pessoais para iniciantes com cerca de 200 páginas."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm h-28 resize-none focus:border-indigo-500 outline-none"
                                        disabled={aiLoading}
                                    />
                                </div>

                                {aiError && (
                                    <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-2">
                                        {aiError}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    {['Romance histórico curto ambientado no Brasil Imperial', 'Plano de leitura para aprender programação em 90 dias', 'Biografia motivacional para jovens empreendedores'].map(example => (
                                        <button
                                            key={example}
                                            type="button"
                                            onClick={() => setAiPrompt(example)}
                                            className="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-white transition-colors"
                                            disabled={aiLoading}
                                        >
                                            {example}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={handleGenerateAI}
                                    disabled={aiLoading}
                                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors ${aiLoading ? 'bg-slate-700 text-slate-400' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                                >
                                    <Sparkles size={16} className="text-current" />
                                    {aiLoading ? 'Gerando com IA...' : 'Gerar com IA'}
                                </button>
                            </div>
                        ) : (
                            <div className="p-6 space-y-4 overflow-y-auto">
                                <div className="flex gap-2">
                                    <input className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500" placeholder="Buscar..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchApi()} />
                                    <button onClick={searchApi} className="bg-indigo-600 text-white px-4 rounded-lg hover:bg-indigo-500"><Search /></button>
                                </div>
                                {loading && <div className="text-center text-slate-500 py-4">Buscando...</div>}
                                <div className="space-y-2">
                                    {results.map((item, i) => {
                                        const img = mode === 'GOOGLE' ? item.volumeInfo?.imageLinks?.smallThumbnail : item.images?.jpg?.image_url;
                                        const title = mode === 'GOOGLE' ? item.volumeInfo.title : item.title;
                                        const total = mode === 'GOOGLE' ? (item.volumeInfo.pageCount) : (item.chapters);
                                        return (
                                            <div key={i} onClick={() => handleSelect(item)} className="flex gap-3 p-2 bg-slate-800 border border-slate-700 rounded-lg hover:border-indigo-500 cursor-pointer hover:bg-slate-750 transition-colors">
                                                <div className="w-12 h-16 bg-slate-900 rounded overflow-hidden flex-shrink-0">
                                                    {img ? (
                                                        <img
                                                            src={img}
                                                            className="w-full h-full object-cover"
                                                            alt=""
                                                            loading="lazy"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Cover';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center"><Book size={16} className="text-slate-600" /></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-white line-clamp-1">{title}</div>
                                                    <div className="text-xs text-slate-500">{mode === 'GOOGLE' ? item.volumeInfo?.authors?.[0] : item.authors?.[0]?.name}</div>
                                                    <div className="text-xs text-indigo-400 mt-1">{total ? `${total} ${mode === 'JIKAN' ? 'capítulos' : 'páginas'}` : 'Total desconhecido'}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    ) : (
                        <BookForm
                            initialData={tempData}
                            onSave={handleFinalSave}
                            onCancel={onClose}
                            saveLabel="Adicionar à Biblioteca"
                        />
                    )}
                </div>
            </div>


        </div>
    );
};

export default AddBookModal;
