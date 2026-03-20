# Conteúdo Pragmático

Contrato funcional e técnico da área `Conteúdo Pragmático` do app `CONCURSO`.

## Glossário

- `Área`: agrupador macro do edital (`Português`, `RLM`, `Legislação`, `Específicos`).
- `Matéria`: item clicável da listagem principal do conteúdo pragmático.
- `Submatéria`: item interno da matéria, com nota e histórico de revisão.
- `Conteúdo teórico`: arquivo de estudo associado a uma matéria ou a uma submatéria.
- `Aula`: uso prático do conteúdo teórico dentro da interface. Pode nascer de upload (`.md`/`.pdf`) ou de texto colado em markdown.

## Regra de nota

- Cada submatéria tem nota obrigatória entre `A` e `E`.
- A `nota atual` da matéria é a pior nota entre as submatérias cadastradas.
- Enquanto a matéria ainda não tiver submatérias registradas, a interface exibe `E` como fallback visual para indicar ausência de domínio validado.
- A escala visual é sempre textual e cromática:
  - `A`: verde
  - `B`
  - `C`
  - `D`
  - `E`: vermelho

## Comportamento da interface

### Página principal

- Exibe a `nota atual` de cada matéria diretamente no card.
- Permite filtrar a listagem pela `nota atual` da matéria.
- Exibe quantas `aulas feitas` e quantas `aulas pendentes` existem em cada matéria.
- Permite baixar todo o conteúdo teórico do app em um único arquivo `.zip`.

### Página da matéria

- Exibe a `nota atual` no cabeçalho.
- Mantém o cadastro e a edição das submatérias.
- Permite cadastrar arquivos teóricos da própria matéria.
- Permite cadastrar arquivos teóricos por submatéria em um painel dedicado.
- Permite colar markdown diretamente na interface com `Ctrl+V` e salvar isso como aula.
- Permite abrir a aula no próprio site.
- Quando a aula for `.md`, a leitura no site usa renderização estilo GitHub, com suporte a listas, negrito, links, tabelas, blockquotes, checklists e blocos de código.
- Permite marcar cada aula como `feita` ou `pendente`.
- Permite reordenar as aulas dentro do mesmo contexto por drag and drop e também por botões de mover.
- Permite baixar um `.zip` com todo o conteúdo da matéria.
  - Esse download inclui os arquivos da matéria e também os arquivos de suas submatérias.
- Permite baixar um `.zip` somente da submatéria escolhida.

## Tipos de arquivo aceitos

- `.md`
- `.pdf`

Outros tipos devem ser rejeitados na validação de upload.

## Renderização de Markdown

- O Markdown é renderizado apenas para leitura; o texto original armazenado não é alterado.
- Links externos devem abrir em nova aba com `rel="noreferrer"`.
- HTML embutido no Markdown não deve ser interpretado como DOM ativo nesta versão.

## Ordenação dos arquivos

- A ordenação é manual e persistida por contexto.
- `Matéria` e `Submatéria` possuem ordenações independentes.
- O drag and drop só reorganiza itens do mesmo contexto.
- O download respeita essa ordenação.

## Status de aula

- Toda aula começa como `pendente`.
- Quando o usuário marca a aula como `feita`, o sistema registra a data local atual em `completedAt`.
- Os contadores da listagem principal consideram:
  - `Aulas feitas`: aulas com `completedAt`
  - `Aulas pendentes`: aulas sem `completedAt`

## Armazenamento

- O snapshot principal do app continua salvando apenas os metadados dos arquivos teóricos:
  - dono (`matéria` ou `submatéria`)
  - nome
  - tipo
  - ordem
  - status da aula (`completedAt`)
  - chave de armazenamento
- O binário real do arquivo fica no IndexedDB local, no banco `concurso-theoretical-content`.
- A sincronização atual com Firebase continua sincronizando o snapshot, não os binários dos arquivos.

## Implicações da decisão de armazenamento

- O usuário consegue reabrir a organização e a listagem dos arquivos em qualquer snapshot sincronizado.
- O download local só funciona quando o binário daquele arquivo também existe no navegador atual.
- Se o metadado existir mas o binário local estiver ausente, o download deve falhar explicitamente.

## Semântica do download

- Download global:
  - gera um `.zip`
  - agrupa os arquivos por pasta de matéria
- Download da matéria:
  - gera um `.zip`
  - inclui arquivos da matéria na raiz da pasta da matéria
  - inclui arquivos de submatéria em `submaterias/<nome-da-submateria>/`
- Download da submatéria:
  - gera um `.zip`
  - inclui apenas os arquivos daquela submatéria

## Cobertura mínima esperada

- Testes unitários para nota atual, ordenação, validação de tipo e montagem das entradas de download.
- Testes de integração para:
  - nota atual na listagem
  - filtro por nota
  - upload/reordenação na matéria
  - upload por submatéria
  - disparo dos downloads por contexto
- Pelo menos um fluxo E2E cobrindo upload e downloads `.zip`.
