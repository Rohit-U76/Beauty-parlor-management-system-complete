import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching for data files to prevent reload loops
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: [
          '**/data/**',
          '**/data/db.json',
          '**\\data\\**',
          '**\\data\\db.json',
          '**/dist/**',
          '**/.git/**',
          /[\\/]data([\\/]|$)/,
          /db\.json/
        ]
      },
    },
  };
});
