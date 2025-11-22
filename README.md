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

- **React 18+**: Core do frontend.
- **Tailwind CSS**: Estilização utilitária (Tema Dark/Slate).
- **Lucide React**: Ícones consistentes e leves.
- **Recharts**: Biblioteca de gráficos para visualização de dados.
- **Lazy Loading**: Otimização de performance via `React.lazy` e `Suspense`.

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

## 🎨 Design System

- **Fundo**: Slate-950 (`#020617`)
- **Cartões/Surface**: Slate-800 (`#1e293b`) com bordas Slate-700.
- **Acentos**: Cores vibrantes (Cyan, Orange, Purple) usadas para categorizar as áreas da vida.
- **Tipografia**: Inter (Google Fonts).

---
Desenvolvido para o desafio de 67 dias.