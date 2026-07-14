import React, { useState, useRef, useEffect } from "react";
import { useAulasStore } from "../../../stores/aulasStore";
import { useShallow } from "zustand/react/shallow";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ImagePlus,
  X,
  Edit,
  Eye,
  Save,
  Trash2,
  Highlighter,
  CheckCircle,
  CheckCircle2,
  ClipboardCopy,
  FileJson,
  MessageSquare,
  Check,
  RotateCcw,
  Sparkles,
  ChevronDown,
  BookOpen,
  History,
  TrendingUp,
  LineChart,
  ListTodo,
  Plus,
} from "lucide-react";
import { generateSlug, fileToBase64, cn } from "./utils";
import { AulaRelatedQuestions, QuestionAttempt } from "../../../types";
import Scratchpad from "./Scratchpad";

import { TableOfContentsSidebar, TableOfContentsDrawer } from "./components/TableOfContents";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { StudyTimer } from "./components/StudyTimer";
import { AnnotationOverlay, CommentsSidebar, CommentsDrawer } from "./components/AnnotationOverlay";

/**
 * Converte uma string com números e intervalos de questões (ex: "1-5, 8, 10-12")
 * em uma lista ordenada de números únicos ([1, 2, 3, 4, 5, 8, 10, 11, 12]).
 */
export function parseQuestionNumbers(input: string): number[] {
  const result = new Set<number>();
  if (!input) return [];

  const normalized = input.replace(/[\u2013\u2014]/g, "-");
  const parts = normalized.split(",");

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-");
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);

      if (!isNaN(start) && !isNaN(end)) {
        const minVal = Math.min(start, end);
        const maxVal = Math.max(start, end);
        const safeMax = Math.min(minVal + 1000, maxVal);
        for (let i = minVal; i <= safeMax; i++) {
          if (i > 0) result.add(i);
        }
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num > 0) {
        result.add(num);
      }
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}

/**
 * Converte uma lista de números em uma string formatada de forma compacta (ex: [1, 2, 3, 5, 7, 8] -> "1-3, 5, 7-8").
 */
export function formatQuestionNumbers(numbers: number[]): string {
  if (!numbers || numbers.length === 0) return "";
  const sorted = [...numbers].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i];
    if (current === undefined || current !== prev + 1) {
      if (start === prev) {
        ranges.push(String(start));
      } else {
        ranges.push(`${start}-${prev}`);
      }
      if (current !== undefined) {
        start = current;
        prev = current;
      }
    } else {
      prev = current;
    }
  }

  return ranges.join(", ");
}

interface ChapterViewProps {
  bookId: string;
  chapterId: string;
  onBack: () => void;
}

