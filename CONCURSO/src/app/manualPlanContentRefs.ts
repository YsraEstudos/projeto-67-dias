import { TOPIC_SECTIONS } from '../data/topicSeeds';
import { buildTopicsFromSeeds, getTopicDisplayTitle } from './topics';
import type { ManualBlock, ManualContentTarget, SubjectKey } from './types';

const TOPIC_SOURCE = {
  ptOrthography: 'Domínio da ortografia oficial.',
  ptAccentuation: 'Emprego da acentuação gráfica.',
  ptPunctuation: 'Emprego dos sinais de pontuação.',
  ptCrase: 'Emprego do sinal indicativo de crase.',
  ptFlexion: 'Flexão nominal e verbal.',
  ptPronouns: 'Pronomes: emprego, formas de tratamento e colocação.',
  ptCohesion: 'Domínio dos mecanismos de coesão e coerência textual.',
  ptVerbTense: 'Emprego de tempos e modos verbais.',
  ptVoices: 'Vozes do verbo.',
  ptAgreement: 'Concordância nominal e verbal.',
  ptGovernment: 'Regência nominal e verbal.',
  ptMorphosyntax: 'Morfossintaxe.',
  ptRewrite: 'Redação: confronto e reconhecimento de frases corretas e incorretas.',
  ptInterpretation: 'Compreensão e interpretação de textos de gêneros variados.',
  ptGenres: 'Reconhecimento de tipos e gêneros textuais.',
  ptFigures: 'Figuras de linguagem.',
  ptArgumentation: 'Argumentação.',
  ptAdequacy: 'Adequação da linguagem ao tipo de documento.',
  ptClasses: 'Classes de palavras e termos da oração.',
  ptSyntax: 'Processos de coordenação e subordinação.',
  rlmArithmetic:
    'Números inteiros e racionais: adição, subtração, multiplicação, divisão e potenciação.',
  rlmExpressions: 'Expressões numéricas, múltiplos, divisores e problemas com naturais.',
  rlmFractions: 'Frações e operações com frações.',
  rlmRatio: 'Razões e proporções.',
  rlmRuleOfThree: 'Regra de três simples e composta.',
  rlmPercentage: 'Porcentagem e problemas aplicados.',
  rlmRelations:
    'Estrutura lógica de relações arbitrárias entre pessoas, lugares, objetos e eventos fictícios.',
  rlmDeduction: 'Dedução de novas informações a partir de relações fornecidas.',
  rlmConditions: 'Avaliação de condições usadas para estabelecer estruturas lógicas.',
  rlmVerbal: 'Raciocínio verbal, matemático e sequencial.',
  rlmOrientation:
    'Orientação espacial e temporal, formação de conceitos e discriminação de elementos.',
  rlmLogic: 'Compreensão do processo lógico: hipóteses válidas e conclusões determinadas.',
  law8112Intro: 'Lei 8.112/1990: disposições preliminares.',
  law8112Movement:
    'Lei 8.112/1990: provimento, vacância, remoção, redistribuição e substituição.',
  law8112Benefits:
    'Lei 8.112/1990: direitos e vantagens (vencimento, remuneração e vantagens).',
  law8112Leave: 'Lei 8.112/1990: férias, licenças e afastamentos.',
  law8112Discipline:
    'Lei 8.112/1990: regime disciplinar (deveres, proibições, acumulação, responsabilidades e penalidades).',
  lawPad: 'Processo administrativo disciplinar.',
  law9784: 'Lei 9.784/1999 (processo administrativo).',
  lawImprobity: 'Lei 8.429/1992 e Lei 14.230/2021 (improbidade administrativa).',
  law14133: 'Lei 14.133/2021 (nova Lei de Licitações e Contratos).',
  lawLgpd: 'Lei 13.709/2018 (LGPD).',
  lawLbi: 'Lei 13.146/2015 (Lei Brasileira de Inclusão da Pessoa com Deficiência).',
  lawRegiment: 'Regimento Interno do TRT da 4ª Região.',
  lawCnj400: 'Resolução CNJ 400/2021: política de sustentabilidade no Judiciário.',
  specWeb: 'Conceitos de desenvolvimento web: HTML5 e CSS3.',
  specXmlJson: 'Conceitos de XML e JSON.',
  specLanguages: 'Ambientes e linguagens: Java, JavaScript, TypeScript, Angular e Python.',
  specNodeAngular: 'Node.js e Angular.',
  specFrameworksJava: 'Frameworks Java: Jakarta EE 8, Hibernate 4+ e JPA 2.0.',
  specSpring: 'Spring, Spring Boot e Spring Cloud.',
  specSpringCloud: 'Spring Eureka e Zuul.',
  specWebservices: 'Fundamentos de web services: REST, SOAP, Swagger e JWT.',
  specElk: 'Ferramentas ELK: Elasticsearch, Logstash e Kibana.',
  specTests: 'Testes: cobertura de código, unitários, integração, JUnit e Mockito.',
  specArchitecture:
    'Noções de arquitetura: cliente/servidor, multicamadas, hub e orientada a serviços.',
  specWebhooks: 'Mensageria, webhooks e documentação Swagger.',
  specMlPreprocessing: 'Pré-processamento de dados estruturados e não estruturados.',
  specMlModels:
    'Modelos preditivos (supervisionados) e descritivos (não supervisionados).',
  specMlEvaluation:
    'Avaliação de modelos: sobreajuste, métricas de classificação e regressão.',
  specRoc: 'Análise ROC.',
  specMlTools: 'Ferramentas para ML: Python 3, scikit-learn, Keras e PyTorch.',
  specDatabaseModeling: 'Banco de dados relacional e modelagem E-R.',
  specSql: 'SQL e PL/SQL.',
  specSgbds: 'SGBDs: Oracle 11g+, SQL Server, PostgreSQL e H2.',
  specDw: 'Conceitos de data warehouse, data mining e OLAP.',
  specDevops: 'DevOps e DevSecOps com Kubernetes, Docker e Rancher.',
  specGitFlow: 'Jenkins, Maven, Git, GitLab e Gitflow.',
  specKeycloak: 'Keycloak, SSO e OAuth2 (RFC 6749).',
  specCicd: 'Integração e entrega contínua (CI/CD).',
  specProxy: 'Proxy reverso, SSL offloading e balanceamento de carga.',
  specComputerArchitecture:
    'Arquitetura de computadores: processador, memória principal/secundária e dispositivos de E/S.',
  specExecution: 'Execução de instruções, paralelismo e multiprocessamento.',
  specVirtualization: 'Virtualização de computadores.',
  specFilesystems: 'Sistemas de arquivos: arquivo, diretório e inodes.',
  specJournaling: 'Journaling, links e fragmentação.',
  specSan: 'SAN: zoning, fabric, ISL, NPIV e protocolo Fibre Channel.',
  specRaid: 'RAID.',
  specSmbNfs: 'Protocolos SMB e NFS.',
  specObjectStorage: 'Armazenamento por objeto (S3) e por bloco.',
  specBackup: 'Conceitos de backup, tape e VTL.',
  specProcesses:
    'Gerência de processos: programa, processo, ciclo de vida, estados e hierarquia.',
  specThreads: 'Threads, IPC e escalonamento.',
  specMemory:
    'Gerência de memória: endereçamento, memória virtual, paginação e segmentação.',
  specWindows:
    'Microsoft Windows 10+: Active Directory, RDS, Failover Cluster, WSUS e PowerShell.',
  specLinux: 'Linux: rpm/deb, systemd, LVM, iptables, scripts bash e python.',
  specNetworkMedia: 'Redes: meios de transmissão, Ethernet, Wireless, VLAN e LACP.',
  specTcpIp: 'Modelo TCP/IP v4 e v6: ARP, IP, TCP e UDP.',
  specNetworkManagement: 'Gerenciamento de redes: ICMP, SNMP e QoS.',
  specRouting: 'Roteamento: OSPF e BGP.',
  specProtocols: 'Protocolos: DNS, DHCP, LDAP, NTP, SMTP, Syslog e HTTP.',
  specVoip: 'Voz sobre IP: SIP e RTP.',
  specObservability:
    'Monitoramento e logs: Zabbix, Elasticsearch, Prometheus, Kibana, Grafana e Fluentd.',
  specCloud: 'Computação em nuvem: tipos e modelos NIST SP 800-145.',
  specInfraSecurity:
    'Segurança de infraestrutura: Firewall, IPS, IDS, SIEM, ZTNA, PAM, VPN, webproxy e NGAV.',
  specSecureDev: 'Desenvolvimento seguro: OWASP e NIST Secure Software Development Framework.',
  specNorms:
    'Normas e frameworks: ABNT NBR 27001:2013, 27002:2019, 27005:2018, 27035-3:2021, 22301:2020 e CIS Controls v8.',
  specLgpdSecurity: 'LGPD aplicada à segurança da informação.',
  specMalware: 'Malwares: worm, vírus, adware, ransomware e correlatos.',
  specAttacks:
    'Ataques cibernéticos: DDoS, brute force, phishing, spear phishing, amplificação, smurf e APT.',
  specCia:
    'Conceitos de confidencialidade, integridade, disponibilidade, autenticação e não-repúdio.',
  specCrypto: 'Criptografia simétrica e assimétrica.',
  specCertification: 'Certificação digital.',
  specGovernance: 'Gestão e governança de TI: noções de ITIL, COBIT e métodos ágeis.',
  specEnglish: 'Inglês técnico.',
} as const;

