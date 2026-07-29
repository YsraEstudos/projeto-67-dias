# 67 Dias Integrity, Sync, Mobile and Performance Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox ( - [ ] ) syntax for tracking.

**Goal:** Corrigir os defeitos confirmados do relatório sem perda silenciosa de dados, preservar o comportamento válido existente e validar o resultado com testes de regressão, sincronização, responsividade e performance.

**Architecture:** A correção será feita em fases independentes: primeiro chaves de data e integridade de estado; depois merge/sincronização; depois métricas e fluxos de domínio; por fim interação mobile e otimizações medidas. Cada fase introduz uma fonte de verdade única e um teste observável antes de alterar a implementação.

**Tech Stack:** React 19, TypeScript, Zustand, Firestore, Vitest, Vite, Recharts e Playwright apenas no subprojeto CONCURSO.

## Global Constraints

- Não usar git add -A; preservar as alterações atuais do usuário e fazer staging apenas dos arquivos da tarefa.
- Não introduzir novas dependências no app raiz.
- Toda mutação persistente deve ter teste de hidratação, concorrência ou gravação única quando aplicável.
- Não declarar ganho de performance sem profiling ou teste de contagem de trabalho.
- Toda correção de bug deve incluir regressão que falhe antes da correção.
- Manter Firestore como fonte persistente; não reintroduzir cache manual global em localStorage.
- Datas de negócio usam chaves locais; timestamps de auditoria continuam sendo instantes ISO/epoch.
- Dia operacional do Trabalho usa corte fixo às 06:00; 00:00–05:59 pertence ao turno iniciado no dia anterior.
- Score geral redistribui pesos apenas entre módulos participantes; módulo habilitado sem atividade continua pontuando zero.
- Conflitos cloud não podem ser resolvidos por sobrescrita silenciosa; alterações independentes devem ser preservadas.

---

### Task 0: Baseline, isolamento do worktree e contratos de regressão

**Files:**
- Read-only: package.json, CONCURSO/package.json, AI_CONTEXT.md
- Test: existing affected test files listed in the tasks below

**Interfaces:**
- Produces a clean baseline report; does not modify application behavior.

- [ ] Step 1: Registrar o estado atual sem capturar alterações alheias

Run:

~~~powershell
git status --short
git diff --stat
~~~

Expected: as alterações já existentes permanecem identificadas e não entram no escopo desta remediação.

- [ ] Step 2: Executar a baseline dos testes diretamente relacionados

Run:

~~~powershell
npm run test:ci -- tests/stores/workStore.test.ts tests/stores/aulasStore.test.ts tests/stores/restStore.test.ts tests/stores/readingStore.test.ts tests/hooks/usePomodoroTimer.test.tsx tests/components/views/JournalView.test.tsx tests/components/views/RestView.test.tsx tests/components/views/PomodoroView/DailyPomodoroReset.test.tsx tests/components/skills/VisualRoadmapEditor.test.tsx tests/services/weeklySnapshot.test.ts
~~~

Expected: registrar pass/fail por arquivo; falhas preexistentes não devem ser atribuídas às tarefas novas.

- [ ] Step 3: Confirmar os gates disponíveis

Run:

~~~powershell
npm run build
npm --prefix CONCURSO run test
npm --prefix CONCURSO run build
~~~

Expected: baseline documentada antes das alterações. Se o ambiente bloquear spawn/config, classificar como bloqueio de ambiente, não alterar código para contorná-lo.

- [ ] Step 4: Criar um checkpoint de trabalho somente se o worktree estiver isolado

Não fazer commit das alterações existentes do usuário. Cada tarefa posterior deverá usar staging explícito e commit próprio.

---

### Task 1: Chaves de data locais e dia operacional do Trabalho

