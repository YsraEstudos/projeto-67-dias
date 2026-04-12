import fs from 'node:fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode, command }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  const enableDevPwa = env.VITE_ENABLE_PWA_DEV === 'true';
  const concursoShellPath = path.resolve(__dirname, 'public', 'concurso', 'index.html');

  return {
    server: {
      port: 3000,
      host: true, // Expõe para a rede local
      hmr: {
        host: '127.0.0.1',
        protocol: 'ws',
      },
      watch: {
        // OneDrive on Windows can delay or swallow filesystem events for TSX
        // files. Polling keeps local UI updates reliable during development.
        usePolling: true,
        interval: 300,
        awaitWriteFinish: {
          stabilityThreshold: 200,
          pollInterval: 100,
        },
        ignored: [
          '**/.git/**',
          '**/.venv/**',
          '**/node_modules/**',
          '**/dist/**',
          '**/dev-dist/**',
          '**/coverage/**',
          '**/test-results/**',
          '**/CONCURSO/**',
        ],
      },
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
    plugins: [
      {
        name: 'serve-concurso-public-shell',
        apply: 'serve',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const requestPath = req.url?.split('?')[0];

            // On Windows, the /concurso route can accidentally resolve to the
            // source app folder "CONCURSO". We force the public shell here so
            // local dev matches the deployed /concurso static bundle.
            if (requestPath === '/concurso' || requestPath === '/concurso/') {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(fs.readFileSync(concursoShellPath, 'utf8'));
              return;
            }

            next();
          });
        },
      },
      {
        name: 'relax-csp-for-vite-dev',
        apply: 'serve',
        transformIndexHtml(html) {
          return html.replace(
            /<meta http-equiv="Content-Security-Policy"[\s\S]*?>/,
            `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://apis.google.com https://*.firebaseapp.com https://*.googleapis.com; frame-src 'self' https://*.firebaseapp.com https://*.google.com https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' https://actions.google.com; connect-src 'self' ws: wss: http://127.0.0.1:* http://localhost:* https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://www.google-analytics.com https://www.googletagmanager.com https://generativelanguage.googleapis.com https://firebasevertexai.googleapis.com wss://firebasevertexai.googleapis.com https://apis.google.com https://economia.awesomeapi.com.br;">`,
          );
        },
      },
      react(),
      // PWA requer HTTPS válido (produção) ou localhost (dev)
      VitePWA({
        injectRegister: 'script',
        registerType: 'autoUpdate',
        devOptions: {
          enabled: enableDevPwa, // Evita conflitos do SW com a subrota /concurso/ durante o desenvolvimento local
        },
        manifest: {
          id: '/',
          name: 'Projeto 67 Dias',
          short_name: '67 Dias',
          description: 'Sua jornada de 67 dias de desenvolvimento pessoal',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ],
          screenshots: [
            {
              src: '/screenshot-wide.png',
              sizes: '1584x784', // Ajustado para corresponder à captura real
              type: 'image/png',
              form_factor: 'wide',
              label: 'Dashboard do Projeto 67 Dias'
            },
            {
              src: '/screenshot-mobile.png',
              sizes: '625x939', // Ajustado para corresponder à captura real
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Visão mobile do app'
            }
          ]
        },
        workbox: {
          clientsClaim: true,
          skipWaiting: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          globIgnores: ['concurso/**/*'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/concurso(?:\/|$)/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com/,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts-stylesheets' }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }
              }
            }
          ]
        }
      })
    ],
    resolve: {
      dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'scheduler'],
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    optimizeDeps: {
      // Keep Vite focused on the root app entry. Without this, it also crawls
      // the nested CONCURSO/index.html and can prebundle a second React copy.
      entries: ['index.html'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom', 'zustand'],
            'firebase-core': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/ai', 'firebase/app-check'],
            'charts': ['recharts'],
            'markdown': ['react-markdown', 'remark-gfm'],
            'date-utils': ['date-fns'],
            'roadmap': ['dagre', 'react-zoom-pan-pinch'],
            'validation': ['zod'],
          }
        }
      },
      chunkSizeWarningLimit: 1000,
    },
    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID),
      'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID),
      'import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY': JSON.stringify(env.VITE_FIREBASE_APP_CHECK_SITE_KEY),
    }
  };
});
