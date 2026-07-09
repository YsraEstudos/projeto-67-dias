import React from "react";
import { Bookmark, BookOpen, X } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../utils";

interface Heading {
  level: number;
  text: string;
  slug: string;
}

interface TableOfContentsSidebarProps {
  headings: Heading[];
  activeScrollSlug: string | null;
  lastReadSlug?: string;
  onUpdateLastReadSlug: (slug: string) => void;
}

export function TableOfContentsSidebar({
  headings,
  activeScrollSlug,
  lastReadSlug,
  onUpdateLastReadSlug,
}: TableOfContentsSidebarProps) {
  const handleHeadingClick = (slug: string) => {
    const el = document.getElementById(slug);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside className="hidden lg:flex w-64 xl:w-72 border-r border-slate-900 flex-col bg-slate-950 shrink-0 sticky top-[120px] sm:top-[136px] h-[calc(100vh-120px)] sm:h-[calc(100vh-136px)]">
      <div className="p-6 border-b border-slate-900 shrink-0">
        <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></div>
          Nesta Aula
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        {headings.map((h, i) => (
          <button
            key={`${h.slug}-${i}`}
            data-outline-slug={h.slug}
            onClick={() => handleHeadingClick(h.slug)}
            onDoubleClick={() => onUpdateLastReadSlug(h.slug)}
            className={cn(
              "w-full text-left px-3 py-2 rounded text-sm transition-all flex flex-col gap-1 border-l-2 group relative cursor-pointer",
              "hover:bg-slate-900 focus:outline-none focus:bg-slate-900",
              h.level === 1
                ? "font-serif font-bold text-slate-100 border-transparent mt-2 mb-1"
                : h.level === 2
                ? "font-serif text-slate-400 border-transparent ml-2"
                : h.level === 3
                ? "text-slate-500 text-xs border-slate-900 ml-4 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                : "text-slate-600 text-[10px] border-slate-900 ml-6 hover:border-slate-400 hover:text-slate-400",
              activeScrollSlug === h.slug && "!border-[#D4AF37] bg-slate-900"
            )}
            title="Duplo clique marca onde você parou"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "line-clamp-2 flex-1",
                  h.level === 3 && "italic",
                  activeScrollSlug === h.slug ? "text-[#D4AF37] font-semibold" : "text-slate-400"
                )}
              >
                {h.text}
              </span>
              {lastReadSlug === h.slug && (
                <Bookmark className="w-3 h-3 text-[#D4AF37] shrink-0 mt-0.5 fill-[#D4AF37]" />
              )}
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

interface TableOfContentsDrawerProps {
  headings: Heading[];
  activeScrollSlug: string | null;
  lastReadSlug?: string;
  onUpdateLastReadSlug: (slug: string) => void;
  onClose: () => void;
}

export function TableOfContentsDrawer({
  headings,
  activeScrollSlug,
  lastReadSlug,
  onUpdateLastReadSlug,
  onClose,
}: TableOfContentsDrawerProps) {
  const handleHeadingClick = (slug: string) => {
    const el = document.getElementById(slug);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    onClose();
  };

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
          <BookOpen className="h-4 w-4 text-[#D4AF37]" />
          Nesta Aula
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {headings.map((h, i) => (
          <button
            key={`drawer-heading-${h.slug}-${i}`}
            data-outline-slug={h.slug}
            onClick={() => handleHeadingClick(h.slug)}
            onDoubleClick={() => onUpdateLastReadSlug(h.slug)}
            className={cn(
              "w-full text-left px-3 py-2 rounded text-sm transition-all flex flex-col gap-1 border-l-2 group relative cursor-pointer",
              "hover:bg-slate-850 focus:outline-none focus:bg-slate-850",
              h.level === 1
                ? "font-serif font-bold text-slate-100 border-transparent mt-2 mb-1"
                : h.level === 2
                ? "font-serif text-slate-400 border-transparent ml-2"
                : h.level === 3
                ? "text-slate-500 text-xs border-slate-800 ml-4 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                : "text-slate-600 text-[10px] border-slate-800 ml-6 hover:border-slate-400 hover:text-slate-400",
              activeScrollSlug === h.slug && "!border-[#D4AF37] bg-slate-850"
            )}
            title="Duplo clique marca onde você parou"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "line-clamp-2 flex-1",
                  h.level === 3 && "italic",
                  activeScrollSlug === h.slug && "text-[#D4AF37]"
                )}
              >
                {h.text}
              </span>
              {lastReadSlug === h.slug && (
                <Bookmark className="w-3 h-3 text-[#D4AF37] shrink-0 mt-0.5 fill-[#D4AF37]" />
              )}
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