**Files:**
- Modify: utils/dateUtils.ts, stores/work/trackingSlice.ts, stores/workStore.ts
- Modify: components/views/habits/hooks/useHabitsManager.ts, components/views/habits/HabitsPanel.tsx, components/habits/HabitCard.tsx, components/habits/WaterTracker.tsx, components/progress/HabitsProgressSection.tsx, components/views/ProgressView.tsx, components/views/RestView.tsx, components/views/RestActivityInput.tsx, components/progress/MoodEvolutionChart.tsx
- Test: tests/utils/dateUtils.test.ts, tests/stores/workStore.test.ts, tests/components/views/RestView.test.tsx

**Interfaces:**
- Add getOperationalDateISO(date: Date, cutoffHour = 6): string to utils/dateUtils.ts.
- Keep formatDateISO(date) for datas civis comuns; usar getOperationalDateISO somente no domínio Trabalho.

- [ ] Step 1: Escrever testes de data antes da implementação

Cover:

~~~ts
expect(getOperationalDateISO(localDateAt(2026, 7, 27, 5, 59))).toBe('2026-07-26');
expect(getOperationalDateISO(localDateAt(2026, 7, 27, 6, 0))).toBe('2026-07-27');
expect(formatDateISO(localDateAt(2026, 7, 27, 23, 30))).toBe('2026-07-27');
~~~

Use vi.setSystemTime e construção explícita de datas locais; não dependa do timezone da máquina.

- [ ] Step 2: Fazer o teste falhar no estado atual

Run:

~~~powershell
npm run test:ci -- tests/utils/dateUtils.test.ts tests/stores/workStore.test.ts
~~~

Expected: falha nos casos de corte operacional e nos casos que usam toISOString() como chave de negócio.

- [ ] Step 3: Implementar a fonte de verdade de data

Implementar getOperationalDateISO subtraindo um dia quando a hora local estiver antes do corte. Substituir apenas usos de toISOString().split('T')[0] que representam dias de negócio; manter toISOString() para timestamps reais.

- [ ] Step 4: Corrigir hidratação do Trabalho

Calcular todayOperationalKey com corte às 06:00. Quando lastActiveDate for null, tratar os contadores diários como desconhecidos e inicializá-los em zero, preservando histórico e metas semanais. Quando a chave mudar, zerar apenas os contadores do dia.

- [ ] Step 5: Validar timezone e regressão de UI

Run:

~~~powershell
npm run test:ci -- tests/utils/dateUtils.test.ts tests/stores/workStore.test.ts tests/components/views/RestView.test.tsx
~~~

Expected: nenhum registro criado às 21h–23h em America/Sao_Paulo migra para o dia seguinte; turno 22h–06h mantém a mesma chave operacional.

- [ ] Step 6: Commitar somente o lote de datas

~~~powershell
git add utils/dateUtils.ts stores/work/trackingSlice.ts stores/workStore.ts components/views/habits components/habits/HabitCard.tsx components/habits/WaterTracker.tsx components/progress/HabitsProgressSection.tsx components/views/ProgressView.tsx components/views/RestView.tsx components/views/RestActivityInput.tsx components/progress/MoodEvolutionChart.tsx tests/utils/dateUtils.test.ts tests/stores/workStore.test.ts tests/components/views/RestView.test.tsx
git commit -m "fix: centralize local business date keys"
~~~

---

### Task 2: Merge de livros por capítulo sem perda offline

**Files:**
- Modify: stores/aulasStore.ts and the existing book/chapter type definition used by that store
- Test: tests/stores/aulasStore.test.ts, tests/components/views/AulasFeatures.test.tsx, tests/components/views/BookshelfSearch.test.ts

**Interfaces:**
- Add optional per-entity metadata updatedAt: number and deletedAt?: number to persisted book/chapter records.
- Keep mergeBooksByRecency(base, incoming) as the entry point, but make it perform entity-level merge instead of whole-book replacement.

- [ ] Step 1: Escrever o caso de regressão offline

Create a local book with a newer chapter, hydrate an older remote book, and assert that the newer local chapter remains while unrelated remote chapters are added.

- [ ] Step 2: Testar conflito do mesmo capítulo e remoção

Assert that the larger updatedAt wins, a timestamp tie keeps the local value, and a deletedAt tombstone prevents a deleted chapter from being resurrected by an older remote payload.

