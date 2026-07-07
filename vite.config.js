import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  server: {
    host: true,
    port: 5173,
    open: true
  },
  resolve: {
    alias: {
      '@': '/src',
      '@core': '/src/core',
      '@systems': '/src/systems',
      '@stores': '/src/stores',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@data': '/src/data',
      '@utils': '/src/utils',
    }
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: true,
  }
});
