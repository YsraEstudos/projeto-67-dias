# Universal Agent Guidelines (The AI Bible)

This document defines the core behavioral, security, design, and coding constraints. These rules are universally applicable to ensure high-quality, maintainable, and correct code output.

## Rule Precedence

Apply instructions in this order:
1. The user's explicit task requirements.
2. Repository-level rule files and project documentation.
3. More specific rule files or documentation in the affected directory.
4. Explicit constraints marked `CAVEAT`, `IMPORTANT`, `DO NOT CHANGE`, or equivalent, when they are relevant and not contradicted by a higher-priority rule.
5. Existing local code conventions.

Treat nearby code comments as context, not absolute authority, unless they clearly define a current technical or business constraint.

When a rule applies only to a specific language, subsystem, framework, or workflow, place it in a path- or context-scoped rule file rather than the universal core.

## Agent Behavior & Workflow

* **Verification over assumption:** Treat the first implementation as a draft. Before presenting the result, run the repository's applicable verification checks. If no relevant checks exist or they cannot be run, say so explicitly.
* **Surgical edits:** Make only the modifications necessary for the requested change. Do not rewrite, reformat, or restate unrelated files, functions, or code.
* **Fail gracefully:** If a command or test fails, inspect its output and address the root cause. Do not repeatedly guess at fixes. If blocked by missing information, permissions, or an external dependency, state the blocker and the assumption made.
* **Enforcement over instruction:** When a behavior must happen deterministically, prefer hooks, CI, generators, linters, type-checkers, tests, or scanners over prompt-only instructions. Rely on the repository's active tooling for styling and type-checking rather than debating stylistic prompts.

## Security and Configuration

* Never commit, print, log, or embed real secrets, credentials, tokens, or sensitive internal URLs.
* Read secrets and environment-dependent values through the repository's approved configuration mechanism.
* When adding required configuration, update the relevant example/config schema and documentation.
* Use existing secret-scanning, validation, and CI checks; instructions are not a substitute for enforcement.

## External Integrations & Canonical References

* Before changing an external API, SDK, CLI, or domain integration, consult the repository's canonical integration documentation and, when necessary, the official documentation for the version in use.
* Do not invent endpoints, methods, parameters, versions, or capabilities.
* Prefer the existing client, generated types, schemas, and integration tests. If documentation is missing or ambiguous, state the assumption rather than guessing.

## Shared-State Changes

* For changes that write shared or persistent state, follow the repository's existing transaction, locking, idempotency, validation, and retry conventions.
* Add or update tests for relevant failure, rollback, and concurrency cases when applicable.

## Code Style

* Follow the repository's existing formatter, linter, naming, directory, and framework conventions. Do not introduce style-only rewrites in a functional change.
* Prefer small, cohesive functions and modules. Treat 4–20 lines per function and 500 lines per handwritten production module as review targets, not hard limits.
* Split code when responsibilities, dependencies, or reasons to change are independent. Do not split cohesive workflows merely to satisfy a line-count rule.
* Prefer guard clauses and early returns when they reduce nesting. Avoid more than two logical control-flow levels in new business logic unless deeper nesting makes resource lifetime, transactions, or error handling clearer.
* Keep module paths predictable. Follow the repository's structure first; use framework conventions when the repository has no established alternative.

## Data Transformations and Performance

* For repeated membership checks, grouping, or joins over in-memory collections, prefer an appropriate Set, Map, dictionary, index, or database query over repeated linear scans.
* Avoid avoidable repeated scans inside loops when an index can preserve correctness and substantially improve complexity.
* Nested loops are acceptable for inherently pairwise, matrix, cross-product, bounded-small-data, or clearer algorithms. Do not optimize solely to remove nesting.
* Preserve required ordering, memory limits, and semantics. Profile or benchmark performance-sensitive paths before introducing non-obvious optimization.

## Naming

* Use names that describe the domain role, action, or invariant and are distinctive within their module and search context.
* Avoid vague catch-all modules or identifiers such as `utils`, `helpers`, `data`, or generic `manager` unless they are established framework conventions or include a precise domain qualifier.
* Name boolean predicates clearly using the convention appropriate to the language and meaning, such as `is`, `has`, `can`, `should`, `was`, or `needs`.

## Types