- [ ] Step 3: Implementar normalização de metadados legados

For records without timestamps, derive a migration timestamp from the parent book timestamp or 0; do not discard existing content. Preserve tombstones in the persisted shape.

- [ ] Step 4: Implementar merge determinístico

Merge books by ID, chapters by stable chapter ID/slug, and comments/questions by their existing stable IDs. Retain entities absent from one side unless an explicit tombstone exists. Use local data on equal timestamps to avoid destroying unsynced edits.

- [ ] Step 5: Provar hidratação e busca após merge

Run:

~~~powershell
npm run test:ci -- tests/stores/aulasStore.test.ts tests/components/views/AulasFeatures.test.tsx tests/components/views/BookshelfSearch.test.ts
~~~

Expected: save/hydrate preserves all chapters and the search index sees the merged result.

- [ ] Step 6: Commitar o merge de Aulas

~~~powershell
git add stores/aulasStore.ts types tests/stores/aulasStore.test.ts tests/components/views/AulasFeatures.test.tsx tests/components/views/BookshelfSearch.test.ts
git commit -m "fix: merge aula books at chapter level"
~~~

---

### Task 3: Sincronização concorrente do Concurso sem sobrescrita silenciosa

**Files:**
- Create: CONCURSO/src/app/snapshotMerge.ts
- Modify: CONCURSO/src/app/types.ts, CONCURSO/src/app/cloudStorage.ts, CONCURSO/src/app/AppContext.tsx
- Test: CONCURSO/src/tests/snapshot.test.ts, create CONCURSO/src/tests/snapshotMerge.test.ts, CONCURSO/src/tests/AppContext.performance.test.tsx

**Interfaces:**
- Add mergeSnapshots(base, local, remote): { merged: AppSnapshot; conflicts: SnapshotConflict[] }.
- Add SnapshotConflict { id, path, baseValue, localValue, remoteValue, detectedAt }.
- Add resolveSnapshotConflict(id, resolution: 'local' | 'remote') to the sync context.

- [ ] Step 1: Definir os casos de merge em teste

Cover independent map keys, independent array entities, same-field divergence, identical edits, and a remote revision arriving between local read and save.

- [ ] Step 2: Implementar merge por caminho

Merge maps by key and arrays by stable entity ID. Preserve both independent changes. For the same scalar/entity field, retain a deterministic value in the merged snapshot and emit a conflict record instead of silently discarding the other value.

- [ ] Step 3: Integrar leitura, gravação e retry

Track the base remote revision loaded by the client. Before saving, compare the remote lastChangedAt; if changed, read the newest snapshot, merge, persist the merged result, and expose conflicts. Never import the whole remote snapshot solely because it has a newer timestamp.

- [ ] Step 4: Persistir conflict state across reload

Bump the Concurso schema version and normalize missing conflict arrays during import. Add a compact conflict surface in the existing shell; resolving a conflict must update the merged state and create a new snapshot revision.

- [ ] Step 5: Validar concorrência e compatibilidade

Run:

~~~powershell
npm --prefix CONCURSO run test -- snapshot.test.ts snapshotMerge.test.ts AppContext.performance.test.tsx
npm --prefix CONCURSO run build
~~~

Expected: two clients editing different domains preserve both changes; same-field conflicts are visible and resolvable.

- [ ] Step 6: Commitar a sincronização do Concurso

~~~powershell
git add CONCURSO/src/app CONCURSO/src/tests/snapshot.test.ts CONCURSO/src/tests/snapshotMerge.test.ts CONCURSO/src/tests/AppContext.performance.test.tsx
git commit -m "fix: merge concurso snapshots without silent loss"
~~~

---

### Task 4: Hábitos com mutação atômica e gravação única

**Files:**
- Modify: stores/habitsStore.ts, components/views/habits/hooks/useHabitsManager.ts
- Test: create tests/stores/habitsStore.test.ts, create tests/components/views/habits/useHabitsManager.test.tsx

