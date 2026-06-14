import { useEffect, useMemo, useRef, useState, lazy, Suspense, type ComponentProps } from 'react'
import {
  type Lieu,
  type Compagnie,
  type Meteo,
  COMPAGNIES,
  prixMeteo,
  COMPAGNIE_GLOSE,
  gloseEnvie,
  ajouterSortie,
  distanceM,
  formatDistance,
  tempsMarche,
  etatHoraire,
  propreteWcLabel,
} from './db'
import { srcPhoto } from './photos'
import { ISoleil, INuage, IPluie } from './icones'
const CarteLazy = lazy(() => import('./Carte'))
function Carte(p: ComponentProps<typeof CarteLazy>) {
  return (
    <Suspense fallback={<div className="carte carte-mini" />}>
      <CarteLazy {...p} />
    </Suspense>
  )
}

// ── la rotation hebdo du chip street-food ──────────────────────
const ROTATION = ['alloco', 'bocadillo', 'taco', 'panino', 'bento', 'burrito', 'gyro']
function motStreetFood(d: Date): string {
  const debut = new Date(d.getFullYear(), 0, 1)
  const semaine = Math.floor((d.getTime() - debut.getTime()) / (7 * 86400000))
  return ROTATION[semaine % ROTATION.length]
}

// ── le lexique vivant : la rangée d'envies suit l'heure ────────
function lexiqueDuMoment(d = new Date()): { envies: string[]; nuit: boolean } {
  const h = d.getHours() + d.getMinutes() / 60

  // minuit → 5h : la fonte. apéro a basculé en alcolo, la rangée se réduit aux
  // vérités de la nuit (disco reste visible en permanence).
  if (h < 5) return { envies: ['dodo', 'alcolo', 'gastro', 'disco'], nuit: true }

  // journée / soirée. disco est visible tout le temps ; turbo est retiré pour
  // l'instant (pas évident d'emblée) — il reviendra quand l'app sera familière.
  return {
    envies: ['tranquilo', motStreetFood(d), 'resto', 'gastro', 'incognito', 'apéro', 'disco'],
    nuit: false,
  }
}

// le mot affiché peut différer du tag côté données : la rotation street-food →
// "alloco", et "alcolo" (le mot de la nuit) pointe sur les spots "apéro".
function envieVersTag(envie: string): string {
  if (ROTATION.includes(envie)) return 'alloco'
  if (envie === 'alcolo') return 'apéro'
  return envie
}

const METEO_LABELS: { m: Meteo; icone: React.ReactNode; label: string }[] = [
  { m: 'soleil', icone: <ISoleil />, label: 'grand soleil — on flambe' },
  { m: 'nuageux', icone: <INuage />, label: 'nuageux — ça va' },
  { m: 'pluie', icone: <IPluie />, label: "pluie — c'est la merde" },
]

const PIQUES_FIN = ["t'es difficile ce soir.", "c'est tout ce que j'ai. reviens demain."]