export default function ChapterView({ bookId, chapterId, onBack }: ChapterViewProps) {
  const { books, updateChapter, addRecentlyStudied, setChapterConfidence, updateChapterStudyTime } = useAulasStore(
    useShallow((state) => ({
      books: state.books,
      updateChapter: state.updateChapter,
      addRecentlyStudied: state.addRecentlyStudied,
      setChapterConfidence: state.setChapterConfidence,
      updateChapterStudyTime: state.updateChapterStudyTime,
    }))
  );

  const [editMode, setEditMode] = useState(false);
  const [markdownInput, setMarkdownInput] = useState("");
  const [isEditingContent, setIsEditingContent] = useState(false);

  // Visual Question Editor State
  const [isQuestionEditorOpen, setIsQuestionEditorOpen] = useState(false);
  const [editorAulaNumber, setEditorAulaNumber] = useState<number>(1);
  const [editorAulaTitle, setEditorAulaTitle] = useState("");
  const [editorPrincipais, setEditorPrincipais] = useState("");
  const [editorSecundarias, setEditorSecundarias] = useState("");
  const [editorObservacao, setEditorObservacao] = useState("");
  const [editorSections, setEditorSections] = useState<Array<{ secao: string; questoes: string }>>([]);

  const handleOpenQuestionEditor = () => {
    const currentQuestions = chapter?.relatedQuestions;
    const defaultAulaNum = book?.chapters.findIndex((c) => c.id === chapter?.id) !== -1 
      ? (book?.chapters.findIndex((c) => c.id === chapter?.id) ?? 0) + 1 
      : 1;

    setEditorAulaNumber(currentQuestions?.aula ?? defaultAulaNum);
    setEditorAulaTitle(currentQuestions?.titulo ?? chapter?.title ?? "");
    setEditorPrincipais(formatQuestionNumbers(currentQuestions?.questoes_principais ?? []));
    setEditorSecundarias(formatQuestionNumbers(currentQuestions?.questoes_secundarias_que_misturam_com_aulas_futuras ?? []));
    setEditorObservacao(currentQuestions?.observacao ?? "");
    setEditorSections(
      (currentQuestions?.por_secao ?? []).map((sec) => ({
        secao: sec.secao,
        questoes: formatQuestionNumbers(sec.questoes),
      }))
    );
    setIsQuestionEditorOpen(true);
  };

  const handleSaveQuestions = () => {
    if (!book || !chapter) return;

    const parsedPrincipais = parseQuestionNumbers(editorPrincipais);
    
    if (parsedPrincipais.length === 0) {
      updateChapter(book.id, chapter.id, { relatedQuestions: undefined });
      setIsQuestionEditorOpen(false);
      return;
    }

    const relatedQuestions: AulaRelatedQuestions = {
      aula: Number(editorAulaNumber) || 1,
      titulo: editorAulaTitle.trim() || chapter.title,
      questoes_principais: parsedPrincipais,
      por_secao: editorSections
        .map((sec) => ({
          secao: sec.secao.trim(),
          questoes: parseQuestionNumbers(sec.questoes),
        }))
        .filter((sec) => sec.secao !== "" && sec.questoes.length > 0),
      questoes_secundarias_que_misturam_com_aulas_futuras: parseQuestionNumbers(editorSecundarias),
      observacao: editorObservacao.trim() || undefined,
    };

    updateChapter(book.id, chapter.id, { relatedQuestions });
    setIsQuestionEditorOpen(false);
  };

  // Focus Timer state
  const [timerDuration, setTimerDuration] = useState(15);
  const [timerRemaining, setTimerRemaining] = useState(900);
  const [timerActive, setTimerActive] = useState(false);
  const [timerEnded, setTimerEnded] = useState(false);
  const [completedBeforeTimer, setCompletedBeforeTimer] = useState(false);

  // Confidence & Scratchpad state
  const [showConfidenceDialog, setShowConfidenceDialog] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [questionsJsonDialogOpen, setQuestionsJsonDialogOpen] = useState(false);
  const [questionsJsonText, setQuestionsJsonText] = useState("");
  const [questionPromptCopied, setQuestionPromptCopied] = useState(false);
  const [lessonPromptCopied, setLessonPromptCopied] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const questionPromptCopiedTimeoutRef = useRef<number | null>(null);
  const lessonPromptCopiedTimeoutRef = useRef<number | null>(null);
  const [activeHeadingSlug, setActiveHeadingSlug] = useState<string | null>(null);
  const [activeScrollSlug, setActiveScrollSlug] = useState<string | null>(null);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [activeMobileDrawer, setActiveMobileDrawer] = useState<"outline" | "comments" | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [selectedHistoryQuestion, setSelectedHistoryQuestion] = useState<number | null>(null);
  const [generalStatsDialogOpen, setGeneralStatsDialogOpen] = useState(false);

  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [selectedContext, setSelectedContext] = useState("");
  const selectionChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [clickedMarkRect, setClickedMarkRect] = useState<DOMRect | null>(null);
  const [clickedMarkText, setClickedMarkText] = useState("");
  const [clickedMarkId, setClickedMarkId] = useState<string | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  const book = books.find((b) => b.id === bookId);
  const chapter = book?.chapters.find((c) => c.id === chapterId);

  // Study time tracker
  const studySecondsRef = useRef(0);

  useEffect(() => {
    if (bookId && chapterId) {
      addRecentlyStudied(bookId, chapterId);
    }
    studySecondsRef.current = 0;

    const timer = setInterval(() => {
      studySecondsRef.current += 1;
    }, 1000);

    return () => {
      clearInterval(timer);
      const seconds = studySecondsRef.current;
      if (seconds > 5 && bookId && chapterId) {
        updateChapterStudyTime(bookId, chapterId, seconds);
      }
    };
  }, [bookId, chapterId, addRecentlyStudied, updateChapterStudyTime]);

  // Sync Timer duration with chapter config
  useEffect(() => {
    if (chapter) {
      const secs = chapter.timerSeconds || 900;
      setTimerDuration(Math.floor(secs / 60));
      setTimerRemaining(secs);
      setTimerActive(false);
      setTimerEnded(false);
      setCompletedBeforeTimer(false);
    }
  }, [chapterId, chapter?.timerSeconds]);

  // Countdown timer effect
  useEffect(() => {
    if (!timerActive || timerRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          setTimerEnded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, timerRemaining]);

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

  React.useEffect(() => {
    const handleSelectionChange = () => {
      // Debounce to avoid excessive React state updates on rapid selection changes
      if (selectionChangeTimerRef.current) {
        clearTimeout(selectionChangeTimerRef.current);
      }
      selectionChangeTimerRef.current = setTimeout(() => {
        if (editMode || isEditingContent) {
          setSelectionRect(null);
          setSelectedText("");
          setSelectedContext("");
          setClickedMarkRect(null);
          setClickedMarkText("");
          setClickedMarkId(null);
          return;
        }

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
          const text = selection.toString().trim();
          if (text.length > 0) {
            const range = selection.getRangeAt(0);

            let node: Node | null = range.startContainer;
            if (node.nodeType !== Node.ELEMENT_NODE) {
              node = node.parentNode;
            }
            const container = (node as HTMLElement)?.closest("p, li, h1, h2, h3, h4, h5, h6, pre");
            const context = container?.textContent?.trim() || "";

            setSelectionRect(range.getBoundingClientRect());
            setSelectedText(text);
            setSelectedContext(context);
            setClickedMarkRect(null);
            setClickedMarkText("");
            setClickedMarkId(null);
            return;
          }
        }
        setSelectionRect(null);
        setSelectedText("");
        setSelectedContext("");
      }, 80);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (selectionChangeTimerRef.current) {
        clearTimeout(selectionChangeTimerRef.current);
      }
    };
  }, [editMode, isEditingContent]);

  React.useEffect(() => {
    if (isEditingContent || headings.length === 0) return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveScrollSlug(visible[0].target.id);
        }
      },
      {
        rootMargin: "-150px 0px -70% 0px",
      }
    );

    const elementsToObserve: HTMLElement[] = [];
    headings.forEach((h) => {
      const el = document.getElementById(h.slug);
      if (el) {
        observer.observe(el);
        elementsToObserve.push(el);
      }
    });

    return () => {
      elementsToObserve.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [headings, isEditingContent]);

  React.useEffect(() => {
    if (activeScrollSlug) {
      const activeBtn = document.querySelector(`[data-outline-slug="${activeScrollSlug}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [activeScrollSlug]);

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

  if (!book || !chapter) return <div className="p-12 text-center text-slate-100">Curso ou Aula não encontrados.</div>;

  const replaceSelectedTextInContent = (replacement: string) => {
    if (!selectedText || !chapter) return null;

    const content = chapter.content;

    // Use context text to find the correct paragraph to avoid overwriting duplicate first-occurrences
    if (selectedContext) {
      const paragraphs = content.split(/\n\n+/);
      let matchedIndex = -1;
      let maxScore = 0;

      paragraphs.forEach((p, idx) => {
        if (p.includes(selectedText)) {
          const pWords = new Set(p.split(/\s+/));
          const score = selectedContext.split(/\s+/).filter((w) => pWords.has(w)).length;
          if (score > maxScore) {
            maxScore = score;
            matchedIndex = idx;
          }
        }
      });

      if (matchedIndex !== -1) {
        paragraphs[matchedIndex] = paragraphs[matchedIndex].replace(selectedText, replacement);
        return paragraphs.join("\n\n");
      }
    }

    if (content.includes(selectedText)) {
      return content.replace(selectedText, replacement);
    }

    const escapedText = selectedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const flexibleRegex = new RegExp(escapedText.replace(/\\n|\s+/g, "[\\s\\n*_#`]+"), "i");
    const match = content.match(flexibleRegex);

    if (!match) return null;

    return content.replace(match[0], replacement.replace(selectedText, match[0]));
  };

  const handleHighlight = () => {
    if (!selectedText || !chapter) return;

    const markId = crypto.randomUUID();
    const newContent = replaceSelectedTextInContent(`<mark data-mark-id="${markId}">${selectedText}</mark>`);

    if (!newContent) {
      alert(
        "Não foi possível grifar. O texto selecionado pode conter espaços invisíveis ou formatação muito complexa (tente selecionar um trecho menor)."
      );
      window.getSelection()?.removeAllRanges();
      setSelectionRect(null);
      setSelectedText("");
      setSelectedContext("");
      return;
    }

    updateChapter(book.id, chapter.id, { content: newContent });

    window.getSelection()?.removeAllRanges();
    setSelectionRect(null);
    setSelectedText("");
    setSelectedContext("");
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
      setClickedMarkId(target.dataset.markId || null);
      setActiveCommentId(null);
    } else {
      setClickedMarkRect(null);
      setClickedMarkText("");
      setClickedMarkId(null);
    }
  };

  const handleRemoveHighlight = () => {
    if (!clickedMarkText || !chapter) return;

    let newContent: string | null = null;

    if (clickedMarkId) {
      // Use unique ID to remove exactly the clicked mark
      const markRegex = new RegExp(`<mark[^>]*data-mark-id="${clickedMarkId}"[^>]*>([\\s\\S]*?)<\\/mark>`, "g");
      newContent = chapter.content.replace(markRegex, "$1");
    } else {
      // Fallback for marks without ID (backward compatibility)
      const markTag = `<mark>${clickedMarkText}</mark>`;
      newContent = chapter.content.replaceAll(markTag, clickedMarkText);
    }

    if (newContent) {
      updateChapter(book.id, chapter.id, { content: newContent });
    }

    setClickedMarkRect(null);
    setClickedMarkText("");
    setClickedMarkId(null);
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

    const anchorRegex = new RegExp(
      `<span class="comment-anchor" data-comment-id="${commentId}">([\\s\\S]*?)<\\/span>`,
      "g"
    );
    updateChapter(book.id, chapter.id, {
      content: chapter.content.replace(anchorRegex, "$1"),
      comments: (chapter.comments || []).filter((comment) => comment.id !== commentId),
    });

    if (activeCommentId === commentId) setActiveCommentId(null);
  };

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
      const isMarkingRead = !chapter.readAt;
      updateChapter(book.id, chapter.id, {
        readAt: chapter.readAt ? undefined : new Date().toISOString(),
      });

      if (isMarkingRead) {
        if (timerActive || (timerRemaining > 0 && !timerEnded)) {
          setCompletedBeforeTimer(true);
          setTimerActive(false);
          import("canvas-confetti").then((confetti) => {
            confetti.default({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.6 },
            });
          });
        }
        setShowConfidenceDialog(true);
      }
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

  const isQuestionDifficult = (questionNumber: number): boolean => {
    return (chapter?.difficultQuestions || []).includes(questionNumber);
  };

  const getInitialQuestionStatus = (questionNumber: number): "correct" | "incorrect" | "pending" => {
    if (!chapter) return "pending";

    const history = chapter.questionAttempts?.[questionNumber.toString()]?.history || [];
    if (history.length === 0) {
      return getQuestionStatus(questionNumber);
    }

    const getDateOnly = (ts?: string) => {
      if (!ts) return "";
      return ts.includes("T") ? ts.split("T")[0] : ts.split(" ")[0] || "";
    };

    const oldestAttempt = history[history.length - 1];
    const oldestDate = getDateOnly(oldestAttempt.timestamp);
    const newestAttempt = history[0];
    const newestDate = getDateOnly(newestAttempt.timestamp);

    if (oldestDate === newestDate) {
      // If all attempts happened on the same day, there is no cross-day progress yet.
      // We set the initial status equal to the current status of the question.
      return getQuestionStatus(questionNumber);
    }

    const oldestDayAttempts = history.filter((h) => getDateOnly(h.timestamp) === oldestDate);
    if (oldestDayAttempts.length > 0) {
      return oldestDayAttempts[0].status; // The latest status on the oldest day (index 0 is newest)
    }

    return oldestAttempt.status;
  };

  const setQuestionStatus = (questionNumber: number, status: "correct" | "incorrect" | "pending") => {
    // Read fresh state from store to avoid stale closure when called rapidly
    const state = useAulasStore.getState();
    const currentBook = state.books.find((b) => b.id === bookId);
    const currentChapter = currentBook?.chapters.find((c) => c.id === chapterId);
    if (!currentBook || !currentChapter) return;

    // Get current lists, fallback to empty arrays
    const correctQuestions = currentChapter.correctQuestions || [];
    const incorrectQuestions = currentChapter.incorrectQuestions || [];

    // Legacy support: if correctQuestions is empty but completedPrincipalQuestions has items,
    // we migrate them to correctQuestions on the fly.
    const legacyCompleted = currentChapter.completedPrincipalQuestions || [];
    let activeCorrect = [...correctQuestions];
    if (correctQuestions.length === 0 && incorrectQuestions.length === 0 && legacyCompleted.length > 0) {
      activeCorrect = [...legacyCompleted];
    }

    let nextCorrect = activeCorrect.filter((q) => q !== questionNumber);
    let nextIncorrect = incorrectQuestions.filter((q) => q !== questionNumber);

    const questionAttempts = currentChapter.questionAttempts || {};
    let nextAttempts = { ...questionAttempts };

    if (status === "correct" || status === "incorrect") {
      if (status === "correct") {
        nextCorrect = [...nextCorrect, questionNumber].sort((a, b) => a - b);
      } else if (status === "incorrect") {
        nextIncorrect = [...nextIncorrect, questionNumber].sort((a, b) => a - b);
      }

      const currentStats = questionAttempts[questionNumber.toString()] || {
        total: 0,
        correct: 0,
        incorrect: 0,
        history: [],
      };

      const newAttempt: QuestionAttempt = {
        timestamp: new Date().toISOString(),
        status: status,
      };

      nextAttempts[questionNumber.toString()] = {
        total: currentStats.total + 1,
        correct: status === "correct" ? currentStats.correct + 1 : currentStats.correct,
        incorrect: status === "incorrect" ? currentStats.incorrect + 1 : currentStats.incorrect,
        history: [newAttempt, ...currentStats.history],
      };
    } else if (status === "pending") {
      // Just clear current status but keep the attempts history intact
      nextCorrect = activeCorrect.filter((q) => q !== questionNumber);
      nextIncorrect = incorrectQuestions.filter((q) => q !== questionNumber);
    }

    // Keep completedPrincipalQuestions in sync as the union of correct and incorrect
    const nextCompleted = [...nextCorrect, ...nextIncorrect].sort((a, b) => a - b);

    updateChapter(currentBook.id, currentChapter.id, {
      correctQuestions: nextCorrect,
      incorrectQuestions: nextIncorrect,
      completedPrincipalQuestions: nextCompleted,
      questionAttempts: nextAttempts,
    });
  };

  const handleClearQuestionHistory = (questionNumber: number) => {
    if (!book || !chapter) return;
    const questionAttempts = chapter.questionAttempts || {};
    let nextAttempts = { ...questionAttempts };
    delete nextAttempts[questionNumber.toString()];

    updateChapter(book.id, chapter.id, {
      questionAttempts: nextAttempts,
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

  const toggleDifficultQuestion = (questionNumber: number) => {
    if (!book || !chapter) return;

    const difficultQuestions = chapter.difficultQuestions || [];
    const isDifficult = difficultQuestions.includes(questionNumber);
    const nextDifficultQuestions = isDifficult
      ? difficultQuestions.filter((question) => question !== questionNumber)
      : [...difficultQuestions, questionNumber].sort((a, b) => a - b);

    updateChapter(book.id, chapter.id, {
      difficultQuestions: nextDifficultQuestions,
    });
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

  return (
    <div className="flex flex-col bg-slate-950">
      {/* Hidden file input for attachment upload */}
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

      {/* Top navbar */}
      <header className="sticky top-16 sm:top-20 z-30 min-h-14 border-b border-slate-900 flex items-center px-4 py-2 bg-slate-950/90 backdrop-blur-md shrink-0 justify-between gap-3 relative">
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
                      handleOpenQuestionEditor();
                      setIsToolsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded text-xs font-semibold hover:bg-slate-800 text-[#D4AF37] transition-colors flex items-center gap-2 cursor-pointer font-bold"
                  >
                    <ListTodo className="w-3.5 h-3.5 shrink-0" />
                    <span>Configurar Questões</span>
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

          {/* Focus Timer Widget */}
          {!isEditingContent && (
            <StudyTimer
              timerActive={timerActive}
              timerRemaining={timerRemaining}
              timerDuration={timerDuration}
              timerEnded={timerEnded}
              completedBeforeTimer={completedBeforeTimer}
              onStart={() => {
                if (timerRemaining <= 0) setTimerRemaining(timerDuration * 60);
                setTimerActive(true);
                setTimerEnded(false);
              }}
              onPause={() => setTimerActive(false)}
              onSaveSettings={(minutes) => {
                setTimerDuration(minutes);
                const secs = minutes * 60;
                setTimerRemaining(secs);
                setTimerEnded(false);
                setCompletedBeforeTimer(false);
                updateChapter(book.id, chapter.id, { timerSeconds: secs });
              }}
            />
          )}

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

          {/* Scratchpad toggle */}
          {!isEditingContent && (
            <button
              onClick={() => setShowScratchpad(!showScratchpad)}
              className={cn(
                "text-[9px] font-bold uppercase tracking-widest rounded flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer",
                "px-2 py-2 sm:px-2.5 sm:py-1.5",
                showScratchpad ? "bg-[#D4AF37] text-slate-950 border border-[#D4AF37]" : "bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-200"
              )}
              title={showScratchpad ? "Fechar Lousa" : "Abrir Lousa / Rascunho"}
            >
              <Highlighter className="w-4 h-4" />
              <span className="hidden sm:inline">Lousa</span>
            </button>
          )}
        </div>
      </header>

      {/* Main split area */}
      <main className="flex-1 flex min-h-0 bg-slate-950 relative">
        {/* Table of Contents Sidebar */}
        {!isEditingContent && headings.length > 0 && !selectedImage && (
          <TableOfContentsSidebar
            headings={headings}
            activeScrollSlug={activeScrollSlug}
            lastReadSlug={chapter.lastReadSlug}
            onUpdateLastReadSlug={(slug) => {
              updateChapter(book.id, chapter.id, { lastReadSlug: slug });
            }}
          />
        )}

        {/* Left side: Markdown */}
        <div
          className={cn(
            "px-6 md:px-12 py-8 transition-all relative w-full min-h-[calc(100vh-120px)] sm:min-h-[calc(100vh-136px)]",
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
          ) : !chapter.content && !chapter.relatedQuestions ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-8 max-w-xl mx-auto my-12 text-center shadow-2xl backdrop-blur-md relative card-gradient-border">
              <BookOpen className="w-12 h-12 text-[#D4AF37] mx-auto mb-4 opacity-85 animate-pulse" />
              <h2 className="text-2xl font-serif italic text-slate-100 mb-2">Aula sem Conteúdo</h2>
              <p className="text-xs text-slate-400 mb-8 max-w-sm mx-auto leading-relaxed">
                Esta aula ainda está vazia. Você pode adicionar um texto de estudo em Markdown ou configurar as questões para praticar diretamente.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={startEditingContent}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-750 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Texto de Estudo
                </button>
                <button
                  onClick={handleOpenQuestionEditor}
                  className="bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2"
                >
                  <ListTodo className="w-4 h-4" />
                  Configurar Questões
                </button>
              </div>
            </div>
          ) : (
            <MarkdownRenderer
              content={chapter.content}
              attachments={attachments}
              editMode={editMode}
              onHeadingClick={handleHeadingClick}
              onHeadingDoubleClick={(slug) => {
                setActiveHeadingSlug(slug);
                fileInputRef.current?.click();
              }}
              onClick={handleProseClick}
              onRemoveAttachment={(slug) => {
                const newAttachments = { ...attachments };
                delete newAttachments[slug];
                updateChapter(book.id, chapter.id, { attachments: newAttachments });
                if (selectedImage === attachments[slug]) setSelectedImage(null);
              }}
              onViewAttachment={setSelectedImage}
            >
              {chapter.relatedQuestions && (() => {
                const totalPrincipal = chapter.relatedQuestions.questoes_principais?.length || 0;
                const principalQuestions = chapter.relatedQuestions.questoes_principais || [];

                const correctPrincipal = principalQuestions.filter(
                  (q) => getQuestionStatus(q) === "correct"
                ).length;

                const incorrectPrincipal = principalQuestions.filter(
                  (q) => getQuestionStatus(q) === "incorrect"
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
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setGeneralStatsDialogOpen(true)}
                          className="text-[10px] uppercase tracking-widest text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-full px-3 py-1 bg-emerald-950/15 hover:bg-emerald-950/30 transition-all font-sans font-bold flex items-center gap-1.5 cursor-pointer"
                          title="Ver estatísticas de evolução da aula"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          Desempenho & Evolução
                        </button>
                        <div className="text-[10px] uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/30 rounded-full px-3 py-1 bg-slate-950 max-w-max shrink-0 font-sans font-bold">
                          {totalPrincipal} Principais
                        </div>
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
                            <span>
                              {totalPrincipal} ({Math.round(progressPercent)}%)
                            </span>
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
                                isDifficult={isQuestionDifficult(questionNumber)}
                                onMarkCorrect={() => handleMarkCorrect(questionNumber)}
                                onMarkIncorrect={() => handleMarkIncorrect(questionNumber)}
                                onClear={() => handleClearQuestion(questionNumber)}
                                onToggleDifficult={() => toggleDifficultQuestion(questionNumber)}
                                onOpenHistory={() => setSelectedHistoryQuestion(questionNumber)}
                                isExpanded={expandedQuestion === questionNumber}
                                onToggleExpand={() =>
                                  setExpandedQuestion(
                                    expandedQuestion === questionNumber ? null : questionNumber
                                  )
                                }
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
                              <div
                                className="text-xs font-semibold text-slate-200 mb-2 truncate"
                                title={section.secao}
                              >
                                {section.secao}
                              </div>
                              <motion.div layout className="flex flex-wrap gap-1.5">
                                {section.questoes.map((questionNumber) => (
                                  <QuestionPill
                                    key={`${section.secao}-${questionNumber}`}
                                    number={questionNumber}
                                    status={getQuestionStatus(questionNumber)}
                                    isDifficult={isQuestionDifficult(questionNumber)}
                                    onMarkCorrect={() => handleMarkCorrect(questionNumber)}
                                    onMarkIncorrect={() => handleMarkIncorrect(questionNumber)}
                                    onClear={() => handleClearQuestion(questionNumber)}
                                    onToggleDifficult={() => toggleDifficultQuestion(questionNumber)}
                                    onOpenHistory={() => setSelectedHistoryQuestion(questionNumber)}
                                    isExpanded={expandedQuestion === questionNumber}
                                    onToggleExpand={() =>
                                      setExpandedQuestion(
                                        expandedQuestion === questionNumber ? null : questionNumber
                                      )
                                    }
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
                                  isDifficult={isQuestionDifficult(questionNumber)}
                                  onMarkCorrect={() => handleMarkCorrect(questionNumber)}
                                  onMarkIncorrect={() => handleMarkIncorrect(questionNumber)}
                                  onClear={() => handleClearQuestion(questionNumber)}
                                  onToggleDifficult={() => toggleDifficultQuestion(questionNumber)}
                                  onOpenHistory={() => setSelectedHistoryQuestion(questionNumber)}
                                  isExpanded={expandedQuestion === questionNumber}
                                  onToggleExpand={() =>
                                    setExpandedQuestion(
                                      expandedQuestion === questionNumber ? null : questionNumber
                                    )
                                  }
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
            </MarkdownRenderer>
          )}
        </div>

        {/* Right side: Image split view */}
        {selectedImage && !isEditingContent && (
          <div className="w-1/2 bg-slate-900 flex flex-col relative border-l-8 border-slate-950 sticky top-[120px] sm:top-[136px] h-[calc(100vh-120px)] sm:h-[calc(100vh-136px)]">
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

        {/* Comments Sidebar (desktop) */}
        {comments.length > 0 && !isEditingContent && !selectedImage && (
          <CommentsSidebar
            comments={comments}
            activeCommentId={activeCommentId}
            setActiveCommentId={setActiveCommentId}
            onResolveComment={(id) => updateComment(id, { resolvedAt: new Date().toISOString() })}
            onReopenComment={(id) => updateComment(id, { resolvedAt: undefined })}
            onRemoveComment={removeComment}
          />
        )}

        {showScratchpad && !isEditingContent && !selectedImage && (
          <aside className="w-80 border-l border-slate-900 bg-slate-950 flex flex-col shrink-0 sticky top-[120px] sm:top-[136px] h-[calc(100vh-120px)] sm:h-[calc(100vh-136px)]">
            <Scratchpad onClose={() => setShowScratchpad(false)} />
          </aside>
        )}
      </main>

      {/* Floating selection overlays and dialogs */}
      <AnnotationOverlay
        selectionRect={selectionRect}
        selectedText={selectedText}
        clickedMarkRect={clickedMarkRect}
        clickedMarkText={clickedMarkText}
        onHighlight={handleHighlight}
        onRemoveHighlight={handleRemoveHighlight}
        onAddComment={(body) => {
          if (!book || !chapter || !selectedText) return;
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
                body,
                createdAt: new Date().toISOString(),
              },
            ],
          });
          setActiveCommentId(id);
        }}
        onClearSelection={() => {
          window.getSelection()?.removeAllRanges();
          setSelectionRect(null);
          setSelectedText("");
          setSelectedContext("");
        }}
      />

      {selectedHistoryQuestion !== null && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setSelectedHistoryQuestion(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="p-2.5 bg-[#D4AF37]/10 rounded-xl text-[#D4AF37]">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-serif italic text-slate-100">
                  Histórico — Questão {selectedHistoryQuestion}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Status Atual:</span>
                  {(() => {
                    const status = getQuestionStatus(selectedHistoryQuestion);
                    if (status === "correct") {
                      return (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                          Acertada
                        </span>
                      );
                    }
                    if (status === "incorrect") {
                      return (
                        <span className="text-[10px] bg-rose-500/10 text-rose-450 border border-rose-500/20 px-2 py-0.5 rounded font-bold">
                          Errada
                        </span>
                      );
                    }
                    return (
                      <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded font-bold">
                        Pendente
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            {(() => {
              const stats = chapter?.questionAttempts?.[selectedHistoryQuestion.toString()] || {
                total: 0,
                correct: 0,
                incorrect: 0,
                history: [],
              };
              const successRate = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

              return (
                <>
                  <div className="grid grid-cols-4 gap-2 mb-6 text-center">
                    <div className="bg-slate-950/60 border border-slate-850 p-2 rounded-lg flex flex-col justify-center">
                      <span className="text-[8px] uppercase tracking-wider text-slate-500 font-sans block mb-1">
                        Tentativas
                      </span>
                      <strong className="text-slate-100 text-sm font-bold">{stats.total}</strong>
                    </div>
                    <div className="bg-emerald-950/10 border border-emerald-900/20 p-2 rounded-lg flex flex-col justify-center">
                      <span className="text-[8px] uppercase tracking-wider text-emerald-500/70 font-sans block mb-1">
                        Acertos
                      </span>
                      <strong className="text-emerald-400 text-sm font-bold">{stats.correct}</strong>
                    </div>
                    <div className="bg-rose-950/10 border border-rose-900/20 p-2 rounded-lg flex flex-col justify-center">
                      <span className="text-[8px] uppercase tracking-wider text-rose-500/70 font-sans block mb-1">
                        Erros
                      </span>
                      <strong className="text-rose-400 text-sm font-bold">{stats.incorrect}</strong>
                    </div>
                    <div className="bg-blue-950/10 border border-blue-900/20 p-2 rounded-lg flex flex-col justify-center">
                      <span className="text-[8px] uppercase tracking-wider text-blue-400/70 font-sans block mb-1">
                        Taxa
                      </span>
                      <strong className="text-blue-400 text-sm font-bold">{successRate}%</strong>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-3">
                      Linha do Tempo
                    </h4>
                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {stats.history.length > 0 ? (
                        stats.history.map((attempt, index) => {
                          const dateObj = new Date(attempt.timestamp);
                          const dateFormatted = dateObj.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          });
                          const timeFormatted = dateObj.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                          const isCorrect = attempt.status === "correct";

                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2.5 rounded bg-slate-950/40 border border-slate-850 hover:bg-slate-950/60 transition-all"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "p-1 rounded-full shrink-0",
                                    isCorrect ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-450"
                                  )}
                                >
                                  {isCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                </div>
                                <span className={cn("text-xs font-semibold", isCorrect ? "text-emerald-400" : "text-rose-400")}>
                                  {isCorrect ? "Marcou como Certo" : "Marcou como Errado"}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-sans font-medium">
                                {dateFormatted} às {timeFormatted}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-500 italic text-center py-6 border border-dashed border-slate-880 rounded-lg">
                          Nenhuma tentativa registrada para esta questão ainda.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-2">
                    {stats.total > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `Deseja limpar todo o histórico de tentativas da Questão ${selectedHistoryQuestion}?`
                            )
                          ) {
                            handleClearQuestionHistory(selectedHistoryQuestion);
                          }
                        }}
                        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 font-bold uppercase tracking-wider"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Limpar Histórico
                      </button>
                    ) : (
                      <div />
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedHistoryQuestion(null)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {showConfidenceDialog && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-sm shadow-2xl relative text-center">
            <button
              onClick={() => setShowConfidenceDialog(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif italic text-slate-100 mb-2">Aula Concluída!</h3>
            {completedBeforeTimer && (
              <p className="text-xs text-emerald-400 font-semibold mb-4 animate-bounce">
                🏆 Parabéns! Você concluiu a aula antes do tempo acabar!
              </p>
            )}
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Como você avalia seu domínio e compreensão desse conteúdo?
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setChapterConfidence(book.id, chapter.id, "easy");
                  setShowConfidenceDialog(false);
                }}
                className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                😊 Fácil (Revisar em 7 dias)
              </button>
              <button
                type="button"
                onClick={() => {
                  setChapterConfidence(book.id, chapter.id, "medium");
                  setShowConfidenceDialog(false);
                }}
                className="w-full bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                😐 Médio (Revisar em 3 dias)
              </button>
              <button
                type="button"
                onClick={() => {
                  setChapterConfidence(book.id, chapter.id, "hard");
                  setShowConfidenceDialog(false);
                }}
                className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                😰 Difícil (Revisar amanhã)
              </button>
            </div>
          </div>
        </div>
      )}

      {generalStatsDialogOpen && chapter?.relatedQuestions && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setGeneralStatsDialogOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                <LineChart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-serif italic text-slate-100">Desempenho & Evolução</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aula {chapter.relatedQuestions.aula} — {chapter.relatedQuestions.titulo}
                </p>
              </div>
            </div>

            <div className="overflow-y-auto pr-1 flex-1 mt-4 space-y-6 custom-scrollbar">
              {(() => {
                const totalPrincipal = chapter.relatedQuestions.questoes_principais.length;
                const currentCorrect = chapter.relatedQuestions.questoes_principais.filter(
                  (q) => getQuestionStatus(q) === "correct"
                ).length;
                const currentPct = totalPrincipal > 0 ? (currentCorrect / totalPrincipal) * 100 : 0;

                const firstAttemptCorrect = chapter.relatedQuestions.questoes_principais.filter((q) => {
                  return getInitialQuestionStatus(q) === "correct";
                }).length;
                const firstPct = totalPrincipal > 0 ? (firstAttemptCorrect / totalPrincipal) * 100 : 0;

                const diffPct = currentPct - firstPct;

                let improved = 0;
                let declined = 0;
                let stableCorrect = 0;
                let stableIncorrect = 0;
                let unattempted = 0;
                let totalAttemptsOfAll = 0;

                chapter.relatedQuestions.questoes_principais.forEach((q) => {
                  const history = chapter.questionAttempts?.[q.toString()]?.history || [];
                  const current = getQuestionStatus(q);
                  totalAttemptsOfAll += history.length;

                  const first = getInitialQuestionStatus(q);
                  if (first === "pending") {
                    unattempted += 1;
                  } else if (first === "incorrect" && current === "correct") {
                    improved += 1;
                  } else if (first === "correct" && (current === "incorrect" || current === "pending")) {
                    declined += 1;
                  } else if (first === "correct" && current === "correct") {
                    stableCorrect += 1;
                  } else {
                    stableIncorrect += 1;
                  }
                });

                return (
                  <section className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-4">
                      Evolução Geral (Questões Principais)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                      <div className="bg-slate-900/80 border border-slate-850 p-3.5 rounded-lg text-center flex flex-col justify-center">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-sans block mb-1">
                          Taxa de Acerto Atual
                        </span>
                        <strong className="text-emerald-400 text-2xl font-bold">{Math.round(currentPct)}%</strong>
                        <span className="text-[9px] text-slate-500 mt-1">
                          {currentCorrect} de {totalPrincipal} questões
                        </span>
                      </div>

                      <div className="bg-slate-900/80 border border-slate-850 p-3.5 rounded-lg text-center flex flex-col justify-center">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-sans block mb-1">
                          Taxa de Acerto Inicial
                        </span>
                        <strong className="text-slate-300 text-2xl font-bold">{Math.round(firstPct)}%</strong>
                        <span className="text-[9px] text-slate-500 mt-1">
                          {firstAttemptCorrect} corretas na 1ª tentativa
                        </span>
                      </div>

                      <div className="bg-slate-900/80 border border-slate-850 p-3.5 rounded-lg text-center flex flex-col justify-center">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-sans block mb-1">
                          Evolução Geral
                        </span>
                        {totalAttemptsOfAll === 0 ? (
                          <span className="text-slate-400 font-bold text-sm block py-1.5">Sem tentativas ainda</span>
                        ) : diffPct > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="text-emerald-400 text-2xl font-bold flex items-center gap-1">
                              +{Math.round(diffPct)}% 📈
                            </span>
                            <span className="text-[9px] text-emerald-500 font-semibold mt-0.5">
                              Sua média melhorou!
                            </span>
                          </div>
                        ) : diffPct < 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="text-rose-400 text-2xl font-bold flex items-center gap-1">
                              {Math.round(diffPct)}% 📉
                            </span>
                            <span className="text-[9px] text-rose-500 font-semibold mt-0.5">Sua média piorou</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="text-slate-400 text-2xl font-bold flex items-center gap-1">
                              Estável ➖
                            </span>
                            <span className="text-[9px] text-slate-500 font-semibold mt-0.5">Média mantida</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 bg-emerald-950/15 border border-emerald-900/20 rounded-lg">
                        <span className="text-emerald-400 font-bold block text-sm">{improved}</span>
                        <span className="text-[9px] text-slate-400">Melhoraram</span>
                      </div>
                      <div className="p-2 bg-rose-950/15 border border-rose-900/20 rounded-lg">
                        <span className="text-rose-400 font-bold block text-sm">{declined}</span>
                        <span className="text-[9px] text-slate-400">Pioraram</span>
                      </div>
                      <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                        <span className="text-slate-200 font-bold block text-sm">{stableCorrect}</span>
                        <span className="text-[9px] text-slate-400">Estável (Acerto)</span>
                      </div>
                      <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                        <span className="text-slate-400 font-bold block text-sm">{stableIncorrect}</span>
                        <span className="text-[9px] text-slate-400">Estável (Erro)</span>
                      </div>
                    </div>
                  </section>
                );
              })()}

              <section className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                  Análise Focada por Seção da Aula
                </h4>

                {chapter.relatedQuestions.por_secao && chapter.relatedQuestions.por_secao.length > 0 ? (
                  <div className="space-y-4">
                    {chapter.relatedQuestions.por_secao.map((section) => {
                      const totalSec = section.questoes.length;
                      const correctSec = section.questoes.filter((q) => getQuestionStatus(q) === "correct").length;
                      const incorrectSec = section.questoes.filter((q) => getQuestionStatus(q) === "incorrect").length;
                      const pendingSec = totalSec - correctSec - incorrectSec;

                      const correctSecPct = totalSec > 0 ? (correctSec / totalSec) * 100 : 0;
                      const incorrectSecPct = totalSec > 0 ? (incorrectSec / totalSec) * 100 : 0;
                      const pendingSecPct = totalSec > 0 ? (pendingSec / totalSec) * 100 : 0;

                      const firstCorrectSec = section.questoes.filter((q) => {
                        return getInitialQuestionStatus(q) === "correct";
                      }).length;
                      const firstSecPct = totalSec > 0 ? (firstCorrectSec / totalSec) * 100 : 0;
                      const diffSecPct = correctSecPct - firstSecPct;

                      const hasAttemptsSec = section.questoes.some((q) => {
                        const history = chapter.questionAttempts?.[q.toString()]?.history || [];
                        return history.length > 0;
                      });

                      return (
                        <article key={section.secao} className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <h5
                              className="text-sm font-semibold text-slate-200 truncate pr-2 max-w-[70%]"
                              title={section.secao}
                            >
                              {section.secao}
                            </h5>

                            {!hasAttemptsSec ? (
                              <span className="text-[9px] bg-slate-800 text-slate-500 border border-slate-700 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                                Sem tentativas
                              </span>
                            ) : diffSecPct > 0 ? (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                                +{Math.round(diffSecPct)}% Melhorou! 📈
                              </span>
                            ) : diffSecPct < 0 ? (
                              <span className="text-[9px] bg-rose-500/10 text-rose-450 border border-rose-500/20 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                                {Math.round(diffSecPct)}% Piorou! 📉
                              </span>
                            ) : (
                              <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                                Estável ➖
                              </span>
                            )}
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-400 mb-2 font-sans">
                            <span>
                              Acertos: <strong className="text-slate-200">{correctSec} / {totalSec}</strong>
                            </span>
                            <span className="text-slate-300">
                              Atual: <strong className="text-emerald-400">{Math.round(correctSecPct)}%</strong>
                              {" • "}
                              Inicial: <strong className="text-slate-400">{Math.round(firstSecPct)}%</strong>
                            </span>
                          </div>

                          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850 flex p-[1px] mb-4">
                            {correctSecPct > 0 && (
                              <div
                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                                style={{ width: `${correctSecPct}%` }}
                              />
                            )}
                            {incorrectSecPct > 0 && (
                              <div
                                className="h-full bg-gradient-to-r from-rose-600 to-rose-450 rounded-full"
                                style={{ width: `${incorrectSecPct}%` }}
                              />
                            )}
                            {pendingSecPct > 0 && (
                              <div className="h-full bg-slate-800 rounded-full" style={{ width: `${pendingSecPct}%` }} />
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {section.questoes.map((questionNumber) => {
                              const status = getQuestionStatus(questionNumber);
                              const qHistory = chapter.questionAttempts?.[questionNumber.toString()]?.history || [];
                              const attemptsCount = qHistory.length;

                              let dotBorder = "border-slate-800";
                              let dotBg = "bg-slate-950";
                              let dotText = "text-slate-400";
                              if (status === "correct") {
                                dotBorder = "border-emerald-500/30";
                                dotBg = "bg-emerald-950/15";
                                dotText = "text-emerald-400";
                              } else if (status === "incorrect") {
                                dotBorder = "border-rose-500/30";
                                dotBg = "bg-rose-950/15";
                                dotText = "text-rose-400";
                              }

                              return (
                                <button
                                  type="button"
                                  key={`sec-dot-${section.secao}-${questionNumber}`}
                                  onClick={() => {
                                    setGeneralStatsDialogOpen(false);
                                    setSelectedHistoryQuestion(questionNumber);
                                  }}
                                  className={cn(
                                    "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border transition-all cursor-pointer hover:scale-105 active:scale-95",
                                    dotBorder,
                                    dotBg,
                                    dotText
                                  )}
                                  title={`Questão ${questionNumber}: ${attemptsCount} tentativa(s) - Clique para ver histórico`}
                                >
                                  {questionNumber}
                                </button>
                              );
                            })}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic text-center py-6 border border-dashed border-slate-800 rounded-lg">
                    Esta aula não possui divisões por seção de teoria cadastradas.
                  </p>
                )}
              </section>
            </div>

            <div className="flex justify-end border-t border-slate-800 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setGeneralStatsDialogOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-5 py-2.5 rounded text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {isQuestionEditorOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-2xl shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <h3 className="text-xl font-serif italic text-slate-100 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-[#D4AF37]" />
                Configurar Questões da Aula
              </h3>
              <button
                onClick={() => setIsQuestionEditorOpen(false)}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent outline-none focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-sans font-semibold">
                    Número da Aula
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editorAulaNumber}
                    onChange={(e) => setEditorAulaNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3 py-2 rounded focus:outline-none focus:border-[#D4AF37] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-sans font-semibold">
                    Título das Questões (Assunto)
                  </label>
                  <input
                    type="text"
                    value={editorAulaTitle}
                    onChange={(e) => setEditorAulaTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3 py-2 rounded focus:outline-none focus:border-[#D4AF37] text-sm"
                    placeholder="ex: Direito Constitucional - Teoria Geral"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] mb-1.5 font-sans font-semibold flex items-center justify-between">
                  <span>Questões Principais</span>
                  <span className="text-slate-500 font-normal lowercase not-italic">Use vírgula ou intervalo (ex: 1-10, 15)</span>
                </label>
                <input
                  type="text"
                  value={editorPrincipais}
                  onChange={(e) => setEditorPrincipais(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3 py-2 rounded focus:outline-none focus:border-[#D4AF37] text-sm"
                  placeholder="ex: 1-5, 8, 12-20"
                />
                {editorPrincipais && (
                  <div className="mt-2 bg-slate-950/40 p-2.5 rounded border border-slate-850">
                    <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">Pré-visualização ({parseQuestionNumbers(editorPrincipais).length} questões):</div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {parseQuestionNumbers(editorPrincipais).map(n => (
                        <span key={n} className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300 font-mono font-bold">{n}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-sans font-semibold flex items-center justify-between">
                  <span>Questões Secundárias (Misturam com aulas futuras)</span>
                  <span className="text-slate-500 font-normal lowercase not-italic">opcional</span>
                </label>
                <input
                  type="text"
                  value={editorSecundarias}
                  onChange={(e) => setEditorSecundarias(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3 py-2 rounded focus:outline-none focus:border-[#D4AF37] text-sm"
                  placeholder="ex: 6, 7, 11"
                />
              </div>

              <div className="border-t border-slate-800 pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] font-sans font-semibold">
                    Divisão por Seção da Aula
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditorSections([...editorSections, { secao: "", questoes: "" }])}
                    className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] hover:text-[#C2A032] flex items-center gap-1.5 cursor-pointer bg-slate-800 border border-slate-700 hover:bg-slate-750 px-2.5 py-1 rounded border-none outline-none focus:outline-none shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Seção
                  </button>
                </div>

                {editorSections.length === 0 ? (
                  <div className="text-center py-4 bg-slate-950/20 border border-dashed border-slate-850 rounded-lg text-slate-500 text-xs italic">
                    Nenhuma seção configurada. As questões principais serão exibidas agrupadas.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {editorSections.map((sec, idx) => (
                      <div key={idx} className="flex gap-2 items-start bg-slate-950/30 p-3 rounded border border-slate-850 relative">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={sec.secao}
                            onChange={(e) => {
                              const newSecs = [...editorSections];
                              newSecs[idx].secao = e.target.value;
                              setEditorSections(newSecs);
                            }}
                            placeholder="Nome da Seção (ex: Teoria Geral)"
                            className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-2 py-1.5 rounded focus:outline-none focus:border-[#D4AF37] text-xs font-semibold"
                          />
                          <input
                            type="text"
                            value={sec.questoes}
                            onChange={(e) => {
                              const newSecs = [...editorSections];
                              newSecs[idx].questoes = e.target.value;
                              setEditorSections(newSecs);
                            }}
                            placeholder="Questões da Seção (ex: 1-5, 8)"
                            className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-2 py-1.5 rounded focus:outline-none focus:border-[#D4AF37] text-xs font-mono"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditorSections(editorSections.filter((_, sidx) => sidx !== idx));
                          }}
                          className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded transition-colors cursor-pointer border border-transparent hover:border-red-500/20 shrink-0 self-center"
                          title="Remover Seção"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-sans font-semibold">
                  Observações da Aula (opcional)
                </label>
                <textarea
                  value={editorObservacao}
                  onChange={(e) => setEditorObservacao(e.target.value)}
                  className="w-full h-20 bg-slate-950 border border-slate-800 text-slate-100 px-3 py-2 rounded focus:outline-none focus:border-[#D4AF37] text-sm resize-none"
                  placeholder="ex: Focar em jurisprudência do STF sobre esse assunto..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setIsQuestionEditorOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveQuestions}
                className="bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-5 py-2.5 rounded text-sm font-bold uppercase tracking-widest shadow-sm transition-colors cursor-pointer"
              >
                Salvar Questões
              </button>
            </div>
          </div>
        </div>
      )}

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
        {activeMobileDrawer === "outline" && (
          <TableOfContentsDrawer
            headings={headings}
            activeScrollSlug={activeScrollSlug}
            lastReadSlug={chapter.lastReadSlug}
            onUpdateLastReadSlug={(slug) => {
              updateChapter(book.id, chapter.id, { lastReadSlug: slug });
            }}
            onClose={() => setActiveMobileDrawer(null)}
          />
        )}

        {activeMobileDrawer === "comments" && (
          <CommentsDrawer
            comments={comments}
            activeCommentId={activeCommentId}
            setActiveCommentId={setActiveCommentId}
            onResolveComment={(id) => updateComment(id, { resolvedAt: new Date().toISOString() })}
            onReopenComment={(id) => updateComment(id, { resolvedAt: undefined })}
            onRemoveComment={removeComment}
            onClose={() => setActiveMobileDrawer(null)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Bottom Floating Toolbar */}
      {!isEditingContent && (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-full py-1.5 px-3 shadow-2xl flex items-center gap-2 min-w-[280px] glass">
          <button
            onClick={() => setActiveMobileDrawer(activeMobileDrawer === "outline" ? null : "outline")}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-1.5 px-3 rounded-full text-slate-400 hover:text-slate-200 transition-all duration-300 cursor-pointer",
              activeMobileDrawer === "outline" && "bg-[#D4AF37]/15 text-[#D4AF37] font-semibold"
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
            onClick={() => setActiveMobileDrawer(activeMobileDrawer === "comments" ? null : "comments")}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-1.5 px-3 rounded-full text-slate-400 hover:text-slate-200 transition-all duration-300 relative cursor-pointer",
              activeMobileDrawer === "comments" && "bg-blue-500/15 text-blue-400 font-semibold"
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
  isDifficult: boolean;
  onMarkCorrect: () => void;
  onMarkIncorrect: () => void;
  onClear: () => void;
  onToggleDifficult: () => void;
  onOpenHistory: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  size?: "sm" | "md";
}

const QuestionPill = React.memo(function QuestionPill({
  number,
  status,
  isDifficult,
  onMarkCorrect,
  onMarkIncorrect,
  onClear,
  onToggleDifficult,
  onOpenHistory,
  isExpanded,
  onToggleExpand,
  size = "md",
}: QuestionPillProps) {
  const [isHovered, setIsHovered] = useState(false);
  const showControls = isExpanded || isHovered;
  const isSm = size === "sm";

  // Set colors based on status
  let borderClass = "border-[#D4AF37]";
  let bgClass = "bg-[#D4AF37]";
  let textClass = "text-slate-950";
  let glowClass = "";

  if (status === "correct") {
    borderClass = "border-emerald-500/30";
    bgClass = "bg-emerald-500/10";
    textClass = "text-emerald-400";
    glowClass = "shadow-sm shadow-emerald-500/5";
  } else if (status === "incorrect") {
    borderClass = "border-rose-500/30";
    bgClass = "bg-rose-500/10";
    textClass = "text-rose-450";
    glowClass = "shadow-sm shadow-rose-500/5";
  }

  return (
    <motion.div
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "inline-flex items-center rounded-lg border font-bold transition-all relative select-none",
        isSm ? "h-6 text-[10px]" : "h-8 text-xs",
        borderClass,
        bgClass,
        textClass,
        glowClass,
        isDifficult && "ring-2 ring-amber-400/70 ring-offset-1 ring-offset-slate-950 shadow-md shadow-amber-500/15"
      )}
      title={isDifficult ? "Questão difícil: revisar com mais cuidado" : undefined}
    >
      {isDifficult && (
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-slate-950 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]" />
      )}

      {/* Question Number Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onToggleExpand();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleDifficult();
        }}
        className={cn(
          "h-full w-full flex items-center justify-center transition-colors cursor-pointer shrink-0 font-sans border-0 border-none bg-transparent outline-none focus:outline-none min-h-0 rounded-[inherit]",
          isSm ? "px-2 gap-1" : "px-3 gap-1.5",
          status === "pending" ? "hover:bg-black/10 active:bg-black/20" : "hover:bg-slate-800/40 active:bg-slate-800/60"
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

      {/* Control Actions - shown in a floating tooltip above the pill */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 4, scale: 0.95, x: "-50%" }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute bottom-full left-1/2 mb-2.5 bg-slate-900 border border-slate-850 rounded-lg shadow-2xl py-1 px-1.5 flex items-center gap-1 z-30",
              isSm ? "h-8" : "h-10"
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
                  "flex items-center justify-center text-emerald-500 hover:bg-emerald-500/20 active:scale-90 rounded transition-all cursor-pointer border-none bg-transparent outline-none focus:outline-none min-h-0",
                  isSm ? "w-6 h-6" : "w-8 h-8"
                )}
                title="Acertei!"
              >
                <Check className={isSm ? "w-3.5 h-3.5" : "w-4 h-4"} />
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
                  "flex items-center justify-center text-rose-400 hover:bg-rose-500/20 active:scale-90 rounded transition-all cursor-pointer border-none bg-transparent outline-none focus:outline-none min-h-0",
                  isSm ? "w-6 h-6" : "w-8 h-8"
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
                  "flex items-center justify-center text-slate-400 hover:bg-slate-800 active:scale-90 rounded transition-all cursor-pointer border-none bg-transparent outline-none focus:outline-none min-h-0",
                  isSm ? "w-6 h-6" : "w-8 h-8"
                )}
                title="Limpar marcação"
              >
                <RotateCcw className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenHistory();
              }}
              className={cn(
                "flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/20 active:scale-90 rounded transition-all cursor-pointer border-none bg-transparent outline-none focus:outline-none min-h-0",
                isSm ? "w-6 h-6" : "w-8 h-8"
              )}
              title="Ver histórico de tentativas"
            >
              <History className={isSm ? "w-3.5 h-3.5" : "w-4 h-4"} />
            </button>

            {/* Small arrow indicator */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