**Interfaces:**
- toggleHabitCompletion(habitId, dateKey, subHabitId?) becomes the only action responsible for the completion mutation and derived parent/subhabit state.

- [ ] Step 1: Escrever testes de comportamento e de persistência

Assert parent/subhabit completion, exactly one writeToFirestore call per user action, and no overwrite when a second state change occurs before React rerenders.

- [ ] Step 2: Mover toda a decisão para o store

Use one Zustand set transaction to calculate the next history and subhabit state. Perform one sync after the transaction. Keep activity tracking outside the persisted mutation but execute it with the resulting state.

- [ ] Step 3: Simplificar o hook

Remove the stale habits read and the follow-up updateHabit; the hook passes the local date key and optional subhabit ID to the atomic action.

- [ ] Step 4: Validar e commitar

~~~powershell
npm run test:ci -- tests/stores/habitsStore.test.ts tests/components/views/habits/useHabitsManager.test.tsx
git add stores/habitsStore.ts components/views/habits/hooks/useHabitsManager.ts tests/stores/habitsStore.test.ts tests/components/views/habits/useHabitsManager.test.tsx
git commit -m "fix: make habit completion atomic"
~~~

---

### Task 5: Descanso e Analytics com uma única fonte de verdade

**Files:**
- Modify: utils/competition/scoreCalculator.ts, stores/restStore.ts, components/views/RestView.tsx, services/weeklySnapshot.ts, components/progress/MoodEvolutionChart.tsx, components/progress/FinalJourneySummary.tsx
- Test: tests/stores/restStore.test.ts, tests/components/views/RestView.test.tsx, tests/services/weeklySnapshot.test.ts, tests/services/weeklySnapshotPhase3.test.ts, create tests/components/progress/MoodEvolutionChart.test.tsx

**Interfaces:**
- Add shared pure helpers for getRestCompletionForDate(activity, dateKey) and getRestSeriesCompletionForDate(activity, seriesId, dateKey).
- calculateRestBreakdown consumes those helpers rather than reading only completedAt.

- [ ] Step 1: Escrever regressões de Rest

Cover recurring daily, weekly, once, and series activities; assert that UI completion and competition score agree for the same date.

- [ ] Step 2: Corrigir score e datas do Rest

Use history/seriesHistory for recurring activities and retain timestamp fallback only for legacy once activities. Make all Rest date keys use local date formatting.

- [ ] Step 3: Corrigir reorder da lista filtrada

Reorder only the visible IDs while retaining hidden activities in their existing global slots; then renumber the complete list once. Add a test where daily and weekly activities are interleaved.

- [ ] Step 4: Corrigir resumo final e humor

Aggregate weekly page/book deltas across snapshots, use null for missing mood days, and keep local date keys. Redistribute score weights only when a category has no configured/participating data; an enabled category with zero activity remains zero.

- [ ] Step 5: Validar métricas

~~~powershell
npm run test:ci -- tests/stores/restStore.test.ts tests/components/views/RestView.test.tsx tests/services/weeklySnapshot.test.ts tests/services/weeklySnapshotPhase3.test.ts tests/components/progress/MoodEvolutionChart.test.tsx
~~~

Expected: Rest score matches visible completion, final totals are sums of weekly deltas, and no-data mood points do not create artificial zero drops.

- [ ] Step 6: Commitar o lote de métricas

~~~powershell
git add utils/competition/scoreCalculator.ts stores/restStore.ts components/views/RestView.tsx services/weeklySnapshot.ts components/progress/MoodEvolutionChart.tsx components/progress/FinalJourneySummary.tsx tests/stores/restStore.test.ts tests/components/views/RestView.test.tsx tests/services/weeklySnapshot.test.ts tests/services/weeklySnapshotPhase3.test.ts tests/components/progress/MoodEvolutionChart.test.tsx
git commit -m "fix: align rest and progress metrics"
~~~

---

### Task 6: Reading com progresso consistente e validação de entrada

**Files:**
- Modify: stores/readingStore.ts, components/views/ReadingView.tsx, components/views/reading/BookForm.tsx
- Test: tests/stores/readingStore.test.ts, create tests/components/views/ReadingView.test.tsx

