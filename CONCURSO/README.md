# Plano TRT 4 - App de Estudos

Aplicação React + TypeScript para executar o plano de estudos do concurso entre **10/03/2026** e **02/11/2026**, com tema preto, checklist diário, metas de simulados/redações, módulo Anki/FSRS, links de correção e backup JSON.

## Stack

- Vite + React + TypeScript
- React Router
- Persistência local com `localStorage`
- Testes com Vitest + Playwright

## Módulos

- Dashboard
- Plano Diário
- Conteúdo Pragmático (matriz de cobertura + subtópicos checkáveis)
- Anki & FSRS
- Links de Correção
- Simulados e Redações
- Projetos (painel de projetos práticos com exigências e progresso)
- Configurações e Backup

## Rodar localmente

```bash
npm install
npm run dev
```

## Qualidade

```bash
npm run lint
npm run build
npm run test
npm run test:e2e
```

## Deploy Vercel

Arquivo `vercel.json` já incluído com rewrite para SPA.
