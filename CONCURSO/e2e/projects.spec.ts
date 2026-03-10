import { expect, test } from '@playwright/test';

test('fluxo da aba projetos: criar, exigir, progresso e persistencia', async ({ page }) => {
  await page.goto('/projetos');

  await expect(page.getByRole('heading', { name: 'Projetos', exact: true })).toBeVisible();

  await page.getByTestId('project-create-name').fill('Projeto E2E');
  await page.getByRole('button', { name: 'Criar projeto' }).click();

  await expect(page.locator('.projects-card-title', { hasText: 'Projeto E2E' }).first()).toBeVisible();

  const requirementForm = page.locator('form').filter({ has: page.getByTestId('project-requirement-text') });
  await requirementForm.getByTestId('project-requirement-text').fill('Ter endpoint GET e POST');
  await requirementForm.getByLabel('Tecnologia').selectOption('java');
  await requirementForm.getByRole('button', { name: 'Adicionar exigencia' }).click();

  const requirementList = page.getByTestId('project-requirements-list');
  await expect(requirementList.getByText('Ter endpoint GET e POST')).toBeVisible();

  const firstRequirement = requirementList.locator('.projects-requirement-item').first();
  await firstRequirement.locator('input[type="checkbox"]').first().check();
  await expect(firstRequirement.getByText('Atendida')).toBeVisible();

  await expect(page.getByText('Exigencias: 1/1', { exact: false }).first()).toBeVisible();

  const techPanel = page.locator('.panel').filter({ has: page.getByRole('heading', { name: 'Painel por tecnologia' }) });
  const javaRow = techPanel.locator('tbody tr').filter({
    has: page.getByRole('cell', { name: 'Java', exact: true }),
  });
  await expect(javaRow).toContainText('100%');

  await page.reload();
  await expect(page.locator('.projects-card-title', { hasText: 'Projeto E2E' }).first()).toBeVisible();
  await expect(page.getByTestId('project-requirements-list').getByText('Ter endpoint GET e POST')).toBeVisible();
});