**Interfaces:**
- Centralize progress mutation in one store action that appends the log, clamps progress, and derives COMPLETED when current >= total.

- [ ] Step 1: Escrever regressões

Cover addReadingLog finishing a book, drag-to-completed, blank title/author, nonpositive total, and whitespace-only folder name.

- [ ] Step 2: Implementar a transição de progresso

Reuse the same completion rule for updateProgress, addReadingLog, and status drag. Dragging to COMPLETED sets current to total; moving away from completed does not silently reduce current.

- [ ] Step 3: Validar formulários

Trim title/author/folder names, require nonempty title and author, require finite total > 0, and disable save with an accessible validation message.

- [ ] Step 4: Validar e commitar

~~~powershell
npm run test:ci -- tests/stores/readingStore.test.ts tests/components/views/ReadingView.test.tsx
git add stores/readingStore.ts components/views/ReadingView.tsx components/views/reading/BookForm.tsx tests/stores/readingStore.test.ts tests/components/views/ReadingView.test.tsx
git commit -m "fix: keep reading progress and status consistent"
~~~

---

### Task 7: Pomodoro sem cascata e sem rerender desnecessário

**Files:**
- Modify: components/views/PomodoroView/hooks/usePomodoroTimer.ts, components/views/PomodoroView/components/SkillFocusSelector.tsx, components/TimerWidget.tsx
- Test: tests/hooks/usePomodoroTimer.test.tsx, tests/components/views/PomodoroView/DailyPomodoroReset.test.tsx, create tests/components/views/PomodoroView/TimerReconciliation.test.tsx

**Interfaces:**
- Add a pure transition/reconciliation function that receives timer state and now and returns the next state plus completed transitions.
- Expose timer actions separately from the one-second clock subscription so SkillFocusSelector does not subscribe to timeLeft.

- [ ] Step 1: Escrever testes de expiração

Cover one expired pomodoro, an expired pomodoro with auto-break, a long inactive period, task change, task clear, and explicit reset. Assert no state produced has an endTime in the past.

- [ ] Step 2: Implementar transição monotônica

Use the previous interval endTime as the next transition timestamp, process elapsed phases through a bounded reconciliation loop, and when the bound is reached restart the current phase from now instead of scheduling a zero-delay cascade.

- [ ] Step 3: Preservar timer ao trocar tarefa

Changing or clearing the selected task must preserve the running timer; only the explicit reset action clears elapsed time. A completed interval without task remains valid but has no task association.

- [ ] Step 4: Separar ações do relógio

Move clock-only state into the timer display hook/component. SkillFocusSelector consumes stable actions and active-state selectors only.

- [ ] Step 5: Validar e commitar

~~~powershell
npm run test:ci -- tests/hooks/usePomodoroTimer.test.tsx tests/components/views/PomodoroView/DailyPomodoroReset.test.tsx tests/components/views/PomodoroView/TimerReconciliation.test.tsx
git add components/views/PomodoroView/hooks/usePomodoroTimer.ts components/views/PomodoroView/components/SkillFocusSelector.tsx components/TimerWidget.tsx tests/hooks/usePomodoroTimer.test.tsx tests/components/views/PomodoroView/DailyPomodoroReset.test.tsx tests/components/views/PomodoroView/TimerReconciliation.test.tsx
git commit -m "fix: reconcile pomodoro timers monotonically"
~~~

---

### Task 8: UX mobile, touch interaction e shell flutuante

**Files:**
- Modify: components/views/AulasView/Bookshelf.tsx, components/skills/VisualRoadmapEditor.tsx, components/skills/RoadmapSection.tsx, components/views/JournalView.tsx, components/views/SundayView.tsx, components/shared/TabBar.tsx, components/TimerWidget.tsx, components/SundayTimerWidget.tsx, components/TaskNotificationWidget.tsx, components/views/LinksView.tsx, components/links/LinkModal.tsx
- Create: components/shared/FloatingWidgetStack.tsx
- Test: existing tests/components/skills/VisualRoadmapEditor.test.tsx, tests/components/skills/RoadmapSection.test.tsx, tests/components/games/StoriesPanel.test.tsx, create focused mobile interaction tests under tests/components/mobile/

