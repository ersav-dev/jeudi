// ════════════════════════════════════════════════════════════════════
// LA PELLICULE — le carrousel à deux axes
//
// ← → : les photos de la soirée courante.
// ↑ ↓ : la soirée suivante / précédente, GLOBALEMENT (tous les tas de la
//       carte, du plus frais au plus ancien) — on traverse toute la nuit du
//       cercle au pouce sans jamais repasser par la carte.
// Et la carte se déplace DERRIÈRE : on referme, on est déjà au bon endroit.
//
// Ce n'est pas un feed : ça finit, c'est signé, ça ne se compte pas. La
// sortie s'appelle « j'y vais. » — on ne crée pas le désir pour rendre
// ensuite l'utilisateur à sa carte, les mains vides.
// ════════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { ICadenas, ICercle, IGlobe } from './icones'
import { srcPhoto, photoIndisponible } from './photos'
import { libelleAge, type PhotoPellicule, type Tas } from './pellicule'
import type { Lieu } from './db'

/** le sceau se brise à l'OUVERTURE — mais pas sur un tap malheureux */
const DELAI_SCEAU_MS = 1000
/** verrouillage d'axe : sans ça le geste dérape, inutilisable d'une main */
const SEUIL_AXE_PX = 10
/** on change de photo passé le quart de la largeur */
const SEUIL_X = 0.25
/** …et de soirée passé ~un cinquième de la hauteur */
const SEUIL_Y = 0.18
/** butée élastique aux extrémités (on sent le bout de la bande) */
const ELASTIQUE = 0.35

/** le mot manuscrit sous un tirage : la voix de CELUI qui l'a shooté si on
 *  la connaît, le mot du lieu sinon. Jamais un avis, jamais une note. */
function motDuTirage(lieu: Lieu, photo: PhotoPellicule): string {
  const sienne = photo.auteurId
    ? lieu.tipsCercle?.find((t) => t.auteurId === photo.auteurId)?.note
    : undefined
  return (sienne ?? lieu.note ?? '').trim()
}

function iconeVisibilite(l: Lieu) {
  if (l.visibilite === 'prive') return <ICadenas taille={12} />
  if (l.visibilite === 'public') return <IGlobe taille={12} />
  return <ICercle taille={12} />
}

