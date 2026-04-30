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

  it('deduplica e rejeita rotas antigas ou invalidas', () => {
    expect(
      sanitizeMobilePinnedNav([
        '/',
        '/plano-diario',
        '/conteudo',
        '/correcoes',
        '/simulados-redacoes',
        '/configuracoes',
        '/correcoes',
        '/rota-inexistente',
      ]),
    ).toEqual(['/']);
  });

  it('nao adiciona um novo item quando a ilha ja esta cheia', () => {
    expect(insertMobilePinnedNavAt(DEFAULT_MOBILE_PINNED_NAV, '/projetos', 2)).toHaveLength(
      1,
    );
    expect(insertMobilePinnedNavAt(DEFAULT_MOBILE_PINNED_NAV, '/projetos', 2)).not.toContain('/projetos');
    expect(MAX_MOBILE_PINNED_NAV_ITEMS).toBe(6);
  });

  it('reordena e remove atalhos fixados', () => {
    const moved = moveMobilePinnedNav(['/', '/plano-diario', '/conteudo'], '/', 2);
    expect(moved).toEqual(['/']);

    const removed = removeMobilePinnedNav(moved, '/conteudo');
    expect(removed).toEqual(['/']);
  });

  it('resolve qualquer rota antiga para a raiz do novo modulo', () => {
    expect(resolveActiveNavPath('/conteudo/topico/abc')).toBe('/');
    expect(resolveActiveNavPath('/configuracoes')).toBe('/');
    expect(resolveActiveNavPath('/outra-rota')).toBe('/');
  });
});
