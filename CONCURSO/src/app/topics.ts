import { SUBJECT_ORDER } from './constants';
import type { TopicNode, TopicPriority, TopicSeedSection, CoverageMatrixRow, SubjectKey } from './types';

const TOPIC_DISPLAY_TITLE_OVERRIDES: Record<string, string> = {
  'Arquitetura de computadores: processador, memória principal/secundária e dispositivos de E/S.':
    'Arquitetura: CPU, memória e I/O',
  'Lei 8.112/1990: disposições preliminares.': 'Lei 8.112: visão geral',
  'Lei 8.112/1990: provimento, vacância, remoção, redistribuição e substituição.':
    'Lei 8.112: provimento, vacância, remoção e redistribuição',
  'Banco de dados relacional e modelagem E-R.': 'BD: modelo relacional + ER + chaves',
  'Gerência de memória: endereçamento, memória virtual, paginação e segmentação.':
    'Memória virtual e paginação',
  'Redes: meios de transmissão, Ethernet, Wireless, VLAN e LACP.':
    'Redes: Ethernet, Wireless, VLAN e LACP',
  'Modelo TCP/IP v4 e v6: ARP, IP, TCP e UDP.': 'Redes: TCP/IP, IPv4/IPv6, ARP, TCP e UDP',
  'Protocolos: DNS, DHCP, LDAP, NTP, SMTP, Syslog e HTTP.':
    'Redes: DNS, DHCP, LDAP, NTP, SMTP, Syslog e HTTP',
  'Conceitos de confidencialidade, integridade, disponibilidade, autenticação e não-repúdio.':
    'Segurança: CIA, autenticação e não repúdio',
};

const normalizeForId = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const inferPriority = (subject: SubjectKey, item: string): TopicPriority => {
  if (subject === 'legislacao') {
    return 'alta';
  }

  if (subject === 'portugues') {
    return item.includes('coer') || item.includes('regência') ? 'alta' : 'media';
  }

  if (item.includes('segurança') || item.includes('LGPD') || item.includes('arquitetura')) {
    return 'alta';
  }

  return 'media';
};

export const getTopicDisplayTitle = (topic: Pick<TopicNode, 'title' | 'displayTitle'>): string =>
  topic.displayTitle ?? topic.title;

export const getTopicSearchText = (topic: Pick<TopicNode, 'title' | 'displayTitle'>): string => {
  const displayTitle = getTopicDisplayTitle(topic);
  return displayTitle === topic.title ? topic.title : `${displayTitle} ${topic.title}`;
};

export const buildTopicsFromSeeds = (sections: TopicSeedSection[]): TopicNode[] => {
  const topics: TopicNode[] = [];

  for (const section of sections) {
    const sectionId = `sec-${section.id}`;
    topics.push({
      id: sectionId,
      subject: section.subject,
      title: section.title,
      sourceRef: section.sourceRef,
      parentId: null,
      isLeaf: false,
      priority: 'alta',
    });

    section.items.forEach((item, index) => {
      topics.push({
        id: `item-${section.id}-${index + 1}-${normalizeForId(item).slice(0, 40)}`,
        subject: section.subject,
        title: item,
        displayTitle: TOPIC_DISPLAY_TITLE_OVERRIDES[item],
        sourceRef: section.sourceRef,
        parentId: sectionId,
        isLeaf: true,
        priority: inferPriority(section.subject, item),
      });
    });
  }

  return topics;
};

export const buildCoverageMatrix = (
  topics: TopicNode[],
  expectedBySubject: Record<SubjectKey, number>,
): CoverageMatrixRow[] => {
  const leafTopics = topics.filter((topic) => topic.isLeaf);

  return SUBJECT_ORDER.map((subject) => {
    const registeredLines = leafTopics.filter((topic) => topic.subject === subject).length;
    const sourceLines = expectedBySubject[subject] ?? 0;
    const coveragePercent = sourceLines === 0 ? 0 : Math.round((registeredLines / sourceLines) * 100);

    return {
      subject,
      sourceLines,
      registeredLines,
      coveragePercent,
    };
  });
};

export const mapExpectedCoverage = (
  sections: TopicSeedSection[],
): Record<SubjectKey, number> => {
  const base: Record<SubjectKey, number> = {
    portugues: 0,
    rlm: 0,
    legislacao: 0,
    especificos: 0,
  };

  for (const section of sections) {
    base[section.subject] += section.items.length;
  }

  return base;
};

