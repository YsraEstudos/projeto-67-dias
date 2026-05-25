import { expect, test } from '@playwright/test';

test('conteudo programatico mostra filtros, fila e mapa de materia', async ({ page }) => {
  await page.goto('/concurso/');

  await page.getByRole('button', { name: 'Conteúdo' }).click();

  await expect(page.getByRole('heading', { name: 'Conteúdo Programático' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tudo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Revisar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nota A' })).toBeVisible();
  await expect(page.getByText('Edital completo')).toBeVisible();

  await page.getByRole('button', { name: 'Mapa' }).first().click();
  await expect(page.locator('.clean-map-panel')).toBeVisible();
});
