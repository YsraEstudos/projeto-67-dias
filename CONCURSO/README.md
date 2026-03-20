# Plano TRT 4

Aplicação standalone do plano de estudos do TRT 4, com período ativo de `14/03/2026` a `19/11/2026`.

## O que este app cobre

- Dashboard do plano
- Plano Diário
- Conteúdo Pragmático
- Anki & FSRS
- Links de Correção
- Simulados e Redações
- Projetos
- Notas de Corte
- Configurações

## Stack

- Vite + React 19 + TypeScript
- React Router
- Firebase para autenticação e sincronização opcional em nuvem
- Persistência local de snapshot para uso offline e recuperação rápida
- Vitest + Playwright para testes

## Persistência real hoje

O app não está mais limitado a `localStorage`.

- Snapshot local com chave `concurso.study.snapshot.v1`
- Backup automático local a cada `10` minutos
- Sincronização opcional com Google/Firebase
- Importação e exportação JSON
- Exportação em Markdown e PDF
- Suporte a backup com File System Access API quando o navegador permite
- Metadados de conteúdo teórico dentro do snapshot
- Binários de conteúdo teórico em IndexedDB local (`concurso-theoretical-content`)

## Conteúdo Pragmático

Hoje a área `Conteúdo Pragmático` cobre:

- nota `A-E` por submatéria
- `nota atual` por matéria na listagem principal
- filtro da listagem pela `nota atual` da matéria
- cadastro de submatérias
- upload de conteúdo teórico `.md` e `.pdf` por matéria e por submatéria
- reordenação manual dos arquivos por contexto
- download `.zip` por matéria, por submatéria e global

Regra atual de nota:

- a `nota atual` da matéria é a pior nota entre as submatérias cadastradas
- se a matéria ainda não tiver submatérias, a interface mostra `E` como fallback

Contrato detalhado:

- `docs/conteudo-pragmatico.md`

## Relação com o repositório principal

Este diretório contém o código-fonte do app standalone, mas a rota publicada `/concurso` do site principal usa a cópia estática em `../public/concurso/`.

Na prática:

1. Desenvolva aqui em `CONCURSO/src`.
2. Rode o build do standalone.
3. Sincronize o conteúdo de `CONCURSO/dist/` para `../public/concurso/`.

Sem essa sincronização, o código-fonte fica atualizado, mas a versão servida pelo app principal continua antiga.

## Rodar localmente

```bash
npm install
npm run dev
```

Configuração atual do dev server:

- porta `5173`
- HTTPS local habilitado
- base `/concurso/`

## Qualidade

```bash
npm run lint
npm run build
npm run test
npm run test:e2e
```

## Publicação

O build standalone gera a saída estática usada em `/concurso`. Depois do build, copie os arquivos gerados para `../public/concurso/`.

Se o objetivo for testar a rota real servida pelo app raiz, valide também `http://localhost:3000/concurso` após a sincronização do bundle estático.
