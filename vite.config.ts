import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
    // Added proxy to route /api calls to Firebase Functions during dev
    proxy: {
      '/api': {
        target: 'https://us-central1-skillup-3beaf.cloudfunctions.net',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Enable source maps for debugging (disable in production)
    sourcemap: process.env.NODE_ENV === 'development',
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Only create chunks for actual dependencies
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('react-icons')) {
              return 'vendor-icons';
            }
            // Group other node_modules into vendor
            return 'vendor';
          }
        },
        // Optimize chunk naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // Enable minification
    minify: 'terser',
    // Optimize CSS
    cssCodeSplit: true,
    // Enable compression
    reportCompressedSize: true,
    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/]
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/auth'],
    exclude: ['@google/genai']
  },
  // Enable compression
  preview: {
    port: 4173,
    host: true
  }
});