export default function CeSoir({
  lieux,
  onVoir,
  onComparer,
}: {
  lieux: Lieu[]
  onVoir?: (l: Lieu) => void
  onComparer?: (ids: string[]) => void
}) {
  const [compagnie, setCompagnie] = useState<Compagnie | null>(null)
  const [envie, setEnvie] = useState<string | null>(null)
  const [meteo, setMeteo] = useState<Meteo>(
    () => (localStorage.getItem('jeudi-meteo') as Meteo) || 'nuageux',
  )
  // le lexique se met à jour tout seul (l'app ouverte à 17h59 verra la fête à 18h)
  const [moment, setMoment] = useState(() => lexiqueDuMoment())
  useEffect(() => {
    const t = setInterval(() => setMoment(lexiqueDuMoment()), 60_000)
    return () => clearInterval(t)
  }, [])
  const { envies, nuit } = moment

  const choisirMeteo = (m: Meteo) => {
    setMeteo(m)
    localStorage.setItem('jeudi-meteo', m)
  }

  const deck = useMemo(() => {
    if (!compagnie || !envie) return []
    const tag = envieVersTag(envie)
    const candidats = lieux.filter((l) => {
      const okCompagnie = l.compagnies.length === 0 || l.compagnies.includes(compagnie)
      const okEnvie = l.envies.length === 0 || (l.envies as string[]).includes(tag)
      const okMeteo = !l.meteo || meteo === 'soleil' || l.meteo === meteo || l.meteo === 'pluie'
      return okCompagnie && okEnvie && okMeteo
    })
    candidats.sort((a, b) => {
      const sa = ((a.envies as string[]).includes(tag) ? 2 : 0) + (a.compagnies.includes(compagnie) ? 1 : 0)
      const sb = ((b.envies as string[]).includes(tag) ? 2 : 0) + (b.compagnies.includes(compagnie) ? 1 : 0)
      return sb - sa
    })
    return candidats.slice(0, 8)
  }, [lieux, compagnie, envie, meteo])

  if (envie === 'dodo') {
    return (
      <div className="vide bientot">
        <h1 className="grande-question">sage.</h1>
        <p className="hand">à jeudi.</p>
        <button className="lien" onClick={() => setEnvie(null)}>
          en vrai non, je sors
        </button>
      </div>
    )
  }

  return (
    <div className="cesoir">
      {!(compagnie && envie) ? (
        // #10 : tout en swipe — gauche/droite = changer de choix · haut = valider
        <QuestionsSwipe
          nuit={nuit}
          envies={envies}
          compagnie={compagnie}
          onCompagnie={(c) => {
            setCompagnie(c)
            setEnvie(null)
          }}
          onEnvie={setEnvie}
        />
      ) : (
        <>
          <button
            className="cesoir-rappel mono"
            onClick={() => {
              setCompagnie(null)
              setEnvie(null)
            }}
            title="recommencer"
          >
            {compagnie} · {envie} <span className="cesoir-rappel-x">↺</span>
          </button>
          <Deck key={`${compagnie}-${envie}-${meteo}`} deck={deck} onVoir={onVoir} onComparer={onComparer} />
        </>
      )}

      <span className="lbl mono meteo-bas-lbl">situation du portefeuille ?</span>
      <div className="meteo-bas">
        {METEO_LABELS.map(({ m, icone, label }) => (
          <button
            key={m}
            className={`meteo-choix ${meteo === m ? 'on' : ''}`}
            aria-pressed={meteo === m}
            onClick={() => choisirMeteo(m)}
            title={label}
          >
            {icone}
            <span className="meteo-prix mono">{prixMeteo(m)}</span>
          </button>
        ))}
        {meteo === 'pluie' && <span className="mono pluie-mot">il pleut sur ton porte-monnaie.</span>}
      </div>
    </div>
  )
}

