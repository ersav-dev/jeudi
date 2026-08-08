import { useEffect, useRef, useState } from 'react'
// ════════════════════════════════════════════════════════════════
// jeudi. — L'IMPORT D'UNE BOBINE : réglette, chambre noire, développement.
// Une vidéo de la galerie entre ici. AUCUN refus (§1.1) : la date de
// création est lue en silence (moov → lastModified → maintenant) et
// remplira `prise_le` — un vieux clip entrera en souvenir, c'est tout.
//
//   1. la réglette — la vidéo dépasse 10 s ? on choisit SA bobine
//      dedans. Un geste, pas une interdiction.
//   2. la chambre noire — grain, vignette, teinte, tremblement.
//      Rien n'est cuit : ces réglages sont un JSON, modifiables
//      toujours. Celui qui ne touche à rien obtient le super 8.
//   3. le développement — réencodage 720p (« ça se développe… »).
// ════════════════════════════════════════════════════════════════
import { t } from './langue'
import {
  DUREE_MAX_S,
  dateBobine,
  reglagesParDefaut,
  TEINTES,
  type ReglagesRendu,
  type Teinte,
} from './super8'
import {
  ouvrirVideo,
  vignettesReglette,
  frameA,
  developperBobine,
  type Bobine,
} from './bobine'
import { estDeLaSoiree, type FenetreSoiree } from './tirage'
import S8Ecran from './S8Ecran'

export interface BobinePrete {
  clip: Bobine
  reglages: ReglagesRendu
  priseLe: Date
  dedans: boolean
}

type Etape = 'ouverture' | 'reglette' | 'chambre' | 'developpe' | 'rate'

/** « 0:12 » — le temps sur la réglette */
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

const MOTS_TEINTE: Record<Teinte, string> = {
  couleur: 'couleur',
  delave: 'délavé',
  nb: 'n&b',
  sepia: 'sépia',
}

