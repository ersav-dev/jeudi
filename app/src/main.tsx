import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// maplibre AVANT notre CSS : nos règles gagnent sans !important
import 'maplibre-gl/dist/maplibre-gl.css'
import './index.css'
// les composants vivent dans leurs fichiers depuis le 12/08 (react-refresh) :
// GardeFou = le filet anti-écran-blanc, Racine = l'aiguillage /sortie vs app
import { GardeFou } from './GardeFou'
import { Racine } from './Racine'
import { registerSW } from 'virtual:pwa-register'
import { signalerMajDispo } from './majApp'
import { releverCrash, jalonner, lireCrash, effacerCrash } from './jalon'

// ── journal de bord : relever un éventuel crash de la session précédente,
// puis noter qu'on démarre. 'stable' n'est posé qu'après 15 s de vie.
releverCrash()
jalonner('boot')
setTimeout(() => jalonner('stable'), 15000)

// si la dernière session est morte en route, on l'affiche (bandeau discret,
// HORS React : le crash peut justement concerner React). Tap = disparaît.
const crashPrec = lireCrash()
if (crashPrec) {
  const b = document.createElement('div')
  b.textContent = `jeudi s'est arrêté brusquement la dernière fois (${crashPrec}) — tape pour fermer`
  b.style.cssText =
    'position:fixed;left:8px;right:8px;bottom:8px;z-index:9999;' +
    'background:#A8322A;color:#fff;padding:10px 14px;border-radius:10px;' +
    'font:12px system-ui,-apple-system,sans-serif;text-align:center'
  b.onclick = () => {
    effacerCrash()
    b.remove()
  }
  document.body.appendChild(b)
}

// Service worker — flux de mise à jour CONTRÔLÉ (surtout pas d'autoUpdate
// silencieux). Sur iOS standalone, un reload programmatique au démarrage laisse
// la webview blanche : on ne recharge donc QUE sur un geste utilisateur.
const majSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // une nouvelle version attend → majApp RETIENT l'état (le toast peut
    // monter après ce signal — course du boot) et réveille les écouteurs
    signalerMajDispo()
  },
})
// le toast (App.tsx) demande d'appliquer : skipWaiting + reload, sur le clic.
window.addEventListener('jeudi:applique-maj', () => {
  void majSW(true)
})

// FORCER LA MISE À JOUR (réglages) — le filet quand le service worker s'entête
// à resservir une vieille version : ça arrive surtout sur iOS depuis l'écran
// d'accueil, où la webview garde son cache très longtemps.
// On désinscrit le SW, on vide le cache des FICHIERS, et on recharge avec un
// cache-buster (sans lui, iOS peut resservir le même index.html).
// ⚠ Ça ne touche NI IndexedDB (tes lieux, tes photos) NI localStorage (tes
// réglages, tes marques, ta pile à tester) : seulement les fichiers de l'app.
window.addEventListener('jeudi:forcer-maj', () => {
  void (async () => {
    try {
      const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? []
      await Promise.all(regs.map((r) => r.unregister()))
    } catch {
      /* pas de SW (navigateur privé, http) : on recharge quand même */
    }
    try {
      if ('caches' in window) {
        const noms = await caches.keys()
        await Promise.all(noms.map((n) => caches.delete(n)))
      }
    } catch {
      /* cache inaccessible : idem, le rechargement suffira souvent */
    }
    location.replace(`${location.pathname}?maj=${Date.now()}`)
  })()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GardeFou>
      <Racine />
    </GardeFou>
  </StrictMode>,
)
