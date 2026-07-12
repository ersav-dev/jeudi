import { useEffect, useRef } from 'react'

// le splash : le tampon claque, la tagline s'encre, on entre. tap = passer.
export default function Splash({ onFini }: { onFini: () => void }) {
  // onFini est recréé à chaque render du parent → on le garde dans une ref
  // pour que le timer de 1,8 s ne reparte JAMAIS de zéro (deps []).
  const finiRef = useRef(onFini)
  useEffect(() => {
    finiRef.current = onFini
  }, [onFini])
  useEffect(() => {
    // V5 §7 : 1,8 s max — un bel objet ne fait pas attendre
    const t = setTimeout(() => finiRef.current(), 1800)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="splash"
      onClick={onFini}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onFini()
        }
      }}
      aria-label="entrer"
    >
      {/* §7 : RIEN que le tampon qui frappe, le grain, et la vraie question —
          « je dis » (le jeu de mots) vit ailleurs, la couverture porte la question */}
      <div className="splash-tampon">Jeudi.</div>
      <div className="splash-tagline">ça dit quoi ce soir ?</div>
    </div>
  )
}
