# 📋 Guia para IAs: Como Criar Roadmaps Compatíveis

## ✅ Estrutura Correta

### Regras Fundamentais

1. **Array Plano**: O roadmap é um **array simples** no nível raiz
2. **SECTION**: Funciona como **divisor visual/cabeçalho** (sem `subTasks`)
3. **TASK**: Representa tarefas reais (pode ter `subTasks` opcionais)
4. **Ordem Linear**: SECTION → TASKs → SECTION → TASKs...

### Interface TypeScript

```typescript
interface SkillRoadmapItem {
  id: string;
  title: string;
  isCompleted: boolean;
  type?: 'TASK' | 'SECTION';  // 'TASK' é o padrão
  subTasks?: SkillRoadmapItem[];  // Apenas em TASK, não em SECTION
}
```

---

## 📐 Exemplo Completo e Válido

```json
[
  {
    "id": "section-fundamentos",
    "title": "📚 Fundamentos",
    "isCompleted": false,
    "type": "SECTION"
  },
  {
    "id": "task-variaveis",
    "title": "Aprender Variáveis e Tipos",
    "isCompleted": false,
    "type": "TASK",
    "subTasks": [
      {
        "id": "sub-int",
        "title": "Praticar int, double, boolean",
        "isCompleted": false
      },
      {
        "id": "sub-string",
        "title": "Trabalhar com Strings",
        "isCompleted": false
      }
    ]
  },
  {
    "id": "task-operadores",
    "title": "Dominar Operadores",
    "isCompleted": false,
    "type": "TASK"
  },
  {
    "id": "section-avancado",
    "title": "🚀 Conceitos Avançados",
    "isCompleted": false,
    "type": "SECTION"
  },
  {
    "id": "task-oop",
    "title": "Orientação a Objetos",
    "isCompleted": true,
    "type": "TASK",
    "subTasks": [
      {
        "id": "sub-classes",
        "title": "Classes e Objetos",
        "isCompleted": true
      },
      {
        "id": "sub-heranca",
        "title": "Herança e Polimorfismo",
        "isCompleted": false
      }
    ]
  }
]
```

---

## ❌ Erros Comuns a Evitar

### ❌ ERRADO: SECTION com subTasks

```json
[
  {
    "type": "SECTION",
    "title": "Fundamentos",
    "subTasks": [  // ❌ SECTION NÃO DEVE TER SUBTASKS
      { "type": "TASK", "title": "Tarefa 1" }
    ]
  }
]
```

### ❌ ERRADO: Hierarquia aninhada

```json
[
  {
    "title": "Módulo 1",
    "children": [  // ❌ Estrutura hierárquica não é suportada
      {
        "title": "Semana 1",
        "tasks": []
      }
    ]
  }
]
```

### ✅ CORRETO: Array plano com SECTIONs como separadores

```json
[
  { "type": "SECTION", "title": "Módulo 1", ... },
  { "type": "TASK", "title": "Tarefa 1.1", ... },
  { "type": "TASK", "title": "Tarefa 1.2", ... },
  { "type": "SECTION", "title": "Módulo 2", ... },
  { "type": "TASK", "title": "Tarefa 2.1", ... }
]
```

---

## 🎯 Template para Criação

Use este template como base:

```json
[
  {
    "id": "unique-id-1",
    "title": "Nome da Seção",
    "isCompleted": false,
    "type": "SECTION"
  },
  {
    "id": "unique-id-2",
    "title": "Nome da Tarefa",
    "isCompleted": false,
    "type": "TASK",
    "subTasks": [
      {
        "id": "unique-id-2-1",
        "title": "Subtarefa 1",
        "isCompleted": false
      }
    ]
  }
]
```

---

## 🔍 Validação Automática

O sistema valida automaticamente:

✅ **Máximo 500 itens** (incluindo subtarefas)  
✅ **Máximo 200KB** de tamanho  
✅ **Máximo 6 níveis** de profundidade  
✅ **IDs únicos** e sem caracteres perigosos  
✅ **Títulos limitados** a 200 caracteres  

---

## 📝 Prompt Sugerido para IAs

```
Crie um roadmap de aprendizado de [TEMA] em formato JSON seguindo estas regras:

1. Use um array plano no nível raiz
2. Use { "type": "SECTION" } para cabeçalhos/divisores (SEM subTasks)
3. Use { "type": "TASK" } para tarefas (podem ter subTasks opcionais)
4. Cada item deve ter: id, title, isCompleted (false por padrão), type
5. SubTasks são opcionais e só em TASK, nunca em SECTION
6. IDs devem ser únicos e descritivos (ex: "day-1", "task-variables")
7. Organize como: SECTION → TASKs → SECTION → TASKs...

Exemplo básico:
[
  { "id": "s1", "title": "Fundamentos", "isCompleted": false, "type": "SECTION" },
  { "id": "t1", "title": "Variáveis", "isCompleted": false, "type": "TASK" },
  { "id": "s2", "title": "Avançado", "isCompleted": false, "type": "SECTION" },
  { "id": "t2", "title": "OOP", "isCompleted": false, "type": "TASK" }
]
```

---

## 💡 Dicas de Organização

### Para Cursos de 30+ Dias

```json
[
  { "type": "SECTION", "title": "Semana 1: Fundamentos" },
  { "type": "TASK", "title": "Dia 1: Setup e Hello World" },
  { "type": "TASK", "title": "Dia 2: Variáveis e Tipos" },
  ...
  { "type": "SECTION", "title": "Semana 2: Estruturas de Controle" },
  { "type": "TASK", "title": "Dia 8: If/Else" },
  ...
]
```

### Para Projetos com Fases

```json
[
  { "type": "SECTION", "title": "Fase 1: Planejamento" },
  { "type": "TASK", "title": "Definir Requisitos", "subTasks": [...] },
  { "type": "SECTION", "title": "Fase 2: Desenvolvimento" },
  { "type": "TASK", "title": "Criar Backend", "subTasks": [...] },
  ...
]
```

---

## ✅ Checklist Final

Antes de gerar o JSON, confirme:

- [ ] É um array no nível raiz?
- [ ] SECTIONs não têm `subTasks`?
- [ ] TASKs vêm logo após suas SECTIONs?
- [ ] Todos os IDs são únicos?
- [ ] Todos os itens têm `id`, `title`, `isCompleted`?
- [ ] O `type` é "SECTION" ou "TASK" (ou omitido = TASK)?
- [ ] SubTasks só existem em TASK?

---

## 🎨 Emojis Sugeridos para Títulos

- 📚 Fundamentos / Teoria
- 🚀 Avançado / Performance
- 💻 Prática / Código
- 🧪 Testes / Labs
- 🎯 Projetos / Metas
- 🔧 Ferramentas / Setup
- 🌐 Web / Frontend
- 🗄️ Backend / Database
