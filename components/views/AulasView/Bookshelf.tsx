import React, { useState } from "react";
import { useAulasStore } from "../../../stores/aulasStore";
import { Plus, BookOpen, FolderPlus, Download, Upload, Trash2, Edit2, ChevronRight, ChevronDown } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AulaBook } from "../../../types";

interface BookshelfProps {
  onSelectBook: (bookId: string) => void;
}

const SortableBookCard = React.memo(function SortableBookCard({
  book,
  onSelectBook,
}: {
  book: AulaBook;
  onSelectBook: (bookId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: book.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelectBook(book.id)}
      className="bg-slate-900 rounded-lg shadow-xl border-[4px] border-slate-800 overflow-hidden flex flex-col group cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform h-72 relative"
    >
      <div className="h-44 bg-slate-950 flex items-center justify-center relative overflow-hidden">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500">
            <BookOpen className="w-8 h-8 mb-2" />
            <span className="text-[10px] uppercase tracking-widest font-semibold">Sem Capa</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 bg-slate-900 border-t border-slate-850">
        <h3 className="font-serif text-lg leading-tight text-slate-100 line-clamp-2 mb-1">{book.title}</h3>
        <div className="flex items-center justify-between text-xs text-slate-400 mt-auto">
          {book.targetDate ? (
            <span className="font-bold underline underline-offset-4 text-[#D4AF37]">
              Meta: {new Date(book.targetDate + "T00:00:00").toLocaleDateString()}
            </span>
          ) : (
            <span className="italic text-slate-500">Sem meta</span>
          )}
          <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-300 uppercase tracking-wider">
            {book.chapters?.length || 0} Aulas
          </span>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => prevProps.book === nextProps.book);

const DroppableFolder = React.memo(function DroppableFolder({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `folder-${id}`,
    data: { type: "folder", id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className || ""} ${isOver ? "bg-slate-850 rounded" : ""} transition-colors`}
    >
      {children}
    </div>
  );
});

export default function Bookshelf({ onSelectBook }: BookshelfProps) {
  const {
    folders,
    books,
    collections,
    isLoading,
    addFolder,
    updateFolder,
    deleteFolder,
    addCollection,
    deleteCollection,
    updateCollectionBooks,
    addBook,
    updateBook,
    reorderBooks,
    importBackupData,
  } = useAulasStore();

  const [activeView, setActiveView] = useState<{ type: "folder" | "collection"; id: string } | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editFolderDialogOpen, setEditFolderDialogOpen] = useState<{ id: string; name: string } | null>(null);
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [collectionAddBookDialogOpen, setCollectionAddBookDialogOpen] = useState(false);
  const [parentFolderIdForNew, setParentFolderIdForNew] = useState<string | undefined>(undefined);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "folder" | "collection";
    id: string;
    message: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Carregando estante...</div>;
  }

  // Determine active view
  let currentView = activeView;
  if (!currentView) {
    if (folders.length > 0) {
      currentView = { type: "folder", id: folders[0].id };
    } else if (collections?.length > 0) {
      currentView = { type: "collection", id: collections[0].id };
    }
  }

  const isFolderView = currentView?.type === "folder";
  const isCollectionView = currentView?.type === "collection";

  const currentBooks = isFolderView
    ? books.filter((b) => b.folderId === currentView.id).sort((a, b) => a.position - b.position)
    : isCollectionView
    ? books.filter((b) => collections?.find((c) => c.id === currentView.id)?.bookIds.includes(b.id))
    : [];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Check if dropped over a folder
    if (over.data.current?.type === "folder" && isFolderView) {
      if (currentView.id !== over.data.current.id) {
        updateBook(active.id as string, { folderId: over.data.current.id as string });
        return;
      }
    }

    if (active.id !== over.id && isFolderView) {
      const oldIndex = currentBooks.findIndex((b) => b.id === active.id);
      const newIndex = currentBooks.findIndex((b) => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderBooks(currentView.id, oldIndex, newIndex);
      }
    }
  };

  const handleCreateBookClick = () => {
    if (!isFolderView) return;
    setInputValue("");
    setBookDialogOpen(true);
  };

  const submitBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && isFolderView) {
      addBook(currentView.id, inputValue.trim());
      setBookDialogOpen(false);
    }
  };

  const handleCreateFolderClick = (parentId?: string | React.MouseEvent) => {
    setParentFolderIdForNew(typeof parentId === "string" ? parentId : undefined);
    setInputValue("");
    setFolderDialogOpen(true);
  };

  const submitFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      addFolder(inputValue.trim(), parentFolderIdForNew);
      setFolderDialogOpen(false);
    }
  };

  const submitEditFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (editFolderDialogOpen && inputValue.trim()) {
      updateFolder(editFolderDialogOpen.id, { name: inputValue.trim() });
      setEditFolderDialogOpen(null);
    }
  };

  const handleEditFolderClick = (folder: { id: string; name: string }) => {
    setInputValue(folder.name);
    setEditFolderDialogOpen(folder);
  };

  const handleCreateCollectionClick = () => {
    setInputValue("");
    setCollectionDialogOpen(true);
  };

  const submitCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      addCollection(inputValue.trim());
      setCollectionDialogOpen(false);
    }
  };

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    );
  };

  // Support exporting/importing JSON for simple data migration (no auto backup dependencies)
  const handleExportBackup = () => {
    const backupData = { folders, collections, books };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "estante_aulas_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.folders)) {
          importBackupData(parsed);
          alert("Backup importado com sucesso! (Os dados serão sincronizados com o Firestore)");
        } else {
          alert("Arquivo de backup inválido.");
        }
      } catch (err) {
        alert("Erro ao ler backup: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-serif italic tracking-tight text-slate-100 mb-2">Estante de Aulas</h1>
          <p className="text-sm text-slate-400">Organize seus cursos, anexe imagens e acompanhe suas aulas e questões.</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            className="hidden"
            id="aulas-backup-upload"
            onChange={handleImportBackup}
          />
          <label
            htmlFor="aulas-backup-upload"
            className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 px-3 py-2 rounded transition-colors text-xs uppercase tracking-wider cursor-pointer"
            title="Importar Backup JSON"
          >
            <Upload className="w-4 h-4" />
          </label>
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 px-3 py-2 rounded transition-colors text-xs uppercase tracking-wider mr-2"
            title="Exportar Backup JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleCreateFolderClick()}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-100 px-4 py-2 rounded font-medium transition-colors text-xs uppercase tracking-wider shadow-sm"
          >
            <FolderPlus className="w-4 h-4" />
            Nova Pasta
          </button>
        </div>
      </header>

      {folders.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 rounded-lg border-2 border-slate-800 border-dashed">
          <p className="text-slate-500 mb-4 text-sm">Sua estante de aulas está vazia.</p>
          <button
            onClick={() => handleCreateFolderClick()}
            className="bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-6 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors shadow-sm"
          >
            Criar primeira pasta
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 shrink-0 space-y-2">
            <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2 px-3 flex justify-between items-center group">
              <span>Pastas</span>
              <button
                onClick={() => handleCreateFolderClick()}
                className="opacity-0 group-hover:opacity-100 hover:text-[#D4AF37] transition-opacity"
                title="Adicionar Pasta Raiz"
              >
                <Plus className="w-3 h-3" />
              </button>
            </h2>

            {folders
              .filter((f) => !f.parentId)
              .map((folder) => {
                const subfolders = folders.filter((sub) => sub.parentId === folder.id);
                const isExpanded = expandedFolders.includes(folder.id);
                return (
                  <div key={folder.id} className="space-y-1">
                    <DroppableFolder id={folder.id} className="flex items-center group">
                      <button
                        onClick={() => {
                          setActiveView({ type: "folder", id: folder.id });
                          toggleFolderExpand(folder.id);
                        }}
                        className={`flex-1 flex items-center gap-1.5 text-left px-3 py-2 text-sm rounded transition-colors ${
                          currentView?.type === "folder" && currentView.id === folder.id
                            ? "border-l-2 border-[#D4AF37] bg-slate-850 text-[#D4AF37] font-medium"
                            : "border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                        }`}
                      >
                        {subfolders.length > 0 && (
                          isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                          )
                        )}
                        {subfolders.length === 0 && <span className="w-3.5 shrink-0" />}
                        <span className="flex-1 truncate">{folder.name}</span>
                      </button>
                      <button
                        onClick={() => handleCreateFolderClick(folder.id)}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:text-[#D4AF37] text-slate-400 transition-opacity"
                        title="Adicionar Subpasta"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEditFolderClick({ id: folder.id, name: folder.name })}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:text-[#D4AF37] text-slate-400 transition-opacity"
                        title="Renomear Pasta"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirm({
                            type: "folder",
                            id: folder.id,
                            message: "Deseja realmente excluir esta pasta e todos os seus cursos?",
                          });
                        }}
                        className="p-1 pr-2 opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate-400 transition-opacity"
                        title="Excluir Pasta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </DroppableFolder>

                    {isExpanded && (
                      <div className="pl-4 space-y-1 border-l border-slate-800 ml-4">
                        {subfolders.map((subf) => (
                          <DroppableFolder id={subf.id} key={subf.id} className="flex items-center group">
                            <button
                              onClick={() => setActiveView({ type: "folder", id: subf.id })}
                              className={`flex-1 text-left px-3 py-1.5 text-xs rounded transition-colors ${
                                currentView?.type === "folder" && currentView.id === subf.id
                                  ? "border-l-2 border-[#D4AF37] bg-slate-850 text-[#D4AF37] font-medium"
                                  : "border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                              }`}
                            >
                              {subf.name}
                            </button>
                            <button
                              onClick={() => handleEditFolderClick({ id: subf.id, name: subf.name })}
                              className="p-1 opacity-0 group-hover:opacity-100 hover:text-[#D4AF37] text-slate-400 transition-opacity"
                              title="Renomear Subpasta"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirm({
                                  type: "folder",
                                  id: subf.id,
                                  message: "Deseja realmente excluir esta subpasta e todos os seus cursos?",
                                });
                              }}
                              className="p-1 pr-2 opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate-400 transition-opacity"
                              title="Excluir Subpasta"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </DroppableFolder>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

            <div className="pt-6">
              <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2 px-3 flex justify-between items-center group">
                <span>Coleções</span>
                <button
                  onClick={handleCreateCollectionClick}
                  className="opacity-0 group-hover:opacity-100 hover:text-[#D4AF37] transition-opacity"
                  title="Criar Coleção"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </h2>
              {collections &&
                collections.map((col) => (
                  <div key={col.id} className="flex items-center group">
                    <button
                      onClick={() => setActiveView({ type: "collection", id: col.id })}
                      className={`flex-1 text-left px-3 py-2 text-sm rounded transition-colors ${
                        currentView?.type === "collection" && currentView.id === col.id
                          ? "border-l-2 border-[#D4AF37] bg-slate-850 text-[#D4AF37] font-medium"
                          : "border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                      }`}
                    >
                      {col.name}
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirm({
                          type: "collection",
                          id: col.id,
                          message: "Deseja realmente excluir esta coleção?",
                        });
                      }}
                      className="p-1 pr-2 opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate-400 transition-opacity"
                      title="Excluir Coleção"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              {(!collections || collections.length === 0) && (
                <div className="px-3 py-2 text-xs text-slate-500 italic">Nenhuma coleção</div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-800">
              <h2 className="text-sm font-medium border-b-2 border-[#D4AF37] pb-1 -mb-[9px] text-slate-100">
                {isFolderView
                  ? folders.find((f) => f.id === currentView?.id)?.name
                  : collections?.find((c) => c.id === currentView?.id)?.name}
              </h2>
              {isFolderView && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCreateFolderClick(currentView?.id)}
                    className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    Subpasta
                  </button>
                  <button
                    onClick={handleCreateBookClick}
                    className="flex items-center gap-1.5 bg-[#D4AF37] border border-[#D4AF37] hover:bg-[#C2A032] hover:border-[#C2A032] text-slate-950 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Curso
                  </button>
                </div>
              )}
              {isCollectionView && (
                <button
                  onClick={() => setCollectionAddBookDialogOpen(true)}
                  className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-100 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Gerenciar Livros
                </button>
              )}
            </div>

            {currentBooks.length === 0 ? (
              <div className="text-center py-20 bg-slate-900 rounded-lg border border-slate-800 border-dashed text-slate-500 text-sm italic">
                {isFolderView
                  ? "Nenhum curso nesta pasta. Clique em 'Novo Curso' para começar."
                  : "Nenhum curso nesta coleção."}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={currentBooks.map((b) => b.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {currentBooks.map((book) => (
                      <SortableBookCard key={book.id} book={book} onSelectBook={onSelectBook} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      )}

      {folderDialogOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <form onSubmit={submitFolder} className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-serif italic text-slate-100 mb-4">Nova Pasta</h3>
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3 py-2 rounded focus:outline-none focus:border-[#D4AF37] mb-6"
              placeholder="Nome da pasta"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFolderDialogOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors"
              >
                Criar
              </button>
            </div>
          </form>
        </div>
      )}

      {editFolderDialogOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <form onSubmit={submitEditFolder} className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-serif italic text-slate-100 mb-4">Renomear Pasta</h3>
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3 py-2 rounded focus:outline-none focus:border-[#D4AF37] mb-6"
              placeholder="Novo nome da pasta"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditFolderDialogOpen(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {bookDialogOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <form onSubmit={submitBook} className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-serif italic text-slate-100 mb-4">Novo Curso</h3>
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3 py-2 rounded focus:outline-none focus:border-[#D4AF37] mb-6"
              placeholder="Nome do curso"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setBookDialogOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors"
              >
                Criar
              </button>
            </div>
          </form>
        </div>
      )}

      {collectionDialogOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <form onSubmit={submitCollection} className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-serif italic text-slate-100 mb-4">Nova Coleção</h3>
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3 py-2 rounded focus:outline-none focus:border-[#D4AF37] mb-6"
              placeholder="Nome da coleção"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCollectionDialogOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors"
              >
                Criar
              </button>
            </div>
          </form>
        </div>
      )}

      {collectionAddBookDialogOpen && isCollectionView && currentView && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-md shadow-2xl flex flex-col h-[70vh]">
            <h3 className="text-xl font-serif italic text-slate-100 mb-4">Adicionar à Coleção</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {books.map((b) => {
                const col = collections?.find((c) => c.id === currentView.id);
                const isInCollection = col?.bookIds.includes(b.id);
                return (
                  <label
                    key={b.id}
                    className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-850 rounded hover:border-[#D4AF37] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isInCollection}
                      onChange={(e) => {
                        if (!col) return;
                        let newBookIds = [...col.bookIds];
                        if (e.target.checked) newBookIds.push(b.id);
                        else newBookIds = newBookIds.filter((id) => id !== b.id);
                        updateCollectionBooks(col.id, newBookIds);
                      }}
                      className="accent-[#D4AF37] w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-100">{b.title}</div>
                      <div className="text-[10px] text-slate-500">
                        {folders.find((f) => f.id === b.folderId)?.name}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-850">
              <button
                type="button"
                onClick={() => setCollectionAddBookDialogOpen(false)}
                className="bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-6 py-2 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-serif italic text-slate-100 mb-4">Confirmar Exclusão</h3>
            <p className="text-slate-400 text-sm mb-6">{deleteConfirm.message}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirm.type === "folder") {
                    deleteFolder(deleteConfirm.id);
                    if (currentView?.id === deleteConfirm.id) setActiveView(null);
                  } else if (deleteConfirm.type === "collection") {
                    deleteCollection(deleteConfirm.id);
                    if (currentView?.id === deleteConfirm.id) setActiveView(null);
                  }
                  setDeleteConfirm(null);
                }}
                className="bg-red-500 hover:bg-red-650 text-white px-4 py-2 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
