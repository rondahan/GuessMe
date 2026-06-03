import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync, existsSync } from 'node:fs';
import path from 'path';
import { defineConfig } from 'vite';

function loadAppVersion(root: string) {
  const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  const versionFile = path.join(root, 'version.json');
  if (existsSync(versionFile)) {
    const v = JSON.parse(readFileSync(versionFile, 'utf8'));
    return {
      version: v.version ?? pkg.version,
      build: v.build ?? 'dev',
      git: v.git ?? 'local',
    };
  }
  return { version: pkg.version, build: 'dev', git: 'local' };
}

export default defineConfig(({ mode }) => {
  const isCapacitor = process.env.CAPACITOR === 'true';
  const appVersion = loadAppVersion(__dirname);

  return {
    base: isCapacitor ? './' : '/',
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion.version),
      'import.meta.env.VITE_APP_BUILD': JSON.stringify(appVersion.build),
      'import.meta.env.VITE_APP_GIT': JSON.stringify(appVersion.git),
    },
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
