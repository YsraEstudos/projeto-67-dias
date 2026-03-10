import { expect, test } from '@playwright/test';

test('fluxo iniciante de Anki com persistência e avançado colapsado', async ({ page }) => {
  await page.goto('/anki');

  await expect(page.getByRole('heading', { name: 'Anki & FSRS' })).toBeVisible();
  const advancedPanel = page.getByTestId('anki-advanced-panel');
  await expect(advancedPanel).not.toHaveAttribute('open', '');

  await page.getByTestId('anki-target-cards').fill('1000');
  await page.getByTestId('anki-new-cards-day').fill('20');
  await page.getByTestId('anki-pause-6').check();

  const today = await page.evaluate(() => new Date().toISOString().slice(0, 10));
  await page.getByTestId('anki-log-date').fill(today);
  await page.getByTestId('anki-log-new-cards').fill('12');
  await page.getByTestId('anki-log-reviews').fill('50');
  await page.getByTestId('anki-log-submit').click();

  await expect(page.getByText('12/1000')).toBeVisible();
  await expect(
    page.locator('.metric-card').filter({ hasText: 'Revisões acumuladas' }).getByText('50', { exact: true }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('anki-target-cards')).toHaveValue('1000');
  await expect(page.getByTestId('anki-pause-6')).toBeChecked();
  await expect(page.getByTestId('anki-log-new-cards')).toHaveValue('12');
  await expect(page.getByTestId('anki-log-reviews')).toHaveValue('50');

  await page.getByTestId('anki-advanced-panel').locator('summary').click();
  await expect(advancedPanel).toHaveAttribute('open', '');
});
