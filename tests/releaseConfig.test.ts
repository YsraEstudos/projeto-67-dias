import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';

const readText = (path: string) => readFileSync(path, 'utf8');

describe('main release configuration', () => {
  test('deploy build regenerates the published CONCURSO bundle before the root app', () => {
    const packageJson = JSON.parse(readText('package.json')) as {
      scripts: Record<string, string>;
    };
    const netlifyToml = readText('netlify.toml');

    expect(netlifyToml).toContain('command = "npm run build:deploy"');
    expect(packageJson.scripts['build:deploy']).toBe(
      'npm --prefix CONCURSO install --prefer-offline --no-audit --progress=false && npm --prefix CONCURSO run build && node scripts/publish-concurso.mjs && vite build',
    );
  });

  test('published CONCURSO contract checks only generated sync drift', () => {
    const packageJson = JSON.parse(readText('package.json')) as {
      scripts: Record<string, string>;
    };
    const workflow = readText('.github/workflows/main-readiness.yml');

    expect(packageJson.scripts['check:concurso:published']).toBe(
      'npm --prefix CONCURSO run build && node scripts/publish-concurso.mjs && git diff --exit-code -- public/concurso',
    );
    expect(workflow).toContain('Install CONCURSO dependencies');
    expect(workflow).toContain('npm --prefix CONCURSO ci');
  });
});
