import { expect, test } from '@playwright/test';

test('rota legada de projetos redireciona para o modulo unificado', async ({ page }) => {
  await page.goto('/concurso/projetos');

  const module = page.getByTestId('clean-concurso-module');
  await expect(module).toBeVisible();
  await expect(module.getByRole('button', { name: 'Dia' })).toBeVisible();
});
