import { useEffect, useMemo, useState } from 'react'
import {
  sauverProfil,
  ecrireSeuils,
  ecrireSuivis,
  marquerOnboarding,
  tousLesLieux,
  distanceM,
  formatDistance,
  definirMaPosition,
  type Lieu,
} from './db'
import { importerSeed } from './seed'
import ImportGoogle from './ImportGoogle'
import { t } from './langue'
import { suivre } from './analytique'

// ════════════════════════════════════════════════════════════════
// jeudi. — L'ONBOARDING « payoff d'abord, réglages après »
// A) le payoff : on te situe, puis on te MONTRE 2-3 vrais spots du carnet.
// C) la visite de « j. » (SKIPPABLE) : il commente 3 coins EN SITUATION,
//    pour t'apprendre la langue de l'app sans questionnaire abstrait.
// D) l'appropriation : ton prénom, ta tête (le cercle te reconnaît),
//    ta date de naissance (optionnelle).
// E) l'import : « tes adresses dorment dans Google Maps ? » — récupérables
//    en 3 étapes, skippable (un rappel doux reviendra, App.tsx).
// tout le reste (couleur, seuils €, critère, cercle) prend des défauts
// sensés et se règle plus tard dans le profil — plus rien ici.
// ════════════════════════════════════════════════════════════════

type Phase = 'situer' | 'payoff' | 'visite' | 'prenom' | 'import'

// les leçons de « j. », posées EN SITUATION sur un vrai spot (une par coin) :
// la confiance · le swipe · le vocabulaire.
const LECONS = [
  'ici, c’est un pote qui te parle. pas 4 000 inconnus.',
  'à droite si ça te tente, à gauche on oublie. essaie.',
  'des tips, jamais des avis. la nuance est tout.',
]

/** le tip lisible d'un spot : ta note d'abord, sinon la voix du cercle */
function tipDe(l: Lieu): string {
  return l.note?.trim() || l.tipsCercle?.[0]?.note?.trim() || ''
}

/** la méta mono d'un spot : distance (+ l'envie du moment si connue) */
function metaDe(l: Lieu): string {
  const d = formatDistance(distanceM(l))
  return l.envies[0] ? `${d} · ${l.envies[0]}` : d
}

