import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      host: true, // Expõe para a rede local
    },
    plugins: [
      react(),
      // PWA requer HTTPS válido (produção) ou localhost (dev)
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true, // Habilita PWA em modo dev (injecta manifest e SW)
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
          navigateFallback: '/index.html',
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
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom', 'zustand'],
            'firebase-core': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
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
    }
  };
});
