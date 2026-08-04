import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const geminiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '';

    // Served from a sub-path on the on-premise server:
    // https://pausat.uib.es/cafft/
    // Override with BASE_PATH=/ for a root deployment.
    const base = process.env.BASE_PATH || env.BASE_PATH || '/cafft/';
    const genaiPath = `${base}genai`;

    return {
      base,
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Mirrors the production nginx proxy so AI features behave the same in
          // dev: the browser never sees the API key and requests stay
          // same-origin. See docs/deploy/docker/cafft.conf.
          [genaiPath]: {
            target: 'https://generativelanguage.googleapis.com',
            changeOrigin: true,
            rewrite: (p) => p.slice(genaiPath.length),
            headers: geminiKey ? { 'x-goog-api-key': geminiKey } : undefined,
          },
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
