import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup/popup.html'),
        background: resolve(__dirname, 'background.js'),
        linkedin: resolve(__dirname, 'content-scripts/linkedin.js'),
        indeed: resolve(__dirname, 'content-scripts/indeed.js'),
        naukri: resolve(__dirname, 'content-scripts/naukri.js'),
        autoscroll: resolve(__dirname, 'content-scripts/auto-scroll.js'),
        hiringpost: resolve(__dirname, 'content-scripts/hiring-post.js'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name][extname]',
        manualChunks: (id) => {
          // Only chunk node_modules into vendor. src/ stays inline
          // so background.js and content-scripts are self-contained.
          if (id.includes('node_modules')) return 'vendor';
          return undefined;
        }
      },
      preserveEntrySignatures: 'strict'
    },
    sourcemap: false,
    minify: 'terser'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
