import { expect, test } from '@playwright/test';

test('fluxo principal: roteiro manual e checklist diário', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Dashboard de Execução' })).toBeVisible();

  await page.getByTestId('nav-plano-diario').click();
  await expect(page.getByRole('heading', { name: 'Plano Diário' })).toBeVisible();

  const dateInput = page.locator('input[type="date"]');
  await dateInput.fill('2026-03-10');
  await expect(
    page.getByTestId('daily-manual-blocks').getByText('Web: HTML semântico + forms'),
  ).toBeVisible();

  const questionsInput = page.getByTestId('check-objective-questions');
  await questionsInput.fill('50');
  await expect(questionsInput).toHaveValue('50');

  await dateInput.fill('2026-03-14');
  await expect(page.getByText('Realocado do domingo')).toBeVisible();
  await expect(page.getByTestId('check-redacao')).toBeVisible();
});
