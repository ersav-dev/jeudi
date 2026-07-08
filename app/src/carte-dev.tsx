// ── banc d'essai DEV de la carte ─────────────────────────────────────
// monte <Carte> seule avec les 75 lieux du seed Ersan : permet de tester
// le clustering/la chorégraphie sans auth ni onboarding.
// servi par vite en dev via /carte-dev.html — JAMAIS inclus au build
// (aucune référence depuis index.html ; page dev volontairement orpheline).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Carte from './Carte'
import ERSAN from './ersan'
import type { Lieu } from './db'
import 'maplibre-gl/dist/maplibre-gl.css'
import './index.css'

const lieux: Lieu[] = ERSAN.map((s, i) => ({
  id: `dev-${i}`,
  nom: s.nom,
  lat: s.lat,
  lng: s.lng,
  adresse: s.adresse,
  note: s.note,
  visibilite: 'cercle' as Lieu['visibilite'],
  envies: [],
  compagnies: [],
  photos: [],
  statut: 'a_tester' as Lieu['statut'],
  creeLe: '2026-01-01T00:00:00.000Z',
  source: 'google' as const,
}))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="app" style={{ height: '100dvh' }}>
      <Carte lieux={lieux} />
    </div>
  </StrictMode>,
)
