/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA (Etapa 6): instalável, offline completo (precache de todo o build) e aviso de nova versão.
    VitePWA({
      registerType: 'prompt',
      injectRegister: null, // registrado em src/ui/pwa.ts (com tratamento de erro)
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Vida de Lutador',
        short_name: 'Lutador',
        description: 'Simulador de vida focado na carreira de lutador: escola, lutas, família, dinheiro e legado.',
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
    // 3D (three + R3F) em chunk próprio, carregado sob demanda; na versão de teste em arquivo único
    // (VITE_SINGLE_FILE) tudo vai num só JS.
    chunkSizeWarningLimit: 800,
    ...(process.env.VITE_SINGLE_FILE ? { rolldownOptions: { output: { codeSplitting: false } } } : {}),
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
