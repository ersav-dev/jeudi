import { useEffect, useRef, useState } from 'react'
import type maplibregl from 'maplibre-gl'
// ════════════════════════════════════════════════════════════════
// jeudi. — DESSINER UN QUARTIER : le geste, puis la fiche.
//
// Le lasso (Ersan, 13/08) : on entoure au doigt, d'un seul appui jamais
// levé. La carte ne bouge pas pendant ce temps — ce calque avale les
// événements, donc elle est gelée sans qu'on ait à la désactiver.
//
// Au relâché : le tracé se ferme tout seul et se lisse (Douglas-Peucker en
// mètres, quartiers.ts) — 200 points de tremblé deviennent une douzaine de
// points doux. Puis la fiche : l'encre (celle qu'on veut), le mot (écrit à
// la main), et le cadran « me recommander ici ? » — plein au départ, cœur
// éteint.
//
// Ce qui n'est PAS encore là et qui est assumé pour cette première main :
// la plume (poser les points un par un), le retournement dur/doux au tap, et
// le partage. Le module les sait déjà faire ; il leur manque l'écran.
// ════════════════════════════════════════════════════════════════
import { t } from './langue'
import { nouvelId } from './db'
import {
  ENCRES, POIDS, POIDS_DEFAUT, contour, depuisTrace, encreSuggeree,
  type EncreId, type PointZone, type PoidsZone, type Quartier,
} from './quartiers'
import { poserQuartier } from './mesQuartiers'
import { ICoeur } from './icones'

type Point = { x: number; y: number }

