import { parseIsoDate, toIsoDate } from '../app/dateUtils';
import { START_DATE } from '../app/constants';
import {
  getManualBlockContentSummary,
  resolveManualBlockContentRefs,
  resolveManualBlockContentTargets,
} from '../app/manualPlanContentRefs';
import type { ManualBlock, ManualChecklistSpecItem, SubjectKey } from '../app/types';

export interface ManualDayOverride {
  weekNumber: number;
  subjects: [SubjectKey, SubjectKey];
  objectiveQuestions: number;
  hasSimulado: boolean;
  hasRedacao: boolean;
  manualBlocks: ManualBlock[];
  manualChecklistSpec: ManualChecklistSpecItem[];
}

interface ManualDayTemplate {
  weekday: 1 | 2 | 3 | 4 | 5 | 6;
  blocks: ManualBlock[];
  objectiveQuestions?: number;
  hasSimulado?: boolean;
  hasRedacao?: boolean;
}

interface ManualWeekTemplate {
  weekNumber: number;
  startDate?: string;
  days: ManualDayTemplate[];
}

export const MANUAL_PLAN_START_DATE = START_DATE;
export const MANUAL_PLAN_END_DATE = '2026-12-05';

const MANUAL_WEEK_TEMPLATES: ManualWeekTemplate[] = [
  {
    "weekNumber": 1,
    "days": [
      {
        "weekday": 4,
        "blocks": [
          {
            "id": "w1-thu-ti-itil-servico-valor",
            "area": "TI",
            "title": "ITIL 4: serviço, valor e quatro dimensões",
            "detail": "Conceitos de serviço, cocriação de valor e 4 dimensões do gerenciamento de serviço"
          },
          {
            "id": "w1-thu-pt-interpretacao",
            "area": "PT",
            "title": "Português: interpretação, inferência e ideia principal",
            "detail": "Interpretação, inferência e identificação da ideia principal"
          }
        ]
      },
      {
        "weekday": 5,
        "blocks": [
          {
            "id": "w1-fri-ti-itil-svs-principios",
            "area": "TI",
            "title": "ITIL 4: Sistema de Valor do Serviço + princípios orientadores",
            "detail": "SVS, governança e 7 princípios orientadores da ITIL 4"
          },
          {
            "id": "w1-fri-legis-lc133-provimento",
            "area": "Legis",
            "title": "LC 133/1985: provimento, investidura e vacância",
            "detail": "Estatuto dos Servidores: provimento, posse, exercício e vacância"
          }
        ]
      },
      {
        "weekday": 6,
        "hasSimulado": true,
        "objectiveQuestions": 0,
        "blocks": [
          {
            "id": "w1-sat-simulado-diagnostico",
            "area": "TI",
            "title": "Simulado Cumulativo Fechado 1 — diagnóstico",
            "detail": "Simulado diagnóstico fechado sobre conteúdos da semana 1"
          },
          {
            "id": "w1-sat-correcao-erros",
            "area": "TI",
            "title": "Correção e classificação dos erros",
            "detail": "Correção e classificação dos erros"
          }
        ]
      }
    ]
  },
  {
    "weekNumber": 2,
    "days": [
      {
        "weekday": 1,
        "blocks": [
          {
            "id": "w2-mon-ti-itil-cadeia-praticas",
            "area": "TI",
            "title": "ITIL: cadeia de valor, práticas, incidentes, problemas e mudanças",
            "detail": "Cadeia de valor de serviço e principais práticas de gerenciamento"
          },
          {
            "id": "w2-mon-pt-sintaxe",
            "area": "PT",
            "title": "Português: sintaxe",
            "detail": "Análise sintática, termos da oração e estrutura oracional"
          }
        ]
      },
      {
        "weekday": 2,
        "blocks": [
          {
            "id": "w2-tue-ti-cobit-governanca-gestao",
            "area": "TI",
            "title": "COBIT: governança × gestão; EDM, APO, BAI, DSS e MEA",
            "detail": "Governança vs gestão e domínios EDM, APO, BAI, DSS e MEA"
          },
          {
            "id": "w2-tue-legis-lc133-direitos",
            "area": "Legis",
            "title": "LC 133: direitos e vantagens",
            "detail": "Direitos, vantagens, vencimentos e remuneração"
          }
        ]
      },
      {
        "weekday": 3,
        "blocks": [
          {
            "id": "w2-wed-ti-cobit-principios-componentes",
            "area": "TI",
            "title": "COBIT: princípios, componentes e objetivos",
            "detail": "Princípios do sistema de governança, componentes e objetivos"
          },
          {
            "id": "w2-wed-ti-sql-select-tabelas",
            "area": "TI",
            "title": "SQL: SELECT, tabelas e registros",
            "detail": "Consultas básicas, projeção, tabelas e registros"
          }
        ]
      },
      {
        "weekday": 4,
        "blocks": [
          {
            "id": "w2-thu-ti-cobit-cascata-fatores",
            "area": "TI",
            "title": "COBIT: cascata de objetivos e fatores de desenho",
            "detail": "Cascata de objetivos e fatores de desenho do sistema de governança"
          },
          {
            "id": "w2-thu-pt-concordancia",
            "area": "PT",
            "title": "Português: concordância verbal e nominal",
            "detail": "Regras gerais e casos especiais de concordância verbal e nominal"
          }
        ]
      },
      {
        "weekday": 5,
        "blocks": [
          {
            "id": "w2-fri-ti-pmbok-principios-1-6",
            "area": "TI",
            "title": "PMBOK 7: princípios 1 a 6",
            "detail": "Princípios de entrega de projetos 1 a 6"
          },
          {
            "id": "w2-fri-legis-cf-arts-37-41",
            "area": "Legis",
            "title": "Constituição Federal: arts. 37 a 41",
            "detail": "Princípios e normas constitucionais da Administração Pública e servidores civis"
          }
        ]
      },
      {
        "weekday": 6,
        "hasSimulado": true,
        "objectiveQuestions": 0,
        "blocks": [
          {
            "id": "w2-sat-simulado-fechado-2",
            "area": "TI",
            "title": "Simulado Cumulativo Fechado 2",
            "detail": "Simulado cumulativo fechado das semanas 1 e 2"
          },
          {
            "id": "w2-sat-correcao",
            "area": "TI",
            "title": "Correção",
            "detail": "Correção detalhada do simulado"
          }
        ]
      }
    ]
  },
  {
    "weekNumber": 3,
    "days": [
      {
        "weekday": 1,
        "blocks": [
          {
            "id": "w3-mon-ti-pmbok-principios-7-12",
            "area": "TI",
            "title": "PMBOK 7: princípios 7 a 12",
            "detail": "Princípios de entrega de projetos 7 a 12"
          },
          {
            "id": "w3-mon-pt-pontuacao",
            "area": "PT",
            "title": "Português: pontuação",
            "detail": "Emprego de vírgula, dois-pontos, ponto e vírgula e travessão"
          }
        ]
      },
      {
        "weekday": 2,
        "blocks": [
          {
            "id": "w3-tue-ti-pmbok-stakeholders-equipe-plan",
            "area": "TI",
            "title": "PMBOK: stakeholders, equipe e planejamento",
            "detail": "Domínios de desempenho: partes interessadas, equipe e planejamento"
          },
          {
            "id": "w3-tue-legis-lc478-artigos",
            "area": "Legis",
            "title": "LC 478/2002: artigos-chave",
            "detail": "Previdência dos Servidores do Município de Porto Alegre (PREVIMPA)"
          }
        ]
      },
      {
        "weekday": 3,
        "blocks": [
          {
            "id": "w3-wed-ti-pmbok-entrega-medicao-incerteza",
            "area": "TI",
            "title": "PMBOK: entrega, medição e incerteza",
            "detail": "Domínios de desempenho: entrega, medição e incerteza"
          },
          {
            "id": "w3-wed-ti-sql-filtros-ordenacao-funcoes",
            "area": "TI",
            "title": "SQL: filtros, ordenação e funções básicas",
            "detail": "Cláusula WHERE, ordenação com ORDER BY e funções escalares"
          }
        ]
      },
      {
        "weekday": 4,
        "blocks": [
          {
            "id": "w3-thu-ti-pmbok-tailoring-ciclo-vida",
            "area": "TI",
            "title": "PMBOK: tailoring, ciclo de vida e abordagens",
            "detail": "Adaptação, ciclo de vida do projeto e abordagens de desenvolvimento"
          },
          {
            "id": "w3-thu-pt-regencia-crase",
            "area": "PT",
            "title": "Português: regência e crase",
            "detail": "Regência verbal, nominal e emprego da crase"
          }
        ]
      },
      {
        "weekday": 5,
        "blocks": [
          {
            "id": "w3-fri-ti-pmbok-riscos-revisao-itil-cobit",
            "area": "TI",
            "title": "PMBOK: gestão de riscos + revisão ITIL/COBIT",
            "detail": "Gestão de riscos do projeto e revisão integrada de governança ITIL e COBIT"
          },
          {
            "id": "w3-fri-legis-admin-publica-principios",
            "area": "Legis",
            "title": "Administração Pública: princípios",
            "detail": "Princípios expressos e implícitos da Administração Pública"
          }
        ]
      },
      {
        "weekday": 6,
        "hasSimulado": true,
        "objectiveQuestions": 0,
        "blocks": [
          {
            "id": "w3-sat-simulado-fechado-3",
            "area": "TI",
            "title": "Simulado Cumulativo Fechado 3",
            "detail": "Simulado cumulativo fechado das semanas 1 a 3"
          },
          {
            "id": "w3-sat-correcao",
            "area": "TI",
            "title": "Correção",
            "detail": "Correção detalhada do simulado"
          }
        ]
      }
    ]
  },
  {
    "weekNumber": 4,
    "days": [
      {
        "weekday": 1,
        "blocks": [
          {
            "id": "w4-mon-ti-bpm-conceitos-ciclo-governanca",
            "area": "TI",
            "title": "BPM: conceitos, ciclo de vida e governança",
            "detail": "Conceitos de BPM, fases do ciclo de vida e governança de processos"
          },
          {
            "id": "w4-mon-pt-interpretacao",
            "area": "PT",
            "title": "Português: interpretação",
            "detail": "Compreensão e interpretação de textos"
          }
        ]
      },
      {
        "weekday": 2,
        "blocks": [
          {
            "id": "w4-tue-ti-bpmn-eventos-atividades",
            "area": "TI",
            "title": "BPMN: eventos e atividades",
            "detail": "Eventos iniciais, intermediários, finais e tipos de atividades"
          },
          {
            "id": "w4-tue-legis-lc133-deveres-proibicoes",
            "area": "Legis",
            "title": "LC 133: deveres e proibições",
            "detail": "Regime disciplinar: deveres funcionais e proibições"
          }
        ]
      },
      {
        "weekday": 3,
        "blocks": [
          {
            "id": "w4-wed-ti-bpmn-gateways-fluxos",
            "area": "TI",
            "title": "BPMN: gateways e tipos de fluxo",
            "detail": "Gateways exclusivos, paralelos, inclusivos e tipos de fluxo"
          },
          {
            "id": "w4-wed-ti-sql-revisao-questoes",
            "area": "TI",
            "title": "Revisão de SQL por questões",
            "detail": "Resolução comentada de questões de SQL"
          }
        ]
      },
      {
        "weekday": 4,
        "blocks": [
          {
            "id": "w4-thu-ti-bpmn-pools-lanes-subprocessos",
            "area": "TI",
            "title": "BPMN: pools, lanes, mensagens e subprocessos",
            "detail": "Piscinas, raias, fluxos de mensagem e subprocessos embutidos e reutilizáveis"
          },
          {
            "id": "w4-thu-pt-oracoes-coord-subord",
            "area": "PT",
            "title": "Português: orações coordenadas e subordinadas",
            "detail": "Coordenação e subordinação de orações"
          }
        ]
      },
      {
        "weekday": 5,
        "blocks": [
          {
            "id": "w4-fri-ti-bpm-bpmn-revisao-questoes",
            "area": "TI",
            "title": "Revisão BPM/BPMN + bateria de questões",
            "detail": "Revisão geral de BPM/BPMN e resolução de questões de concursos"
          },
          {
            "id": "w4-fri-legis-lei-organica-competencias",
            "area": "Legis",
            "title": "Lei Orgânica: competências e artigos-chave",
            "detail": "Competências municipais e organização dos poderes na Lei Orgânica"
          }
        ]
      },
      {
        "weekday": 6,
        "hasSimulado": true,
        "objectiveQuestions": 0,
        "blocks": [
          {
            "id": "w4-sat-simulado-fechado-4",
            "area": "TI",
            "title": "Simulado Cumulativo Fechado 4",
            "detail": "Simulado cumulativo fechado das semanas 1 a 4"
          },
          {
            "id": "w4-sat-correcao",
            "area": "TI",
            "title": "Correção",
            "detail": "Correção detalhada do simulado"
          }
        ]
      }
    ]
  },
  {
    "weekNumber": 5,
    "days": [
      {
        "weekday": 1,
        "blocks": [
          {
            "id": "w5-mon-ti-seg-cid-ativos-controles",
            "area": "TI",
            "title": "Confidencialidade, integridade, disponibilidade, ativos e controles",
            "detail": "Pilares da segurança da informação, autenticidade, não-repúdio e ativos"
          },
          {
            "id": "w5-mon-pt-interpretacao",
            "area": "PT",
            "title": "Português: interpretação",
            "detail": "Interpretação textual e coesão"
          }
        ]
      },
      {
        "weekday": 2,
        "blocks": [
          {
            "id": "w5-tue-ti-seg-ameacas-vulnerabilidades-riscos",
            "area": "TI",
            "title": "Ameaças, vulnerabilidades, riscos e controles",
            "detail": "Conceitos de ameaças, vulnerabilidades, análise de riscos e controles"
          },
          {
            "id": "w5-tue-legis-principios-administracao",
            "area": "Legis",
            "title": "Legislação: princípios da Administração",
            "detail": "Princípios constitucionais e administrativos"
          }
        ]
      },
      {
        "weekday": 3,
        "blocks": [
          {
            "id": "w5-wed-ti-seg-cripto-iso27001-27002",
            "area": "TI",
            "title": "Criptografia + controles ISO 27001/27002",
            "detail": "Criptografia simétrica/assimétrica e controles de segurança ISO 27001/27002"
          },
          {
            "id": "w5-wed-ti-seg-questoes",
            "area": "TI",
            "title": "Questões de segurança",
            "detail": "Bateria de questões de segurança da informação"
          }
        ]
      },
      {
        "weekday": 4,
        "blocks": [
          {
            "id": "w5-thu-ti-seg-iso27005-riscos",
            "area": "TI",
            "title": "ISO 27005: identificação, análise e avaliação de riscos",
            "detail": "Processo de gestão de riscos de segurança segundo a ISO 27005"
          },
          {
            "id": "w5-thu-pt-sintaxe-pontuacao",
            "area": "PT",
            "title": "Português: sintaxe e pontuação",
            "detail": "Sintaxe aplicada à pontuação"
          }
        ]
      },
      {
        "weekday": 5,
        "blocks": [
          {
            "id": "w5-fri-ti-seg-tratamento-incidentes-continuidade",
            "area": "TI",
            "title": "Tratamento de riscos, incidentes e continuidade",
            "detail": "Tratamento de riscos, gestão de incidentes e continuidade de negócios"
          },
          {
            "id": "w5-fri-ti-revisao-itil-cobit-pmbok",
            "area": "TI",
            "title": "Revisão ITIL, COBIT e PMBOK",
            "detail": "Revisão integrada de governança e gestão"
          }
        ]
      },
      {
        "weekday": 6,
        "hasSimulado": true,
        "objectiveQuestions": 0,
        "blocks": [
          {
            "id": "w5-sat-simulado-fechado-5",
            "area": "TI",
            "title": "Simulado Cumulativo Fechado 5",
            "detail": "Simulado cumulativo fechado das semanas 1 a 5"
          },
          {
            "id": "w5-sat-correcao",
            "area": "TI",
            "title": "Correção",
            "detail": "Correção detalhada do simulado"
          }
        ]
      }
    ]
  },
  {
    "weekNumber": 6,
    "days": [
      {
        "weekday": 1,
        "blocks": [
          {
            "id": "w6-mon-ti-seg-owasp-top-10",
            "area": "TI",
            "title": "OWASP Top 10",
            "detail": "Principais riscos de segurança em aplicações web"
          },
          {
            "id": "w6-mon-pt-interpretacao-coesao",
            "area": "PT",
            "title": "Português: interpretação e coesão",
            "detail": "Compreensão de texto e coesão textual"
          }
        ]
      },
      {
        "weekday": 2,
        "blocks": [
          {
            "id": "w6-tue-ti-seg-iam-autenticacao-rbac-mfa",
            "area": "TI",
            "title": "IAM, autenticação, autorização, RBAC e MFA",
            "detail": "Gestão de identidades e acessos, autenticação MFA e controle RBAC"
          },
          {
            "id": "w6-tue-legis-improbidade-admin",
            "area": "Legis",
            "title": "Legislação: improbidade administrativa",
            "detail": "Lei 8.429/1992 e alterações da Lei 14.230/2021"
          }
        ]
      },
      {
        "weekday": 3,
        "blocks": [
          {
            "id": "w6-wed-ti-seg-validacao-sqli-xss",
            "area": "TI",
            "title": "Validação, sanitização, SQL Injection e XSS",
            "detail": "Prevenção de SQL Injection e Cross-Site Scripting (XSS)"
          },
          {
            "id": "w6-wed-ti-sql-join",
            "area": "TI",
            "title": "SQL: JOIN",
            "detail": "Junções INNER, LEFT, RIGHT e FULL JOIN"
          }
        ]
      },
      {
        "weekday": 4,
        "blocks": [
          {
            "id": "w6-thu-ti-seg-sast-dast-dev",
            "area": "TI",
            "title": "SAST, DAST e segurança no desenvolvimento",
            "detail": "Análise de código estática e dinâmica em desenvolvimento seguro"
          },
          {
            "id": "w6-thu-pt-concordancia-regencia",
            "area": "PT",
            "title": "Português: concordância e regência",
            "detail": "Exercícios práticos de concordância e regência"
          }
        ]
      },
      {
        "weekday": 5,
        "blocks": [
          {
            "id": "w6-fri-ti-seg-samm-bsimm-devsecops",
            "area": "TI",
            "title": "SAMM, BSIMM, DevSecOps e cadeia de suprimentos",
            "detail": "Maturidade em segurança de software, DevSecOps e cadeia de suprimentos"
          },
          {
            "id": "w6-fri-ti-revisao-iso-27001-27005",
            "area": "TI",
            "title": "Revisão ISO 27001/27005",
            "detail": "Revisão consolidada de normas ISO de segurança e riscos"
          }
        ]
      },
      {
        "weekday": 6,
        "hasSimulado": true,
        "objectiveQuestions": 0,
        "blocks": [
          {
            "id": "w6-sat-simulado-fechado-6",
            "area": "TI",
            "title": "Simulado Cumulativo Fechado 6",
            "detail": "Último simulado cumulativo fechado do ciclo (semanas 1 a 6)"
          },
          {
            "id": "w6-sat-correcao",
            "area": "TI",
            "title": "Correção",
            "detail": "Correção detalhada do simulado"
          }
        ]
      }
    ]
  },
  {
    "weekNumber": 7,
    "days": [
      {
        "weekday": 1,
        "blocks": [
          {
            "id": "w7-mon-ti-lgpd-conceitos-principios",
            "area": "TI",
            "title": "LGPD: conceitos, princípios e bases legais",
            "detail": "Lei 13.709/2018: dados pessoais, princípios e bases legais"
          },
          {
            "id": "w7-mon-pt-interpretacao",
            "area": "PT",
            "title": "Português: interpretação",
            "detail": "Interpretação e inferência"
          }
        ]
      },
      {
        "weekday": 2,
        "blocks": [
          {
            "id": "w7-tue-ti-lgpd-agentes-titulares-sensiveis",
            "area": "TI",
            "title": "LGPD: agentes, titulares e dados sensíveis",
            "detail": "Controlador, operador, encarregado (DPO), titulares e dados sensíveis"
          },
          {
            "id": "w7-tue-legis-lc133-regime-disciplinar",
            "area": "Legis",
            "title": "LC 133: regime disciplinar",
            "detail": "Penalidades, processo administrativo disciplinar e sindicância"
          }
        ]
      },
      {
        "weekday": 3,
        "blocks": [
          {
            "id": "w7-wed-ti-lai-estudos-de-caso",
            "area": "TI",
            "title": "LAI: estudos de caso + questões práticas",
            "detail": "Lei 12.527/2011: transparência ativa/passiva e estudos de caso"
          },
          {
            "id": "w7-wed-revisao-cartoes",
            "area": "Revisão",
            "title": "Revisão de cartões",
            "detail": "Revisão espaçada de flashcards acumulados"
          }
        ]
      },
      {
        "weekday": 4,
        "blocks": [
          {
            "id": "w7-thu-ti-marco-civil-registros-neutralidade",
            "area": "TI",
            "title": "Marco Civil: registros, neutralidade e responsabilidade",
            "detail": "Lei 12.965/2014: guarda de registros, neutralidade e responsabilidade"
          },
          {
            "id": "w7-thu-pt-pontuacao-reescrita",
            "area": "PT",
            "title": "Português: pontuação e reescrita",
            "detail": "Emprego de pontuação e confronto de frases"
          }
        ]
      },
      {
        "weekday": 5,
        "blocks": [
          {
            "id": "w7-fri-ti-lei-14133-planejamento-etp-tr",
            "area": "TI",
            "title": "Lei 14.133: planejamento, ETP, TR e análise de riscos",
            "detail": "Nova Lei de Licitações: planejamento em TI, ETP, Termo de Referência e riscos"
          },
          {
            "id": "w7-fri-legis-lei-organica",
            "area": "Legis",
            "title": "Lei Orgânica",
            "detail": "Artigos-chave e organização do Município na Lei Orgânica"
          }
        ]
      },
      {
        "weekday": 6,
        "hasSimulado": true,
        "objectiveQuestions": 0,
        "blocks": [
          {
            "id": "w7-sat-simulado-espelho-7",
            "area": "TI",
            "title": "Simulado Espelho Integral 7",
            "detail": "Simulado espelho integral: 40 específicas, 10 PT, 10 Legislação (4h)"
          },
          {
            "id": "w7-sat-correcao",
            "area": "TI",
            "title": "Correção",
            "detail": "Correção detalhada do simulado"
          }
        ]
      }
    ]
  },
  {
    "weekNumber": 8,
    "days": [
      {
        "weekday": 1,
        "blocks": [
          {
            "id": "w8-mon-ti-agil-scrum-fundamentos",
            "area": "TI",
            "title": "Manifesto Ágil + Scrum: fundamentos e papéis",
            "detail": "Valores ágeis, Scrum Guide e papéis"
          },
          {
            "id": "w8-mon-pt-interpretacao",
            "area": "PT",
            "title": "Português: interpretação",
            "detail": "Compreensão de textos"
          }
        ]
      },
      {
        "weekday": 2,
        "blocks": [
          {
            "id": "w8-tue-ti-scrum-eventos-artefatos",
            "area": "TI",
            "title": "Scrum: eventos, artefatos e compromissos",
            "detail": "Eventos, Product Backlog, Sprint Backlog, Incremento e DoD"
          },
          {
            "id": "w8-tue-legis-cf",
            "area": "Legis",
            "title": "Constituição Federal",
            "detail": "Arts. 37 a 41 da Constituição Federal"
          }
        ]
      },
      {
        "weekday": 3,
        "blocks": [
          {
            "id": "w8-wed-ti-xp-kanban-lean-metricas",
            "area": "TI",
            "title": "XP, Kanban e Lean + Story Points, MVP e dívida técnica",
            "detail": "Práticas do XP, Kanban, Lean IT, estimativas e dívida técnica"
          },
          {
            "id": "w8-wed-ti-sql-group-by-having",
            "area": "TI",
            "title": "SQL: GROUP BY e HAVING",
            "detail": "Agrupamentos e filtros com GROUP BY e HAVING"
          }
        ]
      },
      {
        "weekday": 4,
        "blocks": [
          {
            "id": "w8-thu-ti-requisitos-rf-rnf-apf",
            "area": "TI",
            "title": "Requisitos funcionais e não funcionais + APF",
            "detail": "Engenharia de requisitos, funcionais, não-funcionais e APF"
          },
          {
            "id": "w8-thu-pt-sintaxe",
            "area": "PT",
            "title": "Português: sintaxe",
            "detail": "Estrutura sintática e termos da oração"
          }
        ]
      },
      {
        "weekday": 5,
        "blocks": [
          {
            "id": "w8-fri-ti-revisao-lgpd-lai-agil",
            "area": "TI",
            "title": "Revisão LGPD/LAI + bateria de questões ágeis",
            "detail": "Revisão consolidada de legislação de TI e questões de métodos ágeis"
          },
          {
            "id": "w8-fri-revisao-correcao-erros",
            "area": "Revisão",
            "title": "Correção dos erros",
            "detail": "Análise e correção dos erros recentes"
          }
        ]
      },
      {
        "weekday": 6,
        "hasSimulado": true,
        "objectiveQuestions": 0,
        "blocks": [
          {
            "id": "w8-sat-simulado-espelho-8",
            "area": "TI",
            "title": "Simulado Espelho Integral 8",
            "detail": "Simulado espelho integral: 40 específicas, 10 PT, 10 Legislação (4h)"
          },
          {
            "id": "w8-sat-correcao",
            "area": "TI",
            "title": "Correção",
            "detail": "Correção detalhada do simulado"
          }
        ]
      }
    ]
  },
  {
    "weekNumber": 9,
    "days": [
      {
        "weekday": 1,
        "blocks": [
          {
            "id": "w9-mon-ti-uml-casos-de-uso-classes",
            "area": "TI",
            "title": "UML: casos de uso e classes",
            "detail": "Diagramas de casos de uso e diagramas de classes"
          },
          {
            "id": "w9-mon-pt-interpretacao",
            "area": "PT",
            "title": "Português: interpretação",
            "detail": "Interpretação e coesão"
          }
        ]
      },
      {
        "weekday": 2,
        "blocks": [
          {
            "id": "w9-tue-ti-uml-sequencia-atividades-estados",
            "area": "TI",
            "title": "UML: sequência, atividades e estados",
            "detail": "Diagramas dinâmicos: sequência, estados e atividades"
          },
          {
            "id": "w9-tue-legis-municipal",
            "area": "Legis",
            "title": "Legislação municipal",
            "detail": "LC 133, LC 478 e Lei Orgânica"
          }
        ]
      },
      {
        "weekday": 3,
        "blocks": [
          {
            "id": "w9-wed-ti-testes-unitarios-integracao-aceitacao",
            "area": "TI",
            "title": "Testes unitários, integração, sistema e aceitação",
            "detail": "Níveis de teste, tipos de teste e automação"
          },
          {
            "id": "w9-wed-ti-sql-revisao",
            "area": "TI",
            "title": "Revisão SQL",
            "detail": "Resolução de questões de SQL"
          }
        ]
      },
      {
        "weekday": 4,
        "blocks": [
          {
            "id": "w9-thu-ti-testes-carga-estresse-mocks",
            "area": "TI",
            "title": "Testes de carga, estresse, mocks e stubs",
            "detail": "Testes de desempenho (carga e estresse) e dublês de teste"
          },
          {
            "id": "w9-thu-pt-pontuacao",
            "area": "PT",
            "title": "Português: pontuação",
            "detail": "Emprego dos sinais de pontuação"
          }
        ]
      },
      {
        "weekday": 5,
        "blocks": [
          {
            "id": "w9-fri-ti-devops-git-ci-cd",
            "area": "TI",
            "title": "Git, branches, merges, configuração, CI/CD e DevOps",
            "detail": "Controle de versão, branching, integração contínua e DevOps"
          },
          {
            "id": "w9-fri-ti-revisao-seguranca",
            "area": "TI",
            "title": "Revisão de segurança",
            "detail": "Revisão de conceitos e práticas de segurança"
          }
        ]
      },
      {
        "weekday": 6,
        "hasSimulado": true,
        "objectiveQuestions": 0,
        "blocks": [
          {
            "id": "w9-sat-simulado-espelho-9",
            "area": "TI",
            "title": "Simulado Espelho Integral 9",
            "detail": "Simulado espelho integral: 40 específicas, 10 PT, 10 Legislação (4h)"
          },
          {
            "id": "w9-sat-correcao",
            "area": "TI",
            "title": "Correção",
            "detail": "Correção detalhada do simulado"
          }
        ]
      }
    ]
  },
  {
    "weekNumber": 10,
    "days": [
      {
        "weekday": 1,
        "blocks": [
          {
            "id": "w10-mon-ti-arq-camadas-mvc-solid-clean",
            "area": "TI",
            "title": "Cliente-servidor, camadas, MVC + SOLID e Clean Architecture",
            "detail": "Arquiteturas multicamadas, MVC, princípios SOLID e Clean Architecture"
          },
          {
            "id": "w10-mon-pt-geral",
            "area": "PT",
            "title": "Português",
            "detail": "Gramática e interpretação"
          }
        ]
      },
      {
        "weekday": 2,
        "blocks": [
          {
            "id": "w10-tue-ti-togaf-adm-soa-microsservicos",
            "area": "TI",
            "title": "TOGAF básico, ADM, SOA e microsserviços",
            "detail": "Framework TOGAF, ciclo ADM, SOA e microsserviços"
          },
          {
            "id": "w10-tue-legis-geral",
            "area": "Legis",
            "title": "Legislação",
            "detail": "Revisão de legislação"
          }
        ]
      },
      {
        "weekday": 3,
        "blocks": [
          {
            "id": "w10-wed-ti-rest-http-json",
            "area": "TI",
            "title": "REST, HTTP e JSON",
            "detail": "Princípios RESTful, verbos HTTP e JSON"
          },
          {
            "id": "w10-wed-ti-sql-subconsultas",
            "area": "TI",
            "title": "SQL: subconsultas",
            "detail": "Subqueries escalares, correlacionadas e operadores de conjunto"
          }
        ]
      },
      {
        "weekday": 4,
        "blocks": [
          {
            "id": "w10-thu-ti-soap-xml-wsdl",
            "area": "TI",
            "title": "SOAP, XML e WSDL",
            "detail": "Web services SOAP, estrutura XML e WSDL"
          },
          {
            "id": "w10-thu-pt-regencia-crase",
            "area": "PT",
            "title": "Português: regência e crase",
            "detail": "Regência e crase"
          }
        ]
      },
      {
        "weekday": 5,
        "blocks": [
          {
            "id": "w10-fri-ti-oauth2-openid-saml-sso-rbac",
            "area": "TI",
            "title": "OAuth2, OpenID Connect, SAML, SSO e RBAC",
            "detail": "Protocolos de identidade, autenticação e autorização federada"
          },
          {
            "id": "w10-fri-ti-questoes-identidade-seguranca",
            "area": "TI",
            "title": "Questões práticas de identidade e segurança",
            "detail": "Exercícios práticos de identidade e segurança"
          }
        ]
      },
      {
        "weekday": 6,
        "hasSimulado": true,
        "objectiveQuestions": 0,
        "blocks": [
          {
            "id": "w10-sat-simulado-espelho-10",
            "area": "TI",
            "title": "Simulado Espelho Integral 10",
            "detail": "Simulado espelho integral: 40 específicas, 10 PT, 10 Legislação (4h)"
          },
          {
            "id": "w10-sat-correcao",
            "area": "TI",
            "title": "Correção",
            "detail": "Correção detalhada do simulado"
          }
        ]
      }
    ]
  },
  {
    "weekNumber": 11,
    "days": [
      {
        "weekday": 1,
        "blocks": [
          {
            "id": "w11-mon-ti-postgres-ddl-tabelas-restricoes",
            "area": "TI",
            "title": "PostgreSQL: DDL, tabelas e restrições",
            "detail": "DDL no PostgreSQL, tipos de dados e constraints"
          },
          {
            "id": "w11-mon-pt-geral",
            "area": "PT",
            "title": "Português",
            "detail": "Língua Portuguesa"
          }
        ]
      },
      {
        "weekday": 2,
        "blocks": [
          {
            "id": "w11-tue-ti-sql-insert-update-delete",
            "area": "TI",
            "title": "INSERT, UPDATE e DELETE",
            "detail": "Comandos DML para manipulação de registros"
          },
          {
            "id": "w11-tue-legis-municipal",
            "area": "Legis",
            "title": "Legislação municipal",
            "detail": "LC 133, LC 478 e Lei Orgânica"
          }
        ]
      },
      {
        "weekday": 3,
        "blocks": [
          {
            "id": "w11-wed-ti-sql-select-where-order-funcoes",
            "area": "TI",
            "title": "SELECT, WHERE, ORDER BY e funções",
            "detail": "Consultas, filtros, ordenação e funções no PostgreSQL"
          },
          {
            "id": "w11-wed-pt-geral",
            "area": "PT",
            "title": "Português",
            "detail": "Língua Portuguesa"
          }
        ]
      },
      {
        "weekday": 4,
        "blocks": [
          {
            "id": "w11-thu-ti-sql-joins-avancados",
            "area": "TI",
            "title": "INNER, LEFT e RIGHT JOIN",
            "detail": "Junções de dados relacionais no PostgreSQL"
          },
          {
            "id": "w11-thu-legis-geral",
            "area": "Legis",
            "title": "Legislação",
            "detail": "Revisão de Legislação"
          }
        ]
      },
      {
        "weekday": 5,
        "blocks": [
          {
            "id": "w11-fri-ti-sql-groupby-having-subqueries-scripts",
            "area": "TI",
            "title": "GROUP BY, HAVING, subconsultas e leitura de scripts",
            "detail": "Agrupamentos complexos, subqueries e interpretação de scripts SQL"
          },
          {
            "id": "w11-fri-ti-revisao-governanca-seguranca",
            "area": "TI",
            "title": "Revisão governança e segurança",
            "detail": "Revisão de governança e segurança"
          }
        ]
      },
      {
        "weekday": 6,
        "hasSimulado": true,
        "objectiveQuestions": 0,
        "blocks": [
          {
            "id": "w11-sat-simulado-espelho-11",
            "area": "TI",
            "title": "Simulado Espelho Integral 11",
            "detail": "Simulado espelho integral: 40 específicas, 10 PT, 10 Legislação (4h)"
          },
          {
            "id": "w11-sat-correcao",
            "area": "TI",
            "title": "Correção",
            "detail": "Correção detalhada do simulado"
          }
        ]
      }
    ]
  },
  {
    "weekNumber": 12,
    "days": [
      {
        "weekday": 1,
        "blocks": [
          {
            "id": "w12-mon-ti-bd-mer-cardinalidade",
            "area": "TI",
            "title": "Modelo entidade-relacionamento e cardinalidade",
            "detail": "Modelagem conceitual e lógica E-R e cardinalidade"
          },
          {
            "id": "w12-mon-pt-geral",
            "area": "PT",
            "title": "Português",
            "detail": "Língua Portuguesa"
          }
        ]
      },
      {
        "weekday": 2,
        "blocks": [
          {
            "id": "w12-tue-ti-bd-chaves-integridade-referencial",
            "area": "TI",
            "title": "Chaves primárias, estrangeiras e integridade referencial",
            "detail": "Chaves primárias, estrangeiras e integridade referencial"
          },
          {
            "id": "w12-tue-legis-lc133",
            "area": "Legis",
            "title": "LC 133",
            "detail": "LC 133/1985"
          }
        ]
      },
      {
        "weekday": 3,
        "blocks": [
          {
            "id": "w12-wed-ti-bd-normalizacao-1fn-2fn-3fn",
            "area": "TI",
            "title": "Normalização: 1FN, 2FN e 3FN",
            "detail": "Formas normais 1FN, 2FN e 3FN e eliminação de redundâncias"
          },
          {
            "id": "w12-wed-pt-geral",
            "area": "PT",
            "title": "Português",
            "detail": "Língua Portuguesa"
          }
        ]
      },
      {
        "weekday": 4,
        "blocks": [
          {
            "id": "w12-thu-ti-bd-transacoes-acid-concorrencia",
            "area": "TI",
            "title": "Transações, ACID e concorrência",
            "detail": "Propriedades ACID, níveis de isolamento e controle de concorrência"
          },
          {
            "id": "w12-thu-legis-cf-improbidade",
            "area": "Legis",
            "title": "Constituição e improbidade",
            "detail": "Normas constitucionais e improbidade administrativa"
          }
        ]
      },
      {
        "weekday": 5,
        "blocks": [
          {
            "id": "w12-fri-ti-bd-nosql-modelos",
            "area": "TI",
            "title": "NoSQL: chave-valor, documentos, colunas e grafos",
            "detail": "Bancos de dados NoSQL e Teorema CAP"
          },
          {
            "id": "w12-fri-ti-revisao-iso-lgpd",
            "area": "TI",
            "title": "Revisão ISO/LGPD",
            "detail": "Revisão de normas ISO e LGPD"
          }
        ]
      },
      {
        "weekday": 6,
        "hasSimulado": true,
        "objectiveQuestions": 0,
        "blocks": [
          {
            "id": "w12-sat-simulado-espelho-12",
            "area": "TI",
            "title": "Simulado Espelho Integral 12",
            "detail": "Simulado espelho integral: 40 específicas, 10 PT, 10 Legislação (4h)"
          },
          {
            "id": "w12-sat-correcao",
            "area": "TI",
            "title": "Correção",
            "detail": "Correção detalhada do simulado"
          }
        ]
      }
    ]
  },
  {
    "weekNumber": 13,
    "days": [
      {
        "weekday": 1,
        "blocks": [
          {
            "id": "w13-mon-ti-dw-modelagem-dimensional",
            "area": "TI",
            "title": "Data Warehouse e modelagem dimensional",
            "detail": "Modelagem dimensional, esquemas estrela e floco de neve e OLAP"
          },
          {
            "id": "w13-mon-pt-geral",
            "area": "PT",
            "title": "Português",
            "detail": "Língua Portuguesa"
          }
        ]
      },
      {
        "weekday": 2,
        "blocks": [
          {
            "id": "w13-tue-ti-etl-elt-data-lake",
            "area": "TI",
            "title": "ETL, ELT e Data Lake",
            "detail": "Pipelines de dados ETL/ELT e repositórios Data Lake"
          },
          {
            "id": "w13-tue-legis-municipal",
            "area": "Legis",
            "title": "Legislação municipal",
            "detail": "LC 133, LC 478 e Lei Orgânica"
          }
        ]
      },
      {
        "weekday": 3,
        "blocks": [
          {
            "id": "w13-wed-ti-big-data-conceitos-vs",
            "area": "TI",
            "title": "Big Data: conceitos e características",
            "detail": "Os 5Vs do Big Data e arquiteturas de processamento"
          },
          {
            "id": "w13-wed-pt-geral",
            "area": "PT",
            "title": "Português",
            "detail": "Língua Portuguesa"
          }
        ]
      },
      {
        "weekday": 4,
        "blocks": [
          {
            "id": "w13-thu-ti-ia-aprendizado-sup-nao-sup",
            "area": "TI",
            "title": "Aprendizado supervisionado e não supervisionado",
            "detail": "Aprendizado supervisionado, não supervisionado e tarefas de ML"
          },
          {
            "id": "w13-thu-legis-geral",
            "area": "Legis",
            "title": "Legislação",
            "detail": "Revisão de Legislação"
          }
        ]
      },
      {
        "weekday": 5,
        "blocks": [
          {
            "id": "w13-fri-ti-ia-classificacao-regressao-metricas",
            "area": "TI",
            "title": "Classificação, regressão, clustering e estatística básica",
            "detail": "Métricas de avaliação de modelos (acurácia, precisão, recall, F1, RMSE)"
          },
          {
            "id": "w13-fri-ti-revisao-banco-de-dados",
            "area": "TI",
            "title": "Revisão banco de dados",
            "detail": "Revisão de modelagem e consultas SQL"
          }
        ]
      },
      {
        "weekday": 6,
        "hasSimulado": true,
        "objectiveQuestions": 0,
        "blocks": [
          {
            "id": "w13-sat-simulado-espelho-13",
            "area": "TI",
            "title": "Simulado Espelho Integral 13",
            "detail": "Simulado espelho integral: 40 específicas, 10 PT, 10 Legislação (4h)"
          },
          {
            "id": "w13-sat-correcao",
            "area": "TI",
            "title": "Correção",
            "detail": "Correção detalhada do simulado"
          }
        ]
      }
    ]
  },
  {
    "weekNumber": 14,
    "days": [
      {
        "weekday": 1,
        "blocks": [
          {
            "id": "w14-mon-ti-redes-modelos-osi-tcpip",
            "area": "TI",
            "title": "Modelos OSI e TCP/IP",
            "detail": "Camadas dos modelos OSI e TCP/IP e protocolos associados"
          },
          {
            "id": "w14-mon-pt-geral",
            "area": "PT",
            "title": "Português",
            "detail": "Língua Portuguesa"
          }
        ]
      },
      {
        "weekday": 2,
        "blocks": [
          {
            "id": "w14-tue-ti-redes-protocolos-aplicacao",
            "area": "TI",
            "title": "HTTP, HTTPS, DNS, DHCP, FTP e SSH",
            "detail": "Protocolos da camada de aplicação e serviços de rede"
          },
          {
            "id": "w14-tue-legis-municipal",
            "area": "Legis",
            "title": "Legislação municipal",
            "detail": "LC 133, LC 478 e Lei Orgânica"
          }
        ]
      },
      {
        "weekday": 3,
        "blocks": [
          {
            "id": "w14-wed-ti-redes-enlace-roteamento",
            "area": "TI",
            "title": "Ethernet, switches, bridges e roteadores",
            "detail": "Equipamentos de rede, endereçamento físico e roteamento"
          },
          {
            "id": "w14-wed-ti-sql-revisao",
            "area": "TI",
            "title": "SQL: revisão",
            "detail": "Revisão de SQL"
          }
        ]
      },
      {
        "weekday": 4,
        "blocks": [
          {
            "id": "w14-thu-ti-redes-ipv4-subnetting-wifi",
            "area": "TI",
            "title": "IPv4, subnetting básico e Wi-Fi",
            "detail": "Endereçamento IPv4, cálculo de sub-redes e redes Wi-Fi"
          },
          {
            "id": "w14-thu-pt-geral",
            "area": "PT",
            "title": "Português",
            "detail": "Língua Portuguesa"
          }
        ]
      },
      {
        "weekday": 5,
        "blocks": [
          {
            "id": "w14-fri-ti-redes-seguranca-firewall-vpn",
            "area": "TI",
            "title": "Fibra, VPN, VoIP, firewall, IDS e IPS",
            "detail": "Tecnologias de transmissão, segurança perimetral e comunicação IP"
          },
          {
            "id": "w14-fri-ti-revisao-seguranca",
            "area": "TI",
            "title": "Revisão segurança",
            "detail": "Revisão de segurança da informação e redes"
          }
        ]
      },
      {
        "weekday": 6,
        "hasSimulado": true,
        "objectiveQuestions": 0,
        "blocks": [
          {
            "id": "w14-sat-simulado-espelho-14",
            "area": "TI",
            "title": "Simulado Espelho Integral 14",
            "detail": "Simulado espelho integral: 40 específicas, 10 PT, 10 Legislação (4h)"
          },
          {
            "id": "w14-sat-correcao",
            "area": "TI",
            "title": "Correção",
            "detail": "Correção detalhada do simulado"
          }
        ]
      }
    ]
  },
  {
    "weekNumber": 15,
    "days": [
      {
        "weekday": 1,
        "blocks": [
          {
            "id": "w15-mon-ti-nuvem-modelos-servico",
            "area": "TI",
            "title": "IaaS, PaaS, SaaS e FaaS",
            "detail": "Modelos de serviço em nuvem e responsabilidade compartilhada"
          },
          {
            "id": "w15-mon-pt-geral",
            "area": "PT",
            "title": "Português",
            "detail": "Língua Portuguesa"
          }
        ]
      },
      {
        "weekday": 2,
        "blocks": [
          {
            "id": "w15-tue-ti-nuvem-modelos-implantacao",
            "area": "TI",
            "title": "Nuvem pública, privada e híbrida",
            "detail": "Modelos de implantação em nuvem"
          },
          {
            "id": "w15-tue-legis-municipal",
            "area": "Legis",
            "title": "Legislação municipal",
            "detail": "LC 133, LC 478 e Lei Orgânica"
          }
        ]
      },
      {
        "weekday": 3,
        "blocks": [
          {
            "id": "w15-wed-ti-infra-virtualizacao-docker-k8s",
            "area": "TI",
            "title": "Virtualização, Docker e Kubernetes",
            "detail": "Hipervisores, contêineres Docker e orquestração Kubernetes"
          },
          {
            "id": "w15-wed-ti-banco-erros-recorrentes",
            "area": "TI",
            "title": "Banco: erros recorrentes",
            "detail": "Revisão dos erros recorrentes em banco de dados"
          }
        ]
      },
      {
        "weekday": 4,
        "blocks": [
          {
            "id": "w15-thu-ti-infra-ad-ldap-so",
            "area": "TI",
            "title": "Active Directory, LDAP e sistemas operacionais",
            "detail": "Serviços de diretório, autenticação e gerência de processos/memória em SO"
          },
          {
            "id": "w15-thu-pt-geral",
            "area": "PT",
            "title": "Português",
            "detail": "Língua Portuguesa"
          }
        ]
      },
      {
        "weekday": 5,
        "blocks": [
          {
            "id": "w15-fri-ti-infra-backup-alta-disp-dr",
            "area": "TI",
            "title": "Backup, alta disponibilidade, redundância e disaster recovery",
            "detail": "Tipos de backup, tolerância a falhas e disaster recovery"
          },
          {
            "id": "w15-fri-ti-revisao-governanca",
            "area": "TI",
            "title": "Revisão governança",
            "detail": "Revisão de ITIL e COBIT"
          }
        ]
      },
      {
        "weekday": 6,
        "hasSimulado": true,
        "objectiveQuestions": 0,
        "blocks": [
          {
            "id": "w15-sat-simulado-espelho-15",
            "area": "TI",
            "title": "Simulado Espelho Integral 15",
            "detail": "Simulado espelho integral: 40 específicas, 10 PT, 10 Legislação (4h)"
          },
          {
            "id": "w15-sat-correcao",
            "area": "TI",
            "title": "Correção",
            "detail": "Correção detalhada do simulado"
          }
        ]
      }
    ]
  },
  {
    "weekNumber": 16,
    "days": [
      {
        "weekday": 1,
        "blocks": [
          {
            "id": "w16-mon-ti-revisao-pior-governanca",
            "area": "TI",
            "title": "Pior assunto entre ITIL, COBIT, PMBOK e BPMN",
            "detail": "Revisão aprofundada do tema de governança/processos com menor aproveitamento"
          },
          {
            "id": "w16-mon-pt-pior-assunto",
            "area": "PT",
            "title": "Pior assunto de Português",
            "detail": "Revisão do assunto com maior incidência de erros em Língua Portuguesa"
          }
        ]
      },
      {
        "weekday": 2,
        "blocks": [
          {
            "id": "w16-tue-ti-revisao-pior-seguranca-legis-ti",
            "area": "TI",
            "title": "Pior assunto entre Segurança, ISO, LGPD e legislação de TI",
            "detail": "Reforço dirigido aos tópicos de segurança da informação e legislação correlata"
          },
          {
            "id": "w16-tue-legis-pior-tema",
            "area": "Legis",
            "title": "Pior legislação geral",
            "detail": "Revisão de leis com maior taxa de erro"
          }
        ]
      },
      {
        "weekday": 3,
        "blocks": [
          {
            "id": "w16-wed-ti-revisao-pior-sql-dados-ia",
            "area": "TI",
            "title": "Pior assunto de SQL, Banco, Dados ou IA",
            "detail": "Revisão cirúrgica de banco de dados, dados e IA"
          },
          {
            "id": "w16-wed-pt-segundo-pior",
            "area": "PT",
            "title": "Segundo pior assunto de Português",
            "detail": "Consolidação de pontos fracos secundários em Português"
          }
        ]
      },
      {
        "weekday": 4,
        "blocks": [
          {
            "id": "w16-thu-ti-revisao-pior-software-agil-arq",
            "area": "TI",
            "title": "Pior assunto de Software, Ágil ou Arquitetura",
            "detail": "Revisão pontual em desenvolvimento de software, métodos ágeis ou arquitetura"
          },
          {
            "id": "w16-thu-legis-segundo-pior",
            "area": "Legis",
            "title": "Segundo pior assunto de legislação",
            "detail": "Revisão do segundo tema mais crítico em Legislação"
          }
        ]
      },
      {
        "weekday": 5,
        "blocks": [
          {
            "id": "w16-fri-ti-revisao-pior-redes-nuvem",
            "area": "TI",
            "title": "Pior assunto de Redes, Infraestrutura ou Nuvem",
            "detail": "Consolidação de conceitos em redes de computadores, nuvem e infraestrutura"
          },
          {
            "id": "w16-fri-revisao-30-erros-recorrentes",
            "area": "Revisão",
            "title": "30 erros mais recorrentes de todo o ciclo",
            "detail": "Bateria final de resolução e fixação dos 30 erros mais frequentes de todo o ciclo"
          }
        ]
      },
      {
        "weekday": 6,
        "hasSimulado": true,
        "objectiveQuestions": 0,
        "blocks": [
          {
            "id": "w16-sat-simulado-final",
            "area": "TI",
            "title": "Simulado Espelho Integral Final",
            "detail": "Simulado final integral de fechamento do ciclo de preparação"
          },
          {
            "id": "w16-sat-correcao-completa",
            "area": "Revisão",
            "title": "Correção completa",
            "detail": "Correção completa e diagnóstico final de prontidão para a prova"
          }
        ]
      }
    ]
  }
];

