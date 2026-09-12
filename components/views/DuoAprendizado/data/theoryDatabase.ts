import { DuoTheory } from '../types';

export const DUO_THEORY_DATABASE: DuoTheory[] = [
  {
    id: 'th_exploring_devtools_repl',
    conceptId: 'exploring_devtools_repl',
    unitId: 1,
    title: 'Ambientes de Execução: DevTools do Navegador & Node.js REPL',
    category: 'Fundamentos',
    summary: 'Aprenda como testar e experimentar código JavaScript instantaneamente no Console do Navegador (F12) e no terminal interativo do Node.js (REPL).',
    whatIsIt: `Para aprender uma nova linguagem de programação como JavaScript, a prática imediata é essencial. Em vez de criar arquivos complexos para cada teste, podemos usar um **interpretador interativo**.

Existem duas formas principais recomendadas por David Flanagan em *JavaScript: The Definitive Guide*:

1. **Console do Navegador (Browser DevTools)**:
   * Abra pressionando **F12** ou **Ctrl + Shift + I** (Windows/Linux) / **Cmd + Option + I** (macOS).
   * Selecione a aba **Console**. Você pode digitar expressões diretamente e ver o resultado imediato (REPL in-browser).

2. **Node.js REPL (Read-Eval-Print Loop)**:
   * Abra seu terminal e digite \`node\` para iniciar a sessão interativa.
   * Comandos especiais com ponto:
     * \`.help\`: Exibe a lista de comandos do interpretador.
     * \`.editor\`: Entra no modo multilinhas para digitar blocos sem executar a cada Enter.
     * \`.break\` ou \`Ctrl + C\`: Cancela uma instrução inacabada e retorna ao prompt limpo.
     * \`.exit\` ou \`Ctrl + D\`: Encerra a sessão do Node.js.`,
    whyItMatters: `* **Feedback Instantâneo**: Teste dúvidas de sintaxe e comportamento de APIs em menos de 2 segundos.
* **Depuração Ágil**: Inspecione o estado real de variáveis sem precisar recompilar a aplicação.
* **Compreensão de Convenções**: Nos livros técnicos de JS, o comentário \`// =>\` indica a saída interativa produzida pelo interpretador.`,
    comparison: {
      headers: ['Recurso', 'DevTools (Navegador)', 'Node.js REPL (Terminal)'],
      rows: [
        {
          feature: 'Acesso a APIs Web (DOM, window)',
          values: {
            'DevTools (Navegador)': 'Sim (document, window, fetch)',
            'Node.js REPL (Terminal)': 'Não (possui global, process, fs)',
          },
        },
        {
          feature: 'Como Iniciar',
          values: {
            'DevTools (Navegador)': 'F12 ou Ctrl+Shift+I -> Console',
            'Node.js REPL (Terminal)': 'Comando "node" no terminal',
          },
        },
        {
          feature: 'Modo Multilinhas',
          values: {
            'DevTools (Navegador)': 'Shift + Enter',
            'Node.js REPL (Terminal)': 'Comando .editor',
          },
        },
      ],
    },
    codeExamples: [
      {
        title: '1. Teste rápido no Console',
        code: `console.log("Olá, DevTools!");
3 * 2; // => 6`,
        explanation: 'No console, a última expressão avaliada é automaticamente impressa mesmo sem console.log explícito.',
      },
      {
        title: '2. Saída formatada no Node.js',
        code: `const versao = process.version;
console.log(\`Executando no Node \${versao}\`);`,
        explanation: 'O objeto global process expõe metadados do ambiente de execução do servidor.',
      },
    ],
    pitfalls: [
      'Tentar acessar objetos do navegador (como window ou document) dentro do Node.js resulta em ReferenceError.',
      'Dar Enter simples no Node REPL ao meio de um bloco pode disparar SyntaxError caso a instrução não esteja com parênteses/chaves abertas; use .editor para blocos grandes.',
    ],
    tags: ['devtools', 'console', 'repl', 'node', 'flanagan'],
    relatedConcepts: ['variables_var_let_const', 'exploring_objects_optional_chaining'],
  },
  {
    id: 'th_exploring_objects_optional_chaining',
    conceptId: 'exploring_objects_optional_chaining',
    unitId: 1,
    title: 'Estruturas de Dados e Optional Chaining (?.)',
    category: 'Fundamentos',
    summary: 'Compreenda como criar objetos e arrays literais, estruturas aninhadas e navegar com segurança usando o operador Optional Chaining (?.).',
    whatIsIt: `JavaScript suporta duas estruturas fundamentais para agrupar dados:
* **Objetos**: Coleções de pares chave/valor (propriedades). Criados com chaves \`{ chave: valor }\`.
* **Arrays**: Listas ordenadas e indexadas numericamente a partir de zero. Criados com colchetes \`[ item1, item2 ]\`.

Desde o **ES2020**, o operador **Optional Chaining (?.)** permite acessar propriedades profundamente aninhadas sem o perigo de quebrar a aplicação caso um objeto intermediário seja \`null\` ou \`undefined\`.`,
    whyItMatters: `Em aplicações reais consumindo APIs, nem todos os nós de dados vêm preenchidos. Sem o \`?.\`, o código dispara \`TypeError: Cannot read properties of undefined\`. Com o \`?.\`, ele avalia graciosamente para \`undefined\`.`,
    codeExamples: [
      {
        title: '1. Objeto literal e Optional Chaining',
        code: `let book = {
  topic: "JavaScript",
  edition: 7
};

console.log(book.topic); // => "JavaScript"
console.log(book["edition"]); // => 7 (notação de colchete)

// Acesso seguro: não quebra se contents não existir!
console.log(book.contents?.ch01?.sect1); // => undefined`,
        explanation: 'O encadeamento opcional interrompe a leitura imediatamente se encontrar null/undefined e retorna undefined com segurança.',
      },
      {
        title: '2. Arrays e Estruturas Aninhadas',
        code: `let primes = [2, 3, 5, 7];
console.log(primes[0]); // => 2 (primeiro elemento)
console.log(primes[primes.length - 1]); // => 7 (último elemento)

// Array contendo objetos
let points = [
  { x: 0, y: 0 },
  { x: 1, y: 1 }
];
console.log(points[1].x - points[0].x); // => 1`,
        explanation: 'Fórmula canônica para acessar o último elemento de qualquer array: array[array.length - 1].',
      },
    ],
    pitfalls: [
      'Acessar uma propriedade em um valor que é null/undefined sem ?. lança TypeError fatal.',
      'O índice de array fora dos limites (ex: primes[99]) não lança erro em JS, retorna undefined.',
    ],
    tags: ['objects', 'arrays', 'optional-chaining', 'es2020', 'flanagan'],
    relatedConcepts: ['exploring_devtools_repl', 'exploring_operators_expressions'],
  },
  {
    id: 'th_exploring_operators_expressions',
    conceptId: 'exploring_operators_expressions',
    unitId: 1,
    title: 'Expressões, Operadores e Coerção no JavaScript',
    category: 'Fundamentos',
    summary: 'Entenda as regras de soma vs concatenação ("3" + "2"), atalhos aritméticos, comparação lexicográfica de texto e operadores booleanos.',
    whatIsIt: `Uma **expressão** é qualquer frase de código em JavaScript que pode ser avaliada para produzir um valor.
Os **operadores** atuam sobre operandos para calcular novos resultados.

No Capítulo 1 do livro, destacam-se:
1. **Aritmética e Concatenação**: O operador \`+\` soma números (\`3 + 2 = 5\`), mas concatena texto se houver string (\`"3" + "2" = "32"\`).
2. **Atalhos Aritméticos**: \`count++\`, \`count += 2\`, \`count *= 3\`.
3. **Igualdade Estrita (\`===\`) vs Desigualdade (\`!==\`)**: Comparam valor e tipo sem coerção arbitrária.
4. **Comparações de Strings**: Strings são comparadas por ordem alfabética Unicode caractere a caractere (\`"two" > "three"\` é true porque "w" > "h").`,
    whyItMatters: `Erros de coerção implícita com \`+\` ou \`==\` são fontes clássicas de bugs em JavaScript. Dominar operadores estritos garante previsibilidade e código robusto.`,
    codeExamples: [
      {
        title: '1. Soma vs Concatenação',
        code: `console.log(3 + 2);   // => 5 (número)
console.log("3" + "2"); // => "32" (string concatenada)
console.log("3" + 2);   // => "32" (coerção para string)`,
        explanation: 'A presença de uma string transforma a adição em concatenação.',
      },
      {
        title: '2. Operações lógicas combinadas',
        code: `let x = 2, y = 3;
console.log((x === 2) && (y === 3)); // => true (AND: ambos verdadeiros)
console.log((x > 3) || (y < 3));    // => false (OR: nenhum verdadeiro)
console.log(!(x === y));             // => true (NOT: inverte false para true)`,
        explanation: 'Operadores booleanos clássicos permitem construir árvores de decisão lógicas.',
      },
    ],
    pitfalls: [
      'Usar == em vez de === pode converter strings em números involuntariamente ("0" == false é true).',
    ],
    tags: ['operators', 'expressions', 'coercion', 'flanagan'],
    relatedConcepts: ['operators_equality', 'exploring_functions_arrow'],
  },
  {
    id: 'th_exploring_functions_arrow',
    conceptId: 'exploring_functions_arrow',
    unitId: 1,
    title: 'Funções Clássicas vs Arrow Functions e Composição',
    category: 'Funções',
    summary: 'Domine a sintaxe compacta das Arrow Functions (x => x + 1), retorno implícito e composição de chamadas aninhadas.',
    whatIsIt: `Uma **função** é um bloco parametrizado e nomeado de código que pode ser invocado repetidamente.
No ES6, surgiram as **Arrow Functions** (\`=>\`), que oferecem uma sintaxe enxuta ideal para callbacks e programação funcional.

Diferenças essenciais de sintaxe:
* **Corpo Conciso**: \`const plus1 = x => x + 1;\` (retorno implícito, sem chaves).
* **Corpo em Bloco**: \`const plus1 = (x) => { return x + 1; };\` (exige a palavra \`return\`).`,
    whyItMatters: `Arrow functions tornam expressões de transformação de dados limpas e fáceis de compor, como \`square(plus1(y))\`.`,
    codeExamples: [
      {
        title: '1. Declaração vs Arrow Function',
        code: `// Função Tradicional
function plus1(x) {
  return x + 1;
}

// Arrow Function equivalente
const plus1Arrow = x => x + 1;

console.log(plus1(3)); // => 4
console.log(plus1Arrow(3)); // => 4`,
        explanation: 'Ambas executam a mesma lógica, mas a arrow function elimina boilerplate.',
      },
      {
        title: '2. Composição de Funções',
        code: `const plus1 = x => x + 1;
const square = x => x * x;

let y = 3;
console.log(square(plus1(y))); // => 16 (4 ao quadrado)`,
        explanation: 'O retorno de plus1(3) torna-se o argumento de entrada de square().',
      },
    ],
    pitfalls: [
      'Esquecer a palavra return ao abrir chaves em uma arrow function: `x => { x + 1 }` retorna undefined!',
    ],
    tags: ['functions', 'arrow-functions', 'composition', 'es6', 'flanagan'],
    relatedConcepts: ['arrow_functions', 'exploring_methods_classes'],
  },
  {
    id: 'th_exploring_methods_classes',
    conceptId: 'exploring_methods_classes',
    unitId: 1,
    title: 'Métodos, Palavra-Chave this e Classes ES6',
    category: 'POO & Protótipos',
    summary: 'Descubra como funções viram métodos quando anexadas a objetos, o papel de this e a sintaxe de classes modernas com constructor.',
    whatIsIt: `Quando uma função é atribuída a uma propriedade de um objeto, ela é chamada de **método**.
Dentro do método, a palavra-chave especial **\`this\`** aponta para o próprio objeto que invocou a função.

O ES6 formalizou essa estrutura com a sintaxe de **Classes**:
\`\`\`javascript
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  distance() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
}
let p = new Point(3, 4);
\`\`\``,
    whyItMatters: `A orientação a objetos com classes organiza modelos de domínio complexos e encapsula comportamento com seus dados.`,
    codeExamples: [
      {
        title: '1. Método com cálculo de distância euclidiana via this',
        code: `let points = [
  { x: 0, y: 0 },
  { x: 3, y: 4 }
];

// Anexando método dinamicamente
points.dist = function() {
  let p1 = this[0];
  let p2 = this[1];
  let a = p2.x - p1.x;
  let b = p2.y - p1.y;
  return Math.sqrt(a * a + b * b);
};

console.log(points.dist()); // => 5`,
        explanation: 'this[0] e this[1] acessam os elementos do array points durante a chamada.',
      },
      {
        title: '2. Iteração moderna com for...of',
        code: `let primes = [2, 3, 5, 7];
let sum = 0;
for (let n of primes) {
  sum += n;
}
console.log(sum); // => 17`,
        explanation: 'for...of itera de forma limpa sobre os valores de qualquer estrutura iterável.',
      },
    ],
    pitfalls: [
      'Chamar um construtor de classe sem o operador new lança TypeError: Class constructor cannot be invoked without new.',
      'Arrow functions não devem ser usadas como métodos com this se você precisar que this aponte para o objeto chamador.',
    ],
    tags: ['classes', 'this', 'methods', 'for-of', 'flanagan'],
    relatedConcepts: ['classes_es6', 'this_binding'],
  },
  {
    id: 'th_var',
    conceptId: 'variables_var_let_const',
    unitId: 2,
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
  // ==========================================
  // UNIDADE 12: ARQUITETURA DE SCRIPTS, BOOTSTRAP & IDEMPOTÊNCIA NO DOM
  // ==========================================
  {
    id: 'th_script_bootstrap_lifecycle',
    conceptId: 'script_bootstrap_lifecycle',
    unitId: 12,
    title: 'Bootstrap (Inicialização) & Ciclo de Vida do DOM',
    category: 'DOM & Web',
    summary: 'Aprenda o padrão de inicialização (Bootstrap) seguro para scripts de navegador e extensões, controlando document.readyState e DOMContentLoaded para evitar erros de execução antecipada ou tardia.',
    whatIsIt: `O **Bootstrap (Inicialização)** é o ponto de partida do seu script: a função mestra que "monta" o seu painel, instancia seus controladores, cria botões e coloca tudo no lugar correto da página.

### O Desafio do Ciclo de Vida do DOM
Um userscript ou extensão pode ser injetado em momentos imprevisíveis pelo navegador:
1. **\`document.readyState === 'loading'\`**: O HTML ainda está sendo baixado e analisado. Elementos essenciais como \`document.body\` podem ser \`null\`!
2. **\`document.readyState === 'interactive'\`**: O HTML foi totalmente parseado e a árvore DOM está montada (dispara o evento \`DOMContentLoaded\`).
3. **\`document.readyState === 'complete'\`**: Todos os recursos adicionais (imagens, stylesheets, iframes) foram baixados (dispara \`window.onload\`).

### O Padrão Canônico Seguro de Bootstrap:
\`\`\`javascript
if (document.readyState === 'loading') {
  // O DOM ainda está carregando: aguarde o evento DOMContentLoaded
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  // O DOM já está pronto (interactive ou complete): execute imediatamente!
  start();
}
\`\`\`

> **Por que usar \`{ once: true }\`?**
> A opção \`{ once: true }\` faz com que o navegador remova o ouvinte automaticamente da memória assim que ele dispara a primeira vez, evitando ouvintes fantasmas e vazamentos de memória.`,
    whyItMatters: `* Se você apenas adicionar \`document.addEventListener('DOMContentLoaded', start)\` quando a página já terminou de carregar, **o evento nunca irá disparar** e seu script ficará travado em silêncio.
* Se você tentar executar \`start()\` imediatamente sem verificar se o estado é \`loading\`, o script tentará acessar \`document.body\` e lançará um erro fatal: \`Cannot read properties of null\`.
* O padrão de verificação dupla garante que o script funcione perfeitamente em qualquer momento de injeção (\`@run-at document-start\`, \`document-end\` ou \`document-idle\`).`,
    comparison: {
      headers: ['Estado (readyState)', 'O que está pronto no navegador?', 'Ação correta do script'],
      rows: [
        {
          feature: "'loading'",
          values: {
            'Estado (readyState)': 'HTML inicial em download',
            'O que está pronto no navegador?': 'Apenas o objeto document raiz (body pode ser null)',
            'Ação correta do script': "Adicionar listener DOMContentLoaded com { once: true }",
          },
        },
        {
          feature: "'interactive'",
          values: {
            'Estado (readyState)': 'Árvore DOM completa montada',
            'O que está pronto no navegador?': 'document.body e todos os elementos HTML presentes',
            'Ação correta do script': 'Executar start() imediatamente',
          },
        },
        {
          feature: "'complete'",
          values: {
            'Estado (readyState)': 'Página 100% carregada',
            'O que está pronto no navegador?': 'Imagens, fontes, CSS e scripts externos prontos',
            'Ação correta do script': 'Executar start() imediatamente',
          },
        },
      ],
    },
    codeExamples: [
      {
        title: '1. Padrão Universal de Inicialização Segura',
        code: `function start() {
  console.log('🚀 Script inicializado com sucesso no nó:', document.body);
}

// Inicialização segura compatível com qualquer momento de injeção:
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}`,
        explanation: 'Se a página já carregou, executa imediatamente; caso contrário, aguarda o DOM ficar pronto com descarte automático do listener.',
      },
    ],
    pitfalls: [
      "Registrar addEventListener('DOMContentLoaded', start) sem testar readyState: se o script rodar após o carregamento, a função nunca será chamada.",
      "Tentar manipular document.body no topo do arquivo fora da função start().",
    ],
    tags: ['bootstrap', 'dom', 'readystate', 'domcontentloaded', 'ciclo-de-vida', 'userscripts', 'extensoes'],
    relatedConcepts: ['idempotency_golden_rule', 'spa_dom_mutation_observer'],
  },
  {
    id: 'th_idempotency_golden_rule',
    conceptId: 'idempotency_golden_rule',
    unitId: 12,
    title: 'Idempotência & A Regra de Ouro (O Interruptor de Luz)',
    category: 'Avançado',
    summary: 'Entenda a propriedade de idempotência no desenvolvimento frontend: executar uma ação 1 vez ou 100 vezes gera exatamente o mesmo resultado final sem duplicar elementos nem criar efeitos colaterais.',
    whatIsIt: `**Idempotente (A Regra de Ouro)**: É uma propriedade onde executar uma ação 1 vez ou 100 vezes gera exatamente o mesmo resultado final, sem efeitos colaterais indesejados.

💡 **Analogia do mundo real**: 
> Apertar o interruptor para "Acender a luz". Se a luz já estiver acesa e você mandar "acender", nada muda (continua apenas uma luz acesa). Não surgem 2 ou 3 lâmpadas mágicas.

---

### O Perigo da Falta de Idempotência no DOM
Em páginas web dinâmicas, funções de inicialização podem ser chamadas múltiplas vezes (por eventos de rota, mutações do DOM ou recarregamento parcial). 

Se uma função \`start()\` não for idempotente:
* Ela criará **5 barras laterais** se for chamada 5 vezes.
* Ela registrará **5 botões repetidos** na tela.
* Ela duplicará event listeners, disparando a mesma ação várias vezes a cada clique do usuário!

---

### As 3 Guardas de Idempotência no Código:

#### 1. Guarda Singleton da Instância do App
\`\`\`typescript
let app: SinSidebarApp | null = null;

function start(): void {
  // REGRA DE OURO: Se a aplicação já foi montada, saia imediatamente!
  if (app) return;

  if (!shouldBootstrapSinSidebar()) {
    scheduleBootstrapObserver();
    return;
  }

  cleanupBootstrapObserver();
  app = new SinSidebarApp();
  app.init();
}
\`\`\`

#### 2. Guarda do Agendador de Observação
\`\`\`typescript
function scheduleBootstrapObserver(): void {
  // Se o app já existe OU já há um observador ativo, não crie outro!
  if (app || bootstrapObserver) return;
  ...
}
\`\`\`

#### 3. Padrão "Limpar antes de Recriar" (Clean-before-Set)
\`\`\`typescript
function syncAlwaysOpenMenu(): void {
  // Remove o menu anterior antes de registrar o novo para nunca duplicar no Tampermonkey!
  unregisterAlwaysOpenMenu();
  alwaysOpenMenuId = GM_registerMenuCommand(label, callback);
}
\`\`\``,
    whyItMatters: `* Garante robustez absoluta: o usuário ou o sistema podem chamar \`start()\` centenas de vezes sem risco de duplicar elementos ou consumir memória excessiva.
* Evita bugs invisíveis de memória onde listeners duplicados continuam executando em segundo plano.
* Transforma sistemas complexos e assíncronos em fluxos previsíveis e fáceis de depurar.`,
    comparison: {
      headers: ['Aspecto', 'Código NÃO Idempotente ❌', 'Código Idempotente (Regra de Ouro) ✅'],
      rows: [
        {
          feature: 'Chamada 1x',
          values: {
            'Aspecto': 'Execução inicial',
            'Código NÃO Idempotente ❌': 'Cria 1 painel na tela',
            'Código Idempotente (Regra de Ouro) ✅': 'Cria 1 painel na tela',
          },
        },
        {
          feature: 'Chamada 10x consecutivas',
          values: {
            'Aspecto': 'Múltiplas invocações',
            'Código NÃO Idempotente ❌': 'Cria 10 painéis sobrepostos e 10 listeners clonados',
            'Código Idempotente (Regra de Ouro) ✅': 'Mantém exatamente 1 painel, ignora invocações extras',
          },
        },
        {
          feature: 'Mecanismo de Proteção',
          values: {
            'Aspecto': 'Guarda de Estado',
            'Código NÃO Idempotente ❌': 'Nenhuma checagem prévia',
            'Código Idempotente (Regra de Ouro) ✅': 'if (app) return; e unregisterAntesDeRegistrar()',
          },
        },
      ],
    },
    codeExamples: [
      {
        title: 'Exemplo: Função de Injeção Idempotente',
        code: `let sidePanelInstance = null;

function injectSidePanel() {
  // Guarda de Idempotência:
  if (sidePanelInstance !== null || document.getElementById('my-unique-panel')) {
    console.log('Painel já está montado. Nenhuma ação necessária.');
    return sidePanelInstance;
  }

  const panel = document.createElement('div');
  panel.id = 'my-unique-panel';
  panel.textContent = 'Painel Único e Idempotente';
  document.body.appendChild(panel);

  sidePanelInstance = panel;
  return sidePanelInstance;
}

// Chamando 3 vezes seguidas:
injectSidePanel();
injectSidePanel();
injectSidePanel();
// Resultado no DOM: Apenas 1 painel criado!`,
        explanation: 'A checagem do singleton e do ID do elemento no DOM impede criações redundantes.',
      },
    ],
    pitfalls: [
      'Esquecer a guarda if (app) return no início da função start().',
      'Registrar comandos no menu de extensões (GM_registerMenuCommand) sem desregistrar o ID anterior, acumulando opções repetidas no menu.',
    ],
    tags: ['idempotencia', 'arquitetura', 'regra-de-ouro', 'interruptor', 'singleton', 'resiliencia'],
    relatedConcepts: ['script_bootstrap_lifecycle', 'spa_dom_mutation_observer', 'storage_menu_cleanup_lifecycle'],
  },
  {
    id: 'th_spa_dom_mutation_observer',
    conceptId: 'spa_dom_mutation_observer',
    unitId: 12,
    title: 'Reconstrução do DOM em SPAs & MutationObserver com Timeout',
    category: 'DOM & Web',
    summary: 'Entenda como SPAs (React, Vue, Angular) destroem e reconstroem o DOM e aprenda a usar MutationObserver com temporizador de segurança para injetar elementos no momento ideal sem vazamento de memória.',
    whatIsIt: `### Reconstrução do DOM em SPAs
Em sites modernos desenvolvidos em **React, Vue ou Angular** (Single Page Applications - SPAs), a página **não recarrega do zero (sem refresh F5)** ao navegar entre abas ou telas. O JavaScript do framework simplesmente apaga partes do HTML existente e desenha novos nós no DOM em tempo real.

---

### O Problema para Scripts e Extensões
Se o seu script tentar encontrar um container de formulário ou uma tabela imediatamente no carregamento da página, a busca falhará porque o React ainda está fazendo o \`fetch\` dos dados ou esperando o componente montar.

---

### A Solução Reativa: \`MutationObserver\`
O \`MutationObserver\` é uma API nativa do navegador que vigia alterações na árvore do DOM (nós adicionados ou removidos).

\`\`\`typescript
function scheduleBootstrapObserver(): void {
  if (app || bootstrapObserver) return;

  const observeRoot = document.body ?? document.documentElement;
  if (!observeRoot) return;

  // Cria o observador que chama start() a cada mudança estrutural do HTML
  bootstrapObserver = new MutationObserver(() => {
    start();
  });

  // Observa filhos diretos e toda a subárvore profunda
  bootstrapObserver.observe(observeRoot, {
    childList: true,
    subtree: true
  });

  // Timeout de Segurança (15 segundos) para evitar vazamento de memória
  bootstrapCleanupTimer = window.setTimeout(() => {
    cleanupBootstrapObserver();
  }, BOOTSTRAP_OBSERVER_TIMEOUT_MS);
}
\`\`\`

---

### Por que o Timeout de Limpeza é Essencial?
Um \`MutationObserver\` com \`subtree: true\` monitora milhares de alterações por segundo. Se o usuário estiver em uma página onde o elemento alvo **nunca** vai existir, o observador continuaria rodando indefinidamente, consumindo ciclos preciosos de CPU.
O timeout de 15 segundos desconecta o observador automaticamente caso o alvo não surja.`,
    whyItMatters: `* Permite que seu script detecte a renderização assíncrona de componentes React sem usar \`setInterval\` com polling agressivo.
* Assim que o alvo é encontrado e o app é instanciado, chamamos \`cleanupBootstrapObserver()\`, desconectando o observador e limpando o timer com \`window.clearTimeout\`.
* Mantém o navegador fluido a 60 quadros por segundo.`,
    comparison: {
      headers: ['Abordagem', 'Como Funciona', 'Impacto na Performance', 'Resiliência a SPAs'],
      rows: [
        {
          feature: 'setInterval (Polling Antigo)',
          values: {
            'Abordagem': 'Roda uma checagem a cada 500ms continuamente',
            'Como Funciona': 'Executa código mesmo quando nada mudou na página',
            'Impacto na Performance': 'Ruim: desperdiça CPU e bateria constantemente',
            'Resiliência a SPAs': 'Média (atraso fixo de detecção)',
          },
        },
        {
          feature: 'MutationObserver com Timeout',
          values: {
            'Abordagem': 'Notificação orientada a eventos nativos do DOM',
            'Como Funciona': 'Só executa exatamente quando nós são inseridos/removidos',
            'Impacto na Performance': 'Excelente: pausa imediata após o bootstrap',
            'Resiliência a SPAs': 'Máxima (reativo e instantâneo)',
          },
        },
      ],
    },
    codeExamples: [
      {
        title: 'Gerenciamento do Ciclo de Vida do MutationObserver',
        code: `let observer = null;
let safetyTimer = 0;

function cleanupObserver() {
  if (observer) {
    observer.disconnect(); // Desliga a escuta do DOM
    observer = null;
  }
  if (safetyTimer) {
    window.clearTimeout(safetyTimer); // Cancela o timer pendente
    safetyTimer = 0;
  }
}

function observeUntilElementReady(selector, onReady) {
  const existing = document.querySelector(selector);
  if (existing) {
    onReady(existing);
    return;
  }

  observer = new MutationObserver(() => {
    const el = document.querySelector(selector);
    if (el) {
      cleanupObserver(); // Desconecta assim que encontra!
      onReady(el);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Desiste após 10 segundos para não vazar memória
  safetyTimer = window.setTimeout(cleanupObserver, 10000);
}`,
        explanation: 'O padrão observa apenas até o elemento surgir, desconectando imediatamente ou desistindo após o tempo limite.',
      },
    ],
    pitfalls: [
      'Esquecer de chamar observer.disconnect() após instanciar a aplicação, mantendo o observador rodando para sempre.',
      'Não limpar o setTimeout com clearTimeout() ao inicializar com sucesso.',
    ],
    tags: ['spa', 'mutationobserver', 'react', 'dom', 'performance', 'memory-leak', 'timeout'],
    relatedConcepts: ['script_bootstrap_lifecycle', 'idempotency_golden_rule', 'production_script_architecture'],
  },
  {
    id: 'th_storage_menu_cleanup_lifecycle',
    conceptId: 'storage_menu_cleanup_lifecycle',
    unitId: 12,
    title: 'Sincronização entre Abas (Storage), Menus Tampermonkey & Teardown com beforeunload',
    category: 'Avançado',
    summary: 'Aprenda a sincronizar estado entre diferentes abas do navegador em tempo real com StorageEvent, gerenciar menus dinâmicos e realizar a limpeza completa (teardown) ao fechar a página com beforeunload.',
    whatIsIt: `### 1. Sincronização entre Abas com \`StorageEvent\`
Quando o usuário altera uma configuração no \`localStorage\` na Aba 1, o navegador dispara automaticamente o evento global \`'storage'\` em todas as **outras abas abertas da mesma origem**!

\`\`\`typescript
function handleStorageEvent(event: Event): void {
  const storageEvent = event as StorageEvent;
  // Filtra apenas eventos relevantes para a chave de configurações do nosso script:
  if (storageEvent.key !== null && storageEvent.key !== SETTINGS_KEY) return;
  syncAlwaysOpenMenu();
}

globalThis.addEventListener('storage', handleStorageEvent);
\`\`\`

---

### 2. Menus Dinâmicos com Tampermonkey / Greasemonkey (\`GM_*\`)
Scripts de extensão frequentemente oferecem comandos no menu do navegador através de \`GM_registerMenuCommand\`.
* Ao alternar uma opção (ex: "Sempre Aberto: LIGADO"), desregistramos o ID anterior com \`GM_unregisterMenuCommand(alwaysOpenMenuId)\`.
* Em seguida, registramos o novo comando com o rótulo atualizado, mantendo o menu sempre consistente e sem entradas duplicadas.

---

### 3. O Ciclo de Limpeza Graciosa com \`beforeunload\`
Quando o usuário navega para outro site ou fecha a aba, o evento \`'beforeunload'\` é disparado. Esse é o momento crítico para fazer o **Teardown (Limpeza)**:

\`\`\`typescript
globalThis.addEventListener('beforeunload', () => {
  // 1. Remove listeners globais para evitar referências presas
  globalThis.removeEventListener('storage', handleStorageEvent);
  globalThis.removeEventListener(SETTINGS_CHANGED_EVENT, handleSettingsChanged as EventListener);

  // 2. Desconecta observadores e cancela timers pendentes
  cleanupBootstrapObserver();

  // 3. Remove menus registrados da extensão
  unregisterAlwaysOpenMenu();

  // 4. Invoca o método destroy() de cada módulo da aplicação
  unspscQuickFill?.destroy();
  app?.destroy();
}, { once: true });
\`\`\``,
    whyItMatters: `* **Sincronização Instantânea**: Alterar o tema ou preferências em uma aba reflete imediatamente em todas as outras abas sem precisar recarregar (F5).
* **Prevenção de Vazamento de Memória**: O teardown com \`beforeunload\` garante que websockets, timers, observadores e referências do DOM sejam liberados pelo coletor de lixo (Garbage Collector).
* **Experiência Limpa no Tampermonkey**: Menus dinâmicos evitam poluição visual na interface do usuário.`,
    comparison: {
      headers: ['Mecanismo', 'Quando Dispara?', 'Finalidade Principal'],
      rows: [
        {
          feature: "Evento 'storage'",
          values: {
            'Mecanismo': "window.addEventListener('storage')",
            'Quando Dispara?': 'Quando outra aba do mesmo domínio altera o localStorage',
            'Finalidade Principal': 'Sincronizar configurações cross-tab em tempo real',
          },
        },
        {
          feature: 'CustomEvent (SETTINGS_CHANGED)',
          values: {
            'Mecanismo': "globalThis.addEventListener(CUSTOM_EVENT)",
            'Quando Dispara?': 'Quando a aba atual altera suas próprias configurações',
            'Finalidade Principal': 'Atualizar a interface da aba corrente imediatamente',
          },
        },
        {
          feature: "Evento 'beforeunload'",
          values: {
            'Mecanismo': "window.addEventListener('beforeunload')",
            'Quando Dispara?': 'Imediatamente antes da aba ser fechada ou recarregada',
            'Finalidade Principal': 'Destruir instâncias, remover listeners e desconectar observadores',
          },
        },
      ],
    },
    codeExamples: [
      {
        title: 'Exemplo de Módulo com Ciclo de Vida Completo (Init / Destroy)',
        code: `class MeuModulo {
  private intervalId = 0;

  init() {
    this.intervalId = window.setInterval(() => console.log('Ping ativo'), 5000);
    console.log('Módulo inicializado.');
  }

  destroy() {
    window.clearInterval(this.intervalId);
    console.log('Módulo destruído e memória liberada.');
  }
}

let modulo = new MeuModulo();
modulo.init();

// Limpeza no encerramento da página:
window.addEventListener('beforeunload', () => {
  modulo?.destroy();
  modulo = null;
}, { once: true });`,
        explanation: 'Classes de componentes profissionais sempre expõem um método destroy() emparelhado com o init().',
      },
    ],
    pitfalls: [
      "Achar que o evento 'storage' dispara na própria aba que executou localStorage.setItem() — ele só dispara nas OUTRAS abas abertas.",
      "Esquecer de chamar removeEventListener no beforeunload quando usar listeners de longa duração.",
    ],
    tags: ['storage', 'localstorage', 'tampermonkey', 'beforeunload', 'cleanup', 'teardown', 'cross-tab'],
    relatedConcepts: ['script_bootstrap_lifecycle', 'idempotency_golden_rule', 'production_script_architecture'],
  },
  {
    id: 'th_production_script_architecture',
    conceptId: 'production_script_architecture',
    unitId: 12,
    title: 'Análise Ponta a Ponta: Script de Injeção em Produção',
    category: 'Avançado',
    summary: 'Dissecção linha por linha e estudo aprofundado do script real de inicialização do SinSidebar & UnspscQuickFill, conectando todos os conceitos arquiteturais.',
    whatIsIt: `### Estudo do Script Real de Produção
Abaixo está o script completo analisado bloco a bloco, com explicações de cada responsabilidade:

\`\`\`typescript
// ============================================================================
// 1. IMPORTAÇÕES E DECLARAÇÕES GLOBAIS DE TIPOS
// ============================================================================
import { SinSidebarApp } from './app';
import {
  getAlwaysOpenMenuLabel,
  loadSettings,
  saveSettings,
  SETTINGS_CHANGED_EVENT,
  SETTINGS_KEY,
  type SinPanelSettings
} from './state';
import { shouldBootstrapSinSidebar } from './runtime-guard';
import { UnspscQuickFillApp } from './unspsc-quick-fill';

// Tipagem segura para APIs de extensões (Tampermonkey/Violentmonkey)
declare const GM_registerMenuCommand:
  | ((caption: string, onClick: () => void, accessKey?: string) => number | string)
  | undefined;
declare const GM_unregisterMenuCommand:
  | ((menuCommandId: number | string) => void)
  | undefined;

// ============================================================================
// 2. ESTADO SINGLETON E TEMPORIZADORES DO MÓDULO
// ============================================================================
let app: SinSidebarApp | null = null;
let unspscQuickFill: UnspscQuickFillApp | null = null;
let alwaysOpenMenuId: number | string | null = null;
let bootstrapObserver: MutationObserver | null = null;
let bootstrapCleanupTimer = 0;

const BOOTSTRAP_OBSERVER_TIMEOUT_MS = 15000; // Limite de 15s para busca no DOM

// ============================================================================
// 3. GERENCIAMENTO IDEMPOTENTE DO MENU DA EXTENSÃO
// ============================================================================
function unregisterAlwaysOpenMenu(): void {
  if (alwaysOpenMenuId === null || typeof GM_unregisterMenuCommand !== 'function') return;
  GM_unregisterMenuCommand(alwaysOpenMenuId);
  alwaysOpenMenuId = null;
}

function syncAlwaysOpenMenu(): void {
  if (typeof GM_registerMenuCommand !== 'function') return;

  unregisterAlwaysOpenMenu(); // Remove o menu anterior para evitar duplicatas
  const settings = loadSettings();
  const label = getAlwaysOpenMenuLabel(settings.alwaysOpen);

  alwaysOpenMenuId = GM_registerMenuCommand(label, () => {
    const currentSettings = loadSettings();
    const nextSettings: SinPanelSettings = {
      ...currentSettings,
      alwaysOpen: !currentSettings.alwaysOpen
    };

    saveSettings(nextSettings);
    app?.applySettings(nextSettings);
    syncAlwaysOpenMenu(); // Re-sincroniza para atualizar o texto do rótulo
  });
}

// ============================================================================
// 4. TRATADORES DE EVENTOS REATIVOS (Cross-tab & In-page)
// ============================================================================
function handleStorageEvent(event: Event): void {
  const storageEvent = event as StorageEvent;
  if (storageEvent.key !== null && storageEvent.key !== SETTINGS_KEY) return;
  syncAlwaysOpenMenu();
}

function handleSettingsChanged(): void {
  syncAlwaysOpenMenu();
}

// ============================================================================
// 5. OBSERVAÇÃO REATIVA DO DOM (COM LIMPEZA DE MEMÓRIA)
// ============================================================================
function cleanupBootstrapObserver(): void {
  if (bootstrapObserver) {
    bootstrapObserver.disconnect();
    bootstrapObserver = null;
  }

  if (bootstrapCleanupTimer) {
    window.clearTimeout(bootstrapCleanupTimer);
    bootstrapCleanupTimer = 0;
  }
}

function scheduleBootstrapObserver(): void {
  if (app || bootstrapObserver) return; // Guarda de Idempotência

  const observeRoot = document.body ?? document.documentElement;
  if (!observeRoot) return;

  bootstrapObserver = new MutationObserver(() => {
    start();
  });

  bootstrapObserver.observe(observeRoot, {
    childList: true,
    subtree: true
  });

  bootstrapCleanupTimer = window.setTimeout(() => {
    cleanupBootstrapObserver();
  }, BOOTSTRAP_OBSERVER_TIMEOUT_MS);
}

// ============================================================================
// 6. FUNÇÃO START(): O BOOTSTRAP IDEMPOTENTE
// ============================================================================
function start(): void {
  if (app) return; // REGRA DE OURO: já instanciado, nada a fazer!
  if (!shouldBootstrapSinSidebar()) {
    scheduleBootstrapObserver(); // Alvo ainda não está pronto, agenda observador
    return;
  }

  cleanupBootstrapObserver(); // Alvo encontrado! Desliga o observador
  app = new SinSidebarApp();
  app.init();
  unspscQuickFill = new UnspscQuickFillApp();
  unspscQuickFill.init();
}

// ============================================================================
// 7. INICIALIZAÇÃO SEGURA DO DOCUMENTO
// ============================================================================
syncAlwaysOpenMenu();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}

// ============================================================================
// 8. TEARDOWN E LIMPEZA TOTAL (beforeunload)
// ============================================================================
globalThis.addEventListener('storage', handleStorageEvent);
globalThis.addEventListener(SETTINGS_CHANGED_EVENT, handleSettingsChanged as EventListener);
globalThis.addEventListener('beforeunload', () => {
  globalThis.removeEventListener('storage', handleStorageEvent);
  globalThis.removeEventListener(SETTINGS_CHANGED_EVENT, handleSettingsChanged as EventListener);
  cleanupBootstrapObserver();
  unregisterAlwaysOpenMenu();
  unspscQuickFill?.destroy();
  app?.destroy();
}, { once: true });
\`\`\``,
    whyItMatters: `Este arquivo reúne todas as boas práticas de engenharia de software frontend:
1. **Idempotência**: Nenhuma ação se duplica, mesmo com rajadas de eventos.
2. **Reatividade a SPAs**: Não assume que o DOM está pronto, observa mutações com elegância.
3. **Gerenciamento Estrito de Memória**: Desconecta observadores, cancela timers e limpa listeners.
4. **Sincronização Completa**: Suporta múltiplos contextos (abas, eventos customizados, menus de extensão).`,
    codeExamples: [
      {
        title: 'Fluxograma de Execução do Bootstrap',
        code: `// 1. Script é carregado
// 2. syncAlwaysOpenMenu() registra o menu da extensão
// 3. Checa document.readyState:
//    - Se 'loading' -> aguarda DOMContentLoaded
//    - Se 'interactive'/'complete' -> chama start() imediatamente
// 4. start():
//    - app já existe? -> return (Idempotente)
//    - Condições do DOM prontas? 
//        -> SIM: inicializa SinSidebarApp e UnspscQuickFillApp
//        -> NÃO: liga MutationObserver com timeout de 15s`,
        explanation: 'Um fluxo claro e sem brechas para exceções não tratadas.',
      },
    ],
    pitfalls: [
      'Remover a guarda if (app) return; faz com que qualquer mutação do DOM recrie novas instâncias do app.',
      'Não chamar unregisterAlwaysOpenMenu() antes de registrar um novo comando no menu.',
    ],
    tags: ['arquitetura', 'userscript', 'analise-de-codigo', 'ponta-a-ponta', 'react', 'spa', 'boas-praticas'],
    relatedConcepts: ['script_bootstrap_lifecycle', 'idempotency_golden_rule', 'spa_dom_mutation_observer', 'storage_menu_cleanup_lifecycle'],
  },
];