// ── #10 : les questions en plein swipe ─────────────────────────
// la question s'écrit en grand au centre. gauche/droite = on fait défiler
// les choix · swipe vers le haut (ou tap "c'est ça") = on valide et on passe
// à la question suivante · swipe vers le bas = on revient en arrière.
function QuestionsSwipe({
  nuit,
  envies,
  compagnie,
  onCompagnie,
  onEnvie,
}: {
  nuit: boolean
  envies: string[]
  compagnie: Compagnie | null
  onCompagnie: (c: Compagnie) => void
  onEnvie: (e: string) => void
}) {
  // étape 0 = avec qui · étape 1 = pour quoi
  const [etape, setEtape] = useState(0)
  const [iCompagnie, setICompagnie] = useState(0)
  // par défaut on s'arrête sur "apéro" (2e pastille) quand "dodo" ouvre la nuit
  const [iEnvie, setIEnvie] = useState(envies[0] === 'dodo' ? 1 : 0)
  const [drag, setDrag] = useState({ x: 0, y: 0, actif: false })
  const depart = useRef({ x: 0, y: 0 })

  const options: string[] = etape === 0 ? [...COMPAGNIES] : envies
  const i = etape === 0 ? iCompagnie : iEnvie
  const setI = etape === 0 ? setICompagnie : setIEnvie
  const n = options.length
  const idx = ((i % n) + n) % n
  const choix = options[idx]
  const motPrec = options[(idx - 1 + n) % n]
  const motSuiv = options[(idx + 1) % n]

  const titre =
    etape === 0
      ? nuit
        ? 'encore debout ?'
        : 'ça dit quoi ce soir ?'
      : compagnie === 'potos'
        ? 'et ça dit quoi, les potos ?'
        : 'pour quoi faire ?'
  const sousTitre = etape === 0 ? 'avec qui ?' : 'pour quoi faire ?'
  const glose = etape === 0 ? COMPAGNIE_GLOSE[choix as Compagnie] : gloseEnvie(choix)

  const valider = () => {
    if (etape === 0) {
      onCompagnie(choix as Compagnie)
      setEtape(1)
    } else {
      onEnvie(choix) // → le parent révèle le deck (ou l'écran "dodo")
    }
  }
  const reculer = () => {
    if (etape === 1) setEtape(0)
  }
  const defiler = (sens: number) => setI((p) => p + sens)

  const onDown = (e: React.PointerEvent) => {
    depart.current = { x: e.clientX, y: e.clientY }
    setDrag({ x: 0, y: 0, actif: true })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag.actif) return
    setDrag({ x: e.clientX - depart.current.x, y: e.clientY - depart.current.y, actif: true })
  }
  const onUp = () => {
    const { x, y } = drag
    if (Math.abs(x) > Math.abs(y)) {
      if (x > 60) defiler(-1)
      else if (x < -60) defiler(1)
    } else {
      if (y < -60) valider()
      else if (y > 60) reculer()
    }
    setDrag({ x: 0, y: 0, actif: false })
  }

  return (
    <div className="qs">
      <h1 className="grande-question qs-titre">{titre}</h1>
      <span className="lbl mono qs-sous">{sousTitre}</span>

      <div
        className="qs-scene"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
      >
        <button className="qs-fleche gauche" onClick={() => defiler(-1)} aria-label="précédent">
          ‹
        </button>
        <div
          className="qs-choix"
          style={{
            transform: `translate(${drag.x}px, ${drag.y < 0 ? drag.y * 0.4 : 0}px)`,
            transition: drag.actif ? 'none' : 'transform .3s cubic-bezier(.2,1.2,.4,1)',
          }}
        >
          {/* on voit les voisins (estompés) → on sait ce qui vient avant/après */}
          <div className="qs-roue">
            {n > 1 && (
              <button className="qs-mot-cote" onClick={() => defiler(-1)}>
                {motPrec}
              </button>
            )}
            <span className="qs-mot">{choix}</span>
            {n > 1 && (
              <button className="qs-mot-cote" onClick={() => defiler(1)}>
                {motSuiv}
              </button>
            )}
          </div>
          <span className="hand qs-glose">{glose}</span>
        </div>
        <button className="qs-fleche droite" onClick={() => defiler(1)} aria-label="suivant">
          ›
        </button>
      </div>

      <div className="qs-points">
        {options.map((o, k) => (
          <span key={o} className={k === idx ? 'on' : ''} />
        ))}
      </div>

      <button className={`qs-valider mono ${drag.y < -20 && drag.actif ? 'pret' : ''}`} onClick={valider}>
        c'est ça ↑
      </button>
      <p className="mono qs-aide">
        ← → changer · ↑ valider{etape === 1 ? ' · ↓ revenir' : ''}
      </p>
    </div>
  )
}

// ── le deck : une carte à la fois, le swipe comme langue ──────
type Verdict = 'valide' | 'bof'

