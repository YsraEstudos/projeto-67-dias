import React, { useState } from "react";
import { Highlighter, MessageSquare, Trash2, Check, RotateCcw, X } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../utils";

interface Comment {
  id: string;
  selectedText: string;
  body: string;
  createdAt: string;
  resolvedAt?: string;
}

interface AnnotationOverlayProps {
  selectionRect: DOMRect | null;
  selectedText: string;
  clickedMarkRect: DOMRect | null;
  clickedMarkText: string;
  onHighlight: () => void;
  onRemoveHighlight: () => void;
  onAddComment: (body: string) => void;
  onClearSelection: () => void;
}

export function AnnotationOverlay({
  selectionRect,
  selectedText,
  clickedMarkRect,
  clickedMarkText,
  onHighlight,
  onRemoveHighlight,
  onAddComment,
  onClearSelection,
}: AnnotationOverlayProps) {
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentInput, setCommentInput] = useState("");

  const handleOpenCommentDialog = () => {
    setCommentInput("");
    setCommentDialogOpen(true);
  };

  const handleCancelComment = () => {
    setCommentDialogOpen(false);
    setCommentInput("");
    onClearSelection();
  };

  const handleSaveComment = () => {
    if (!commentInput.trim()) return;
    onAddComment(commentInput.trim());
    setCommentInput("");
    setCommentDialogOpen(false);
  };

  return (
    <>
      {/* Floating text selection toolbar */}
      {selectionRect && selectedText && !commentDialogOpen && (
        <div
          className="fixed z-50 animate-in fade-in zoom-in-95 duration-200"
          style={{
            top: selectionRect.top - 40,
            left: selectionRect.left + selectionRect.width / 2 - 86,
          }}
        >
          <div className="flex overflow-hidden rounded border border-slate-800 bg-slate-900 shadow-xl">
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                onHighlight();
              }}
              className="flex items-center gap-1.5 hover:bg-slate-800 text-[#D4AF37] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
            >
              <Highlighter className="w-3.5 h-3.5" />
              Grifar
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                handleOpenCommentDialog();
              }}
              className="flex items-center gap-1.5 border-l border-slate-800 hover:bg-slate-800 text-blue-400 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Comentar
            </button>
          </div>
        </div>
      )}

      {/* Floating remove highlight toolbar */}
      {clickedMarkRect && clickedMarkText && !selectionRect && (
        <div
          className="fixed z-50 animate-in fade-in zoom-in-95 duration-200"
          style={{
            top: clickedMarkRect.top - 40,
            left: clickedMarkRect.left + clickedMarkRect.width / 2 - 40,
          }}
        >
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onRemoveHighlight();
            }}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-red-400 px-3 py-1.5 rounded shadow-xl text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remover
          </button>
        </div>
      )}

      {/* Comment Creation Dialog */}
      {commentDialogOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-serif italic text-slate-100 mb-3">Novo Comentário / Anotação</h3>
            <p className="text-xs leading-relaxed text-slate-400 border-l-2 border-blue-500 pl-3 mb-4 line-clamp-3">
              "{selectedText}"
            </p>
            <textarea
              autoFocus
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="w-full h-32 bg-slate-950 border border-slate-850 text-slate-100 px-3 py-2 rounded focus:outline-none focus:border-blue-500 mb-5 text-sm resize-none"
              placeholder="Escreva seu comentário ou dúvida..."
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelComment}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveComment}
                disabled={!commentInput.trim()}
                className="bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:hover:bg-blue-500 text-slate-950 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors cursor-pointer"
              >
                Comentar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface CommentsSidebarProps {
  comments: Comment[];
  activeCommentId: string | null;
  setActiveCommentId: (id: string | null) => void;
  onResolveComment: (id: string) => void;
  onReopenComment: (id: string) => void;
  onRemoveComment: (id: string) => void;
}

