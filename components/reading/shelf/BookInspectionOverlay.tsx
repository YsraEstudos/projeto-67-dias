import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Minus,
  Plus,
  Save,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { Book } from '../../../types';

interface BookInspectionOverlayProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveBook: (bookId: string, updates: Partial<Book>) => void;
  onUpdateProgress: (bookId: string, newCurrent: number) => void;
}

type BookDraft = Pick<
  Book,
  'title' | 'author' | 'genre' | 'unit' | 'total' | 'current' | 'status' | 'rating' | 'coverUrl' | 'notes' | 'deadline'
>;

const STATUS_OPTIONS: Array<{ value: Book['status']; label: string }> = [
  { value: 'READING', label: 'Lendo' },
  { value: 'TO_READ', label: 'Quero ler' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'PAUSED', label: 'Pausado' },
  { value: 'ABANDONED', label: 'Abandonado' },
];

const UNIT_LABELS: Record<Book['unit'], string> = {
  PAGES: 'Páginas',
  CHAPTERS: 'Capítulos',
  HOURS: 'Horas',
};

const createDraft = (book: Book): BookDraft => ({
  title: book.title,
  author: book.author,
  genre: book.genre,
  unit: book.unit,
  total: book.total,
  current: book.current,
  status: book.status,
  rating: book.rating,
  coverUrl: book.coverUrl || '',
  notes: book.notes,
  deadline: book.deadline || '',
});

const inputClassName =
  'w-full min-h-[44px] rounded-xl border border-slate-700 bg-[#0D121A] px-3 py-2.5 text-sm text-slate-100 outline-none transition [color-scheme:dark] placeholder:text-slate-600 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20';

const labelClassName = 'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400';

const getCoverInitials = (title: string): string => {
  const words = title.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('') || 'L';
};

