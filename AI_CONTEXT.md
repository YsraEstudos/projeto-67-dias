# AI Context

Resumo técnico atualizado para manutenção do repositório `projeto-67-dias-concurso-sync`.

## 1. O que existe neste repo

Há dois apps relacionados, mas com responsabilidades diferentes:

- App raiz em `/`: painel principal "Projeto 67 Dias".
- App standalone em `CONCURSO/`: plano TRT 4 publicado em `/concurso`.

O dashboard principal também possui uma área `Concurso`, mas ela não substitui o app standalone. Hoje ela funciona como:

- `Competição`: arena interna renderizada dentro do app raiz.
- `Materiais`: acesso ao app standalone e aos arquivos auxiliares do concurso.

## 2. Stack atual

### App raiz

- React `19.2.3`
- Vite `7.3.0`
- TypeScript `5.9.3`
- Zustand `5.0.9`
- Firebase `12.7.0`
- Recharts `3.6.0`
- Tailwind CSS `4.1.18`
- Vitest `4.0.18`
- `vite-plugin-pwa` `1.2.0`

### App `CONCURSO`

- React `19.2.0`
- React Router `7.13.1`
- Firebase `12.7.0`
- Vite `7.3.1`
- Vitest `4.0.18`
- Playwright `1.58.2`
- Período ativo atual: `12/03/2026` a `19/11/2026`

## 3. Arquitetura do app raiz

### Navegação

- O app raiz não usa `react-router`.
- A navegação principal é controlada por estado em `App.tsx`.
- `ViewState` em `types.ts` define as views disponíveis.
- `useUIStore` e `useTabStore` controlam view ativa, abas internas e sincronização com histórico do navegador.

### Módulos principais

`DASHBOARD`, `WORK`, `SUNDAY`, `LINKS`, `READING`, `SKILLS`, `HABITS`, `JOURNAL`, `PROGRESS`, `REST`, `TOOLS`, `SETTINGS`, `GAMES` e `CONCURSO`.

### Estado

- Cada domínio tem store própria em `stores/`.
- O padrão atual é:
  - `_hydrateFromFirestore()`
  - `_reset()`
  - sincronização via `writeToFirestore()`
- Prefira selectors em `stores/selectors/` quando já existirem.

## 4. Persistência e sincronização

O projeto usa uma arquitetura Firestore-first com cache local do próprio SDK.

### Regras atuais

- Debounce padrão de escrita: `15000ms`
- Overrides por store:
  - `5000ms`: projeto, timer, competição
  - `10000ms`: trabalho
  - `25000ms`: notas, prompts, links, agenda semanal
- Fluxos de tempo real usam `REALTIME_DEBOUNCE_MS = 1500`

### O que mudou em relação à documentação antiga

- Não documente mais debounce global de `300ms`.
- Não trate `localStorage` como camada principal de persistência do app raiz.
- O cache offline principal vem do Firestore com `persistentLocalCache`.

## 5. Autenticação

Arquivo central: `services/firebase.ts`.

Fluxos suportados:

- email e senha
- Google
- anônimo
- fallback de convidado local em desenvolvimento, quando a autenticação anônima do Firebase falha por configuração/credenciais locais

Pontos importantes:

- `useAuth` controla o ciclo de autenticação e hidratação inicial.
- `clearAllStores()` deve continuar sendo chamado na troca de contexto de usuário.
- O fallback local grava sessão em `localStorage`, mas isso é um recurso de desenvolvimento, não a estratégia principal de persistência do produto.

## 6. App `CONCURSO` e rota `/concurso`

O standalone vive em `CONCURSO/src`, mas a rota publicada `/concurso` usa os arquivos estáticos de `public/concurso/`.

Consequências práticas:

- Alterar `CONCURSO/src` não atualiza sozinho a versão servida pelo app raiz.
- Depois de qualquer mudança no standalone, é preciso rodar o build em `CONCURSO/` e sincronizar o resultado para `public/concurso/`.
- Em `vite.config.ts` da raiz existe um middleware de desenvolvimento para forçar `/concurso` a servir a cópia estática e evitar conflitos com a pasta `CONCURSO` no Windows.

### Conteúdo Pragmático

- A hierarquia funcional atual é `Área -> Matéria -> Submatéria -> Conteúdo teórico`.
- A `nota atual` da matéria é calculada pela pior nota entre suas submatérias.
- Metadados dos arquivos teóricos ficam no snapshot principal do app.
- Binários dos arquivos teóricos ficam no IndexedDB local `concurso-theoretical-content`.
- A sincronização em nuvem atual não replica os binários, apenas o snapshot.
- Downloads de conteúdo teórico são gerados como `.zip`:
  - global: tudo agrupado por matéria
  - matéria: arquivos da matéria + submatérias
  - submatéria: apenas o contexto selecionado
- Fonte de verdade do contrato: `CONCURSO/docs/conteudo-pragmatico.md`.

## 7. Compressão de imagens

Há dois fluxos ativos:

### Imagens inline em notas

- Compressão apenas no cliente com `compressImage(..., 800, 0.8)`
- O conteúdo fica embutido em markdown/base64
- Não passa por Firebase Storage

### Drawings e imagens de histórias de jogos

- Resize inicial no cliente
- Conversão segura com `dataURLtoBlob`
- Tentativa de otimização em `/api/compress`
- Upload final ao Firebase Storage
- Fallback para o blob cliente se a API falhar

`api/compress.py` devolve `image/webp`. Se mexer nesse fluxo, mantenha alinhados conteúdo, metadata e extensão do arquivo salvo.

## 8. Variáveis de ambiente

Obrigatórias no runtime atual:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Opcional:

- `VITE_FIREBASE_MEASUREMENT_ID`

Observação:

- `scripts/ensure-local-env.ps1` ainda preserva `VITE_GEMINI_API_KEY` como chave opcional legada.
- Não existe hoje um cliente `services/gemini.ts` ativo no app.
- Não documente Gemini como dependência obrigatória do runtime.

## 9. Build, teste e deploy

### App raiz

- `npm run dev`
- `npm run build`
- `npm run test`

### App `CONCURSO`

- `cd CONCURSO`
- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run test:e2e`

### Deploy

- `netlify.toml`: build principal do app raiz e headers
- `vercel.json`: rewrites da SPA e endpoint `/api/compress`

## 10. Armadilhas que ainda pegam fácil

- A rota `/concurso` pode parecer atualizada no código-fonte, mas continuar servindo bundle antigo se `public/concurso/` não for sincronizado.
- Firestore rejeita `undefined`; continue usando o caminho de limpeza já centralizado em `writeToFirestore()`.
- Se adicionar chamadas externas novas, revise CSP em `index.html` e headers de deploy.
- Se criar novas stores persistidas, atualize hidratação, reset, sync e contadores que dependem de readiness.

## 11. Docs que valem como fonte de verdade

- `README.md`
- `CONCURSO/README.md`
- `COMPRESSION_DOCS.md`
- `PLANO_AUDITORIA_PROGRESSO_REVISAO.md`
- `ROADMAP_AI_GUIDE.md`
