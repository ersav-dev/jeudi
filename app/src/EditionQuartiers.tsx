import { useEffect, useRef, useState } from 'react'
import type maplibregl from 'maplibre-gl'
// ════════════════════════════════════════════════════════════════
// jeudi. — LE MODE ÉDITION : la forme, et rien que la forme.
//
// Ersan, 14/08 : « en mode édition, on doit pouvoir créer de nouveaux ou
// alors supprimer ou modifier les autres. Et si on clique sur un angle, on
// doit voir quel type d'angle on veut. »
//
// Donc quatre gestes, et pas un de plus :
//   · GLISSER une poignée      → le point suit le doigt ;
//   · TAPER une poignée        → le choix de l'angle : droit · doux · retirer ;
//   · TAPER un « + » de milieu → un point de plus, doux (on épouse la courbe) ;
//   · la barre du bas          → changer de zone, en créer une, raturer, finir.
//
// LA CARTE RESTE VIVANTE. C'est la différence avec le mode dessin, qui la
// gèle : ici on édite EN SITUATION, on doit pouvoir aller voir la rue d'à
// côté. Le calque ne prend donc aucun événement (pointer-events: none) — ce
// sont les poignées, et elles seules, qui en prennent. Les poignées se
// re-projettent à chaque `move` : elles collent au sol, pas à l'écran.
//
// Le langage des poignées vient de la planche 6, sans traduction :
//   CARRÉ = angle dur (net, la courbe casse) · ROND = angle doux (elle passe).
// On ne l'écrit nulle part comme une légende : la forme du point EST sa
// légende, et le choix qui s'ouvre au tap le redit en toutes lettres.
//
// Ce qu'on n'enregistre PAS à chaque frame : la zone ne s'écrit qu'à la fin
// du geste (lâché du doigt, tap sur un choix). Pendant qu'on tire, seul le
// tracé bouge — les rues teintées, elles, attendent qu'on ait lâché.
// ════════════════════════════════════════════════════════════════
import { t } from './langue'
import {
  ENCRES, contour, milieux, poserAngle, deplacerPoint, ajouterPointApres,
  retirerPoint, pointsSaisissables, type PointZone, type Quartier,
} from './quartiers'

/** en deçà, le doigt n'a pas glissé : c'est un tap, on ouvre le choix */
const SEUIL_TAP_PX = 7
/** un « + » ne s'affiche que si le segment est assez long pour lui —
    sinon il mange les deux poignées qu'il sépare */
const PLACE_MILIEU_PX = 54
/** la rature tenue, comme dans la fiche : le geste EST la confirmation */
const DUREE_RATURE_MS = 700

type Point = { x: number; y: number }

