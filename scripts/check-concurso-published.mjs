import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const standaloneDistDir = path.join(repoRoot, 'CONCURSO', 'dist');
const publicConcursoDir = path.join(repoRoot, 'public', 'concurso');
const fingerprintMarker = /<meta name="concurso-build-fingerprint" content="([^"]+)"\s*\/>/;

const extractFingerprint = (html, label) => {
  const match = html.match(fingerprintMarker);
  if (!match) {
    throw new Error(`Fingerprint ausente em ${label}.`);
  }
  return match[1];
};

const extractReferencedAssets = (html) => {
  const matches = [...html.matchAll(/(?:src|href)="([^"]+)"/g)];
  return matches
    .map(([, value]) => value)
    .filter((value) => value.startsWith('/concurso/'));
};

const toFilesystemPath = (rootDir, assetPath) => {
  const relativePath = assetPath.replace(/^\/concurso\//, '').replaceAll('/', path.sep);
  return path.join(rootDir, relativePath);
};

const assertShellAssets = async (html, rootDir, label) => {
  const referencedAssets = extractReferencedAssets(html);
  if (referencedAssets.length === 0) {
    throw new Error(`Nenhum asset /concurso foi encontrado em ${label}.`);
  }
  await Promise.all(
    referencedAssets.map(async (assetPath) => {
      await stat(toFilesystemPath(rootDir, assetPath));
    }),
  );
};

const fingerprintInputs = execFileSync(
  'git',
  [
    'ls-files',
    '-z',
    'CONCURSO/src',
    'CONCURSO/index.html',
    'CONCURSO/package.json',
    'CONCURSO/package-lock.json',
    'CONCURSO/postcss.config.js',
    'CONCURSO/vite.config.ts',
  ],
  { cwd: repoRoot, encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean)
  .sort();

const buildFingerprint = createHash('sha256');
for (const relativePath of fingerprintInputs) {
  const normalizedContent = await readFile(path.resolve(repoRoot, relativePath), 'utf8').then((content) => content.replace(/\r\n?/g, '\n'));
  buildFingerprint.update(relativePath);
  buildFingerprint.update('\0');
  buildFingerprint.update(normalizedContent);
  buildFingerprint.update('\0');
}

const expectedFingerprint = buildFingerprint.digest('hex').slice(0, 16);
const distHtml = await readFile(path.join(standaloneDistDir, 'index.html'), 'utf8');
const publishedHtml = await readFile(path.join(publicConcursoDir, 'index.html'), 'utf8');
const distFingerprint = extractFingerprint(distHtml, 'CONCURSO/dist/index.html');
const publishedFingerprint = extractFingerprint(publishedHtml, 'public/concurso/index.html');

if (distFingerprint !== expectedFingerprint || publishedFingerprint !== expectedFingerprint) {
  throw new Error(
    `Fingerprint divergente: esperado ${expectedFingerprint}, dist ${distFingerprint}, publicado ${publishedFingerprint}.`,
  );
}

await assertShellAssets(distHtml, standaloneDistDir, 'CONCURSO/dist/index.html');
await assertShellAssets(publishedHtml, publicConcursoDir, 'public/concurso/index.html');

console.log(`[check-concurso-published] fingerprint ${expectedFingerprint} confirmado em dist e public/concurso.`);
