# Plano de Performance: Pomodoro, Concurso e Estante de Estudos

Objetivo: deixar Pomodoro, Concurso e Estante de Estudos leves quando usados juntos, com foco em PCs fracos e no travamento percebido do timer Pomodoro.

## Diagnostico atual

### Pomodoro

Arquivos principais:

- `components/views/PomodoroView/hooks/usePomodoroTimer.ts`
- `components/views/PomodoroView/components/TimerWidget.tsx`
- `stores/pomodoroStore.ts`

Problemas encontrados:

- O timer usa `setInterval(syncRemaining, 100)`, gerando ate 10 atualizacoes por segundo para uma UI que exibe apenas segundos.
- `TimerWidget.tsx` concentra timer, tarefas, descanso, habilidades, modais, seletores, animacoes e busca de skill em um unico componente grande.
- O widget assina muitas partes do store de uma vez com `useStore()`, aumentando renders quando qualquer fatia muda.
- Existem varias animacoes `motion` e transicoes ativas no widget expandido/fullscreen.
- A conclusao do Pomodoro percorre tarefas e roadmaps de skills para localizar o item ativo, o que pode ficar caro quando ha muitos dados.

### Estante de Estudos

Arquivos principais:

- `components/views/AulasView/Bookshelf.tsx`
- `components/views/AulasView/ChapterView.tsx`
- `stores/aulasStore.ts`

Problemas encontrados:

- `Bookshelf.tsx` calcula `globalSearchResults` diretamente durante render.
- A busca global percorre livros, capitulos, conteudo, comentarios e questoes a cada render enquanto a busca esta aberta.
- A estante combina DnD, cards grandes, tooltips animados, modo visual 3D e listas potencialmente grandes.
- `ChapterView.tsx` usa intervalos para tempo de estudo e muitos blocos animados com `motion`.
- Alteracoes em capitulos podem sincronizar livros inteiros para a subcollection, gerando escrita pesada quando o livro tem muitos capitulos.

### Concurso

Arquivos principais:

- `CONCURSO/src/app/AppContext.tsx`
- `CONCURSO/src/pages/CleanConcursoPage.tsx`
- `CONCURSO/src/components/AppShell.tsx`

Problemas encontrados:

- `AppContext.tsx` entrega um contexto grande com estado, dados derivados e muitas acoes no mesmo `value`.
- `CleanConcursoPage.tsx` concentra muitos `useMemo` dependentes de partes amplas do estado.
- Mudancas pequenas no estado podem invalidar muito trabalho derivado da pagina principal.
- O autosave e o cloud sync estao bem intencionados, mas precisam continuar fora do caminho critico da interacao.

## Prioridade 1: Pomodoro sem travamento

Meta: o Pomodoro deve continuar preciso, mas renderizar no maximo uma vez por segundo durante a contagem normal.

Implementacao:

1. Trocar o intervalo de `100ms` por um agendamento alinhado ao proximo segundo.
   - Usar `setTimeout` recursivo ou `setInterval` de `1000ms`.
   - Calcular o tempo restante com `endTime - Date.now()`, mantendo precisao mesmo se o navegador atrasar.
   - Atualizar `timeLeft` apenas quando o segundo exibido mudar.

2. Persistir estado do timer apenas em eventos.
   - Persistir em iniciar, pausar, resetar, trocar modo, pular fase e completar.
   - Nao persistir a cada tick visual.
   - Manter `endTime` como fonte de verdade para recuperar o timer apos refresh.

3. Separar `TimerWidget.tsx` em componentes menores.
   - `TimerDisplay`
   - `TimerControls`
   - `TaskFocusPanel`
   - `BreakPanel`
   - `SkillFocusPanel`
   - `TaskPickerModal`

4. Assinar o Zustand por fatias pequenas.
   - Evitar `const {...} = useStore()` em componentes grandes.
   - Usar seletores especificos para cada subcomponente.
   - Usar `useShallow` quando selecionar varios campos relacionados.

5. Criar cache para localizar skill/tarefa ativa.
   - Evitar percorrer todos os roadmaps em toda conclusao de Pomodoro.
   - Manter um mapa derivado `roadmapItemId -> skillId`, recalculado apenas quando `skills` muda.

6. Reduzir animacoes enquanto o timer roda.
   - No modo leve, remover escala infinita, blur pesado e animacoes repetidas.
   - Respeitar `prefers-reduced-motion`.

Criterios de aceite:

- Timer visual atualiza no maximo uma vez por segundo.
- Ao deixar o app em segundo plano e voltar, o tempo restante continua correto.
- Start, pause, reset, skip e conclusao continuam persistidos.
- Teste do hook cobre que o timer nao depende de ticks de `100ms`.

## Prioridade 2: Estante mais leve

Meta: abrir a estante e pesquisar sem travar mesmo com muitos livros e capitulos.

Implementacao:

1. Debounce da busca global.
   - Criar `useDebouncedValue(globalSearchQuery, 250)`.
   - Rodar busca apenas com query estabilizada.

2. Memoizar `globalSearchResults`.
   - Transformar `getGlobalSearchResults()` em `useMemo`.
   - Dependencias: `books` e `debouncedSearchQuery`.
   - Retornar listas vazias quando a busca estiver fechada ou query vazia.

