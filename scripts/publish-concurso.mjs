import { cp, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const standaloneDistDir = path.join(repoRoot, 'CONCURSO', 'dist');
const publicConcursoDir = path.join(repoRoot, 'public', 'concurso');

const assertPathExists = async (targetPath) => {
  await stat(targetPath);
};

const extractReferencedAssets = (html) => {
  const matches = [...html.matchAll(/(?:src|href)="([^"]+)"/g)];
  return matches
    .map(([, value]) => value)
    .filter((value) => value.startsWith('/concurso/'));
};

const toFilesystemPath = (assetPath) => {
  const relativePath = assetPath.replace(/^\/concurso\//, '').replaceAll('/', path.sep);
  return path.join(publicConcursoDir, relativePath);
};

const syncStandaloneBuild = async () => {
  await assertPathExists(standaloneDistDir);
  await rm(publicConcursoDir, { recursive: true, force: true });
  await cp(standaloneDistDir, publicConcursoDir, { recursive: true });
};

const validatePublishedShell = async () => {
  const publishedHtmlPath = path.join(publicConcursoDir, 'index.html');
  const publishedHtml = await readFile(publishedHtmlPath, 'utf8');
  const referencedAssets = extractReferencedAssets(publishedHtml);

  if (referencedAssets.length === 0) {
    throw new Error('Nenhum asset /concurso foi encontrado em public/concurso/index.html.');
  }

  await Promise.all(
    referencedAssets.map(async (assetPath) => {
      await assertPathExists(toFilesystemPath(assetPath));
    }),
  );
};

await syncStandaloneBuild();
await validatePublishedShell();

console.log('[publish-concurso] public/concurso sincronizado com CONCURSO/dist.');
