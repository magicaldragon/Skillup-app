import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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
          // Core React libraries
          if (id.includes('react') || id.includes('react-dom')) {
            return 'vendor-react';
          }
          // Firebase libraries
          if (id.includes('firebase')) {
            return 'vendor-firebase';
          }
          // Router libraries
          if (id.includes('react-router')) {
            return 'vendor-router';
          }
          // Icons and UI libraries
          if (id.includes('react-icons') || id.includes('chart.js')) {
            return 'vendor-ui';
          }
          // Other node_modules
          if (id.includes('node_modules')) {
            return 'vendor-utils';
          }
          // Dashboard components - split into separate chunks
          if (id.includes('AdminDashboard')) {
            return 'admin-dashboard';
          }
          if (id.includes('TeacherDashboard')) {
            return 'teacher-dashboard';
          }
          if (id.includes('StudentDashboard')) {
            return 'student-dashboard';
          }
          // Panel components
          if (id.includes('Panel.tsx') || id.includes('Panel.ts')) {
            return 'panels';
          }
        },
        // Optimize chunk naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Set chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Optimize CSS
    cssCodeSplit: true,
    // Enable compression
    reportCompressedSize: true,
    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      'firebase/app', 
      'firebase/auth',
      'firebase/firestore',
      'react-icons/fa',
      'react-icons/md',
      'react-icons/io',
      'date-fns'
    ],
    exclude: ['firebase-admin']
  },
  // Enable compression
  preview: {
    port: 4173,
    host: true,
  },
});
