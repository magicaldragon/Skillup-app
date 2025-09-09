import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react({
      // Enable SWC for faster builds
      jsxRuntime: 'automatic',
      // Exclude node_modules from processing to speed up dev
      exclude: /node_modules/,
    })
  ],
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
    // Disable source maps in production for faster loading
    sourcemap: false,
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        experimentalMinChunkSize: 500,
        manualChunks: (id) => {
          // Critical libraries - separate chunks for better caching
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
          // Dashboard components - separate chunks for lazy loading
          if (id.includes('AdminDashboard') || id.includes('admin-debug')) {
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
        // Optimize chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '') || 'chunk' : 'chunk';
          return `assets/js/[name]-${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || 'asset';
          const info = name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/img/[name]-[hash].[ext]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash].[ext]`;
          }
          return `assets/[ext]/[name]-[hash].[ext]`;
        },
      },
    },
    // Aggressive minification for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 800,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Enable compression reporting
    reportCompressedSize: false, // Disable to speed up build
    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    // Target modern browsers for smaller bundles
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
  },
  // Optimize dependencies for faster cold starts
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-dom/client',
      'react/jsx-runtime',
      'firebase/app', 
      'firebase/auth',
      'firebase/firestore',
      'react-icons/fa',
      'react-icons/md',
      'react-icons/io',
      'date-fns',
      'chart.js',
      'react-chartjs-2'
    ],
    exclude: ['firebase-admin'],
    // Force optimization of specific dependencies
    force: true,
  },
  // Enable compression and performance optimizations
  preview: {
    port: 4173,
    host: true,
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
  // Performance improvements
  esbuild: {
    target: 'es2020',
    drop: ['console', 'debugger'],
  },
});
