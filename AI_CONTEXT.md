# Agent guidelines

## Critical Rules

- Put non-negotiable safety, data, and production constraints first.
- If a rule is labeled `CAVEAT`, `IMPORTANT`, `DO NOT CHANGE`, or equivalent in project docs, rule files, or nearby code comments, it overrides general best practices.
- Keep always-loaded instructions concise; move long procedures and domain details into linked or scoped documents.

## Agent Behavior & Workflow

- Self-correction: treat the first iteration as a draft. run the relevant tests or checks to verify the solution. If not, manually review the generated code for obvious edge cases before finishing.
- Surgical changes: output only the necessary changes. Do not rewrite entire files just to change a few lines.

## Context Routing & Precedence

- Progressive disclosure: before making architectural decisions, inspect the neighboring code to understand local conventions. If project documentation exists, read it too. If docs conflict with the code, treat the code as the source of truth and flag the inconsistency.
- Context routing: use this file as an entry point, not as the only source of truth. If working on a specific domain, first locate and read that domain’s documentation and nearest analogous implementation before proposing changes.
- Living context: after any meaningful change, update the relevant context files so a future session can understand the current state without rediscovery.

## Code style

**Performance baseline**
- Default to `O(1)` lookups. Use Sets for uniqueness checks and Maps/Dicts for key-value grouping.
- Never use nested loops (`O(n^2)`) for data transformation if a flat approach with a hash map is possible.

**Functions**
- 4–20 lines per function. Split anything longer by responsibility.
- One function, one job. If you need "and" to describe it, split it.
- Early returns over nested ifs. Max 2 levels of indentation inside a function body.

**Files**
- Under 500 lines. Split by responsibility, not by size alone.
- One module, one responsibility (SRP). No god files.
- Predictable paths: follow the framework convention (`controller/model/view`,
  `src/lib/test`, etc.).

**Naming**
- Names must be specific and unique. Avoid `data`, `handler`, `Manager`, `utils`, `helpers`.
- A good name returns fewer than 5 `grep` hits across the codebase.
- Boolean names start with `is`, `has`, or `can` (`isLoading`, `hasPermission`).

**Types**
- Explicit types everywhere. No `any`, no untyped `Dict`, no untyped function signatures.
- Prefer domain types over primitives: `UserId` over `string`, `Price` over `number`.

**Duplication & indirection**
- No copy-pasted logic. Extract shared behaviour into a named function or module.
- Three identical call sites is the threshold — extract on the third occurrence, not the first.

**Error messages**
- Always include the offending value and the expected shape.
  - Bad: `raise ValueError("Invalid input")`
  - Good: `raise ValueError(f"Expected ISO-8601 date, got {value!r}")`

## Comments

- Keep every comment you write. Do not strip comments during refactors — they carry
  intent and provenance.
- Write **why**, not what. Skip `// increment counter` above `i++`.
- Docstrings on every public function: state the intent and include one usage example.
- When a line exists because of a specific bug or upstream constraint, reference
  the issue number or commit SHA inline.
  ```python
  # Workaround for upstream bug: github.com/org/lib/issues/42 (fixed in v2.1, pending upgrade)
  ```

## Tests

- All tests run with a single command. Document that command at the top of the README.
- Every new function gets a test. Every bug fix gets a regression test.
- Mock external I/O (API, DB, filesystem) with named fake classes, not inline stubs.
  ```python
  class FakePaymentGateway:      # not: mock.patch("stripe.charge")
      def charge(self, amount): ...
  ```
- Tests must be F.I.R.S.T:
  - **Fast** — no real network or disk I/O.
  - **Independent** — no shared mutable state between tests.
  - **Repeatable** — same result on any machine, any run order.
  - **Self-validating** — pass or fail, no human interpretation required.
  - **Timely** — written alongside the code, not after the PR is merged.
- Name tests so the failure message is a complete sentence:
  `test_order_total_includes_tax_when_region_is_eu`

## Error handling

- Handle errors at the boundary where you have enough context to act.
- Do not swallow exceptions silently. Log or re-raise with added context.
- Distinguish recoverable errors (retry/fallback) from programming errors (panic/crash).
- Never use exceptions for control flow in the happy path.

## Dependencies

- Inject dependencies through the constructor or function parameters. No globals,
  no module-level singletons.
- Wrap every third-party library behind a thin interface owned by this project.
  Internals depend on that interface, not on the library directly. Swapping the
  vendor requires changing only the adapter.
- Pin dependency versions in lock files. Review diffs on upgrades.

## Structure

- Follow the framework's established layout (Rails, Django, Next.js, etc.).
- Small, focused modules over large, catch-all files.

## Formatting

Run the language-default formatter before every commit. Do not discuss style
beyond what the formatter enforces.

