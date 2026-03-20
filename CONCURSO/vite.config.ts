import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/concurso/',
  plugins: [
    react(),
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