export default function DessinQuartier({
  carteRef,
  zones,
  refaire = null,
  onFini,
}: {
  /** la REF de la carte, pas sa valeur : on ne lit `.current` que dans les
      gestionnaires, jamais pendant le rendu (règle des hooks React) */
  carteRef: React.RefObject<maplibregl.Map | null>
  zones: Quartier[]
  /** « refaire le tracé » (14/08) : la zone à redessiner. Son ancien contour
      reste en FANTÔME (un guide, pas une zone), et le mot, l'encre, le
      cadran et le cœur survivent — on ne perd que le tracé. */
  refaire?: Quartier | null
  onFini: (pose?: Quartier) => void
}) {
  const calque = useRef<HTMLDivElement | null>(null)
  const [trace, setTrace] = useState<Point[]>([])
  const [dessine, setDessine] = useState(false)
  const [points, setPoints] = useState<PointZone[] | null>(null)
  const [nom, setNom] = useState(refaire?.nom ?? '')
  const [encre, setEncre] = useState<EncreId>(() => refaire?.encre ?? encreSuggeree(zones))
  const [poids, setPoids] = useState<PoidsZone>(refaire?.poids ?? POIDS_DEFAUT)
  const [coeur, setCoeur] = useState(refaire?.coeur ?? false)
  const [msg, setMsg] = useState<string | null>(null)

  // l'ancien tracé, projeté UNE FOIS à l'écran : la carte est gelée pendant
  // le dessin, la projection ne bouge donc pas
  const [fantome, setFantome] = useState('')
  useEffect(() => {
    if (!refaire) return
    const m = carteRef.current
    if (!m) return
    const pts = contour(refaire.points).map((q) => m.project([q.lng, q.lat]))
    setFantome(`M ${pts.map((q) => `${q.x.toFixed(0)} ${q.y.toFixed(0)}`).join(' L ')} Z`)
  }, [refaire, carteRef])

  // ── le tracé ────────────────────────────────────────────────
  const local = (e: React.PointerEvent): Point => {
    const r = calque.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const debut = (e: React.PointerEvent) => {
    if (points) return
    calque.current?.setPointerCapture(e.pointerId)
    setDessine(true)
    setMsg(null)
    setTrace([local(e)])
  }
  const suit = (e: React.PointerEvent) => {
    if (!dessine) return
    const p = local(e)
    setTrace((t) => {
      const d = t.length ? Math.hypot(p.x - t[t.length - 1].x, p.y - t[t.length - 1].y) : 99
      return d < 2 ? t : [...t, p] // on ne garde pas les doublons du doigt immobile
    })
  }
  const fin = () => {
    if (!dessine) return
    setDessine(false)
    const m = carteRef.current
    if (!m || trace.length < 8) {
      setTrace([])
      setMsg(t('il faut entourer un vrai bout de ville — recommence.'))
      return
    }
    const geo = trace.map((p) => {
      const l = m.unproject([p.x, p.y])
      return { lng: l.lng, lat: l.lat }
    })
    const z = depuisTrace(geo)
    if (z.length < 3) {
      setTrace([])
      setMsg(t('il faut entourer un vrai bout de ville — recommence.'))
      return
    }
    setPoints(z)
  }

  // ── la pose ─────────────────────────────────────────────────
  const noter = async () => {
    if (!points) return
    const q: Quartier = {
      id: refaire?.id ?? nouvelId(),
      nom: nom.trim(),
      poids,
      coeur,
      encre,
      points,
      creeLe: refaire?.creeLe ?? new Date().toISOString(),
      source: refaire?.source ?? 'lasso',
      partage: refaire?.partage ?? 'moi',
    }
    await poserQuartier(q)
    onFini(q)
  }

  const chemin = trace.length
    ? `M ${trace.map((p) => `${p.x.toFixed(0)} ${p.y.toFixed(0)}`).join(' L ')}`
    : ''
  const teinte = ENCRES.find((e) => e.id === encre)?.hex ?? '#8E76B4'

  return (
    <div className="dessin-quartier">
      {/* le bandeau de mode : on sait où on est, et comment en sortir */}
      <div className="dessin-bandeau">
        <span>
          {points
            ? t('ta zone est prête.')
            : refaire
              ? t('redessine ta zone — l’ancienne reste en guide')
              : t('entoure ton quartier au doigt')}
        </span>
        <button className="lien" onClick={() => onFini()}>
          {t('annuler')}
        </button>
      </div>

      {/* le calque de capture : il avale les gestes, donc la carte est gelée */}
      {!points && (
        <div
          ref={calque}
          className="dessin-calque"
          onPointerDown={debut}
          onPointerMove={suit}
          onPointerUp={fin}
          onPointerCancel={fin}
        >
          <svg className="dessin-trace" style={{ ['--enc' as string]: teinte }}>
            {fantome && <path d={fantome} className="trace-fantome" />}
            {chemin && <path d={chemin} className="trace-vive" />}
            {trace.length > 2 && (
              <path
                d={`M ${trace[trace.length - 1].x} ${trace[trace.length - 1].y} L ${trace[0].x} ${trace[0].y}`}
                className="trace-ferme"
              />
            )}
          </svg>
          {msg && <p className="dessin-msg mono">{msg}</p>}
        </div>
      )}

      {/* la fiche : l'encre, le mot, le cadran, le cœur */}
      {points && (
        <div className="dessin-fiche">
          <span className="lbl mono">{t('l’encre')}</span>
          <div className="dessin-encres">
            {ENCRES.map((e) => (
              <button
                key={e.id}
                className={`dessin-encre${encre === e.id ? ' choisie' : ''}`}
                style={{ background: e.hex }}
                aria-label={e.nom}
                aria-pressed={encre === e.id}
                onClick={() => setEncre(e.id)}
              />
            ))}
          </div>

          <span className="lbl mono">{t('le mot')}</span>
          <input
            className="dessin-mot"
            autoFocus
            maxLength={24}
            placeholder={t('mon quartier')}
            value={nom}
            onChange={(ev) => setNom(ev.target.value)}
          />

          <span className="lbl mono">{t('me recommander ici ?')}</span>
          <div className="dessin-crans">
            {POIDS.map((p) => (
              <button
                key={p.n}
                className={`dessin-cran${poids === p.n ? ' choisi' : ''}`}
                aria-pressed={poids === p.n}
                onClick={() => {
                  setPoids(p.n)
                  if (p.n === 0) setCoeur(false) // on ne préfère pas ce qu'on évite
                }}
              >
                <span className="p">{p.pastille}</span>
                <span className="m">{t(p.mot)}</span>
              </button>
            ))}
          </div>
          <button
            className={`dessin-coeur${coeur ? ' allume' : ''}`}
            aria-pressed={coeur}
            disabled={poids === 0}
            onClick={() => setCoeur((c) => !c)}
          >
            <ICoeur taille={20} plein={coeur} />
            <span>{t('en priorité')}</span>
          </button>

          <div className="dessin-actions">
            <button className="lien" onClick={() => onFini()}>
              {t('laisse tomber')}
            </button>
            <button className="valider" onClick={() => void noter()}>
              {t('c’est dit.')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
