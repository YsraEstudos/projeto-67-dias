## Summary

- [ ] Descrevi o objetivo da mudança e o impacto esperado.

## Validation Checklist

- [ ] Rodei `npm run check:root`.
- [ ] Rodei `npm run check:concurso`.
- [ ] Se alterei `CONCURSO/src`, rodei `npm run build:concurso:published`.
- [ ] Validei que `public/concurso/index.html` referencia assets existentes.
- [ ] Não incluí logs/temporários/debug no commit.

## Scope

- [ ] Mudança no app raiz (`/`).
- [ ] Mudança no standalone `CONCURSO/`.
- [ ] Mudança em `public/concurso` gerada pelo fluxo oficial.

## Risks and Rollback

- [ ] Registrei riscos de regressão e como reverter em caso de falha.