function Deck({
  deck,
  onVoir,
  onComparer,
}: {
  deck: Lieu[]
  onVoir?: (l: Lieu) => void
  onComparer?: (ids: string[]) => void
}) {
  const [index, setIndex] = useState(0)
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})
  const [photoIndex, setPhotoIndex] = useState(0)
  const [voixIndex, setVoixIndex] = useState(0)
  const [drag, setDrag] = useState({ x: 0, y: 0, actif: false })
  const depart = useRef({ x: 0, y: 0 })
  // lot B : les lieux « jetés » au récap (appui long) → ils sortent de la vue
  const [jetes, setJetes] = useState<Set<string>>(new Set())

  if (deck.length === 0) {
    return (
      <div className="deck-vide">
        <p className="hand">rien dans ta carte pour ça.</p>
        <p className="mono">capture des spots, ou élargis l'envie.</p>
      </div>
    )
  }

  // ── le récap : on décide pendant, on explore après ──
  if (index >= deck.length) {
    const refaire = () => {
      setIndex(0)
      setVerdicts({})
      setPhotoIndex(0)
    }
    return (
      <Recap
        deck={deck.filter((l) => !jetes.has(l.id))}
        verdicts={verdicts}
        onVoir={onVoir}
        onRefaire={refaire}
        onJeter={(id) => setJetes((prev) => new Set(prev).add(id))}
        onComparer={onComparer}
      />
    )
  }

  const lieu = deck[index]
  const rotation = drag.x / 18
  const verdict = drag.x > 60 ? 'valide' : drag.x < -60 ? 'bof' : null
  const nbPhotos = lieu.photos.length

  const voix: { note: string; signature: string }[] = [
    ...(lieu.note ? [{ note: lieu.note, signature: 'toi' }] : []),
    ...(lieu.tipsCercle ?? []).map((t) => ({ note: t.note, signature: t.auteur })),
  ]
  const laVoix = voix[voixIndex % Math.max(voix.length, 1)]

  const suivant = (v: Verdict) => {
    setVerdicts((prev) => ({ ...prev, [lieu.id]: v }))
    if (v === 'valide') {
      ajouterSortie({ lieuId: lieu.id, nom: lieu.nom, date: new Date().toISOString() })
    }
    setIndex((i) => i + 1)
    setPhotoIndex(0)
    setVoixIndex(0)
  }

  const onDown = (e: React.PointerEvent) => {
    depart.current = { x: e.clientX, y: e.clientY }
    setDrag({ x: 0, y: 0, actif: true })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag.actif) return
    setDrag({ x: e.clientX - depart.current.x, y: e.clientY - depart.current.y, actif: true })
  }
  const onUp = (e: React.PointerEvent) => {
    const cible = e.target as HTMLElement
    if (drag.x > 90) {
      suivant('valide')
    } else if (drag.x < -90) {
      suivant('bof')
    } else if (
      // swipe haut/bas sur la photo = feuilleter (partout pareil dans l'app)
      Math.abs(drag.y) > 40 &&
      Math.abs(drag.y) > Math.abs(drag.x) &&
      cible.closest('.carte-photo') &&
      nbPhotos > 1
    ) {
      setPhotoIndex((p) => (drag.y < 0 ? (p + 1) % nbPhotos : (p - 1 + nbPhotos) % nbPhotos))
    } else if (Math.abs(drag.x) < 6 && Math.abs(drag.y) < 6) {
      if (cible.closest('.carte-photo') && nbPhotos > 1) {
        setPhotoIndex((p) => (p + 1) % nbPhotos)
      }
      if (cible.closest('.carte-voix') && voix.length > 1) {
        setVoixIndex((v) => (v + 1) % voix.length)
      }
    }
    setDrag({ x: 0, y: 0, actif: false })
  }

  return (
    <div className="deck">
      <span className="mono deck-compteur">
        {index + 1}/{deck.length}
      </span>
      {index === deck.length - 1 && deck.length > 2 && (
        <p className="mono deck-pique">{PIQUES_FIN[0]}</p>
      )}
      <div className="pile">
        <div
          className="carte-lieu"
          style={{
            transform: `translate(${drag.x}px, ${drag.y * 0.3}px) rotate(${rotation}deg)`,
            transition: drag.actif ? 'none' : 'transform .35s cubic-bezier(.2,1.2,.4,1)',
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
        >
          {verdict === 'valide' && <span className="tampon valide">VALIDÉ</span>}
          {verdict === 'bof' && <span className="tampon bof">bof</span>}
          <div className="carte-photo">
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
              <div className="tirage-vide">
                <span className="croix">✕</span>
                <span className="hand sans-photo">pas encore de photo.</span>
              </div>
            )}
          </div>
          <div className="carte-nom">{lieu.nom}</div>
          <div className="mono carte-meta">
            <span>{formatDistance(distanceM(lieu))} · {tempsMarche(distanceM(lieu))} min</span>
            {(() => {
              const h = etatHoraire(lieu.horaires)
              return h ? <span className={h.ouvert ? 'ouvert' : 'ferme'}>{h.texte}</span> : null
            })()}
          </div>
          {lieu.description && <p className="mono carte-desc">{lieu.description}</p>}
          {laVoix && (
            <div className="carte-voix">
              <p className="hand carte-tip">{laVoix.note}</p>
              <span className="mono tip-signature">
                — {laVoix.signature}
                {voix.length > 1 && ` · ${(voixIndex % voix.length) + 1}/${voix.length}`}
              </span>
            </div>
          )}
          {lieu.adresse && <p className="mono carte-adresse">{lieu.adresse}</p>}
        </div>
      </div>
      <p className="mono deck-aide">← bof · validé → · tap tip = autre voix</p>
    </div>
  )
}

