import { expect, test } from '@playwright/test';

test('fluxo principal: roteiro manual e checklist diário', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Dashboard de Execução' })).toBeVisible();

  await page.getByRole('button', { name: 'Abrir menu superior' }).click();
  await page.getByTestId('nav-plano-diario').click();
  await expect(page.getByRole('heading', { name: 'Plano Diário' })).toBeVisible();

  await page.getByRole('button', { name: 'Abrir menu superior' }).click();
  const dateInput = page.getByLabel('Dia selecionado');
  await dateInput.fill('2026-03-14');
  await expect(
    page.getByTestId('daily-manual-blocks').getByText('Web: HTML semântico + forms'),
  ).toBeVisible();

  const questionsInput = page.getByTestId('check-objective-questions');
  await questionsInput.fill('50');
  await expect(questionsInput).toHaveValue('50');

  await dateInput.fill('2026-03-20');
  await expect(page.getByText('Realocado do domingo')).toBeVisible();
});

test('desktop: abre menu superior e alcança configuracoes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.goto('/');

  const handle = page.getByRole('button', { name: 'Abrir menu superior' });
  await handle.click();

  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Plano Diário' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Conteúdo Pragmático' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Anki & FSRS' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Simulados e Redações' })).toBeVisible();

  await page.getByRole('link', { name: 'Configurações' }).click();

  await expect(page.getByRole('heading', { name: 'Configurações e Backup' })).toBeVisible();
  await expect(page.getByTestId('shell-chrome')).toHaveAttribute('data-shell-state', 'collapsed');
  const contentMarginTop = await page.evaluate(() => {
    const content = document.querySelector('.content');
    return content ? Number.parseFloat(getComputedStyle(content).marginTop) : null;
  });
  expect(contentMarginTop).not.toBeNull();
  expect(contentMarginTop!).toBeLessThan(140);
  await page.getByLabel('Data de início do plano').click();
  await expect(page.getByLabel('Data de início do plano')).toBeFocused();
});
