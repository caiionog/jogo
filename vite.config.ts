/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  // versão do jogo exibida em Configurações (release 0.0.1)
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    tailwindcss(),
    // PWA (Etapa 6): instalável, offline completo (precache de todo o build) e aviso de nova versão.
    VitePWA({
      registerType: 'prompt',
      injectRegister: null, // registrado em src/ui/pwa.ts (com tratamento de erro)
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Vida Real',
        short_name: 'Vida Real',
        description: 'Simulador de vida: escola, faculdade, trabalho, esporte, lutas, família, dinheiro e legado.',
        lang: 'pt-BR',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#020617',
        theme_color: '#0f172a',
        categories: ['games', 'simulation'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  build: {
    // Bundle único de propósito (versão de teste em arquivo único + precache offline): ~290 KB gzip na 0.0.1.
    // Na versão em arquivo único (VITE_SINGLE_FILE) tudo vai num só JS.
    chunkSizeWarningLimit: 1200,
    ...(process.env.VITE_SINGLE_FILE ? { rolldownOptions: { output: { codeSplitting: false } } } : {}),
  },
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    environment: 'node',
    // varreduras pesadas (encaixe de roupa do pixel art) passam de 5 s com a suíte inteira em paralelo
    testTimeout: 30_000,
    // o módulo virtual do PWA não resolve no Windows durante os testes: um stub basta (o SW não roda no jsdom)
    alias: { 'virtual:pwa-register': fileURLToPath(new URL('./tests/stubs/pwa-register.ts', import.meta.url)) },
  },
});
