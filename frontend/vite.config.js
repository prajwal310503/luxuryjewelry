import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function apiProxyTarget() {
  const raw = process.env.VITE_API_URL;
  if (!raw) return 'http://localhost:8000';
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}`;
  } catch {
    return String(raw).replace(/\/api\/?$/, '') || 'http://localhost:8000';
  }
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@admin': path.resolve(__dirname, './src/admin'),
      '@vendor': path.resolve(__dirname, './src/vendor'),
    },
  },
  build: {
    outDir: 'dist/client',
  },
  ssr: {
    noExternal: ['react-helmet-async'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiProxyTarget(),
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
