import React, { useState, useRef } from "react";
import { useAulasStore } from "../../../stores/aulasStore";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ImagePlus, X, Edit, Eye, Save, Trash2, Bookmark, Highlighter, CheckCircle, CheckCircle2, ClipboardCopy, FileJson, MessageSquare, Check, RotateCcw, Sparkles, ChevronDown, BookOpen, Menu } from "lucide-react";
import { extractTextFromReactNode, generateSlug, fileToBase64, cn } from "./utils";
import { AulaRelatedQuestions } from "../../../types";

interface ChapterViewProps {
  bookId: string;
  chapterId: string;
  onBack: () => void;
}

export default function ChapterView({ bookId, chapterId, onBack }: ChapterViewProps) {
  const { books, updateChapter } = useAulasStore();

  const [editMode, setEditMode] = useState(false);
  const [markdownInput, setMarkdownInput] = useState("");
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [questionsJsonDialogOpen, setQuestionsJsonDialogOpen] = useState(false);
  const [questionsJsonText, setQuestionsJsonText] = useState("");
  const [questionPromptCopied, setQuestionPromptCopied] = useState(false);
  const [lessonPromptCopied, setLessonPromptCopied] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const questionPromptCopiedTimeoutRef = useRef<number | null>(null);
  const lessonPromptCopiedTimeoutRef = useRef<number | null>(null);
  const [activeHeadingSlug, setActiveHeadingSlug] = useState<string | null>(null);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [activeMobileDrawer, setActiveMobileDrawer] = useState<"outline" | "comments" | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [clickedMarkRect, setClickedMarkRect] = useState<DOMRect | null>(null);
  const [clickedMarkText, setClickedMarkText] = useState("");
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  const book = books.find((b) => b.id === bookId);
  const chapter = book?.chapters.find((c) => c.id === chapterId);

  React.useEffect(() => {
    const handleSelectionChange = () => {
      if (editMode || isEditingContent) {
        setSelectionRect(null);
        setSelectedText("");
        setClickedMarkRect(null);
        setClickedMarkText("");
        return;
      }

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const text = selection.toString().trim();
        if (text.length > 0) {
          const range = selection.getRangeAt(0);
          setSelectionRect(range.getBoundingClientRect());
          setSelectedText(text);
          setClickedMarkRect(null);
          setClickedMarkText("");
          return;
        }
      }
      setSelectionRect(null);
      setSelectedText("");
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [editMode, isEditingContent]);

  React.useEffect(() => {
    return () => {
      if (questionPromptCopiedTimeoutRef.current) {
        window.clearTimeout(questionPromptCopiedTimeoutRef.current);
      }
      if (lessonPromptCopiedTimeoutRef.current) {
        window.clearTimeout(lessonPromptCopiedTimeoutRef.current);
      }
    };
  }, []);

  if (!book || !chapter) return <div className="p-12 text-center text-slate-100">Curso ou Aula não encontrados.</div>;

  const handleHighlight = () => {
    if (!selectedText || !chapter) return;

    let newContent = chapter.content;

    if (newContent.includes(selectedText)) {
      newContent = newContent.replace(selectedText, `<mark>${selectedText}</mark>`);
    } else {
      const escapedText = selectedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const flexibleRegex = new RegExp(escapedText.replace(/\\n|\s+/g, "[\\s\\n*_#`]+"), "i");
      const match = newContent.match(flexibleRegex);

      if (match) {
        newContent = newContent.replace(match[0], `<mark>${match[0]}</mark>`);
      } else {
        alert(
          "Não foi possível grifar. O texto selecionado pode conter espaços invisíveis ou formatação muito complexa (tente selecionar um trecho menor)."
        );
        window.getSelection()?.removeAllRanges();
        setSelectionRect(null);
        setSelectedText("");
        return;
      }
    }

    updateChapter(book.id, chapter.id, { content: newContent });

    window.getSelection()?.removeAllRanges();
    setSelectionRect(null);
    setSelectedText("");
  };

  const replaceSelectedTextInContent = (replacement: string) => {
    if (!selectedText || !chapter) return null;

    if (chapter.content.includes(selectedText)) {
      return chapter.content.replace(selectedText, replacement);
    }

    const escapedText = selectedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const flexibleRegex = new RegExp(escapedText.replace(/\\n|\s+/g, "[\\s\\n*_#`]+"), "i");
    const match = chapter.content.match(flexibleRegex);

    if (!match) return null;

    return chapter.content.replace(match[0], replacement.replace(selectedText, match[0]));
  };

  const openCommentDialog = () => {
    if (!selectedText) return;
    setCommentInput("");
    setCommentDialogOpen(true);
  };

  const saveComment = () => {
    if (!book || !chapter || !selectedText || !commentInput.trim()) return;

    const id = crypto.randomUUID();
    const wrappedText = `<span class="comment-anchor" data-comment-id="${id}">${selectedText}</span>`;
    const newContent = replaceSelectedTextInContent(wrappedText);

    if (!newContent) {
      alert("Não foi possível comentar. Tente selecionar um trecho menor ou sem formatação complexa.");
      return;
    }

    updateChapter(book.id, chapter.id, {
      content: newContent,
      comments: [
        ...(chapter.comments || []),
        {
          id,
          selectedText,
          body: commentInput.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
    });

    window.getSelection()?.removeAllRanges();
    setSelectionRect(null);
    setSelectedText("");
    setCommentInput("");
    setCommentDialogOpen(false);
    setActiveCommentId(id);
  };

  const handleProseClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const commentAnchor = target.closest("[data-comment-id]") as HTMLElement | null;

    if (commentAnchor) {
      setActiveCommentId(commentAnchor.dataset.commentId || null);
      setClickedMarkRect(null);
      setClickedMarkText("");
      return;
    }

    if (target.tagName.toLowerCase() === "mark") {
      const rect = target.getBoundingClientRect();
      setClickedMarkRect(rect);
      setClickedMarkText(target.innerHTML);
      setActiveCommentId(null);
    } else {
      setClickedMarkRect(null);
      setClickedMarkText("");
    }
  };

  const handleRemoveHighlight = () => {
    if (!clickedMarkText || !chapter) return;

    const markTag = `<mark>${clickedMarkText}</mark>`;
    const newContent = chapter.content.replace(markTag, clickedMarkText);

    updateChapter(book.id, chapter.id, { content: newContent });
    setClickedMarkRect(null);
    setClickedMarkText("");
  };

  const updateComment = (commentId: string, updates: Partial<NonNullable<typeof chapter.comments>[number]>) => {
    if (!book || !chapter) return;

    updateChapter(book.id, chapter.id, {
      comments: (chapter.comments || []).map((comment) =>
        comment.id === commentId ? { ...comment, ...updates } : comment
      ),
    });
  };

  const removeComment = (commentId: string) => {
    if (!book || !chapter) return;

    const anchorRegex = new RegExp(`<span class="comment-anchor" data-comment-id="${commentId}">([\\s\\S]*?)<\\/span>`, "g");
    updateChapter(book.id, chapter.id, {
      content: chapter.content.replace(anchorRegex, "$1"),
      comments: (chapter.comments || []).filter((comment) => comment.id !== commentId),
    });

    if (activeCommentId === commentId) setActiveCommentId(null);
  };

  // Extract headings for Table of Contents
  const headings = React.useMemo(() => {
    if (!chapter?.content) return [];

    const regex = /^(#{1,3})\s+(.+)$/gm;
    const matches = [];
    let match;
    while ((match = regex.exec(chapter.content)) !== null) {
      matches.push({
        level: match[1].length,
        text: match[2].trim(),
        slug: generateSlug(match[2]),
      });
    }
    return matches;
  }, [chapter?.content]);

  const hasScrolledRef = useRef(false);

  React.useEffect(() => {
    hasScrolledRef.current = false;
  }, [chapterId]);

  React.useEffect(() => {
    if (!hasScrolledRef.current && chapter?.lastReadSlug && headings.length > 0 && !isEditingContent) {
      setTimeout(() => {
        const el = document.getElementById(chapter.lastReadSlug!);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          hasScrolledRef.current = true;
        }
      }, 300);
    }
  }, [headings, chapter?.lastReadSlug, isEditingContent]);

  const startEditingContent = () => {
    setMarkdownInput(chapter?.content || "");
    setIsEditingContent(true);
  };

  const saveContent = () => {
    if (chapter) updateChapter(book.id, chapter.id, { content: markdownInput });
    setIsEditingContent(false);
  };

  const toggleReadStatus = () => {
    if (chapter) {
      updateChapter(book.id, chapter.id, {
        readAt: chapter.readAt ? undefined : new Date().toISOString(),
      });
    }
  };

  const getQuestionStatus = (questionNumber: number): "correct" | "incorrect" | "pending" => {
    if (!chapter) return "pending";

    const correct = chapter.correctQuestions || [];
    const incorrect = chapter.incorrectQuestions || [];
    const legacy = chapter.completedPrincipalQuestions || [];

    if (correct.includes(questionNumber)) return "correct";
    if (incorrect.includes(questionNumber)) return "incorrect";

    // If neither list exists yet, check legacy completed
    if (correct.length === 0 && incorrect.length === 0 && legacy.includes(questionNumber)) {
      return "correct";
    }

    return "pending";
  };

  const setQuestionStatus = (questionNumber: number, status: "correct" | "incorrect" | "pending") => {
    if (!book || !chapter) return;

    // Get current lists, fallback to empty arrays
    const correctQuestions = chapter.correctQuestions || [];
    const incorrectQuestions = chapter.incorrectQuestions || [];
    
    // Legacy support: if correctQuestions is empty but completedPrincipalQuestions has items,
    // we migrate them to correctQuestions on the fly.
    const legacyCompleted = chapter.completedPrincipalQuestions || [];
    let activeCorrect = [...correctQuestions];
    if (correctQuestions.length === 0 && incorrectQuestions.length === 0 && legacyCompleted.length > 0) {
      activeCorrect = [...legacyCompleted];
    }

    let nextCorrect = activeCorrect.filter(q => q !== questionNumber);
    let nextIncorrect = incorrectQuestions.filter(q => q !== questionNumber);

    if (status === "correct") {
      nextCorrect = [...nextCorrect, questionNumber].sort((a, b) => a - b);
    } else if (status === "incorrect") {
      nextIncorrect = [...nextIncorrect, questionNumber].sort((a, b) => a - b);
    }

    // Keep completedPrincipalQuestions in sync as the union of correct and incorrect
    const nextCompleted = [...nextCorrect, ...nextIncorrect].sort((a, b) => a - b);

    updateChapter(book.id, chapter.id, {
      correctQuestions: nextCorrect,
      incorrectQuestions: nextIncorrect,
      completedPrincipalQuestions: nextCompleted,
    });
  };

  const handleMarkCorrect = (questionNumber: number) => {
    setQuestionStatus(questionNumber, "correct");
    setExpandedQuestion(null);
  };

  const handleMarkIncorrect = (questionNumber: number) => {
    setQuestionStatus(questionNumber, "incorrect");
    setExpandedQuestion(null);
  };

  const handleClearQuestion = (questionNumber: number) => {
    setQuestionStatus(questionNumber, "pending");
    setExpandedQuestion(null);
  };

  const copyQuestionPrompt = async () => {
    if (!book || !chapter) return;
    const chapterNumber = book.chapters.findIndex((item) => item.id === chapter.id) + 1;
    const questionTitle = chapter.title.replace(/^Aula\s*\d+\s*[—-]\s*/i, "");

    const prompt = `Analise a teoria da aula ${chapterNumber} (${questionTitle}) e compare com as questoes que voce ja tem.

Elenca quais questoes se relacionam com essa teoria.

Responda somente com JSON valido, sem texto fora do JSON.

Use exatamente este formato:
[
  {
    "aula": ${chapterNumber},
    "titulo": "${questionTitle}",
    "questoes_principais": [2, 6, 7],
    "por_secao": [
      {
        "secao": "Nome da secao da teoria",
        "questoes": [2, 6]
      }
    ],
    "questoes_secundarias_que_misturam_com_aulas_futuras": [1, 4],
    "observacao": "Explique rapidamente o criterio usado."
  }
]

Regras:
- Nao copie enunciados.
- Use somente numeros das questoes.
- Em questoes_principais, coloque as questoes que cobram diretamente a teoria desta aula.
- Em por_secao, agrupe as questoes principais pelas secoes da aula.
- Em questoes_secundarias_que_misturam_com_aulas_futuras, coloque questoes relacionadas, mas que dependem de assuntos de aulas futuras.
- Se nao houver questoes em algum grupo, use array vazio [].`;

    await navigator.clipboard.writeText(prompt);
    setQuestionPromptCopied(true);
    if (questionPromptCopiedTimeoutRef.current) {
      window.clearTimeout(questionPromptCopiedTimeoutRef.current);
    }
    questionPromptCopiedTimeoutRef.current = window.setTimeout(() => {
      setQuestionPromptCopied(false);
    }, 1400);
  };

  const copyLessonPrompt = async () => {
    if (!book || !chapter) return;
    const chapterNumber = book.chapters.findIndex((item) => item.id === chapter.id) + 1;
    const lessonTitle = chapter.title.replace(/^Aula\s*\d+\s*[—-]\s*/i, "");

    const prompt = `Crie a **Aula ${chapterNumber}** em formato **Markdown**, com aparência bonita, organizada e fácil de ler.

A aula deve ensinar o conteúdo de forma **progressiva**, conduzindo o aluno do nível básico até um entendimento mais avançado, sem pular etapas.

Tema da aula: **${lessonTitle}**

Regras para a aula:

- Comece com uma introdução simples explicando o que será estudado e por que o tema é importante.
- Explique os conceitos básicos antes de avançar para ideias mais complexas.
- Use linguagem clara, didática e acessível, como se estivesse ensinando para alguém que pode estar vendo o assunto pela primeira vez.
- Organize o conteúdo com títulos, subtítulos, listas, tabelas e destaques em negrito quando ajudar na compreensão.
- Inclua exemplos práticos sempre que possível.
- Mostre a lógica por trás do conteúdo, não apenas definições soltas.
- Evite explicações excessivamente técnicas logo no início.
- Ao final, faça um resumo dos pontos principais da aula.
- Inclua uma seção de revisão com perguntas ou tópicos para o aluno fixar o conteúdo.

Estrutura sugerida:

# Aula ${chapterNumber} — ${lessonTitle}

## 1. Introdução

## 2. Conceitos básicos

## 3. Desenvolvimento do conteúdo

## 4. Exemplos práticos

## 5. Pontos de atenção / pegadinhas

## 6. Resumo da aula

## 7. Revision rápida

A aula deve ser completa, bonita em Markdown e adequada para alunos de qualquer nível de entendimento.`;

    await navigator.clipboard.writeText(prompt);
    setLessonPromptCopied(true);
    if (lessonPromptCopiedTimeoutRef.current) {
      window.clearTimeout(lessonPromptCopiedTimeoutRef.current);
    }
    lessonPromptCopiedTimeoutRef.current = window.setTimeout(() => {
      setLessonPromptCopied(false);
    }, 1400);
  };

  const importQuestionsJson = () => {
    if (!book || !chapter) return;

    try {
      const parsed = JSON.parse(questionsJsonText);
      const firstItem = Array.isArray(parsed) ? parsed[0] : parsed;
      const questionsData = firstItem as AulaRelatedQuestions;

      if (
        !questionsData ||
        !Array.isArray(questionsData.questoes_principais) ||
        !Array.isArray(questionsData.por_secao) ||
        !Array.isArray(questionsData.questoes_secundarias_que_misturam_com_aulas_futuras)
      ) {
        alert(
          'JSON inválido. Use o formato com "questoes_principais", "por_secao" e "questoes_secundarias_que_misturam_com_aulas_futuras".'
        );
        return;
      }

      updateChapter(book.id, chapter.id, { relatedQuestions: questionsData });
      setQuestionsJsonDialogOpen(false);
      setQuestionsJsonText("");
    } catch (err) {
      alert("Erro ao ler JSON: " + (err as Error).message);
    }
  };

  const handleHeadingClick = (slug: string) => {
    if (!chapter) return;

    if (editMode) {
      setActiveHeadingSlug(slug);
      fileInputRef.current?.click();
    } else {
      const img = chapter.attachments[slug];
      if (img) setSelectedImage(img);
      else setSelectedImage(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeHeadingSlug || !book || !chapter) return;

    try {
      const base64 = await fileToBase64(file);
      updateChapter(book.id, chapter.id, {
        attachments: { ...(chapter.attachments || {}), [activeHeadingSlug]: base64 },
      });
      alert("Imagem anexada com sucesso!");
    } catch (err) {
      alert("Erro ao salvar imagem");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setActiveHeadingSlug(null);
    }
  };

  const attachments = chapter?.attachments || {};
  const comments = chapter?.comments || [];
  const openComments = comments.filter((comment) => !comment.resolvedAt);
  const resolvedComments = comments.filter((comment) => comment.resolvedAt);

  const markdownComponents = React.useMemo(() => {
    const createHeadingRenderer = (Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") => ({
      node,
      children,
      ...props
    }: any) => {
      const text = extractTextFromReactNode(children);
      const slug = generateSlug(text);
      const hasAttachment = !!(attachments && attachments[slug]);

      const isH1 = Tag === "h1";
      const isH2 = Tag === "h2";
      const isH3 = Tag === "h3";

      return (
        <Tag
          id={slug}
          {...props}
          title="Duplo clique para anexar/substituir imagem"
          onClick={() => handleHeadingClick(slug)}
          onDoubleClick={(e: React.MouseEvent) => {
            e.preventDefault();
            setActiveHeadingSlug(slug);
            fileInputRef.current?.click();
          }}
          className={cn(
            "not-prose relative group block w-full cursor-pointer transition-colors font-serif rounded-r scroll-mt-6",
            isH1 && "text-4xl md:text-5xl border-b border-slate-800 pb-4 mb-6 mt-12 text-slate-50 font-bold leading-tight",
            isH2 && "text-2xl md:text-3xl border-b border-slate-850 pb-3 mb-4 mt-10 text-slate-100 font-semibold leading-snug",
            isH3 && "text-xl md:text-2xl text-[#D4AF37] mb-4 mt-8 font-medium",
            !isH1 && !isH2 && !isH3 && "text-lg md:text-xl mb-3 mt-6 text-slate-200 font-medium",
            "border-l-4 pl-4 py-2 -ml-5",
            editMode
              ? "hover:bg-slate-850 border-slate-800"
              : hasAttachment
              ? "hover:bg-slate-900 border-[#D4AF37]"
              : "border-transparent hover:border-slate-850 hover:bg-slate-900/30"
          )}
        >
          <div className="relative z-10 flex items-center justify-between gap-4">
            <span className="flex-1">{children}</span>
            {hasAttachment && !editMode && (
              <span className="text-[10px] uppercase font-bold text-[#D4AF37] bg-slate-900 border border-[#D4AF37]/30 px-2 py-1 rounded inline-flex shrink-0 font-sans tracking-widest shadow-sm">
                Anexo visual
              </span>
            )}
            {editMode && (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-900 text-[#D4AF37] border border-slate-850 px-2 py-1 rounded inline-flex items-center gap-1 font-bold uppercase tracking-widest font-sans shrink-0 shadow-sm">
                <ImagePlus className="w-3 h-3" />
                {hasAttachment ? "Substituir" : "Anexar"}
              </span>
            )}
          </div>
        </Tag>
      );
    };

    return {
      h1: createHeadingRenderer("h1"),
      h2: createHeadingRenderer("h2"),
      h3: createHeadingRenderer("h3"),
      h4: createHeadingRenderer("h4"),
      h5: createHeadingRenderer("h5"),
      h6: createHeadingRenderer("h6"),
    };
  }, [attachments, editMode]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-950 overflow-hidden">
      {/* Hidden file input for attachment upload */}
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

      {/* Top navbar */}
      <header className="min-h-14 border-b border-slate-900 flex items-center px-4 py-2 bg-slate-950/80 backdrop-blur-md shrink-0 justify-between gap-3 relative z-30">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-200 transition-colors bg-slate-900 border border-slate-800 p-2 rounded-lg shadow-sm cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h1 className="font-serif italic text-slate-100 min-w-0 flex-1 line-clamp-1 flex gap-2 items-center text-sm sm:text-base">
            <span className="font-sans font-semibold text-[9px] uppercase tracking-widest text-slate-400 border border-slate-850 px-2 py-0.5 rounded bg-slate-900 shrink-0 hidden sm:inline-block">
              {book.title}
            </span>
            {chapter.title}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* AI Tools Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
              className={cn(
                "text-[9px] font-bold uppercase tracking-widest rounded flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer",
                "px-2 py-2 sm:px-2.5 sm:py-1.5",
                isToolsMenuOpen 
                  ? "bg-slate-800 border border-slate-700 text-white" 
                  : "bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-200"
              )}
              title="Ferramentas de IA"
            >
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span className="hidden sm:inline">Ferramentas IA</span>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
            </button>

            {isToolsMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsToolsMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 rounded-lg border border-slate-800 bg-slate-900/95 backdrop-blur-md p-1.5 shadow-2xl z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => {
                      copyLessonPrompt();
                      setIsToolsMenuOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer",
                      lessonPromptCopied ? "text-emerald-400" : "text-slate-200"
                    )}
                  >
                    <ClipboardCopy className="w-3.5 h-3.5 shrink-0" />
                    <span>{lessonPromptCopied ? "Prompt Copiado!" : "Copiar Prompt Aula"}</span>
                  </button>
                  <button
                    onClick={() => {
                      copyQuestionPrompt();
                      setIsToolsMenuOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer",
                      questionPromptCopied ? "text-emerald-400" : "text-slate-200"
                    )}
                  >
                    <ClipboardCopy className="w-3.5 h-3.5 shrink-0" />
                    <span>{questionPromptCopied ? "Prompt Copiado!" : "Prompt Questões"}</span>
                  </button>
                  <button
                    onClick={() => {
                      setQuestionsJsonDialogOpen(true);
                      setIsToolsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded text-xs font-semibold hover:bg-slate-800 text-slate-200 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <FileJson className="w-3.5 h-3.5 shrink-0" />
                    <span>Colar JSON Questões</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mark read button */}
          <button
            onClick={toggleReadStatus}
            className={cn(
              "text-[9px] font-bold uppercase tracking-widest rounded flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer",
              "px-2 py-2 sm:px-2.5 sm:py-1.5",
              chapter.readAt
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                : "bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400"
            )}
            title={chapter.readAt ? "Marcar como não lida" : "Marcar como lida"}
          >
            {chapter.readAt ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <CheckCircle2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{chapter.readAt ? "Lida" : "Marcar Lida"}</span>
          </button>

          {/* Edit markdown button */}
          {isEditingContent ? (
            <button
              onClick={saveContent}
              className="text-[9px] font-bold uppercase tracking-widest bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-2 py-2 sm:px-2.5 sm:py-1.5 rounded flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer shrink-0"
              title="Salvar Alterações"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Salvar</span>
            </button>
          ) : (
            <button
              onClick={startEditingContent}
              className="text-[9px] font-bold uppercase tracking-widest bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-200 px-2 py-2 sm:px-2.5 sm:py-1.5 rounded flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer shrink-0"
              title="Editar em Markdown"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Editar MD</span>
            </button>
          )}

          {/* Attachments toggle */}
          {!isEditingContent && (
            <button
              onClick={() => setEditMode(!editMode)}
              className={cn(
                "text-[9px] font-bold uppercase tracking-widest rounded flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer",
                "px-2 py-2 sm:px-2.5 sm:py-1.5",
                editMode ? "bg-[#D4AF37] text-slate-950 border border-[#D4AF37]" : "bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-200"
              )}
              title={editMode ? "Voltar para o modo leitura" : "Entrar no modo de anexos"}
            >
              {editMode ? <Eye className="w-4 h-4" /> : <ImagePlus className="w-4 h-4" />}
              <span className="hidden sm:inline">{editMode ? "Leitura" : "Anexos"}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main split area */}
      <main className="flex-1 flex min-h-0 bg-slate-950">
        {/* Table of Contents / Outline Preview Sidebar */}
        {!isEditingContent && headings.length > 0 && !selectedImage && (
          <aside className="hidden lg:flex w-64 xl:w-72 border-r border-slate-900 flex-col h-full bg-slate-950 shrink-0">
            <div className="p-6 border-b border-slate-900 shrink-0">
              <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></div>
                Nesta Aula
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {headings.map((h, i) => (
                <button
                  key={`${h.slug}-${i}`}
                  onClick={() => {
                    const el = document.getElementById(h.slug);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  onDoubleClick={() => {
                    updateChapter(book.id, chapter.id, { lastReadSlug: h.slug });
                  }}
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
                    chapter?.lastReadSlug === h.slug && "!border-[#D4AF37] bg-slate-900"
                  )}
                  title="Duplo clique marca onde você parou"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "line-clamp-2 flex-1",
                        h.level === 3 && "italic",
                        chapter?.lastReadSlug === h.slug && "text-[#D4AF37]"
                      )}
                    >
                      {h.text}
                    </span>
                    {chapter?.lastReadSlug === h.slug && (
                      <Bookmark className="w-3 h-3 text-[#D4AF37] shrink-0 mt-0.5 fill-[#D4AF37]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Left side: Markdown */}
        <div
          className={cn(
            "h-full overflow-y-auto px-6 md:px-12 py-8 transition-all relative w-full",
            selectedImage ? "w-1/2 border-r border-slate-900" : "flex-1 max-w-4xl mx-auto"
          )}
        >
          {isEditingContent ? (
            <textarea
              value={markdownInput}
              onChange={(e) => setMarkdownInput(e.target.value)}
              className="w-full h-full p-6 border-2 border-slate-800 rounded bg-slate-900 font-mono text-xs leading-relaxed text-slate-100 resize-none focus:outline-none focus:border-[#D4AF37]"
              placeholder="# Escreva sua aula em Markdown ou cole HTML aqui..."
            />
          ) : (
            <div
              onClick={handleProseClick}
              className="prose prose-base md:prose-lg prose-invert max-w-none 
              prose-p:text-slate-300 prose-p:leading-relaxed 
              prose-a:text-[#D4AF37] prose-a:underline-offset-4 prose-a:font-bold prose-a:transition-colors hover:prose-a:text-[#F3D76F]
              prose-strong:text-slate-100 prose-strong:font-semibold
              prose-blockquote:border-l-4 prose-blockquote:border-[#D4AF37] prose-blockquote:bg-slate-900 prose-blockquote:py-1 prose-blockquote:pr-6 prose-blockquote:pl-6 prose-blockquote:rounded-r prose-blockquote:my-8 prose-blockquote:font-serif prose-blockquote:text-slate-400 prose-blockquote:italic
              prose-ul:text-slate-300 prose-ol:text-slate-300 prose-li:marker:text-[#D4AF37]
              prose-hr:border-slate-900 prose-hr:my-10
              prose-img:rounded-md prose-img:border prose-img:border-slate-850 prose-img:shadow-lg
              /* Custom mark style */
              [&_mark]:bg-[#D4AF37]/20 [&_mark]:text-[#F3D76F] [&_mark]:rounded-sm [&_mark]:px-1 [&_mark]:cursor-pointer [&_mark]:transition-colors hover:[&_mark]:bg-[#D4AF37]/40
              [&_.comment-anchor]:bg-blue-500/20 [&_.comment-anchor]:text-blue-200 [&_.comment-anchor]:border-b-2 [&_.comment-anchor]:border-blue-400 [&_.comment-anchor]:cursor-pointer [&_.comment-anchor]:rounded-sm [&_.comment-anchor]:px-1 hover:[&_.comment-anchor]:bg-blue-500/30
            "
            >
              {editMode && (
                <div className="bg-slate-900 border border-slate-800 text-slate-200 text-xs p-4 rounded mb-8 flex items-start gap-3">
                  <ImagePlus className="w-5 h-5 shrink-0 mt-0.5 text-[#D4AF37]" />
                  <div>
                    <p className="font-bold mb-1 uppercase tracking-widest text-[10px] text-[#D4AF37]">
                      Modo de Anexos Ativo
                    </p>
                    <p>Clique em qualquer título ou subtítulo abaixo para carregar e atribuir uma imagem a ele.</p>
                  </div>
                </div>
              )}

              {chapter.relatedQuestions && (() => {
                const totalPrincipal = chapter.relatedQuestions.questoes_principais?.length || 0;
                const principalQuestions = chapter.relatedQuestions.questoes_principais || [];
                
                const correctPrincipal = principalQuestions.filter(q => 
                  getQuestionStatus(q) === 'correct'
                ).length;
                
                const incorrectPrincipal = principalQuestions.filter(q => 
                  getQuestionStatus(q) === 'incorrect'
                ).length;

                const completedPrincipal = correctPrincipal + incorrectPrincipal;
                const progressPercent = totalPrincipal > 0 ? (completedPrincipal / totalPrincipal) * 100 : 0;
                const correctPercent = totalPrincipal > 0 ? (correctPrincipal / totalPrincipal) * 100 : 0;
                const incorrectPercent = totalPrincipal > 0 ? (incorrectPrincipal / totalPrincipal) * 100 : 0;

                return (
                  <section 
                    id="questions-section"
                    className="not-prose bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 md:p-6 mb-8 shadow-xl relative card-gradient-border"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-serif italic text-slate-100 flex items-center gap-2">
                          Questões Relacionadas
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                          Aula {chapter.relatedQuestions.aula} — {chapter.relatedQuestions.titulo}
                        </p>
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/30 rounded-full px-3 py-1 bg-slate-950 max-w-max shrink-0 font-sans font-bold">
                        {totalPrincipal} Principais
                      </div>
                    </div>

                    {/* Premium Progress Bar */}
                    {totalPrincipal > 0 && (
                      <div className="mb-6 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-sans">
                          <span>Progresso da Aula</span>
                          <span className="font-bold text-slate-300">
                            <span className="text-emerald-400 font-semibold">{correctPrincipal} acertos</span>
                            {" • "}
                            <span className="text-rose-400 font-semibold">{incorrectPrincipal} erros</span>
                            {" de "}
                            <span>{totalPrincipal} ({Math.round(progressPercent)}%)</span>
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850 flex p-[1px]">
                          {correctPercent > 0 && (
                            <motion.div 
                              layout
                              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" 
                              style={{ width: `${correctPercent}%` }}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                          )}
                          {incorrectPercent > 0 && (
                            <motion.div 
                              layout
                              className="h-full bg-gradient-to-r from-rose-600 to-rose-450 rounded-full" 
                              style={{ width: `${incorrectPercent}%` }}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-3">
                        Questões Principais
                      </h3>
                      <motion.div layout className="flex flex-wrap gap-2">
                        {totalPrincipal > 0 ? (
                          chapter.relatedQuestions.questoes_principais.map((questionNumber) => {
                            const status = getQuestionStatus(questionNumber);

                            return (
                              <QuestionPill
                                key={`principal-${questionNumber}`}
                                number={questionNumber}
                                status={status}
                                onMarkCorrect={() => handleMarkCorrect(questionNumber)}
                                onMarkIncorrect={() => handleMarkIncorrect(questionNumber)}
                                onClear={() => handleClearQuestion(questionNumber)}
                                isExpanded={expandedQuestion === questionNumber}
                                onToggleExpand={() => setExpandedQuestion(expandedQuestion === questionNumber ? null : questionNumber)}
                              />
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-500 italic">Nenhuma questão principal cadastrada.</span>
                        )}
                      </motion.div>
                    </div>

                    {chapter.relatedQuestions.por_secao && chapter.relatedQuestions.por_secao.length > 0 && (
                      <div className="space-y-4 mb-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                          Divisão por Seção da Aula
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {chapter.relatedQuestions.por_secao.map((section) => (
                            <div key={section.secao} className="border-l-2 border-slate-800 pl-3.5 py-1">
                              <div className="text-xs font-semibold text-slate-200 mb-2 truncate" title={section.secao}>{section.secao}</div>
                              <motion.div layout className="flex flex-wrap gap-1.5">
                                {section.questoes.map((questionNumber) => (
                                  <QuestionPill
                                    key={`${section.secao}-${questionNumber}`}
                                    number={questionNumber}
                                    status={getQuestionStatus(questionNumber)}
                                    onMarkCorrect={() => handleMarkCorrect(questionNumber)}
                                    onMarkIncorrect={() => handleMarkIncorrect(questionNumber)}
                                    onClear={() => handleClearQuestion(questionNumber)}
                                    isExpanded={expandedQuestion === questionNumber}
                                    onToggleExpand={() => setExpandedQuestion(expandedQuestion === questionNumber ? null : questionNumber)}
                                    size="sm"
                                  />
                                ))}
                              </motion.div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {chapter.relatedQuestions.questoes_secundarias_que_misturam_com_aulas_futuras &&
                      chapter.relatedQuestions.questoes_secundarias_que_misturam_com_aulas_futuras.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                            Secundárias (Misturam com aulas futuras)
                          </h3>
                          <motion.div layout className="flex flex-wrap gap-1.5">
                            {chapter.relatedQuestions.questoes_secundarias_que_misturam_com_aulas_futuras.map(
                              (questionNumber) => (
                                <QuestionPill
                                  key={`secundaria-${questionNumber}`}
                                  number={questionNumber}
                                  status={getQuestionStatus(questionNumber)}
                                  onMarkCorrect={() => handleMarkCorrect(questionNumber)}
                                  onMarkIncorrect={() => handleMarkIncorrect(questionNumber)}
                                  onClear={() => handleClearQuestion(questionNumber)}
                                  isExpanded={expandedQuestion === questionNumber}
                                  onToggleExpand={() => setExpandedQuestion(expandedQuestion === questionNumber ? null : questionNumber)}
                                  size="sm"
                                />
                              )
                            )}
                          </motion.div>
                        </div>
                      )}

                    {chapter.relatedQuestions.observacao && (
                      <div className="text-xs leading-relaxed text-slate-400 border-t border-slate-800 pt-4 bg-gradient-to-b from-transparent to-slate-950/10 -mx-5 -mb-5 px-5 pb-5">
                        <strong className="text-slate-300">Observações:</strong> {chapter.relatedQuestions.observacao}
                      </div>
                    )}
                  </section>
                );
              })()}

              {!chapter.content ? (
                <div className="text-slate-500 italic font-serif">
                  Nenhum conteúdo. Clique em "Editar MD" para adicionar o texto desta aula.
                </div>
              ) : (
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={markdownComponents}
                >
                  {chapter.content}
                </Markdown>
              )}

              {editMode && Object.keys(attachments).length > 0 && (
                <div className="mt-16 pt-8 border-t border-slate-900">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-6">
                    Todos os Anexos Salvos nesta Aula
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(attachments).map(([slug, imgBase64]) => (
                      <div
                        key={slug}
                        className="relative group rounded overflow-hidden border border-slate-850 bg-slate-900 aspect-square flex items-center justify-center p-2"
                      >
                        <img src={imgBase64} alt={slug} className="max-w-full max-h-full object-contain" />
                        <div className="absolute inset-0 bg-slate-950/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                          <span className="text-slate-400 text-[10px] text-center mb-3 truncate w-full" title={slug}>
                            {slug}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedImage(imgBase64)}
                              className="bg-slate-900 border border-slate-800 p-2 rounded text-slate-200 hover:bg-slate-800 cursor-pointer"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                const newAttachments = { ...attachments };
                                delete newAttachments[slug];
                                updateChapter(book.id, chapter.id, { attachments: newAttachments });
                                if (selectedImage === imgBase64) setSelectedImage(null);
                              }}
                              className="bg-red-500/20 border border-red-500/30 p-2 rounded text-red-400 hover:bg-red-500/40 cursor-pointer"
                              title="Apagar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side: Image split view */}
        {selectedImage && !isEditingContent && (
          <div className="w-1/2 h-full bg-slate-900 flex flex-col relative border-l-8 border-slate-950">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              {editMode && (
                <button
                  onClick={() => {
                    const currentEntries = Object.entries(attachments);
                    const slugToRemove = currentEntries.find(([k, v]) => v === selectedImage)?.[0];
                    if (slugToRemove) {
                      const newAttachments = { ...attachments };
                      delete newAttachments[slugToRemove];
                      updateChapter(book.id, chapter.id, { attachments: newAttachments });
                      setSelectedImage(null);
                    }
                  }}
                  className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-red-400 p-2 rounded shadow-sm transition-colors flex items-center justify-center cursor-pointer"
                  title="Remover Imagem"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setSelectedImage(null)}
                className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-200 p-2 rounded shadow-sm transition-colors flex items-center justify-center cursor-pointer"
                title="Fechar Visualização"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 w-full h-full p-8 flex flex-col items-center justify-center relative overflow-hidden">
              <span className="absolute top-4 left-4 z-10 text-[10px] font-bold text-slate-200 bg-slate-950/90 px-2 py-1 rounded border border-slate-800 shadow-sm uppercase tracking-widest backdrop-blur-sm">
                Anexo Visual
              </span>
              <div className="w-full h-full flex items-center justify-center bg-slate-950 border border-slate-850 rounded p-2 shadow-sm relative z-0">
                <img src={selectedImage} alt="Anexo" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
          </div>
        )}

        {/* Comments section */}
        {comments.length > 0 && !isEditingContent && !selectedImage && (
          <aside className="hidden xl:flex w-80 border-l border-slate-900 bg-slate-950 flex-col h-full shrink-0">
            <div className="p-5 border-b border-slate-900 shrink-0">
              <h3 className="text-slate-100 text-sm font-serif italic flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-400" />
                Anotações e Dúvidas
              </h3>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
                {openComments.length} Abertos
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                  <button type="button" onClick={() => setActiveCommentId(comment.id)} className="block w-full text-left cursor-pointer">
                    <p className="text-[10px] leading-relaxed text-slate-400 line-clamp-2 border-l-2 border-blue-500 pl-2 mb-3">
                      "{comment.selectedText}"
                    </p>
                    <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">{comment.body}</p>
                  </button>
                  <div className="flex items-center justify-end gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => updateComment(comment.id, { resolvedAt: new Date().toISOString() })}
                      title="Resolver dúvida"
                      className="p-1.5 rounded-lg border border-slate-800 text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeComment(comment.id)}
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
                          onClick={() => updateComment(comment.id, { resolvedAt: undefined })}
                          title="Reabrir comentário"
                          className="p-1.5 rounded border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeComment(comment.id)}
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
        )}
      </main>

      {questionsJsonDialogOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-2xl shadow-2xl">
            <h3 className="text-xl font-serif italic text-slate-100 mb-4">Colar JSON de Questões</h3>
            <p className="text-slate-400 text-sm mb-4">Cole aqui o JSON que a outra IA gerou para esta aula.</p>
            <textarea
              autoFocus
              value={questionsJsonText}
              onChange={(e) => setQuestionsJsonText(e.target.value)}
              className="w-full h-64 bg-slate-950 border border-slate-850 text-slate-100 px-3 py-2 rounded focus:outline-none focus:border-[#D4AF37] mb-6 font-mono text-xs resize-none"
              placeholder={
                '[\n  {\n    "aula": 1,\n    "titulo": "Título da Aula",\n    "questoes_principais": [2, 6, 7],\n    "por_secao": [\n      {\n        "secao": "Seção 1",\n        "questoes": [2]\n      }\n    ],\n    "questoes_secundarias_que_misturam_com_aulas_futuras": [1, 4],\n    "observacao": "..."\n  }\n]'
              }
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setQuestionsJsonDialogOpen(false);
                  setQuestionsJsonText("");
                }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={importQuestionsJson}
                className="bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors cursor-pointer"
              >
                Inserir na Aula
              </button>
            </div>
          </div>
        </div>
      )}

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
                onClick={() => {
                  setCommentDialogOpen(false);
                  setCommentInput("");
                }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveComment}
                disabled={!commentInput.trim()}
                className="bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:hover:bg-blue-500 text-slate-950 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors cursor-pointer"
              >
                Comentar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating text selection toolbar */}
      {selectionRect && selectedText && (
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
                handleHighlight();
              }}
              className="flex items-center gap-1.5 hover:bg-slate-800 text-[#D4AF37] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
            >
              <Highlighter className="w-3.5 h-3.5" />
              Grifar
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                openCommentDialog();
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
              handleRemoveHighlight();
            }}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-red-400 px-3 py-1.5 rounded shadow-xl text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remover
          </button>
        </div>
      )}

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {activeMobileDrawer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setActiveMobileDrawer(null)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawers */}
      <AnimatePresence>
        {activeMobileDrawer === 'outline' && (
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
                onClick={() => setActiveMobileDrawer(null)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {headings.map((h, i) => (
                <button
                  key={`drawer-heading-${h.slug}-${i}`}
                  onClick={() => {
                    const el = document.getElementById(h.slug);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                    setActiveMobileDrawer(null);
                  }}
                  onDoubleClick={() => {
                    updateChapter(book.id, chapter.id, { lastReadSlug: h.slug });
                  }}
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
                    chapter?.lastReadSlug === h.slug && "!border-[#D4AF37] bg-slate-850"
                  )}
                  title="Duplo clique marca onde você parou"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "line-clamp-2 flex-1",
                        h.level === 3 && "italic",
                        chapter?.lastReadSlug === h.slug && "text-[#D4AF37]"
                      )}
                    >
                      {h.text}
                    </span>
                    {chapter?.lastReadSlug === h.slug && (
                      <Bookmark className="w-3 h-3 text-[#D4AF37] shrink-0 mt-0.5 fill-[#D4AF37]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {activeMobileDrawer === 'comments' && (
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
                onClick={() => setActiveMobileDrawer(null)}
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
                    <p className="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">{comment.body}</p>
                  </button>
                  <div className="flex items-center justify-end gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => updateComment(comment.id, { resolvedAt: new Date().toISOString() })}
                      title="Resolver dúvida"
                      className="p-1.5 rounded-lg border border-slate-800 text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeComment(comment.id)}
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
                    <div key={`drawer-resolved-${comment.id}`} className="rounded-xl border border-slate-900 bg-slate-950 p-3 opacity-60">
                      <p className="text-xs text-slate-400 line-clamp-2 mb-2">{comment.body}</p>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => updateComment(comment.id, { resolvedAt: undefined })}
                          title="Reabrir comentário"
                          className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeComment(comment.id)}
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
        )}
      </AnimatePresence>

      {/* Mobile Bottom Floating Toolbar */}
      {!isEditingContent && (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-full py-1.5 px-3 shadow-2xl flex items-center gap-2 min-w-[280px] glass">
          <button
            onClick={() => setActiveMobileDrawer(activeMobileDrawer === 'outline' ? null : 'outline')}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-1.5 px-3 rounded-full text-slate-400 hover:text-slate-200 transition-all duration-300 cursor-pointer",
              activeMobileDrawer === 'outline' && "bg-[#D4AF37]/15 text-[#D4AF37] font-semibold"
            )}
          >
            <BookOpen className="w-4 h-4 mb-0.5" />
            <span className="text-[8px] uppercase font-bold tracking-widest">Sumário</span>
          </button>

          {chapter.relatedQuestions && (
            <button
              onClick={() => {
                const el = document.getElementById("questions-section");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className="flex-1 flex flex-col items-center justify-center py-1.5 px-3 rounded-full text-slate-400 hover:text-slate-200 transition-all duration-300 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 mb-0.5 text-[#D4AF37]" />
              <span className="text-[8px] uppercase font-bold tracking-widest">Questões</span>
            </button>
          )}

          <button
            onClick={() => setActiveMobileDrawer(activeMobileDrawer === 'comments' ? null : 'comments')}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-1.5 px-3 rounded-full text-slate-400 hover:text-slate-200 transition-all duration-300 relative cursor-pointer",
              activeMobileDrawer === 'comments' && "bg-blue-500/15 text-blue-400 font-semibold"
            )}
          >
            <MessageSquare className="w-4 h-4 mb-0.5" />
            <span className="text-[8px] uppercase font-bold tracking-widest">Notas</span>
            {openComments.length > 0 && (
              <span className="absolute top-1 right-5 w-4 h-4 bg-blue-500 text-slate-950 font-sans font-bold text-[9px] rounded-full flex items-center justify-center border border-slate-900">
                {openComments.length}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

interface QuestionPillProps {
  number: number;
  status: "correct" | "incorrect" | "pending";
  onMarkCorrect: () => void;
  onMarkIncorrect: () => void;
  onClear: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  size?: "sm" | "md";
}

function QuestionPill({
  number,
  status,
  onMarkCorrect,
  onMarkIncorrect,
  onClear,
  isExpanded,
  onToggleExpand,
  size = "md",
}: QuestionPillProps) {
  const [isHovered, setIsHovered] = useState(false);
  const showControls = isExpanded || isHovered;
  const isSm = size === "sm";

  // Set colors based on status
  let borderClass = "border-[#D4AF37]/50";
  let bgClass = "bg-slate-950";
  let textClass = "text-slate-100";
  let glowClass = "";

  if (status === "correct") {
    borderClass = "border-emerald-500/50";
    bgClass = "bg-emerald-950/20";
    textClass = "text-emerald-400";
    glowClass = "shadow-sm shadow-emerald-500/5";
  } else if (status === "incorrect") {
    borderClass = "border-rose-500/50";
    bgClass = "bg-rose-950/20";
    textClass = "text-rose-450";
    glowClass = "shadow-sm shadow-rose-500/5";
  }

  return (
    <motion.div
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "inline-flex items-center rounded-lg border font-bold transition-all relative overflow-hidden select-none",
        isSm ? "h-6 text-[10px]" : "h-8 text-xs",
        borderClass,
        bgClass,
        textClass,
        glowClass
      )}
    >
      {/* Question Number Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onToggleExpand();
        }}
        className={cn(
          "h-full flex items-center justify-center transition-colors cursor-pointer shrink-0 font-sans",
          isSm ? "px-2 gap-1" : "px-3 gap-1.5",
          "hover:bg-slate-800/40 active:bg-slate-800/60"
        )}
      >
        {status === "correct" && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            <Check className={isSm ? "w-3 h-3 text-emerald-400" : "w-3.5 h-3.5 text-emerald-400"} />
          </motion.span>
        )}
        {status === "incorrect" && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            <X className={isSm ? "w-3 h-3 text-rose-400" : "w-3.5 h-3.5 text-rose-400"} />
          </motion.span>
        )}
        <span>{number}</span>
      </button>

      {/* Control Actions - shown on hover or when expanded */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={cn(
              "flex items-center h-full border-l border-slate-800/60 bg-slate-900/40 backdrop-blur-sm overflow-hidden",
              isSm ? "pr-0.5" : "pr-1"
            )}
          >
            {status !== "correct" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkCorrect();
                }}
                className={cn(
                  "flex items-center justify-center text-emerald-500 hover:bg-emerald-500/20 active:scale-90 rounded transition-all cursor-pointer",
                  isSm ? "w-5 h-5" : "w-7 h-7"
                )}
                title="Acertei!"
              >
                <Check className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
              </button>
            )}
            {status !== "incorrect" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkIncorrect();
                }}
                className={cn(
                  "flex items-center justify-center text-rose-400 hover:bg-rose-500/20 active:scale-90 rounded transition-all cursor-pointer",
                  isSm ? "w-5 h-5" : "w-7 h-7"
                )}
                title="Errei!"
              >
                <X className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
              </button>
            )}
            {status !== "pending" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className={cn(
                  "flex items-center justify-center text-slate-400 hover:bg-slate-800 active:scale-90 rounded transition-all cursor-pointer",
                  isSm ? "w-5 h-5" : "w-7 h-7"
                )}
                title="Limpar marcação"
              >
                <RotateCcw className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
