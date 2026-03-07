import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  site: 'https://mytaya.com',
  i18n: {
    locales: ['tl', 'en'],
    defaultLocale: 'tl',
    fallback: { en: 'tl' },
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'tl',
        locales: { tl: 'fil-PH', en: 'en-PH' },
      },
    }),
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MyTaya - Mga Hula sa Sports',
        short_name: 'MyTaya',
        description: 'Mga tamang hula sa basketball, football, at boxing para sa Filipino',
        theme_color: '#0F766E',
        background_color: '#0A0A0A',
        display: 'standalone',
        start_url: '/tl/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        navigateFallback: '/404',
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
