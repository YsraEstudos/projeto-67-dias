import { DuoTheory } from '../types';

export const DUO_THEORY_DATABASE: DuoTheory[] = [
  {
    id: 'th_var',
    conceptId: 'variables_var_let_const',
    unitId: 1,
    title: 'O que é var? (e a comparação com let & const)',
    category: 'Fundamentos',
    summary: 'var é a declaração legada de variáveis no JavaScript com escopo de função e içamento (hoisting). Desde o ES6 (2015), foi superada por let e const.',
    whatIsIt: `**var** foi a palavra-chave original para criar variáveis em JavaScript desde a criação da linguagem em 1995.

Diferente de linguagens como C, Java ou Python moderno, \`var\` não respeita **escopo de bloco** (como dentro de um \`if\` ou \`for\`). Ele pertence apenas ao **escopo da função inteira** onde foi declarado, ou ao **escopo global** (\`window\` no navegador).

Além disso, \`var\` sofre **Hoisting** (içamento): o interpretador move a declaração para o topo do escopo durante a fase de compilação, inicializando a variável com o valor especial \`undefined\`.`,
    whyItMatters: `Compreender o \`var\` é indispensável para:
1. **Entender código legado e bibliotecas**: Milhares de códigos históricos usam \`var\`.
2. **Evitar armadilhas e bugs em loops**: Variáveis com \`var\` em loops assíncronos compartilham a mesma referência em memória.
3. **Passar em entrevistas técnicas**: A pergunta "Qual a diferença entre var, let e const?" é uma das mais frequentes em testes de JavaScript no mundo inteiro.`,
    comparison: {
      headers: ['Característica', 'var', 'let', 'const'],
      rows: [
        {
          feature: 'Escopo',
          values: {
            var: 'Função ou Global (ignora blocos {})',
            let: 'Bloco ({})',
            const: 'Bloco ({})',
          },
        },
        {
          feature: 'Hoisting (Içamento)',
          values: {
            var: 'Sim, inicializado como undefined',
            let: 'Sim, mas na TDZ (gera ReferenceError se acessado antes)',
            const: 'Sim, mas na TDZ (gera ReferenceError se acessado antes)',
          },
        },
        {
          feature: 'Redeclaração no mesmo escopo',
          values: {
            var: 'Permitido (pode sobrescrever sem aviso)',
            let: 'Proibido (SyntaxError)',
            const: 'Proibido (SyntaxError)',
          },
        },
        {
          feature: 'Reatribuição de valor',
          values: {
            var: 'Permitido',
            let: 'Permitido',
            const: 'Proibido (TypeError)',
          },
        },
        {
          feature: 'Cria propriedade em window',
          values: {
            var: 'Sim (no escopo global do browser)',
            let: 'Não',
            const: 'Não',
          },
        },
      ],
    },
    codeExamples: [
      {
        title: '1. O problema do escopo de bloco com var vs let',
        code: `if (true) {
  var vazou = "Consigo ser acessado fora do bloco!";
  let protegido = "Só existo aqui dentro!";
}

console.log(vazou); // "Consigo ser acessado fora do bloco!"
// console.log(protegido); // ReferenceError: protegido is not defined`,
        explanation: 'var ignora as chaves do bloco if e vaza para o escopo externo, enquanto let fica estritamente contido.',
      },
      {
        title: '2. Hoisting com var',
        code: `console.log(minhaVariavel); // undefined (não quebra o código!)
var minhaVariavel = "Agora tenho valor";
console.log(minhaVariavel); // "Agora tenho valor"

// Por baixo dos panos, o interpretador faz:
// var minhaVariavel;
// console.log(minhaVariavel);
// minhaVariavel = "Agora tenho valor";`,
        explanation: 'A declaração sobe para o topo com o valor inicial undefined.',
      },
      {
        title: '3. Regra de ouro moderna: const > let > nunca var',
        code: `// Use CONST por padrão para valores e referências imutáveis
const PI = 3.14159;
const usuario = { nome: "Lucas" };
usuario.nome = "Ana"; // Permitido! (O objeto é mutável, mas a variável 'usuario' não pode ser reatribuída)

// Use LET apenas quando a variável precisar de reatribuição (ex: contadores)
let tentativas = 0;
tentativas += 1;`,
        explanation: '95% do código moderno deve usar const. Use let para contadores/acumuladores e evite var completamente em projetos novos.',
      },
    ],
    pitfalls: [
      'Poluição do objeto global: `var x = 10` no escopo global cria `window.x`, podendo colidir com scripts de terceiros.',
      'Closures acidentais em loops: Usar `var i = 0` dentro de `for` com callbacks (`setTimeout`) faz todas as iterações imprimirem o último valor.',
      'Redeclarações silenciosas: É possível redeclarar `var nome = "A"` e depois `var nome = "B"` no mesmo arquivo sem nenhum erro do compilador.',
    ],
    tags: ['var', 'let', 'const', 'hoisting', 'escopo', 'variáveis', 'es6', 'básico'],
    relatedConcepts: ['scope_lexical', 'closures', 'primitives_types'],
  },
  {
    id: 'th_primitives',
    conceptId: 'primitives_types',
    unitId: 1,
    title: 'Tipos Primitivos vs Tipos por Referência',
    category: 'Fundamentos',
    summary: 'JavaScript possui 7 tipos primitivos imutáveis armazenados por valor e tipos por referência (Objetos, Arrays, Funções) armazenados na Heap.',
    whatIsIt: `Um **tipo primitivo** representa um único dado fundamental que é **imutável** (seu valor em si não pode ser modificado, apenas substituído). Quando atribuído a outra variável, é copiado por **valor real**.

Os 7 tipos primitivos do JavaScript moderno são:
1. \`string\` ('olá', "mundo")
2. \`number\` (42, 3.14, NaN, Infinity)
3. \`boolean\` (true, false)
4. \`null\` (ausência intencional de valor)
5. \`undefined\` (variável declarada sem valor atribuído)
6. \`symbol\` (identificador único e imutável para chaves de objetos)
7. \`bigint\` (inteiros de precisão arbitrária maior que 2^53 - 1)

Todos os outros valores em JavaScript (incluindo Arrays, Funções e Datas) são instâncias do tipo **Object** e são gerenciados por **referência na memória Heap**.`,
    whyItMatters: `Entender a distinção entre valor e referência evita o erro clássico de alterar um array ou objeto achando que se tratava de uma cópia isolada.`,
    codeExamples: [
      {
        title: 'Cópia por Valor (Primitivos) vs Referência (Objetos)',
        code: `// 1. Primitivos (Cópia por Valor)
let a = 10;
let b = a;
b = 20;
console.log(a); // 10 (permanece intacto!)

// 2. Objetos (Cópia por Referência)
let obj1 = { valor: 10 };
let obj2 = obj1; // Apontam para o MESMO endereço de memória
obj2.valor = 20;
console.log(obj1.valor); // 20! (Foi modificado!)`,
        explanation: 'Primitivos clonam o dado. Objetos compartilham a mesma referência em memória.',
      },
    ],
    pitfalls: [
      'typeof null retorna "object": É um bug histórico da versão inicial do JS que nunca pôde ser corrigido por compatibilidade.',
      'NaN (Not a Number) é do tipo "number": `typeof NaN === "number"`!',
    ],
    tags: ['primitivos', 'typeof', 'null', 'undefined', 'string', 'number', 'boolean', 'referencia'],
    relatedConcepts: ['variables_var_let_const', 'operators_equality'],
  },
  {
    id: 'th_equality',
    conceptId: 'operators_equality',
    unitId: 1,
    title: 'Igualdade Solta (==) vs Estrita (===)',
    category: 'Fundamentos',
    summary: 'O operador == força a conversão implícita de tipos (coerção), enquanto === exige que o tipo e o valor sejam absolutamente idênticos.',
    whatIsIt: `O operador \`==\` (Loose Equality) tenta converter automaticamente os tipos dos operandos se forem diferentes antes de comparar (Type Coercion).

O operador \`===\` (Strict Equality) verifica primeiro se os tipos são iguais. Se forem diferentes, retorna \`false\` imediatamente.`,
    whyItMatters: `O uso de \`==\` pode gerar resultados imprevisíveis e falhas de segurança em autenticações e validações lógicas. A melhor prática universal em JavaScript é **sempre utilizar ===**.`,
    comparison: {
      headers: ['Expressão', 'Resultado com ==', 'Resultado com ===', 'Motivo'],
      rows: [
        {
          feature: '0 e false',
          values: {
            'Resultado com ==': 'true',
            'Resultado com ===': 'false',
            Motivo: 'Coerção converte false para 0',
          },
        },
        {
          feature: '"" e 0',
          values: {
            'Resultado com ==': 'true',
            'Resultado com ===': 'false',
            Motivo: 'String vazia é convertida para número 0',
          },
        },
        {
          feature: 'null e undefined',
          values: {
            'Resultado com ==': 'true',
            'Resultado com ===': 'false',
            Motivo: 'São equivalentes em ausência de valor solta',
          },
        },
      ],
    },
    codeExamples: [
      {
        title: 'Exemplos Práticos de Comparação',
        code: `console.log("5" == 5);   // true (string é convertida para number)
console.log("5" === 5);  // false (tipos diferentes: string !== number)

console.log(null == undefined);  // true
console.log(null === undefined); // false`,
        explanation: 'Prefira sempre === para evitar conversões mágicas indesejadas.',
      },
    ],
    pitfalls: [
      'Comparação de objetos: `{}` === `{}` é false porque cada objeto tem uma referência de memória distinta.',
      'NaN === NaN é false: Para verificar se algo é NaN, utilize `Number.isNaN(valor)`.',
    ],
    tags: ['igualdade', 'coerção', 'operadores', '===', '==', 'tipos'],
    relatedConcepts: ['primitives_types', 'short_circuit_coalescing'],
  },
  {
    id: 'th_closures',
    conceptId: 'closures',
    unitId: 6,
    title: 'O que é uma Closure?',
    category: 'Funções',
    summary: 'Uma closure é a combinação de uma função com as referências ao seu escopo léxico envolvente, permitindo acessar variáveis externas mesmo após a função pai ter terminado.',
    whatIsIt: `Em JavaScript, as funções são **cidadãs de primeira classe** e mantêm uma referência viva para as variáveis do local onde foram declaradas (**escopo léxico**).

Quando uma função interna é retornada de dentro de uma função externa, ela "lembra" e continua tendo acesso a todas as variáveis da função externa, mesmo que a execução da função externa já tenha finalizado.`,
    whyItMatters: `Closures são a base de:
1. **Encapsulamento e Dados Privados**: Criação de módulos seguros sem variáveis globais.
2. **Funções Fábrica (Factory Functions)** e Currying.
3. **Hooks do React**: O \`useState\` do React funciona inteiramente com o conceito de closures!`,
    codeExamples: [
      {
        title: 'Criando variáveis privadas com Closure',
        code: `function criarContaBancaria(saldoInicial) {
  let saldo = saldoInicial; // Variável estritamente privada!

  return {
    depositar(valor) {
      saldo += valor;
      return \`Depósito realizado. Saldo: R$ \${saldo}\`;
    },
    consultarSaldo() {
      return \`Saldo atual: R$ \${saldo}\`;
    }
  };
}

const minhaConta = criarContaBancaria(100);
console.log(minhaConta.consultarSaldo()); // "Saldo atual: R$ 100"
minhaConta.depositar(50);
console.log(minhaConta.consultarSaldo()); // "Saldo atual: R$ 150"
// console.log(minhaConta.saldo); // undefined (Ninguém consegue alterar diretamente!)`,
        explanation: 'A variável saldo fica totalmente protegida e só pode ser manipulada pelos métodos retornados.',
      },
    ],
    pitfalls: [
      'Consumo de memória: Como a closure mantém a referência viva, as variáveis não são coletadas pelo Garbage Collector enquanto a função interna existir.',
    ],
    tags: ['closure', 'escopo', 'funcoes', 'encapsulamento', 'avancado', 'react-hooks'],
    relatedConcepts: ['scope_lexical', 'this_binding', 'function_basics'],
  },
  {
    id: 'th_arrow',
    conceptId: 'arrow_functions',
    unitId: 3,
    title: 'Arrow Functions (=>) e Binding de this',
    category: 'Funções',
    summary: 'Arrow functions oferecem sintaxe concisa com retorno implícito e não possuem seu próprio this, herdando-o do escopo léxico envolvente.',
    whatIsIt: `Introduzidas no ES6, as **Arrow Functions** são uma sintaxe moderna e enxuta para declarar funções em JavaScript.

Suas características fundamentais:
1. **Sintaxe compacta**: Parênteses opcionais com 1 parâmetro e retorno implícito em linhas únicas.
2. **Lexical \`this\`**: Não criam seu próprio contexto \`this\`. O \`this\` dentro de uma arrow function é exatamente o mesmo \`this\` de fora dela.
3. **Sem objeto \`arguments\`**: Devem usar o operador Rest \`(...args)\`.
4. **Não podem ser construtoras**: Não podem ser invocadas com \`new\`.`,
    whyItMatters: `Antes das arrow functions, programadores precisavam fazer hacks como \`var self = this\` ou \`.bind(this)\` dentro de callbacks e métodos assíncronos.`,
    codeExamples: [
      {
        title: 'Sintaxe Tradicional vs Arrow Function',
        code: `// Função Tradicional
const dobroTradicional = function(n) {
  return n * 2;
};

// Arrow Function com Retorno Implícito
const dobroModerno = n => n * 2;

console.log(dobroModerno(5)); // 10`,
        explanation: 'Com apenas 1 linha de expressão, dispensamos as chaves {} e a palavra return.',
      },
    ],
    pitfalls: [
      'Não use arrow functions como métodos de objetos literais quando precisar acessar `this.propriedade`:',
      'Não utilize arrow functions como manipuladores de eventos do DOM se quiser que `this` aponte para o elemento clicado.',
    ],
    tags: ['arrow-function', 'this', 'funcoes', 'es6', 'sintaxe'],
    relatedConcepts: ['function_basics', 'this_binding'],
  },
  {
    id: 'th_functional_arrays',
    conceptId: 'array_map',
    unitId: 5,
    title: 'Métodos Funcionais: .map(), .filter() e .reduce()',
    category: 'Coleções & Arrays',
    summary: 'Os pilares da programação funcional em JS para transformar, filtrar e agregar dados de arrays sem mutação do array original.',
    whatIsIt: `Em vez de usar loops \`for\` imperativos com variáveis de controle, o JavaScript oferece métodos declarativos de alta ordem:

- **.map()**: Transforma cada elemento e retorna um **novo array de mesmo tamanho**.
- **.filter()**: Testa cada elemento com um predicado booleano e retorna um **novo array apenas com os itens aprovados**.
- **.reduce()**: Itera sobre o array acumulando todos os valores em um **único resultado final** (número, objeto, array, etc.).`,
    whyItMatters: `Permitem encadeamento fluido de operações com imutabilidade, tornando o código limpo, legível e livre de efeitos colaterais.`,
    codeExamples: [
      {
        title: 'Pipeline Funcional Completo',
        code: `const produtos = [
  { nome: "Teclado", preco: 150, categoria: "tech" },
  { nome: "Caneca", preco: 30, categoria: "casa" },
  { nome: "Mouse", preco: 100, categoria: "tech" },
];

// 1. Filtrar só tech -> 2. Aplicar 10% desconto -> 3. Somar total
const totalTechComDesconto = produtos
  .filter(p => p.categoria === "tech")
  .map(p => p.preco * 0.9)
  .reduce((acc, preco) => acc + preco, 0);

console.log(totalTechComDesconto); // 225`,
        explanation: 'Cada método entrega uma nova coleção pronta para o próximo estágio sem modificar o array original `produtos`.',
      },
    ],
    pitfalls: [
      'Esquecer o valor inicial do reduce: Sempre passe o acumulador inicial (ex: `, 0` ou `, {}`) para evitar bugs com arrays vazios.',
      'Usar forEach quando precisa retornar dados: `forEach` sempre retorna undefined.',
    ],
    tags: ['map', 'filter', 'reduce', 'arrays', 'funcional', 'imutabilidade'],
    relatedConcepts: ['array_methods_basic', 'destructuring_spread'],
  },
  {
    id: 'th_promises',
    conceptId: 'promises_basics',
    unitId: 8,
    title: 'Promises e Async / Await',
    category: 'Assíncrono',
    summary: 'O modelo moderno de gerenciamento de operações assíncronas não-bloqueantes no JavaScript.',
    whatIsIt: `Uma **Promise** é um objeto que representa a eventual conclusão (ou falha) de uma operação assíncrona.

Possui 3 estados:
1. **Pending**: Em andamento.
2. **Fulfilled**: Concluída com sucesso (\`resolve(dado)\`).
3. **Rejected**: Falhou com erro (\`reject(erro)\`).

**Async / Await** é um açúcar sintático elegante em cima de Promises que permite escrever código assíncrono com aparência síncrona e tratamento de erro nativo com \`try...catch\`.`,
    whyItMatters: `Eliminou o clássico "Callback Hell" (pirâmide da perdição) e padronizou como toda API moderna (Fetch, Banco de Dados, Arquivos) comunica respostas.`,
    codeExamples: [
      {
        title: 'Consumindo API com async/await e try/catch',
        code: `async function carregarUsuario(id) {
  try {
    const resposta = await fetch(\`https://api.exemplo.com/users/\${id}\`);
    if (!resposta.ok) {
      throw new Error(\`Erro HTTP: \${resposta.status}\`);
    }
    const dados = await resposta.json();
    return dados;
  } catch (erro) {
    console.error("Falha na requisição:", erro.message);
  } finally {
    console.log("Requisição finalizada.");
  }
}`,
        explanation: 'A sintaxe async/await torna o fluxo linear e intuitivo de debugar.',
      },
    ],
    pitfalls: [
      'Executar promises sequenciais sem necessidade: Se duas requisições são independentes, use `Promise.all([p1, p2])` para rodá-las em paralelo!',
      'Esquecer de tratar erros com .catch() ou try/catch gerando UnhandledPromiseRejection.',
    ],
    tags: ['promise', 'async', 'await', 'assincrono', 'fetch', 'api', 'event-loop'],
    relatedConcepts: ['event_loop_microtasks', 'promise_combinators'],
  },
  {
    id: 'th_eventloop',
    conceptId: 'event_loop_microtasks',
    unitId: 8,
    title: 'Event Loop, Microtasks & Macrotasks',
    category: 'Assíncrono',
    summary: 'Como o JavaScript executa tarefas assíncronas sendo uma linguagem single-threaded (única thread principal).',
    whatIsIt: `O JavaScript executa código em uma única Call Stack (pilha de chamadas). Para lidar com I/O, timers e rede sem travar a interface, ele utiliza o **Event Loop**.

O fluxo de prioridade do Event Loop funciona em ciclos:
1. **Call Stack**: Executa todo o código síncrono até esvaziar.
2. **Fila de Microtasks (Alta Prioridade)**: Executa todas as Promises (\`.then\`, \`async/await\`, \`queueMicrotask\`) até a fila ficar completamente vazia.
3. **Renderização do Navegador**: Atualiza a tela se necessário.
4. **Fila de Macrotasks / Task Queue**: Executa UMA macrotask (\`setTimeout\`, \`setInterval\`, eventos de I/O) e retorna ao passo 1.`,
    whyItMatters: `Entender a ordem de microtasks e macrotasks é essencial para diagnosticar condições de corrida (race conditions) e bugs de renderização.`,
    codeExamples: [
      {
        title: 'O clássico teste de ordem do Event Loop',
        code: `console.log("1 - Síncrono");

setTimeout(() => {
  console.log("4 - Macrotask (setTimeout)");
}, 0);

Promise.resolve().then(() => {
  console.log("3 - Microtask (Promise)");
});

console.log("2 - Síncrono");

// Saída no console:
// 1 - Síncrono
// 2 - Síncrono
// 3 - Microtask (Promise)
// 4 - Macrotask (setTimeout)`,
        explanation: 'Mesmo com timeout 0ms, a Microtask da Promise sempre tem prioridade sobre a Macrotask do setTimeout.',
      },
    ],
    pitfalls: [
      'Travar o Event Loop com loops síncronos pesados (ex: while infinito ou processamento pesado de imagem sem Web Worker) congela a aba do navegador.',
    ],
    tags: ['event-loop', 'microtasks', 'macrotasks', 'call-stack', 'single-thread', 'performance'],
    relatedConcepts: ['promises_basics', 'async_await'],
  },
  {
    id: 'th_debounce',
    conceptId: 'debounce_throttle',
    unitId: 10,
    title: 'Debounce vs Throttle: Otimização de Performance',
    category: 'Avançado',
    summary: 'Técnicas essenciais para limitar a taxa de execução de funções caras disparadas por eventos de alta frequência (busca, scroll, redimensionamento).',
    whatIsIt: `- **Debounce**: Atrasa a execução da função até que o usuário pare de emitir eventos por um determinado período de tempo. Ideal para **campos de busca (autocomplete)**.
- **Throttle**: Garante que a função seja executada no máximo uma vez a cada X milissegundos, independentemente de quantas vezes o evento for disparado. Ideal para **eventos de scroll e resize**.`,
    whyItMatters: `Sem essas técnicas, digitar em um campo de busca dispararia uma requisição de rede para cada caractere pressionado, sobrecarregando o servidor e travando o navegador.`,
    codeExamples: [
      {
        title: 'Implementação manual de uma função Debounce',
        code: `function debounce(fn, atrasoEmMs) {
  let timerId;
  return function(...args) {
    clearTimeout(timerId); // Cancela o timer anterior se o usuário digitou novamente
    timerId = setTimeout(() => {
      fn.apply(this, args);
    }, atrasoEmMs);
  };
}

const buscarNoServidor = (termo) => console.log("Buscando por:", termo);
const buscaOtimizada = debounce(buscarNoServidor, 400);

// Usuário digita rápido:
buscaOtimizada("j");
buscaOtimizada("jav");
buscaOtimizada("javascript");
// Apenas UMA requisição será feita após 400ms com "javascript"!`,
        explanation: 'O clearTimeout cancela o temporizador pendente a cada tecla digitada antes do prazo.',
      },
    ],
    pitfalls: [
      'Perda de contexto this: Sempre repasse o `this` e os argumentos via `fn.apply(this, args)`.',
    ],
    tags: ['debounce', 'throttle', 'otimizacao', 'performance', 'eventos', 'avancado'],
    relatedConcepts: ['closures', 'event_listeners_bubbling'],
  },
  {
    id: 'th_proxy',
    conceptId: 'proxy_reflect',
    unitId: 10,
    title: 'Metaprogramação com Proxy e Reflect',
    category: 'Avançado',
    summary: 'Permite interceptar e redefinir o comportamento fundamental de operações em objetos (leitura, escrita, validação, deleção).',
    whatIsIt: `Um objeto **Proxy** envolve outro objeto (chamado de \`target\`) e permite interceptar operações fundamentais por meio de "armadilhas" (traps) como:
- \`get(target, prop, receiver)\`: Intercepta leitura de propriedades.
- \`set(target, prop, value, receiver)\`: Intercepta atribuição de novos valores.
- \`has(target, prop)\`: Intercepta o operador \`in\`.
- \`deleteProperty(target, prop)\`: Intercepta o comando \`delete\`.

O objeto **Reflect** fornece métodos com a implementação padrão dessas mesmas operações para repassar a chamada de forma segura.`,
    whyItMatters: `É a tecnologia central utilizada pelos frameworks reativos modernos (como o sistema de reatividade do **Vue 3** e bibliotecas de validação como Zod e MobX).`,
    codeExamples: [
      {
        title: 'Validação Reativa Automática com Proxy',
        code: `const usuario = { nome: "Israel", idade: 25 };

const usuarioValidado = new Proxy(usuario, {
  set(target, prop, valor) {
    if (prop === "idade") {
      if (typeof valor !== "number" || valor < 0 || valor > 120) {
        throw new TypeError("Idade inválida! Deve ser um número entre 0 e 120.");
      }
    }
    target[prop] = valor;
    console.log(\`Propriedade \${prop} alterada para:\`, valor);
    return true; // Confirma o sucesso da escrita
  }
});

usuarioValidado.idade = 26; // Sucesso: console "Propriedade idade alterada para: 26"
// usuarioValidado.idade = -5; // Lança TypeError: Idade inválida!`,
        explanation: 'Qualquer tentativa de atribuir um valor inválido é barrada automaticamente pela trap `set`.',
      },
    ],
    pitfalls: [
      'Sempre retornar true na trap `set` em modo estrito, caso contrário um TypeError será lançado.',
    ],
    tags: ['proxy', 'reflect', 'metaprogramacao', 'reatividade', 'validacao', 'avancado'],
    relatedConcepts: ['objects_properties', 'classes_es6'],
  },
];
