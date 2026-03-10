# Plano de Correção e Validação: Notas de Corte de TI (Fundatec)

Este documento estabelece a metodologia e o passo a passo rigoroso para corrigir, validar e unificar a nossa base de dados de concursos de Tecnologia da Informação organizados pela Fundatec.

## 1. Padronização do Conceito "Nota de Corte"

Para evitar distorções, a rega definitiva para o documento será:
**Nota de Corte = A nota final do último aprovado DENTRO das vagas imediatas previstas no edital** (ou seja, se o edital prevê 2 vagas imediatas, a nota de corte é a pontuação do 2º colocado na classificação geral).
*Exceção: Caso o edital seja apenas para Cadastro de Reserva (CR), a nota de corte será a do 1º colocado geral, ou o último candidato efetivamente nomeado se houver tal informação.*

---

## 2. Ações Corretivas Baseadas nos Apontamentos (A Executar Imediatamente)

Conforme os problemas identificados, a tabela original sofrerá as seguintes intervenções cirúrgicas:

* **[REMOVER] Canoas 2022/23 (ID 645):** A linha será completamente excluída do relatório, pois o edital abriga apenas cargos da saúde e engenharia (sem TI).
* **[CORRIGIR] CAU/RS 2023 (ID 771):** O registro será atualizado para refletir a realidade. Cargo alterado para "Analista Superior Infraestrutura de TIC" e a nota de corte (último aprovado) ajustada de 74,0 para **70,00**.
* **[SUSPENDER] ALRS 2024 (ID 872):** A linha será removida ou suspensa da média até que se comprove qual foi efetivamente o edital de TI da Assembleia, já que o ID 872 não contempla a área.
* **[CORRIGIR] AGERGS (ID 655):** Ano corrigido de 2023 para **2022**. Cargo ajustado para "Téc. Superior Analista de Sistemas" e a nota de corte despencará de 74,0 para a real do último aprovado: **48,40**.
* **[CALCULAR] Média Federal/Saúde:** A conta errada será reparada. A soma correta resultará na média de **70,3**, reduzindo a Meta (+8) para **78,3**.
* **[CORRIGIR] IDs do GHC e BRDE:**
  * Concurso 1055: Será renomeado para **GHC 01/2026**.
  * Concurso **646**: Será utilizado para referenciar os dados do **GHC 01/2022**.
  * Concurso **726**: Será utilizado para referenciar os dados do **GHC 01/2023**.

---

## 3. Checklist de Verificação, Concurso por Concurso

Assim que a cota técnica de navegação e extração de PDFs estiver disponível, executaremos a seguinte rotina para cada linha remanescente:

### Procedimento Padrão para cada URL

1. Abrir a página exata do concurso (`index_concursos.php?concurso=ID`).
2. Baixar o arquivo "Edital de Abertura".
   * Verificar com precisão de texto se há o **cargo de TI**. Se não houver, o concurso é descartado.
   * Identificar o **número de vagas imediatas** anunciadas no edital para o respectivo cargo.
3. Baixar o arquivo "Homologação do Resultado Final" ou "Notas Definitivas".
4. Buscar pela nomenclatura do cargo de TI.
5. **Coletar a nota da última posição correspondente ao número de vagas imediatas:** (Ex: se o edital abriu 3 vagas, coletar a nota do 3º colocado). Se o edital for apenas para Cadastro de Reserva (CR), coletar a nota do 1º colocado. O valor será a nova Nota de Corte.

### Lista de Tarefas por Categoria

**A. Municipal/Conselhos (Área de Reestruturação Crítica)**

* [ ] **Bagé (852):** Validar o edital e a nota real do "Técnico TI".
* [ ] **Esteio:** Encontrar o ID real do certame de TI de 2022/23 e extrair a nota.
* [ ] **São Leopoldo:** Localizar ID correto (pois 814 era Porto Xavier) e verificar TI.
* [ ] **Rio Grande:** Localizar ID correto (pois 781 era Boa Vista) e verificar TI.
* [ ] **Gramado:** Localizar ID correto (pois 714 era Três de Maio) e verificar TI.
* [ ] **Bento Gonçalves:** Localizar ID correto e verificar TI.
* [ ] **Viamão:** Localizar ID correto (E separar se é Câmara ou Prefeitura) e verificar TI.
* [ ] **Erechim:** Localizar ID correto e verificar TI.

**B. Federal/Saúde**

* [ ] **GHC (726 - 2023):** Extrair a nota exata do último aprovado para Analista/Técnico de TI do PDF de homologação.
* [ ] **GHC (646 - 2022):** Extrair a nota exata.
* [ ] **GHC (1055 - 2026):** Extrair/Verificar situação atual (ainda em andamento?).
* [ ] **BRDE:** Confirmar ID correto (979 é 2025/2024, ver se é esse ou buscar 2023) e nota real.
* [ ] **IF-RS (807):** Confirmar a nota de 75.0 no documento original.
* [ ] **IF-Sul:** Encontrar o ID correto do IF-Sul (815 era IFRS) e validar a nota.
* [ ] **UFCSPA e CRF-RS:** Localizar as IDs corretas (já que 860 e 868 estão incorretos para essas instituições) e checar os resultados de homologação.
* [ ] **CREMERS:** Localizar ID correto e testar nota de TI.

**C. Elite**

* [ ] **PROCERGS (743):** Validar uma amostra das notas (fornecidas como >70) contra o PDF de "Homologação Final" da PROCERGS, extraindo a nota do último colocado por vertente (Java, Redes, Dados, etc).
* [ ] **AGERGS (655 - 2022):** (Já confirmado pelo usuário: Último foi 48,40).
* [ ] **TCE-RS (FGV - 2021/2022):** Entrar no portal da FGV (`conhecimento.fgv.br`), buscar o PDF oficial do TCE-RS e confirmar a nota do último classificado para Auditor de TI.
