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
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name][extname]'
      }
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