* Make types explicit at public APIs and system boundaries: HTTP, CLI, database, queue, filesystem, external APIs, serialization, and complex domain operations.
* Allow local type inference when the inferred type is clear and preserves type safety.
* In TypeScript, do not introduce implicit `any`. Avoid explicit `any`; use `unknown` with runtime validation when input is uncertain.
* In Python, type public functions and structured data. Prefer domain models, `TypedDict`, `dataclass`, or typed mappings over untyped dictionaries when shape matters.
* Introduce domain-specific types for values whose accidental interchange would cause meaningful bugs, such as money, units, identifiers, or validated state.

## Duplication and Abstraction

* Do not duplicate business rules, validation rules, security policy, or protocol behavior that must remain consistent across call sites.
* Extract a shared abstraction when three similar call sites reveal a stable shared contract, or earlier when one policy must change atomically everywhere.
* Do not abstract code merely because it looks syntactically similar. Preserve separate implementations when their future changes are likely to diverge.

## Errors

* For validation and internal diagnostic errors, include the operation or field, the expected contract, and a safe summary of the received value.
* Redact, hash, omit, or truncate secrets, credentials, session identifiers, personal data, and large payloads.
* Keep user-facing errors safe and actionable; keep implementation detail in protected logs or structured diagnostics.

## Comments and Documentation

* **Preserve intent:** Preserve useful comments and docstrings during refactoring. Update or relocate them when surrounding code changes; remove them only when obsolete, inaccurate, redundant with clear code, or replaced by a more durable source of truth.
* **Explain why, not what:** Write comments to document the "why" and explain non-obvious logic, invariants, or external limitations. Never write comments that merely restate self-documenting code (e.g., `# Increment counter`).
* **Workarounds and Provenance:** When introducing code to fix a production incident, upstream bug, or version conflict, include a comment stating:
  * The reason for the workaround.
  * A stable issue, ticket, or commit reference.
  * The affected dependency/version and the removal condition (e.g., target upgrade version).
  * *A comment explains the exception; a regression test prevents its accidental removal.*
* **Do not leak data:** Never include real credentials, private URLs, customer data, or sensitive incident details in comments.

## Public APIs and Interfaces

* **Document boundaries:** Document stable consumer-facing contracts according to the language and repository convention. Describe behavior, constraints, side effects, and compatibility expectations when they are not evident from types or usage.
* **Document the contract:** State the intent, key parameters, expected return values, exceptions raised, and side effects. Do not add boilerplate docstrings that only repeat obvious signatures.
* **Conditional examples:** Include code usage examples only when the invocation, state requirements, or return semantics are complex or non-obvious. Prefer verified automated tests over documentation examples.

## Verification and Test Automation

* **Verification command:** Provide one documented, non-interactive command (e.g., `npm run verify` or `make verify`) that executes all fast deterministic checks (formatting, linting, type-checking, and unit tests) before presenting a change.
* **Readiness guarantee:** Do not claim a change is verified if the required checks could not run. The CI must execute the full required test matrix.

## Test Coverage and Regressions

* **Tested behavior:** Add or update tests for every behavior change that can fail (business rules, validation, serialization, errors, security). Test observable behavior through stable public interfaces; do not test trivial private helpers just for coverage.
* **Regression testing:** Every bug fix must include a regression test that fails before the fix is applied. If a deterministic test is not feasible, state why and add the nearest reliable automated coverage.

## External I/O and Test Doubles

* **Isolation boundary:** Unit tests must not call production services or depend on uncontrolled network access, shared databases, system time, randomness, or machine-specific environments.
* **Pragmatic doubles:** Prefer a reusable named fake for complex dependencies. Use focused stubs, mocks, spies, or patches only for one-off scenarios (e.g., timeouts, retries, or verifying side effects).
* **No scattered patching:** Do not scatter patches of third-party libraries. Wrap external services in thin project-owned adapters and test the adapter with focused integration tests.

## Test Qualities and Determinism

* **F.I.R.S.T. unit tests:** Keep unit tests Fast, Independent (no shared mutable state), Repeatable (order-independent), Self-validating, and Timely (written alongside code).
* **Deterministic environment:** Freeze or inject time, randomness, locale, timezone, and API responses to eliminate flakiness.
* **Cleanup and isolation:** New tests must not introduce shared mutable state, order dependence, or environment leakage, and must respect the repository's supported execution model.
* **Readable naming:** Name tests as readable behavior statements including the condition and expected outcome (e.g., `test_order_total_includes_tax_when_region_is_eu`), preferring one behavior per test.

