import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // version DESIGN ALT : port dédié pour tourner à côté de app/ (5173)
  server: { port: 5175 },
  preview: { port: 5175 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // le manifest est généré ici (public/manifest.webmanifest supprimé — une seule source)
      manifest: {
        name: 'jeudi — je dis où.',
        short_name: 'jeudi',
        description: "L'app pour sortir, seul ou accompagné. Ça dit quoi ce soir ?",
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        background_color: '#15130F',
        theme_color: '#15130F',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        // precache : tout le build + le public (fonts, icônes) ; SPA fallback par défaut
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2}'],
        // og.png ne sert qu'aux scrapers (WhatsApp…) — inutile de le précacher
        globIgnores: ['**/og.png'],
        // le chunk Carte dépasse le plafond par défaut (2 Mo) — marge
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            // Supabase (auth + données) : jamais servi depuis le cache
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\//,
            handler: 'NetworkOnly',
          },
          {
            // Nominatim (géocodage) : réseau seulement
            urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\//,
            handler: 'NetworkOnly',
          },
          {
            // tuiles carto : pas de cache SW agressif (le cache HTTP suffit)
            urlPattern: /^https:\/\/[abc]\.basemaps\.cartocdn\.com\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