const DAY_MS = 24 * 60 * 60 * 1000;

const buildDateForWeekday = (
  weekNumber: number,
  weekday: ManualDayTemplate['weekday'],
  planStartDate: string,
): string => {
  const start = parseIsoDate(planStartDate);
  if (weekNumber === 1) {
    const startWeekday = start.getUTCDay();
    const offset = weekday >= startWeekday ? weekday - startWeekday : 0;
    return toIsoDate(new Date(start.getTime() + offset * DAY_MS));
  }

  const startWeekday = start.getUTCDay();
  const daysUntilFirstMonday = startWeekday === 1 ? 0 : (8 - startWeekday) % 7;
  const firstMondayTime = start.getTime() + daysUntilFirstMonday * DAY_MS;
  const targetTime = firstMondayTime + (weekNumber - 2) * 7 * DAY_MS + (weekday - 1) * DAY_MS;
  return toIsoDate(new Date(targetTime));
};

const mapAreaToSubject = (area: string): SubjectKey | null => {
  if (area.startsWith('PT') || /portugu[eê]s/i.test(area)) {
    return 'portugues';
  }

  if (area.startsWith('RLM') || /racioc[ií]nio|matem[aá]tica/i.test(area)) {
    return 'rlm';
  }

  if (
    area.startsWith('Legis') ||
    /legisla[cç][aã]o|constitui[cç][aã]o|lc\s*\d+|lei|estatuto|org[aâ]nica|improbidade|administra[cç][aã]o/i.test(
      area,
    )
  ) {
    return 'legislacao';
  }

  if (
    area.startsWith('TI') ||
    /seguran[cç]a|banco|redes|itil|cobit|pmbok|bpmn|bpm|iso|desenvolvimento|software|nuvem|sql|dados|ia|uml|devops|arquitetura|simulado/i.test(
      area,
    )
  ) {
    return 'especificos';
  }

  return null;
};

