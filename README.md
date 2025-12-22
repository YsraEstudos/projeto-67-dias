# Projeto 67 Dias - Dashboard de Produtividade

Um painel de controle de vida abrangente focado em produtividade, hábitos e bem-estar, construído com React, Tailwind CSS e Recharts.

## 🚀 Visão Geral

O **Projeto 67 Dias** é uma aplicação web "Single Page Application" (SPA) que funciona como um hub central para diversas micro-ferramentas:
- **Trabalho:** Gerenciador de tarefas focado.
- **Descanso:** Temporizadores Pomodoro e exercícios de respiração.
- **Ferramentas:** Utilitários como calculadora e conversores.
- **Progresso:** Visualização de dados com gráficos.
- **Leitura:** Acompanhamento de livros.

## 🛠 Tecnologias

- **React 19+**: Core do frontend.
- **Tailwind CSS**: Estilização utilitária (Tema Dark/Slate).
- **Lucide React**: Ícones consistentes e leves.
- **Recharts**: Biblioteca de gráficos para visualização de dados.
- **@dnd-kit**: Drag-and-drop acessível para reordenação de itens.
- **Zustand**: Gerenciamento de estado leve e reativo.
- **Firebase**: Autenticação e Firestore para persistência.
- **Lazy Loading**: Otimização de performance via `React.lazy` e `Suspense`.

## 🔑 Configuração do Gemini

1. Crie um arquivo `.env.local` (não versionado) na raiz do projeto.
2. Adicione a chave obtida no [Google AI Studio](https://aistudio.google.com/apikey) usando o prefixo da Vite:

	```dotenv
	VITE_GEMINI_API_KEY=SEU_TOKEN_AQUI
	```

3. Garanta que o navegador consiga chamar o endpoint do Gemini. O projeto define um CSP estrito em `index.html`, então qualquer host novo precisa ser adicionado em `connect-src` (o domínio `https://generativelanguage.googleapis.com` já está liberado). Caso veja avisos citando ferramentas como Kaspersky, teste em uma janela sem extensões ou adicione o site à lista de confiança, pois alguns antivírus injetam CSP adicionais e podem bloquear os requests mesmo com a configuração correta.

## 📂 Estrutura de Arquivos

```
/
├── index.html              # Ponto de entrada
├── index.tsx               # Renderização do React Root
├── App.tsx                 # Layout Principal, Roteamento (State-based) e Lazy Loading
├── types.ts                # Definições de Tipos TypeScript e Enums
├── components/
│   ├── Card.tsx            # Componente de cartão do Dashboard (Memoized)
│   ├── shared/             # Componentes reutilizáveis
│   │   ├── Loading.tsx     # Spinner de carregamento
│   │   └── Placeholder.tsx # View genérica para telas em construção
│   └── views/              # Micro-apps (Carregados sob demanda)
│       ├── WorkView.tsx
│       ├── RestView.tsx
│       ├── ToolsView.tsx
│       ├── ReadingView.tsx
│       └── ProgressView.tsx
```

## ⚡ Performance

O projeto utiliza **Code Splitting**. As views (Trabalho, Descanso, etc.) não são carregadas no bundle inicial. Elas são baixadas apenas quando o usuário clica no cartão correspondente no dashboard, garantindo um carregamento inicial extremamente rápido.

## 🔄 Sincronização Firestore

A aplicação usa uma arquitetura **Firestore-first** com sincronização em tempo real:

### Fluxo de Dados
1. **Writes**: Todas as mutações passam por `writeToFirestore()` com debounce de 300ms
2. **Reads**: Subscriptions via `onSnapshot` mantêm dados sempre atualizados
3. **Offline**: SDK do Firebase gerencia cache IndexedDB automaticamente

### Indicador de Sincronização
O `SyncStatusIndicator` no header mostra:
- 🔵 **Sincronizando...** - Writes pendentes sendo processados
- ✅ **Salvo** - Todos os dados sincronizados
- ⚪ **Offline** - Sem conexão (writes serão enviados quando online)

### Stores Zustand
Cada store (`habitsStore`, `linksStore`, etc.) segue o padrão:
- `_syncToFirestore()` - Envia estado para nuvem (debounced)
- `_hydrateFromFirestore()` - Recebe dados da nuvem (via subscription)
- `_initialized` flag evita overwrites acidentais durante hidratação

## 🎨 Design System

- **Fundo**: Slate-950 (`#020617`)
- **Cartões/Surface**: Slate-800 (`#1e293b`) com bordas Slate-700.
- **Acentos**: Cores vibrantes (Cyan, Orange, Purple) usadas para categorizar as áreas da vida.
- **Tipografia**: Inter (Google Fonts).

---
Desenvolvido para o desafio de 67 dias.