export default function ImportBobine({
  fichier,
  fen,
  onFini,
  onPasser,
}: {
  fichier: File
  fen: FenetreSoiree
  onFini: (b: BobinePrete) => void
  onPasser: () => void
}) {
  const [etape, setEtape] = useState<Etape>('ouverture')
  const [dureeS, setDureeS] = useState(0)
  const [priseLe, setPriseLe] = useState<Date | null>(null)
  const [vignettes, setVignettes] = useState<string[]>([])
  const [debut, setDebut] = useState(0)
  const [apercu, setApercu] = useState<string | null>(null)
  const [reglages, setReglages] = useState<ReglagesRendu>(reglagesParDefaut)
  const [avancement, setAvancement] = useState(0)

  // le <video> hors écran de bobine.ts (vignettes + apercus) — et une
  // URL séparée pour l'aperçu vivant de la chambre noire (le composant est
  // remonté par fichier via `key`, l'URL vit donc exactement sa durée)
  const outil = useRef<Awaited<ReturnType<typeof ouvrirVideo>> | null>(null)
  const [urlChambre] = useState(() => URL.createObjectURL(fichier))
  const videoChambre = useRef<HTMLVideoElement>(null)
  useEffect(() => () => URL.revokeObjectURL(urlChambre), [urlChambre])

  // ── l'ouverture : métadonnées, date, bande de vignettes ────────
  useEffect(() => {
    let vivant = true
    void (async () => {
      try {
        const [o, d] = await Promise.all([ouvrirVideo(fichier), dateBobine(fichier)])
        if (!vivant) {
          o.fermer()
          return
        }
        outil.current = o
        setPriseLe(d.date)
        setDureeS(o.dureeS)
        if (o.dureeS > DUREE_MAX_S + 0.25) {
          setVignettes(await vignettesReglette(o.video))
          setApercu(await frameA(o.video, 0))
          if (vivant) setEtape('reglette')
        } else {
          setEtape('chambre')
        }
      } catch {
        if (vivant) setEtape('rate')
      }
    })()
    return () => {
      vivant = false
      outil.current?.fermer()
      outil.current = null
    }
  }, [fichier])

  // ── l'aperçu vivant de la chambre noire : la fenêtre en boucle ─
  useEffect(() => {
    if (etape !== 'chambre') return
    const v = videoChambre.current
    if (!v) return
    v.currentTime = debut
    void v.play().catch(() => {})
    const fin = Math.min(dureeS || DUREE_MAX_S, debut + DUREE_MAX_S)
    const boucle = () => {
      if (v.currentTime >= fin) v.currentTime = debut
    }
    v.addEventListener('timeupdate', boucle)
    return () => {
      v.removeEventListener('timeupdate', boucle)
      v.pause()
    }
  }, [etape, debut, dureeS])

  const bougerDebut = (valeur: number) => {
    setDebut(valeur)
    const o = outil.current
    if (o) void frameA(o.video, valeur).then((f) => f && setApercu(f))
  }

  const developper = async () => {
    setEtape('developpe')
    setAvancement(0)
    // la réglette et l'aperçu n'ont plus besoin du <video> outil : on le
    // rend AVANT le réencodage (deux lecteurs sur le même fichier, iOS
    // n'aime pas)
    outil.current?.fermer()
    outil.current = null
    try {
      const clip = await developperBobine(fichier, debut, setAvancement)
      onFini({
        clip,
        reglages,
        priseLe: priseLe ?? new Date(),
        dedans: priseLe ? estDeLaSoiree(priseLe, fen) : true,
      })
    } catch {
      setEtape('rate')
    }
  }

  const fin = Math.min(dureeS || DUREE_MAX_S, debut + DUREE_MAX_S)
  const curseur = (
    nom: string,
    cle: 'grain' | 'vignette' | 'tremblement',
  ) => (
    <label className="chambre-curseur">
      <span className="mono chambre-nom">{nom}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={reglages[cle]}
        onChange={(e) => setReglages((r) => ({ ...r, [cle]: Number(e.target.value) }))}
      />
    </label>
  )

  // ── l'écran raté : on le dit, on n'insiste pas ─────────────────
  if (etape === 'rate') {
    return (
      <div className="tirage">
        <h1 className="grande-question">{t('cette bobine résiste.')}</h1>
        <p className="hand tirage-sous">{t('le fichier n’a pas pu être développé — un format exotique, sans doute.')}</p>
        <div className="validation-secondaires">
          <button className="lien" onClick={onPasser}>
            {t('tant pis pour celle-là.')}
          </button>
        </div>
      </div>
    )
  }

  if (etape === 'ouverture') {
    return (
      <div className="tirage">
        <h1 className="grande-question">{t('la bobine')}</h1>
        <p className="mono tirage-attente" role="status">
          {t('on regarde ce qu’il y a dessus…')}
        </p>
      </div>
    )
  }

  // ── le développement : la barre, rien d'autre à faire ──────────
  if (etape === 'developpe') {
    return (
      <div className="tirage">
        <h1 className="grande-question">{t('ça se développe…')}</h1>
        <div className="bobine-cuve" role="progressbar" aria-valuenow={Math.round(avancement * 100)} aria-valuemin={0} aria-valuemax={100}>
          <span className="bobine-bain" style={{ width: `${Math.round(avancement * 100)}%` }} />
        </div>
        <p className="mono tirage-aide">
          {t('l’extrait est rejoué en entier — dix secondes de film, dix secondes de cuve.')}
        </p>
      </div>
    )
  }

  // ── la réglette : choisir SA bobine de 10 s ────────────────────
  if (etape === 'reglette') {
    return (
      <div className="tirage">
        <h1 className="grande-question">{t('quel est LE moment ?')}</h1>
        <p className="hand tirage-sous">
          {t('la cartouche fait 10 secondes — choisis les tiennes.')}
        </p>

        {apercu && (
          <div className="bobine-apercu pf">
            <img src={apercu} alt="" />
            <span className="hand pf-duree">{`${mmss(debut)} → ${mmss(fin)}`}</span>
          </div>
        )}

        <div className="bobine-reglette">
          <div className="bobine-bande" aria-hidden>
            {vignettes.map((v, i) => (
              <img key={i} src={v} alt="" />
            ))}
            <span
              className="bobine-fenetre"
              style={{
                left: `${(debut / Math.max(dureeS, DUREE_MAX_S)) * 100}%`,
                width: `${(Math.min(DUREE_MAX_S, dureeS) / Math.max(dureeS, DUREE_MAX_S)) * 100}%`,
              }}
            />
          </div>
          <input
            type="range"
            aria-label={t('le début de la bobine')}
            min={0}
            max={Math.max(0, dureeS - DUREE_MAX_S)}
            step={0.1}
            value={debut}
            onChange={(e) => bougerDebut(Number(e.target.value))}
          />
        </div>

        <button className="valider" onClick={() => setEtape('chambre')}>
          {t('cette bobine.')}
        </button>
        <div className="validation-secondaires">
          <button className="lien" onClick={onPasser}>
            {t('finalement, non.')}
          </button>
        </div>
      </div>
    )
  }

  // ── la chambre noire ───────────────────────────────────────────
  return (
    <div className="tirage">
      <h1 className="grande-question">{t('la chambre noire')}</h1>
      <p className="hand tirage-sous">{t('règle ton rendu — tu pourras y revenir, rien n’est gravé.')}</p>

      <div className="chambre-apercu">
        <S8Ecran reglages={reglages} ageJours={0}>
          <video ref={videoChambre} src={urlChambre} muted playsInline loop preload="auto" />
        </S8Ecran>
      </div>

      <div className="chambre-pupitre">
        {curseur(t('le grain'), 'grain')}
        {curseur(t('la vignette'), 'vignette')}
        {curseur(t('le tremblement'), 'tremblement')}
        <div className="chambre-teintes" role="radiogroup" aria-label={t('la teinte')}>
          {TEINTES.map((te) => (
            <button
              key={te}
              role="radio"
              aria-checked={reglages.teinte === te}
              className={`tirage-choix${reglages.teinte === te ? ' choisi' : ''}`}
              onClick={() => setReglages((r) => ({ ...r, teinte: te }))}
            >
              {t(MOTS_TEINTE[te])}
            </button>
          ))}
        </div>
      </div>

      <button className="valider" onClick={() => void developper()}>
        {t('développer.')}
      </button>
      <div className="validation-secondaires">
        <button className="lien" onClick={onPasser}>
          {t('finalement, non.')}
        </button>
      </div>
    </div>
  )
}
