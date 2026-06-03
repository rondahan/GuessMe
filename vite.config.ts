import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isCapacitor = process.env.CAPACITOR === 'true';

  return {
    base: isCapacitor ? './' : '/',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'icon-source.png',
          'favicon-32.png',
          'apple-touch-icon.png',
          'pwa-192.png',
          'pwa-512.png',
        ],
        manifest: {
          name: 'נחש אותי - משחק מסיבה ישראלי',
          short_name: 'נחש אותי',
          description:
            'משחק מסיבה של "מי אני?" עם קטגוריות ישראליות ומולטיפלייר בזמן אמת',
          lang: 'he',
          dir: 'rtl',
          theme_color: '#5b21b6',
          background_color: '#5b21b6',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: 'pwa-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          navigateFallback: 'index.html',
        },
        devOptions: {
          enabled: mode === 'development',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
