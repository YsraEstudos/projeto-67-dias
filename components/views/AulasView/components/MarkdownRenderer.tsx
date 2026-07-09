import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Sparkles, Check, ClipboardCopy, ImagePlus, Eye, Trash2 } from "lucide-react";
import { extractTextFromReactNode, generateSlug, cn } from "../utils";
import { normalizeAulasMathMarkdown } from "../../../../utils/aulasMarkdown";
import CodeTerminal from "../CodeTerminal";

interface Token {
  type: string;
  value: string;
}

const tokenizeCSS = (code: string): Token[] => {
  const regex = /(\/\*[\s\S]*?\*\/)|(".*?"|'.*?')|(#(?:[0-9a-fA-F]{3,4}){1,2})\b|(\b\d+(?:\.\d+)?(?:px|em|rem|%|s|ms|deg)?\b)|(\b[\w-]+\b(?=\s*:))|(@[a-zA-Z-]+)|([{};:(),\.#])|(\b[\w-]+\b)|(\s+)|([^\s\w]+)/g;
  let match;
  const tokens: Token[] = [];
  regex.lastIndex = 0;
  while ((match = regex.exec(code)) !== null) {
    const [
      full,
      comment,
      string,
      hexColor,
      number,
      property,
      atRule,
      punctuation,
      word,
      whitespace,
      other
    ] = match;
    if (comment) tokens.push({ type: "comment", value: comment });
    else if (string) tokens.push({ type: "string", value: string });
    else if (hexColor) tokens.push({ type: "hex", value: hexColor });
    else if (number) tokens.push({ type: "number", value: number });
    else if (property) tokens.push({ type: "property", value: property });
    else if (atRule) tokens.push({ type: "at-rule", value: atRule });
    else if (punctuation) tokens.push({ type: "punctuation", value: punctuation });
    else if (word) tokens.push({ type: "word", value: word });
    else if (whitespace) tokens.push({ type: "whitespace", value: whitespace });
    else if (other) tokens.push({ type: "other", value: other });
  }
  return tokens;
};

const tokenizeHTML = (code: string): Token[] => {
  const regex = /(<!--[\s\S]*?-->)|(<[a-zA-Z0-9:-]+)|(<\/?[a-zA-Z0-9:-]+>)|(\b[a-zA-Z0-9:-]+(?=\s*=))|(".*?"|'.*?')|([=/<>!?-]+)|(\s+)|([^<\s]+)/g;
  let match;
  const tokens: Token[] = [];
  regex.lastIndex = 0;
  while ((match = regex.exec(code)) !== null) {
    const [
      full,
      comment,
      tagStart,
      tagClose,
      attribute,
      string,
      punctuation,
      whitespace,
      text
    ] = match;
    if (comment) tokens.push({ type: "comment", value: comment });
    else if (tagStart) tokens.push({ type: "tag-name", value: tagStart });
    else if (tagClose) tokens.push({ type: "tag-close", value: tagClose });
    else if (attribute) tokens.push({ type: "attribute", value: attribute });
    else if (string) tokens.push({ type: "string", value: string });
    else if (punctuation) tokens.push({ type: "punctuation", value: punctuation });
    else if (whitespace) tokens.push({ type: "whitespace", value: whitespace });
    else if (text) tokens.push({ type: "text", value: text });
  }
  return tokens;
};

const tokenizeJS = (code: string): Token[] => {
  const keywords = /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|import|export|from|default|as|try|catch|finally|throw|async|await|typeof|instanceof|in|of|this|super|true|false|null|undefined)\b/;
  const regex = /(\/\/.*)|(\/\*[\s\S]*?\*\/)|(".*?"|'.*?'|`[\s\S]*?`)|(\b\d+(?:\.\d+)?\b)|([{}()\[\];:,\.])|(\b[a-zA-Z_]\w*(?=\s*\())|(\b[a-zA-Z_]\w*\b)|(\s+)|([^\s\w]+)/g;
  let match;
  const tokens: Token[] = [];
  regex.lastIndex = 0;
  while ((match = regex.exec(code)) !== null) {
    const [
      full,
      lineComment,
      blockComment,
      string,
      number,
      punctuation,
      functionCall,
      word,
      whitespace,
      other
    ] = match;
    if (lineComment) tokens.push({ type: "comment", value: lineComment });
    else if (blockComment) tokens.push({ type: "comment", value: blockComment });
    else if (string) tokens.push({ type: "string", value: string });
    else if (number) tokens.push({ type: "number", value: number });
    else if (punctuation) tokens.push({ type: "punctuation", value: punctuation });
    else if (functionCall) tokens.push({ type: "function", value: functionCall });
    else if (word) {
      if (keywords.test(word)) {
        tokens.push({ type: "keyword", value: word });
      } else {
        tokens.push({ type: "word", value: word });
      }
    }
    else if (whitespace) tokens.push({ type: "whitespace", value: whitespace });
    else if (other) tokens.push({ type: "operator", value: other });
  }
  return tokens;
};

const HighlightedCode: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const tokens = React.useMemo(() => {
    const lang = (language || "").toLowerCase();
    if (lang === "css") {
      return tokenizeCSS(code);
    } else if (lang === "html" || lang === "xml") {
      return tokenizeHTML(code);
    } else if (lang === "javascript" || lang === "js" || lang === "typescript" || lang === "ts" || lang === "json") {
      return tokenizeJS(code);
    } else {
      return [{ type: "text", value: code }];
    }
  }, [code, language]);

  let inBraces = false;

  return (
    <>
      {tokens.map((token, index) => {
        let className = "text-slate-200";
        if (token.type === "comment") className = "text-slate-500 italic";
        else if (token.type === "string") className = "text-emerald-400 font-medium";
        else if (token.type === "hex") className = "text-amber-400 font-mono";
        else if (token.type === "number") className = "text-amber-400 font-mono";
        else if (token.type === "property") className = "text-cyan-400 font-semibold";
        else if (token.type === "at-rule") className = "text-pink-400 font-bold";
        else if (token.type === "punctuation") {
          className = "text-slate-400";
          if (token.value === "{") inBraces = true;
          if (token.value === "}") inBraces = false;
        }
        else if (token.type === "keyword") className = "text-pink-400 font-bold";
        else if (token.type === "function") className = "text-blue-400 font-semibold";
        else if (token.type === "tag-name") className = "text-pink-400 font-semibold";
        else if (token.type === "tag-close") className = "text-pink-400 font-semibold";
        else if (token.type === "attribute") className = "text-cyan-400";
        else if (token.type === "operator") className = "text-slate-400";
        else if (token.type === "word") {
          if ((language || "").toLowerCase() === "css") {
            className = inBraces ? "text-emerald-300" : "text-[#F3D76F] font-semibold";
          } else {
            className = "text-slate-200";
          }
        }

        return (
          <span key={index} className={className}>
            {token.value}
          </span>
        );
      })}
    </>
  );
};