**Interfaces:**
- Use Pointer Events for custom roadmap dragging and retain keyboard reorder as an alternative.
- Configure Aulas TouchSensor with a 250ms activation delay and 5px tolerance; apply touch-action: none only to the drag handle.
- FloatingWidgetStack owns default placement; child widgets render in normal flow when stacked.

- [ ] Step 1: Escrever testes de interação

Cover touch/pointer drag, keyboard alternative, visible edit controls without hover, stacked widgets, link search by title/URL, and rejection of invalid URLs.

- [ ] Step 2: Corrigir drag e scroll mobile

Replace mouse-only roadmap movement with pointer capture. Add a non-drag reorder action for touch/keyboard. Configure the Aulas sensor without stealing ordinary vertical scroll.

- [ ] Step 3: Corrigir viewport e layout do Journal

Replace fixed 100vh composition with 100dvh plus min-h-0/scroll containers. On narrow screens use a list/editor toggle with a back control; keep save/delete actions reachable above the keyboard.

- [ ] Step 4: Remover dependência de hover

Make Sunday edit/remove controls visible or focusable on touch, enlarge critical hit areas to at least 44px where practical, and keep labels/ARIA descriptions intact. The 44px target is a usability target; do not claim a WCAG violation solely from being below 44px. See WCAG 2.2.

- [ ] Step 5: Corrigir Links e widgets

Search site name, link title, and URL. Trim and parse URLs before save, route opening through the existing sanitizer, and show validation feedback. Stack Timer, Sunday Timer, and notifications so their collapsed and expanded states cannot share the same bottom-right coordinates.

- [ ] Step 6: Validar em larguras reais

Run root dev server and manually verify at 320px, 360px, 390px, and 430px with keyboard open, touch scrolling, long press, drag, and widget expansion. Run Concurso E2E separately when its changes are involved:

~~~powershell
npm --prefix CONCURSO run test:e2e
~~~

- [ ] Step 7: Commitar o lote mobile

~~~powershell
git add components/views/AulasView/Bookshelf.tsx components/skills/VisualRoadmapEditor.tsx components/skills/RoadmapSection.tsx components/views/JournalView.tsx components/views/SundayView.tsx components/shared/TabBar.tsx components/TimerWidget.tsx components/SundayTimerWidget.tsx components/TaskNotificationWidget.tsx components/views/LinksView.tsx components/links/LinkModal.tsx components/shared/FloatingWidgetStack.tsx tests/components/skills tests/components/mobile
git commit -m "fix: make core interactions mobile safe"
~~~

---

### Task 9: Performance medida após correção funcional

**Files:**
- Modify: components/views/AulasView/Bookshelf.tsx, CONCURSO/src/pages/CleanConcursoPage.tsx, components/views/ProgressView.tsx, components/progress/HabitsProgressSection.tsx, components/games/stories/StoriesTimeline.tsx
- Test: CONCURSO/src/tests/AppContext.performance.test.tsx, create tests/performance/BookshelfSearch.perf.test.ts, create tests/components/progress/ProgressSelectors.test.tsx

**Interfaces:**
- Search index builder runs only when the search surface is open or query is nonempty.
- Progress selectors expose stable derived inputs so unrelated store updates do not invalidate expensive calculations.

- [ ] Step 1: Medir antes de otimizar

Use React Profiler and deterministic datasets: 500 bookshelf entries, 245 Concurso days, 30-day habit history, and 200 story cards. Record render count and duration for typing, timer ticks, and unrelated store updates.

- [ ] Step 2: Corrigir o índice da Estante

Do not build the full markdown/comment/question index while search is closed. Memoize only on book content identity and query state.

- [ ] Step 3: Dividir o Concurso por boundaries de responsabilidade