export function CommentsSidebar({
  comments,
  activeCommentId,
  setActiveCommentId,
  onResolveComment,
  onReopenComment,
  onRemoveComment,
}: CommentsSidebarProps) {
  const openComments = comments.filter((comment) => !comment.resolvedAt);
  const resolvedComments = comments.filter((comment) => comment.resolvedAt);

  return (
    <aside className="hidden xl:flex w-80 border-l border-slate-900 bg-slate-950 flex-col shrink-0 sticky top-[120px] sm:top-[136px] h-[calc(100vh-120px)] sm:h-[calc(100vh-136px)]">
      <div className="p-5 border-b border-slate-900 shrink-0">
        <h3 className="text-slate-100 text-sm font-serif italic flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-400" />
          Anotações e Dúvidas
        </h3>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
          {openComments.length} Abertos
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {openComments.map((comment) => (
          <div
            key={comment.id}
            className={cn(
              "rounded-xl border p-3.5 bg-slate-900/40 backdrop-blur-sm transition-all duration-300",
              activeCommentId === comment.id
                ? "border-blue-500/50 shadow-md shadow-blue-950/40 bg-slate-900/60"
                : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/50"
            )}
          >
            <button
              type="button"
              onClick={() => setActiveCommentId(comment.id)}
              className="block w-full text-left cursor-pointer"
            >
              <p className="text-[10px] leading-relaxed text-slate-400 line-clamp-2 border-l-2 border-blue-500 pl-2 mb-3">
                "{comment.selectedText}"
              </p>
              <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">
                {comment.body}
              </p>
            </button>
            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => onResolveComment(comment.id)}
                title="Resolver dúvida"
                className="p-1.5 rounded-lg border border-slate-800 text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onRemoveComment(comment.id)}
                title="Apagar anotação"
                className="p-1.5 rounded-lg border border-slate-800 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {resolvedComments.length > 0 && (
          <div className="pt-3 border-t border-slate-900 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Resolvidos</p>
            {resolvedComments.map((comment) => (
              <div key={comment.id} className="rounded border border-slate-900 bg-slate-950 p-3 opacity-60">
                <p className="text-xs text-slate-400 line-clamp-2 mb-2">{comment.body}</p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onReopenComment(comment.id)}
                    title="Reabrir comentário"
                    className="p-1.5 rounded border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveComment(comment.id)}
                    title="Apagar comentário"
                    className="p-1.5 rounded border border-slate-800 text-red-400 hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

interface CommentsDrawerProps {
  comments: Comment[];
  activeCommentId: string | null;
  setActiveCommentId: (id: string | null) => void;
  onResolveComment: (id: string) => void;
  onReopenComment: (id: string) => void;
  onRemoveComment: (id: string) => void;
  onClose: () => void;
}

export function CommentsDrawer({
  comments,
  activeCommentId,
  setActiveCommentId,
  onResolveComment,
  onReopenComment,
  onRemoveComment,
  onClose,
}: CommentsDrawerProps) {
  const openComments = comments.filter((comment) => !comment.resolvedAt);
  const resolvedComments = comments.filter((comment) => comment.resolvedAt);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-slate-900/95 backdrop-blur-md border-l border-slate-800 z-50 flex flex-col shadow-2xl lg:hidden"
    >
      <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <h3 className="text-slate-100 text-sm font-serif italic flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-400" />
          Anotações e Dúvidas
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {openComments.length === 0 && resolvedComments.length === 0 && (
          <p className="text-slate-500 text-xs italic text-center py-8">
            Nenhuma anotação nesta aula. Selecione texto no conteúdo para adicionar.
          </p>
        )}

        {openComments.map((comment) => (
          <div
            key={`drawer-comment-${comment.id}`}
            className={cn(
              "rounded-xl border p-3.5 bg-slate-950 transition-colors",
              activeCommentId === comment.id
                ? "border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.35)] animate-pulse-glow"
                : "border-slate-850"
            )}
          >
            <button
              type="button"
              onClick={() => setActiveCommentId(comment.id)}
              className="block w-full text-left cursor-pointer animate-micro-pop"
            >
              <p className="text-[10px] leading-relaxed text-slate-400 line-clamp-2 border-l-2 border-blue-500 pl-2 mb-2">
                "{comment.selectedText}"
              </p>
              <p className="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">
                {comment.body}
              </p>
            </button>
            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => onResolveComment(comment.id)}
                title="Resolver dúvida"
                className="p-1.5 rounded-lg border border-slate-800 text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onRemoveComment(comment.id)}
                title="Apagar anotação"
                className="p-1.5 rounded-lg border border-slate-800 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {resolvedComments.length > 0 && (
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Resolvidos</p>
            {resolvedComments.map((comment) => (
              <div
                key={`drawer-resolved-${comment.id}`}
                className="rounded-xl border border-slate-900 bg-slate-950 p-3 opacity-60"
              >
                <p className="text-xs text-slate-400 line-clamp-2 mb-2">{comment.body}</p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onReopenComment(comment.id)}
                    title="Reabrir comentário"
                    className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveComment(comment.id)}
                    title="Apagar comentário"
                    className="p-1.5 rounded-lg border border-slate-800 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