export default function Onboarding({ onFini }: { onFini: () => void }) {
  const [phase, setPhase] = useState<Phase>('situer')
  const [prenom, setPrenom] = useState('')
  const [majeur, setMajeur] = useState(false)
  // le portrait (photo d'identité du carnet) + la date de naissance —
  // demandés dès la création du compte, sans bloquer si on passe
  const [portrait, setPortrait] = useState<File | null>(null)
  const [naissance, setNaissance] = useState('')
  const apercuPortrait = useMemo(
    () => (portrait ? URL.createObjectURL(portrait) : null),
    [portrait],
  )
  useEffect(() => {
    // l'object-URL précédent se libère quand la photo change / au démontage
    return () => {
      if (apercuPortrait) URL.revokeObjectURL(apercuPortrait)
    }
  }, [apercuPortrait])
  // les vrais spots publics du seed — chargés une fois (le seed est idempotent)
  const [spots, setSpots] = useState<Lieu[]>([])
  // bumpé quand la vraie géoloc arrive → les distances se recalculent
  const [posVersion, setPosVersion] = useState(0)
  const [sansGps, setSansGps] = useState(false)
  const [geoEnCours, setGeoEnCours] = useState(false)
  // le spot déplié dans le payoff (aperçu léger inline)
  const [apercu, setApercu] = useState<string | null>(null)
  // la visite : -1 = le mot de « j. », 0..2 = les trois coins
  const [pas, setPas] = useState(-1)

  useEffect(() => {
    let vivant = true
    // le seed pose les spots publics ; tousLesLieux les remonte (décor).
    importerSeed()
      .then(() => tousLesLieux())
      .then((tous) => {
        if (vivant) setSpots(tous.filter((l) => l.visibilite === 'public'))
      })
      .catch(() => {
        /* hors-ligne : le payoff affichera son repli digne */
      })
    return () => {
      vivant = false
    }
  }, [])

  // les trois spots publics les plus proches (recalcul quand la position bouge)
  const proches = useMemo(() => {
    void posVersion // dépendance réelle : la géoloc a pu déplacer « moi »
    return [...spots].sort((a, b) => distanceM(a) - distanceM(b)).slice(0, 3)
  }, [spots, posVersion])

  // ── A · la géoloc : repli propre si refus/lenteur (on garde Place Vendôme) ──
  const situer = () => {
    const suite = () => setPhase('payoff')
    if (!navigator.geolocation) {
      setSansGps(true)
      suite()
      return
    }
    setGeoEnCours(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        definirMaPosition({ lat: p.coords.latitude, lng: p.coords.longitude })
        setPosVersion((v) => v + 1)
        setGeoEnCours(false)
        suite()
      },
      () => {
        setSansGps(true)
        setGeoEnCours(false)
        suite()
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  // ── D · on sauve l'identité (prénom + portrait + naissance) + les
  // défauts différés, puis on propose l'import Google ──
  const validerIdentite = async () => {
    await sauverProfil({
      scoreSwipe: 100, // défaut : le swipe est la langue
      critere: 'le feeling',
      prenom: prenom.trim(),
      photo: portrait ?? undefined, // → Storage + photo_url (sauverProfil gère)
      naissance: naissance || undefined,
    })
    // les réglages différés : la couleur garde le défaut de l'app (on n'écrit
    // rien), les seuils € prennent la valeur standard, le cercle démarre VIDE
    // (les vraies invitations le rempliront).
    ecrireSeuils([20, 50])
    ecrireSuivis([])
    setPhase('import')
  }

  // ── E · la fin (après l'import, fait ou passé) ──
  const finir = () => {
    suivre('compte_cree')
    marquerOnboarding()
    onFini()
  }

  // ── PHASE A · 1 · « on te situe ? » ──────────────────────────────
  if (phase === 'situer') {
    return (
      <div className="onboard onb-situer">
        <div className="tampon-logo">Jeudi.</div>
        <h1 className="grande-question">{t('on te situe ?')}</h1>
        <p className="onboard-sous">{t('pour te dire ce qui se passe autour de toi.')}</p>
        <button className="valider" onClick={situer} disabled={geoEnCours}>
          {geoEnCours ? t('un instant…') : t('d’accord, situe-moi.')}
        </button>
        <button
          className="lien"
          onClick={() => {
            setSansGps(true)
            setPhase('payoff')
          }}
        >
          {t('plus tard')}
        </button>
      </div>
    )
  }

  // ── PHASE A · 2 · le payoff : de VRAIS spots, tout de suite ──────
  if (phase === 'payoff') {
    return (
      <div className="onboard onb-payoff">
        <div className="tampon-logo">Jeudi.</div>
        <h1 className="grande-question">{t('ça dit quoi ce soir ?')}</h1>
        {sansGps && <p className="mono onb-sansgps">{t('pas de GPS ? on te montre le centre.')}</p>}
        {proches.length > 0 ? (
          <>
            <ul className="onb-spots">
              {proches.map((l) => {
                const ouvert = apercu === l.id
                const tip = tipDe(l)
                return (
                  <li key={l.id} className="onb-spot">
                    <button
                      className="onb-spot-tete"
                      aria-expanded={ouvert}
                      onClick={() => setApercu(ouvert ? null : l.id)}
                    >
                      <span className="onb-spot-nom">{l.nom}</span>
                      <span className="mono onb-spot-meta">{metaDe(l)}</span>
                    </button>
                    {ouvert && (
                      <div className="onb-apercu">
                        {l.description && <p className="mono onb-apercu-desc">{l.description}</p>}
                        {tip ? (
                          <p className="hand onb-apercu-tip">{tip}</p>
                        ) : (
                          !l.description && (
                            <p className="mono onb-apercu-desc">un spot du carnet, tout près.</p>
                          )
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
            <p className="mono onb-souffle">{t('voilà ce que le carnet sait déjà.')}</p>
          </>
        ) : (
          <p className="onboard-sous">
            {t('le carnet se remplit encore. reviens ce soir — il aura des adresses pour toi.')}
          </p>
        )}
        <button className="valider" onClick={() => setPhase('visite')}>
          {t('continuer →')}
        </button>
      </div>
    )
  }

  // ── PHASE C · la visite de « j. » (SKIPPABLE partout) ────────────
  if (phase === 'visite') {
    const passer = () => setPhase('prenom')
    // -1 : le mot manuscrit de « j. » qui te tend son carnet
    if (pas < 0) {
      return (
        <div className="onboard onb-visite">
          <button className="mono onb-passer" onClick={passer}>
            {t('passer')}
          </button>
          <div className="tampon-logo">Jeudi.</div>
          <p className="hand onb-jnote">
            {t('tiens, mon carnet des soirs.\nje te montre mes trois coins ?\n— j.')}
          </p>
          <div className="onb-visite-actions">
            <button className="valider" onClick={() => setPas(0)}>
              {t('montre-moi →')}
            </button>
          </div>
        </div>
      )
    }
    // 0..2 : un vrai spot, une leçon EN SITUATION, écrite à la main par « j. »
    const spot = proches[pas]
    return (
      <div className="onboard onb-visite">
        <button className="mono onb-passer" onClick={passer}>
          {t('passer')}
        </button>
        <span className="mono onb-visite-compteur">{pas + 1}/3</span>
        {spot && (
          <div className="onb-carte-demo">
            <span className="onb-spot-nom">{spot.nom}</span>
            <span className="mono onb-spot-meta">{metaDe(spot)}</span>
            {/* le coin 2 : le swipe, montré sur la carte */}
            {pas === 1 && (
              <div className="mono onb-swipe-demo">
                <span>{t('← on oublie')}</span>
                <span>{t('ça te tente →')}</span>
              </div>
            )}
            {tipDe(spot) && <p className="hand onb-carte-demo-tip">{tipDe(spot)}</p>}
          </div>
        )}
        <p className="hand onb-jnote">{t(LECONS[pas])}</p>
        <div className="onb-visite-actions">
          {pas > 0 && (
            <button className="lien" onClick={() => setPas(pas - 1)}>
              {t('← précédent')}
            </button>
          )}
          {pas < 2 ? (
            <button className="valider" onClick={() => setPas(pas + 1)}>
              {t('suivant →')}
            </button>
          ) : (
            <button className="valider" onClick={passer}>
              {t('j’ai pigé →')}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── PHASE E · l'import : tes adresses dorment dans Google Maps ────
  if (phase === 'import') {
    return (
      <div className="onboard onb-import">
        <div className="tampon-logo">Jeudi.</div>
        <h1 className="grande-question">{t('tes adresses dorment dans Google Maps ?')}</h1>
        <p className="onboard-sous">
          {t('récupère-les en 3 étapes — ton carnet démarre plein, pas vide.')}
        </p>
        <ImportGoogle ouvertParDefaut onImporte={() => setTimeout(finir, 1100)} />
        <button className="lien" onClick={finir}>
          {t('plus tard — je commence à la main')}
        </button>
      </div>
    )
  }

  // ── PHASE D · l'appropriation : t'es qui ? (prénom + tête + date) ──
  return (
    <div className="onboard onb-prenom">
      <div className="tampon-logo">Jeudi.</div>
      <h1 className="grande-question">{t('c’est ton carnet maintenant. t’es qui ?')}</h1>
      <label className="onboard-naissance mono">
        {t('ton prénom')}
        <input
          className="onboard-input"
          placeholder={t('comment on t’appelle ?')}
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          autoFocus
        />
      </label>
      {/* la photo d'identité du carnet : demandée dès l'entrée (le cercle te
          reconnaît), mais on n'enferme personne — passable, reprise au profil */}
      <label className="onb-portrait">
        {apercuPortrait ? (
          <img className="onb-portrait-img" src={apercuPortrait} alt="ton portrait" />
        ) : (
          <span className="onb-portrait-vide mono">{t('ta tête ici')}</span>
        )}
        <span className="mono onb-portrait-legende">
          {portrait ? t('c’est toi ? parfait.') : t('ta photo — ton cercle te reconnaît')}
        </span>
        <input
          type="file"
          accept="image/*"
          capture="user"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) setPortrait(f)
          }}
        />
      </label>
      <label className="onboard-naissance mono">
        {t('ta date de naissance')} <span className="onb-optionnel">{t('(si tu veux)')}</span>
        <input
          type="date"
          className="onboard-input"
          value={naissance}
          onChange={(e) => setNaissance(e.target.value)}
        />
      </label>
      <label className="onb-majeur mono">
        <input type="checkbox" checked={majeur} onChange={(e) => setMajeur(e.target.checked)} />
        {t('j’ai 18 ans ou plus')}
      </label>
      <button className="valider" onClick={validerIdentite} disabled={!prenom.trim() || !majeur}>
        {t('c’est parti.')}
      </button>
    </div>
  )
}
