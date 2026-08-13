import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import viteDevApiPlugin from './vite-dev-api-plugin.js';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Loads .env.local (gitignored) the same way Vercel loads its Environment
  // Variables -- GEMINI_API_KEY / PEXELS_API_KEY / OPENAI_API_KEY -- so the
  // dev-only api/*.js handlers can read process.env exactly as they would
  // in production. Client bundle code never sees these (only VITE_-prefixed
  // vars are exposed to the browser); this assignment is for the Node-side
  // dev API shim only.
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), viteDevApiPlugin()],
  };
});
