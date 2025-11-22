# 🤖 AI Developer Guide & Context

Este documento serve como a "memória central" e guia de regras para Agentes de IA que farão manutenção ou adicionarão novas funcionalidades ao **Projeto 67 Dias**.

## 1. Arquitetura e Roteamento

*   **Roteamento Baseado em Estado**: O projeto **NÃO** usa `react-router-dom`. A navegação é controlada pela variável de estado `activeView` no `App.tsx` e pelo Enum `ViewState` em `types.ts`.
*   **Lazy Loading (Obrigatório)**: Todos os novos módulos ("Views") dentro de `components/views/` DEVEM ser importados usando `React.lazy` no `App.tsx` para manter a performance.
*   **Micro-Frontend Simulado**: Cada view deve ser autossuficiente. Evite acoplamento forte entre `WorkView` e `RestView`, por exemplo.

## 2. Regras de Estilização (Tailwind CSS)

*   **Tema Dark**: O padrão é sempre dark mode.
    *   Background App: `bg-slate-950`
    *   Container/Cards: `bg-slate-800` ou `bg-slate-800/50` (com backdrop-blur).
    *   Bordas: `border-slate-700` ou `border-slate-700/50`.
    *   Texto Principal: `text-slate-200`.
    *   Texto Secundário: `text-slate-400`.
*   **Animações**: Use `animate-in fade-in zoom-in-95 duration-500` ao montar novos componentes para suavidade.
*   **Ícones**: Use `lucide-react`. Sempre defina o `size` e, se necessário, a cor via classes do Tailwind (`text-cyan-500`).

## 3. Passo-a-Passo para Criar Nova Funcionalidade

Para transformar um `PlaceholderView` em uma funcionalidade real (ex: "Jogos"):

1.  **Criar Componente**: Crie o arquivo `components/views/GamesView.tsx`.
2.  **Definir Lógica**: Implemente a lógica localmente no arquivo.
3.  **Atualizar Types**: Verifique se `ViewState.GAMES` existe em `types.ts`.
4.  **Atualizar App.tsx**:
    *   Adicione o import lazy: `const GamesView = React.lazy(() => import('./components/views/GamesView'));`
    *   Adicione o case no switch `renderContent`: `case ViewState.GAMES: return <GamesView />;`

## 4. Padrões de Código

*   **Componentes Funcionais**: Sempre use `React.FC`.
*   **Tipagem**: Evite `any`. Use interfaces em `types.ts` se o tipo for compartilhado, ou localmente se for exclusivo da view.
*   **Memoization**: Use `React.memo` em componentes de lista ou cartões que recebem props simples para evitar re-renders do grid principal.

## 5. Estado Atual do Projeto

### Módulos Implementados (Ativos):
*   ✅ **Dashboard**: Grid principal.
*   ✅ **Trabalho (`WorkView`)**: Lista de tarefas simples.
*   ✅ **Descanso (`RestView`)**: Timer e exercício de respiração visual.
*   ✅ **Ferramentas (`ToolsView`)**: Calculadora e Conversor.
*   ✅ **Leitura (`ReadingView`)**: Lista de livros com barra de progresso.
*   ✅ **Progresso (`ProgressView`)**: Gráficos usando Recharts.

### Módulos Pendentes (Placeholders):
*   🚧 **Estudos**: Placeholder.
*   🚧 **Exercícios Físicos**: Placeholder.
*   🚧 **Jogos**: Placeholder.
*   🚧 **Hábitos**: Placeholder.
*   🚧 **Diário**: Placeholder.
*   🚧 **Configurações**: Placeholder.

## 6. Instruções Especiais para IA

*   Ao criar novas UI, tente manter a consistência visual com os cartões existentes (bordas arredondadas `rounded-xl` ou `rounded-2xl`, sombras sutis).
*   Não remova o `Suspense` wrapper no `App.tsx`.
*   Se o usuário pedir "Otimização", verifique se há componentes grandes que podem ser quebrados ou memoizados.