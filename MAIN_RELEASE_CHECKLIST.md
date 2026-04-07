# Main Release Checklist

Objetivo: garantir merge seguro na branch `main` para o app raiz e para o standalone `CONCURSO` publicado em `/concurso`.

## 1. Local Quality Gates

1. Rodar checks do app raiz:

```bash
npm run check:root
```

2. Rodar checks do standalone:

```bash
npm run check:concurso
```

3. Se houve alteração em `CONCURSO/src`, validar publicação estática:

```bash
npm run check:concurso:published
```

## 2. Git Hygiene

1. Conferir status:

```bash
git status --short
```

2. Garantir que não há logs/temp/debug no stage.
3. Confirmar que mudanças em `public/concurso` vieram do fluxo oficial de build+sync.

## 3. Pull Request

1. Abrir PR para `main` usando o template em `.github/pull_request_template.md`.
2. Anexar evidências dos comandos executados (resumo dos resultados).
3. Solicitar revisão técnica.

## 4. Branch Protection (GitHub Settings)

Aplicar na branch `main`:

1. Require a pull request before merging.
2. Require approvals (mínimo 1).
3. Require status checks to pass before merging:
   - Main Readiness / Root Quality
   - Main Readiness / CONCURSO Quality
   - Main Readiness / CONCURSO Publish Contract
   - Main Readiness / CONCURSO E2E
4. Require branches to be up to date before merging.
5. Restrict force pushes.

## 5. Final Smoke

1. Validar app raiz localmente (`npm run dev`).
2. Validar `/concurso` localmente após sync.
3. Confirmar que o PR está verde antes do merge.