const CodeBlock: React.FC<any> = ({ className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const codeString = String(children).replace(/\n$/, "");
  const [copied, setCopied] = React.useState(false);
  const [showTerminal, setShowTerminal] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isInline = !className || !className.includes("language-");

  if (isInline) {
    return (
      <code className="bg-slate-900/90 border border-slate-800/80 text-amber-300 px-1.5 py-0.5 rounded font-mono text-xs md:text-sm break-all" {...props}>
        {children}
      </code>
    );
  }

  const isRunnable = language === "js" || language === "javascript" || language === "html" || language === "css";
  const langLabel = language.toUpperCase();

  return (
    <div className="not-prose my-6 rounded-lg border border-slate-800 overflow-hidden shadow-lg bg-slate-950/60 backdrop-blur-md w-full">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-850">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] font-sans">
          {langLabel || "código"}
        </span>
        <div className="flex items-center gap-3">
          {isRunnable && (
            <button
              onClick={() => setShowTerminal(!showTerminal)}
              className={cn(
                "transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider font-sans cursor-pointer focus:outline-none",
                showTerminal ? "text-[#D4AF37]" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{showTerminal ? "Fechar Sandbox" : "Executar Sandbox"}</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider font-sans cursor-pointer focus:outline-none"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <ClipboardCopy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono bg-slate-950 text-slate-100 select-text">
        <code className="block select-text">
          <HighlightedCode code={codeString} language={language} />
        </code>
      </pre>
      {showTerminal && (
        <div className="border-t border-slate-800 bg-slate-950">
          <CodeTerminal 
            language={language === "javascript" ? "js" : (language as any)} 
            initialCode={codeString} 
          />
        </div>
      )}
    </div>
  );
};

interface MarkdownRendererProps {
  content: string;
  attachments: Record<string, string>;
  editMode: boolean;
  onHeadingClick: (slug: string) => void;
  onHeadingDoubleClick: (slug: string) => void;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
  onRemoveAttachment?: (slug: string) => void;
  onViewAttachment?: (imgBase64: string) => void;
}

export function MarkdownRenderer({
  content,
  attachments,
  editMode,
  onHeadingClick,
  onHeadingDoubleClick,
  onClick,
  children,
  onRemoveAttachment,
  onViewAttachment,
}: MarkdownRendererProps) {
  const markdownComponents = React.useMemo(() => {
    const createHeadingRenderer = (Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") => ({
      node,
      children: headingChildren,
      ...props
    }: any) => {
      const text = extractTextFromReactNode(headingChildren);
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
          onClick={() => onHeadingClick(slug)}
          onDoubleClick={(e: React.MouseEvent) => {
            e.preventDefault();
            onHeadingDoubleClick(slug);
          }}
          className={cn(
            "not-prose relative group block w-full cursor-pointer transition-colors font-serif rounded-r scroll-mt-[120px] sm:scroll-mt-[136px]",
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
            <span className="flex-1">{headingChildren}</span>
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
      code: CodeBlock,
      pre: ({ children: preChildren }: any) => <>{preChildren}</>,
    };
  }, [attachments, editMode, onHeadingClick, onHeadingDoubleClick]);

  return (
    <div
      onClick={onClick}
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

      {children}

      {!content ? (
        <div className="text-slate-500 italic font-serif">
          Nenhum conteúdo. Clique em "Editar MD" para adicionar o texto desta aula.
        </div>
      ) : (
        <Markdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeKatex]}
          components={markdownComponents}
        >
          {normalizeAulasMathMarkdown(content)}
        </Markdown>
      )}

      {editMode && Object.keys(attachments).length > 0 && (
        <div className="mt-16 pt-8 border-t border-slate-900 not-prose">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-6 font-sans">
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
                    {onViewAttachment && (
                      <button
                        onClick={() => onViewAttachment(imgBase64)}
                        className="bg-slate-900 border border-slate-800 p-2 rounded text-slate-200 hover:bg-slate-800 cursor-pointer"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {onRemoveAttachment && (
                      <button
                        onClick={() => onRemoveAttachment(slug)}
                        className="bg-red-500/20 border border-red-500/30 p-2 rounded text-red-400 hover:bg-red-500/40 cursor-pointer"
                        title="Apagar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
