// ════════════════════════════════════════════════════════════════
// jeudi. — LA NOTE EN MARGE (le tuto du carnet prêté)
// une annotation griffonnée par l'ancien proprio (« j. ») : Caveat encre
// ivoire, légèrement penchée, flèche tremblée dessinée à la main.
// JAMAIS bloquante (pointer-events sur le texte seul) · tap = s'efface ·
// et s'efface AUSSI toute seule quand le geste visé est accompli
// (le parent appelle effacerNote, ou `effaceAuGeste` écoute le 1er
// pan/tap/scroll une fois la note lue).
// ════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { noteVue, effacerNote, texteNote, sAbonnerNotes } from './tuto'

// la même note penche toujours pareil : inclinaison déterministe (-2° → 2°)
function inclinaisonDe(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997
  return Math.round((-2 + (h % 41) / 10) * 10) / 10
}

type Sens = 'gauche' | 'droite' | 'haut' | 'bas'

// une flèche au feutre : le trait tremble, jamais une flèche parfaite
function FlecheMain({ sens }: { sens: Sens }) {
  const rot = { droite: 0, bas: 90, gauche: 180, haut: 270 }[sens]
  return (
    <svg
      className="note-fleche"
      viewBox="0 0 40 16"
      width="34"
      height="14"
      style={{ rotate: `${rot}deg` }}
      aria-hidden="true"
    >
      <path d="M2.5 9.2 C 8 6.4, 14.5 11.8, 21 8.6 C 26 6.3, 30.5 9.4, 35.5 8" />
      <path d="M35.5 8 c -2.4 -0.8, -4.2 -2, -5.6 -3.4" />
      <path d="M35.5 8 c -1.9 1.2, -3.6 3, -4.6 4.6" />
    </svg>
  )
}

export default function NoteMarge({
  id,
  fleche,
  className = '',
  effaceAuGeste = false,
}: {
  /** l'id de la note dans NOTES (tuto.ts) */
  id: string
  /** où pointe la flèche — 'coins' : une à chaque bord (le swipe du deck) */
  fleche?: Sens | 'coins'
  className?: string
  /** le 1er pan/tap/scroll APRÈS lecture efface la note (geste accompli) */
  effaceAuGeste?: boolean
}) {
  const effacee = useSyncExternalStore(sAbonnerNotes, () => noteVue(id))
  // « prête » = vue à l'écran depuis un instant → le prochain geste l'efface
  const [prete, setPrete] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // on attend que la note soit VISIBLE (et lisible un instant) avant d'armer
  // l'effacement au geste — sinon le scroll qui la révèle l'efface aussitôt
  useEffect(() => {
    if (!effaceAuGeste || effacee || prete) return
    const el = ref.current
    if (!el) return
    let timer: number | undefined
    const io = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((e) => e.isIntersecting)) {
          io.disconnect()
          timer = window.setTimeout(() => setPrete(true), 900)
        }
      },
      { threshold: 0.5 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      if (timer) window.clearTimeout(timer)
    }
  }, [effaceAuGeste, effacee, prete])

  useEffect(() => {
    if (!prete || effacee) return
    const fini = () => effacerNote(id)
    window.addEventListener('pointerdown', fini, true)
    window.addEventListener('scroll', fini, true)
    return () => {
      window.removeEventListener('pointerdown', fini, true)
      window.removeEventListener('scroll', fini, true)
    }
  }, [prete, effacee, id])

  if (effacee) return null
  const texte = texteNote(id)
  if (!texte) return null

  const inclinaison = { rotate: `${inclinaisonDe(id)}deg` }
  const bouton = (
    <button className="note-marge-texte" onClick={() => effacerNote(id)}>
      {texte}
    </button>
  )

  // le swipe : une flèche griffonnée à chaque coin, le mot entre les deux
  if (fleche === 'coins') {
    return (
      <div ref={ref} className={`note-marge ${className}`} style={inclinaison}>
        <FlecheMain sens="gauche" />
        {bouton}
        <FlecheMain sens="droite" />
      </div>
    )
  }
  return (
    <div ref={ref} className={`note-marge ${className}`} style={inclinaison}>
      {(fleche === 'haut' || fleche === 'gauche') && <FlecheMain sens={fleche} />}
      {bouton}
      {(fleche === 'bas' || fleche === 'droite') && <FlecheMain sens={fleche} />}
    </div>
  )
}

// ── le mot scotché de bienvenue ──────────────────────────────────
// la PREMIÈRE arrivée dans le carnet prêté : un bout de papier de travers,
// scotché là par « j. ». tap pour le ranger — jamais revu ensuite.
export function MotScotche() {
  const range = useSyncExternalStore(sAbonnerNotes, () => noteVue('mot-bienvenue'))
  if (range) return null
  return (
    <button className="mot-scotche" onClick={() => effacerNote('mot-bienvenue')}>
      <span className="mot-scotche-texte">{texteNote('mot-bienvenue')}</span>
    </button>
  )
}
