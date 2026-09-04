// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://riverhacks-spaceapps.org',
  vite: {
    plugins: [tailwindcss()],
    build: {
      // three.js is the only heavy chunk; keep it isolated so the rest of the
      // page can be parsed and painted without waiting on it.
      rollupOptions: {
        output: {
          manualChunks: (id) => (id.includes('node_modules/three') ? 'three' : undefined),
        },
      },
    },
  },
});
