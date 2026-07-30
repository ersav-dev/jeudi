import { useEffect, useRef } from 'react'

// le splash : le tampon claque, la tagline s'encre, on entre. tap = passer.
export default function Splash({ onFini }: { onFini: () => void }) {
  // onFini est recréé à chaque render du parent → on le garde dans une ref
  // pour que le timer de 3,8 s ne reparte JAMAIS de zéro (deps []).
  const finiRef = useRef(onFini)
  useEffect(() => {
    finiRef.current = onFini
  }, [onFini])
  useEffect(() => {
    const t = setTimeout(() => finiRef.current(), 3800)
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
      <div className="splash-tampon">Jeudi.</div>
      <div className="splash-tagline">ça dit quoi ce soir ?</div>
      <div className="splash-pitch">
        tes vrais potes te disent où.
        <br />
        pas 4 000 avis google.
      </div>
    </div>
  )
}
