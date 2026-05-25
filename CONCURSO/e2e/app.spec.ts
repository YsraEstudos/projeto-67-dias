import { expect, test } from '@playwright/test';

test('modulo limpo abre no dia e permite iniciar um bloco de estudo', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.goto('/concurso/');

  const module = page.getByTestId('clean-concurso-module');
  await expect(module).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Clique em Estudar para abrir o painel do bloco.' })).toBeVisible();
  const selectedDate = page.getByLabel('Escolher data do plano');
  await expect(selectedDate).toBeVisible();
  await selectedDate.fill('2026-03-14');

  await page.getByRole('button', { name: 'Estudar' }).first().click();
  await expect(page.getByText('Estudando agora')).toBeVisible();
  await expect(page.locator('.clean-study-focus').getByText('Questões feitas')).toBeVisible();
});

test('desktop navega pelas abas principais do modulo limpo', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.goto('/concurso/');

  await page.getByRole('button', { name: 'Conteúdo' }).click();
  await expect(page.getByRole('heading', { name: 'Conteúdo Programático' })).toBeVisible();

  await page.getByRole('button', { name: 'Calendário' }).click();
  await expect(page.locator('.clean-count').filter({ hasText: /eventos$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mês anterior' })).toBeVisible();

  await page.getByRole('button', { name: 'Configurações' }).click();
  await expect(page.getByRole('heading', { name: 'Ajustes do plano' })).toBeVisible();
  await expect(page.getByLabel('Resumo das configurações do plano')).toBeVisible();
});
