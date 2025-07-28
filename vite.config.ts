import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
