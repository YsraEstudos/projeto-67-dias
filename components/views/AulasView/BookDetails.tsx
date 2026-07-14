import React, { useRef, useState } from "react";
import { useAulasStore } from "../../../stores/aulasStore";
import {
  ChevronLeft,
  Upload,
  Edit3,
  Type,
  FileJson,
  Trash2,
  Copy,
  FileText,
  Download,
  Search,
  X,
  CheckCircle2,
  GripVertical,
  ArrowRightLeft,
  Folder,
  BookOpen,
  Plus,
} from "lucide-react";
import { fileToBase64 } from "./utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "motion/react";
import { AulaChapter } from "../../../types";

interface BookDetailsProps {
  bookId: string;
  onBack: () => void;
  onSelectChapter: (chapterId: string) => void;
}

const SortableChapterItem = React.memo(function SortableChapterItem({
  chapter,
  originalIndex,
  onSelect,
  otherBooks,
  onMoveChapter,
  isSortingDisabled,
}: {
  chapter: AulaChapter;
  originalIndex: number;
  onSelect: (id: string) => void;
  otherBooks: any[];
  onMoveChapter: (chapterId: string, targetBookId: string) => void;
  isSortingDisabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
    disabled: isSortingDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [showOptions, setShowOptions] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center text-left bg-slate-900 border hover:border-slate-700 hover:shadow-lg rounded p-4 transition-all group w-full ${
        isDragging ? "opacity-30 border-[#D4AF37] border-dashed" : "border-slate-800"
      }`}
    >
      {/* Drag handle */}
      {!isSortingDisabled ? (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mr-3 p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-350 cursor-grab active:cursor-grabbing shrink-0"
          title="Arrastar para reordenar"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      ) : (
        <div className="mr-3 p-1 text-slate-700 shrink-0" title="Reordenação desativada durante busca">
          <GripVertical className="w-4 h-4 opacity-30" />
        </div>
      )}

      {/* Index Badge */}
      <div
        onClick={() => onSelect(chapter.id)}
        className="w-8 h-8 shrink-0 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 mr-4 group-hover:bg-[#D4AF37] group-hover:text-slate-950 group-hover:border-[#D4AF37] transition-colors cursor-pointer"
      >
        {String(originalIndex + 1).padStart(2, "0")}
      </div>

      {/* Title & Info */}
      <div onClick={() => onSelect(chapter.id)} className="flex-1 cursor-pointer min-w-0 pr-2">
        <h3 className="text-sm font-medium text-slate-200 group-hover:text-[#D4AF37] transition-colors flex items-center gap-2 truncate">
          {chapter.title}
          {chapter.readAt && (
            <span title="Lida">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </span>
          )}
          {chapter.confidence && (
            <span 
              className={`text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wider font-sans border shrink-0 ${
                chapter.confidence === 'easy'
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                  : chapter.confidence === 'medium'
                  ? "bg-blue-500/15 text-blue-400 border-blue-500/25"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/25"
              }`}
              title={`Confiança: ${chapter.confidence === 'easy' ? 'Fácil' : chapter.confidence === 'medium' ? 'Média' : 'Difícil'}`}
            >
              {chapter.confidence === 'easy' ? 'Fácil' : chapter.confidence === 'medium' ? 'Médio' : 'Difícil'}
            </span>
          )}
        </h3>
        {chapter.attachments && Object.keys(chapter.attachments).length > 0 && (
          <span className="inline-flex mt-1 items-center bg-slate-950 px-1.5 py-0.5 rounded text-[#D4AF37] border border-slate-850 text-[9px] font-semibold uppercase tracking-wider">
            {Object.keys(chapter.attachments).length} Anexos
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick manual transfer dropdown */}
        {otherBooks.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className={`p-1.5 bg-slate-950 hover:bg-slate-850 rounded border border-slate-850 transition-colors text-xs font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer ${
                showOptions ? "text-[#D4AF37] border-[#D4AF37]/50" : "text-slate-400 hover:text-[#D4AF37]"
              }`}
              title="Transferir aula"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[9px]">Transferir</span>
            </button>

            {showOptions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)} />
                <div className="absolute right-0 mt-1 w-56 bg-slate-950 border border-slate-800 rounded-md shadow-2xl z-20 py-1 max-h-60 overflow-y-auto">
                  <div className="px-3 py-1.5 border-b border-slate-900 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    Mover para:
                  </div>
                  {otherBooks.map((ob) => (
                    <button
                      key={ob.id}
                      type="button"
                      onClick={() => {
                        onMoveChapter(chapter.id, ob.id);
                        setShowOptions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-900 transition-colors truncate"
                    >
                      {ob.title}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <button
          onClick={() => onSelect(chapter.id)}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-[10px] font-semibold uppercase tracking-widest px-2 py-1.5 hover:bg-slate-850 rounded border border-transparent hover:border-slate-850 transition-colors cursor-pointer"
        >
          Ler
          <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>
    </div>
  );
});

function QuickTransferTarget({
  targetBook,
  onTransfer,
}: {
  targetBook: any;
  onTransfer: (chapterId: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `target-book-${targetBook.id}`,
    data: { type: "book", id: targetBook.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`p-3 rounded-lg border transition-all flex items-center gap-3 bg-slate-950/30 hover:bg-slate-900/30 cursor-pointer ${
        isOver
          ? "border-[#D4AF37] bg-slate-900/60 shadow-[0_0_12px_rgba(212,175,55,0.15)] scale-[1.02]"
          : "border-slate-850 hover:border-slate-800"
      }`}
    >
      <BookOpen className={`w-4 h-4 shrink-0 transition-transform ${isOver ? "text-[#D4AF37] animate-pulse scale-110" : "text-slate-650"}`} />
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-medium truncate ${isOver ? "text-[#D4AF37]" : "text-slate-350"}`}>
          {targetBook.title}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">
          {targetBook.chapters?.length || 0} Aulas
        </div>
      </div>
    </div>
  );
}