const ALL_TOPIC_NODES = buildTopicsFromSeeds(TOPIC_SECTIONS);
const ALL_TOPICS = ALL_TOPIC_NODES.filter((topic) => topic.isLeaf);
const TOPIC_NODE_BY_ID = ALL_TOPIC_NODES.reduce<Record<string, (typeof ALL_TOPIC_NODES)[number]>>(
  (accumulator, topic) => {
    accumulator[topic.id] = topic;
    return accumulator;
  },
  {},
);

const CONTENT_TARGET_BY_SOURCE = ALL_TOPICS.reduce<Record<string, ManualContentTarget>>((accumulator, topic) => {
  const sectionTitle = topic.parentId ? TOPIC_NODE_BY_ID[topic.parentId]?.title ?? '' : '';
  accumulator[topic.title] = {
    topicId: topic.id,
    title: getTopicDisplayTitle(topic),
    sourceTitle: topic.title,
    sectionTitle,
    sourceRef: topic.sourceRef,
    path: `/conteudo/topico/${topic.id}`,
  };
  return accumulator;
}, {});

interface RuleDefinition {
  subject: SubjectKey;
  refs: readonly string[];
  any?: readonly string[];
  all?: readonly string[];
}

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const includesNormalized = (text: string, value: string): boolean =>
  (() => {
    const normalizedValue = normalizeText(value).trim();
    if (!normalizedValue) {
      return false;
    }

    if (/^[a-z0-9]+$/.test(normalizedValue) && normalizedValue.length >= 4) {
      return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedValue)}[a-z0-9]*([^a-z0-9]|$)`).test(
        text,
      );
    }

    if (/^[a-z0-9 ]+$/.test(normalizedValue)) {
      const pattern = normalizedValue
        .split(/\s+/)
        .filter(Boolean)
        .map(escapeRegExp)
        .join('\\s+');
      return new RegExp(`(^|[^a-z0-9])${pattern}([^a-z0-9]|$)`).test(text);
    }

    return text.includes(normalizedValue);
  })();

const matchesRule = (text: string, rule: RuleDefinition): boolean => {
  const matchesAll = (rule.all ?? []).every((value) => includesNormalized(text, value));
  const matchesAny = rule.any ? rule.any.some((value) => includesNormalized(text, value)) : true;
  return matchesAll && matchesAny;
};

const inferSubjectFromArea = (area: string): SubjectKey | null => {
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

const PORTUGUESE_RULES: RuleDefinition[] = [
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptInterpretation], any: ['interpret', 'inferencia', 'pressuposto'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptCohesion], any: ['coesao', 'coerencia', 'conectiv'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptPunctuation], any: ['pontuacao', 'virgula'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptCrase], any: ['crase'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptGovernment], any: ['regencia'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptAgreement], any: ['concord'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptPronouns], any: ['pronome', 'colocacao'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptRewrite], any: ['reescrita', 'confronto', 'frases corretas', 'frases incorretas'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptRewrite, TOPIC_SOURCE.ptAdequacy], any: ['redacao'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptSyntax], any: ['coordenacao', 'subordinacao', 'coord.', 'subord.'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptFigures], any: ['figuras de linguagem', 'figuras'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptArgumentation], any: ['argument'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptVerbTense], any: ['tempos', 'modos verbais'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptVoices], any: ['voz passiva', 'vozes do verbo'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptAccentuation], any: ['acentuacao'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptOrthography], any: ['ortografia'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptMorphosyntax], any: ['morfossint'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptClasses], any: ['classes de palavras', 'termos da oracao'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptGenres], any: ['generos textuais', 'tipos textuais'] },
  { subject: 'portugues', refs: [TOPIC_SOURCE.ptFlexion], any: ['flexao nominal', 'flexao verbal'] },
];

const RLM_RULES: RuleDefinition[] = [
  { subject: 'rlm', refs: [TOPIC_SOURCE.rlmArithmetic], any: ['inteiros', 'racionais', 'potenciacao'] },
  { subject: 'rlm', refs: [TOPIC_SOURCE.rlmExpressions], any: ['expressoes numericas', 'multiplos', 'divisores'] },
  { subject: 'rlm', refs: [TOPIC_SOURCE.rlmFractions], any: ['fracoes', 'fracoes'] },
  { subject: 'rlm', refs: [TOPIC_SOURCE.rlmRatio], any: ['razao', 'proporcao', 'proporções', 'partes proporcionais'] },
  { subject: 'rlm', refs: [TOPIC_SOURCE.rlmRuleOfThree], any: ['regra de 3', 'regra de tres'] },
  { subject: 'rlm', refs: [TOPIC_SOURCE.rlmPercentage], any: ['porcent', '%'] },
  { subject: 'rlm', refs: [TOPIC_SOURCE.rlmRelations], any: ['relacoes', 'relações', 'pessoas/lugares', 'lugares'] },
  { subject: 'rlm', refs: [TOPIC_SOURCE.rlmDeduction], any: ['deducao', 'dedução'] },
  { subject: 'rlm', refs: [TOPIC_SOURCE.rlmConditions], any: ['condicoes', 'condições', 'se/entao', 'se então', 'tabelas'] },
  { subject: 'rlm', refs: [TOPIC_SOURCE.rlmVerbal], any: ['raciocinio verbal', 'raciocínio verbal', 'sequencias', 'sequências'] },
  { subject: 'rlm', refs: [TOPIC_SOURCE.rlmOrientation], any: ['orientacao', 'orientação', 'temporal', 'espacial', 'discriminacao', 'discriminação'] },
  { subject: 'rlm', refs: [TOPIC_SOURCE.rlmLogic], any: ['hipoteses', 'hipóteses', 'conclusoes', 'conclusões', 'processo logico', 'processo lógico'] },
];

const LEGISLATION_RULES: RuleDefinition[] = [
  { subject: 'legislacao', refs: [TOPIC_SOURCE.law8112Movement], all: ['8.112'], any: ['provimento', 'vacancia', 'vacância', 'remocao', 'remoção', 'redistribuicao', 'redistribuição', 'substituicao', 'substituição'] },
  { subject: 'legislacao', refs: [TOPIC_SOURCE.law8112Benefits], all: ['8.112'], any: ['direitos', 'vantagens', 'vencimento', 'remuneracao', 'remuneração'] },
  { subject: 'legislacao', refs: [TOPIC_SOURCE.law8112Leave], all: ['8.112'], any: ['licenc', 'ferias', 'férias', 'afastamentos'] },
  { subject: 'legislacao', refs: [TOPIC_SOURCE.law8112Discipline], all: ['8.112'], any: ['regime disciplinar', 'deveres', 'proibicoes', 'proibições', 'penalidades', 'acumulacao', 'acumulação', 'responsabilidades'] },
  { subject: 'legislacao', refs: [TOPIC_SOURCE.lawPad], all: ['8.112'], any: ['pad', 'processo administrativo disciplinar'] },
  { subject: 'legislacao', refs: [TOPIC_SOURCE.law8112Intro], all: ['8.112'], any: ['visao geral', 'visão geral', 'disposicoes preliminares', 'disposições preliminares'] },
  { subject: 'legislacao', refs: [TOPIC_SOURCE.law8112Intro], all: ['8.112'] },
  { subject: 'legislacao', refs: [TOPIC_SOURCE.law9784], any: ['9.784'] },
  { subject: 'legislacao', refs: [TOPIC_SOURCE.lawImprobity], any: ['improbidade', '8.429', '14.230'] },
  { subject: 'legislacao', refs: [TOPIC_SOURCE.law14133], any: ['14.133', 'licitac', 'contratacao', 'contratação', 'contratos'] },
  { subject: 'legislacao', refs: [TOPIC_SOURCE.lawLgpd], any: ['lgpd'] },
  { subject: 'legislacao', refs: [TOPIC_SOURCE.lawLbi], any: ['lbi', '13.146', 'acessibilidade', 'pessoa com deficiencia', 'pessoa com deficiência'] },
  { subject: 'legislacao', refs: [TOPIC_SOURCE.lawRegiment], any: ['regimento', 'trt4'] },
  { subject: 'legislacao', refs: [TOPIC_SOURCE.lawCnj400], any: ['cnj 400', 'sustentabilidade'] },
];

const SPECIFIC_RULES: RuleDefinition[] = [
  { subject: 'especificos', refs: [TOPIC_SOURCE.specWeb], any: ['html', 'css', 'web', 'dom', 'forms', 'formulario', 'formulários', 'cors'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specXmlJson], any: ['json', 'xml'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specLanguages], any: ['javascript', 'typescript', 'type script', 'java', 'python', 'angular'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specNodeAngular], any: ['angular', 'spa', 'binding', 'services', 'rotas', 'node.js', 'nodejs'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specFrameworksJava], any: ['jpa', 'hibernate', '@entity', '@id', 'lazy', 'eager', 'jakarta ee'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specSpring], any: ['spring boot', 'spring security', 'spring ', 'controller', 'service', 'repo', 'validacao', 'validação'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specSpringCloud], any: ['eureka', 'zuul', 'microservices', 'microservicos', 'microserviços'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specWebservices], any: ['rest', 'soap', 'swagger', 'jwt', 'openapi', 'idempotencia', 'idempotência'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specElk], any: ['elk', 'elasticsearch', 'logstash', 'kibana'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specTests], any: ['junit', 'mockito', 'teste', 'testes', 'cobertura', 'integracao', 'integração', 'unitario', 'unitário'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specArchitecture], any: ['cliente/servidor', 'multicamadas', 'hub', 'arquitetura orientada a servicos', 'arquitetura orientada a serviços'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specWebhooks], any: ['webhook', 'webhooks', 'mensageria'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specMlPreprocessing], any: ['pre-processamento', 'preprocessamento'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specMlModels], any: ['supervisionado', 'nao supervisionado', 'não supervisionado', 'descritivo', 'preditivo'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specMlEvaluation], any: ['overfitting', 'sobreajuste', 'metricas', 'métricas', 'classificacao', 'classificação', 'regressao', 'regressão'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specRoc], any: ['roc'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specMlTools], any: ['keras', 'pytorch', 'scikit', 'machine learning', 'ia/ml', 'ml'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specDatabaseModeling], any: ['bd', 'banco', 'modelagem', 'er ', 'e-r', 'normalizacao', 'normalização', 'constraints', 'pk', 'fk'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specSql], any: ['sql', 'pl/sql', 'join', 'group by', 'having', 'subquery', 'subqueries', 'procedure', 'procedures', 'function', 'functions', 'trigger', 'triggers', 'acid', 'rollback', 'commit'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specSgbds], any: ['oracle', 'postgresql', 'sql server', 'h2'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specDw], any: ['dw', 'olap', 'data mining', 'data warehouse'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specDevops], any: ['docker', 'kubernetes', 'rancher', 'container', 'containers'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specGitFlow], any: ['git', 'gitlab', 'gitflow', 'jenkins', 'maven', 'branch', 'merge', 'commit'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specKeycloak], any: ['oauth2', 'sso', 'keycloak'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specCicd], any: ['ci/cd', 'cicd', 'entrega continua', 'entrega contínua', 'integracao continua', 'integração contínua'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specProxy], any: ['proxy reverso', 'nginx', 'ssl offloading', 'balanceamento'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specComputerArchitecture], any: ['cpu', 'memoria', 'memória', 'i/o', 'arquitetura'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specExecution], any: ['paralelismo', 'multiprocessamento', 'execucao de instrucoes', 'execução de instruções'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specVirtualization], any: ['virtualizacao', 'virtualização'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specFilesystems], any: ['filesystem', 'arquivo', 'arquivos', 'diretorio', 'diretório', 'inode', 'inodes'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specJournaling], any: ['journaling', 'fragmentacao', 'fragmentação', 'links'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specSan], any: ['san', 'zoning', 'fabric', 'isl', 'npiv', 'fibre channel'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specRaid], any: ['raid'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specSmbNfs], any: ['smb', 'nfs'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specObjectStorage], any: ['s3', 'objeto', 'bloco'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specBackup], any: ['backup', 'tape', 'vtl'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specProcesses], any: ['processos', 'processo', 'ciclo de vida', 'estados'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specThreads], any: ['threads', 'ipc', 'escalonamento'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specMemory], any: ['memoria virtual', 'memória virtual', 'paginacao', 'paginação', 'enderecamento', 'endereçamento'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specWindows], any: ['windows', 'active directory', 'activedirectory', 'rds', 'wsus', 'failover', 'powershell'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specLinux], any: ['linux', 'systemd', 'lvm', 'iptables', 'bash', 'rpm', 'deb', 'dnf', 'permissoes', 'permissões', 'ps/top/kill', 'systemctl'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specNetworkMedia], any: ['ethernet', 'wireless', 'vlan', 'lacp', 'sub-rede'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specTcpIp], any: ['tcp/ip', 'tcp', 'udp', 'arp', 'ipv4', 'ipv6'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specNetworkManagement], any: ['icmp', 'snmp', 'qos', 'ping', 'traceroute'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specRouting], any: ['ospf', 'bgp'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specProtocols], any: ['dns', 'dhcp', 'ldap', 'ntp', 'smtp', 'syslog', 'http', 'https', 'nat'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specVoip], any: ['sip', 'rtp', 'voip'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specObservability], any: ['zabbix', 'prometheus', 'grafana', 'fluentd', 'observabilidade', 'monitoramento', 'logs'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specCloud], any: ['cloud', 'nist sp 800-145'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specInfraSecurity], any: ['firewall', 'ips', 'ids', 'siem', 'ztna', 'pam', 'vpn', 'webproxy', 'ngav'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specSecureDev], any: ['owasp', 'ssdf', 'xss', 'csrf', 'desenvolvimento seguro', 'websec'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specNorms], any: ['27001', '27002', '27005', '27035', '22301', 'cis controls', 'abnt'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specLgpdSecurity], any: ['lgpd'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specMalware], any: ['malware', 'worm', 'virus', 'vírus', 'ransomware', 'adware'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specAttacks], any: ['ddos', 'brute force', 'phishing', 'spear phishing', 'smurf', 'apt'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specCia], any: ['cia', 'confidencialidade', 'integridade', 'disponibilidade', 'autenticacao', 'autenticação', 'autorizacao', 'autorização', 'nao repudio', 'não-repúdio'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specCrypto], any: ['criptografia', 'simetrica', 'simétrica', 'assimetrica', 'assimétrica'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specCertification], any: ['certificacao digital', 'certificação digital', 'certificado'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specGovernance], any: ['itil', 'cobit', 'metodos ageis', 'métodos ágeis', 'governanca', 'governança'] },
  { subject: 'especificos', refs: [TOPIC_SOURCE.specEnglish], any: ['ingles tecnico', 'inglês técnico', 'glossario'] },
];

const MATCH_RULES = [...PORTUGUESE_RULES, ...RLM_RULES, ...LEGISLATION_RULES, ...SPECIFIC_RULES];

const SUBJECT_FALLBACK_REFS: Record<SubjectKey, readonly string[]> = {
  portugues: [TOPIC_SOURCE.ptInterpretation, TOPIC_SOURCE.ptCohesion],
  rlm: [TOPIC_SOURCE.rlmDeduction, TOPIC_SOURCE.rlmLogic],
  legislacao: [TOPIC_SOURCE.law8112Intro, TOPIC_SOURCE.law9784],
  especificos: [TOPIC_SOURCE.specWebservices, TOPIC_SOURCE.specDatabaseModeling, TOPIC_SOURCE.specTcpIp],
};

const dedupe = (values: readonly string[]): string[] => {
  const unique = new Set<string>();
  const ordered: string[] = [];

  for (const value of values) {
    if (!unique.has(value)) {
      unique.add(value);
      ordered.push(value);
    }
  }

  return ordered;
};

const dedupeByTopicId = (targets: readonly ManualContentTarget[]): ManualContentTarget[] => {
  const unique = new Set<string>();
  const ordered: ManualContentTarget[] = [];

  for (const target of targets) {
    if (!unique.has(target.topicId)) {
      unique.add(target.topicId);
      ordered.push(target);
    }
  }

  return ordered;
};

const toContentTarget = (sourceTitle: string): ManualContentTarget | null =>
  CONTENT_TARGET_BY_SOURCE[sourceTitle] ?? null;

export const resolveManualBlockContentTargets = (
  block: Pick<ManualBlock, 'area' | 'title' | 'detail'>,
): ManualContentTarget[] => {
  const subject = inferSubjectFromArea(block.area);
  if (!subject) {
    return [];
  }

  const text = normalizeText(`${block.title} ${block.detail}`);
  const directMatches = MATCH_RULES
    .filter((rule) => rule.subject === subject && matchesRule(text, rule))
    .flatMap((rule) => rule.refs)
    .map(toContentTarget)
    .filter((target): target is ManualContentTarget => target !== null);

  if (directMatches.length > 0) {
    return dedupeByTopicId(directMatches);
  }

  return dedupeByTopicId(
    SUBJECT_FALLBACK_REFS[subject]
      .map(toContentTarget)
      .filter((target): target is ManualContentTarget => target !== null),
  );
};

export const resolveManualBlockContentRefs = (
  block: Pick<ManualBlock, 'area' | 'title' | 'detail'>,
): string[] => dedupe(resolveManualBlockContentTargets(block).map((target) => target.title));

export const getManualBlockContentSummary = (
  block: Pick<ManualBlock, 'contentRefs'>,
  maxRefs = Number.POSITIVE_INFINITY,
): string | null => {
  if (!block.contentRefs || block.contentRefs.length === 0) {
    return null;
  }

  const safeLimit =
    Number.isFinite(maxRefs) && maxRefs > 0 ? Math.floor(maxRefs) : block.contentRefs.length;
  const visibleRefs = block.contentRefs.slice(0, safeLimit);
  const hiddenCount = block.contentRefs.length - visibleRefs.length;

  if (hiddenCount > 0) {
    return `${visibleRefs.join(' | ')} +${hiddenCount}`;
  }

  return visibleRefs.join(' | ');
};

export const getManualBlockSummaryLabel = (
  block: Pick<ManualBlock, 'title' | 'contentRefs'>,
): string => getManualBlockContentSummary(block, 1) ?? block.title;

export const buildManualPlanSummary = (
  blocks: Array<Pick<ManualBlock, 'title' | 'contentRefs'>>,
  limit = 2,
): string => blocks.slice(0, limit).map((block) => getManualBlockSummaryLabel(block)).join(' | ');
