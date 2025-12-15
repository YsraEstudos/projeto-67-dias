import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Circle, Plus, Trash2, Play, Pause, RotateCcw, 
  BookOpen, Calculator, Ruler, Wind, Clock, Coffee
} from 'lucide-react';
import { Task, Book } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- WORK TRACKER ---
export const WorkView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Revisar e-mails importantes', completed: false },
    { id: '2', text: 'Finalizar relatório mensal', completed: true },
    { id: '3', text: 'Reunião com a equipe de design', completed: false },
  ]);
  const [input, setInput] = useState('');

  const addTask = () => {
    if (!input.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: input, completed: false }]);
    setInput('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Adicionar nova tarefa..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
        />
        <button onClick={addTask} className="bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-lg transition-colors">
          <Plus />
        </button>
      </div>
      <div className="space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <button onClick={() => toggleTask(task.id)} className={task.completed ? 'text-green-500' : 'text-slate-500'}>
              {task.completed ? <CheckCircle2 /> : <Circle />}
            </button>
            <span className={`flex-1 ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
              {task.text}
            </span>
            <button onClick={() => setTasks(tasks.filter(t => t.id !== task.id))} className="text-slate-600 hover:text-red-400 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- SHORT REST PLANNER ---
export const RestView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(300); // 5 minutes default
  const [mode, setMode] = useState<'breath' | 'break'>('break');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(s => s - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => { setMode('break'); setSeconds(300); setIsActive(false); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${mode === 'break' ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-400'}`}
        >
          Pausa Curta (5m)
        </button>
        <button 
          onClick={() => { setMode('breath'); setSeconds(60); setIsActive(false); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${mode === 'breath' ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-400'}`}
        >
          Respiração (1m)
        </button>
      </div>

      <div className="relative mb-12">
        {/* Animated Ring */}
        {isActive && mode === 'breath' && (
           <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping scale-150"></div>
        )}
        <div className="w-64 h-64 rounded-full border-8 border-slate-700 flex items-center justify-center bg-slate-800/50 relative z-10">
          <span className="text-6xl font-bold text-teal-400 font-mono">{formatTime(seconds)}</span>
        </div>
      </div>

      <p className="text-slate-400 mb-8 min-h-[24px]">
        {mode === 'break' ? 'Levante-se, estique as pernas e beba água.' : isActive ? 'Inspire... Segure... Expire...' : 'Pronto para relaxar?'}
      </p>

      <div className="flex gap-6">
        <button onClick={() => setIsActive(!isActive)} className="bg-teal-600 hover:bg-teal-500 text-white p-4 rounded-full transition-all hover:scale-110">
          {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
        </button>
        <button onClick={() => { setIsActive(false); setSeconds(mode === 'break' ? 300 : 60); }} className="bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-full transition-all hover:scale-110">
          <RotateCcw size={32} />
        </button>
      </div>
    </div>
  );
};

// --- TOOLS ---
export const ToolsView: React.FC = () => {
  const [tool, setTool] = useState<'calc' | 'convert'>('calc');
  const [calcDisplay, setCalcDisplay] = useState('');
  
  // Conversion state
  const [convValue, setConvValue] = useState('');
  const [convResult, setConvResult] = useState<string | null>(null);

  const handleCalc = (val: string) => {
    if (val === 'C') setCalcDisplay('');
    else if (val === '=') {
      try {
        // eslint-disable-next-line no-eval
        setCalcDisplay(eval(calcDisplay).toString());
      } catch {
        setCalcDisplay('Erro');
      }
    } else {
      setCalcDisplay(prev => prev + val);
    }
  };

  const handleConvert = () => {
    const val = parseFloat(convValue);
    if (!isNaN(val)) {
      setConvResult(`${val} kg = ${(val * 2.20462).toFixed(2)} lbs`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Sidebar */}
      <div className="flex md:flex-col gap-2 md:w-48">
        <button 
          onClick={() => setTool('calc')} 
          className={`flex items-center gap-3 p-4 rounded-xl text-left transition-colors ${tool === 'calc' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <Calculator size={20} /> Calculadora
        </button>
        <button 
          onClick={() => setTool('convert')} 
          className={`flex items-center gap-3 p-4 rounded-xl text-left transition-colors ${tool === 'convert' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <Ruler size={20} /> Conversor
        </button>
      </div>

      {/* Content */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        {tool === 'calc' ? (
          <div className="w-full max-w-[280px] mx-auto">
            <div className="bg-slate-900 p-4 rounded-lg mb-4 text-right text-2xl font-mono min-h-[60px] overflow-x-auto">
              {calcDisplay || '0'}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'].map(btn => (
                <button 
                  key={btn}
                  onClick={() => handleCalc(btn)}
                  className={`p-4 rounded-lg font-bold text-lg transition-colors ${btn === '=' ? 'bg-indigo-600 hover:bg-indigo-500 text-white col-span-1' : btn === 'C' ? 'bg-red-900/50 text-red-200 hover:bg-red-900' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4 text-indigo-400">Conversor de Peso</h3>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-400">Kilogramas (kg)</label>
              <input 
                type="number" 
                value={convValue}
                onChange={e => setConvValue(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                placeholder="0"
              />
            </div>
            <button onClick={handleConvert} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg transition-colors">
              Converter para Libras
            </button>
            {convResult && (
              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg text-center text-lg font-medium text-indigo-300 border border-indigo-900/50">
                {convResult}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- READING LIST ---
export const ReadingView: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {[
      { title: "Hábitos Atômicos", author: "James Clear", progress: 45 },
      { title: "O Poder do Agora", author: "Eckhart Tolle", progress: 10 },
      { title: "Clean Code", author: "Robert Martin", progress: 80 }
    ].map((book, idx) => (
      <div key={idx} className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="p-3 bg-yellow-900/20 rounded-lg text-yellow-500">
            <BookOpen size={24} />
          </div>
          <span className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-400">{book.progress}%</span>
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-200">{book.title}</h3>
          <p className="text-sm text-slate-500">{book.author}</p>
        </div>
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-auto">
          <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${book.progress}%` }}></div>
        </div>
      </div>
    ))}
    <div className="border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center p-6 text-slate-500 hover:border-yellow-500/50 hover:text-yellow-500/50 cursor-pointer transition-colors">
      <Plus size={32} />
      <span className="mt-2 font-medium">Adicionar Livro</span>
    </div>
  </div>
);

// --- PROGRESS ---
export const ProgressView: React.FC = () => {
    const data = [
        { name: 'Sem 1', score: 65 },
        { name: 'Sem 2', score: 59 },
        { name: 'Sem 3', score: 80 },
        { name: 'Sem 4', score: 81 },
        { name: 'Sem 5', score: 76 },
        { name: 'Sem 6', score: 90 },
    ];

    return (
        <div className="h-full flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="text-slate-400 text-sm">Dias Completos</div>
                    <div className="text-3xl font-bold text-teal-400">43 <span className="text-lg text-slate-500">/ 67</span></div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="text-slate-400 text-sm">Consistência</div>
                    <div className="text-3xl font-bold text-teal-400">92%</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="text-slate-400 text-sm">Focus Score</div>
                    <div className="text-3xl font-bold text-teal-400">A+</div>
                </div>
            </div>
            <div className="flex-1 min-h-[300px] bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h3 className="text-lg font-semibold mb-6 text-slate-300">Desempenho Semanal</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} 
                            cursor={{fill: '#334155', opacity: 0.4}}
                        />
                        <Bar dataKey="score" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

// --- GENERIC PLACEHOLDER ---
export const PlaceholderView: React.FC<{ title: string, icon: any }> = ({ title, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
    <div className="p-6 bg-slate-800 rounded-full mb-6 opacity-50">
      <Icon size={64} />
    </div>
    <h2 className="text-2xl font-bold text-slate-300 mb-2">{title}</h2>
    <p>Funcionalidade em desenvolvimento.</p>
  </div>
);