## Dependencies and Composition

* **Explicit injection:** Prefer constructor injection for long-lived dependencies and function parameters for transient operation values. Avoid hidden dependencies via mutable global state or static service locators.
* **Composition root:** In application code with meaningful infrastructure boundaries, keep vendor-specific construction and wiring at the composition root or framework bootstrap layer.
* **Framework lifecycle:** Use singleton lifecycles only when the dependency is thread-safe and intentionally shared. Allow immutable constants and pure functions.

## Third-Party Libraries & Adaptability

* **Project-owned boundaries:** Wrap external integrations (databases, payment providers, third-party APIs) in project-owned adapters. Domain logic must depend on these local contracts, not vendor SDK types or vendor-specific exceptions.
* **Capability-focused design:** Shape adapter contracts around the specific capability the application needs, not the vendor's entire API. Do not create one-to-one mirror interfaces.
* **Pragmatic direct usage:** Allow direct third-party imports only for small, stable utility libraries with no external lifecycle or I/O.
* **YAGNI abstraction:** Do not add abstractions solely for "future vendor replacement." Introduce adapters to create clean testing seams, isolate I/O, or centralize cross-cutting concerns (retries, timeouts, error mapping).

## Dependency Hygiene and Security

* **Lockfile maintenance:** For deployable applications and services, commit and maintain the ecosystem-appropriate lockfile when repository policy requires it. Never edit lockfiles manually; update them only using the repository's package manager in the same commit as the manifest change.
* **Scope enforcement:** Do not add, remove, or upgrade dependencies unless explicitly requested by the task or required to resolve a verified security vulnerability.
* **Upgrade diligence:** When modifying dependencies, review the lockfile diff, transitive changes, release notes, and licenses.

## Formatting

* **Enforce existing rules:** Follow the repository's configured formatter, linter, editor settings, and file-specific rules. Do not debate styling choices already enforced.
* **No unsolicited styling:** Do not make unrelated, style-only changes outside files affected by the task. Do not introduce new formatters, configurations, or mass-formatting diffs during unrelated tasks.
* **Execution:** Run the applicable formatter on changed files. If formatting would create a broad unrelated diff, prefer check mode or isolate formatting in a separate intentional change. Treat unsafe autocorrect modes as code changes—review their diffs and run verification.

## Logging and Observability

* **No ad-hoc logs:** Use the repository's logging abstraction. Never use print statements, `console.log`, or raw string concatenation for production observability.
* **Structured data:** Production service logs must be structured and machine-queryable (JSON preferred when no standard exists). Let the framework supply metadata like timestamps and environment context.
* **Correlation:** Include correlation IDs (`trace_id`, `request_id`, `operation_id`) when available, but do not force irrelevant identifiers into every event.
* **CLI output:** Keep CLI output human-readable, sending diagnostics and errors to stderr.

## Log Levels and Safety

* **Logging levels:** Log at `DEBUG` for high-volume troubleshooting, `INFO` for operation/business lifecycles, `WARN` for unexpected but recoverable conditions, and `ERROR` for operation failures.
* **Contextual safety:** Include error types, operations, and stack traces when logging failures. Never log secrets, credentials, auth headers, session tokens, payment data, raw request/responses, or unredacted personal data.
* **No substitute:** Do not use logs as a substitute for metrics, traces, audit records, or automated tests.

## Git Hygiene

* **Atomic commits:** Make each commit atomic and reviewable (include code, tests, migrations, config, and docs together for one change). Do not combine unrelated refactors or formatting changes with functional fixes.
* **Verify before commit:** Run the repository's build, formatting, linting, type-checking, and tests before committing. If the baseline fails or checks cannot run, document it in the commit or PR.
* **Commit conventions:** Follow the repository's commit-message convention. Use Conventional Commits (`<type>(<scope>): <summary>`) only if already adopted or explicitly requested.
* **Descriptions & History:** PR descriptions must explain *why* the change is needed, summarize verification, and state limitations. Never amend published commits, force-push shared branches, or alter history unless requested.

---

# Project-Specific Context

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
