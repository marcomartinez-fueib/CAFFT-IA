import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Served from a sub-path on the on-premise server:
    // https://pausat.uib.es/cafft/
    // Override with BASE_PATH=/ for a root deployment.
    const base = process.env.BASE_PATH || env.BASE_PATH || '/cafft/';
    const apiPath = `${base}api`;

    return {
      base,
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // The CAFFT API (server/, `npm run dev:api`), mirroring the nginx
          // location that strips the prefix in production. The Origin header
          // is passed through untouched for the API's CSRF check. The AI
          // assistant goes through it too: set GEMINI_API_KEY in server/.env.
          [apiPath]: {
            target: 'http://127.0.0.1:3001',
            rewrite: (p) => p.slice(apiPath.length),
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