const inferSubjects = (blocks: ManualBlock[]): [SubjectKey, SubjectKey] => {
  const found = new Set<SubjectKey>();

  for (const block of blocks) {
    const subject = mapAreaToSubject(block.area);
    if (subject) {
      found.add(subject);
    }
  }

  const ordered = [...found];

  if (ordered.length >= 2) {
    return [ordered[0], ordered[1]];
  }

  if (ordered.length === 1) {
    const fallback = ordered[0] === 'especificos' ? 'portugues' : 'especificos';
    return [ordered[0], fallback];
  }

  return ['especificos', 'portugues'];
};

export const buildManualChecklistSpec = (
  blocks: ManualBlock[],
  objectiveQuestions: number,
  hasSimulado: boolean,
  hasRedacao: boolean,
): ManualChecklistSpecItem[] => {
  const checklist: ManualChecklistSpecItem[] = blocks.map((block, index) => {
    const detailSuffix = block.detail ? ` - ${block.detail}` : '';
    const refsSummary = getManualBlockContentSummary(block);
    const contentSuffix = refsSummary ? ` | Conteúdo programático: ${refsSummary}` : '';

    return {
      id: `manual-block-${index + 1}`,
      label: `${block.area}: ${block.title}${detailSuffix}${contentSuffix}`,
      kind: 'boolean',
      target: 1,
      unit: 'ok',
      required: true,
    };
  });

  checklist.push({
    id: 'objective-questions',
    label:
      objectiveQuestions === 0
        ? 'Questões objetivas substituídas por simulado'
        : `Questões objetivas do dia (${objectiveQuestions})`,
    kind: 'counter',
    target: objectiveQuestions,
    unit: 'questões',
    required: objectiveQuestions > 0,
  });

  if (hasSimulado) {
    checklist.push({
      id: 'simulado',
      label: 'Simulado completo do dia',
      kind: 'boolean',
      target: 1,
      unit: 'ok',
      required: true,
    });
  }

  if (hasRedacao) {
    checklist.push({
      id: 'redacao',
      label: 'Redação do dia',
      kind: 'boolean',
      target: 1,
      unit: 'ok',
      required: true,
    });
  }

  return checklist;
};

