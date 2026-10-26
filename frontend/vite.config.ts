import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const api = process.env.ALFA_API_URL ?? 'http://127.0.0.1:8000';

export default defineConfig({
  plugins: [react()],
  build: {
    // Bundles go to /static so they never collide with the catalogue images in /assets.
    assetsDir: 'static',
    rollupOptions: {
      // Two separate pages: the public storefront and the owner control room, each with its own styles.
      input: { store: 'index.html', admin: 'admin.html' },
    },
  },
  server: {
    proxy: {
      '/api': api,
      '/uploads': api,
      '/health': api,
    },
  },
});
