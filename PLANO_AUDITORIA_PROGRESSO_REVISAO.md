# Plano de Correção — Progresso e Revisão

## Diagnóstico rápido
Após revisar o fluxo de `ProgressView` + `weeklySnapshot`, há lacunas importantes entre a lógica real do app e o que é exibido no Progresso/Revisão:

1. **Sites/Links não entram nas métricas semanais**
   - O snapshot semanal considera hábitos, skills, leitura, tarefas, jogos e diário.
   - Não há captura de uso/progresso do módulo de Sites/Links.

2. **Diário está fixo como zero no snapshot**
   - `journalEntryCount` está hardcoded como `0` no fluxo de geração.
   - Isso força “Sem Reflexões no Diário” mesmo quando há uso real do diário.

3. **Métricas “semanais” parcialmente acumuladas**
   - Leitura usa valor acumulado total (`books.current`) por limitação de histórico por data.
   - Tarefas usam total concluído geral, não recorte semanal real.

4. **Confirmação/Revisão não cobre todos os domínios do app**
   - Modal/Card exibem subconjunto de módulos.
   - Falta transparência para o usuário sobre o que está (ou não está) sendo pontuado.

---

## Plano proposto (priorizado)

### Fase 1 — Correção de precisão (alto impacto)
1. **Conectar Diário real ao snapshot**
   - Ler entradas da `journalStore` e calcular quantidade da semana atual.
   - Remover `journalEntryCount = 0` hardcoded.

2. **Tornar tarefas realmente semanais**
   - Adicionar campo de data de conclusão (se necessário) e filtrar por intervalo da semana.
   - Ajustar cálculo em `captureWeeklyMetrics`.

3. **Leitura semanal real**
   - Persistir histórico de leitura por dia/sessão (páginas lidas por data).
   - Trocar cálculo acumulado por soma no intervalo semanal.

### Fase 2 — Cobertura de módulos (visibilidade completa)
4. **Adicionar Sites/Links no modelo de snapshot**
   - Estender `WeeklyMetrics` com campos de Sites/Links (ex.: links adicionados, revisitados, categorizados).
   - Atualizar `calculateOverallScore` e pesos com versão de migração.

5. **Exibir claramente o que conta no score**
   - Incluir seção “Componentes do Score” no `SnapshotConfirmationModal` e no card semanal.
   - Mostrar módulos não contabilizados (badge “não incluído”).

### Fase 3 — Confiabilidade e migração
6. **Migração de snapshots antigos**
   - Estratégia backward-compatible para snapshots sem campos novos.
   - Defaults seguros para evitar quebra de UI/gráficos.

7. **Cobertura de testes**
   - Testes unitários para `captureWeeklyMetrics` com recorte semanal real.
   - Testes de integração para confirmação de snapshot exibindo todos os módulos.
   - Regressão para impedir retorno de valores hardcoded.

### Fase 4 — UX de revisão
8. **Painel de auditoria de dados por semana**
   - Exibir “origem do dado” por métrica (store/campo/período).
   - Ajudar usuário a confiar no resultado da revisão.

9. **Alertas de inconsistência**
   - Sinalizar quando algum módulo não possui histórico suficiente para cálculo semanal correto.

---

## Critérios de aceite
- Progresso/Revisão exibem **todos os módulos definidos como parte da jornada**.
- Cada métrica semanal usa dados com recorte temporal real (sem acumulado indevido).
- Usuário consegue identificar com clareza:
  - o que conta no score,
  - o que não conta,
  - e por quê.
- Testes automatizados cobrindo geração de snapshot e renderização das métricas.
