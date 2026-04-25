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
export const MANUAL_PLAN_END_DATE = '2026-11-19';

const MANUAL_WEEK_TEMPLATES: ManualWeekTemplate[] = [
  {
    weekNumber: 1,
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w1-mon-ti-web-html',
            area: 'TI',
            title: 'Web: HTML semântico + forms',
            detail: 'Fundamentos de estrutura e formulários',
          },
          {
            id: 'w1-mon-pt-interpretacao',
            area: 'PT (FCC)',
            title: 'Interpretação de texto',
            detail: 'Ideia central e inferência',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w1-tue-ti-bd',
            area: 'TI',
            title: 'BD: modelo relacional + ER + chaves',
            detail: 'Modelagem inicial de banco de dados',
          },
          {
            id: 'w1-tue-rlm-inteiros',
            area: 'RLM',
            title: 'Inteiros e expressões numéricas',
            detail: 'Operações e simplificações',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w1-wed-ti-arq',
            area: 'TI',
            title: 'Arquitetura: CPU, memória e I/O',
            detail: 'Visão básica de arquitetura de computadores',
          },
          {
            id: 'w1-wed-legis-8112',
            area: 'Legis',
            title: 'Lei 8.112: visão geral + provimento',
            detail: 'Base inicial da lei',
          },
        ],
      },
      {
        weekday: 4,
        blocks: [
          {
            id: 'w1-thu-ti-java-fundamentos',
            area: 'TI',
            title: 'Java: tipos e controle de fluxo',
            detail: 'Estruturas básicas da linguagem',
          },
          {
            id: 'w1-thu-pt-pontuacao',
            area: 'PT (FCC)',
            title: 'Pontuação básica',
            detail: 'Vírgula essencial',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w1-fri-ti-redes-tcpip',
            area: 'TI',
            title: 'Redes: TCP/IP + IPv4 + ARP',
            detail: 'Visão de protocolos essenciais',
          },
          {
            id: 'w1-fri-rlm-multiplos',
            area: 'RLM',
            title: 'Múltiplos e divisores',
            detail: 'Resolução de problemas',
          },
        ],
      },
      {
        weekday: 6,
        blocks: [
          {
            id: 'w1-sat-ti-git',
            area: 'TI',
            title: 'Git: commits, branches e merge',
            detail: 'Fluxo básico de versionamento',
          },
          {
            id: 'w1-sat-legis-8112-vacancia',
            area: 'Legis',
            title: 'Lei 8.112: vacância + remoção/redistribuição',
            detail: 'Pontos de movimentação funcional',
          },
          {
            id: 'w1-sat-evento-revisao',
            area: 'Evento',
            title: 'Revisão geral da semana',
            detail: '3h + refazer 50 questões erradas + organizar Anki/caderno',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 2,
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w2-mon-ti-web-css',
            area: 'TI',
            title: 'Web: CSS (seletores/box model)',
            detail: 'Layout, seletor e caixa',
          },
          {
            id: 'w2-mon-pt-coesao',
            area: 'PT',
            title: 'Coesão textual',
            detail: 'Conectivos básicos',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w2-tue-ti-sql-select',
            area: 'TI',
            title: 'SQL: SELECT/WHERE/ORDER',
            detail: 'Consultas fundamentais',
          },
          {
            id: 'w2-tue-rlm-fracoes',
            area: 'RLM',
            title: 'Frações',
            detail: 'Operações com frações',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w2-wed-ti-so',
            area: 'TI',
            title: 'SO: processos vs threads',
            detail: 'Introdução ao tema',
          },
          {
            id: 'w2-wed-legis-8112-direitos',
            area: 'Legis',
            title: 'Lei 8.112: direitos e vantagens',
            detail: 'Noções principais',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w2-thu-ti-java-oop',
            area: 'TI',
            title: 'Java: OOP (classe/objeto/encaps.)',
            detail: 'Conceitos de orientação a objetos',
          },
          {
            id: 'w2-thu-pt-redacao-extra-1',
            area: 'PT + Redação',
            title: 'Redação extra 1/38',
            detail: '30min estrutura FCC + 30min redação (tema simples)',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w2-fri-ti-redes-tcpudp',
            area: 'TI',
            title: 'Redes: TCP vs UDP + portas',
            detail: 'Comparação prática entre protocolos',
          },
          {
            id: 'w2-fri-rlm-razao',
            area: 'RLM',
            title: 'Razão e proporção',
            detail: 'Introdução com exercícios',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 50,
        hasRedacao: true,
        blocks: [
          {
            id: 'w2-sat-ti-docker-conceito',
            area: 'TI',
            title: 'Docker: conceito + imagem/contêiner',
            detail: 'Base de conteinerização',
          },
          {
            id: 'w2-sat-legis-8112-licencas',
            area: 'Legis',
            title: 'Lei 8.112: licenças e férias',
            detail: 'Visão geral',
          },
          {
            id: 'w2-sat-evento-redacao-1',
            area: 'Evento',
            title: 'Redação 1/38 + bateria PT/Legis',
            detail: '45m redação + 15m checklist + 25Q PT + 25Q Legis',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 3,
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w3-mon-ti-web-http',
            area: 'TI',
            title: 'Web: HTTP (métodos/status)',
            detail: 'Semântica de requisições e respostas',
          },
          {
            id: 'w3-mon-pt-interpretacao-avancada',
            area: 'PT (FCC)',
            title: 'Interpretação (inferência + pressuposto)',
            detail: 'Leitura estratégica de questões',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w3-tue-ti-sql-join',
            area: 'TI',
            title: 'SQL: JOIN (INNER/LEFT)',
            detail: 'Combinação de tabelas',
          },
          {
            id: 'w3-tue-rlm-regra3-direta',
            area: 'RLM',
            title: 'Regra de três direta',
            detail: 'Base operacional',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w3-wed-ti-memoria',
            area: 'TI',
            title: 'Memória virtual e paginação',
            detail: 'Introdução prática',
          },
          {
            id: 'w3-wed-legis-8112-deveres',
            area: 'Legis',
            title: 'Lei 8.112: deveres e proibições',
            detail: 'Base FCC',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w3-thu-ti-spring-boot-rest',
            area: 'TI',
            title: 'Spring Boot: controller REST (básico)',
            detail: 'Endpoints iniciais',
          },
          {
            id: 'w3-thu-pt-redacao-extra-2',
            area: 'PT + Redação',
            title: 'Redação extra 2/38',
            detail: 'Pontuação FCC (vírgula) + redação (tema fácil)',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w3-fri-ti-redes-dns-dhcp',
            area: 'TI',
            title: 'Redes: DNS e DHCP',
            detail: 'Visão de serviços de rede',
          },
          {
            id: 'w3-fri-rlm-porcentagem',
            area: 'RLM',
            title: 'Porcentagem',
            detail: 'Base de cálculo',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 0,
        hasSimulado: true,
        blocks: [
          {
            id: 'w3-sat-ti-seg-cia',
            area: 'TI',
            title: 'Segurança: CIA + autenticação vs autorização',
            detail: 'Fundamentos de segurança',
          },
          {
            id: 'w3-sat-legis-8112-regime',
            area: 'Legis',
            title: 'Lei 8.112: regime disciplinar',
            detail: 'Visão FCC',
          },
          {
            id: 'w3-sat-evento-simulado-1',
            area: 'Evento',
            title: 'Simulado 1/18',
            detail: 'Simulado completo de 3h',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 4,
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w4-mon-ti-web-rest',
            area: 'TI',
            title: 'Web: REST (recursos/idempotência)',
            detail: 'Conceitos de API',
          },
          {
            id: 'w4-mon-pt-crase-1',
            area: 'PT',
            title: 'Crase: regras essenciais 1',
            detail: 'Aplicação em questões',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w4-tue-ti-sql-group-having',
            area: 'TI',
            title: 'SQL: GROUP BY/HAVING',
            detail: 'Agregação e filtro',
          },
          {
            id: 'w4-tue-rlm-regra3-mista',
            area: 'RLM',
            title: 'Regra de três inversa/mista',
            detail: 'Prática dirigida',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w4-wed-ti-linux-arquivos',
            area: 'TI',
            title: 'Linux: arquivos e permissões',
            detail: 'Comandos essenciais',
          },
          {
            id: 'w4-wed-legis-8112-penalidades',
            area: 'Legis',
            title: 'Lei 8.112: penalidades',
            detail: 'Mapa mental de revisão',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w4-thu-ti-java-exceptions',
            area: 'TI',
            title: 'Java: exceptions + collections',
            detail: 'Tratamento de erros e estruturas',
          },
          {
            id: 'w4-thu-pt-redacao-extra-3',
            area: 'PT + Redação',
            title: 'Redação extra 3/38',
            detail: 'Crase (regras 2) + redação',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w4-fri-ti-redes-subrede',
            area: 'TI',
            title: 'Redes: sub-rede (conceito leve)',
            detail: 'Introdução de subnetting',
          },
          {
            id: 'w4-fri-rlm-problemas-porcentagem',
            area: 'RLM',
            title: 'Problemas de porcentagem',
            detail: 'Nível 2',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 50,
        hasRedacao: true,
        blocks: [
          {
            id: 'w4-sat-ti-docker-volumes',
            area: 'TI',
            title: 'Docker: volumes e ports',
            detail: 'Persistência e exposição de serviço',
          },
          {
            id: 'w4-sat-legis-8112-pad',
            area: 'Legis',
            title: 'Lei 8.112: PAD',
            detail: 'Visão FCC',
          },
          {
            id: 'w4-sat-evento-redacao-2',
            area: 'Evento',
            title: 'Redação 2/38 + bateria PT/Legis',
            detail: 'Redação + 25Q PT + 25Q Legis',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 5,
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w5-mon-ti-json-xml',
            area: 'TI',
            title: 'Web: JSON vs XML',
            detail: 'Comparativo de formatos',
          },
          {
            id: 'w5-mon-pt-regencia',
            area: 'PT',
            title: 'Regência',
            detail: 'Verbos mais cobrados FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w5-tue-ti-acid',
            area: 'TI',
            title: 'SQL: transações (ACID)',
            detail: 'Introdução ao controle transacional',
          },
          {
            id: 'w5-tue-rlm-sequencias',
            area: 'RLM',
            title: 'Sequências',
            detail: 'Fácil para médio',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w5-wed-ti-rpm-deb',
            area: 'TI',
            title: 'Linux: rpm/deb',
            detail: 'Visão de empacotamento',
          },
          {
            id: 'w5-wed-legis-9784-base',
            area: 'Legis',
            title: 'Lei 9.784: princípios e âmbito',
            detail: 'Base inicial',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w5-thu-ti-jpa-hibernate',
            area: 'TI',
            title: 'JPA/Hibernate: entidades/relacionamentos',
            detail: 'Introdução prática',
          },
          {
            id: 'w5-thu-pt-redacao-extra-4',
            area: 'PT + Redação',
            title: 'Redação extra 4/38',
            detail: 'Regência + redação',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w5-fri-ti-icmp',
            area: 'TI',
            title: 'Redes: ICMP (ping/traceroute)',
            detail: 'Ferramentas de diagnóstico',
          },
          {
            id: 'w5-fri-rlm-relacoes',
            area: 'RLM',
            title: 'Lógica de relações',
            detail: 'Bem básico',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 0,
        hasSimulado: true,
        blocks: [
          {
            id: 'w5-sat-ti-owasp',
            area: 'TI',
            title: 'OWASP Top 10',
            detail: 'Visão geral dos riscos',
          },
          {
            id: 'w5-sat-legis-9784-comp',
            area: 'Legis',
            title: 'Lei 9.784: competência/interessados',
            detail: 'Base operacional',
          },
          {
            id: 'w5-sat-evento-simulado-2',
            area: 'Evento',
            title: 'Simulado 2/18',
            detail: 'Simulado completo de 3h',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 6,
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w6-mon-ti-cors',
            area: 'TI',
            title: 'Web: CORS + noções de segurança',
            detail: 'Permissões e contexto de browser',
          },
          {
            id: 'w6-mon-pt-concordancia',
            area: 'PT',
            title: 'Concordância verbal',
            detail: 'Base FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w6-tue-ti-indices',
            area: 'TI',
            title: 'SQL: índices',
            detail: 'Quando e onde usar',
          },
          {
            id: 'w6-tue-rlm-tabelas',
            area: 'RLM',
            title: 'Tabelas e condições',
            detail: 'Questões fáceis',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w6-wed-ti-windows',
            area: 'TI',
            title: 'Windows: noções (serviços/updates)',
            detail: 'Rotina de administração básica',
          },
          {
            id: 'w6-wed-legis-9784-atos',
            area: 'Legis',
            title: 'Lei 9.784: atos administrativos',
            detail: 'Visão geral',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w6-thu-ti-junit-mockito',
            area: 'TI',
            title: 'Testes: JUnit/Mockito (intro)',
            detail: 'Base de testes automatizados',
          },
          {
            id: 'w6-thu-pt-redacao-extra-5',
            area: 'PT + Redação',
            title: 'Redação extra 5/38',
            detail: 'Concordância + redação',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w6-fri-ti-vlan',
            area: 'TI',
            title: 'Redes: VLAN (conceito)',
            detail: 'Segmentação lógica de rede',
          },
          {
            id: 'w6-fri-rlm-temporal',
            area: 'RLM',
            title: 'Orientação temporal',
            detail: 'Ordenação de eventos',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 50,
        hasRedacao: true,
        blocks: [
          {
            id: 'w6-sat-ti-cicd',
            area: 'TI',
            title: 'CI/CD + Gitflow',
            detail: 'Conceito e fluxo de entrega',
          },
          {
            id: 'w6-sat-legis-9784-motivacao',
            area: 'Legis',
            title: 'Lei 9.784: motivação/forma/prazos',
            detail: 'Pontos críticos de prova',
          },
          {
            id: 'w6-sat-evento-redacao-3',
            area: 'Evento',
            title: 'Redação 3/38 + bateria PT/Legis',
            detail: 'Redação + 25Q PT + 25Q Legis',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 7,
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w7-mon-ti-typescript',
            area: 'TI',
            title: 'TypeScript: tipos e interfaces',
            detail: 'Fundamentos de tipagem',
          },
          {
            id: 'w7-mon-pt-pronomes',
            area: 'PT',
            title: 'Pronomes',
            detail: 'Emprego e formas de tratamento',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w7-tue-ti-normalizacao',
            area: 'TI',
            title: 'Normalização: 1NF-3NF',
            detail: 'Modelagem normalizada',
          },
          {
            id: 'w7-tue-rlm-deducao',
            area: 'RLM',
            title: 'Dedução se/então',
            detail: 'Questões fáceis',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w7-wed-ti-systemd',
            area: 'TI',
            title: 'Systemd: serviços',
            detail: 'Visão operacional',
          },
          {
            id: 'w7-wed-legis-lgpd-conceitos',
            area: 'Legis',
            title: 'LGPD: conceitos e fundamentos',
            detail: 'Base legal',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w7-thu-ti-spring-camadas',
            area: 'TI',
            title: 'Spring: camadas (controller/service/repo)',
            detail: 'Arquitetura em camadas',
          },
          {
            id: 'w7-thu-pt-redacao-extra-6',
            area: 'PT + Redação',
            title: 'Redação extra 6/38',
            detail: 'Pronomes/colocação + redação',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w7-fri-ti-dhcp-dns-reforco',
            area: 'TI',
            title: 'Redes: DHCP/DNS (reforço)',
            detail: 'Revisão dos protocolos',
          },
          {
            id: 'w7-fri-rlm-verbal',
            area: 'RLM',
            title: 'Raciocínio verbal',
            detail: 'Condições e inferências',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 0,
        hasSimulado: true,
        blocks: [
          {
            id: 'w7-sat-ti-oauth2',
            area: 'TI',
            title: 'OAuth2/SSO',
            detail: 'Visão bem leve',
          },
          {
            id: 'w7-sat-legis-lgpd-agentes',
            area: 'Legis',
            title: 'LGPD: agentes e direitos',
            detail: 'Visão aplicada',
          },
          {
            id: 'w7-sat-evento-simulado-3',
            area: 'Evento',
            title: 'Simulado 3/18',
            detail: 'Simulado completo de 3h',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 8,
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w8-mon-ti-angular',
            area: 'TI',
            title: 'Angular: componentes/SPA',
            detail: 'Base de framework',
          },
          {
            id: 'w8-mon-pt-virgula',
            area: 'PT',
            title: 'Vírgula',
            detail: 'Regras principais FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w8-tue-ti-constraints',
            area: 'TI',
            title: 'SQL: constraints (PK/FK/UNIQUE)',
            detail: 'Integridade de dados',
          },
          {
            id: 'w8-tue-rlm-discriminacao',
            area: 'RLM',
            title: 'Discriminação de elementos',
            detail: 'Resolução de questões',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w8-wed-ti-bash',
            area: 'TI',
            title: 'Bash: pipes/grep/cat',
            detail: 'Comandos base',
          },
          {
            id: 'w8-wed-legis-lgpd-bases',
            area: 'Legis',
            title: 'LGPD: bases legais',
            detail: 'Visão prática',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w8-thu-ti-spring-rest-validacao',
            area: 'TI',
            title: 'Spring REST: validação e erros',
            detail: 'Básico de tratamento de input',
          },
          {
            id: 'w8-thu-pt-redacao-extra-7',
            area: 'PT + Redação',
            title: 'Redação extra 7/38',
            detail: 'Vírgula + redação',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w8-fri-ti-snmp-syslog-ntp',
            area: 'TI',
            title: 'Redes: SNMP/syslog/NTP',
            detail: 'Visão de monitoramento e tempo',
          },
          {
            id: 'w8-fri-rlm-sequencias-medio',
            area: 'RLM',
            title: 'Sequências (médio)',
            detail: 'Evolução de dificuldade',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 50,
        hasRedacao: true,
        blocks: [
          {
            id: 'w8-sat-ti-elk',
            area: 'TI',
            title: 'ELK: Logstash/Elasticsearch/Kibana',
            detail: 'Fundamentos de stack de logs',
          },
          {
            id: 'w8-sat-legis-lgpd-incidentes',
            area: 'Legis',
            title: 'LGPD: segurança e incidentes',
            detail: 'Visão operacional',
          },
          {
            id: 'w8-sat-evento-redacao-4',
            area: 'Evento',
            title: 'Redação 4/38 + bateria PT/Legis',
            detail: 'Redação + 25Q PT + 25Q Legis',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 9,
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w9-mon-ti-rest-versionamento',
            area: 'TI',
            title: 'REST: versionamento e paginação',
            detail: 'Abordagem leve',
          },
          {
            id: 'w9-mon-pt-verbos',
            area: 'PT',
            title: 'Tempos e modos verbais',
            detail: 'Base FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w9-tue-ti-plsql',
            area: 'TI',
            title: 'PL/SQL: procedures/functions',
            detail: 'Introdução',
          },
          {
            id: 'w9-tue-rlm-relacoes',
            area: 'RLM',
            title: 'Relações pessoas/lugares',
            detail: 'Nível médio',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w9-wed-ti-ad',
            area: 'TI',
            title: 'Active Directory: conceitos',
            detail: 'Visão leve',
          },
          {
            id: 'w9-wed-legis-14133-intro',
            area: 'Legis',
            title: 'Lei 14.133: visão geral/princípios/fases',
            detail: 'Introdução',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w9-thu-ti-spring-security',
            area: 'TI',
            title: 'Spring Security: conceito',
            detail: 'Visão bem leve',
          },
          {
            id: 'w9-thu-pt-redacao-extra-8',
            area: 'PT + Redação',
            title: 'Redação extra 8/38',
            detail: 'Verbos + redação',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w9-fri-ti-ipv6',
            area: 'TI',
            title: 'Redes: IPv6',
            detail: 'Noção de endereçamento',
          },
          {
            id: 'w9-fri-rlm-bateria-mista',
            area: 'RLM',
            title: 'Bateria mista',
            detail: 'Treino de velocidade',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 0,
        hasSimulado: true,
        blocks: [
          {
            id: 'w9-sat-ti-ataques',
            area: 'TI',
            title: 'Ataques: phishing/bruteforce/DDoS',
            detail: 'Visão geral',
          },
          {
            id: 'w9-sat-legis-14133-papeis',
            area: 'Legis',
            title: 'Lei 14.133: papéis e agentes',
            detail: 'Visão de responsabilização',
          },
          {
            id: 'w9-sat-evento-simulado-4',
            area: 'Evento',
            title: 'Simulado 4/18',
            detail: 'Simulado completo de 3h',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 10,
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w10-mon-ti-websec',
            area: 'TI',
            title: 'WebSec: XSS e CSRF',
            detail: 'Base de segurança web',
          },
          {
            id: 'w10-mon-pt-regencia-crase',
            area: 'PT',
            title: 'Regência + crase',
            detail: 'Bateria FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w10-tue-ti-subquery',
            area: 'TI',
            title: 'SQL: subquery',
            detail: 'Consultas encadeadas',
          },
          {
            id: 'w10-tue-rlm-problemas-mistos',
            area: 'RLM',
            title: 'Problemas mistos',
            detail: 'Tempo e ordem',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w10-wed-ti-virtualizacao',
            area: 'TI',
            title: 'Virtualização: conceitos',
            detail: 'Fundamentos operacionais',
          },
          {
            id: 'w10-wed-legis-14133-planejamento',
            area: 'Legis',
            title: 'Lei 14.133: planejamento',
            detail: 'Visão de preparação',
          },
        ],
      },
      {
        weekday: 4,
        blocks: [
          {
            id: 'w10-thu-ti-testes-reforco',
            area: 'TI',
            title: 'Testes: unitário vs integração',
            detail: 'Reforço conceitual',
          },
          {
            id: 'w10-thu-pt-reescrita',
            area: 'PT',
            title: 'Reescrita/confronto de frases',
            detail: 'FCC puro',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w10-fri-ti-qos',
            area: 'TI',
            title: 'QoS: para que serve',
            detail: 'Visão funcional',
          },
          {
            id: 'w10-fri-rlm-logica-tabela',
            area: 'RLM',
            title: 'Lógica de tabela',
            detail: 'Nível médio',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 50,
        hasRedacao: true,
        blocks: [
          {
            id: 'w10-sat-ti-proxy-reverso',
            area: 'TI',
            title: 'Proxy reverso (conceito)',
            detail: 'Noções de arquitetura',
          },
          {
            id: 'w10-sat-legis-14133-contratos',
            area: 'Legis',
            title: 'Lei 14.133: contratos',
            detail: 'Noções principais',
          },
          {
            id: 'w10-sat-evento-redacao-5',
            area: 'Evento',
            title: 'Redação 5/38 + bateria PT/Legis',
            detail: 'Redação + 25Q PT + 25Q Legis',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 11,
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w11-mon-ti-revisao-web',
            area: 'TI',
            title: 'Revisão Web/REST/segurança',
            detail: 'Foco em erros',
          },
          {
            id: 'w11-mon-pt-concordancia-pegadinhas',
            area: 'PT',
            title: 'Concordância (pegadinhas FCC)',
            detail: 'Treino direcionado',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w11-tue-ti-revisao-sql',
            area: 'TI',
            title: 'Revisão SQL (JOIN/GROUP/subquery)',
            detail: 'Consolidação de consultas',
          },
          {
            id: 'w11-tue-rlm-50q-fraco',
            area: 'RLM',
            title: '50 questões do tema fraco',
            detail: 'Correção imediata',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w11-wed-ti-revisao-linux-win',
            area: 'TI',
            title: 'Revisão Linux/Win',
            detail: 'Apenas erros recorrentes',
          },
          {
            id: 'w11-wed-legis-8112-pad',
            area: 'Legis',
            title: 'Lei 8.112: regime disciplinar/PAD',
            detail: 'Questões dirigidas',
          },
        ],
      },
      {
        weekday: 4,
        blocks: [
          {
            id: 'w11-thu-ti-java-revisao',
            area: 'TI',
            title: 'Java revisão (OOP/JPA/Spring)',
            detail: 'Revisão por erro',
          },
          {
            id: 'w11-thu-pt-pontuacao-reescrita',
            area: 'PT',
            title: 'Pontuação + reescrita',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w11-fri-ti-redes-revisao-dns',
            area: 'TI',
            title: 'Redes revisão (DNS/DHCP/VLAN)',
            detail: 'Lista de erros',
          },
          {
            id: 'w11-fri-rlm-relacoes-deducao',
            area: 'RLM',
            title: 'Relações e dedução',
            detail: 'Nível médio',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 0,
        hasSimulado: true,
        blocks: [
          {
            id: 'w11-sat-ti-observabilidade',
            area: 'TI',
            title: 'Observabilidade: Prometheus/Grafana',
            detail: 'Visão geral',
          },
          {
            id: 'w11-sat-legis-lgpd-questoes',
            area: 'Legis',
            title: 'LGPD: questões dirigidas',
            detail: 'Reforço prático',
          },
          {
            id: 'w11-sat-evento-simulado-5',
            area: 'Evento',
            title: 'Simulado 5/18',
            detail: 'Simulado completo de 3h',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 12,
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w12-mon-ti-angular-ts-revisao',
            area: 'TI',
            title: 'Angular/TS revisão',
            detail: 'Apenas erros',
          },
          {
            id: 'w12-mon-pt-crase-regencia',
            area: 'PT',
            title: 'Crase/regência',
            detail: 'Somente questões',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w12-tue-ti-bd-revisao',
            area: 'TI',
            title: 'BD revisão (índices/normalização/constraints)',
            detail: 'Revisão orientada por erros',
          },
          {
            id: 'w12-tue-rlm-porcentagem-regra3',
            area: 'RLM',
            title: '% + regra de três',
            detail: 'Treino de velocidade',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w12-wed-ti-so-revisao',
            area: 'TI',
            title: 'SO revisão (processos/memória)',
            detail: 'Consolidação dos pontos fracos',
          },
          {
            id: 'w12-wed-legis-9784-questoes',
            area: 'Legis',
            title: 'Lei 9.784 (atos/motivação/prazos)',
            detail: 'Questões dirigidas',
          },
        ],
      },
      {
        weekday: 4,
        blocks: [
          {
            id: 'w12-thu-ti-testes-seguranca-revisao',
            area: 'TI',
            title: 'Testes/segurança revisão',
            detail: 'Lista de erros',
          },
          {
            id: 'w12-thu-pt-pronomes-reescrita',
            area: 'PT',
            title: 'Pronomes/colocação + reescrita',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w12-fri-ti-redes-revisao-tcpudpicmp',
            area: 'TI',
            title: 'Redes revisão (TCP/UDP/ICMP)',
            detail: 'Correção de falhas recorrentes',
          },
          {
            id: 'w12-fri-rlm-simulado-50q',
            area: 'RLM',
            title: 'Simulado RLM (50Q)',
            detail: 'Treino de ritmo',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 0,
        hasSimulado: true,
        blocks: [
          {
            id: 'w12-sat-ti-devops-revisao',
            area: 'TI',
            title: 'DevOps revisão (Git/Docker/CI-CD)',
            detail: 'Fechamento dos tópicos de infraestrutura',
          },
          {
            id: 'w12-sat-legis-14133-questoes',
            area: 'Legis',
            title: 'Lei 14.133: questões dirigidas',
            detail: 'Revisão final por questão',
          },
          {
            id: 'w12-sat-evento-simulado-6',
            area: 'Evento',
            title: 'Simulado 6/18',
            detail: 'Simulado completo de 3h',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 13,
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w13-mon-ti-fraqueza-1',
            area: 'TI',
            title: 'Maior fraqueza do Simulado 6',
            detail: 'Sessão de correção profunda',
          },
          {
            id: 'w13-mon-pt-fraqueza-1',
            area: 'PT',
            title: 'Maior fraqueza do Simulado 6',
            detail: 'Correção de padrão de erro',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w13-tue-ti-fraqueza-2',
            area: 'TI',
            title: '2ª fraqueza principal',
            detail: 'Recuperação dirigida',
          },
          {
            id: 'w13-tue-rlm-fraqueza',
            area: 'RLM',
            title: 'Tema mais errado',
            detail: 'Bateria focada no gargalo',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w13-wed-ti-so-linux-win',
            area: 'TI',
            title: 'SO/Linux/Win conforme erro',
            detail: 'Correção final por incidente',
          },
          {
            id: 'w13-wed-legis-lei-mais-errada',
            area: 'Legis',
            title: 'Lei mais errada (8.112/9.784/LGPD/14.133)',
            detail: 'Ataque direto ao ponto fraco',
          },
        ],
      },
      {
        weekday: 4,
        blocks: [
          {
            id: 'w13-thu-ti-java-spring-testes',
            area: 'TI',
            title: 'Java/Spring/testes conforme erro',
            detail: 'Revisão final orientada por falha',
          },
          {
            id: 'w13-thu-pt-reescrita-confronto',
            area: 'PT',
            title: 'Reescrita + confronto de frases',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w13-fri-ti-redes-erro',
            area: 'TI',
            title: 'Redes conforme erro',
            detail: 'Ajuste dos tópicos críticos',
          },
          {
            id: 'w13-fri-rlm-bateria-tempo',
            area: 'RLM',
            title: 'Bateria mista',
            detail: 'Foco em tempo',
          },
        ],
      },
      {
        weekday: 6,
        blocks: [
          {
            id: 'w13-sat-ti-cards-erro',
            area: 'TI',
            title: 'Revisão de cards de erro',
            detail: 'Somente os piores',
          },
          {
            id: 'w13-sat-legis-lei-seca',
            area: 'Legis',
            title: 'Lei seca dirigida + questões',
            detail: 'Fechamento da semana tampão',
          },
        ],
      },
    ],
  },
  {
    weekNumber: 14,
    startDate: '2026-05-25',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w14-mon-ti-web-js-dom-fetch-json',
            area: 'TI',
            title: 'Web/JS: DOM + fetch + JSON',
            detail: 'Fluxo real de requisicao + pratica com API renderizando lista',
          },
          {
            id: 'w14-mon-pt-interpretacao-inferencia',
            area: 'PT (FCC)',
            title: 'Interpretacao de texto',
            detail: 'Inferencia e pressupostos',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w14-tue-ti-sql-join-group-having',
            area: 'TI',
            title: 'SQL: JOIN + GROUP BY + HAVING',
            detail: 'Reforco com casos reais em clientes/pedidos',
          },
          {
            id: 'w14-tue-rlm-relacoes-medio',
            area: 'RLM',
            title: 'Logica de relacoes',
            detail: 'Nivel medio',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w14-wed-ti-linux-permissoes-processos',
            area: 'TI',
            title: 'Linux: permissoes, processos, ps/top/kill, systemctl',
            detail: 'Subir/parar servico e inspecionar processo',
          },
          {
            id: 'w14-wed-legis-14133-principios-fases',
            area: 'Legis',
            title: 'Lei 14.133: visao geral, principios e fases',
            detail: 'Revisao de base',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w14-thu-ti-spring-boot-crud',
            area: 'TI',
            title: 'Java/Spring: Spring Boot CRUD basico',
            detail: 'Camadas + endpoint GET/POST simples',
          },
          {
            id: 'w14-thu-pt-reescrita-redacao',
            area: 'PT',
            title: 'Reescrita FCC + redacao curta',
            detail: 'Tema simples',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w14-fri-ti-redes-dns-dhcp-nat',
            area: 'TI',
            title: 'Redes: DNS, DHCP, NAT',
            detail: 'Conceitos + observacao local',
          },
          {
            id: 'w14-fri-rlm-porcentagem-regra3',
            area: 'RLM',
            title: 'Porcentagem e regra de 3',
            detail: 'Velocidade',
          },
        ],
      },
      {
        weekday: 6,
        hasRedacao: true,
        objectiveQuestions: 50,
        blocks: [
          {
            id: 'w14-sat-ti-git-docker-branch-merge',
            area: 'TI',
            title: 'Git/Docker: branch/merge + Dockerfile basico',
            detail: 'Dockerfile para app simples',
          },
          {
            id: 'w14-sat-legis-14133-agentes',
            area: 'Legis',
            title: 'Lei 14.133: agentes publicos e papeis',
            detail: 'Reforco de prova',
          },
          {
            id: 'w14-sat-evento-redacao-15',
            area: 'Evento',
            title: 'Redacao + 25Q PT + 25Q Legis',
            detail: 'Ao fim da semana: Simulados 6/18 | Redacoes 15/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 15,
    startDate: '2026-06-01',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w15-mon-ti-http-rest',
            area: 'TI',
            title: 'HTTP/REST: metodos, status e idempotencia',
            detail: 'Pratica com Insomnia/Postman/curl',
          },
          {
            id: 'w15-mon-pt-crase',
            area: 'PT',
            title: 'Crase',
            detail: 'Pegadinhas FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w15-tue-ti-sql-subqueries',
            area: 'TI',
            title: 'SQL: subqueries (basico -> medio)',
            detail: 'Pratica com 5 consultas',
          },
          {
            id: 'w15-tue-rlm-deducao-condicoes',
            area: 'RLM',
            title: 'Deducao logica',
            detail: 'Se/entao e condicoes',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w15-wed-ti-so-memoria-paginacao',
            area: 'TI',
            title: 'SO (Windows/Linux): memoria virtual, paginacao e segmentacao',
            detail: 'Conceitual + observar consumo de memoria',
          },
          {
            id: 'w15-wed-legis-14133-planejamento',
            area: 'Legis',
            title: 'Lei 14.133: planejamento da contratacao',
            detail: 'Pontos cobrados',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w15-thu-ti-jpa-hibernate-entity',
            area: 'TI',
            title: 'JPA/Hibernate: @Entity, @Id, relacionamento 1:N',
            detail: 'Entidade Cliente-Pedido',
          },
          {
            id: 'w15-thu-pt-regencia-redacao',
            area: 'PT',
            title: 'Regencia + redacao extra',
            detail: 'Pratica dirigida',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w15-fri-ti-redes-icmp',
            area: 'TI',
            title: 'Redes: ICMP + ping/traceroute',
            detail: 'Testar rotas e latencia',
          },
          {
            id: 'w15-fri-rlm-tabelas-ordenacao',
            area: 'RLM',
            title: 'Tabelas e ordenacao logica',
            detail: 'Nivel medio',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 0,
        hasSimulado: true,
        blocks: [
          {
            id: 'w15-sat-ti-seguranca-owasp',
            area: 'TI',
            title: 'Seguranca: OWASP Top 10',
            detail: 'Reconhecer XSS/CSRF em exemplos',
          },
          {
            id: 'w15-sat-legis-14133-preparatoria',
            area: 'Legis',
            title: 'Lei 14.133: fase preparatoria',
            detail: 'Pontos cobrados',
          },
          {
            id: 'w15-sat-evento-simulado-7',
            area: 'Evento',
            title: 'Simulado 7/18 (3h)',
            detail: 'Erro por topico | Ao fim da semana: Simulados 7/18 | Redacoes 16/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 16,
    startDate: '2026-06-08',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w16-mon-ti-typescript',
            area: 'TI',
            title: 'TypeScript: tipos, interfaces, funcoes tipadas',
            detail: 'Refatorar JS para TS',
          },
          {
            id: 'w16-mon-pt-concordancia-verbal',
            area: 'PT',
            title: 'Concordancia verbal',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w16-tue-ti-sql-constraints-normalizacao',
            area: 'TI',
            title: 'SQL/modelagem: constraints + normalizacao',
            detail: 'PK/FK/UNIQUE/NOT NULL na pratica',
          },
          {
            id: 'w16-tue-rlm-mistos-porcentagem-razao',
            area: 'RLM',
            title: 'Problemas mistos',
            detail: 'Porcentagem + razao',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w16-wed-ti-linux-bash-pipes',
            area: 'TI',
            title: 'Linux Bash: pipes, grep, cat, redirecionamento',
            detail: 'Mini script para filtrar logs',
          },
          {
            id: 'w16-wed-legis-lgpd-principios',
            area: 'Legis',
            title: 'LGPD: conceitos, fundamentos e principios',
            detail: 'Visao de prova',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w16-thu-ti-spring-validacao-erro',
            area: 'TI',
            title: 'Spring: validacao + tratamento de erro',
            detail: '@Valid + exception handler',
          },
          {
            id: 'w16-thu-pt-pontuacao-redacao',
            area: 'PT',
            title: 'Pontuacao (virgula) + redacao extra',
            detail: 'Pratica FCC',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w16-fri-ti-redes-snmp-syslog-ntp',
            area: 'TI',
            title: 'Redes: SNMP, Syslog, NTP',
            detail: 'Conceitos e aplicacao',
          },
          {
            id: 'w16-fri-rlm-verbal-condicional',
            area: 'RLM',
            title: 'Raciocinio verbal/condicional',
            detail: 'Nivel medio',
          },
        ],
      },
      {
        weekday: 6,
        hasRedacao: true,
        objectiveQuestions: 50,
        blocks: [
          {
            id: 'w16-sat-ti-docker-volumes',
            area: 'TI',
            title: 'Docker: volumes + portas + persistencia',
            detail: 'Subir app + banco com volume',
          },
          {
            id: 'w16-sat-legis-lgpd-agentes-direitos',
            area: 'Legis',
            title: 'LGPD: agentes de tratamento + direitos do titular',
            detail: 'Fixacao por questoes',
          },
          {
            id: 'w16-sat-evento-redacao-18',
            area: 'Evento',
            title: 'Redacao + 25Q PT + 25Q Legis',
            detail: 'Ao fim da semana: Simulados 7/18 | Redacoes 18/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 17,
    startDate: '2026-06-15',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w17-mon-ti-angular-componentes-binding',
            area: 'TI',
            title: 'Angular: componentes, template e binding',
            detail: 'Mini app com 2 componentes',
          },
          {
            id: 'w17-mon-pt-pronomes',
            area: 'PT',
            title: 'Pronomes',
            detail: 'Emprego e colocacao',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w17-tue-ti-sql-transacoes',
            area: 'TI',
            title: 'SQL: transacoes (ACID, commit/rollback)',
            detail: 'Simulacao de transacao e rollback',
          },
          {
            id: 'w17-tue-rlm-relacoes-pessoas-lugares',
            area: 'RLM',
            title: 'Relacoes pessoas/lugares',
            detail: 'Nivel medio',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w17-wed-ti-windows-ad-powershell',
            area: 'TI',
            title: 'Windows: Active Directory + PowerShell (nocao)',
            detail: 'Comandos basicos PowerShell',
          },
          {
            id: 'w17-wed-legis-lgpd-bases-legais',
            area: 'Legis',
            title: 'LGPD: bases legais',
            detail: 'Visao de prova',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w17-thu-ti-testes-junit-mockito',
            area: 'TI',
            title: 'Testes: JUnit/Mockito (unitario basico)',
            detail: 'Testar service com mock',
          },
          {
            id: 'w17-thu-pt-reescrita-redacao',
            area: 'PT',
            title: 'Reescrita FCC + redacao extra',
            detail: 'Pratica de escrita',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w17-fri-ti-redes-http-https',
            area: 'TI',
            title: 'Redes: HTTP/HTTPS + portas e camadas',
            detail: 'Revisao aplicada com curl e headers',
          },
          {
            id: 'w17-fri-rlm-bateria-velocidade',
            area: 'RLM',
            title: 'Bateria de velocidade',
            detail: 'Treino sob tempo',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 0,
        hasSimulado: true,
        blocks: [
          {
            id: 'w17-sat-ti-devops-cicd-maven',
            area: 'TI',
            title: 'DevOps: CI/CD + Maven',
            detail: 'Pipeline conceito + build/test local',
          },
          {
            id: 'w17-sat-legis-lgpd-seguranca-sancoes',
            area: 'Legis',
            title: 'LGPD: seguranca, incidente e sancoes',
            detail: 'Fixacao por questoes',
          },
          {
            id: 'w17-sat-evento-simulado-8',
            area: 'Evento',
            title: 'Simulado 8/18 (3h)',
            detail: 'Ao fim da semana: Simulados 8/18 | Redacoes 19/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 18,
    startDate: '2026-06-22',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w18-mon-ti-rest-swagger',
            area: 'TI',
            title: 'REST/Swagger: OpenAPI e documentacao',
            detail: 'Adicionar Swagger e documentar endpoints',
          },
          {
            id: 'w18-mon-pt-regencia-crase',
            area: 'PT',
            title: 'Regencia + crase',
            detail: 'Bateria FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w18-tue-ti-bd-comparacao',
            area: 'TI',
            title: 'BD: Oracle x PostgreSQL x SQL Server',
            detail: 'Diferencas cobradas',
          },
          {
            id: 'w18-tue-rlm-deducao-multiplas',
            area: 'RLM',
            title: 'Deducao com multiplas condicoes',
            detail: 'Nivel medio',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w18-wed-ti-linux-pacotes',
            area: 'TI',
            title: 'Linux: apt, rpm, dnf',
            detail: 'Instalar/remover pacote + checar servico',
          },
          {
            id: 'w18-wed-legis-improbidade-visao',
            area: 'Legis',
            title: 'Improbidade (8.429 + 14.230)',
            detail: 'Visao geral',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w18-thu-ti-java-collections-excecoes',
            area: 'TI',
            title: 'Java: Collections + excecoes',
            detail: 'Mini exercicio com tratamento de erro',
          },
          {
            id: 'w18-thu-pt-concordancia-redacao',
            area: 'PT',
            title: 'Concordancia + redacao extra',
            detail: 'Pratica dirigida',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w18-fri-ti-redes-vlan-lacp',
            area: 'TI',
            title: 'Redes: VLAN + LACP',
            detail: 'Conceitos e cenarios',
          },
          {
            id: 'w18-fri-rlm-tabelas-sequencias',
            area: 'RLM',
            title: 'Tabelas e sequencias',
            detail: 'Treino em tempo',
          },
        ],
      },
      {
        weekday: 6,
        hasRedacao: true,
        objectiveQuestions: 50,
        blocks: [
          {
            id: 'w18-sat-ti-seguranca-jwt',
            area: 'TI',
            title: 'Seguranca: autenticacao x autorizacao, JWT',
            detail: 'Gerar e inspecionar JWT',
          },
          {
            id: 'w18-sat-legis-improbidade-atos',
            area: 'Legis',
            title: 'Improbidade: atos, sancoes e mudancas da 14.230',
            detail: 'Foco de prova',
          },
          {
            id: 'w18-sat-evento-redacao-21',
            area: 'Evento',
            title: 'Redacao + 25Q PT + 25Q Legis',
            detail: 'Ao fim da semana: Simulados 8/18 | Redacoes 21/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 19,
    startDate: '2026-06-29',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w19-mon-ti-spring-security-jwt',
            area: 'TI',
            title: 'Spring Security/JWT: fluxo basico de auth',
            detail: 'Endpoint protegido + token',
          },
          {
            id: 'w19-mon-pt-tempos-verbais',
            area: 'PT',
            title: 'Tempos e modos verbais',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w19-tue-ti-sql-joins-subquery-agregacoes',
            area: 'TI',
            title: 'SQL: JOIN + subquery + agregacoes',
            detail: 'Lista de 8 queries mistas',
          },
          {
            id: 'w19-tue-rlm-mistos-tempo',
            area: 'RLM',
            title: 'Problemas mistos',
            detail: 'Pressao de tempo',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w19-wed-ti-so-escalonamento-ipc',
            area: 'TI',
            title: 'SO: escalonamento, ciclo de processo e IPC',
            detail: 'Conceitual + observacao leve',
          },
          {
            id: 'w19-wed-legis-lbi-13146',
            area: 'Legis',
            title: 'LBI 13.146: estrutura e pontos cobrados',
            detail: 'Visao de prova',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w19-thu-ti-jpa-lazy-eager-n1',
            area: 'TI',
            title: 'JPA/Hibernate: lazy/eager e nocao de N+1',
            detail: 'Testar relacionamento e serializacao',
          },
          {
            id: 'w19-thu-pt-reescrita-redacao',
            area: 'PT',
            title: 'Reescrita/confronto + redacao extra',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w19-fri-ti-redes-conjunto-fcc',
            area: 'TI',
            title: 'Redes: DNS, DHCP, NTP, SMTP, Syslog',
            detail: 'Mapa protocolo x funcao x porta',
          },
          {
            id: 'w19-fri-rlm-raciocinio-verbal',
            area: 'RLM',
            title: 'Raciocinio verbal',
            detail: 'Nivel medio',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 0,
        hasSimulado: true,
        blocks: [
          {
            id: 'w19-sat-ti-testes-unitario-integracao',
            area: 'TI',
            title: 'Testes: unitario x integracao x cobertura',
            detail: '1 teste unitario + 1 integracao simples',
          },
          {
            id: 'w19-sat-legis-lbi-direitos',
            area: 'Legis',
            title: 'LBI: direitos e acessibilidade',
            detail: 'Foco em prova',
          },
          {
            id: 'w19-sat-evento-simulado-9',
            area: 'Evento',
            title: 'Simulado 9/18 (3h)',
            detail: 'Ao fim da semana: Simulados 9/18 | Redacoes 22/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 20,
    startDate: '2026-07-06',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w20-mon-ti-angular-services-rotas',
            area: 'TI',
            title: 'Angular: services, rotas e consumo de API',
            detail: 'Service + HttpClient em mini app',
          },
          {
            id: 'w20-mon-pt-coordenacao-subordinacao',
            area: 'PT',
            title: 'Coordenacao e subordinacao',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w20-tue-ti-dw-olap-data-mining',
            area: 'TI',
            title: 'DW/OLAP/Data Mining (intro)',
            detail: 'Diferena OLTP x OLAP no seu banco',
          },
          {
            id: 'w20-tue-rlm-relacoes-medio',
            area: 'RLM',
            title: 'Logica de relacoes',
            detail: 'Nivel medio',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w20-wed-ti-windows-rds-wsus-failover',
            area: 'TI',
            title: 'Windows: RDS, WSUS, Failover Cluster',
            detail: 'Visao de prova + cenario de uso',
          },
          {
            id: 'w20-wed-legis-regimento-trt4',
            area: 'Legis',
            title: 'Regimento Interno TRT4',
            detail: 'Leitura guiada + marcacao',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w20-thu-ti-java-spring-dto-entity',
            area: 'TI',
            title: 'Java/Spring: DTO x Entity x validacao',
            detail: 'Separar DTO e entidade na API',
          },
          {
            id: 'w20-thu-pt-pontuacao-redacao',
            area: 'PT',
            title: 'Pontuacao + redacao extra',
            detail: 'Pratica dirigida',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w20-fri-ti-redes-icmp-snmp-qos',
            area: 'TI',
            title: 'Redes: ICMP, SNMP, QoS',
            detail: 'Gerenciamento de rede',
          },
          {
            id: 'w20-fri-rlm-bateria-velocidade',
            area: 'RLM',
            title: 'Bateria de velocidade',
            detail: 'Foco em tempo',
          },
        ],
      },
      {
        weekday: 6,
        hasRedacao: true,
        objectiveQuestions: 50,
        blocks: [
          {
            id: 'w20-sat-ti-observabilidade-elk',
            area: 'TI',
            title: 'Observabilidade: Elasticsearch/Logstash/Kibana',
            detail: 'Fluxo log -> logstash -> indice -> dashboard',
          },
          {
            id: 'w20-sat-legis-regimento-trt4-questoes',
            area: 'Legis',
            title: 'Regimento TRT4',
            detail: 'Questoes + fixacao',
          },
          {
            id: 'w20-sat-evento-redacao-24',
            area: 'Evento',
            title: 'Redacao + 25Q PT + 25Q Legis',
            detail: 'Ao fim da semana: Simulados 9/18 | Redacoes 24/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 21,
    startDate: '2026-07-13',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w21-mon-ti-oauth2-sso-keycloak',
            area: 'TI',
            title: 'OAuth2/SSO/Keycloak',
            detail: 'Fluxo authorization code e papel do IdP',
          },
          {
            id: 'w21-mon-pt-figuras-interpretacao',
            area: 'PT',
            title: 'Figuras de linguagem + interpretacao',
            detail: 'O que a FCC cobra',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w21-tue-ti-sql-plsql',
            area: 'TI',
            title: 'SQL/PLSQL: procedures, functions, triggers',
            detail: 'Criar procedure simples',
          },
          {
            id: 'w21-tue-rlm-deducao-tabelas',
            area: 'RLM',
            title: 'Deducao e tabelas',
            detail: 'Nivel medio',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w21-wed-ti-seguranca-nist-ssdf-owasp',
            area: 'TI',
            title: 'Seguranca: NIST SSDF + OWASP',
            detail: 'Checklist de praticas no projeto API',
          },
          {
            id: 'w21-wed-legis-cnj-400',
            area: 'Legis',
            title: 'Resolucao CNJ 400/2021',
            detail: 'Sustentabilidade - leitura dirigida',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w21-thu-ti-testes-mockito-verify',
            area: 'TI',
            title: 'Testes/Mockito: mock, stub, verify',
            detail: 'Service com verify()',
          },
          {
            id: 'w21-thu-pt-reescrita-redacao',
            area: 'PT',
            title: 'Reescrita FCC + redacao extra',
            detail: 'Treino de escrita',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w21-fri-ti-redes-ldap-ad',
            area: 'TI',
            title: 'Redes: LDAP no contexto com AD',
            detail: 'Mapa LDAP x AD x autenticacao',
          },
          {
            id: 'w21-fri-rlm-revisao-erros',
            area: 'RLM',
            title: 'Revisao dirigida pelos erros',
            detail: 'Consolidacao final',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 0,
        hasSimulado: true,
        blocks: [
          {
            id: 'w21-sat-ti-devops-gitlab-gitflow-jenkins',
            area: 'TI',
            title: 'DevOps: GitLab/Gitflow/Jenkins/Maven',
            detail: 'Visao integrada do commit ao deploy',
          },
          {
            id: 'w21-sat-legis-cnj-400-questoes',
            area: 'Legis',
            title: 'CNJ 400',
            detail: 'Questoes + resumo',
          },
          {
            id: 'w21-sat-evento-simulado-10',
            area: 'Evento',
            title: 'Simulado 10/18 (3h)',
            detail: 'Ao fim da semana: Simulados 10/18 | Redacoes 25/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 22,
    startDate: '2026-07-20',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w22-mon-ti-docker-compose',
            area: 'TI',
            title: 'Docker Compose: app + banco em containers',
            detail: 'Subir API + PostgreSQL com compose',
          },
          {
            id: 'w22-mon-pt-revisao-fcc',
            area: 'PT',
            title: 'Revisao FCC',
            detail: 'Crase, regencia, concordancia',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w22-tue-ti-h2-postgres',
            area: 'TI',
            title: 'Banco: H2 em testes/dev + comparacao com PostgreSQL',
            detail: 'Alternar perfil local com H2',
          },
          {
            id: 'w22-tue-rlm-simulado-tematico-50q',
            area: 'RLM',
            title: 'Simulado tematico (50Q)',
            detail: 'Tema mais fraco',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w22-wed-ti-linux-logs-journaling',
            area: 'TI',
            title: 'Linux/Logs: logs de sistema + journaling',
            detail: 'Pratica com journalctl',
          },
          {
            id: 'w22-wed-legis-14133-revisao',
            area: 'Legis',
            title: 'Revisao 14.133',
            detail: 'Questoes dirigidas',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w22-thu-ti-nginx-proxy-reverso',
            area: 'TI',
            title: 'Nginx (proxy reverso intro)',
            detail: 'Reverse proxy simples para app local',
          },
          {
            id: 'w22-thu-pt-redacao-checklist',
            area: 'PT',
            title: 'Redacao extra + checklist FCC',
            detail: 'Ultima redacao do bloco',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w22-fri-ti-redes-http-proxy-tls',
            area: 'TI',
            title: 'Redes: HTTP proxy, TLS/SSL',
            detail: 'Diferenciar HTTP x HTTPS x proxy reverso',
          },
          {
            id: 'w22-fri-rlm-problemas-mistos',
            area: 'RLM',
            title: 'Problemas mistos',
            detail: 'Nivel medio',
          },
        ],
      },
      {
        weekday: 6,
        hasRedacao: true,
        objectiveQuestions: 50,
        blocks: [
          {
            id: 'w22-sat-ti-prometheus-grafana',
            area: 'TI',
            title: 'Monitoramento: Prometheus + Grafana',
            detail: 'Painel local simples ou leitura guiada',
          },
          {
            id: 'w22-sat-legis-revisao-lgpd-improbidade-lbi',
            area: 'Legis',
            title: 'Revisao LGPD/Improbidade/LBI',
            detail: 'Questoes',
          },
          {
            id: 'w22-sat-evento-redacao-27',
            area: 'Evento',
            title: 'Redacao + 25Q PT + 25Q Legis',
            detail: 'Ao fim da semana: Simulados 10/18 | Redacoes 27/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 23,
    startDate: '2026-07-27',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w23-mon-ti-cloud-nist',
            area: 'TI',
            title: 'Cloud (NIST SP 800-145)',
            detail: 'IaaS/PaaS/SaaS + publica/privada/hibrida',
          },
          {
            id: 'w23-mon-pt-interpretacao-reescrita',
            area: 'PT',
            title: 'Interpretacao e reescrita FCC',
            detail: 'Pratica dirigida',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w23-tue-ti-ia-ml-intro',
            area: 'TI',
            title: 'IA/ML: supervisionado x nao supervisionado',
            detail: 'Classificar exemplos de problemas',
          },
          {
            id: 'w23-tue-rlm-deducao-alto',
            area: 'RLM',
            title: 'Deducao',
            detail: 'Nivel alto',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w23-wed-ti-abnt-27001-27002-27005',
            area: 'TI',
            title: 'Seguranca: ABNT 27001/27002/27005',
            detail: 'Mapa norma x objetivo',
          },
          {
            id: 'w23-wed-legis-revisao-regimento-cnj',
            area: 'Legis',
            title: 'Revisao Regimento TRT4 + CNJ 400',
            detail: 'Questoes dirigidas',
          },
        ],
      },
      {
        weekday: 4,
        blocks: [
          {
            id: 'w23-thu-ti-spring-swagger-jwt',
            area: 'TI',
            title: 'Spring/Swagger/JWT (revisao aplicada)',
            detail: 'Validar docs + auth da API',
          },
          {
            id: 'w23-thu-pt-bateria-sem-redacao',
            area: 'PT',
            title: 'Bateria FCC',
            detail: 'Sem redacao extra',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w23-fri-ti-redes-ospf-bgp',
            area: 'TI',
            title: 'Redes: OSPF e BGP',
            detail: 'Tabela comparativa + cenarios de uso',
          },
          {
            id: 'w23-fri-rlm-velocidade',
            area: 'RLM',
            title: 'Velocidade',
            detail: 'Bateria curta',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 0,
        hasSimulado: true,
        blocks: [
          {
            id: 'w23-sat-ti-logs-fluentd',
            area: 'TI',
            title: 'Logs/Fluentd no ecossistema',
            detail: 'Pipeline de logs (fluentd/ELK)',
          },
          {
            id: 'w23-sat-legis-revisao-geral',
            area: 'Legis',
            title: 'Revisao geral por questoes',
            detail: 'Fixacao',
          },
          {
            id: 'w23-sat-evento-simulado-11',
            area: 'Evento',
            title: 'Simulado 11/18 (3h)',
            detail: 'Ao fim da semana: Simulados 11/18 | Redacoes 27/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 24,
    startDate: '2026-08-03',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w24-mon-ti-erros-sim11-web-api-spring',
            area: 'TI',
            title: 'Erros do Simulado 11: Web/API/Spring',
            detail: 'Corrigir ponto real no projeto ancora',
          },
          {
            id: 'w24-mon-pt-erros-simulado',
            area: 'PT',
            title: 'Erros do simulado (FCC)',
            detail: 'Correcao dirigida',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w24-tue-ti-erros-sim11-sql',
            area: 'TI',
            title: 'Erros do Simulado 11: SQL/BD',
            detail: 'Refazer queries erradas',
          },
          {
            id: 'w24-tue-rlm-erros-simulado',
            area: 'RLM',
            title: 'Erros do simulado',
            detail: 'Correcao de gargalos',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w24-wed-ti-erros-sim11-linux-windows',
            area: 'TI',
            title: 'Erros do Simulado 11: Linux/Windows/SO',
            detail: 'Comandos e revisao de conceito',
          },
          {
            id: 'w24-wed-legis-lei-maior-erro',
            area: 'Legis',
            title: 'Lei com maior erro',
            detail: 'Questoes + lei seca',
          },
        ],
      },
      {
        weekday: 4,
        blocks: [
          {
            id: 'w24-thu-ti-erros-sim11-redes-seguranca',
            area: 'TI',
            title: 'Erros do Simulado 11: redes/seguranca',
            detail: 'Mapas comparativos + comandos',
          },
          {
            id: 'w24-thu-pt-reescrita-confronto',
            area: 'PT',
            title: 'Reescrita/confronto de frases',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w24-fri-ti-revisoes-curtas-de',
            area: 'TI',
            title: 'Revisoes curtas: topicos D/E',
            detail: '1 microlab por topico',
          },
          {
            id: 'w24-fri-rlm-bateria-mista',
            area: 'RLM',
            title: 'Bateria mista',
            detail: 'Foco em tempo',
          },
        ],
      },
      {
        weekday: 6,
        blocks: [
          {
            id: 'w24-sat-ti-observabilidade-devops',
            area: 'TI',
            title: 'Observabilidade/DevOps revisao',
            detail: 'Compose/nginx/logs mini revisao',
          },
          {
            id: 'w24-sat-legis-revisao-14133-lgpd-improbidade',
            area: 'Legis',
            title: 'Revisao 14.133/LGPD/Improbidade',
            detail: 'Fixacao por questoes',
          },
          {
            id: 'w24-sat-evento-revisao-geral',
            area: 'Evento',
            title: 'Revisao geral (3h)',
            detail: 'Sem simulado e sem redacao (intencional)',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 25,
    startDate: '2026-08-10',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w25-mon-ti-ia-ml-preprocessamento',
            area: 'TI',
            title: 'IA/ML: preprocessamento estruturado x nao estruturado',
            detail: 'Listar tecnicas e quando usar',
          },
          {
            id: 'w25-mon-pt-interpretacao-argumentacao',
            area: 'PT',
            title: 'Interpretacao avancada + argumentacao',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w25-tue-ti-ia-ml-overfitting-metricas',
            area: 'TI',
            title: 'IA/ML: overfitting + metricas + ROC',
            detail: 'Interpretar matriz de confusao/ROC',
          },
          {
            id: 'w25-tue-rlm-deducao-tabelas',
            area: 'RLM',
            title: 'Deducao/tabelas',
            detail: 'Nivel medio-alto',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w25-wed-ti-storage-raid-smb-nfs-s3',
            area: 'TI',
            title: 'Storage: RAID, SMB, NFS, bloco x objeto (S3)',
            detail: 'Quadro comparativo',
          },
          {
            id: 'w25-wed-legis-revisao-final-bloco',
            area: 'Legis',
            title: 'Revisao final do bloco',
            detail: 'Questoes dirigidas',
          },
        ],
      },
      {
        weekday: 4,
        blocks: [
          {
            id: 'w25-thu-ti-seguranca-cis-abnt',
            area: 'TI',
            title: 'CIS Controls v8 + ABNT 22301/27035-3',
            detail: 'Mapa framework x foco',
          },
          {
            id: 'w25-thu-pt-bateria-sem-redacao',
            area: 'PT',
            title: 'Bateria FCC',
            detail: 'Sem redacao extra',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w25-fri-ti-redes-qos-snmp-icmp-syslog',
            area: 'TI',
            title: 'Redes: QoS, SNMP, ICMP, Syslog',
            detail: 'Revisao integrada',
          },
          {
            id: 'w25-fri-rlm-simulado-tematico',
            area: 'RLM',
            title: 'Simulado tematico',
            detail: 'Treino de ritmo',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 0,
        hasSimulado: true,
        blocks: [
          {
            id: 'w25-sat-ti-devops-secops-k8s-rancher',
            area: 'TI',
            title: 'DevOps/SecOps: Kubernetes + Rancher (visao)',
            detail: 'Objetos basicos sem deploy complexo',
          },
          {
            id: 'w25-sat-legis-lei-seca-revisao-erros',
            area: 'Legis',
            title: 'Lei seca + revisao de erros',
            detail: 'Fechamento da semana',
          },
          {
            id: 'w25-sat-evento-simulado-12',
            area: 'Evento',
            title: 'Simulado 12/18 (3h)',
            detail: 'Ao fim da semana: Simulados 12/18 | Redacoes 27/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 26,
    startDate: '2026-08-17',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w26-mon-ti-pos-sim12-web-java-bd',
            area: 'TI',
            title: 'Pos-Simulado 12: erros em Web/Java/BD',
            detail: 'Corrigir 1 bug + 1 endpoint + 1 query',
          },
          {
            id: 'w26-mon-pt-principais-erros',
            area: 'PT',
            title: 'Principais erros FCC',
            detail: 'Correcao dirigida',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w26-tue-ti-pos-sim12-redes-seguranca-devops',
            area: 'TI',
            title: 'Pos-Simulado 12: redes/seguranca/devops',
            detail: 'Mapa final de conceitos confusos',
          },
          {
            id: 'w26-tue-rlm-principais-erros',
            area: 'RLM',
            title: 'Principais erros',
            detail: 'Revisao final',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w26-wed-ti-so-storage-linux',
            area: 'TI',
            title: 'SO/Storage/Linux: revisao consolidada',
            detail: 'Comandos + comparativos',
          },
          {
            id: 'w26-wed-legis-leis-mais-erradas',
            area: 'Legis',
            title: 'Leis mais erradas',
            detail: 'Rodada final do bloco',
          },
        ],
      },
      {
        weekday: 4,
        blocks: [
          {
            id: 'w26-thu-ti-revisao-projetos-ancora',
            area: 'TI',
            title: 'Revisao de projetos ancora (Front/API/Infra)',
            detail: 'Checklist do que cobre do edital',
          },
          {
            id: 'w26-thu-pt-reescrita-confronto',
            area: 'PT',
            title: 'Reescrita + confronto de frases',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w26-fri-ti-revisao-notas-de',
            area: 'TI',
            title: 'Revisao por notas A-E (foco D/E)',
            detail: 'Microlab de 20 min no pior topico',
          },
          {
            id: 'w26-fri-rlm-bateria-mista-velocidade',
            area: 'RLM',
            title: 'Bateria mista de velocidade',
            detail: 'Consolidacao',
          },
        ],
      },
      {
        weekday: 6,
        blocks: [
          {
            id: 'w26-sat-ti-revisao-geral-cards',
            area: 'TI',
            title: 'Revisao geral (cards + questoes dos topicos fracos)',
            detail: 'Pratica leve de fixacao',
          },
          {
            id: 'w26-sat-legis-revisao-geral',
            area: 'Legis',
            title: 'Revisao geral',
            detail: 'Questoes + lei seca',
          },
          {
            id: 'w26-sat-evento-planejamento',
            area: 'Evento',
            title: 'Revisao/planejamento do bloco seguinte (3h)',
            detail: 'Sem simulado e sem redacao (intencional)',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 27,
    startDate: '2026-08-24',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w27-mon-ti-storage-raid-s3-smb-nfs',
            area: 'TI',
            title: 'Storage: RAID, bloco x objeto (S3), SMB x NFS',
            detail: 'Quadro comparativo + cenarios de uso',
          },
          {
            id: 'w27-mon-pt-interpretacao-reescrita',
            area: 'PT (FCC)',
            title: 'Interpretacao + reescrita',
            detail: 'Treino de prova',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w27-tue-ti-seguranca-firewall-ids-ips-siem',
            area: 'TI',
            title: 'Seguranca: firewall, IDS, IPS, SIEM',
            detail: 'Mapa camada/funcao/exemplo',
          },
          {
            id: 'w27-tue-rlm-deducao-medio-alto',
            area: 'RLM',
            title: 'Deducao logica',
            detail: 'Nivel medio-alto',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w27-wed-ti-linux-filesystem-inodes-links',
            area: 'TI',
            title: 'Linux/SO: filesystem, inodes, links, fragmentacao, journaling',
            detail: 'ls -i, hardlink/symlink e observacao',
          },
          {
            id: 'w27-wed-legis-14133-pegadinhas',
            area: 'Legis',
            title: 'Lei 14.133 (questoes dirigidas)',
            detail: 'Foco em pegadinhas',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w27-thu-ti-java-spring-revisao-aplicada',
            area: 'TI',
            title: 'Java/Spring revisao: DTO/Entity/JPA/Testes',
            detail: 'Checklist no projeto ancora API',
          },
          {
            id: 'w27-thu-pt-redacao-28',
            area: 'PT',
            title: 'Redacao extra 28/38',
            detail: 'Redacao curta + checklist FCC',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w27-fri-ti-redes-pacote-fcc',
            area: 'TI',
            title: 'Redes: LDAP, DNS, DHCP, NTP, SMTP, Syslog',
            detail: 'Mapa protocolo x funcao x porta x cenario',
          },
          {
            id: 'w27-fri-rlm-velocidade-mista',
            area: 'RLM',
            title: 'Velocidade',
            detail: 'Bateria mista',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 0,
        hasSimulado: true,
        blocks: [
          {
            id: 'w27-sat-ti-devops-secops-oauth2-keycloak',
            area: 'TI',
            title: 'DevOps/SecOps: OAuth2, SSO, Keycloak (visao de prova)',
            detail: 'Desenhar fluxo OAuth2 authorization code',
          },
          {
            id: 'w27-sat-legis-lgpd-improbidade',
            area: 'Legis',
            title: 'LGPD + Improbidade',
            detail: 'Questoes dirigidas',
          },
          {
            id: 'w27-sat-evento-simulado-13',
            area: 'Evento',
            title: 'Simulado 13/18 (3h)',
            detail: 'Placar: Simulados 13/18 | Redacoes 28/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 28,
    startDate: '2026-08-31',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w28-mon-ti-pos-sim-web-api-spring',
            area: 'TI',
            title: 'Pos-simulado: erros em Web/API/Spring',
            detail: 'Corrigir 1 endpoint, 1 validacao, 1 teste',
          },
          {
            id: 'w28-mon-pt-erros-simulado',
            area: 'PT',
            title: 'Erros do simulado',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w28-tue-ti-pos-sim-sql-bd',
            area: 'TI',
            title: 'Pos-simulado: erros em SQL/BD',
            detail: 'Refazer queries erradas',
          },
          {
            id: 'w28-tue-rlm-erros-simulado',
            area: 'RLM',
            title: 'Erros do simulado',
            detail: 'Ajuste de padrao',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w28-wed-ti-pos-sim-redes-so-linux',
            area: 'TI',
            title: 'Pos-simulado: erros em Redes/SO/Linux',
            detail: 'Comandos e mapas de confusao',
          },
          {
            id: 'w28-wed-legis-lei-mais-errada',
            area: 'Legis',
            title: 'Lei mais errada do simulado',
            detail: 'Lei seca + questoes',
          },
        ],
      },
      {
        weekday: 4,
        blocks: [
          {
            id: 'w28-thu-ti-observabilidade-zabbix-prometheus',
            area: 'TI',
            title: 'Observabilidade: Zabbix, Prometheus, Grafana, Kibana, Fluentd',
            detail: 'Fluxo coleta -> armazenamento -> visualizacao',
          },
          {
            id: 'w28-thu-pt-confronto-reescrita',
            area: 'PT',
            title: 'Confronto de frases + reescrita',
            detail: 'Treino FCC',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w28-fri-ti-ia-ml-supervisionado',
            area: 'TI',
            title: 'IA/ML: supervisionado x nao supervisionado',
            detail: 'Classificar problemas',
          },
          {
            id: 'w28-fri-rlm-tabelas-condicoes',
            area: 'RLM',
            title: 'Tabelas e condicoes',
            detail: 'Treino intermediario',
          },
        ],
      },
      {
        weekday: 6,
        hasRedacao: true,
        objectiveQuestions: 50,
        blocks: [
          {
            id: 'w28-sat-ti-ia-ml-overfitting-metricas-roc',
            area: 'TI',
            title: 'IA/ML: overfitting + metricas + ROC',
            detail: 'Matriz de confusao e ROC em exemplo',
          },
          {
            id: 'w28-sat-legis-cnj400-regimento-trt4',
            area: 'Legis',
            title: 'CNJ 400 + Regimento TRT4',
            detail: 'Questoes dirigidas',
          },
          {
            id: 'w28-sat-evento-redacao-29',
            area: 'Evento',
            title: 'Redacao 29/38 + PT + Legis',
            detail: 'Placar: Simulados 13/18 | Redacoes 29/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 29,
    startDate: '2026-09-07',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w29-mon-ti-seguranca-nist-ssdf-owasp',
            area: 'TI',
            title: 'Seguranca: NIST SSDF + OWASP',
            detail: 'Checklist de seguranca no projeto API',
          },
          {
            id: 'w29-mon-pt-pontuacao',
            area: 'PT',
            title: 'Pontuacao',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w29-tue-ti-abnt-cis-v8',
            area: 'TI',
            title: 'ABNT 27001/27002/27005/27035-3/22301 + CIS v8',
            detail: 'Mapa framework x foco',
          },
          {
            id: 'w29-tue-rlm-problemas-mistos-tempo',
            area: 'RLM',
            title: 'Problemas mistos',
            detail: 'Foco em tempo',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w29-wed-ti-redes-ospf-bgp',
            area: 'TI',
            title: 'Redes: OSPF e BGP',
            detail: 'Quadro comparativo + cenarios',
          },
          {
            id: 'w29-wed-legis-lbi-revisao',
            area: 'Legis',
            title: 'LBI',
            detail: 'Questoes e revisao',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w29-thu-ti-docker-nginx-proxy-ssl',
            area: 'TI',
            title: 'Docker/Nginx: proxy reverso + SSL offloading + balanceamento',
            detail: 'Nginx reverso local (sem TLS complexo)',
          },
          {
            id: 'w29-thu-pt-redacao-30',
            area: 'PT',
            title: 'Redacao extra 30/38',
            detail: 'Pratica de prova',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w29-fri-ti-cloud-nist-800-145',
            area: 'TI',
            title: 'Cloud: NIST SP 800-145',
            detail: 'Tabela IaaS/PaaS/SaaS + exemplos',
          },
          {
            id: 'w29-fri-rlm-deducao-alta',
            area: 'RLM',
            title: 'Deducao',
            detail: 'Nivel alto',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 0,
        hasSimulado: true,
        blocks: [
          {
            id: 'w29-sat-ti-kubernetes-rancher-visao',
            area: 'TI',
            title: 'Kubernetes/Rancher: objetos essenciais e papeis',
            detail: 'Mapa mental pod/deployment/service',
          },
          {
            id: 'w29-sat-legis-9784-8112',
            area: 'Legis',
            title: 'Revisao 9.784 + 8.112',
            detail: 'Questoes dirigidas',
          },
          {
            id: 'w29-sat-evento-simulado-14',
            area: 'Evento',
            title: 'Simulado 14/18 (3h)',
            detail: 'Placar: Simulados 14/18 | Redacoes 30/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 30,
    startDate: '2026-09-14',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w30-mon-ti-pos-sim-web-seguranca',
            area: 'TI',
            title: 'Pos-simulado: erros Web/Seguranca',
            detail: 'Corrigir 1 ponto no projeto + revisar OWASP',
          },
          {
            id: 'w30-mon-pt-erros-simulado',
            area: 'PT',
            title: 'Erros do simulado',
            detail: 'Reforco dirigido',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w30-tue-ti-pos-sim-banco-sql',
            area: 'TI',
            title: 'Pos-simulado: erros Banco/SQL',
            detail: 'Refazer 5 queries criticas',
          },
          {
            id: 'w30-tue-rlm-erros-simulado',
            area: 'RLM',
            title: 'Erros do simulado',
            detail: 'Correcao de padrao',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w30-wed-ti-pos-sim-redes-infra-so',
            area: 'TI',
            title: 'Pos-simulado: erros redes/infra/SO',
            detail: 'Mapas de comparacao',
          },
          {
            id: 'w30-wed-legis-lei-mais-errada',
            area: 'Legis',
            title: 'Lei mais errada',
            detail: 'Foco em artigos',
          },
        ],
      },
      {
        weekday: 4,
        blocks: [
          {
            id: 'w30-thu-ti-testes-junit-mockito-lapidacao',
            area: 'TI',
            title: 'Testes/JUnit/Mockito (lapidacao)',
            detail: '1 teste unitario + 1 mock com verify',
          },
          {
            id: 'w30-thu-pt-regencia-crase',
            area: 'PT',
            title: 'Regencia + crase',
            detail: 'Bateria FCC',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w30-fri-ti-sql-modelagem-revisao',
            area: 'TI',
            title: 'SQL + modelagem (revisao)',
            detail: 'Mini schema + constraints + JOIN',
          },
          {
            id: 'w30-fri-rlm-simulado-tematico-50q',
            area: 'RLM',
            title: 'Simulado tematico',
            detail: '50Q no pior tema',
          },
        ],
      },
      {
        weekday: 6,
        hasRedacao: true,
        objectiveQuestions: 50,
        blocks: [
          {
            id: 'w30-sat-ti-revisao-painel-ae-topicos-e',
            area: 'TI',
            title: 'Revisao por painel A-E',
            detail: 'Atacar 2 topicos E com 1 microlab por topico',
          },
          {
            id: 'w30-sat-legis-14133-lgpd-questoes',
            area: 'Legis',
            title: '14.133 + LGPD',
            detail: 'Questoes dirigidas',
          },
          {
            id: 'w30-sat-evento-redacao-31',
            area: 'Evento',
            title: 'Redacao 31/38 + PT + Legis',
            detail: 'Placar: Simulados 14/18 | Redacoes 31/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 31,
    startDate: '2026-09-21',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w31-mon-ti-front-rest-revisao',
            area: 'TI',
            title: 'Front/REST revisao: HTML/CSS/JS/TS/JSON/HTTP',
            detail: 'Mini tela consumindo API + tratamento de erro',
          },
          {
            id: 'w31-mon-pt-interpretacao-coesao',
            area: 'PT',
            title: 'Interpretacao e coesao',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w31-tue-ti-java-spring-revisao',
            area: 'TI',
            title: 'Java/Spring revisao: camadas, validacao, REST, Swagger, JWT',
            detail: 'Checklist do projeto API',
          },
          {
            id: 'w31-tue-rlm-deducao-tabelas',
            area: 'RLM',
            title: 'Deducao e tabelas',
            detail: 'Treino medio',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w31-wed-ti-banco-sql-jpa-hibernate-h2',
            area: 'TI',
            title: 'Banco revisao: SQL/JPA/Hibernate/H2',
            detail: 'Refazer consultas e relacionamentos',
          },
          {
            id: 'w31-wed-legis-revisao-geral-mista',
            area: 'Legis',
            title: 'Revisao geral',
            detail: 'Questoes mistas',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w31-thu-ti-redes-revisao-fcc',
            area: 'TI',
            title: 'Redes revisao: TCP/IP, DNS/DHCP, ICMP, SNMP, LDAP',
            detail: 'Mapa FCC: o que e / para que serve',
          },
          {
            id: 'w31-thu-pt-redacao-32',
            area: 'PT',
            title: 'Redacao extra 32/38',
            detail: 'Pratica dirigida',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w31-fri-ti-linux-docker-nginx-revisao',
            area: 'TI',
            title: 'Linux/Docker/Nginx revisao',
            detail: 'Subir compose + proxy reverso simples',
          },
          {
            id: 'w31-fri-rlm-velocidade',
            area: 'RLM',
            title: 'Velocidade',
            detail: 'Bateria mista',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 0,
        hasSimulado: true,
        blocks: [
          {
            id: 'w31-sat-ti-seguranca-observabilidade-revisao',
            area: 'TI',
            title: 'Seguranca/Observabilidade revisao',
            detail: 'Fluxo de logs + checklist de seguranca',
          },
          {
            id: 'w31-sat-legis-8112-9784',
            area: 'Legis',
            title: '8.112 + 9.784',
            detail: 'Questoes dirigidas',
          },
          {
            id: 'w31-sat-evento-simulado-15',
            area: 'Evento',
            title: 'Simulado 15/18 (3h)',
            detail: 'Placar: Simulados 15/18 | Redacoes 32/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 32,
    startDate: '2026-09-28',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w32-mon-ti-pos-sim-cluster-1',
            area: 'TI',
            title: 'Pos-simulado: erros TI (cluster 1)',
            detail: 'Corrigir conceitos no projeto',
          },
          {
            id: 'w32-mon-pt-erros-simulado',
            area: 'PT',
            title: 'Erros do simulado',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w32-tue-ti-pos-sim-cluster-2',
            area: 'TI',
            title: 'Pos-simulado: erros TI (cluster 2)',
            detail: 'Queries e comandos',
          },
          {
            id: 'w32-tue-rlm-erros-simulado',
            area: 'RLM',
            title: 'Erros do simulado',
            detail: 'Revisao dirigida',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w32-wed-ti-pos-sim-cluster-3',
            area: 'TI',
            title: 'Pos-simulado: erros TI (cluster 3)',
            detail: 'Mapas comparativos',
          },
          {
            id: 'w32-wed-legis-lei-mais-errada',
            area: 'Legis',
            title: 'Lei mais errada do simulado',
            detail: 'Lei seca + questoes',
          },
        ],
      },
      {
        weekday: 4,
        blocks: [
          {
            id: 'w32-thu-ti-ia-ml-revisao-final',
            area: 'TI',
            title: 'IA/ML revisao final de prova',
            detail: 'Flashcards + metricas/ROC',
          },
          {
            id: 'w32-thu-pt-confronto-reescrita',
            area: 'PT',
            title: 'Confronto de frases + reescrita',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w32-fri-ti-storage-san',
            area: 'TI',
            title: 'Storage/SAN: zoning, fabric, ISL, NPIV, Fibre Channel',
            detail: 'Quadro comparativo sem aprofundar demais',
          },
          {
            id: 'w32-fri-rlm-problemas-mistos',
            area: 'RLM',
            title: 'Problemas mistos',
            detail: 'Treino em tempo',
          },
        ],
      },
      {
        weekday: 6,
        hasRedacao: true,
        objectiveQuestions: 50,
        blocks: [
          {
            id: 'w32-sat-ti-backup-tape-vtl',
            area: 'TI',
            title: 'Backup/Tape/VTL + recuperacao (visao)',
            detail: 'Mapa de quando usar cada um',
          },
          {
            id: 'w32-sat-legis-lgpd-improbidade',
            area: 'Legis',
            title: 'LGPD + Improbidade',
            detail: 'Questoes dirigidas',
          },
          {
            id: 'w32-sat-evento-redacao-33',
            area: 'Evento',
            title: 'Redacao 33/38 + PT + Legis',
            detail: 'Placar: Simulados 15/18 | Redacoes 33/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 33,
    startDate: '2026-10-05',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w33-mon-ti-java-testes-reforco',
            area: 'TI',
            title: 'Java/Testes (reforco fino)',
            detail: 'Mockito + JUnit em service',
          },
          {
            id: 'w33-mon-pt-pontuacao-coordenacao-subordinacao',
            area: 'PT',
            title: 'Pontuacao/coord./subord.',
            detail: 'Treino FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w33-tue-ti-spring-cloud-visao',
            area: 'TI',
            title: 'Spring Cloud: Eureka, Zuul, microservices',
            detail: 'Mapa servico x funcao',
          },
          {
            id: 'w33-tue-rlm-deducao-alto',
            area: 'RLM',
            title: 'Deducao',
            detail: 'Nivel alto',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w33-wed-ti-seguranca-infra-vpn-pam-ztna',
            area: 'TI',
            title: 'Seguranca infra: VPN, PAM, ZTNA, webproxy, NGAV',
            detail: 'Quadro comparativo por funcao',
          },
          {
            id: 'w33-wed-legis-regimento-cnj400',
            area: 'Legis',
            title: 'Regimento TRT4 + CNJ 400',
            detail: 'Questoes dirigidas',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w33-thu-ti-revisao-painel-de-peso',
            area: 'TI',
            title: 'Revisao por painel A-E: 2 topicos D/E de maior peso',
            detail: '2 microlabs',
          },
          {
            id: 'w33-thu-pt-redacao-34',
            area: 'PT',
            title: 'Redacao extra 34/38',
            detail: 'Pratica dirigida',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w33-fri-ti-redes-roteamento-gerencia',
            area: 'TI',
            title: 'Redes: OSPF/BGP/SNMP/QoS revisao',
            detail: 'Mapas e cenarios',
          },
          {
            id: 'w33-fri-rlm-simulado-tematico',
            area: 'RLM',
            title: 'Simulado tematico',
            detail: '50Q',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 0,
        hasSimulado: true,
        blocks: [
          {
            id: 'w33-sat-ti-devops-cicd-revisao',
            area: 'TI',
            title: 'DevOps/CI-CD revisao: Jenkins, GitLab, Gitflow, Maven',
            detail: 'Pipeline mental + comandos git',
          },
          {
            id: 'w33-sat-legis-14133-rodada-final',
            area: 'Legis',
            title: 'Lei 14.133',
            detail: 'Rodada final de questoes',
          },
          {
            id: 'w33-sat-evento-simulado-16',
            area: 'Evento',
            title: 'Simulado 16/18 (3h)',
            detail: 'Placar: Simulados 16/18 | Redacoes 34/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 34,
    startDate: '2026-10-12',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w34-mon-ti-pos-sim-cluster-1',
            area: 'TI',
            title: 'Pos-simulado: erros TI (cluster 1)',
            detail: 'Corrigir 1 lab, 1 query, 1 mapa',
          },
          {
            id: 'w34-mon-pt-erros-simulado',
            area: 'PT',
            title: 'Erros do simulado',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w34-tue-ti-pos-sim-cluster-2',
            area: 'TI',
            title: 'Pos-simulado: erros TI (cluster 2)',
            detail: 'Projeto API/infra',
          },
          {
            id: 'w34-tue-rlm-erros-simulado',
            area: 'RLM',
            title: 'Erros do simulado',
            detail: 'Correcao dirigida',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w34-wed-ti-pos-sim-cluster-3',
            area: 'TI',
            title: 'Pos-simulado: erros TI (cluster 3)',
            detail: 'Redes e Linux',
          },
          {
            id: 'w34-wed-legis-lei-mais-errada',
            area: 'Legis',
            title: 'Lei mais errada do simulado',
            detail: 'Lei seca + questoes',
          },
        ],
      },
      {
        weekday: 4,
        blocks: [
          {
            id: 'w34-thu-ti-revisao-curta-web-java-sql',
            area: 'TI',
            title: 'Revisao curta: Web + Java + SQL',
            detail: 'So pontos fracos + checklist dos 3 projetos ancora',
          },
          {
            id: 'w34-thu-pt-bateria-sem-redacao',
            area: 'PT',
            title: 'Bateria FCC',
            detail: 'Sem redacao extra',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w34-fri-ti-seguranca-governanca-fcc',
            area: 'TI',
            title: 'Seguranca/Governanca: ITIL, COBIT, Metodos Ageis',
            detail: 'Quadro comparativo rapido',
          },
          {
            id: 'w34-fri-rlm-velocidade',
            area: 'RLM',
            title: 'Velocidade',
            detail: 'Bateria curta',
          },
        ],
      },
      {
        weekday: 6,
        hasRedacao: true,
        objectiveQuestions: 50,
        blocks: [
          {
            id: 'w34-sat-ti-ingles-tecnico',
            area: 'TI',
            title: 'Ingles tecnico (pratico)',
            detail: 'Glossario de termos recorrentes',
          },
          {
            id: 'w34-sat-legis-revisao-geral-mista',
            area: 'Legis',
            title: 'Revisao geral mista',
            detail: 'Questoes finais',
          },
          {
            id: 'w34-sat-evento-redacao-35',
            area: 'Evento',
            title: 'Redacao 35/38 + PT + Legis',
            detail: 'Placar: Simulados 16/18 | Redacoes 35/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 35,
    startDate: '2026-10-19',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w35-mon-ti-revisao-peso-seguranca-redes',
            area: 'TI',
            title: 'Revisao por peso: Seguranca + Redes (D/E)',
            detail: 'Mapas comparativos',
          },
          {
            id: 'w35-mon-pt-interpretacao-reescrita',
            area: 'PT',
            title: 'Interpretacao + reescrita',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w35-tue-ti-revisao-peso-java-spring-sql',
            area: 'TI',
            title: 'Revisao por peso: Java/Spring/SQL (D/E)',
            detail: 'API + queries + teste',
          },
          {
            id: 'w35-tue-rlm-deducao-tabelas',
            area: 'RLM',
            title: 'Deducao e tabelas',
            detail: 'Treino intermediario',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w35-wed-ti-revisao-peso-so-linux-docker-nginx',
            area: 'TI',
            title: 'Revisao por peso: SO/Linux/Docker/Nginx',
            detail: 'Compose + comandos + logs',
          },
          {
            id: 'w35-wed-legis-8112-9784',
            area: 'Legis',
            title: '8.112 + 9.784',
            detail: 'Questoes dirigidas',
          },
        ],
      },
      {
        weekday: 4,
        objectiveQuestions: 40,
        hasRedacao: true,
        blocks: [
          {
            id: 'w35-thu-ti-revisao-painel-piores',
            area: 'TI',
            title: 'Revisao por painel A-E: 2 piores topicos',
            detail: '2 microlabs',
          },
          {
            id: 'w35-thu-pt-redacao-36',
            area: 'PT',
            title: 'Redacao extra 36/38',
            detail: 'Pratica dirigida',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w35-fri-ti-bateria-fcc-especificos',
            area: 'TI',
            title: 'Bateria FCC de especificos',
            detail: 'Questoes e correcao',
          },
          {
            id: 'w35-fri-rlm-simulado-tematico',
            area: 'RLM',
            title: 'Simulado tematico',
            detail: 'Treino final',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 0,
        hasSimulado: true,
        blocks: [
          {
            id: 'w35-sat-ti-revisao-leve-erros-semana',
            area: 'TI',
            title: 'Revisao leve',
            detail: 'Erros da semana',
          },
          {
            id: 'w35-sat-legis-14133-lgpd-improbidade',
            area: 'Legis',
            title: '14.133/LGPD/Improbidade',
            detail: 'Rodada final',
          },
          {
            id: 'w35-sat-evento-simulado-17',
            area: 'Evento',
            title: 'Simulado 17/18 (3h)',
            detail: 'Placar: Simulados 17/18 | Redacoes 36/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 36,
    startDate: '2026-10-26',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w36-mon-ti-pos-sim-erros-graves',
            area: 'TI',
            title: 'Pos-simulado: erros mais graves',
            detail: 'Corrigir no projeto/command line',
          },
          {
            id: 'w36-mon-pt-erros-simulado',
            area: 'PT',
            title: 'Erros do simulado',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w36-tue-ti-pos-sim-erros-medios',
            area: 'TI',
            title: 'Pos-simulado: erros medios recorrentes',
            detail: 'Mapas + flashcards',
          },
          {
            id: 'w36-tue-rlm-erros-simulado',
            area: 'RLM',
            title: 'Erros do simulado',
            detail: 'Treino dirigido',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w36-wed-ti-pos-sim-infra-seguranca',
            area: 'TI',
            title: 'Pos-simulado: erros conceituais de infra/seguranca',
            detail: 'Quadro comparativo',
          },
          {
            id: 'w36-wed-legis-lei-mais-errada',
            area: 'Legis',
            title: 'Lei mais errada do simulado',
            detail: 'Questoes + lei seca',
          },
        ],
      },
      {
        weekday: 4,
        blocks: [
          {
            id: 'w36-thu-ti-revisao-ultra-direcionada-de',
            area: 'TI',
            title: 'Revisao ultra direcionada (D/E)',
            detail: '1 microlab',
          },
          {
            id: 'w36-thu-pt-bateria-sem-redacao',
            area: 'PT',
            title: 'Bateria FCC',
            detail: 'Sem redacao extra',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w36-fri-ti-questoes-especificos-misto',
            area: 'TI',
            title: 'Questoes de especificos (misto)',
            detail: 'Pratica leve',
          },
          {
            id: 'w36-fri-rlm-velocidade',
            area: 'RLM',
            title: 'Velocidade',
            detail: 'Bateria curta',
          },
        ],
      },
      {
        weekday: 6,
        hasRedacao: true,
        objectiveQuestions: 50,
        blocks: [
          {
            id: 'w36-sat-ti-ingles-tecnico-glossario',
            area: 'TI',
            title: 'Revisao de ingles tecnico + glossario',
            detail: 'Leitura curta de doc/API',
          },
          {
            id: 'w36-sat-legis-revisao-mista-erros',
            area: 'Legis',
            title: 'Revisao mista por erros',
            detail: 'Consolidacao',
          },
          {
            id: 'w36-sat-evento-redacao-37',
            area: 'Evento',
            title: 'Redacao 37/38 + PT + Legis',
            detail: 'Placar: Simulados 17/18 | Redacoes 37/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 37,
    startDate: '2026-11-02',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w37-mon-ti-revisao-final-web-api',
            area: 'TI',
            title: 'Revisao final de Web/API',
            detail: 'Testar endpoints e status codes',
          },
          {
            id: 'w37-mon-pt-pontuacao-regencia-crase',
            area: 'PT',
            title: 'Pontuacao, regencia e crase',
            detail: 'Bateria FCC',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w37-tue-ti-revisao-final-banco-sql-jpa',
            area: 'TI',
            title: 'Revisao final Banco/SQL/JPA',
            detail: 'Queries + relacionamentos',
          },
          {
            id: 'w37-tue-rlm-deducao-tabelas',
            area: 'RLM',
            title: 'Deducao e tabelas',
            detail: 'Treino final',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w37-wed-ti-revisao-final-redes-seguranca',
            area: 'TI',
            title: 'Revisao final Redes/Seguranca',
            detail: 'Mapas comparativos',
          },
          {
            id: 'w37-wed-legis-revisao-lei-seca-final',
            area: 'Legis',
            title: 'Revisao final lei seca (8.112/9.784/LGPD/14.133)',
            detail: 'Artigos-chave',
          },
        ],
      },
      {
        weekday: 4,
        blocks: [
          {
            id: 'w37-thu-ti-revisao-final-linux-docker-obs',
            area: 'TI',
            title: 'Revisao final Linux/Docker/Obs',
            detail: 'Comandos-chave',
          },
          {
            id: 'w37-thu-pt-confronto-reescrita',
            area: 'PT',
            title: 'Confronto de frases e reescrita',
            detail: 'FCC',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w37-fri-ti-questoes-mistas-final',
            area: 'TI',
            title: 'Questoes mistas de especificos',
            detail: 'Bloco final',
          },
          {
            id: 'w37-fri-rlm-simulado-curto',
            area: 'RLM',
            title: 'Simulado tematico curto',
            detail: 'Ritmo final',
          },
        ],
      },
      {
        weekday: 6,
        objectiveQuestions: 0,
        hasSimulado: true,
        blocks: [
          {
            id: 'w37-sat-ti-revisao-caderno-erros',
            area: 'TI',
            title: 'Revisao por caderno de erros',
            detail: 'Sem expandir conteudo',
          },
          {
            id: 'w37-sat-legis-questoes-mistas-finais',
            area: 'Legis',
            title: 'Questoes mistas finais',
            detail: 'Fechamento',
          },
          {
            id: 'w37-sat-evento-simulado-18',
            area: 'Evento',
            title: 'Simulado 18/18 (3h)',
            detail: 'Placar: Simulados 18/18 | Redacoes 37/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 38,
    startDate: '2026-11-09',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w38-mon-ti-pos-sim18-erros-relevantes',
            area: 'TI',
            title: 'Pos-simulado 18: erros relevantes/recorrentes',
            detail: 'Ajustes finais em mapas/checklists',
          },
          {
            id: 'w38-mon-pt-erros-simulado',
            area: 'PT',
            title: 'Erros do simulado',
            detail: 'Correcao dirigida',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w38-tue-ti-revisao-painel-ultimas-rodadas',
            area: 'TI',
            title: 'Revisao por painel A-E: 2 piores topicos',
            detail: 'Ultima rodada com microlab',
          },
          {
            id: 'w38-tue-rlm-erros-simulado',
            area: 'RLM',
            title: 'Erros do simulado',
            detail: 'Consolidacao',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w38-wed-ti-revisao-alto-peso',
            area: 'TI',
            title: 'Revisao de alto peso: seguranca/redes/banco',
            detail: 'Ajuste final',
          },
          {
            id: 'w38-wed-legis-lei-seca-final',
            area: 'Legis',
            title: 'Lei seca final',
            detail: 'Artigos-chave, prazos e excecoes',
          },
        ],
      },
      {
        weekday: 4,
        blocks: [
          {
            id: 'w38-thu-ti-revisao-curta-cards-questoes',
            area: 'TI',
            title: 'Revisao curta (cards + questoes erradas)',
            detail: 'Sem expansao',
          },
          {
            id: 'w38-thu-pt-bateria-leve',
            area: 'PT',
            title: 'Bateria FCC leve',
            detail: 'Manutencao',
          },
        ],
      },
      {
        weekday: 5,
        blocks: [
          {
            id: 'w38-fri-ti-questoes-leves-confianca',
            area: 'TI',
            title: 'Questoes leves + confianca',
            detail: 'Sem forcar',
          },
          {
            id: 'w38-fri-rlm-velocidade-leve',
            area: 'RLM',
            title: 'Velocidade leve',
            detail: 'Aquecimento',
          },
        ],
      },
      {
        weekday: 6,
        hasRedacao: true,
        objectiveQuestions: 50,
        blocks: [
          {
            id: 'w38-sat-ti-revisao-leve-sem-novidade',
            area: 'TI',
            title: 'Revisao leve (sem novidade)',
            detail: 'Manutencao final',
          },
          {
            id: 'w38-sat-legis-revisao-leve',
            area: 'Legis',
            title: 'Revisao leve (sem forcar)',
            detail: 'Fixacao',
          },
          {
            id: 'w38-sat-evento-redacao-38',
            area: 'Evento',
            title: 'Redacao 38/38 + PT + Legis leve',
            detail: 'Placar: Simulados 18/18 | Redacoes 38/38',
            movedFromSunday: true,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 39,
    startDate: '2026-11-16',
    days: [
      {
        weekday: 1,
        blocks: [
          {
            id: 'w39-mon-ti-revisao-ultra-leve-erros',
            area: 'TI',
            title: 'Revisao ultra leve: caderno de erros (20-30 itens)',
            detail: 'Mapas de comparacao + confianca',
          },
          {
            id: 'w39-mon-pt-20-30-questoes-leves',
            area: 'PT',
            title: '20-30 questoes leves de confianca',
            detail: 'Sem maratona',
          },
        ],
      },
      {
        weekday: 2,
        blocks: [
          {
            id: 'w39-tue-ti-revisao-ultra-leve-protocolos',
            area: 'TI',
            title: 'Revisao ultra leve: protocolos, seguranca, banco',
            detail: 'Resumos curtos',
          },
          {
            id: 'w39-tue-rlm-20-30-questoes',
            area: 'RLM',
            title: '20-30 questoes',
            detail: 'Sem maratona',
          },
        ],
      },
      {
        weekday: 3,
        blocks: [
          {
            id: 'w39-wed-legis-lei-seca-final',
            area: 'Legis',
            title: 'Lei seca final',
            detail: 'Prazos, excecoes e palavras-chave',
          },
          {
            id: 'w39-wed-pt-pegadinhas-fcc',
            area: 'PT',
            title: 'Revisao de pegadinhas FCC',
            detail: 'Ajuste de confianca',
          },
        ],
      },
      {
        weekday: 4,
        blocks: [
          {
            id: 'w39-thu-evento-organizacao-mental',
            area: 'Evento',
            title: 'Revisao curtissima / organizacao mental',
            detail: 'Leitura leve de resumos/checklists + descanso estrategico',
          },
        ],
      },
    ],
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

const buildWeekActiveDates = (planStartDate: string, weekNumber: number): string[] => {
  const start = parseIsoDate(planStartDate);
  const weekStart = new Date(start.getTime() + (weekNumber - 1) * 7 * DAY_MS);
  const activeDates: string[] = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const current = new Date(weekStart.getTime() + offset * DAY_MS);
    if (current.getUTCDay() === 0) {
      continue;
    }
    activeDates.push(toIsoDate(current));
  }

  return activeDates;
};

const buildDateForWeekday = (
  weekNumber: number,
  weekday: ManualDayTemplate['weekday'],
  planStartDate: string,
): string => {
  const activeDates = buildWeekActiveDates(planStartDate, weekNumber);
  return activeDates[Math.max(0, weekday - 1)] ?? activeDates[activeDates.length - 1];
};

const mapAreaToSubject = (area: string): SubjectKey | null => {
  if (area.startsWith('PT')) {
    return 'portugues';
  }

  if (area.startsWith('RLM')) {
    return 'rlm';
  }

  if (area.startsWith('Legis')) {
    return 'legislacao';
  }

  if (area.startsWith('TI')) {
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
