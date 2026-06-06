import React, { useState, useEffect } from "react";
import { Play, RotateCcw, AlertTriangle } from "lucide-react";

interface CodeTerminalProps {
  initialCode: string;
  language: "js" | "javascript" | "html" | "css";
}

export default function CodeTerminal({ initialCode, language }: CodeTerminalProps) {
  const [code, setCode] = useState(initialCode);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [htmlSrc, setHtmlSrc] = useState<string | null>(null);

  const isWebCode = language === "html" || language === "css";

  useEffect(() => {
    setCode(initialCode);
    setLogs([]);
    setHtmlSrc(null);
  }, [initialCode]);

  const runJavaScript = () => {
    setIsRunning(true);
    setLogs([]);

    setTimeout(() => {
      const capturedLogs: string[] = [];
      const mockConsole = {
        log: (...args: any[]) => {
          capturedLogs.push(
            args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")
          );
        },
        error: (...args: any[]) => {
          capturedLogs.push(
            `❌ [Erro] ${args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")}`
          );
        },
        warn: (...args: any[]) => {
          capturedLogs.push(
            `⚠️ [Aviso] ${args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")}`
          );
        },
      };

      try {
        // Execute javascript code inside a self-invoking function block
        const execute = new Function("console", `
          try {
            ${code}
          } catch(e) {
            console.error(e.message || String(e));
          }
        `);
        execute(mockConsole);
      } catch (err: any) {
        capturedLogs.push(`❌ [Erro de Compilação] ${err.message || String(err)}`);
      }

      if (capturedLogs.length === 0) {
        capturedLogs.push("Código executado com sucesso (sem saídas de console).");
      }

      setLogs(capturedLogs);
      setIsRunning(false);
    }, 100);
  };

  const runHtmlCode = () => {
    setIsRunning(true);
    setLogs([]);

    // HTML/CSS full compilation document
    const isFullHtml = code.toLowerCase().includes("<html>");
    const iframeContent = isFullHtml
      ? code
      : `
        <!DOCTYPE html>
        <html lang="pt-br">
          <head>
            <meta charset="UTF-8">
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                color: #e2e8f0;
                background-color: #020617;
                padding: 1rem;
                margin: 0;
              }
            </style>
          </head>
          <body>
            ${code}
          </body>
        </html>
      `;

    setHtmlSrc(iframeContent);
    setIsRunning(false);
  };

  const handleRun = () => {
    if (isWebCode) {
      runHtmlCode();
    } else {
      runJavaScript();
    }
  };

  const handleReset = () => {
    setCode(initialCode);
    setLogs([]);
    setHtmlSrc(null);
  };

  return (
    <div className="not-prose my-6 border border-slate-800 rounded-lg overflow-hidden bg-slate-950 font-sans shadow-xl flex flex-col md:flex-row h-[420px]">
      {/* Editor Box */}
      <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 h-1/2 md:h-full">
        {/* Editor Title/Action bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">
            Editor Editor ({language.toUpperCase()})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Resetar código"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              Executar
            </button>
          </div>
        </div>

        {/* Text Area */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 w-full p-4 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50"
          spellCheck={false}
        />
      </div>

      {/* Output Box */}
      <div className="w-full md:w-[350px] bg-slate-950 flex flex-col h-1/2 md:h-full">
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-[10px] uppercase font-bold tracking-widest text-slate-400">
          Resultado / Output
        </div>

        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed bg-[#020617]">
          {isWebCode ? (
            htmlSrc ? (
              <iframe
                srcDoc={htmlSrc}
                title="Preview Executável"
                sandbox="allow-scripts"
                className="w-full h-full border-0 bg-[#020617] rounded"
              />
            ) : (
              <div className="text-slate-500 italic text-center pt-8">
                Clique em "Executar" para ver o resultado do HTML/CSS.
              </div>
            )
          ) : logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`whitespace-pre-wrap border-b border-slate-900 pb-1.5 ${
                    log.startsWith("❌")
                      ? "text-red-400"
                      : log.startsWith("⚠️")
                      ? "text-yellow-400"
                      : "text-slate-300"
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500 italic text-center pt-8">
              Clique em "Executar" para ver a saída do console.log().
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