export const buildManualDayOverrides = (
  planStartDate: string = MANUAL_PLAN_START_DATE,
): Record<string, ManualDayOverride> => {
  return MANUAL_WEEK_TEMPLATES.reduce<Record<string, ManualDayOverride>>((accumulator, week) => {
    for (const day of week.days) {
      const date = buildDateForWeekday(week.weekNumber, day.weekday, planStartDate);
      const hasSimulado = day.hasSimulado ?? false;
      const hasRedacao = day.hasRedacao ?? false;
      const objectiveQuestions = day.objectiveQuestions ?? (hasSimulado ? 0 : 50);

      const manualBlocks = day.blocks.map((block) => ({
        ...block,
        contentTargets: resolveManualBlockContentTargets(block),
        contentRefs: resolveManualBlockContentRefs(block),
      }));

      accumulator[date] = {
        weekNumber: week.weekNumber,
        subjects: inferSubjects(manualBlocks),
        objectiveQuestions,
        hasSimulado,
        hasRedacao,
        manualBlocks,
        manualChecklistSpec: buildManualChecklistSpec(
          manualBlocks,
          objectiveQuestions,
          hasSimulado,
          hasRedacao,
        ),
      };
    }

    return accumulator;
  }, {});
};

export const MANUAL_WEEK_COUNT = MANUAL_WEEK_TEMPLATES.length;

export const MANUAL_TOPIC_SEARCH_ALIASES_BY_ID = MANUAL_WEEK_TEMPLATES.reduce<Record<string, string[]>>(
  (accumulator, week) => {
    for (const day of week.days) {
      for (const block of day.blocks) {
        const aliases = [`${block.area} ${block.title}`, block.title, block.detail, `${block.title} ${block.detail}`]
          .map((value) => value.trim())
          .filter(Boolean);

        for (const target of resolveManualBlockContentTargets(block)) {
          const current = accumulator[target.topicId] ?? [];
          accumulator[target.topicId] = Array.from(new Set([...current, ...aliases]));
        }
      }
    }

    return accumulator;
  },
  {},
);

export const getManualTopicSearchAliases = (topicId: string): string[] =>
  MANUAL_TOPIC_SEARCH_ALIASES_BY_ID[topicId] ?? [];
