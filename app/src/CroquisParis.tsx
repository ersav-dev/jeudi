import { useMemo, useState } from 'react'
import {
  ZONES_CROQUIS,
  CHEMINS_ZONES,
  TRAIT_SEINE,
  TRAIT_PERIPH,
  compterSpotsZones,
} from './croquisZones'

// ════════════════════════════════════════════════════════════════
// jeudi. — LE CROQUIS DE PARIS : choisir sa zone comme sur un carnet
// Une mini-carte À L'ENCRE (SVG dessiné, pas MapLibre) : la Seine en un
// trait de crayon, le périph en pointillés, ~8 zones patatoïdes cliquables.
// Chaque zone est mappée sur un repère EXISTANT de « autour de »
// (croquisZones.ts ↔ autour.ts / POINTS_REPERE) : taper une zone = taper
// la chip — même filtre, même état, jamais un doublon de « ma carte ».
// DA V5 : fond transparent, --encre/--graphite seulement, coins non parfaits.
// ════════════════════════════════════════════════════════════════

// l'état replié/déplié survit à la session (et au rechargement PWA)
const CLE_OUVERT = 'jeudi-croquis-ouvert'
function lireOuvert(): boolean {
  try {
    return localStorage.getItem(CLE_OUVERT) !== '0' // ouvert par défaut : montrer la ville
  } catch {
    return true
  }
}

export default function CroquisParis({
  lieux,
  actif,
  onChoisir,
}: {
  /** les lieux visibles (mêmes que la recherche) — on ne lit que lat/lng */
  lieux: { lat: number; lng: number }[]
  /** nom du repère actif (depuis?.nom) — la synchro chips ↔ croquis */
  actif: string | null
  /** tape une zone → le caller bascule le repère (même logique que la chip) */
  onChoisir: (repere: string) => void
}) {
  const [ouvert, setOuvert] = useState(lireOuvert)
  const basculer = () => {
    setOuvert((v) => {
      try {
        localStorage.setItem(CLE_OUVERT, v ? '0' : '1')
      } catch {
        // stockage indisponible (navigation privée) : l'état vit en mémoire
      }
      return !v
    })
  }

  const comptes = useMemo(() => compterSpotsZones(lieux), [lieux])

  return (
    <div>
      <button type="button" className="croquis-entete" onClick={basculer} aria-expanded={ouvert}>
        <span>la ville en un coup d'œil</span>
        <span style={{ opacity: 0.7 }}>{ouvert ? 'replier' : 'déplier'}</span>
      </button>
      <div className={`croquis-cadre${ouvert ? '' : ' plie'}`} aria-hidden={!ouvert}>
        <svg viewBox="0 0 340 260" className="croquis-svg" role="group" aria-label="croquis de paris — tape une zone pour chercher autour">
          {/* le périph : le bord du carnet, en pointillés légers */}
          <path d={TRAIT_PERIPH} fill="none" stroke="var(--graphite)" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 7" strokeLinecap="round" />
          {/* la seine : un trait de crayon, sous les zones */}
          <path d={TRAIT_SEINE} fill="none" stroke="var(--graphite)" strokeWidth="1.4" strokeOpacity="0.55" strokeLinecap="round" />
          {ZONES_CROQUIS.map((z, i) => {
            const n = comptes[z.repere] ?? 0
            const estActif = actif === z.repere
            const vide = n === 0
            return (
              <g
                key={z.repere}
                className="croquis-zone"
                role="button"
                tabIndex={ouvert ? 0 : -1}
                aria-pressed={estActif}
                aria-label={`${z.etiquette} — ${vide ? 'aucun spot' : `${n} spot${n > 1 ? 's' : ''}`}`}
                onClick={() => onChoisir(z.repere)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onChoisir(z.repere)
                  }
                }}
              >
                {/* la zone s'encre quand elle est choisie (remplissage 12 %, trait plein) ;
                    sans spot : trait plus pâle. fill transparent = surface tapable. */}
                <path
                  d={CHEMINS_ZONES[i]}
                  fill={estActif ? 'var(--encre)' : 'transparent'}
                  fillOpacity={estActif ? 0.12 : 1}
                  stroke="var(--encre)"
                  strokeOpacity={estActif ? 1 : vide ? 0.2 : 0.5}
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
                <text
                  x={z.cx}
                  y={z.cy - 1}
                  textAnchor="middle"
                  fontFamily="'Caveat', cursive"
                  fontSize="13"
                  fill="var(--encre)"
                  opacity={estActif ? 1 : vide ? 0.35 : 0.8}
                >
                  {z.etiquette}
                </text>
                {!vide && (
                  <text
                    x={z.cx}
                    y={z.cy + 12}
                    textAnchor="middle"
                    fontFamily="'JetBrains Mono', monospace"
                    fontSize="8.5"
                    fill="var(--encre)"
                    opacity={estActif ? 0.8 : 0.55}
                  >
                    {n}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