3. Criar indice de busca.
   - Derivar uma lista achatada com livro, capitulo, texto normalizado, comentarios e questoes.
   - Recalcular apenas quando `books` mudar.
   - Na busca, percorrer o indice em vez da estrutura completa aninhada.

4. Limitar render inicial.
   - Paginar ou virtualizar livros/capitulos quando passar de um limite.
   - Sugestao inicial: renderizar 24 livros e carregar mais por botao/scroll.
   - Para capitulos, renderizar blocos colapsados por padrao em livros grandes.

5. Tornar modo 3D opcional e leve.
   - Manter grid como padrao.
   - No modo leve, desativar hover com deslocamento grande, tooltips animados e sombras muito pesadas.

6. Reduzir sincronizacao de livros grandes.
   - Para `updateChapter`, avaliar salvar apenas o livro alterado com debounce.
   - Evitar gravar local backup completo em cada microalteracao de texto.

Criterios de aceite:

- Digitar na busca nao recalcula resultados a cada tecla imediatamente.
- Busca em estante grande permanece responsiva.
- A tela inicial da estante nao renderiza centenas de cards de uma vez.
- Modo leve reduz animacoes visuais sem remover funcionalidades.

## Prioridade 3: Concurso com menos renders globais

Meta: usar o Concurso junto com Pomodoro e Estante sem invalidar a UI inteira em mudancas pequenas.

Implementacao:

1. Dividir `AppContext`.
   - `ConcursoStateContext`: estado bruto.
   - `ConcursoDerivedContext`: dayPlans, maps, matrices e dados derivados.
   - `ConcursoActionsContext`: funcoes de dispatch.
   - `ConcursoSyncContext`: cloud sync, backup e status.

2. Criar hooks seletivos.
   - `useConcursoStateSelector(selector)`
   - `useConcursoActions()`
   - `useConcursoSyncStatus()`

3. Mover derivacoes caras para seletores memoizados.
   - `buildCleanPlanContentItems`
   - `groupPlanItemsBySubject`
   - `buildCalendarEvents`
   - filas de revisao e rollups

4. Revisar `CleanConcursoPage.tsx`.
   - Separar dashboard, calendario, revisoes, conteudo e configuracoes em componentes memoizados.
   - Cada componente deve receber apenas os dados que usa.

5. Manter autosave fora do caminho critico.
   - Confirmar que backup automatico roda por token e intervalo.
   - Para cloud sync, manter debounce e evitar serializar snapshot em cada render.

Criterios de aceite:

- Alterar uma nota/checklist no Concurso nao rerenderiza areas independentes.
- Dados derivados grandes so recalculam quando suas entradas mudam.
- Cloud sync/autobackup nao bloqueiam digitacao ou cliques.

## Prioridade 4: Modo leve global

Meta: o usuario poder escolher desempenho em vez de efeitos visuais.

Implementacao:

1. Criar preferencia global:
   - `performanceMode: 'auto' | 'normal' | 'leve'`

2. Heuristicas para `auto`:
   - `navigator.hardwareConcurrency <= 4`
   - `navigator.deviceMemory <= 4`, quando disponivel
   - `prefers-reduced-motion`

3. Aplicar classe no root:
   - `.performance-light`

4. Efeitos do modo leve:
   - Reduzir ou remover blur.
   - Reduzir sombras grandes.
   - Remover animacoes infinitas.
   - Desativar tooltips animados complexos.
   - Preferir listas paginadas/colapsadas.

Criterios de aceite:

- Existe controle nas configuracoes para ativar modo leve.
- Em modo leve, os tres modulos reduzem efeitos visuais pesados.
- Funcionalidade permanece igual.

## Prioridade 5: Medicao e testes

Meta: evitar regressao de performance.

Implementacao:

1. Pomodoro:
   - Testar tick de segundo.
   - Testar retomada por `endTime`.
   - Testar conclusao mesmo com timer atrasado.

2. Estante:
   - Testar debounce da busca.
   - Testar limite de resultados.
   - Testar que query vazia nao percorre livros.

3. Concurso:
   - Expandir `CONCURSO/src/tests/AppContext.performance.test.tsx`.
   - Testar que `buildPlanRuntime` nao roda em alteracoes irrelevantes.

4. Medicao manual:
   - Abrir Pomodoro rodando, Estante aberta e Concurso aberto.
   - Verificar ausencia de travadas em interacoes simples.
   - Usar React Profiler em dev para comparar renders antes/depois.

## Sequencia recomendada de commits

1. `perf(pomodoro): reduce timer tick frequency`
2. `perf(pomodoro): split timer widget subscriptions`
3. `perf(aulas): debounce and memoize bookshelf search`
4. `perf(aulas): limit bookshelf rendering for large libraries`
5. `perf(concurso): split context and memoize derived selectors`
6. `feat(settings): add light performance mode`
7. `test(perf): cover timer, bookshelf search, and concurso derivations`

## Resultado esperado

- O Pomodoro deixa de causar renders constantes desnecessarios.
- A Estante nao faz buscas profundas em todo render.
- O Concurso reduz rerenders por mudancas pequenas.
- Os tres modulos podem ficar abertos juntos com menor uso de CPU e menos travamentos em maquinas fracas.
