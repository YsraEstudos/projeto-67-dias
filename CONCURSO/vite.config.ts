import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/concurso/',
  plugins: [
    react(),
    basicSsl(),
  ],
  server: {
    port: 5173,
    host: '0.0.0.0',
    https: {},
    open: 'https://localhost:5173',
  },
  preview: {
    port: 5173,
    host: '0.0.0.0',
    https: {},
  },
});
