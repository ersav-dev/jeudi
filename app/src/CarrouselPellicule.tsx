import { useEffect, useLayoutEffect, useRef, useState } from 'react'
// ════════════════════════════════════════════════════════════════
// jeudi. — LE CARROUSEL DE LA PELLICULE (CHANTIER_PELLICULE §1.6)
// On tape un tas, on feuillette : ← → les photos de la soirée,
// ↑ ↓ la soirée suivante/précédente — GLOBAL, toute la nuit du cercle
// au pouce, pendant que la carte suit derrière (event jeudi:easeto).
// Le sceau se brise à l'OUVERTURE (garde-fou ~1 s), un par soirée.
// La sortie n'est jamais un cul-de-sac : « j'y vais. »
// Transposé du proto validé design/carte_complete.html.
// ════════════════════════════════════════════════════════════════
import { t } from './langue'
import type { SoireePellicule } from './pellicule'

export default function Pellicule({
  soirees,
  depart,
  onVu,
  onJyVais,
  onFermer,
}: {
  /** toutes les soirées, du plus frais au plus ancien (l'axe ↑↓) */
  soirees: SoireePellicule[]
  /** l'index de la soirée tapée sur la carte */
  depart: number
  /** brise le sceau (appelé ~1 s après l'arrivée sur une soirée) */
  onVu: (lieuId: string, soiree: string) => void
  /** la sortie : ajoute au carnet du soir / ouvre la fiche */
  onJyVais: (lieuId: string) => void
  onFermer: () => void
}) {
  const [pi, setPi] = useState(depart)
  const [cis, setCis] = useState<number[]>(() => soirees.map(() => 0))
  const [souple, setSouple] = useState(true)
  const fen = useRef<HTMLDivElement>(null)
  const col = useRef<HTMLDivElement>(null)
  const [H, setH] = useState(0)
  const drag = useRef<{ x: number; y: number; l: number } | null>(null)
  const axe = useRef<'x' | 'y' | null>(null)
  const [dx, setDx] = useState(0)
  const [dy, setDy] = useState(0)

  // la hauteur de la fenêtre — mesurée avant peinture (pas de saut)
  useLayoutEffect(() => {
    const mesurer = () => setH(fen.current?.clientHeight ?? 0)
    mesurer()
    window.addEventListener('resize', mesurer)
    return () => window.removeEventListener('resize', mesurer)
  }, [])

  // le sceau : brisé après ~1 s passée sur la soirée (jamais un tap malheureux)
  useEffect(() => {
    const s = soirees[pi]
    if (!s) return
    const minuteur = window.setTimeout(() => onVu(s.lieuId, s.soiree), 1000)
    return () => window.clearTimeout(minuteur)
  }, [pi, soirees, onVu])

  // la carte suit la soirée (chantier : effet découvert au proto, à garder)
  useEffect(() => {
    const s = soirees[pi]
    if (!s) return
    window.dispatchEvent(new CustomEvent('jeudi:easeto', { detail: { lng: s.lng, lat: s.lat } }))
  }, [pi, soirees])

  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer()
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [onFermer])

  const surDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, l: fen.current?.offsetWidth ?? 1 }
    axe.current = null
    setSouple(false)
    fen.current?.setPointerCapture(e.pointerId)
  }
  const surMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    let mx = e.clientX - d.x
    let my = e.clientY - d.y
    // verrouillage d'axe à 10 px : sans lui, le geste dérape (chantier §1.6)
    if (!axe.current && Math.hypot(mx, my) > 10) axe.current = Math.abs(mx) > Math.abs(my) ? 'x' : 'y'
    if (axe.current === 'x') {
      const s = soirees[pi]
      const ci = cis[pi]
      // butées élastiques aux extrémités
      if ((ci === 0 && mx > 0) || (ci === s.diapos.length - 1 && mx < 0)) mx *= 0.35
      setDx(mx)
    } else if (axe.current === 'y') {
      if ((pi === 0 && my > 0) || (pi === soirees.length - 1 && my < 0)) my *= 0.35
      setDy(my)
    }
  }
  const surUp = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const mx = e.clientX - d.x
    const my = e.clientY - d.y
    setSouple(true)
    if (axe.current === 'x' && Math.abs(mx) > d.l * 0.25) {
      const s = soirees[pi]
      setCis((prev) =>
        prev.map((c, k) => (k === pi ? Math.min(Math.max(c + (mx < 0 ? 1 : -1), 0), s.diapos.length - 1) : c)),
      )
    } else if (axe.current === 'y' && Math.abs(my) > H * 0.18) {
      setPi((p) => Math.min(Math.max(p + (my < 0 ? 1 : -1), 0), soirees.length - 1))
    }
    setDx(0)
    setDy(0)
    drag.current = null
    axe.current = null
  }

  const s = soirees[pi]
  if (!s) return null
  const ci = cis[pi]

  return (
    <div className="pel" role="dialog" aria-modal="true" aria-label={t('la pellicule')}>
      <div className="pel-lieu">{s.nom}</div>
      <div
        ref={fen}
        className="pel-fen"
        onPointerDown={surDown}
        onPointerMove={surMove}
        onPointerUp={surUp}
        onPointerCancel={surUp}
      >
        <div
          ref={col}
          className={`pel-col${souple ? ' souple' : ''}`}
          style={{ transform: `translateY(${-pi * H + dy}px)` }}
        >
          {soirees.map((sp, k) => (
            <div key={sp.lieuId + sp.soiree} className="pel-perso" style={{ height: H || undefined }}>
              <div
                className={`pel-rangee${souple ? ' souple' : ''}`}
                style={{
                  transform: `translateX(calc(${-cis[k] * 100}% + ${k === pi ? dx : 0}px))`,
                }}
              >
                {sp.diapos.map((p, j) => (
                  <div key={j} className="pel-dia">
                    <div className="pel-cad">
                      <img src={p.src} alt={`${p.prenom}, ${p.age}`} draggable={false} />
                      <div className="pel-leg hand">
                        {p.age}
                        <br />
                        <em>— {p.prenom}</em>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="pel-pts">
        {s.diapos.map((_, j) => (
          <span key={j} className={j <= ci ? 'v' : ''} />
        ))}
      </div>
      <div className="pel-meta mono">
        {pi + 1}/{soirees.length} {t('soirées')}
      </div>
      <p className="pel-aide hand">{t('← → les photos · ↑ ↓ la nuit entière')}</p>
      {/* la sortie du carrousel : jamais un cul-de-sac émotionnel (§1.6) —
          le tampon de cire, l'UNIQUE accent de cet écran */}
      <button className="pel-va" onClick={() => onJyVais(s.lieuId)}>
        {t('j’y vais.')}
      </button>
      <button className="lien pel-fermer" onClick={onFermer}>
        {t('revenir à la carte')}
      </button>
    </div>
  )
}