export default function EditionQuartiers({
  carteRef,
  zones,
  depart,
  onMaj,
  onRature,
  onNouvelle,
  onFini,
}: {
  /** la REF de la carte : on ne lit `.current` que dans les gestionnaires
      et les effets, jamais pendant le rendu */
  carteRef: React.RefObject<maplibregl.Map | null>
  zones: Quartier[]
  /** la zone par laquelle on entre (celle dont on a ouvert la fiche) */
  depart: Quartier
  onMaj: (q: Quartier) => void
  onRature: (q: Quartier) => void
  onNouvelle: () => void
  onFini: () => void
}) {
  const [cible, setCible] = useState(depart.id)
  const [points, setPoints] = useState<PointZone[]>(depart.points)
  // le choix d'angle ouvert : l'indice du point touché
  const [choix, setChoix] = useState<number | null>(null)
  const [tire, setTire] = useState<number | null>(null)

  const zone = zones.find((z) => z.id === cible) ?? depart
  const teinte = ENCRES.find((e) => e.id === zone.encre)?.hex ?? '#8E76B4'

  // ── la projection : recalculée à chaque `move` de la carte ──────────
  // Les poignées sont posées au SOL. On garde leurs positions écran en
  // state (jamais lues depuis la ref pendant le rendu).
  const [ecran, setEcran] = useState<{
    pts: Point[]; mil: Point[]; d: string; pris: number[]; milPris: number[]
  }>({ pts: [], mil: [], d: '', pris: [], milPris: [] })
  useEffect(() => {
    const m = carteRef.current
    if (!m) return
    const projeter = () => {
      const p = (q: PointZone): Point => {
        const e = m.project([q.lng, q.lat])
        return { x: e.x, y: e.y }
      }
      const trace = points.length > 2 ? contour(points).map(p) : []
      const pts = points.map(p)
      setEcran({
        pts,
        mil: points.length > 2 ? milieux(points).map(p) : [],
        d: trace.length ? `M ${trace.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' L ')} Z` : '',
        // les points trop serrés à ce zoom n'ont pas de poignée : deux
        // pastilles qui se chevauchent ne s'attrapent pas (règle des 32 px)
        pris: points.length > 2 ? pointsSaisissables(points, m.getZoom()) : points.map((_, i) => i),
        // et un « + » n'apparaît que si le segment a la place de l'accueillir
        milPris: pts
          .map((a, i) => {
            const b = pts[(i + 1) % pts.length]
            return Math.hypot(b.x - a.x, b.y - a.y) >= PLACE_MILIEU_PX ? i : -1
          })
          .filter((i) => i >= 0),
      })
    }
    projeter()
    m.on('move', projeter)
    return () => {
      m.off('move', projeter)
    }
  }, [points, carteRef])

  // ── glisser / taper une poignée ─────────────────────────────────────
  const glisse = useRef<{ i: number; x0: number; y0: number; bouge: boolean } | null>(null)
  const ecrire = (pts: PointZone[]) => onMaj({ ...zone, points: pts })

  const prendre = (i: number) => (e: React.PointerEvent) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    glisse.current = { i, x0: e.clientX, y0: e.clientY, bouge: false }
    setChoix(null)
    setTire(i)
  }
  const tirer = (e: React.PointerEvent) => {
    const g = glisse.current
    if (!g) return
    if (!g.bouge && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < SEUIL_TAP_PX) return
    g.bouge = true
    const m = carteRef.current
    if (!m) return
    const r = m.getContainer().getBoundingClientRect()
    const l = m.unproject([e.clientX - r.left, e.clientY - r.top])
    setPoints((p) => deplacerPoint(p, g.i, { lng: l.lng, lat: l.lat }))
  }
  const lacher = () => {
    const g = glisse.current
    glisse.current = null
    setTire(null)
    if (!g) return
    // glissé → on écrit la nouvelle forme ; tapé → on ouvre le choix d'angle
    if (g.bouge) ecrire(points)
    else setChoix(g.i)
  }

  // ── les gestes discrets (angle, ajout, retrait) ─────────────────────
  const appliquer = (pts: PointZone[]) => {
    setPoints(pts)
    ecrire(pts)
    setChoix(null)
  }
  const ajouter = (i: number) => appliquer(ajouterPointApres(points, i))

  // ── la rature tenue ─────────────────────────────────────────────────
  const [tenu, setTenu] = useState(false)
  const minuteur = useRef<number | null>(null)
  const tenir = () => {
    setTenu(true)
    minuteur.current = window.setTimeout(() => {
      setTenu(false)
      onRature(zone)
    }, DUREE_RATURE_MS)
  }
  const relacher = () => {
    setTenu(false)
    if (minuteur.current) {
      window.clearTimeout(minuteur.current)
      minuteur.current = null
    }
  }
  useEffect(() => relacher, [])

  const changerDeZone = (z: Quartier) => {
    setCible(z.id)
    setPoints(z.points)
    setChoix(null)
  }
  const dur = choix !== null && points[choix]?.dur === true

  return (
    <div className="edition-quartiers" style={{ ['--enc' as string]: teinte }}>
      {/* le bandeau : on sait qu'on édite, et laquelle */}
      <div className="edition-bandeau">
        <span>
          {t('tu modifies')} « {zone.nom.trim() || '· · ·'} » — {t('tire un point, ou tape-le')}
        </span>
        <button className="lien" onClick={onFini}>
          {t('terminé')}
        </button>
      </div>

      {/* le calque : il ne prend RIEN, la carte reste vivante dessous */}
      <div className="edition-calque">
        <svg className="edition-trace">
          {ecran.d && <path d={ecran.d} className="edition-forme" />}
        </svg>

        {/* les « + » de milieu : un point de plus, là où il manque */}
        {ecran.mil.map((p, i) =>
          ecran.milPris.includes(i) ? (
            <button
              key={`m${i}`}
              className="edition-milieu"
              style={{ left: p.x, top: p.y }}
              aria-label={t('ajouter un point ici')}
              onClick={() => ajouter(i)}
            />
          ) : null,
        )}

        {/* les poignées : CARRÉ = dur, ROND = doux */}
        {ecran.pts.map((p, i) =>
          ecran.pris.includes(i) ? (
            <button
              key={`p${i}`}
              className={`edition-poignee${points[i]?.dur ? ' dure' : ''}${tire === i ? ' tiree' : ''}${choix === i ? ' ouverte' : ''}`}
              style={{ left: p.x, top: p.y }}
              aria-label={points[i]?.dur ? t('angle droit') : t('angle doux')}
              onPointerDown={prendre(i)}
              onPointerMove={tirer}
              onPointerUp={lacher}
              onPointerCancel={lacher}
              onContextMenu={(ev) => ev.preventDefault()}
            >
              <i aria-hidden />
            </button>
          ) : null,
        )}

        {/* le choix d'angle, posé au point touché */}
        {choix !== null && ecran.pts[choix] && (
          <div
            // il se pose AU point — mais il ne sort jamais de l'écran : bridé
            // sur les côtés, et retourné dessous quand le point est trop haut
            className={`edition-choix${ecran.pts[choix].y < 190 ? ' dessous' : ''}`}
            style={{
              left: Math.min(Math.max(ecran.pts[choix].x, 92), window.innerWidth - 92),
              top: ecran.pts[choix].y,
            }}
          >
            <button
              className={`ch-angle${dur ? ' choisi' : ''}`}
              aria-pressed={dur}
              onClick={() => appliquer(poserAngle(points, choix, true))}
            >
              <i className="ch-carre" aria-hidden />
              {t('angle droit')}
            </button>
            <button
              className={`ch-angle${dur ? '' : ' choisi'}`}
              aria-pressed={!dur}
              onClick={() => appliquer(poserAngle(points, choix, false))}
            >
              <i className="ch-rond" aria-hidden />
              {t('angle doux')}
            </button>
            <button
              className="ch-retirer"
              disabled={points.length <= 3}
              onClick={() => appliquer(retirerPoint(points, choix))}
            >
              {points.length <= 3 ? t('il faut trois points') : t('retirer ce point')}
            </button>
          </div>
        )}
      </div>

      {/* la barre du bas : les autres zones, en créer une, raturer celle-ci */}
      <div className="edition-barre">
        {zones.length > 1 && (
          <div className="edition-zones">
            {zones.map((z) => (
              <button
                key={z.id}
                className={`edition-zone${z.id === cible ? ' ici' : ''}`}
                style={{ ['--z' as string]: ENCRES.find((e) => e.id === z.encre)?.hex }}
                aria-pressed={z.id === cible}
                onClick={() => changerDeZone(z)}
              >
                {z.nom.trim() || '· · ·'}
              </button>
            ))}
          </div>
        )}
        <div className="edition-actes">
          <button className="edition-neuve" onClick={onNouvelle}>
            {t('nouvelle zone')}
          </button>
          <button
            className={`edition-rature${tenu ? ' tenu' : ''}`}
            onPointerDown={tenir}
            onPointerUp={relacher}
            onPointerLeave={relacher}
            onPointerCancel={relacher}
            onContextMenu={(ev) => ev.preventDefault()}
          >
            {t('raturer celle-ci')}
            <i aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
