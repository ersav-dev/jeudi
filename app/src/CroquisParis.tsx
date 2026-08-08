import { useMemo, useState } from 'react'
import {
  ZONES_CROQUIS,
  CHEMINS_ZONES,
  MONUMENTS_CROQUIS,
  TRAIT_SEINE,
  TRAIT_PERIPH,
  CHEMIN_MARQUEUR,
  compterSpotsZones,
  poserMarqueur,
} from './croquisZones'
import { t } from './langue'

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
  eauActive = false,
  onEau,
  marqueur = null,
}: {
  /** les lieux visibles (mêmes que la recherche) — lat/lng + le tag sur-l'eau */
  lieux: { lat: number; lng: number; surLeau?: boolean }[]
  /** nom du repère actif (depuis?.nom) — la synchro chips ↔ croquis */
  actif: string | null
  /** tape une zone → le caller bascule le repère (même logique que la chip) */
  onChoisir: (repere: string) => void
  /** la Seine n'est pas une zone, c'est un RUBAN : la taper filtre les spots
   *  « sur l'eau » (péniches, guinguettes, quais) — même état que la chip */
  eauActive?: boolean
  onEau?: () => void
  /** le lieu géocodé (un métro tapé, une adresse) : un signe se pose sur le
   *  croquis à l'endroit reconnu — l'accusé de réception spatial. Les zones
   *  s'encrent déjà toutes seules : ce marqueur est pour les points LIBRES. */
  marqueur?: { nom: string; lat: number; lng: number } | null
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
  const nbEau = useMemo(() => lieux.filter((l) => l.surLeau).length, [lieux])

  // le lieu reconnu, posé sur le dessin (+ où écrire son nom sans sortir
  // du cadre : ancre horizontale, au-dessus si le signe touche le bas)
  const pose = useMemo(() => {
    if (!marqueur) return null
    const m = poserMarqueur(marqueur.lat, marqueur.lng)
    return {
      ...m,
      ancre: (m.x < 45 ? 'start' : m.x > 295 ? 'end' : 'middle') as 'start' | 'end' | 'middle',
      dyNom: m.y > 230 ? -14 : 21,
    }
  }, [marqueur])

  // le croquis en PLEIN ÉCRAN : même dessin, mêmes zones tapables — taper
  // un quartier filtre ET referme (on retombe sur les résultats)
  const [plein, setPlein] = useState(false)
  const choisirZone = (repere: string) => {
    onChoisir(repere)
    if (plein) setPlein(false)
  }
  const choisirEau = onEau
    ? () => {
        onEau()
        if (plein) setPlein(false)
      }
    : undefined

  return (
    <div>
      <button type="button" className="croquis-entete" onClick={basculer} aria-expanded={ouvert}>
        <span>{t("la ville en un coup d'œil")}</span>
        <span style={{ opacity: 0.7 }}>{ouvert ? t('replier') : t('déplier')}</span>
      </button>
      <div
        className={`croquis-cadre${ouvert || plein ? '' : ' plie'}${plein ? ' croquis-plein' : ''}`}
        aria-hidden={!ouvert && !plein}
      >
        {/* la flèche plein écran (bas droite) — et la même pour ranger */}
        <button
          type="button"
          className="croquis-agrandir"
          aria-label={plein ? t('réduire le croquis') : t('agrandir le croquis')}
          onClick={() => setPlein((v) => !v)}
        >
          {plein ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
            </svg>
          )}
        </button>
        <svg viewBox="0 0 340 260" className="croquis-svg" role="group" aria-label="croquis de paris — tape une zone pour chercher autour">
          {/* le périph : le bord du carnet, en pointillés légers */}
          <path d={TRAIT_PERIPH} fill="none" stroke="var(--graphite)" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 7" strokeLinecap="round" />
          {/* la seine : un trait de crayon, sous les zones — et un QUARTIER
              LIQUIDE : la taper filtre les spots « sur l'eau ». Le trait
              visible s'encre quand le filtre est posé ; la surface tapable
              est un trait invisible bien plus gras (un doigt, de nuit). */}
          <g
            className="croquis-zone"
            role="button"
            tabIndex={(ouvert || plein) && onEau ? 0 : -1}
            aria-pressed={eauActive}
            aria-label={`la seine — sur l'eau, ${nbEau} spot${nbEau > 1 ? 's' : ''}`}
            onClick={choisirEau}
            onKeyDown={(e) => {
              if (choisirEau && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                choisirEau()
              }
            }}
          >
            <path
              d={TRAIT_SEINE}
              fill="none"
              stroke={eauActive ? 'var(--encre)' : 'var(--graphite)'}
              strokeWidth={eauActive ? 2 : 1.4}
              strokeOpacity={eauActive ? 0.9 : 0.55}
              strokeLinecap="round"
            />
            {/* la hitbox : même tracé, invisible, 16px d'épaisseur */}
            <path d={TRAIT_SEINE} fill="none" stroke="transparent" strokeWidth="16" pointerEvents="stroke" />
            {/* l'étiquette couchée le long du fleuve, aval de bercy */}
            <text
              x={300}
              y={219}
              textAnchor="middle"
              fontFamily="'Caveat', cursive"
              fontSize="12"
              fill="var(--encre)"
              opacity={eauActive ? 1 : 0.55}
              transform="rotate(30.5 300 219)"
            >
              la seine
            </text>
            {nbEau > 0 && (
              <text
                x={300}
                y={230}
                textAnchor="middle"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="8.5"
                fill="var(--encre)"
                opacity={eauActive ? 0.8 : 0.45}
                transform="rotate(30.5 300 230)"
              >
                {nbEau}
              </text>
            )}
          </g>
          {/* les monuments : des gribouillis dans la marge — décoratifs, jamais
              cliquables. À LA COULEUR DU MEMBRE (--red suit la couleur choisie
              à l'onboarding/réglages) : ses repères, son encre à lui. */}
          {MONUMENTS_CROQUIS.map((m) => (
            <g key={m.nom} transform={`translate(${m.x} ${m.y})`} pointerEvents="none">
              <title>{m.nom}</title>
              <path
                d={m.chemin}
                fill="none"
                stroke="var(--red)"
                strokeOpacity="0.65"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}
          {ZONES_CROQUIS.map((z, i) => {
            const n = comptes[z.repere] ?? 0
            const estActif = actif === z.repere
            const vide = n === 0
            return (
              <g
                key={z.repere}
                className="croquis-zone"
                role="button"
                tabIndex={ouvert || plein ? 0 : -1}
                aria-pressed={estActif}
                aria-label={`${z.etiquette} — ${vide ? 'aucun spot' : `${n} spot${n > 1 ? 's' : ''}`}`}
                onClick={() => choisirZone(z.repere)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    choisirZone(z.repere)
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
          {/* le signe de la recherche : le lieu géocodé (métro, adresse) est
              ENTOURÉ au crayon, à l'encre du membre — l'accusé de réception
              spatial (« comme ça on est sûr »). Hors du carnet : une flèche
              au bord, tournée vers lui. Pas cliquable : c'est une réponse.
              key = nom → le coup de crayon se rejoue à chaque nouveau lieu. */}
          {marqueur && pose && (
            <g key={marqueur.nom} transform={`translate(${pose.x.toFixed(1)} ${pose.y.toFixed(1)})`} pointerEvents="none">
              <g className="croquis-marqueur">
                <title>{marqueur.nom}</title>
                {pose.dedans ? (
                  <>
                    <path
                      d={CHEMIN_MARQUEUR}
                      fill="none"
                      stroke="var(--red)"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle r="1.6" fill="var(--red)" />
                  </>
                ) : (
                  <path
                    d="M -2.5 -5 L 5 0 L -2.5 5"
                    fill="none"
                    stroke="var(--red)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform={`rotate(${pose.angle.toFixed(0)})`}
                  />
                )}
                <text
                  x={0}
                  y={pose.dyNom}
                  textAnchor={pose.ancre}
                  fontFamily="'Caveat', cursive"
                  fontSize="12"
                  fill="var(--red)"
                  opacity="0.9"
                >
                  {marqueur.nom}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}
