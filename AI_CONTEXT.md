# 🤖 AI Developer Guide & Context

Este documento serve como a **"memória central"** e guia de regras para Agentes de IA que farão manutenção ou adicionarão novas funcionalidades ao **Projeto 67 Dias**.

---

## 📋 Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Arquitetura e Roteamento](#2-arquitetura-e-roteamento)
3. [Regras de Estilização](#3-regras-de-estilização-tailwind-css)
4. [Estrutura de Arquivos](#4-estrutura-de-arquivos-detalhada)
5. [Tipos e Interfaces](#5-tipos-e-interfaces-typests)
6. [Hooks Customizados](#6-hooks-customizados)
7. [Serviços e Integrações](#7-serviços-e-integrações)
8. [Padrões de Código por Módulo](#8-padrões-de-código-por-módulo)
9. [Integração com Gemini AI](#9-integração-com-gemini-ai)
10. [Configuração de Ambiente](#10-configuração-de-variáveis-de-ambiente)
11. [Testes](#11-testes)
12. [Deploy e Produção](#12-deploy-e-produção)
13. [Checklist para Nova Funcionalidade](#13-checklist-para-nova-funcionalidade)
14. [Armadilhas Comuns](#14-armadilhas-comuns-e-como-evitar)
15. [Referências Úteis](#15-referências-úteis)

---

## 1. Visão Geral do Projeto

O **Projeto 67 Dias** é um dashboard de produtividade pessoal com foco em:
- 📊 Rastreamento de metas e hábitos
- 📚 Gerenciamento de leitura
- 🎯 Skills e aprendizado com roadmaps IA
- 📝 Diário pessoal com insights IA
- ⏱️ Timer e ferramentas de produtividade
- 🔗 Central de links e prompts

### Stack Tecnológico

| Categoria | Tecnologia | Versão |
|-----------|------------|--------|
| Frontend | React | ^19.2.0 |
| Bundler | Vite | ^6.2.0 |
| Estilização | Tailwind CSS | via CDN (dev) |
| Ícones | lucide-react | ^0.554.0 |
| Gráficos | Recharts | ^3.4.1 |
| Autenticação | Firebase Auth | ^12.6.0 |
| Banco de Dados | Firebase Firestore | ^12.6.0 |
| IA Generativa | Google Gemini | @google/genai ^1.30.0 |
| Testes | Vitest + RTL | ^4.0.13 |
| Tipagem | TypeScript | ~5.8.2 |

---

## 2. Arquitetura e Roteamento

### Roteamento Baseado em Estado (SEM react-router)

```typescript
// App.tsx - Controle de navegação
const [activeView, setActiveView] = useState<ViewState>(ViewState.DASHBOARD);

// Switch que renderiza a view ativa
switch (activeView) {
  case ViewState.WORK: return <WorkView />;
  case ViewState.REST: return <RestView />;
  // ...
}
```

### ViewState Enum (types.ts)

```typescript
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  WORK = 'WORK',
  SUNDAY = 'SUNDAY',
  LINKS = 'LINKS',
  READING = 'READING',
  SKILLS = 'SKILLS',
  HABITS = 'HABITS',
  JOURNAL = 'JOURNAL',
  PROGRESS = 'PROGRESS',
  REST = 'REST',
  TOOLS = 'TOOLS',
  SETTINGS = 'SETTINGS',
}
```

### Lazy Loading (Obrigatório)

**TODAS** as views devem usar lazy loading:

```typescript
// ✅ CORRETO
const WorkView = React.lazy(() => import('./components/views/WorkView'));

// ❌ ERRADO - import direto
import WorkView from './components/views/WorkView';
```

---

## 3. Regras de Estilização (Tailwind CSS)

### Paleta de Cores Padrão (Dark Theme)

| Elemento | Classe Tailwind |
|----------|-----------------|
| Background App | `bg-slate-950` |
| Cards/Containers | `bg-slate-800` ou `bg-slate-800/50` |
| Cards Hover | `hover:bg-slate-750` ou `hover:bg-slate-700` |
| Bordas | `border-slate-700` ou `border-slate-700/50` |
| Texto Principal | `text-slate-200` |
| Texto Secundário | `text-slate-400` |
| Texto Desativado | `text-slate-500` ou `text-slate-600` |
| Input Background | `bg-slate-900` |

### Cores por Módulo

| Módulo | Cor Primária | Uso |
|--------|--------------|-----|
| Work | `orange-500` | Progresso, botões primários |
| Rest | `cyan-500` | Timer, ações |
| Skills | `emerald-400` | Cards, progresso |
| Habits | `indigo-600` | Tabs, botões |
| Journal | `purple-500` | Mood, insights IA |
| Links | `indigo-400` | Cards, ações |
| Sunday | `pink-500` | Timer, progresso |
| Settings | `cyan-500` | Tabs |
| Notes | `purple-500` | Cards, editor |

### Padrões de Componentes

```tsx
// Card padrão
<div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">

// Botão primário
<button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl 
  flex items-center gap-2 shadow-lg shadow-emerald-900/20 font-medium transition-all hover:scale-105">

// Input padrão
<input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 
  text-white focus:border-emerald-500 outline-none" />

// Tag/Badge
<span className="text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider uppercase
  bg-emerald-500/10 text-emerald-400 border-emerald-500/20">

// Modal overlay
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
```

### Animações Padrão

```tsx
// Entrada de componente
className="animate-in fade-in duration-500"

// Slide de baixo
className="animate-in slide-in-from-bottom-4 duration-500"

// Slide lateral
className="animate-in slide-in-from-right-4 duration-500"

// Hover com scale
className="hover:scale-105 transition-all"

// Hover de cards
className="hover:-translate-y-1 hover:shadow-xl transition-all"
```

---

## 4. Estrutura de Arquivos Detalhada

```
projeto-67-dias/
├── index.html              # Entry point HTML
├── index.tsx               # Entry point React
├── App.tsx                 # Componente principal + roteamento
├── types.ts                # Todas as interfaces e enums
├── vite.config.ts          # Configuração do Vite
├── vitest.config.ts        # Configuração de testes
├── firestore.rules         # Regras de segurança Firestore
│
├── components/
│   ├── Card.tsx            # Card do dashboard
│   ├── MicroViews.tsx      # Componentes menores reutilizáveis
│   ├── TimerWidget.tsx     # Widget flutuante de timer
│   │
│   ├── views/              # Cada "página" do app
│   │   ├── AuthView.tsx    # Login/Registro
│   │   ├── WorkView.tsx    # Gerenciador de trabalho + Met Target
│   │   ├── RestView.tsx    # Planejador de descansos + Timer
│   │   ├── ToolsView.tsx   # Calculadora, Timer, Conversores
│   │   ├── ReadingView.tsx # Biblioteca de livros
│   │   ├── ProgressView.tsx# Gráficos (Recharts)
│   │   ├── HabitsView.tsx  # Hábitos + Tarefas com IA
│   │   ├── JournalView.tsx # Diário pessoal com IA
│   │   ├── SkillsView.tsx  # Skill Tree principal
│   │   ├── SettingsView.tsx# Configurações + Notas
│   │   ├── LinksView.tsx   # Links + Prompts (tabs)
│   │   └── SundayView.tsx  # Organização dominical
│   │
│   ├── skills/             # Subcomponentes de Skills
│   │   ├── SkillCard.tsx
│   │   ├── SkillDetailView.tsx
│   │   ├── CreateSkillModal.tsx
│   │   ├── AIRoadmapModal.tsx
│   │   ├── ImportExportModal.tsx
│   │   └── constants.ts
│   │
│   ├── notes/              # Sistema de Notas
│   │   ├── NotesTab.tsx    # Tab principal
│   │   ├── NoteCard.tsx
│   │   ├── NoteEditor.tsx
│   │   └── TagFilter.tsx
│   │
│   ├── prompts/            # Sistema de Prompts
│   │   └── PromptsTab.tsx
│   │
│   └── shared/             # Componentes compartilhados
│       ├── Loading.tsx
│       └── PlaceholderView.tsx
│
├── hooks/
│   ├── useAuth.ts          # Autenticação Firebase
│   ├── useStorage.ts       # LocalStorage + Firestore híbrido
│   ├── useLocalStorage.ts  # LocalStorage puro (legacy)
│   └── useFirebaseStorage.ts
│
├── services/
│   ├── firebase.ts         # Inicialização + funções de auth
│   └── gemini.ts           # Cliente Gemini AI
│
├── tests/
│   ├── setup.ts
│   ├── App.test.tsx
│   ├── components/
│   └── services/
│
└── public/
    └── _redirects          # Netlify SPA redirects
```

---

## 5. Tipos e Interfaces (types.ts)

### Principais Interfaces

```typescript
// Usuário autenticado
interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isGuest: boolean;
}

// Configuração do projeto
interface ProjectConfig {
  startDate: string;  // ISO Date - usado para calcular "Dia X de 67"
  userName: string;
  isGuest: boolean;
}

// Tarefas organizacionais (HabitsView - tab TASKS)
interface OrganizeTask {
  id: string;
  title: string;
  isCompleted: boolean;
  isArchived: boolean;    // Auto-archive ao completar
  category: string;
  dueDate?: string;       // ISO Date
  reminderDate?: string;  // ISO Date - aparece no dashboard
  createdAt: number;
}

// Hábitos com histórico (HabitsView - tab HABITS)
interface Habit {
  id: string;
  title: string;
  category: string;
  subHabits: SubHabit[];          // Passos para completar
  history: Record<string, HabitLog>; // Chave = data ISO (YYYY-MM-DD)
  createdAt: number;
  archived: boolean;
}

interface SubHabit {
  id: string;
  title: string;
}

interface HabitLog {
  completed: boolean;
  subHabitsCompleted: string[]; // IDs dos sub-hábitos feitos
}

// Skill Tree
interface Skill {
  id: string;
  name: string;
  description?: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  currentMinutes: number;
  goalMinutes: number;
  resources: SkillResource[];
  roadmap: SkillRoadmapItem[];
  logs: SkillLog[];
  colorTheme: string;
  createdAt: number;
}

interface SkillResource {
  id: string;
  title: string;
  url: string;
  type: 'VIDEO' | 'ARTICLE' | 'DOC' | 'OTHER';
}

// Roadmap item (Skill)
interface SkillRoadmapItem {
  id: string;
  title: string;
  isCompleted: boolean;
  type?: 'TASK' | 'SECTION'; // SECTION = divisória visual
}

interface SkillLog {
  id: string;
  date: string;
  minutes: number;
  notes?: string;
}

// Entrada de diário
interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: 'HAPPY' | 'NEUTRAL' | 'SAD' | 'STRESSED' | 'ENERGETIC';
  aiAnalysis?: {
    sentiment: string;
    advice: string;
    quote: string;
  };
  updatedAt: number;
}

// Atividade de descanso (RestView)
interface RestActivity {
  id: string;
  title: string;
  isCompleted: boolean;
  type: 'DAILY' | 'WEEKLY' | 'ONCE';
  daysOfWeek?: number[]; // 0-6 para WEEKLY (0 = domingo)
  specificDate?: string; // para ONCE
  order: number;         // Drag and drop
}

// Links salvos
interface LinkItem {
  id: string;
  title: string;
  url: string;
  category: 'PERSONAL' | 'GENERAL';
  clickCount: number;
  lastClicked?: number;
  order: number;
}

// Notas coloridas (SettingsView > NotesTab)
type NoteColor = 'amber' | 'rose' | 'emerald' | 'blue' | 'purple' | 'cyan' | 'pink' | 'orange';

interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  aiProcessed?: boolean;
  aiSummary?: string;
}

// Sunday Reset (SundayView)
interface SundayTask {
  id: string;
  title: string;
  subTasks: SundaySubTask[];
  isArchived: boolean;
  createdAt: number;
}

interface SundaySubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

// Prompts salvos (LinksView > PromptsTab)
interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  images: PromptImage[];
  copyCount: number;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

// Timer global (ToolsView)
interface GlobalTimerState {
  mode: 'STOPWATCH' | 'TIMER';
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'FINISHED';
  startTime: number | null;
  endTime: number | null;
  accumulated: number;
  totalDuration: number;
  label?: string;
}
```

---

## 6. Hooks Customizados

### useAuth (`hooks/useAuth.ts`)

```typescript
const {
  user,           // User | null
  loading,        // boolean
  error,          // string | null
  login,          // (email, password) => Promise<void>
  register,       // (name, email, password) => Promise<void>
  loginGoogle,    // () => Promise<void>
  loginGuest,     // () => Promise<void>
  logout,         // () => Promise<void>
  sendResetEmail, // (email) => Promise<void>
  clearError      // () => void
} = useAuth();
```

**Características:**
- Converte `FirebaseUser` para `User` do app
- Traduz códigos de erro Firebase para português
- Usa `loginInProgress` ref para evitar flash de login screen
- Erros traduzidos incluem guia de solução

### useStorage (`hooks/useStorage.ts`)

```typescript
const [value, setValue] = useStorage<T>(key: string, initialValue: T);
```

**Comportamento Híbrido:**
1. **Sempre** salva no localStorage (funciona offline)
2. **Se autenticado**, sincroniza com Firestore (realtime listener)
3. **Debounce de 2s** para evitar writes excessivos no Firebase
4. **Namespace por usuário**: Dados separados por `${userId}::${key}`

**Funções auxiliares exportadas:**
```typescript
// Ler diretamente (sem hook, para cálculos pontuais)
readNamespacedStorage(key: string, userId?: string | null): string | null

// Escrever diretamente
writeNamespacedStorage(key: string, value: string, userId?: string | null): void

// Remover
removeNamespacedStorage(key: string, userId?: string | null): void

// Gerar chave com namespace
getStorageKeyForUser(key: string, userId?: string | null): string
```

---

## 7. Serviços e Integrações

### Firebase (`services/firebase.ts`)

```typescript
// Exports principais
export const auth: Auth;
export const db: Firestore;

// Funções de autenticação
export const loginWithEmail: (email, password) => Promise<UserCredential>;
export const registerWithEmail: (email, password, name) => Promise<UserCredential>;
export const loginWithGoogle: () => Promise<UserCredential>;
export const loginAsGuest: () => Promise<UserCredential>;
export const logout: () => Promise<void>;
export const resetPassword: (email) => Promise<void>;
export const subscribeToAuthChanges: (callback) => Unsubscribe;
```

### Estrutura Firestore

```
users/
  {userId}/
    data/
      {storageKey}/       # Ex: p67_skills, p67_habits
        value: T          # Objeto serializado
        updatedAt: string # ISO timestamp
    modules/
      work/               # Dados específicos de WorkView
        goal: number
        currentCount: number
        startTime: string
        endTime: string
        breakTime: string
        preBreakCount: number
        paceMode: string
        lastUpdated: string
```

### Gemini API (`services/gemini.ts`)

```typescript
import { getGeminiModel } from '@/services/gemini';

// Uso
const models = getGeminiModel();
const response = await models.generateContent({
  model: "gemini-2.5-flash",
  contents: "Sua mensagem aqui",
  config: {
    responseMimeType: "application/json",
    responseSchema: { /* schema do retorno */ }
  }
});

const data = JSON.parse(response.text);
```

**Fallback:** Lança erro claro se API key não configurada.

---

## 8. Padrões de Código por Módulo

### WorkView - Gerenciador de Trabalho

**Features:**
- Contador de itens com meta diária
- Análise de break (pré/pós almoço)
- Calculadora de pace (10min/25min)
- Modal "Bati a Meta" com timer + histórico semanal (Anki + NCM)

**Storage Keys:**
- `workview_data` - Configurações e contagem atual
- `p67_work_met_target_history` - Sessões extras salvas

**Hook interno:**
```typescript
const useWorkMetrics = (input: WorkMetricsInput) => {
  // Atualiza a cada 1 minuto
  // Retorna: status, minutesRemaining, progressPercent, requiredPacePerHour, etc.
};

const useWorkDataPersistence = () => {
  // Carrega do localStorage + Firebase
  // Salva com debounce
};
```

### RestView - Planejador de Descansos

**Features:**
- Lista de atividades por tipo (DAILY/WEEKLY/ONCE)
- Planejador "Próximas 2 Horas" com 4 slots
- Drag and drop para reordenar
- IA para gerar rotinas de exercícios
- Navegador de datas

**Storage Keys:**
- `p67_rest_activities`
- `p67_rest_next_2h` (IDs dos 4 slots)

**Modais:**
- `NextTwoHoursModal` - Seleção de atividades para os próximos 2h
- `AIRestAssistantModal` - Geração de exercícios com Gemini

### HabitsView - Hábitos e Tarefas

**Features:**
- Duas tabs: TASKS (tarefas) e HABITS (hábitos)
- Tarefas: categorias, datas, lembretes, auto-archive
- Hábitos: sub-hábitos, histórico por data
- IA para planejar tarefas automaticamente (Gemini)

**Storage Keys:**
- `p67_tasks` - Tarefas organizacionais
- `p67_habits` - Hábitos com histórico

**Modais:**
- `TaskModal` - Criar/editar tarefa
- `HabitModal` - Criar hábito com sub-hábitos
- `AITaskAssistantModal` - Planejamento com IA

### SkillsView - Skill Tree

**Features:**
- Cards de skills com progresso de tempo (minutos → horas)
- Detail view com roadmap interativo
- Drag and drop no roadmap
- Seções/divisórias no roadmap
- IA para gerar passos do roadmap
- Import/Export de roadmaps (Markdown/JSON)
- Cofre de recursos (links de estudo)

**Storage Key:** `p67_skills`

**Subcomponentes:**
- `SkillCard.tsx` - Card resumido com quick-add de minutos
- `SkillDetailView.tsx` - View completa
- `AIRoadmapModal.tsx` - Geração de roadmap com Gemini
- `ImportExportModal.tsx` - Markdown/JSON
- `CreateSkillModal.tsx` - Criar nova skill

### JournalView - Diário Pessoal

**Features:**
- Lista de entradas na sidebar esquerda
- Editor de texto livre
- Seletor de mood (5 opções com emoji)
- IA para insight estoico + citação filosófica

**Storage Key:** `p67_journal`

**Schema do Gemini:**
```typescript
responseSchema: {
  type: Type.OBJECT,
  properties: {
    sentiment: { type: Type.STRING },  // Tag de emoção em PT
    advice: { type: Type.STRING },     // Conselho estoico
    quote: { type: Type.STRING },      // Citação de filósofo
  }
}
```

### LinksView - Central de Links

**Features:**
- Main tabs: Links e Prompts (lazy loaded)
- Sub-tabs: PERSONAL e GENERAL
- Favicon automático via Google
- Drag and drop para reordenar
- Contador de cliques

**Storage Key:** `p67_links`

**Lazy loading interno:**
```typescript
const PromptsTab = React.lazy(() => import('../prompts/PromptsTab'));
```

### SundayView - Organização Dominical

**Features:**
- Timer de sessão (2.5 horas)
- Tarefas com subtarefas
- Progress bar por tarefa
- Arquivamento de tarefas completas

**Storage Key:** `p67_sunday_tasks`

### SettingsView - Configurações

**Features:**
- Export/Import de backup completo (JSON)
- Reset seletivo do projeto (manter livros, skills, links)
- Tab de Notas com filtro por tags

**Backup Keys utilizados:**
```typescript
const BACKUP_KEYS = [
  'p67_project_config', 'p67_tasks', 'p67_journal',
  'p67_skills', 'p67_links', 'p67_books', 'p67_folders',
  'p67_habits', 'p67_notes', 'p67_prompts', 'p67_prompt_categories',
  'p67_sunday_tasks', 'p67_rest_activities', 'p67_rest_next_2h',
  'p67_tool_timer', 'p67_work_met_target_history'
];
```

### NotesTab - Sistema de Notas

**Features:**
- Grid de notas coloridas
- Tags e filtros
- Ordenação (recentes, alfabética, por cor)
- Editor em modal

**Storage Key:** `p67_notes`

---

## 9. Integração com Gemini AI

### Modelo Utilizado

```typescript
model: "gemini-2.5-flash"
```

### Padrão de Chamada com JSON Schema

```typescript
import { Type } from "@google/genai";
import { getGeminiModel } from '@/services/gemini';

const handleGenerate = async () => {
  setIsLoading(true);
  try {
    const models = getGeminiModel();
    const response = await models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Instrução detalhada em português...
      
      Regras:
      1. Retorne apenas JSON
      2. Use português brasileiro
      3. Seja conciso`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    if (response.text) {
      const data = JSON.parse(response.text);
      // Usar data.items
    }
  } catch (error) {
    console.error(error);
    // Mostrar mensagem amigável ao usuário
  } finally {
    setIsLoading(false);
  }
};
```

### Casos de Uso de IA no Projeto

| Módulo | Funcionalidade | Entrada | Saída |
|--------|----------------|---------|-------|
| HabitsView | Planejador de tarefas | Descrição do projeto | `{tasks: [{title, category, daysFromNow}]}` |
| RestView | Gerador de rotinas | Exercício/rotina | `{items: string[]}` |
| JournalView | Insight estoico | Entrada + mood | `{sentiment, advice, quote}` |
| SkillsView | Roadmap de aprendizado | Nome da skill + nível | `{items: string[]}` |

### UX de Chamadas de IA

1. **Loading state** durante a chamada
2. **Preview** dos resultados antes de aplicar
3. **Botão de confirmar** para adicionar ao app
4. **Try/catch** com mensagem amigável de erro

---

## 10. Configuração de Variáveis de Ambiente

### ⚠️ CRÍTICO: Regras do Vite

1. **Prefixo obrigatório**: Só variáveis com `VITE_` são expostas ao cliente
2. **Acesso**: `import.meta.env.VITE_*` (NÃO usar `process.env`)
3. **Produção**: Variáveis definidas na seção `define` do `vite.config.ts`

### Arquivo `.env.local` (NÃO comitar)

```dotenv
# Firebase Configuration
VITE_FIREBASE_API_KEY=sua-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Gemini API
VITE_GEMINI_API_KEY=sua-gemini-api-key
```

### vite.config.ts (seção crítica)

```typescript
define: {
  'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
  'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
  'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
  'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
  'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
  'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID),
  'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID),
}
```

**❌ NÃO modifique** a seção `define` sem entender que ela é essencial para o build de produção no Netlify.

---

## 11. Testes

### Configuração (Vitest)

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
});
```

### Executar Testes

```bash
npm test              # Roda todos
npm test -- --watch   # Modo watch
npm test -- -u        # Atualiza snapshots
npm test WorkView     # Roda específico
```

### Mock de Serviços

```typescript
// Mock Firebase
vi.mock('@/services/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  loginWithEmail: vi.fn(),
  subscribeToAuthChanges: vi.fn((callback) => {
    callback(null);
    return () => {};
  }),
}));

// Mock Gemini
vi.mock('@/services/gemini', () => ({
  getGeminiModel: () => ({
    generateContent: vi.fn().mockResolvedValue({
      text: JSON.stringify({ items: ['item1', 'item2'] })
    })
  })
}));

// Stub de variáveis de ambiente
beforeEach(() => {
  vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
  vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key');
});
```

---

## 12. Deploy e Produção

### Netlify Configuration

- **Comando de Build**: `npm run build`
- **Diretório**: `dist`
- **Variáveis**: Dashboard > Site > Environment Variables (todas com prefixo `VITE_`)

### netlify.toml

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Processo de Deploy

```bash
git add .
git commit -m "feat: descrição clara"
git push origin main
# Netlify detecta e faz deploy automático (~2 min)
```

### Verificação Pós-Deploy

1. Aguarde 1-2 minutos para o build completar
2. Verifique o console do navegador para erros
3. Teste login (Firebase Auth)
4. Teste funcionalidade de IA (Gemini)
5. Verifique sincronização (Firestore)

---

## 13. Checklist para Nova Funcionalidade

### Nova View Completa

- [ ] Criar `components/views/NovaView.tsx`
- [ ] Adicionar `ViewState.NOVA` em `types.ts`
- [ ] Adicionar lazy import em `App.tsx`
- [ ] Adicionar case no switch `renderContent`
- [ ] Adicionar card no dashboard (opcional)
- [ ] Definir storage key: `p67_nova`
- [ ] Adicionar tipos em `types.ts`
- [ ] Criar testes básicos

### Novo Modal com IA

- [ ] Componente separado: `NovoModal.tsx`
- [ ] Estado de loading durante chamada
- [ ] Preview dos resultados antes de aplicar
- [ ] Botão de confirmar/cancelar
- [ ] Try/catch com mensagem de erro amigável
- [ ] Schema JSON bem definido para o Gemini

### Novo Subcomponente

- [ ] Criar em pasta apropriada (`skills/`, `notes/`, etc.)
- [ ] Props tipadas com interface
- [ ] React.memo se for item de lista renderizado muitas vezes
- [ ] Consistência visual com tema existente

### Novo Hook

- [ ] Criar em `hooks/`
- [ ] Tipagem de retorno clara
- [ ] Cleanup em useEffect (unsubscribe, clear timeout)
- [ ] Documentar uso no AI_CONTEXT.md

---

## 14. Armadilhas Comuns e Como Evitar

### ❌ "Gemini API key is not configured"

**Causa**: Variável não está na seção `define` do vite.config.ts ou não está no Netlify.

**Solução**:
1. Verificar `define` no vite.config.ts
2. Verificar variáveis no Netlify Dashboard
3. Rebuild após adicionar variável

### ❌ "Firebase: Error (auth/invalid-api-key)"

**Causa**: Chave incorreta ou não carregada.

**Solução**:
1. Verificar `.env.local` localmente
2. Verificar Netlify para produção
3. Sem espaços extras nas chaves

### ❌ Lazy loading falha

**Causa**: Caminho incorreto

```typescript
// ✅ CORRETO
React.lazy(() => import('./components/views/WorkView'))

// ❌ ERRADO
React.lazy(() => import('components/views/WorkView'))
```

### ❌ Dados não persistem entre sessões

**Causa**: Usando `useState` ao invés de `useStorage`

**Solução**: Trocar por `useStorage` com key única prefixada com `p67_`

### ❌ useStorage não sincroniza

**Causa**: Firebase não inicializado, offline, ou regras Firestore bloqueando

**Solução**:
1. Verificar console para erros
2. Checar regras em `firestore.rules`
3. Verificar autenticação do usuário

### ❌ Import de tipo falha no runtime

**Causa**: Importando tipo do `types.ts` dentro de `components/views/` com caminho errado

**Solução**: Usar caminho relativo correto:
```typescript
import { OrganizeTask } from '../types';  // de dentro de views/
import { OrganizeTask } from '../../types'; // de dentro de skills/
```

---

## 15. Referências Úteis

| Recurso | URL |
|---------|-----|
| Vite Env Variables | https://vitejs.dev/guide/env-and-mode.html |
| Firebase Docs | https://firebase.google.com/docs |
| Firestore Rules | https://firebase.google.com/docs/firestore/security/get-started |
| Gemini API | https://ai.google.dev/tutorials/get_started_web |
| Tailwind CSS | https://tailwindcss.com/docs |
| Lucide Icons | https://lucide.dev/icons/ |
| Recharts | https://recharts.org/en-US/api |
| Vitest | https://vitest.dev/ |

---

**Última Atualização**: 2025-11-26  
**Versão do Documento**: 3.0
