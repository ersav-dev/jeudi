import { useEffect, useRef, useState } from 'react'
// ════════════════════════════════════════════════════════════════
// jeudi. — LE PROJECTEUR : on touche, il s'allume.
// Jamais d'autoplay : la lecture est TOUJOURS un geste (produit :
// la vidéo n'écrase pas les tirages ; technique : iOS ne bloque
// jamais une lecture tapée ; coût : on ne paie que les projections
// voulues). Muet par défaut — le son se réveille pour CE visionnage,
// jamais de réglage global. preload="none" : aucun octet vidéo ne
// part sans un tap.
// ════════════════════════════════════════════════════════════════
import type { PhotoLieu } from './db'
import { t } from './langue'
import { urlPhoto, srcPhoto } from './photos'
import { ageEnJours, libelleDuree, normaliserReglages } from './super8'
import S8Ecran from './S8Ecran'

/** la source vidéo d'un clip : l'URL signée (cloud) sinon le blob local */
function srcClip(p: PhotoLieu): string {
  if (p.clipUrl) return p.clipUrl
  return p.clipBlob ? urlPhoto(p.clipBlob) : ''
}

export default function Projecteur({
  photo,
  nomLieu,
  onFermer,
}: {
  photo: PhotoLieu
  nomLieu: string
  onFermer: () => void
}) {
  const [enLecture, setEnLecture] = useState(false)
  const [son, setSon] = useState(false)
  const [lance, setLance] = useState(false) // le premier tap est passé
  const video = useRef<HTMLVideoElement>(null)
  const fermerBtn = useRef<HTMLButtonElement>(null)

  const reglages = normaliserReglages(photo.reglagesRendu)
  const age = ageEnJours(photo.priseLe)

  useEffect(() => {
    fermerBtn.current?.focus()
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer()
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [onFermer])

  // un seul projecteur à la fois : quitter = éteindre
  useEffect(() => {
    const v = video.current
    return () => v?.pause()
  }, [])

  const basculer = () => {
    const v = video.current
    if (!v) return
    if (v.paused) {
      setLance(true)
      void v.play().catch(() => {})
    } else {
      v.pause()
    }
  }

  return (
    <div className="projecteur" role="dialog" aria-modal="true" aria-label={t('la bobine')}>
      <button
        ref={fermerBtn}
        className="photo-zoom-x mono"
        aria-label={t('fermer')}
        onClick={onFermer}
      >
        ✕
      </button>

      <button
        type="button"
        className="projecteur-toile"
        aria-label={enLecture ? t('mettre en pause') : t('projeter')}
        onClick={basculer}
      >
        <S8Ecran reglages={reglages} ageJours={age}>
          <video
            ref={video}
            src={srcClip(photo)}
            poster={srcPhoto(photo) || undefined}
            preload="none"
            playsInline
            loop
            muted={!son}
            onPlay={() => setEnLecture(true)}
            onPause={() => setEnLecture(false)}
          />
          {/* l'amorce : tant qu'on n'a pas tapé, le photogramme attend */}
          {!lance && (
            <span className="s8-amorce" aria-hidden>
              <span className="s8-declic">▸</span>
            </span>
          )}
        </S8Ecran>
      </button>

      <div className="projecteur-pied">
        <span className="hand projecteur-nom">
          {nomLieu}
          {photo.clipDureeS ? ` · ${libelleDuree(photo.clipDureeS)}` : ''}
        </span>
        <button
          className={`mono projecteur-son${son ? ' actif' : ''}`}
          aria-pressed={son}
          onClick={() => setSon((s) => !s)}
        >
          {son ? t('couper le son') : t('le son')}
        </button>
      </div>
    </div>
  )
}
