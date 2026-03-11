import { expect, test } from '@playwright/test';

test('conteudo com notas A-E e pagina de submaterias', async ({ page }) => {
  await page.goto('/concurso/#/conteudo');

  await expect(page.getByRole('heading', { name: 'Conteúdo Pragmático' })).toBeVisible();
  await expect(page.getByTestId('content-grade-overview')).toBeVisible();
  await expect(page.getByTestId('review-queue-list')).toBeVisible();

  await page.getByTestId('content-quick-filters').getByRole('button', { name: 'Revisar agora' }).click();
  const firstQueueItem = page.locator('[data-testid="review-queue-list"] a').first();
  await expect(firstQueueItem).toBeVisible();
  await firstQueueItem.click();

  await expect(page).toHaveURL(/\/concurso\/#\/conteudo\/topico\//);
  await expect(page.getByTestId('submatter-card-list')).toBeVisible();

  const beforeCount = await page.locator('.submatter-card').count();

  await page.getByTestId('submatter-create-title').fill('Pré-processamento aplicado em base X');
  await page.locator('form').getByRole('button', { name: 'A', exact: true }).click();
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

  const createdCardTitle = page.locator('input[value="Pré-processamento aplicado em base X"]');
  const createdCard = page.locator('.submatter-card').filter({ has: createdCardTitle });
  await expect(createdCard).toBeVisible();
  await createdCard.getByRole('button', { name: 'B', exact: true }).click();
  await createdCard.getByRole('button', { name: 'Hoje' }).click();
  await expect(createdCard.locator('input[type="date"]')).not.toHaveValue('');

  await page.getByRole('button', { name: 'Tabela avançada' }).click();
  const rows = page.locator('[data-testid="submatter-table-body"] tr');
  await expect(rows).toHaveCount(beforeCount + 1);
  await expect(
    page.locator('[data-testid="submatter-table-body"] input[value="Pré-processamento aplicado em base X"]'),
  ).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Tabela avançada' }).click();
  await expect(
    page.locator('[data-testid="submatter-table-body"] input[value="Pré-processamento aplicado em base X"]'),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Voltar para Conteúdo' }).click();
  await expect(page).toHaveURL(/\/concurso\/#\/conteudo$/);
  await expect(page.getByTestId('review-queue-list')).toBeVisible();
});