Extract calendar derivation, review queues, search results, and card lists into focused hooks/components while keeping CleanConcursoPage as the composition root. Preserve useDeferredValue and existing selectors.

- [ ] Step 4: Estabilizar Progress

Memoize activeHabits, narrow subscriptions, and prevent seven-day/thirty-day calculations from invalidating on unrelated store changes. Do not virtualize until profiling proves list size is the bottleneck.

- [ ] Step 5: Validar ganhos sem benchmark frágil

Assert that closed search performs zero index builds, timer-only updates do not rerender unrelated Progress sections, and typing does not recompute unrelated Concurso derivations. Compare profiler output with the Task 9 baseline.

- [ ] Step 6: Commitar somente otimizações comprovadas

~~~powershell
git add components/views/AulasView/Bookshelf.tsx CONCURSO/src/pages/CleanConcursoPage.tsx components/views/ProgressView.tsx components/progress/HabitsProgressSection.tsx components/games/stories/StoriesTimeline.tsx CONCURSO/src/tests/AppContext.performance.test.tsx tests/performance/BookshelfSearch.perf.test.ts tests/components/progress/ProgressSelectors.test.tsx
git commit -m "perf: reduce derived work in large views"
~~~

---

### Task 10: Gate final, revisão e rollout

**Files:**
- Read-only: AI_CONTEXT.md, README.md, all changed files
- Test: all affected tests from Tasks 1–9

- [ ] Step 1: Rodar a suíte raiz completa

~~~powershell
npm run test:ci
npm run build
~~~

Expected: all root tests and production build pass.

- [ ] Step 2: Rodar a suíte Concurso completa

~~~powershell
npm --prefix CONCURSO run lint
npm --prefix CONCURSO run test
npm --prefix CONCURSO run build
~~~

Expected: lint, unit tests, E2E when configured and build pass without unexpected changes to public/concurso.

- [ ] Step 3: Fazer a validação manual de roundtrip

For Aulas, Hábitos, Rest, Reading, Work and Concurso: edit locally, force/reproduce hydration, reload, and confirm the expected value survives. Test two tabs/devices for independent and conflicting edits.

- [ ] Step 4: Fazer revisão diff-first

~~~powershell
git diff --check
git status --short
git diff --stat
~~~

Confirmar que nenhum arquivo de usuário não relacionado foi incluído e que nenhuma API, chave Firestore ou dado legado foi removido sem migração.

- [ ] Step 5: Publicar somente mediante solicitação explícita

O plano termina com commits locais validados. Push, merge em main ou publicação do Concurso ficam fora deste plano até haver autorização explícita e uma revisão final do diff.

## Acceptance Criteria

- Nenhum uso de toISOString().split('T')[0] permanece como chave de negócio sem justificativa documentada.
- Um capítulo local mais novo não é perdido quando uma versão cloud mais antiga é hidratada.
- Edições concorrentes do Concurso não são apagadas sem conflito visível.
- Rest, Progress e Reading exibem os mesmos estados que seus cálculos persistentes.
- Pomodoro nunca cria estado com endTime passado após reconciliação.
- Hidratação sem lastActiveDate não mantém contador diário desconhecidamente antigo.
- Interações críticas funcionam por mouse, teclado e touch; nenhum controle essencial depende apenas de hover.
- Os cenários mobile de 320–430px funcionam com teclado aberto e widgets simultâneos.
- Performance só é considerada melhor quando a medição pós-implementação supera a baseline sem regressão funcional.

## Assumptions and Defaults

- O plano completo foi escolhido em vez de limitar-se a P0.
- O corte operacional do Trabalho é fixo às 06:00 nesta primeira versão; não será criado painel de configuração sem novo requisito.
- Pesos do score são redistribuídos apenas quando a categoria não participa do ciclo; categoria participante sem atividade continua com zero.
- Conflitos iguais no mesmo campo geram registro explícito; alterações independentes são mescladas por entidade/campo.
- A implementação deve ser feita em commits pequenos, com staging explícito, preservando o worktree já modificado.