export default function BookDetails({ bookId, onBack, onSelectChapter }: BookDetailsProps) {
  const {
    folders,
    books,
    updateBook,
    addChaptersJson,
    deleteBook,
    reorderChapters,
    moveChapter,
  } = useAulasStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [pasteJsonDialogOpen, setPasteJsonDialogOpen] = useState(false);
  const [jsonPasteText, setJsonPasteText] = useState("");
  const [createChapterDialogOpen, setCreateChapterDialogOpen] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleCreateChapterSubmit = () => {
    const title = newChapterTitle.trim();
    if (!title) {
      alert("Por favor, digite o título da aula.");
      return;
    }
    addChaptersJson(book.id, [{ title }]);
    setCreateChapterDialogOpen(false);
    setNewChapterTitle("");
  };

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm]);
  
  // Drag & drop state
  const [showTransferPanel, setShowTransferPanel] = useState(false);
  const [activeChapter, setActiveChapter] = useState<AulaChapter | null>(null);

  const book = books.find((b) => b.id === bookId);
  const folder = book ? folders.find((f) => f.id === book.folderId) : null;
  const otherBooks = books.filter((b) => b.id !== bookId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!book) return <div className="p-12 text-center text-red-500">Livro/Curso não encontrado.</div>;

  const countImportedChapters = (json: any[]) => {
    const chaptersJson = json.length === 1 && Array.isArray(json[0]) ? json[0] : json;
    return chaptersJson.filter((item: any) => !(item && typeof item === "object" && "total_aulas" in item)).length;
  };

  const handlePasteJsonSubmit = () => {
    try {
      const json = JSON.parse(jsonPasteText);
      if (Array.isArray(json)) {
        addChaptersJson(book.id, json);
        setPasteJsonDialogOpen(false);
        setJsonPasteText("");
        alert(`${countImportedChapters(json)} aulas adicionadas com sucesso!`);
      } else {
        alert("O JSON deve ser um array. Exemplo: [{ \"title\": \"Aula 1\" }]");
      }
    } catch (err) {
      alert("Erro ao ler JSON: " + (err as Error).message);
    }
  };

  const handleUploadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          addChaptersJson(book.id, json);
          alert(`${countImportedChapters(json)} aulas adicionadas com sucesso!`);
        } else {
          alert("O JSON deve ser um array. Exemplo: [{ \"title\": \"Aula 1\" }]");
        }
      } catch (err) {
        alert("Erro ao ler JSON: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      updateBook(book.id, { coverImage: base64 });
    } catch (err) {
      alert("Erro ao carregar imagem.");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const ch = book.chapters.find((c) => c.id === active.id);
    if (ch) {
      setActiveChapter(ch);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveChapter(null);
    if (!over) return;

    // Check if dropped on a quick transfer target book
    if (over.id.toString().startsWith("target-book-")) {
      const targetBookId = over.id.toString().replace("target-book-", "");
      const chapterId = active.id.toString();
      moveChapter(book.id, targetBookId, chapterId);
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = book.chapters.findIndex((c) => c.id === active.id);
      const newIndex = book.chapters.findIndex((c) => c.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderChapters(book.id, oldIndex, newIndex);
      }
    }
  };

  const filteredChapters = React.useMemo(() => {
    const searchLower = debouncedSearchTerm.toLowerCase().trim();
    if (!searchLower) {
      return (book.chapters || []).map((c, i) => ({ ...c, originalIndex: i }));
    }
    return (book.chapters || [])
      .map((c, i) => ({ ...c, originalIndex: i }))
      .filter((chapter) => {
        return (
          chapter.title.toLowerCase().includes(searchLower) ||
          (chapter.content && chapter.content.toLowerCase().includes(searchLower))
        );
      });
  }, [book.chapters, debouncedSearchTerm]);

  const handleSelectChapter = React.useCallback((chapterId: string) => {
    onSelectChapter(chapterId);
  }, [onSelectChapter]);

  const handleMoveChapter = React.useCallback((chapterId: string, targetBookId: string) => {
    moveChapter(book.id, targetBookId, chapterId);
    alert(`Aula transferida com sucesso!`);
  }, [book.id, moveChapter]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <button
        onClick={onBack}
        className="inline-flex items-center text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-slate-200 mb-8 transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Estante
      </button>

      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <div className="w-48 shrink-0 relative group mx-auto md:mx-0">
          <div className="w-48 h-64 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border-4 border-slate-800 shadow-xl relative">
            {book.coverImage ? (
              <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-4 text-center">Sem Capa</span>
            )}

            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => coverInputRef.current?.click()}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-slate-200 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border border-white/20 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Alterar
              </button>
            </div>
          </div>
          <input type="file" accept="image/*" className="hidden" ref={coverInputRef} onChange={handleUploadCover} />
        </div>

        <div className="flex-1 flex flex-col justify-center text-center md:text-left">
          <div className="text-[10px] font-bold text-[#D4AF37] mb-2 uppercase tracking-widest border-b border-slate-800 inline-block pb-1 max-w-max mx-auto md:mx-0">
            {folder?.name || "Pasta Desconhecida"}
          </div>
          {isEditingTitle ? (
            <input
              autoFocus
              value={editTitleValue}
              onChange={(e) => setEditTitleValue(e.target.value)}
              onBlur={() => {
                if (editTitleValue.trim() && editTitleValue !== book.title) {
                  updateBook(book.id, { title: editTitleValue.trim() });
                }
                setIsEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (editTitleValue.trim() && editTitleValue !== book.title) {
                    updateBook(book.id, { title: editTitleValue.trim() });
                  }
                  setIsEditingTitle(false);
                }
                if (e.key === "Escape") {
                  setIsEditingTitle(false);
                }
              }}
              className="text-4xl md:text-5xl font-serif italic tracking-tight text-slate-100 mb-4 mt-2 bg-transparent border-b-2 border-[#D4AF37] focus:outline-none w-full"
            />
          ) : (
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4 mt-2 group">
              <h1
                onClick={() => {
                  setEditTitleValue(book.title);
                  setIsEditingTitle(true);
                }}
                className="text-4xl md:text-5xl font-serif italic tracking-tight text-slate-100 cursor-pointer hover:text-[#D4AF37] transition-colors"
                title="Clique para renomear"
              >
                {book.title}
              </h1>
              <button
                onClick={() => {
                  setEditTitleValue(book.title);
                  setIsEditingTitle(true);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-[#D4AF37] cursor-pointer"
                title="Renomear"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start">
            <label className="flex flex-col text-[10px] text-slate-400 font-semibold uppercase tracking-widest text-left">
              Meta de Conclusão
              <input
                type="date"
                value={book.targetDate || ""}
                onChange={(e) => updateBook(book.id, { targetDate: e.target.value })}
                className="mt-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm text-slate-100 font-sans shadow-sm [color-scheme:dark]"
              />
            </label>

            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="md:ml-auto flex items-center gap-1.5 text-slate-400 hover:text-[#D4AF37] text-xs font-semibold underline underline-offset-4 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Apagar Curso
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 border-b border-slate-900 pb-4 gap-4">
          <h2 className="text-xl font-serif italic text-slate-100">
            Índice de Aulas <span className="text-sm font-sans text-slate-400 not-italic ml-2">({book.chapters?.length || 0})</span>
          </h2>

          <div className="flex flex-nowrap lg:flex-wrap items-center gap-2 justify-start lg:justify-end w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            <div className="relative group w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-[#D4AF37] transition-colors" />
              <input
                type="text"
                placeholder="Buscar em aulas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded pl-9 pr-9 py-1.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-[11px] text-slate-100 font-sans placeholder:text-slate-650 w-full transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowTransferPanel(!showTransferPanel)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm transition-colors border cursor-pointer ${
                showTransferPanel
                  ? "bg-[#D4AF37] border-[#D4AF37] text-slate-950"
                  : "bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200"
              } shrink-0`}
              title="Alternar painel de transferência rápida"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Painel Transferir
            </button>

            <button
              onClick={() => {
                let mdContent = `# ${book.title}\n\n`;
                (book.chapters || []).forEach((chapter, index) => {
                  mdContent += `## Aula ${index + 1}: ${chapter.title}\n\n`;
                  mdContent += `${chapter.content || "*Conteúdo indisponível*"}\n\n`;
                  mdContent += `---\n\n`;
                });

                const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(mdContent);
                const downloadAnchorNode = document.createElement("a");
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", `${book.title.replace(/\s+/g, "_")}_aulas.md`);
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
              }}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              Baixar (.md)
            </button>
            <button
              onClick={() => setCreateChapterDialogOpen(true)}
              className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nova Aula
            </button>
            <button
              onClick={() => setPasteJsonDialogOpen(true)}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <FileText className="w-4 h-4" />
              Colar JSON
            </button>
            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleUploadJson} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <FileJson className="w-4 h-4" />
              Instalar JSON
            </button>
          </div>
        </div>

        {!book.chapters || book.chapters.length === 0 ? (
          <div className="bg-slate-900 rounded-lg p-10 border-2 border-slate-800 border-dashed text-center">
            <p className="text-slate-200 mb-4 font-serif text-lg">Este curso ainda não possui aulas.</p>
            <p className="text-xs text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
              Crie um arquivo JSON contendo o cronograma de aulas do seu curso e instale aqui.
              <br />
              <br />
              <code className="bg-slate-950 text-emerald-400 block text-left px-4 py-3 rounded-md text-[10px] font-mono leading-relaxed border border-slate-800 mt-2">
                [
                <br />
                &nbsp;&nbsp;{"{"}"title": "Aula 1 - Introdução"{"}"},
                <br />
                &nbsp;&nbsp;{"{"}"title": "Aula 2 - Conceitos Básicos"{"}"}
                <br />]
              </code>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Transforme o conteudo abaixo em um JSON valido para importar no meu site Estante de Estudos.

Regras:
- Responda somente com JSON valido.
- O JSON deve ser um array.
- Cada item deve ter apenas "title"
- "title" deve ser o nome da aula.

[
  {"title": "Aula 1"},
  {"title": "Aula 2"}
]
`);
                  alert("Prompt copiado!");
                }}
                className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar Prompt Base
              </button>
              <button
                onClick={() => setCreateChapterDialogOpen(true)}
                className="bg-[#D4AF37] border border-[#D4AF37] hover:bg-[#C2A032] hover:border-[#C2A032] text-slate-950 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm transition-colors cursor-pointer"
              >
                + Nova Aula
              </button>
              <button
                onClick={() => setPasteJsonDialogOpen(true)}
                className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm transition-colors cursor-pointer"
              >
                Colar JSON
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm transition-colors cursor-pointer"
              >
                Procurar JSON
              </button>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-col lg:flex-row gap-6 mt-6 items-start">
              {/* Chapters List */}
              <div className="flex-1 min-w-0 space-y-3 w-full">
                <SortableContext
                  items={filteredChapters.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredChapters.map((chapter) => (
                    <SortableChapterItem
                      key={chapter.id}
                      chapter={chapter}
                      originalIndex={chapter.originalIndex}
                      onSelect={handleSelectChapter}
                      otherBooks={otherBooks}
                      onMoveChapter={handleMoveChapter}
                      isSortingDisabled={!!searchTerm}
                    />
                  ))}
                </SortableContext>

                {searchTerm && filteredChapters.length === 0 && (
                  <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg">
                    <p className="text-slate-500 text-sm">Nenhuma aula encontrada para "{searchTerm}"</p>
                  </div>
                )}
              </div>

              {/* Sidebar Quick Transfer Panel */}
              <AnimatePresence>
                {(showTransferPanel || activeChapter) && (
                  <motion.aside
                    initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                    animate={{ width: 320, opacity: 1, marginLeft: 16 }}
                    exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="hidden lg:flex w-[320px] shrink-0 border border-slate-800 bg-slate-900/40 backdrop-blur-md rounded-lg p-4 flex-col h-[65vh] sticky top-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                      <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-2">
                        <ArrowRightLeft className="w-4 h-4 text-[#D4AF37]" />
                        Transferência Rápida
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowTransferPanel(false)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-350 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                      {folders.map((f) => {
                        const folderBooks = otherBooks.filter((ob) => ob.folderId === f.id);
                        if (folderBooks.length === 0) return null;
                        return (
                          <div key={f.id} className="space-y-2">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
                              <Folder className="w-3.5 h-3.5 text-slate-600" />
                              {f.name}
                            </div>
                            <div className="space-y-1.5 pl-1">
                              {folderBooks.map((ob) => (
                                <QuickTransferTarget
                                  key={ob.id}
                                  targetBook={ob}
                                  onTransfer={(chapterId) => moveChapter(book.id, ob.id, chapterId)}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {otherBooks.length === 0 && (
                        <div className="text-xs text-slate-500 italic text-center p-4">
                          Nenhum outro curso disponível para transferência.
                        </div>
                      )}
                    </div>
                  </motion.aside>
                )}
              </AnimatePresence>
            </div>

            {/* Custom Drag Overlay */}
            <DragOverlay>
              {activeChapter ? (
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded p-4 shadow-2xl opacity-90 scale-[1.02] cursor-grabbing select-none w-full max-w-2xl">
                  <GripVertical className="w-4 h-4 text-slate-500 mr-3 cursor-grabbing" />
                  <div className="w-8 h-8 shrink-0 bg-[#D4AF37] rounded-full flex items-center justify-center text-[10px] font-bold text-slate-950 mr-4">
                    {String(book.chapters.findIndex((c) => c.id === activeChapter.id) + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-slate-200 truncate">{activeChapter.title}</h3>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {createChapterDialogOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-serif italic text-slate-100 mb-4">Criar Nova Aula</h3>
            <p className="text-slate-400 text-sm mb-4">Digite o título da nova aula:</p>
            <input
              type="text"
              autoFocus
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateChapterSubmit();
              }}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3 py-2 rounded focus:outline-none focus:border-[#D4AF37] mb-6 text-sm"
              placeholder="ex: Aula 1 - Direito Constitucional"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setCreateChapterDialogOpen(false);
                  setNewChapterTitle("");
                }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateChapterSubmit}
                className="bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors cursor-pointer"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {pasteJsonDialogOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-2xl shadow-2xl">
            <h3 className="text-xl font-serif italic text-slate-100 mb-4">Colar JSON</h3>
            <p className="text-slate-400 text-sm mb-4">Cole o código JSON com a lista de aulas aqui:</p>
            <textarea
              autoFocus
              value={jsonPasteText}
              onChange={(e) => setJsonPasteText(e.target.value)}
              className="w-full h-64 bg-slate-950 border border-slate-800 text-slate-100 px-3 py-2 rounded focus:outline-none focus:border-[#D4AF37] mb-6 font-mono text-xs resize-none"
              placeholder={'[\n  { "title": "Aula 1" },\n  { "title": "Aula 2" }\n]'}
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setPasteJsonDialogOpen(false);
                  setJsonPasteText("");
                }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePasteJsonSubmit}
                className="bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors cursor-pointer"
              >
                Instalar
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-serif italic text-slate-100 mb-4">Confirmar Exclusão</h3>
            <p className="text-slate-400 text-sm mb-6">
              Deseja realmente apagar este curso e todas as suas aulas? Esta ação é irreversível.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteBook(book.id);
                  setDeleteConfirmOpen(false);
                  onBack();
                }}
                className="bg-red-500 hover:bg-red-650 text-white px-4 py-2 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors cursor-pointer"
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
