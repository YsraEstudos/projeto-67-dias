import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/plano-diario',
  '/conteudo',
  '/anki',
  '/correcoes',
  '/simulados-redacoes',
  '/projetos',
  '/configuracoes',
];

test('sem scroll horizontal em mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');

    const sizes = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect.soft(sizes.scrollWidth, `route ${route}`).toBeLessThanOrEqual(sizes.clientWidth + 1);
  }
});
