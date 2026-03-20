import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MOBILE_PINNED_NAV,
  MAX_MOBILE_PINNED_NAV_ITEMS,
  insertMobilePinnedNavAt,
  moveMobilePinnedNav,
  removeMobilePinnedNav,
  resolveActiveNavPath,
  sanitizeMobilePinnedNav,
} from '../app/mobileNavigation';

describe('mobileNavigation helpers', () => {
  it('usa o conjunto padrao quando nao ha config salva', () => {
    expect(sanitizeMobilePinnedNav(undefined)).toEqual(DEFAULT_MOBILE_PINNED_NAV);
  });

  it('deduplica, rejeita rotas invalidas e respeita o limite de seis atalhos', () => {
    expect(
      sanitizeMobilePinnedNav([
        '/',
        '/plano-diario',
        '/conteudo',
        '/anki',
        '/simulados-redacoes',
        '/configuracoes',
        '/correcoes',
        '/anki',
        '/rota-inexistente',
      ]),
    ).toEqual([
      '/',
      '/plano-diario',
      '/conteudo',
      '/anki',
      '/simulados-redacoes',
      '/configuracoes',
    ]);
  });

  it('nao adiciona um novo item quando a ilha ja esta cheia', () => {
    expect(insertMobilePinnedNavAt(DEFAULT_MOBILE_PINNED_NAV, '/correcoes', 2)).toHaveLength(
      MAX_MOBILE_PINNED_NAV_ITEMS,
    );
    expect(insertMobilePinnedNavAt(DEFAULT_MOBILE_PINNED_NAV, '/correcoes', 2)).not.toContain('/correcoes');
  });

  it('reordena e remove atalhos fixados', () => {
    const moved = moveMobilePinnedNav(['/', '/plano-diario', '/conteudo'], '/', 2);
    expect(moved).toEqual(['/plano-diario', '/conteudo', '/']);

    const removed = removeMobilePinnedNav(moved, '/conteudo');
    expect(removed).toEqual(['/plano-diario', '/']);
  });

  it('resolve a rota ativa pelo match mais especifico', () => {
    expect(resolveActiveNavPath('/conteudo/topico/abc')).toBe('/conteudo');
    expect(resolveActiveNavPath('/configuracoes')).toBe('/configuracoes');
    expect(resolveActiveNavPath('/outra-rota')).toBe('/');
  });
});