| Language   | Formatter         |
|------------|-------------------|
| Rust       | `cargo fmt`       |
| Go         | `gofmt`           |
| JavaScript | `prettier`        |
| Python     | `black`           |
| Ruby       | `rubocop -A`      |

If there is no formatter, agree on one and add it to CI.

## Logging

- **Structured JSON** for all internal/observability logs. Include a `level`,
  `timestamp`, and a `context` object with relevant IDs on every line.
- **Plain text** only for user-facing CLI output.
- Log at the right level: `DEBUG` for tracing, `INFO` for lifecycle events,
  `WARN` for recoverable issues, `ERROR` for failures that need attention.
- Never log secrets, tokens, PII, or raw request bodies.

## Security

- Validate and sanitise all input at the entry point (API boundary, CLI args, env vars).
- Never interpolate user input into queries, shell commands, or HTML. Use
  parameterised queries and escaping utilities.
- Secrets come from environment variables or a secrets manager. Never hard-code
  them, never commit them.
- Apply least-privilege: request only the permissions a module actually needs.

## Git hygiene

- One logical change per commit. Commits must build and pass tests in isolation.
- Commit message format: `<type>(<scope>): <short imperative summary>`
  Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.
- PR descriptions state **why** the change is needed, not just what changed.
- Do not merge with failing CI.

## Versioning

- Any change merged into `main` must update the displayed UI version label, starting from `1.4.0`.
- Choose the version bump based on the size of the change: small fixes use patch bumps, feature additions use minor bumps, and breaking changes use major bumps.
- Keep the version text in sync wherever the app renders the release badge or monthly update label.

## 2026-04-25 Concurso clean module

- The app root dashboard card `ViewState.CONCURSO` now opens `/concurso/#/`.
- As of 2026-04-30, the clean module is the only accessible concurso surface: `/concurso/#/` renders `CleanConcursoPage`, and previous standalone routes redirect back to `/`.
- The clean module lives at `CONCURSO/src/pages/CleanConcursoPage.tsx`, with pure scheduling helpers in `CONCURSO/src/app/cleanConcursoModule.ts`.
- Manual block failures are persisted through `manualBlockReschedules` and now prefer the next compatible manual day by inferred subject before falling back to the next manual day.
- Calendar event completion/failure state is persisted in `calendarEventProgress`; marking a calendar event done updates linked topic progress/review dates, and failed manual blocks remain visible on the original date while `manualBlockReschedules` reorganizes the plan.
- The clean module is deterministic UI/state logic; it does not require an AI model call.
- Rest days in the clean calendar keep their fixed-rest event, but now expose a persisted daily note field for optional subject or future review planning through `dailyRecords.notes`.

## 2026-05-25 Task expiration notification widget

- Added a floating notification widget `TaskNotificationWidget` to the bottom right of the home page (Dashboard).
- The widget scans active tasks (`!task.isCompleted && !task.isArchived`) and filters those that have `dueDate` set exactly at 0 (today), 1 (tomorrow), or 3 days remaining.
- Clicking the notification FAB toggles a popover containing the list of tasks.
- Supports direct actions on each task: toggling completion (which marks it complete and archives it, and tracks streak activity), editing (opening native `TaskModal`), and deleting.
- Resolves layout collision: if `TimerWidget` (Pomodoro timer) is active, the widget automatically shifts from `bottom-6` to `bottom-24` to stack vertically.

## 2026-05-26 Notes checklist paste

- `EditableMarkdown` inserts pasted markdown as rendered HTML directly into the contentEditable area instead of relying on `document.execCommand('insertText')` plus `innerText` reconstruction.
- Checklist paste regressions should cover the full paste path: markdown text -> rendered editor HTML -> saved markdown -> reopened renderer.
- `markdownUtils.normalizeMarkdownForStorage` repairs legacy checklist artifacts such as a stray `-` before a checklist and paragraph lines like ` - [ ] item`; `NoteEditor` runs this normalization before saving.

## 2026-05-26 Aulas difficult questions

- `AulaChapter.difficultQuestions` stores question numbers that need extra-care review independently from correct/incorrect status.
- In `ChapterView`, right-clicking a question pill toggles that difficult marker and suppresses the browser context menu.
- Difficult question pills render with an amber ring/dot so duplicates of the same question in principal, section, or secondary lists are visually marked together.

## 2026-06-22 Aulas mathematical formulas

- `utils/aulasMarkdown.normalizeAulasMathMarkdown` converts legacy AI-generated display formulas delimited by standalone `[` and `]` lines into `$$` blocks before `remark-math` processes chapter content.
- The normalization is render-only, preserving saved lesson markdown and ordinary Markdown links or bracketed prose.


## 2026-06-22 Aulas random questions modal layout

- `RandomQuestionsModal` is capped to the dynamic viewport height and uses a flex-column shell.
- Its header and footer remain visible while the central content owns vertical scrolling, preventing filters or actions from falling outside shorter screens.
