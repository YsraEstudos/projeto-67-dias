import { expect, test } from '@playwright/test';

const clearContentStorage = async (page: import('@playwright/test').Page): Promise<void> => {
  await page.evaluate(async () => {
    window.localStorage.clear();

    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase('concurso-theoretical-content');
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  });
};

test('conteudo teorico por materia e submateria com downloads zipados', async ({ page }) => {
  const uniqueSuffix = Date.now();
  const submatterTitle = `Casos especiais ${uniqueSuffix}`;
  const topicFilename = `resumo-${uniqueSuffix}.md`;
  const submatterFilename = `lista-${uniqueSuffix}.pdf`;

  await page.goto('/concurso/#/conteudo');
  await clearContentStorage(page);
  await page.reload();

  await page.getByRole('link', { name: 'Domínio da ortografia oficial.' }).click();
  await expect(page).toHaveURL(/\/concurso\/#\/conteudo\/topico\//);
  await expect(page.getByText(/^Nota atual [A-E]$/)).toBeVisible();

  await page.getByTestId('submatter-create-title').fill(submatterTitle);
  await page.getByTestId('submatter-create-submit').click();

  await page.getByRole('button', { name: 'Abrir central de arquivos' }).click();
  await page.getByRole('button', { name: 'Abrir arquivos da matéria' }).click();

  await page.getByTestId('topic-theoretical-content-upload').setInputFiles([
    {
      name: topicFilename,
      mimeType: 'text/markdown',
      buffer: Buffer.from(`# ${topicFilename}\n`),
    },
  ]);
  await expect(
    page.getByTestId('topic-theoretical-content-list').getByText(topicFilename, { exact: true }),
  ).toBeVisible();

  const topicDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar arquivos da matéria' }).click();
  const topicDownload = await topicDownloadPromise;
  await expect(topicDownload.suggestedFilename()).toMatch(/\.zip$/);

  await page.getByRole('button', { name: 'Voltar para central' }).click();
  await page.getByRole('button', { name: `Abrir arquivos da submatéria ${submatterTitle}` }).click();

  await page.getByLabel('Adicionar arquivos da submatéria').setInputFiles([
    {
      name: submatterFilename,
      mimeType: 'application/pdf',
      buffer: Buffer.from('pdf-content'),
    },
  ]);

  await expect(page.getByText(submatterFilename, { exact: true })).toBeVisible();

  const submatterDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: `Baixar arquivos da submatéria ${submatterTitle}` }).click();
  const submatterDownload = await submatterDownloadPromise;
  await expect(submatterDownload.suggestedFilename()).toMatch(/\.zip$/);

  await page.getByRole('button', { name: 'Voltar para central' }).click();
  await page.getByRole('button', { name: 'Voltar para o tópico' }).click();
  await page.getByRole('link', { name: 'Voltar para Conteúdo' }).click();
  const globalDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar todo conteúdo teórico' }).click();
  const globalDownload = await globalDownloadPromise;
  await expect(globalDownload.suggestedFilename()).toMatch(/^conteudo-pragmatico-.*\.zip$/);
});
