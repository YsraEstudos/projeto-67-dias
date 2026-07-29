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
  'w-full rounded-xl border border-[#E2D8C6] bg-[#FFFCF7] px-3 py-2.5 text-sm text-[#1A1918] outline-none transition focus:border-[#B58A48] focus:ring-2 focus:ring-[#C5A059]/20';

const labelClassName = 'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#8C7A6B]';

const getCoverInitials = (title: string): string => {
  const words = title.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('') || 'L';
};

const BookCover: React.FC<{ book: BookDraft }> = ({ book }) => (
  <div className="relative mx-auto aspect-[2/3] w-full max-w-[270px] overflow-hidden rounded-[1.25rem] border border-[#6B432B] bg-[#3A2317] shadow-[0_24px_45px_rgba(33,20,12,0.35)]">
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
    <div className={`absolute inset-0 flex flex-col justify-between p-6 text-[#F8EAC8] ${book.coverUrl ? 'pointer-events-none bg-[#3A2317]/20' : ''}`}>
      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
        <span>Estante</span>
        <BookOpen className="h-4 w-4" />
      </div>
      <div>
        {!book.coverUrl && (
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/60 text-2xl font-serif text-[#F3D274]">
            {getCoverInitials(book.title)}
          </div>
        )}
        <h2 className="break-words font-serif text-2xl font-bold leading-tight text-[#FFF5D8] drop-shadow-md">
          {book.title || 'Novo livro'}
        </h2>
        <p className="mt-2 text-sm text-[#E9D7B0]">{book.author || 'Autor não informado'}</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1817]/75 p-3 backdrop-blur-sm md:p-6">
      <div className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.75rem] border border-[#E6DFD3] bg-[#FDFBF7] text-[#1A1918] shadow-[0_30px_80px_rgba(0,0,0,0.38)]">
        <header className="flex items-center justify-between border-b border-[#E6DFD3] bg-[#F5F0E6]/80 px-5 py-4 md:px-7">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#6E5A4B] transition hover:bg-[#EAE2D2]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a estante
          </button>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A18455]">
            <Sparkles className="h-4 w-4" />
            Detalhes do volume
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#6E5A4B] transition hover:bg-[#EAE2D2]"
            aria-label="Fechar detalhes do livro"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)]">
          <section className="flex flex-col items-center justify-center border-b border-[#E6DFD3] bg-[#EFE5D5]/45 p-6 md:border-b-0 md:border-r md:p-8">
            <BookCover book={draft} />
            <p className="mt-5 max-w-[270px] text-center text-[10px] uppercase tracking-[0.18em] text-[#9B8875]">
              A capa acompanha o título, autor e imagem preenchidos ao lado
            </p>
          </section>

          <section className="min-h-0 overflow-y-auto p-5 scrollbar-thin md:p-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A18455]">Ficha de leitura</p>
                <h2 className="font-serif text-2xl font-bold leading-tight text-[#1A1918]">Preencha os detalhes do livro</h2>
                <p className="mt-1 text-sm text-[#7A6857]">As alterações ficam salvas na sua estante.</p>
              </div>
              <div className="rounded-full border border-[#E2D8C6] bg-[#F5F0E6] px-3 py-1.5 text-xs font-bold text-[#5E4738]">
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
                  <Calendar className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#A18455]" />
                  <input id="reading-book-deadline" type="date" className={`${inputClassName} pl-9`} value={draft.deadline || ''} onChange={(event) => updateDraft('deadline', event.target.value)} />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[#E2D8C6] bg-[#F5F0E6]/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#5E4738]">
                  <CheckCircle2 className="h-4 w-4 text-[#A18455]" />
                  Progresso de leitura
                </div>
                <span className="text-xs font-bold text-[#5E4738]">{progress.current} / {progress.total || '—'} {UNIT_LABELS[draft.unit].toLowerCase()}</span>
              </div>
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#E2D8C6]">
                <div className="h-full rounded-full bg-[#3A2317] transition-all" style={{ width: `${progress.percentage}%` }} />
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
                <span className="mr-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8C7A6B]"><Clock className="h-3.5 w-3.5" /> Registro rápido</span>
                {[-5, -1, 1, 5, 10].map((amount) => (
                  <button key={amount} type="button" onClick={() => handleProgressChange(progress.current + amount)} className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${amount > 0 ? 'bg-[#3A2317] text-[#FAF6EE] hover:bg-[#2C1A10]' : 'border border-[#E2D8C6] bg-[#FFFCF7] text-[#5E4738] hover:bg-[#EAE2D2]'}`}>
                    {amount > 0 ? <Plus className="mr-1 inline h-3 w-3 text-[#F3D274]" /> : <Minus className="mr-1 inline h-3 w-3" />}{Math.abs(amount)}
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
                <div className="flex h-[42px] items-center gap-1 rounded-xl border border-[#E2D8C6] bg-[#FFFCF7] px-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => updateDraft('rating', star === draft.rating ? 0 : star)} aria-label={`Avaliar com ${star} estrelas`} className="rounded p-0.5 transition hover:scale-110">
                      <Star className={`h-5 w-5 ${star <= draft.rating ? 'fill-[#C5A059] text-[#C5A059]' : 'text-[#D6C8B7]'}`} />
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

        <footer className="flex flex-col-reverse gap-3 border-t border-[#E6DFD3] bg-[#F5F0E6]/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-xs text-[#8C7A6B]">Você pode voltar à estante a qualquer momento.</p>
          <button type="button" onClick={handleSave} className="flex items-center justify-center gap-2 rounded-xl bg-[#3A2317] px-5 py-3 text-sm font-bold text-[#FAF6EE] shadow-lg shadow-[#3A2317]/20 transition hover:bg-[#2C1A10]">
            <Save className="h-4 w-4 text-[#F3D274]" />
            {isSaved ? 'Alterações salvas' : 'Salvar detalhes'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default BookInspectionOverlay;