// ── le récap : décider d'abord, explorer ensuite ──
// trois lectures des 8 mêmes spots : la liste (verdicts), « en grand »
// (carrousel des tirages), « sur la carte » (mini-carte des 8 suggestions).
type VueRecap = 'liste' | 'grand' | 'carte'

// un tirage « en grand » : photo feuilletable (les 2-3 photos du lieu) +
// infos en bas (catégorie de la photo, distance, état, propreté des wc, tip).
function labelCatPhoto(t?: string) {
  return t === 'lieu' ? 'le lieu' : t === 'plat' ? 'le verre' : t === 'wc' ? 'les wc' : ''
}

function RecapTirage({
  lieu,
  valide,
  onVoir,
  onJeter,
}: {
  lieu: Lieu
  valide: boolean
  onVoir?: (l: Lieu) => void
  onJeter: (id: string) => void
}) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const depart = useRef({ x: 0, y: 0 })
  const press = useRef<{ timer: number; fired: boolean } | null>(null)
  const nbPhotos = lieu.photos.length
  const dist = distanceM(lieu)
  const horaire = etatHoraire(lieu.horaires)
  const wc = propreteWcLabel(lieu.propreteWc)

  const onDown = (e: React.PointerEvent) => {
    depart.current = { x: e.clientX, y: e.clientY }
    // appui long = on « jette » ce lieu (il sort du récap)
    press.current = { fired: false, timer: 0 }
    press.current.timer = window.setTimeout(() => {
      if (press.current) press.current.fired = true
      navigator.vibrate?.(30)
      onJeter(lieu.id)
    }, 500)
  }
  const onUp = (e: React.PointerEvent) => {
    const p = press.current
    press.current = null
    if (p) {
      clearTimeout(p.timer)
      if (p.fired) return // appui long → déjà jeté
    }
    const dx = e.clientX - depart.current.x
    const dy = e.clientY - depart.current.y
    const ax = Math.abs(dx)
    const ay = Math.abs(dy)
    // swipe vertical sur la photo = feuilleter (l'horizontal sert au carrousel)
    if (ay > 30 && ay > ax && nbPhotos > 1) {
      setPhotoIndex((i) => (dy < 0 ? (i + 1) % nbPhotos : (i - 1 + nbPhotos) % nbPhotos))
      return
    }
    // tap = photo suivante
    if (ax < 6 && ay < 6 && nbPhotos > 1) setPhotoIndex((i) => (i + 1) % nbPhotos)
  }

  return (
    <div className="recap-tirage">
      <div
        className="recap-tirage-photo"
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerLeave={() => {
          if (press.current) {
            clearTimeout(press.current.timer)
            press.current = null
          }
        }}
        style={{ touchAction: 'pan-x' }}
      >
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
          <span className="hand sans-photo">pas de photo.</span>
        )}
        {valide && <span className="recap-stamp mono">validé</span>}
        {nbPhotos > 0 && (
          <span className="mono recap-tirage-cat">{labelCatPhoto(lieu.photos[photoIndex]?.type)}</span>
        )}
      </div>

      <button className="recap-tirage-bas" onClick={() => onVoir?.(lieu)}>
        <div className="recap-tirage-nom">{lieu.nom}</div>
        {lieu.description && <p className="mono recap-tirage-desc">{lieu.description}</p>}
        {lieu.note && <p className="hand recap-tirage-tip">{lieu.note}</p>}
        <div className="mono recap-tirage-infos">
          <span>{formatDistance(dist)} · {tempsMarche(dist)} min</span>
          {horaire && (
            <span className={horaire.ouvert ? 'ouvert' : 'ferme'}>{horaire.texte}</span>
          )}
          {wc && <span className="recap-tirage-wc">wc {wc.points}</span>}
        </div>
        <span className="mono recap-tirage-plus">la fiche →</span>
      </button>
    </div>
  )
}

