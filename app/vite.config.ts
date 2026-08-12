import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' (pas 'autoUpdate') : on ne recharge JAMAIS la page tout seul.
      // Sur iOS standalone, le reload programmatique déclenché par un SW qui
      // prend la main au boot = écran blanc (bug WebKit connu). À la place, App
      // affiche un toast « nouvelle version » ; le reload se fait sur le clic.
      registerType: 'prompt',
      // CHANTIER PUSH (12/08) : generateSW ne peut pas recevoir de push →
      // on écrit NOTRE service worker (src/sw.ts). Il refait tout ce que
      // l'ancien mode générait (précache, purge, update-flow) — chaque
      // option Workbox d'avant y est reportée et commentée.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
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
      // les options Workbox restantes — celles qui pilotent l'INJECTION du
      // manifest de précache dans src/sw.ts. Le reste (cleanupOutdatedCaches,
      // clientsClaim, SPA fallback, l'ex-runtimeCaching NetworkOnly) vit
      // désormais DANS sw.ts, commenté ligne à ligne.
      injectManifest: {
        // precache : tout le build + le public (fonts, icônes)
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2}'],
        // og.png ne sert qu'aux scrapers (WhatsApp…) — inutile de le précacher
        globIgnores: ['**/og.png'],
        // le chunk Carte dépasse le plafond par défaut (2 Mo) — marge
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
})
