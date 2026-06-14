import { useEffect } from 'react'

// le splash : le tampon claque, la tagline s'encre, on entre. tap = passer.
export default function Splash({ onFini }: { onFini: () => void }) {
  useEffect(() => {
    const t = setTimeout(onFini, 3800)
    return () => clearTimeout(t)
  }, [onFini])

  return (
    <div className="splash" onClick={onFini} role="button" aria-label="entrer">
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
