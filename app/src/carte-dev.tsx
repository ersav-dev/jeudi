// ── banc d'essai DEV de la carte ─────────────────────────────────────
// monte <Carte> seule avec les 75 lieux du seed Ersan : permet de tester
// le clustering/la chorégraphie sans auth ni onboarding.
// servi par vite en dev via /carte-dev.html — JAMAIS inclus au build
// (aucune référence depuis index.html ; page dev volontairement orpheline).
/* eslint-disable react-refresh/only-export-components -- page dev orpheline,
   le fast-refresh n'a pas d'importance ici */
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Carte from './Carte'
import ERSAN from './ersan'
import type { Lieu } from './db'
import 'maplibre-gl/dist/maplibre-gl.css'
import './index.css'

// ── comparateur de styles de grappes : commute une classe sur <body>,
// les variantes CSS (index.css « variantes de grappes ») font le reste.
const STYLES_GRAPPES = [
  { cle: '', nom: 'actuel' },
  { cle: 'grappes-anneau', nom: 'anneau' },
  { cle: 'grappes-pile', nom: 'tas de pins' },
] as const

function SelecteurGrappes() {
  const [actif, setActif] = useState('')
  const choisir = (cle: string) => {
    document.body.classList.remove('grappes-anneau', 'grappes-pile')
    if (cle) document.body.classList.add(cle)
    setActif(cle)
  }
  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        left: 10,
        zIndex: 50,
        display: 'flex',
        gap: 6,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      }}
    >
      {STYLES_GRAPPES.map((s) => (
        <button
          key={s.cle}
          onClick={() => choisir(s.cle)}
          style={{
            padding: '5px 9px',
            borderRadius: 'var(--rayon)',
            cursor: 'pointer',
            border: '1px solid rgba(239, 233, 216, 0.4)',
            background: actif === s.cle ? 'var(--encre)' : 'rgba(20, 18, 14, 0.85)',
            color: actif === s.cle ? 'var(--nuit)' : 'var(--encre)',
          }}
        >
          {s.nom}
        </button>
      ))}
    </div>
  )
}

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
      <SelecteurGrappes />
      <Carte lieux={lieux} />
    </div>
  </StrictMode>,
)
