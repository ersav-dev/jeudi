import { useRef, useState } from 'react'
import {
  type Lieu,
  distanceM,
  formatDistance,
  tempsMarche,
  etatHoraire,
  propreteWcLabel,
} from './db'
import { srcPhoto } from './photos'
import { ISoleil, INuage, IPluie, IPosition, IBallon, IRefuge, ITrombone } from './icones'

function meteoIcone(m?: string) {
  if (m === 'soleil') return <ISoleil taille={12} />
  if (m === 'pluie') return <IPluie taille={12} />
  if (m === 'nuageux') return <INuage taille={12} />
  return null
}

// une fiche de l'index en 3 pages, qu'on parcourt en swipant dans le même sens :
// 0 = infos · 1 = les photos en grand · 2 = le plan. tap sur la photo = suivante.
export default function LigneIndex({
  lieu,
  estMien,
  dejaAdopte,
  estFavori,
  aComparer,
  onVoir,
  onArchiver,
  onSupprimer,
  onSignaler,
  onVisibilite,
  onAdopter,
  onFavori,
  onComparer,
}: {
  lieu: Lieu
  estMien: boolean
  dejaAdopte: boolean
  estFavori: boolean
  aComparer: boolean
  onVoir: (l: Lieu) => void
  onArchiver: (l: Lieu) => void
  onSupprimer: (l: Lieu) => void
  onSignaler: (l: Lieu) => void
  onVisibilite: (l: Lieu) => void
  onAdopter: (l: Lieu) => void
  onFavori: (l: Lieu) => void
  onComparer: (l: Lieu) => void
}) {
  // gauche → droite : 0 infos · 1 photos (défaut, au milieu) · 2 m'emmener
  const [page, setPage] = useState(1)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [menu, setMenu] = useState(false)
  const [confirmEffacer, setConfirmEffacer] = useState(false)
  const depart = useRef({ x: 0, y: 0 })
  const press = useRef<{ timer: number; fired: boolean } | null>(null)

  const dist = distanceM(lieu)
  const horaire = etatHoraire(lieu.horaires)
  const sig = lieu.tipsCercle?.[0]
  const nbVoix = (lieu.note ? 1 : 0) + (lieu.tipsCercle?.length ?? 0)
  const tip = lieu.note || sig?.note || ''
  const nbPhotos = lieu.photos.length
  const ficheComplete =
    nbPhotos > 0 &&
    (['lieu', 'plat', 'wc'] as const).every((t) => lieu.photos.some((p) => p.type === t))
  const valide = lieu.tampon?.v === 'valide'
  // #18 : on met en avant 1-2 chips d'envie (pas toutes les compagnies → trop chargé)
  const enviesAffichees = lieu.envies.slice(0, 2)
  // #17 : "ultra réputé" = recommandé par plusieurs voix → titre "référence", jamais une note
  const estReference = nbVoix >= 2

  const visLabel =
    lieu.visibilite === 'prive'
      ? 'passer au cercle'
      : lieu.visibilite === 'cercle'
        ? 'rendre public'
        : 'repasser en privé'

  const onDown = (e: React.PointerEvent) => {
    depart.current = { x: e.clientX, y: e.clientY }
    // clic long (450ms) = bascule « à comparer » (comme sur le carrousel de la carte)
    press.current = { fired: false, timer: 0 }
    press.current.timer = window.setTimeout(() => {
      if (press.current) press.current.fired = true
      onComparer(lieu)
      navigator.vibrate?.(30)
    }, 450)
  }
  const onUp = (e: React.PointerEvent) => {
    const p = press.current
    press.current = null
    if (p) {
      clearTimeout(p.timer)
      if (p.fired) return // c'était un clic long → déjà traité (à comparer)
    }
    const dx = e.clientX - depart.current.x
    const dy = e.clientY - depart.current.y
    const ax = Math.abs(dx)
    const ay = Math.abs(dy)
    // swipe horizontal : on change de page (gauche infos · milieu photos · droite m'emmener)
    if (ax > 40 && ax > ay) {
      setPage((p) => (dx < 0 ? Math.min(2, p + 1) : Math.max(0, p - 1)))
      return
    }
    // swipe vertical SUR les photos : photo suivante (haut) / précédente (bas)
    if (page === 1 && ay > 40 && ay > ax && nbPhotos > 1) {
      setPhotoIndex((i) => (dy < 0 ? (i + 1) % nbPhotos : (i - 1 + nbPhotos) % nbPhotos))
      return
    }
    // tap
    if (ax < 6 && ay < 6) {
      const cible = e.target as HTMLElement
      if (cible.closest('.idx-action')) return
      if (page === 0 && cible.closest('.idx-photo')) {
        setPage(1) // raccourci : tap la vignette des infos → la galerie
      } else {
        onVoir(lieu)
      }
    }
  }

  const aDecouvrir = !valide && lieu.tampon?.v !== 'bof'

  // le signet (favori), posé juste à côté du nom du lieu — bien visible
  const signet = () => (
    <button
      className={`idx-action idx-favori ${estFavori ? 'on' : ''}`}
      aria-label={estFavori ? 'retirer des favoris' : 'mettre en favori'}
      aria-pressed={estFavori}
      title={estFavori ? 'dans tes favoris' : 'garder sous la main'}
      onClick={(e) => {
        e.stopPropagation()
        onFavori(lieu)
      }}
    >
      <ITrombone taille={18} actif={estFavori} />
    </button>
  )

  return (
    <li
      className={`idx-carte${estMien ? '' : ' idx-cercle'}${aDecouvrir ? ' idx-adecouvrir' : ''}${aComparer ? ' idx-acomparer' : ''}`}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerLeave={() => {
        if (press.current) {
          clearTimeout(press.current.timer)
          press.current = null
        }
      }}
    >
      {page === 0 && (
        <div className="idx-recto">
          <div className="idx-haut">
            <div className="idx-polaroid">
              <div className="idx-photo">
                {nbPhotos > 0 ? (
                  <img src={srcPhoto(lieu.photos[0])} alt={lieu.nom} />
                ) : (
                  <span className="hand idx-sansphoto">sa photo</span>
                )}
                {valide ? (
                  <span className="idx-tampon valide">
                    <span className="tampon-qui">{lieu.tampon?.qui ?? 'validé'}</span>
                    {lieu.tampon?.date && <span className="tampon-date">{lieu.tampon.date}</span>}
                  </span>
                ) : !estMien && sig ? (
                  <span className="idx-tampon idx-tampon-suggere">
                    <span className="tampon-recopar">recommandé par</span>
                    <span className="tampon-qui">@{sig.auteur.toLowerCase()}</span>
                  </span>
                ) : null}
              </div>
            </div>
            <div className="idx-infos">
              <div className="idx-nom-rang">
                <span className="idx-nom">{lieu.nom}</span>
                {signet()}
              </div>
              <div className="mono idx-dist">
                <IPosition taille={11} /> {formatDistance(dist)} · {tempsMarche(dist)} min
              </div>
              {sig ? (
                <div className="mono idx-sig">
                  — {sig.auteur}
                  {nbVoix > 1 && ` · +${nbVoix - 1} voix`}
                </div>
              ) : (
                <div className="mono idx-sig idx-sig-toi">— toi</div>
              )}
              <div className="idx-pastilles">
                {estReference && (
                  <span className="idx-pill idx-pill-ref" title="recommandé par plusieurs">
                    référence
                  </span>
                )}
                {enviesAffichees.map((t) => (
                  <span key={t} className="idx-pill idx-pill-envie">
                    {t}
                  </span>
                ))}
                {lieu.match === 'diffuse' && (
                  <span className="idx-pill idx-pill-match" title="on y voit les matchs">
                    <IBallon taille={11} /> match
                  </span>
                )}
                {lieu.match === 'refuge' && (
                  <span className="idx-pill idx-pill-refuge" title="ici, no foot">
                    <IRefuge taille={11} /> refuge
                  </span>
                )}
                {lieu.meteo && (
                  <span className="idx-pill idx-pill-meteo">{meteoIcone(lieu.meteo)}</span>
                )}
              </div>
            </div>
          </div>
          {tip && <div className="hand idx-tip">{tip}</div>}
          <div className="idx-pied">
            {horaire ? (
              <span className={`mono idx-horaire ${horaire.ouvert ? 'ouvert' : 'ferme'}`}>
                {horaire.texte}
              </span>
            ) : (
              <span className="mono idx-horaire">horaires inconnus</span>
            )}
            {ficheComplete && <span className="mono idx-complete">fiche complète ✓</span>}
            {(() => {
              const p = propreteWcLabel(lieu.propreteWc)
              return p ? (
                <span className="mono idx-wc" title={`propreté des wc : ${p.mot}`}>
                  wc <span className="idx-wc-pts">{p.points}</span>
                </span>
              ) : null
            })()}
          </div>
        </div>
      )}

      {page === 1 && (
        <div className="idx-photos">
          <div className="idx-grande">
            {nbPhotos > 1 && (
              <div className="photo-tirets">
                {lieu.photos.map((_, i) => (
                  <span key={i} className={i === photoIndex ? 'on' : ''} />
                ))}
              </div>
            )}
            {nbPhotos > 0 ? (
              <img src={srcPhoto(lieu.photos[photoIndex])} alt={lieu.nom} />
            ) : (
              <div className="idx-grande-vide hand">pas encore de photo.</div>
            )}
            {valide ? (
              <span className="idx-tampon valide idx-tampon-grand">
                <span className="tampon-qui">{lieu.tampon?.qui ?? 'validé'}</span>
                {lieu.tampon?.date && <span className="tampon-date">{lieu.tampon.date}</span>}
              </span>
            ) : !estMien && sig ? (
              <span className="idx-tampon idx-tampon-suggere idx-tampon-grand">
                <span className="tampon-recopar">recommandé par</span>
                <span className="tampon-qui">@{sig.auteur.toLowerCase()}</span>
              </span>
            ) : null}
          </div>
          <div className="idx-photos-bas">
            <span className="idx-nom-rang">
              <span className="idx-nom">{lieu.nom}</span>
              {signet()}
            </span>
            <span className="mono idx-dist-inline">
              <IPosition taille={11} /> {formatDistance(dist)} · {tempsMarche(dist)} min
            </span>
          </div>
        </div>
      )}

      {page === 2 && (
        <div className="idx-verso">
          <div className="idx-plan">
            <span className="idx-plan-pin">
              <IPosition taille={22} />
            </span>
            <span className="mono idx-plan-attr">© OpenStreetMap</span>
          </div>
          <div className="idx-verso-tete">
            <span className="idx-nom-rang">
              <span className="idx-nom">{lieu.nom}</span>
              {signet()}
            </span>
            {lieu.adresse && <span className="mono idx-adresse">{lieu.adresse}</span>}
          </div>
          <div className="idx-cases">
            <div className="idx-case">
              <div className="idx-case-gros">{formatDistance(dist)}</div>
              <div className="mono idx-case-lbl">{tempsMarche(dist)} MIN À PIED</div>
            </div>
            <div className="idx-case">
              <div className={`idx-case-gros ${horaire?.ouvert ? 'ouvert' : ''}`}>
                {horaire ? horaire.texte.replace(/.*à /, '') : '—'}
              </div>
              <div className="mono idx-case-lbl">{horaire?.ouvert ? 'FERME' : 'OUVRE'}</div>
            </div>
          </div>
          <a
            className="idx-action idx-itineraire mono"
            href={`https://www.google.com/maps/dir/?api=1&destination=${lieu.lat},${lieu.lng}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            m'y emmener
          </a>
        </div>
      )}

      <div className="idx-points">
        {[0, 1, 2].map((p) => (
          <span key={p} className={p === page ? 'on' : ''} />
        ))}
        <span className="mono idx-points-lbl">
          {page === 0 ? 'infos' : page === 1 ? 'photos' : 'plan'}
        </span>
        {aDecouvrir && <span className="mono idx-points-tester">à tester</span>}
      </div>

      <div className="idx-action idx-menu-zone">
        <button
          className="idx-menu-btn"
          aria-label="options"
          aria-expanded={menu}
          onClick={() => {
            setMenu((m) => !m)
            setConfirmEffacer(false)
          }}
        >
          ⋯
        </button>
        {menu && estMien && (
          <div className="idx-menu">
            <button
              className="idx-menu-item"
              onClick={() => {
                onVisibilite(lieu)
                setMenu(false)
              }}
            >
              {visLabel}
            </button>
            <button
              className="idx-menu-item"
              onClick={() => {
                onArchiver(lieu)
                setMenu(false)
              }}
            >
              archiver
            </button>
            <button
              className="idx-menu-item"
              onClick={() => {
                onComparer(lieu)
                setMenu(false)
              }}
            >
              {aComparer ? 'retirer de la compa' : 'à comparer'}
            </button>
            <button
              className="idx-menu-item"
              onClick={() => {
                onSignaler(lieu)
                setMenu(false)
              }}
            >
              signaler
            </button>
            <button
              className={`idx-menu-item danger ${confirmEffacer ? 'confirm' : ''}`}
              onClick={() => {
                if (confirmEffacer) {
                  onSupprimer(lieu)
                  setMenu(false)
                } else {
                  setConfirmEffacer(true)
                }
              }}
            >
              {confirmEffacer ? 'sûr ? effacer pour de bon' : 'effacer'}
            </button>
          </div>
        )}
        {menu && !estMien && (
          <div className="idx-menu">
            {dejaAdopte ? (
              <span className="idx-menu-item idx-menu-info">déjà sur ta carte</span>
            ) : (
              <button
                className="idx-menu-item"
                onClick={() => {
                  onAdopter(lieu)
                  setMenu(false)
                }}
              >
                ajouter à ma carte
              </button>
            )}
            <button
              className="idx-menu-item"
              onClick={() => {
                onComparer(lieu)
                setMenu(false)
              }}
            >
              {aComparer ? 'retirer de la compa' : 'à comparer'}
            </button>
            <button
              className="idx-menu-item"
              onClick={() => {
                onSignaler(lieu)
                setMenu(false)
              }}
            >
              signaler
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
