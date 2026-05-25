import { expect, test } from '@playwright/test';

test('configuracoes permitem ajustar inicio, descanso e metas padrao', async ({ page }) => {
  await page.goto('/concurso/');

  await page.getByRole('button', { name: 'Configurações' }).click();

  await expect(page.getByRole('heading', { name: 'Ajustes do plano' })).toBeVisible();

  const startDate = page.getByLabel('Início do plano de estudos');
  await startDate.fill('2026-03-16');
  await expect(startDate).toHaveValue('2026-03-16');

  await page.getByLabel('Dia de descanso').selectOption('1');
  await expect(page.getByLabel('Dia de descanso')).toHaveValue('1');

  const portuguesGoal = page.getByLabel('Português');
  await portuguesGoal.fill('42');
  await expect(portuguesGoal).toHaveValue('42');
});