const BookCover: React.FC<{ book: BookDraft; compact?: boolean }> = ({ book, compact = false }) => (
  <div className={`relative overflow-hidden border border-[#6B432B] bg-[#3A2317] shadow-[0_24px_45px_rgba(33,20,12,0.35)] ${compact ? 'h-24 w-16 shrink-0 rounded-lg' : 'mx-auto aspect-[2/3] w-full max-w-[270px] rounded-[1.25rem]'}`}>
    {book.coverUrl ? (
      <img
        src={book.coverUrl}
        alt={`Capa de ${book.title || 'livro'}`}
        className="h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
    ) : null}
    <div className={`absolute inset-0 flex flex-col justify-between text-[#F8EAC8] ${compact ? 'p-2' : 'p-6'} ${book.coverUrl ? 'pointer-events-none bg-[#3A2317]/20' : ''}`}>
      <div className={`flex items-center justify-between font-bold uppercase text-[#D4AF37] ${compact ? 'text-[6px] tracking-[0.16em]' : 'text-[9px] tracking-[0.28em]'}`}>
        <span>{compact ? '3D' : 'Estante'}</span>
        <BookOpen className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
      </div>
      <div>
        {!book.coverUrl && !compact && (
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/60 text-2xl font-serif text-[#F3D274]">
            {getCoverInitials(book.title)}
          </div>
        )}
        <h2 className={`break-words font-serif font-bold leading-tight text-[#FFF5D8] drop-shadow-md ${compact ? 'text-[9px]' : 'text-2xl'}`}>
          {book.title || 'Novo livro'}
        </h2>
        <p className={`${compact ? 'mt-0.5 text-[7px]' : 'mt-2 text-sm'} text-[#E9D7B0]`}>{book.author || 'Autor não informado'}</p>
      </div>
    </div>
  </div>
);

export const BookInspectionOverlay: React.FC<BookInspectionOverlayProps> = ({
  book,
  isOpen,
  onClose,
  onSaveBook,
  onUpdateProgress,
}) => {
  const [draft, setDraft] = useState<BookDraft | null>(() => (book ? createDraft(book) : null));
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (book) {
      setDraft(createDraft(book));
      setIsSaved(false);
    } else {
      setDraft(null);
    }
  }, [book?.id]);

  const progress = useMemo(() => {
    if (!draft) return { current: 0, total: 0, percentage: 0 };
    const total = Math.max(0, draft.total);
    const current = Math.max(0, draft.current);
    return {
      current,
      total,
      percentage: total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0,
    };
  }, [draft]);

  if (!isOpen || !book || !draft) return null;

  const updateDraft = <K extends keyof BookDraft>(field: K, value: BookDraft[K]) => {
    setDraft((currentDraft) => currentDraft ? { ...currentDraft, [field]: value } : currentDraft);
    setIsSaved(false);
  };

  const handleProgressChange = (nextCurrent: number) => {
    const boundedCurrent = Math.max(0, draft.total > 0 ? Math.min(draft.total, nextCurrent) : nextCurrent);
    updateDraft('current', boundedCurrent);
    onUpdateProgress(book.id, boundedCurrent);
  };

  const handleSave = () => {
    const total = Math.max(0, draft.total);
    const current = Math.max(0, total > 0 ? Math.min(total, draft.current) : draft.current);

    onSaveBook(book.id, {
      ...draft,
      title: draft.title.trim() || book.title,
      author: draft.author.trim(),
      genre: draft.genre.trim(),
      coverUrl: draft.coverUrl?.trim() || undefined,
      notes: draft.notes.trim(),
      deadline: draft.deadline || undefined,
      total,
      current,
      rating: Math.max(0, Math.min(5, draft.rating)),
    });
    setDraft((currentDraft) => currentDraft ? { ...currentDraft, total, current } : currentDraft);
    setIsSaved(true);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {/* Mobile Backdrop */}
      <div
        className="pointer-events-auto fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        data-testid="book-inspection-panel"
        className="pointer-events-auto absolute bottom-0 left-0 right-0 top-auto z-40 flex max-h-[85vh] flex-col overflow-hidden rounded-t-[1.5rem] border-t border-slate-700 bg-[#0B0F16]/98 pb-[max(1rem,env(safe-area-inset-bottom))] text-slate-100 shadow-[0_-20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl md:bottom-3 md:left-auto md:right-3 md:top-3 md:max-h-none md:w-[min(430px,calc(100%-1.5rem))] md:rounded-[1.25rem] md:border md:pb-0"
      >
        {/* Mobile Drag Handle */}
        <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-slate-700 md:hidden" />

        <header className="flex items-center justify-between border-b border-slate-800 bg-[#111827]/90 px-4 py-3 sm:px-5 md:px-7">
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar para a estante"
            className="flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-300 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden min-[380px]:inline">Voltar para a estante</span>
          </button>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F3D274]">
            <Sparkles className="h-4 w-4" />
            Detalhes do volume
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes do livro"
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-slate-300 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          <section className="border-b border-slate-800 bg-[#111827]/70 p-4">
            <div className="flex items-center gap-3">
              <BookCover book={draft} compact />
              <div className="min-w-0">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#F3D274]">Capa & Anotações em 3D</p>
                <p className="text-xs leading-relaxed text-slate-300">Arraste para rotacionar o livro em 3D e ler suas notas e reflexões escritas na capa traseira!</p>
              </div>
            </div>
          </section>

          <section className="min-h-0 p-4 sm:p-5 md:p-6">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F3D274]">Ficha de leitura</p>
                <h2 className="font-serif text-xl font-bold leading-tight text-slate-100 sm:text-2xl">Preencha os detalhes do livro</h2>
                <p className="mt-1 text-xs text-slate-400 sm:text-sm">As alterações ficam salvas na sua estante.</p>
              </div>
              <div className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-bold text-[#F3D274]">
                {progress.percentage}% lido
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="reading-book-title" className={labelClassName}>Título</label>
                <input id="reading-book-title" className={inputClassName} value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} />
              </div>
              <div>
                <label htmlFor="reading-book-author" className={labelClassName}>Autor</label>
                <input id="reading-book-author" className={inputClassName} value={draft.author} onChange={(event) => updateDraft('author', event.target.value)} />
              </div>
              <div>
                <label htmlFor="reading-book-genre" className={labelClassName}>Gênero</label>
                <input id="reading-book-genre" className={inputClassName} value={draft.genre} onChange={(event) => updateDraft('genre', event.target.value)} placeholder="Ex.: Filosofia" />
              </div>
              <div>
                <label htmlFor="reading-book-status" className={labelClassName}>Status</label>
                <select id="reading-book-status" className={inputClassName} value={draft.status} onChange={(event) => updateDraft('status', event.target.value as Book['status'])}>
                  {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="reading-book-deadline" className={labelClassName}>Meta / prazo</label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#A18455]" />
                  <input id="reading-book-deadline" type="date" className={`${inputClassName} pl-9`} value={draft.deadline || ''} onChange={(event) => updateDraft('deadline', event.target.value)} />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-700 bg-[#111827]/80 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-[#F3D274]" />
                  Progresso de leitura
                </div>
                <span className="text-xs font-bold text-slate-300">{progress.current} / {progress.total || '—'} {UNIT_LABELS[draft.unit].toLowerCase()}</span>
              </div>
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-[#D4AF37] transition-all" style={{ width: `${progress.percentage}%` }} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="reading-book-unit" className={labelClassName}>Unidade</label>
                  <select id="reading-book-unit" className={inputClassName} value={draft.unit} onChange={(event) => updateDraft('unit', event.target.value as Book['unit'])}>
                    {Object.entries(UNIT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="reading-book-current" className={labelClassName}>Atual</label>
                  <input id="reading-book-current" type="number" min="0" className={inputClassName} value={draft.current} onChange={(event) => updateDraft('current', Number(event.target.value))} />
                </div>
                <div>
                  <label htmlFor="reading-book-total" className={labelClassName}>Total</label>
                  <input id="reading-book-total" type="number" min="0" className={inputClassName} value={draft.total} onChange={(event) => updateDraft('total', Number(event.target.value))} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="mr-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  <Clock className="h-3.5 w-3.5" /> Registro rápido
                </span>
                {[-5, -1, 1, 5, 10].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleProgressChange(progress.current + amount)}
                    aria-label={`${amount > 0 ? 'Adicionar' : 'Subtrair'} ${Math.abs(amount)} ${UNIT_LABELS[draft.unit].toLowerCase()}`}
                    className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-3 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 ${
                      amount > 0
                        ? 'bg-[#D4AF37] text-[#080B10] hover:bg-[#E1BE4A]'
                        : 'border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {amount > 0 ? <Plus className="mr-0.5 inline h-3.5 w-3.5 text-[#080B10]" /> : <Minus className="mr-0.5 inline h-3.5 w-3.5" />}
                    {Math.abs(amount)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="reading-book-cover" className={labelClassName}>URL da capa</label>
                <input id="reading-book-cover" type="url" className={inputClassName} value={draft.coverUrl || ''} onChange={(event) => updateDraft('coverUrl', event.target.value)} placeholder="https://..." />
              </div>
              <div>
                <span className={labelClassName}>Minha avaliação</span>
                <div className="flex h-[44px] min-h-[44px] items-center gap-1 rounded-xl border border-slate-700 bg-[#0D121A] px-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => updateDraft('rating', star === draft.rating ? 0 : star)}
                      aria-label={`Avaliar com ${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
                      className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                    >
                      <Star className={`h-5 w-5 ${star <= draft.rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-slate-700'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="reading-book-notes" className={labelClassName}>Notas e reflexões</label>
                <textarea id="reading-book-notes" className={`${inputClassName} min-h-[130px] resize-y`} value={draft.notes} onChange={(event) => updateDraft('notes', event.target.value)} placeholder="Registre suas ideias, citações e aprendizados..." />
              </div>
            </div>
          </section>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-800 bg-[#111827]/90 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-xs text-slate-400">Você pode voltar à estante a qualquer momento.</p>
          <button
            type="button"
            onClick={handleSave}
            aria-label="Salvar detalhes"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-[#080B10] shadow-lg shadow-[#D4AF37]/10 transition hover:bg-[#E1BE4A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/80 active:scale-98"
          >
            <Save className="h-4 w-4 text-[#080B10]" />
            {isSaved ? 'Alterações salvas' : 'Salvar detalhes'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default BookInspectionOverlay;
