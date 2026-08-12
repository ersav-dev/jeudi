/// <reference lib="webworker" />
// ════════════════════════════════════════════════════════════════
// jeudi. — LE SERVICE WORKER (chantier push, 12/08/2026)
//
// Avant : vite-plugin-pwa en mode generateSW (Workbox généré, aucun
// listener possible). Ici : le mode injectManifest — CE fichier est
// le service worker, et il doit refaire À L'IDENTIQUE ce que
// generateSW produisait (précache, purge, update-flow du toast),
// PLUS recevoir le push. Le piège n°1 du cadrage vit ici : le SW
// porte aussi la mise à jour de l'app — chaque bloc « comme avant »
// est commenté avec ce qu'il remplace.
// ════════════════════════════════════════════════════════════════
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { NavigationRoute, registerRoute } from 'workbox-routing'

// le vrai type du SW + la liste de précache que vite-plugin-pwa injecte
declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Parameters<typeof precacheAndRoute>[0]
}

// ── comme avant : le précache du build entier ───────────────────
// (self.__WB_MANIFEST est injecté au build par vite-plugin-pwa — la
// liste des fichiers vient de injectManifest.globPatterns, comme les
// globPatterns de l'ancien mode.)
precacheAndRoute(self.__WB_MANIFEST)

// comme avant (cleanupOutdatedCaches: true) : purge les précaches des
// anciens builds — sous le budget storage riquiqui d'iOS, une éviction
// fait 404 un chunk précaché → bundle qui ne charge pas → écran blanc.
cleanupOutdatedCaches()

// comme avant (clientsClaim: true) : le SW prend la main sur l'onglet
// dès son activation — offline dès la première visite.
clientsClaim()

// comme avant (navigateFallback par défaut de generateSW) : SPA — toute
// navigation sert index.html précaché (y compris /sortie/<token>, la
// page publique du match : c'est la même app, routée côté client).
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// comme avant (registerType: 'prompt') : le toast « nouvelle version »
// (App.tsx) envoie SKIP_WAITING via updateServiceWorker(true) — on ne
// recharge JAMAIS tout seul (iOS standalone : reload programmatique au
// boot = écran blanc, bug WebKit connu).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') void self.skipWaiting()
})

// (Les NetworkOnly de l'ancien runtimeCaching — Supabase, Nominatim,
// tuiles carto — n'ont pas d'équivalent à écrire : un SW custom ne
// touche QUE ce pour quoi une route est posée. Pas de route = réseau
// direct, exactement le comportement voulu.)

// ── LE NOUVEAU : recevoir le push ───────────────────────────────
// Le contrat de charge utile (fixé avec l'Edge Function envoyer-push) :
//   { titre, corps, url?, tag? }
// tag : deux pushs de même tag se REMPLACENT au lieu de s'empiler —
// jeudi ne harcèle pas, même dans le centre de notifications du
// téléphone. Un push illisible n'affiche RIEN (jamais de notification
// « undefined » — silence plutôt que bruit).
self.addEventListener('push', (event) => {
  let charge: { titre?: string; corps?: string; url?: string; tag?: string }
  try {
    charge = event.data?.json() ?? {}
  } catch {
    return
  }
  if (!charge.titre) return
  event.waitUntil(
    self.registration.showNotification(charge.titre, {
      body: charge.corps ?? '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: charge.tag ?? 'jeudi',
      data: { url: charge.url ?? '/' },
    }),
  )
})

// le tap : on RÉUTILISE une fenêtre déjà ouverte (la PWA installée)
// plutôt que d'en empiler une neuve — sinon on l'ouvre au bon endroit.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url: string = event.notification.data?.url ?? '/'
  event.waitUntil(
    (async () => {
      const fenetres = (await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })) as WindowClient[]
      const deja = fenetres[0]
      if (deja) {
        await deja.focus()
        // on navigue seulement si le push visait un endroit précis
        if (url !== '/') await deja.navigate(url)
        return
      }
      await self.clients.openWindow(url)
    })(),
  )
})