function Recap({
  deck,
  verdicts,
  onVoir,
  onRefaire,
  onJeter,
  onComparer,
}: {
  deck: Lieu[]
  verdicts: Record<string, Verdict>
  onVoir?: (l: Lieu) => void
  onRefaire: () => void
  onJeter: (id: string) => void
  onComparer?: (ids: string[]) => void
}) {
  const [vue, setVue] = useState<VueRecap>('liste')
  const validés = deck.filter((l) => verdicts[l.id] === 'valide').length

  return (
    <div className="recap">
      <p className="hand recap-titre">{PIQUES_FIN[1]}</p>
      <p className="mono recap-bilan">
        {validés > 0 ? `${validés} validé${validés > 1 ? 's' : ''} ce soir` : 'rien validé — t\'es dur'}
      </p>

      <div className="recap-vues" role="tablist">
        {(['liste', 'grand', 'carte'] as VueRecap[]).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={vue === v}
            className={`recap-vue ${vue === v ? 'on' : ''}`}
            onClick={() => setVue(v)}
          >
            {v === 'liste' ? 'la liste' : v === 'grand' ? 'en grand' : 'sur la carte'}
          </button>
        ))}
      </div>

      {vue === 'liste' && (
        <ul className="recap-liste">
          {deck.map((l) => (
            <li key={l.id} className="recap-lieu" onClick={() => onVoir?.(l)} role="button">
              <span className="recap-nom">{l.nom}</span>
              <span className={`recap-tampon mono ${verdicts[l.id] ?? 'passe'}`}>
                {verdicts[l.id] === 'valide' ? 'validé' : verdicts[l.id] === 'bof' ? 'bof' : '—'}
              </span>
            </li>
          ))}
        </ul>
      )}

      {vue === 'grand' && (
        <div className="recap-grand">
          {deck.map((l) => (
            <RecapTirage key={l.id} lieu={l} valide={verdicts[l.id] === 'valide'} onVoir={onVoir} onJeter={onJeter} />
          ))}
        </div>
      )}

      {vue === 'carte' && (
        <div className="recap-carte">
          <Carte lieux={deck} onVoir={onVoir} mini />
        </div>
      )}

      {deck.length > 1 && onComparer && (
        <button className="recap-comparer-go mono" onClick={() => onComparer(deck.map((l) => l.id))}>
          comparer les {deck.length} →
        </button>
      )}

      <button className="lien" onClick={onRefaire}>
        refais-moi le deck
      </button>
    </div>
  )
}
