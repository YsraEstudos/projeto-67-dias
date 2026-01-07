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
9. [Configuração de Ambiente](#9-configuração-de-variáveis-de-ambiente)
10. [Testes](#10-testes)
11. [Deploy e Produção](#11-deploy-e-produção)
12. [Checklist para Nova Funcionalidade](#12-checklist-para-nova-funcionalidade)
13. [Armadilhas Comuns](#13-armadilhas-comuns-e-como-evitar)
14. [Schemas e Validação Zod](#14-schemas-e-validação-zod)
15. [Referências Úteis](#15-referências-úteis)

---

## 1. Visão Geral do Projeto

O **Projeto 67 Dias** é um dashboard de produtividade pessoal com foco em:
- 📊 Rastreamento de metas e hábitos
- 📚 Gerenciamento de leitura
- 🎯 Skills e aprendizado com roadmaps visuais
- 📝 Diário pessoal
- ⏱️ Timer e ferramentas de produtividade
- 🔗 Central de links e prompts

### Stack Tecnológico

| Categoria | Tecnologia | Versão |
|-----------|------------|--------|
| Frontend | React | ^19.2.0 |
| Bundler | Vite | ^6.2.0 |
| Estilização | Tailwind CSS (local build) | ^4.1.17 |
| Ícones | lucide-react | ^0.554.0 |
| Gráficos | Recharts | ^3.4.1 |
| Visualização | react-zoom-pan-pinch | ^3.7.0 |
| Layout | dagre | ^0.8.5 |
| Autenticação | Firebase Auth | ^12.6.0 |
| Banco de Dados | Firebase Firestore | ^12.6.0 |
| Testes | Vitest + RTL | ^4.0.13 |
| Tipagem | TypeScript | ~5.8.2 |
| Validação | Zod | ^4.2.1 |

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

### Responsividade Mobile e Touch
Em dispositivos móveis (touch), o pseudo-estado `:hover` não existe ou se comporta de maneira inesperada (sticky hover).

**Ações secundárias (botões de editar/excluir)** que normalmente aparecem apenas no hover devem seguir este padrão para acessibilidade:

```tsx
// ❌ INCORRETO (invisível em mobile)
className="opacity-0 group-hover:opacity-100"

// ✅ CORRETO (visível em mobile, hover apenas em desktop)
className="md:opacity-0 md:group-hover:opacity-100"
```
Isso garante que:
1. Em telas < 768px (mobile), a opacidade é 100% (MD default).
2. Em telas >= 768px (desktop), a opacidade inicial é 0 e muda com hover.

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
├── tailwind.config.js      # Configuração Tailwind CSS
├── postcss.config.js       # Configuração PostCSS
├── firestore.rules         # Regras de segurança Firestore
│
├── components/
│   ├── Card.tsx            # Card do dashboard com glassmorphism
│   ├── TimerWidget.tsx     # Widget flutuante de timer
│   │
│   ├── views/              # Cada "página" do app
│   │   ├── AuthView.tsx    # Login/Registro
│   │   ├── WorkView.tsx    # Gerenciador de trabalho
│   │   ├── RestView.tsx    # Planejador de descansos
│   │   ├── ToolsView.tsx   # Calculadora, Timer, Conversores
│   │   ├── ReadingView.tsx # Biblioteca de livros
│   │   ├── ProgressView.tsx# Sistema de revisão semanal
│   │   ├── HabitsView.tsx  # Hábitos + Tarefas
│   │   ├── JournalView.tsx # Diário pessoal
│   │   ├── SkillsView.tsx  # Skill Tree principal
│   │   ├── SettingsView.tsx# Configurações + Notas
│   │   ├── LinksView.tsx   # Links + Prompts + Sites
│   │   ├── SundayView.tsx  # Organização dominical
│   │   ├── GamesView.tsx   # Tracking de jogos
│   │   └── work/           # Subcomponentes de WorkView
│   │
│   ├── progress/           # Sistema de Revisão Semanal (NOVO)
│   │   ├── index.ts        # Barrel export
│   │   ├── WeeklyReviewCard.tsx      # Card de revisão semanal
│   │   ├── WeeklyTimeline.tsx        # Timeline visual das semanas
│   │   ├── EvolutionChart.tsx        # Gráfico de evolução (Recharts)
│   │   ├── ImprovementsList.tsx      # Lista de pontos de melhoria
│   │   ├── FinalJourneySummary.tsx   # Resumo final dos 67 dias
│   │   └── SnapshotConfirmationModal.tsx # Modal de confirmação
│   │
│   ├── skills/             # Subcomponentes de Skills + Agenda
│   │   ├── SkillCard.tsx
│   │   ├── SkillDetailView.tsx
│   │   ├── SkillHeader.tsx
│   │   ├── RoadmapSection.tsx
│   │   ├── VisualRoadmapView.tsx     # Roadmap visual interativo
│   │   ├── VisualRoadmapEditor.tsx   # Editor de roadmap visual
│   │   ├── VisualNode.tsx            # Nó do roadmap
│   │   ├── VisualConnection.tsx      # Conexões do roadmap
│   │   ├── ResourcesVault.tsx        # Cofre de recursos
│   │   ├── ProgressStats.tsx
│   │   ├── CreateSkillModal.tsx
│   │   ├── FullRoadmapEditor.tsx
│   │   ├── ImportExportModal.tsx
│   │   ├── PromptSelectorModal.tsx
│   │   ├── PromptPreviewModal.tsx
│   │   ├── ThemePicker.tsx
│   │   ├── constants.ts
│   │   ├── layoutUtils.ts
│   │   ├── mockData.ts
│   │   └── roadmapSync.ts           # Sincronização de roadmaps
│   │
│   ├── notes/              # Sistema de Notas (5 arquivos)
│   │   ├── NotesTab.tsx    # Tab principal
│   │   ├── NoteCard.tsx    # Card de nota (memoizado)
│   │   ├── NoteEditor.tsx
│   │   ├── TagFilter.tsx
│   │   └── TagManager.tsx
│   │
│   ├── prompts/            # Sistema de Prompts (com Drag-and-Drop)
│   │   ├── PromptsTab.tsx         # Tab principal + DnD integration
│   │   ├── SortablePromptItem.tsx # Item arrastável (@dnd-kit)
│   │   ├── CategoryModal.tsx      # Modal CRUD de categorias
│   │   ├── VariableSelector.tsx   # Seletor de variáveis
│   │   └── constants.ts           # Ícones e paleta de cores
│   │
│   ├── links/              # Componentes de Links (NOVO)
│   │   ├── LinkCard.tsx           # Card de link individual
│   │   ├── LinkModal.tsx          # Modal criar/editar link
│   │   ├── SiteCategoryModal.tsx  # Modal CRUD de categorias de sites
│   │   └── MultiPromptSelector.tsx # Seletor multi-prompt com checkboxes
│   │
│   ├── modals/             # Modais compartilhados
│   │   └── ...
│   │
│   ├── ui/                 # Componentes de UI reutilizáveis
│   │   ├── Skeleton.tsx    # Skeleton loading base
│   │   ├── CardSkeleton.tsx # Skeleton para cards
│   │   └── ListSkeleton.tsx # Skeleton para listas
│   │
│   └── shared/             # Componentes compartilhados
│       ├── Loading.tsx     # Loading com animações premium
│       └── PlaceholderView.tsx
│
├── hooks/
│   ├── useAuth.ts          # Autenticação Firebase
│   ├── useStorage.ts       # LocalStorage + Firestore híbrido
│   ├── useEditableField.ts # Campo editável inline
│   ├── useDebounce.ts      # Debounce genérico
│   ├── usePWA.ts           # Instalação PWA
│   ├── useNavigationHistory.ts # Histórico de navegação
│   └── useLocalStorage.ts  # LocalStorage simples
│
├── services/
│   ├── firebase.ts         # Inicialização + funções de auth
│   ├── gemini.ts           # Cliente Gemini AI (com thinking mode)
│   └── weeklySnapshot.ts   # Serviço de snapshots semanais (432 linhas)
│
├── constants/
│   └── dataCategories.ts   # Categorias de dados
│
├── tests/                  # Testes automatizados
│   ├── setup.ts
│   ├── App.test.tsx
│   ├── components/         # Testes de componentes
│   └── services/           # Testes de serviços
│
└── public/
    ├── favicon.ico
    └── _redirects          # Netlify SPA redirects
```

---

## 5. Tipos e Interfaces (types.ts)

> **IMPORTANTE**: Consulte sempre o arquivo `types.ts` para ver os tipos mais atualizados. Esta seção lista apenas as principais interfaces para referência rápida.

### ViewState (Enum de Navegação)

```typescript
export enum ViewState {
  DASHBOARD, WORK, SUNDAY, LINKS, READING,
  SKILLS, HABITS, JOURNAL, PROGRESS, REST,
  TOOLS, SETTINGS, GAMES
}
```

### Tipos Principais por Módulo

| Módulo | Interface Principal | Campos Chave |
|--------|--------------------|--------------|
| Config | `ProjectConfig` | `startDate`, `userName`, `theme` |
| Auth | `User` | `id`, `name`, `email`, `isGuest` |
| Skills | `Skill` | `roadmap[]`, `logs[]`, `currentMinutes` |
| Habits | `Habit` | `history{}`, `subHabits[]`, `isNegative` |
| Reading | `Book` | `logs[]`, `deadline`, `dailyGoal` |
| Journal | `JournalEntry` | `mood`, `content`, `aiAnalysis` |
| Rest | `RestActivity` | `type`, `daysOfWeek[]`, `links[]` |
| Tasks | `OrganizeTask` | `dueDate`, `reminderDate`, `category` |
| Notes | `Note` | `tags[]`, `color`, `isPinned` |
| Prompts | `Prompt` | `variables[]`, `images[]`, `category` |
| Sunday | `SundayTask` | `subTasks[]`, `isArchived` |
| Games | `Game` | `hoursPlayed`, `platform`, `status` |
| Links | `Site`, `SiteCategory` | `prompts[]`, `folders[]` |

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

### Firestore Sync Layer (`stores/firestoreSync.ts`)

Camada de sincronização centralizada que gerencia writes debounced e subscriptions em tempo real.

```typescript
// Exports principais
export const writeToFirestore: <T>(collectionKey: string, data: T, debounceMs?: number) => void;
export const subscribeToDocument: <T>(key: string, onData: (data: T | null) => void) => Unsubscribe;
export const flushPendingWrites: () => void;  // Força envio imediato (antes de logout)
export const REALTIME_DEBOUNCE_MS: number;   // 200ms para stores de tempo real (timers)

// Para UI (SyncStatusIndicator)
export const isFullySynced: () => boolean;
export const getPendingWriteCount: () => number;
export const subscribeToPendingWrites: (listener: () => void) => () => void;
```

**Comportamento:**
- Debounce padrão de 1500ms evita writes excessivos durante digitação rápida
- Debounce customizável via terceiro parâmetro (ex: 200ms para timers)
- `pendingWriteCount` incrementa **imediatamente** ao agendar write (não após debounce)
- Writes para mesma collection substituem o anterior sem duplicar contagem
- SDK do Firebase gerencia cache IndexedDB automaticamente (funciona offline)

**⚠️ REGRA CRÍTICA:**
Nunca chame `_syncToFirestore()` dentro de `_hydrateFromFirestore()` - isso causa loop infinito!

### Padrão de Stores Zustand

Todas as stores seguem o mesmo padrão:

```typescript
interface StoreState {
    // Dados
    items: Item[];
    isLoading: boolean;
    _initialized: boolean;  // Evita overwrite durante hidratação

    // Actions
    addItem: (item: Item) => void;
    // ...

    // Internals
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { items: Item[] } | null) => void;
    _reset: () => void;
}

export const useStore = create<StoreState>()((set, get) => ({
    items: [],
    isLoading: true,
    _initialized: false,

    addItem: (item) => {
        set((state) => ({ items: [...state.items, item] }));
        get()._syncToFirestore();  // ✅ Sync após mutação
    },

    _syncToFirestore: () => {
        const { items, _initialized } = get();
        if (_initialized) {  // ✅ Só sync se já hidratou
            writeToFirestore(STORE_KEY, { items });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            set({
                items: data.items || [],
                isLoading: false,
                _initialized: true
            });
            // ⚠️ NÃO chamar _syncToFirestore aqui!
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({ items: [], isLoading: true, _initialized: false });
    }
}));
```

### Weekly Snapshot (`services/weeklySnapshot.ts`)

Serviço para captura e análise de snapshots semanais da jornada de 67 dias.

```typescript
// Configurações da jornada
export const JOURNEY_CONFIG = {
  TOTAL_DAYS: 67,
  TOTAL_WEEKS: 10,
  DAYS_PER_WEEK: 7,
};

// Funções exportadas
export function calculateCurrentWeek(startDate: string): number;
export function calculateCurrentDay(startDate: string): number;
export function getWeekDateRange(startDate: string, weekNumber: number): { startDate: string; endDate: string };
export function shouldGenerateSnapshot(lastSnapshotWeek: number, startDate: string): boolean;

// Captura de métricas
export function captureWeeklyMetrics(
  weekNumber: number,
  startDate: string,
  habits: Habit[],
  skills: Skill[],
  books: Book[],
  tasks: OrganizeTask[],
  journalEntryCount: number
): WeeklyMetrics;

// Evolução e pontuação
export function calculateEvolution(current: WeeklyMetrics, previous: WeeklyMetrics | null): WeeklyEvolution;
export function calculateOverallScore(metrics: WeeklyMetrics): number;

// Geração de snapshot (status PENDING para confirmação)
export function generateWeeklySnapshot(...): WeeklySnapshot;

// Detecção de melhorias
export function detectImprovements(snapshots: WeeklySnapshot[]): ImprovementPoint[];

// Resumo final
export function generateFinalSummary(snapshots: WeeklySnapshot[], improvements: ImprovementPoint[]): FinalJourneySummary;
```

**Storage Key:** `p67_journey_review`

---

## 8. Padrões de Código por Módulo

### WorkView - Gerenciador de Trabalho

**Features:**
- Contador de itens com meta diária
- Análise de break (pré/pós almoço)
- Calculadora de pace (10min/25min)
- Calculadora de pace (10min/25min)
- Modal "Bati a Meta" com timer + histórico semanal (Anki + NCM)
- **Metas Extras (Idle Tasks)**: Seleção de tarefas "ociosas" para pontuação extra durante sessões de trabalho.

**Arquivos Principais:**
- `WorkView.tsx` - Container principal
- `MetTargetModal.tsx` - Modal de sessão (Bati a Meta)
- `SessionTab.tsx` - Tab da sessão ativa (Timer + Metas Extras)
- `IdleTaskSelector.tsx` - Modal de seleção de tarefas ociosas
- `IdleTaskItem.tsx` - Item da lista de metas extras

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
- Navegador de datas

**Storage Keys:**
- `p67_rest_activities`
- `p67_rest_next_2h` (IDs dos 4 slots)

**Modais:**
- `NextTwoHoursModal` - Seleção de atividades para os próximos 2h

### HabitsView - Hábitos e Tarefas

**Features:**
- Duas tabs: TASKS (tarefas) e HABITS (hábitos)
- Tarefas: categorias, datas, lembretes, auto-archive
- Hábitos: sub-hábitos, histórico por data
- **Hábitos Negativos**: Lógica reversa (marcar = falha/vermelho, não marcar = sucesso/verde)

**Storage Keys:**
- `p67_tasks` - Tarefas organizacionais
- `p67_habits` - Hábitos com histórico

**Modais:**
- `TaskModal` - Criar/editar tarefa
- `HabitModal` - Criar hábito com sub-hábitos

### SkillsView - Skill Tree

**Features:**
- Cards de skills com progresso de tempo (minutos → horas)
- Detail view com roadmap interativo
- Drag and drop no roadmap
- Seções/divisórias no roadmap
- Import/Export de roadmaps (Markdown/JSON)
- **Sistema de Backup de Roadmaps**: Histórico automático de imports (máx 10 backups)
- Cofre de recursos (links de estudo)

**Storage Key:** `p67_skills`

**Subcomponentes:**
- `SkillCard.tsx` - Card resumido com quick-add de minutos
- `SkillDetailView.tsx` - View completa
- `ImportExportModal.tsx` - Markdown/JSON com campo de nome do backup
- `RoadmapBackupModal.tsx` - Visualizar/restaurar/excluir backups
- `CreateSkillModal.tsx` - Criar nova skill

**Sistema de Backup:**
- Backup automático antes de cada import de roadmap
- Rollback cria novo backup do estado atual (operação reversível)
- Limite de 10 backups por skill (remove mais antigo automaticamente)
- Label opcional para identificação
- Store actions: `createRoadmapBackup`, `rollbackToBackup`, `deleteBackup`

### JournalView - Diário Pessoal

**Features:**
- Lista de entradas na sidebar esquerda
- Editor de texto livre
- Seletor de mood (5 opções com emoji)
- Citação inspiracional exibida na interface

**Storage Key:** `p67_journal`

### LinksView - Central de Links

**Features:**
- Main tabs: Links e Prompts (lazy loaded)
- Sub-tabs: PERSONAL e GENERAL
- **Prompts Dinâmicos**: Suporte a variáveis `{{var|opt1,opt2}}` com modal de seleção
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

**Storage Keys:** Cada store Zustand define sua própria `STORE_KEY` (padrão: `p67_*_store`). Consulte os arquivos em `stores/` para ver a lista atual.

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

> [!CAUTION]
> **ANTES DE QUALQUER DEPLOY:** Verifique se houve mudanças estruturais nos dados. Se sim, incremente `APP_SCHEMA_VERSION` em `App.tsx`. Ver seção 12.1.

### 12.1 Versionamento de Schema (Cache Busting) ⚠️ CRÍTICO

O app possui um mecanismo de **Cache Busting automático** para resolver conflitos de dados no IndexedDB do Firestore quando há mudanças estruturais (schema changes).

**Como funciona:**
1. O app verifica a constante `APP_SCHEMA_VERSION` no `App.tsx`.
2. Se a versão do código for diferente da versão salva no LocalStorage do usuário, o app limpa automaticamente todo o cache do Firestore (IndexedDB) e recarrega a página.

**Quando incrementar:**
Sempre que fizer um deploy que **altere a estrutura dos dados** (ex: migração de campos, novos relacionamentos), você DEVE incrementar a versão antes do commit.

**⚠️ REGRA DO FORMATO:**
- Use **SEMPRE a data de hoje** no formato `AAAA.MM.DD.revisão`
- Se já existe uma versão de hoje, incremente apenas o último número
- Se é um dia novo, use `.1` como revisão

**Exemplos:**

```typescript
// App.tsx

// Hoje é 27/12/2024, primeira mudança:
const APP_SCHEMA_VERSION = '2024.12.27.1';

// Ainda é 27/12/2024, segunda mudança no mesmo dia:
const APP_SCHEMA_VERSION = '2024.12.27.2';

// Agora é 28/12/2024, primeira mudança do dia:
const APP_SCHEMA_VERSION = '2024.12.28.1';  // ← Muda a DATA, reseta revisão para .1
```

⚠️ **NOTA:** Isso é transparente para o usuário final, que apenas perceberá um reload rápido.

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

**CHECKLIST OBRIGATÓRIA:**

1. ✅ **Verificar mudanças estruturais**
   - Adicionou/removeu store?
   - Mudou campos em `types.ts`?
   - Alterou relacionamentos entre entidades?
   - **Se SIM:** Incrementar `APP_SCHEMA_VERSION` em `App.tsx`

2. ✅ **Commit e Push**
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
- [ ] **⚠️ ANTES DO DEPLOY:** Incrementar `APP_SCHEMA_VERSION` se houver mudanças estruturais
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

## 14. Schemas e Validação Zod

O projeto usa **Zod v4** para validação de dados em formulários e importação de arquivos.

### Localização
```
schemas/
└── index.ts    # Todos os schemas e utilitários
```

### Schemas Disponíveis

| Schema | Uso | Arquivo que usa |
|--------|-----|-----------------|
| `gameSchema` | Formulário de Game | `AddGameModal.tsx`, `GameDetailsModal.tsx` |
| `skillSchema` | Formulário de Skill | `CreateSkillModal.tsx` |
| `visualRoadmapSchema` | Importação de roadmap visual | `VisualRoadmapEditor.tsx` |
| `backupSchema` | Importação de backup JSON | `DataManagementModal.tsx` |

### Utilitários de Validação

```typescript
import { safeParse, parseJsonSafe, visualRoadmapSchema } from '../schemas';

// safeParse - Validação segura sem exceção
const result = safeParse(visualRoadmapSchema, parsedJson);
if (result.success === true) {
    setNodes(result.data.nodes);  // Tipado corretamente
} else {
    alert(`Erro: ${result.error}`);  // Mensagem formatada
}

// parseJsonSafe - JSON.parse + validação em uma linha
const data = parseJsonSafe(schema, jsonString);  // T | null
```

### Como Usar em Formulários (react-hook-form)

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { gameSchema, GameFormData } from '../schemas';

const { register, handleSubmit, formState: { errors } } = useForm<GameFormData>({
    resolver: zodResolver(gameSchema),
});
```

### Criando Novos Schemas

```typescript
// schemas/index.ts
export const minhaEntidadeSchema = z.object({
    id: z.string().min(1),
    nome: z.string().min(1, 'Nome obrigatório'),
    valor: z.number().positive('Valor deve ser positivo'),
    dataCriacao: z.string().datetime().optional(),
});

// Inferir tipo automaticamente
export type MinhaEntidade = z.infer<typeof minhaEntidadeSchema>;
```

---

## 15. Referências Úteis

| Recurso | URL |
|---------|-----|
| Vite Env Variables | https://vitejs.dev/guide/env-and-mode.html |
| Firebase Docs | https://firebase.google.com/docs |
| Firestore Rules | https://firebase.google.com/docs/firestore/security/get-started |
| Tailwind CSS | https://tailwindcss.com/docs |
| Lucide Icons | https://lucide.dev/icons/ |
| Recharts | https://recharts.org/en-US/api |
| Vitest | https://vitest.dev/ |
| Zod Docs | https://zod.dev/ |

---

**Última Atualização**: 2026-01-07  
**Versão do Documento**: 5.0
