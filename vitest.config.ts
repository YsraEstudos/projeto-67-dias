/// <reference types="vitest" />
import path from 'node:path';
import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            'virtual:pwa-register/react': path.resolve(__dirname, 'tests/mocks/pwaRegisterReact.ts'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './tests/setup.ts',
        css: true,
        exclude: [...configDefaults.exclude, 'CONCURSO/src/tests/**', 'CONCURSO/e2e/**'],
        env: {
            VITE_FIREBASE_API_KEY: 'test-api-key',
            VITE_FIREBASE_AUTH_DOMAIN: 'test-domain',
            VITE_FIREBASE_PROJECT_ID: 'test-project',
            VITE_FIREBASE_STORAGE_BUCKET: 'test-bucket',
            VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-sender',
            VITE_FIREBASE_APP_ID: 'test-app-id',
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            // Only measure and enforce coverage for the refactored files.
            // All 4 files must reach 100% on every metric.
            include: [
                'WorkspaceApp.tsx',
                'hooks/useHydrationOrchestrator.ts',
                'hooks/useAppBootstrap.ts',
                'hooks/useDashboardStats.ts',
            ],
            thresholds: {
                statements: 100,
                branches: 100,
                functions: 100,
                lines: 100,
            },
        },
    },
});