export default function Pellicule({
  tas,
  depart,
  onFermer,
  onCentrer,
  onVu,
  onYVais,
}: {
  /** les tas vivants, du plus frais au plus ancien (l'axe vertical) */
  tas: Tas[]
  /** l'index d'ouverture (le tas qu'on vient de taper) */
  depart: number
  onFermer: () => void
  /** la carte suit derrière : chaque changement de soirée la recentre */
  onCentrer: (t: Tas) => void
  /** le sceau se brise (1 s après l'entrée dans la soirée) */
  onVu: (t: Tas) => void
  /** la sortie : au carnet, au vote, à la décision */
  onYVais?: (t: Tas) => void
}) {
  const [pi, setPi] = useState(() => Math.min(Math.max(depart, 0), Math.max(tas.length - 1, 0)))
  const [cis, setCis] = useState<number[]>(() => tas.map(() => 0))
  const fen = useRef<HTMLDivElement>(null)
  const col = useRef<HTMLDivElement>(null)
  const boite = useRef<HTMLDivElement>(null)
  const hauteur = useRef(0)
  // le drag en cours : pointeur d'origine + axe verrouillé
  const drag = useRef<{ x: number; y: number; l: number } | null>(null)
  const axe = useRef<'x' | 'y' | null>(null)
  // valeurs vivantes pour les listeners posés une fois
  const piRef = useRef(pi)
  const cisRef = useRef(cis)
  useEffect(() => {
    piRef.current = pi
    cisRef.current = cis
  }, [pi, cis])

  const courant = tas[pi]
  const iPhoto = cis[pi] ?? 0

  // ── la mise en place : mesurer la fenêtre, poser les transforms ──
  const appliquer = (souple: boolean) => {
    const c = col.current
    if (!c) return
    c.classList.toggle('souple', souple)
    c.style.transform = `translateY(${-piRef.current * hauteur.current}px)`
    c.querySelectorAll<HTMLElement>('.pell-rangee').forEach((r, k) => {
      r.classList.toggle('souple', souple)
      r.style.transform = `translateX(${-(cisRef.current[k] ?? 0) * 100}%)`
    })
  }
  const mesurer = () => {
    const f = fen.current
    const c = col.current
    if (!f || !c) return
    hauteur.current = f.clientHeight
    c.querySelectorAll<HTMLElement>('.pell-perso').forEach((p) => {
      p.style.height = `${hauteur.current}px`
    })
  }

  useEffect(() => {
    mesurer()
    appliquer(false)
    const surResize = () => {
      mesurer()
      appliquer(false)
    }
    window.addEventListener('resize', surResize)
    return () => window.removeEventListener('resize', surResize)
  }, [tas.length])

  // les transforms suivent l'état (fin de drag, flèches clavier)
  useEffect(() => {
    appliquer(true)
  }, [pi, cis])

  // ── le sceau : il se brise à l'OUVERTURE du tas, pas quand tout est vu ──
  // (« quand tout est vu » recrée la dette du non-lu et transforme le plaisir
  //  en corvée). Garde-fou : 1 s sur place, pour ne pas punir un tap malheureux.
  useEffect(() => {
    const t = tas[pi]
    if (!t) return
    const id = window.setTimeout(() => onVu(t), DELAI_SCEAU_MS)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pi, tas])

  const glisserPhoto = (sens: 1 | -1) => {
    const p = piRef.current
    const n = tas[p]?.photos.length ?? 1
    setCis((prev) => {
      const suite = [...prev]
      suite[p] = Math.min(Math.max((suite[p] ?? 0) + sens, 0), n - 1)
      return suite
    })
  }
  const glisserSoiree = (sens: 1 | -1) => {
    const suivant = Math.min(Math.max(piRef.current + sens, 0), tas.length - 1)
    if (suivant === piRef.current) return
    setPi(suivant)
    onCentrer(tas[suivant])
  }

  // focus + Échap (le retour du focus sur le tas d'origine est fait par Carte)
  useEffect(() => {
    boite.current?.focus()
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer()
      else if (e.key === 'ArrowRight') glisserPhoto(1)
      else if (e.key === 'ArrowLeft') glisserPhoto(-1)
      else if (e.key === 'ArrowDown') glisserSoiree(1)
      else if (e.key === 'ArrowUp') glisserSoiree(-1)
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── le drag 1:1 : la bande suit le doigt, sans transition pendant le geste ──
  const surDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, l: fen.current?.offsetWidth ?? 1 }
    axe.current = null
    col.current?.classList.remove('souple')
    col.current?.querySelectorAll('.pell-rangee').forEach((r) => r.classList.remove('souple'))
    fen.current?.setPointerCapture(e.pointerId)
  }
  const surMove = (e: React.PointerEvent) => {
    const d = drag.current
    const c = col.current
    if (!d || !c) return
    let dx = e.clientX - d.x
    let dy = e.clientY - d.y
    if (!axe.current && Math.hypot(dx, dy) > SEUIL_AXE_PX) {
      axe.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    }
    const p = piRef.current
    if (axe.current === 'x') {
      const ci = cisRef.current[p] ?? 0
      const n = tas[p]?.photos.length ?? 1
      if ((ci === 0 && dx > 0) || (ci === n - 1 && dx < 0)) dx *= ELASTIQUE
      const rangee = c.querySelectorAll<HTMLElement>('.pell-rangee')[p]
      if (rangee) rangee.style.transform = `translateX(calc(${-ci * 100}% + ${dx}px))`
    } else if (axe.current === 'y') {
      if ((p === 0 && dy > 0) || (p === tas.length - 1 && dy < 0)) dy *= ELASTIQUE
      c.style.transform = `translateY(${-p * hauteur.current + dy}px)`
    }
  }
  const surUp = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    const a = axe.current
    drag.current = null
    axe.current = null
    if (a === 'x' && Math.abs(dx) > d.l * SEUIL_X) glisserPhoto(dx < 0 ? 1 : -1)
    else if (a === 'y' && Math.abs(dy) > hauteur.current * SEUIL_Y) glisserSoiree(dy < 0 ? 1 : -1)
    else appliquer(true)
  }
  const surCancel = () => {
    drag.current = null
    axe.current = null
    appliquer(true)
  }

  if (!courant) return null

  return (
    <div
      className="pell"
      role="dialog"
      aria-modal="true"
      aria-label="la pellicule du cercle"
      tabIndex={-1}
      ref={boite}
    >
      <button className="pell-x mono" onClick={onFermer} aria-label="revenir à la carte">
        ✕
      </button>

      {/* on ne perd JAMAIS le lieu : il est au-dessus du cadre */}
      <div className="pell-lieu">{courant.lieu.nom}</div>

      <div
        className="pell-fen"
        ref={fen}
        onPointerDown={surDown}
        onPointerMove={surMove}
        onPointerUp={surUp}
        onPointerCancel={surCancel}
      >
        <div className="pell-col" ref={col}>
          {tas.map((sp) => (
            <div className="pell-perso" key={sp.lieu.id}>
              <div className="pell-rangee">
                {sp.photos.map((p, i) => {
                  const mot = motDuTirage(sp.lieu, p)
                  const qui = (p.auteurPrenom ?? sp.auteur ?? '').toLowerCase()
                  return (
                    <div className="pell-dia" key={`${sp.lieu.id}-${i}`}>
                      <div className="pell-cadre">
                        <img
                          src={srcPhoto(p)}
                          alt={`${mot || sp.lieu.nom} — ${qui}, ${libelleAge(sp.fraicheur)}`}
                          loading="lazy"
                          decoding="async"
                          onError={photoIndisponible}
                        />
                        <div className="pell-pied">
                          {mot && <span className="pell-mot">« {mot} »</span>}
                          {qui && <em className="pell-sign">— {qui}</em>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* la progression dans la soirée — des points, jamais un compteur de vues */}
      <div className="pell-pts" aria-hidden="true">
        {courant.photos.map((_, i) => (
          <span key={i} className={i <= iPhoto ? 'v' : ''} />
        ))}
      </div>

      <div className="pell-meta mono">
        <span className="pell-visi" title={courant.lieu.visibilite}>
          {iconeVisibilite(courant.lieu)}
        </span>
        {libelleAge(courant.fraicheur)} · {pi + 1}/{tas.length} soirées
      </div>

      <p className="pell-aide hand">← → les photos · ↑ ↓ la nuit entière</p>

      {onYVais && (
        <button className="pell-yvais" onClick={() => onYVais(courant)}>
          j’y vais.
        </button>
      )}
    </div>
  )
}
