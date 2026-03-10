import { expect, test } from '@playwright/test';

test('conteudo com notas A-E e pagina de submaterias', async ({ page }) => {
  await page.goto('/conteudo');

  await expect(page.getByRole('heading', { name: 'Conteúdo Pragmático' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Matriz de cobertura' })).toHaveCount(0);

  const firstTopicLink = page.locator('.topic-title-link').first();
  const firstTopicText = await firstTopicLink.innerText();
  await firstTopicLink.click();

  await expect(page).toHaveURL(/\/conteudo\/topico\//);
  await expect(page.getByRole('heading', { name: firstTopicText, exact: true })).toBeVisible();

  const beforeCount = await page.locator('[data-testid="submatter-table-body"] tr').count();

  await page.getByTestId('submatter-create-title').fill('Pré-processamento aplicado em base X');
  await page.locator('form').getByLabel('Nota').selectOption('A');
  await page.locator('form').getByLabel('Última revisão').fill('2026-02-26');
  await page
    .locator('form')
    .getByPlaceholder('Erro: confundi X com Y')
    .fill('Erro: confundi normalização com padronização.');
  await page
    .locator('form')
    .getByPlaceholder('Ação: refazer 20 questões e criar 3 cards')
    .fill('Ação: refazer 20 questões e criar 3 cards.');
  await page.getByTestId('submatter-create-submit').click();

  const rows = page.locator('[data-testid="submatter-table-body"] tr');
  await expect(rows).toHaveCount(beforeCount + 1);
  const createdRow = rows.nth(beforeCount);
  await expect(createdRow.locator('input').first()).toHaveValue('Pré-processamento aplicado em base X');

  await createdRow.locator('select').first().selectOption('B');
  await createdRow.getByRole('button', { name: 'Hoje' }).click();
  await expect(createdRow.locator('select').first()).toHaveValue('B');

  await createdRow.getByRole('button', { name: 'Excluir' }).click();
  await expect(page.locator('[data-testid="submatter-table-body"] tr')).toHaveCount(beforeCount);

  await page.getByRole('link', { name: 'Voltar para Conteúdo' }).click();
  await expect(page).toHaveURL('/conteudo');
  await expect(page.getByRole('heading', { name: 'Matriz de cobertura' })).toHaveCount(0);

  await page.reload();
  await page.locator('.topic-title-link', { hasText: firstTopicText }).first().click();
  await expect(page.locator('[data-testid="submatter-table-body"] tr')).toHaveCount(beforeCount);
});
