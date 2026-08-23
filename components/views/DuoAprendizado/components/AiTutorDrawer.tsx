import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { playDuoSound } from '../utils/soundEffects';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isLoading?: boolean;
}

interface AiTutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string | null;
}

export const AiTutorDrawer: React.FC<AiTutorDrawerProps> = ({
  isOpen,
  onClose,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      text: 'Olá! Sou o teu Mascote Tutor Inteligente de JavaScript! 🚀\n\nEstou aqui para tirar dúvidas, explicar erros de exercícios ou mostrar exemplos práticos de código. Como posso te ajudar agora?',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Handle external prompts (e.g. from "Por que errei?")
  useEffect(() => {
    if (initialPrompt && isOpen) {
      void handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  const generateSmartOfflineResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('var') && (q.includes('o que') || q.includes('diferen') || q.includes('let') || q.includes('const'))) {
      return `### O que é \`var\` e por que usamos \`let\` e \`const\`?

1. **\`var\`**: Possui escopo de **função** (ignora blocos \`if\` e \`for\`) e sofre **hoisting** (içamento com valor inicial \`undefined\`). Pode vazar variáveis para o objeto global (\`window\`).
2. **\`let\`**: Possui escopo de **bloco** (\`{}\`), não permite redeclaração no mesmo escopo e fica na Zona Morta Temporal (TDZ) até ser declarada.
3. **\`const\`**: Igual ao \`let\`, mas sua referência de memória é **imutável** (não pode ser reatribuída).

💡 **Regra prática moderna:** Use sempre **\`const\`** por padrão. Se precisar reatribuir o valor (como em um contador), use **\`let\`**. Evite **\`var\`** em códigos novos!`;
    }

    if (q.includes('closure') || q.includes('fechamento')) {
      return `### O que é uma Closure?

Uma **Closure** ocorre quando uma função "lembra" e continua acessando variáveis do seu **escopo léxico exterior**, mesmo depois que a função exterior já terminou sua execução!

\`\`\`javascript
function criarContador() {
  let contagem = 0; // Privada!
  return () => ++contagem;
}

const contador = criarContador();
console.log(contador()); // 1
console.log(contador()); // 2
\`\`\`

Isso permite criar **dados privados** e é a base de funcionamento dos hooks do React!`;
    }

    if (q.includes('===') || q.includes('==') || q.includes('igualdade')) {
      return `### \`==\` vs \`===\` em JavaScript

- **\`==\` (Igualdade Solta):** Realiza **coerção implícita de tipos**. Por exemplo: \`0 == false\` é \`true\` e \`"5" == 5\` é \`true\`.
- **\`===\` (Igualdade Estrita):** Não faz coerção. Exige que o **tipo e o valor** sejam rigorosamente iguais. \`0 === false\` é \`false\` e \`"5" === 5\` é \`false\`.

💡 **Boas práticas:** Use sempre **\`===\`** para evitar bugs imprevisíveis!`;
    }

    if (q.includes('promise') || q.includes('async') || q.includes('await') || q.includes('assíncrono')) {
      return `### Promises e Async / Await

Uma **Promise** é um objeto que representa uma operação futura que pode estar em 3 estados: *Pending*, *Fulfilled* (sucesso) ou *Rejected* (erro).

A sintaxe **\`async/await\`** é um jeito elegante de consumir Promises sem encadeamentos de \`.then()\`:

\`\`\`javascript
async function buscarPerfil(id) {
  try {
    const res = await fetch(\`/api/users/\${id}\`);
    const dados = await res.json();
    return dados;
  } catch (erro) {
    console.error("Erro na busca:", erro);
  }
}
\`\`\``;
    }

    if (q.includes('event loop') || q.includes('microtask') || q.includes('macrotask')) {
      return `### O Event Loop em poucas palavras

O JavaScript é single-threaded (executa uma instrução por vez na Call Stack). Quando ocorrem tarefas assíncronas:
1. Código síncrono roda imediatamente na **Call Stack**.
2. Promises resolvidas vão para a fila de **Microtasks** (prioridade máxima).
3. Timers (\`setTimeout\`) e I/O vão para a fila de **Macrotasks**.

O Event Loop esvazia todas as Microtasks antes de processar a próxima Macrotask!`;
    }

    return `Entendi sua dúvida sobre **"${query}"**! 💡

Em JavaScript, uma boa prática fundamental é manter as funções puras, usar desestruturação e sempre priorizar métodos declarativos (\`.map()\`, \`.filter()\`, \`.reduce()\`) em vez de mutações imperativas diretas.

Se desejar, você pode testar este conceito no nosso **Módulo de Teorias** clicando na aba acima!`;
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isBusy) return;

    const userMsgId = 'u_' + Date.now();
    const userMsg: Message = { id: userMsgId, role: 'user', text: textToSend.trim() };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsBusy(true);
    playDuoSound('click');

    const assistantMsgId = 'a_' + Date.now();
    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: 'assistant', text: 'Pensando na explicação didática...', isLoading: true },
    ]);

    // Simulação com resposta inteligente com timeout humanizado
    await new Promise((r) => setTimeout(r, 650));

    const reply = generateSmartOfflineResponse(textToSend);

    setMessages((prev) =>
      prev.map((m) => (m.id === assistantMsgId ? { ...m, text: reply, isLoading: false } : m))
    );

    playDuoSound('gem');
    setIsBusy(false);
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#131f31] border-l-2 border-slate-800 shadow-2xl flex flex-col transition-all duration-300 animate-slide-left select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#131f31] shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xl shadow-inner">
            <Bot size={22} />
          </div>
          <div>
            <h3 className="font-black text-sm text-white flex items-center gap-1.5">
              Mascote Tutor IA <Sparkles size={13} className="text-amber-400" />
            </h3>
            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Tutor Pedagógico Ativo
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            playDuoSound('click');
            onClose();
          }}
          className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 bg-[#0d1624] border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => handleSendMessage('O que é var e por que não devemos usar?')}
          className="text-[10px] font-bold whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
        >
          O que é var?
        </button>
        <button
          onClick={() => handleSendMessage('Como funciona uma Closure?')}
          className="text-[10px] font-bold whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
        >
          O que é Closure?
        </button>
        <button
          onClick={() => handleSendMessage('Qual a diferença entre == e ===?')}
          className="text-[10px] font-bold whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
        >
          == vs ===
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3.5 rounded-2xl leading-relaxed border ${
              msg.role === 'user'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-200 ml-6 shadow-sm'
                : 'bg-[#182436] border-slate-700/80 text-slate-200 mr-4 shadow-md'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold mb-1 text-[11px]">
              {msg.role === 'user' ? (
                <span className="text-amber-400">Você</span>
              ) : (
                <span className="text-indigo-400 flex items-center gap-1">
                  <Bot size={13} /> Tutor IA
                </span>
              )}
            </div>

            {msg.isLoading ? (
              <div className="flex items-center gap-2 text-slate-400 py-1">
                <Loader2 size={14} className="animate-spin text-indigo-400" />
                <span>{msg.text}</span>
              </div>
            ) : (
              <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-800 bg-[#0b1320] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSendMessage(inputText);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Pergunte ao tutor..."
            className="flex-1 bg-[#182232] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isBusy}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2.5 rounded-xl text-xs transition active:scale-95 shadow-md"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </aside>
  );
};
