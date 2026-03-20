# Projeto 67 Dias

Repositório principal do painel de produtividade "Projeto 67 Dias" e do app standalone `CONCURSO`, usado para o plano de estudos do TRT 4.

## Visão geral

Este repositório tem duas frentes que convivem no mesmo workspace:

- App raiz em `/`: SPA principal de produtividade, hábitos, leitura, diário, progresso, jogos e arena interna de concurso.
- App `CONCURSO/`: SPA independente do plano TRT 4, publicada em `/concurso` e também acessível a partir do card `Concurso` no dashboard principal.

## App raiz

### Módulos do dashboard

- `Trabalho`
- `Ajeitar Rápido`
- `Meus Links`
- `Leitura`
- `Habilidades (Skill Tree)`
- `Hábitos & Tarefas`
- `Diário & Reflexões`
- `Progresso & Revisão`
- `Planejador de Descansos`
- `Ferramentas`
- `Central de Jogos`
- `Concurso`

### Arquitetura atual

- SPA React 19 + Vite + TypeScript.
- Navegação dirigida por estado em `App.tsx`; o app raiz não usa `react-router`.
- Estado segmentado por domínio com Zustand em `stores/`.
- Sincronização Firestore-first via `stores/firestoreSync.ts`.
- Cache persistente multiaba do Firestore via `persistentLocalCache` + `persistentMultipleTabManager`.
- Autenticação com email/senha, Google e convidado; em desenvolvimento local existe fallback para convidado local quando a autenticação anônima do Firebase não está disponível.
- PWA via `vite-plugin-pwa`.
- API Python em `api/compress.py` para compressão avançada de imagens quando o fluxo precisa enviar arquivos ao Firebase Storage.

### Sincronização e persistência

- Debounce padrão de escrita: `15s`.
- Overrides por store para fluxos mais sensíveis: `5s`, `10s` ou `25s`, conforme o domínio.
- Stores de tempo real usam janela reduzida de `1.5s`.
- Não existe mais a dependência antiga de um cache manual global em `localStorage`; o fluxo principal é Firestore + cache local do SDK.

## App `CONCURSO`

O diretório `CONCURSO/` contém o app standalone do plano TRT 4.

- Usa React 19 + React Router + TypeScript.
- Período atual do plano: `14/03/2026` a `19/11/2026`.
- O app raiz possui uma view interna de concurso com duas frentes:
  - `Competição`: arena interna dentro do próprio dashboard principal.
  - `Materiais`: ponte para o app standalone e arquivos auxiliares.
- O `Conteúdo Pragmático` do standalone agora também organiza conteúdo teórico `.md` e `.pdf` por matéria e submatéria, com download `.zip` por contexto e global.

### Relação entre `CONCURSO/` e `/concurso`

- O código-fonte do app standalone fica em `CONCURSO/src`.
- A rota `/concurso` servida pelo app raiz usa a cópia estática em `public/concurso`.
- Em desenvolvimento local, `vite.config.ts` força `/concurso` a usar `public/concurso/index.html` para refletir exatamente o bundle estático publicado.
- Sempre que o app standalone for alterado, rode o build dentro de `CONCURSO/` e sincronize a saída para `public/concurso/`.

## Rodando localmente

### Fluxo recomendado no Windows

Use o script da raiz:

- `start-local.bat`

Esse fluxo prepara `.env.local`, instala dependências do frontend e da API local, sobe a API FastAPI em `http://127.0.0.1:8000` e o Vite raiz em `http://127.0.0.1:3000`.

### App raiz manualmente

```bash
npm install
npm run dev
```

Observação: sem a API local em `127.0.0.1:8000`, fluxos que dependem de `/api/compress` ficam sem o passo avançado de compressão, embora exista fallback cliente em alguns casos.

### App `CONCURSO` manualmente

```bash
cd CONCURSO
npm install
npm run dev
```

O servidor standalone usa HTTPS local na porta `5173` e base `/concurso/`.

## Build e publicação

### App raiz

```bash
npm run build
npm test
```

Deploy principal:

- `netlify.toml`: build do app raiz e headers de segurança.
- `vercel.json`: rewrite de SPA e encaminhamento de `/api/*` para `api/compress.py`.

### App `CONCURSO`

```bash
cd CONCURSO
npm run build
```

Depois do build, sincronize o conteúdo gerado com `public/concurso/` para que a rota publicada `/concurso` fique alinhada com o código mais recente.

## Variáveis de ambiente

Obrigatórias para o app raiz:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Opcional:

- `VITE_FIREBASE_MEASUREMENT_ID`

`VITE_GEMINI_API_KEY` ainda aparece no helper `scripts/ensure-local-env.ps1` como chave opcional legada, mas não é dependência ativa do runtime atual.

## Mapa de documentação

- `AI_CONTEXT.md`: visão técnica curta e atualizada para manutenção.
- `CONCURSO/README.md`: funcionamento e publicação do app standalone do concurso.
- `COMPRESSION_DOCS.md`: fluxos atuais de compressão de imagem.
- `PLANO_AUDITORIA_PROGRESSO_REVISAO.md`: status atual da auditoria de métricas semanais.
- `ROADMAP_AI_GUIDE.md`: regras e estrutura do roadmap assistido por IA.
