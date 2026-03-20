import { describe, expect, it } from 'vitest';
import { resolveManualBlockContentRefs, resolveManualBlockContentTargets } from '../app/manualPlanContentRefs';

describe('resolveManualBlockContentRefs', () => {
  it('resolve blocos claros de portugues, rlm, legislacao e ti', () => {
    expect(
      resolveManualBlockContentRefs({
        area: 'PT',
        title: 'Pontuação básica',
        detail: 'Vírgula essencial',
      }),
    ).toEqual(['Emprego dos sinais de pontuação.']);

    expect(
      resolveManualBlockContentRefs({
        area: 'RLM',
        title: 'Porcentagem e regra de 3',
        detail: 'Questões dirigidas',
      }),
    ).toEqual([
      'Regra de três simples e composta.',
      'Porcentagem e problemas aplicados.',
    ]);

    expect(
      resolveManualBlockContentRefs({
        area: 'Legis',
        title: 'Lei 14.133: visão geral, princípios e fases',
        detail: 'Base inicial',
      }),
    ).toEqual(['Lei 14.133/2021 (nova Lei de Licitações e Contratos).']);

    expect(
      resolveManualBlockContentRefs({
        area: 'TI',
        title: 'Redes: TCP/IP + IPv4 + ARP',
        detail: 'Visão de protocolos essenciais',
      }),
    ).toEqual(['Redes: TCP/IP, IPv4/IPv6, ARP, TCP e UDP']);
  });

  it('retorna multiplas referencias quando o bloco cobre mais de um topico oficial', () => {
    expect(
      resolveManualBlockContentRefs({
        area: 'TI',
        title: 'Redes revisão (DNS/DHCP/VLAN)',
        detail: 'Protocolos e segmentação',
      }),
    ).toEqual([
      'Redes: Ethernet, Wireless, VLAN e LACP',
      'Redes: DNS, DHCP, LDAP, NTP, SMTP, Syslog e HTTP',
    ]);
  });

  it('retorna o local exato do topico oficial para cada bloco', () => {
    expect(
      resolveManualBlockContentTargets({
        area: 'TI',
        title: 'Web: CSS (seletores/box model)',
        detail: 'Layout, seletor e caixa',
      }),
    ).toEqual([
      expect.objectContaining({
        title: 'Conceitos de desenvolvimento web: HTML5 e CSS3.',
        path: expect.stringMatching(/^\/conteudo\/topico\/item-/),
        sectionTitle: 'Específicos - Desenvolvimento Web e Linguagens',
      }),
    ]);
  });

  it('usa fallback por materia quando o bloco e generico', () => {
    const refs = resolveManualBlockContentRefs({
      area: 'TI',
      title: 'Revisao geral',
      detail: 'Sem novidade',
    });

    expect(refs.length).toBeGreaterThan(0);
    expect(refs).toEqual([
      'Fundamentos de web services: REST, SOAP, Swagger e JWT.',
      'BD: modelo relacional + ER + chaves',
      'Redes: TCP/IP, IPv4/IPv6, ARP, TCP e UDP',
    ]);
  });
});
