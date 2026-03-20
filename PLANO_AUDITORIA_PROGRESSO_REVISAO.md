# Auditoria de Progresso e Revisao

Status atualizado da auditoria do fluxo `ProgressView` + `weeklySnapshot`.

## O que ja foi corrigido

### Diario

O snapshot semanal ja considera quantidade real de entradas do diario na semana. O hardcode antigo em zero nao representa mais o estado atual.

### Sites e links

O fluxo atual ja injeta no snapshot semanal os contadores de:

- sites atualizados na semana
- links clicados na semana

### Leitura

O resumo semanal ja usa `logs` de leitura para calcular progresso semanal de livros, em vez de depender apenas do valor acumulado total.

### Tarefas

O recorte semanal de tarefas passou a considerar `completedAt` e, quando necessario, fallback em `createdAt`.

## Como o fluxo funciona hoje

- `ProgressView` calcula contadores da semana atual a partir das stores carregadas.
- `generateWeeklySnapshot` recebe esses contadores e monta o snapshot persistido.
- `weeklySnapshot.ts` ainda agrega algumas metricas a partir do estado atual e do historico disponivel.

## O que ainda merece atencao

### Nem toda metrica nasce no mesmo ponto

Sites e links entram no snapshot pelo fluxo de geracao final, nao por uma captura unica e centralizada dentro de `captureWeeklyMetrics`.

### Alguns dominios ainda dependem de proxy temporal

Quando um modulo nao possui historico detalhado por evento, parte da leitura do "que aconteceu nesta semana" ainda depende de timestamps como `updatedAt`.

### Transparencia da pontuacao pode melhorar

A revisao semanal ainda pode explicar melhor para o usuario:

- o que conta no score
- o que nao conta
- qual foi a origem de cada metrica

## Proximos passos recomendados

1. Centralizar mais campos do snapshot em uma etapa unica de captura semanal.
2. Exibir na UI quais modulos entram no score e quais sao apenas informativos.
3. Adicionar testes de regressao para impedir retorno de hardcodes antigos.
