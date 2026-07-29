import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const repoRoot = resolve(__dirname, '..');
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
  const normalizedContent = readFileSync(resolve(repoRoot, relativePath), 'utf8').replace(/\r\n?/g, '\n');
  buildFingerprint.update(relativePath);
  buildFingerprint.update('\0');
  buildFingerprint.update(normalizedContent);
  buildFingerprint.update('\0');
}

const concursoBuildFingerprint = buildFingerprint.digest('hex').slice(0, 16);
const concursoBuildFingerprintPlugin: Plugin = {
  name: 'concurso-build-fingerprint',
  transformIndexHtml(html) {
    const marker = '__CONCURSO_BUILD_FINGERPRINT__';
    if (!html.includes(marker)) {
      throw new Error(`Marcador de fingerprint ausente em CONCURSO/index.html: ${marker}`);
    }
    return html.replace(marker, concursoBuildFingerprint);
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  base: '/concurso/',
  envDir: resolve(__dirname, '..'),
  resolve: {
    alias: {
      firebase: resolve(__dirname, '..', 'node_modules', 'firebase'),
    },
    dedupe: ['firebase'],
  },
  plugins: [
    react(),
    concursoBuildFingerprintPlugin,
  ],
  server: {
    port: 5173,
    host: '0.0.0.0',
    open: 'http://localhost:5173',
  },
  preview: {
    port: 4173,
    host: '127.0.0.1',
    strictPort: true,
  },
});
