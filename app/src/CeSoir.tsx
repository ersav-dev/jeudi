import { useEffect, useMemo, useRef, useState, lazy, Suspense, type ComponentProps } from 'react'
import {
  type Lieu,
  type PhotoLieu,
  labelTypePhoto,
  type Compagnie,
  type Meteo,
  COMPAGNIES,
  prixMeteo,
  COMPAGNIE_GLOSE,
  gloseEnvie,
  ajouterSortie,
  retirerSortie,
  lireMeteo,
  ecrireMeteo,
  distanceM,
  formatDistance,
  tempsMarche,
  etatHoraire,
  propreteWcLabel,
  lireFavoris,
  estAMoi,
  CURATEUR_JEUDI,
  NOM_JEUDI,
} from './db'
import { tirerPlans, type CompagnieTirage, type Plan } from './plans'
import { feteDuJour } from './fetes'
import { suivre } from './analytique'
import { t } from './langue'
import { srcPhoto, photoIndisponible } from './photos'
import { ISoleil, INuage, IPluie } from './icones'
import NoteMarge from './NoteMarge'
import { effacerNote } from './tuto'
import { type Moment, dateDuMoment, lireMoment, ecrireMoment, libelleMoment } from './moment'
import ChoixMoment from './ChoixMoment'
import { retenirParRayon, plafondRayon, trajetMin, libelleTrajet } from './rayon'
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
  { m: 'soleil', icone: <ISoleil />, label: t('grand soleil — on flambe') },
  { m: 'nuageux', icone: <INuage />, label: t('nuageux — ça va') },
  { m: 'pluie', icone: <IPluie />, label: t("pluie — c'est la merde") },
]

const PIQUES_FIN = ["t'es difficile ce soir.", "c'est tout ce que j'ai. reviens demain."]

export default function CeSoir({
  lieux,
  onVoir,
  onComparer,
  encart,
  onMatch,
}: {
  lieux: Lieu[]
  onVoir?: (l: Lieu) => void
  onComparer?: (ids: string[]) => void
  /** l'étiquette du match (« on dit où. ») — posée SOUS le cœur solo :
   *  le rituel du deck reste la première chose qu'on voit */
  encart?: React.ReactNode
  /** swiper « potos » ouvre la passerelle vers le match (« on dit où. ») */
  onMatch?: () => void
}) {
  const [compagnie, setCompagnie] = useState<Compagnie | null>(null)
  const [envie, setEnvie] = useState<string | null>(null)
  const [meteo, setMeteo] = useState<Meteo>(() => lireMeteo())
  // bloc B : la porte « je sais pas » — pas un 6e onglet, un mode DANS ce soir
  const [surprise, setSurprise] = useState(false)
  // « quand ? » — le MOMENT unifié (moment.ts, audit du cœur 01/08) : les
  // mêmes presets que le match + « à l'heure près » (l'heure libre). Par
  // défaut MAINTENANT (live) ; le choix est partagé avec le reste de l'app.
  const [moment, setMoment] = useState<Moment>(() => lireMoment())
  const choisirMoment = (m: Moment) => {
    setMoment(m)
    ecrireMoment(m)
  }
  const [, setTick] = useState(0)
  // « la question qui s'accorde » : le moment est TAPABLE dans la question —
  // le régler déplie les presets + l'heure libre, juste sous le titre
  const [reglerMoment, setReglerMoment] = useState(false)
  useEffect(() => {
    // seul « maintenant » est vivant (l'app ouverte à 17h59 verra la fête à 18h) ;
    // un moment figé n'a pas besoin de tick.
    if (moment.cle !== 'maintenant') return
    const t = setInterval(() => setTick((n) => n + 1), 60_000)
    return () => clearInterval(t)
  }, [moment.cle])
  const dateEffective = dateDuMoment(moment)
  const { envies, nuit } = lexiqueDuMoment(dateEffective)

  const choisirMeteo = (m: Meteo) => {
    setMeteo(m)
    ecrireMeteo(m)
  }

  const { deck, anneau } = useMemo(() => {
    if (!compagnie || !envie) return { deck: [] as Lieu[], anneau: null }
    const tag = envieVersTag(envie)
    const candidats = lieux.filter((l) => {
      const okCompagnie = l.compagnies.length === 0 || l.compagnies.includes(compagnie)
      const okEnvie = l.envies.length === 0 || (l.envies as string[]).includes(tag)
      const okMeteo = !l.meteo || meteo === 'soleil' || l.meteo === meteo || l.meteo === 'pluie'
      return okCompagnie && okEnvie && okMeteo
    })
    // le rayon (rayon.ts) : l'anneau s'ouvre jusqu'à remplir le deck, plafonné
    // par le moment — à Paris rien ne change (tout tient dans le 1er palier),
    // ailleurs il attrape la ville d'à côté et on l'ANNONCE au lieu de mentir.
    const a = retenirParRayon(candidats, (l) => distanceM(l), 8, plafondRayon(moment))
    // retenus arrive trié par distance : le sort STABLE par pertinence de tags
    // garde donc la proximité comme départage naturel
    const retenus = [...a.retenus]
    retenus.sort((x, y) => {
      const sx = ((x.envies as string[]).includes(tag) ? 2 : 0) + (x.compagnies.includes(compagnie) ? 1 : 0)
      const sy = ((y.envies as string[]).includes(tag) ? 2 : 0) + (y.compagnies.includes(compagnie) ? 1 : 0)
      return sy - sx
    })
    return { deck: retenus.slice(0, 8), anneau: a }
  }, [lieux, compagnie, envie, meteo, moment])

  if (envie === 'dodo') {
    return (
      <div className="vide bientot">
        <h1 className="grande-question">{t('sage.')}</h1>
        <p className="hand">{t('à jeudi.')}</p>
        <button className="lien" onClick={() => setEnvie(null)}>
          {t('en vrai non, je sors')}
        </button>
      </div>
    )
  }

  return (
    <div className="cesoir">
      {/* la question fondatrice, qui S'ACCORDE : « ça dit quoi [ce soir] ? »
          — le moment souligné se tape, et la ville de demain soir s'ouvre */}
      <h2 className="cesoir-question">
        {t('ça dit quoi')}{' '}
        <button
          className="cesoir-moment"
          onClick={() => setReglerMoment((v) => !v)}
          aria-expanded={reglerMoment}
        >
          {t(libelleMoment(moment))} <span className="cesoir-moment-chev">▾</span>
        </button>{' '}
        ?
      </h2>
      {reglerMoment && <ChoixMoment valeur={moment} onChange={choisirMoment} />}

      {/* la fête du jour (fetes.ts) : le 9 août c'est la Saint-Amour —
          un mot au crayon sous la question, 361 soirs sur 365 il n'y a rien */}
      {(() => {
        const fete = feteDuJour(dateEffective)
        return fete ? (
          <p className="hand cesoir-fete">
            {t('c’est')} {t(fete.nom)} — {t(fete.mot)}
          </p>
        ) : null
      })()}

      {surprise ? (
        <JeSaisPas
          lieux={lieux}
          maintenant={dateEffective}
          onVoir={onVoir}
          onFermer={() => setSurprise(false)}
        />
      ) : !(compagnie && envie) ? (
        <>
          {/* #10 : tout en swipe — gauche/droite = changer de choix · haut = valider */}
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
          {/* « potos » n'est plus une impasse : la passerelle vers le match —
              vous décidez ensemble, ou je choisis pour la bande (le deck) */}
          {compagnie === 'potos' && onMatch && (
            <button className="jsp-entree mono" onClick={onMatch}>
              {t('vous décidez ensemble ? on dit où. →')}
            </button>
          )}
          {/* les deux portes, côte à côte : le tirage (« je sais pas ») et le
              match (« on dit où ») — deux cases sur la même ligne, chacune en
              pile (glyphe dessiné, titre serif, glose mono). Plus lisible. */}
          <div className="cesoir-portes">
            <button className="jsp-porte" onClick={() => setSurprise(true)}>
              <svg className="jsp-porte-cartes" viewBox="0 0 66 44" aria-hidden="true">
                {/* l'éventail : trois cartes à jouer monoline, faces inconnues (?) */}
                <g fill="var(--nuit-2)" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
                  <rect x="7" y="11" width="17" height="25" rx="2" transform="rotate(-13 15.5 23.5)" />
                  <rect x="24.5" y="8" width="17" height="25" rx="2" />
                  <rect x="42" y="11" width="17" height="25" rx="2" transform="rotate(13 50.5 23.5)" />
                </g>
                <g fontFamily="'JetBrains Mono', monospace" fontSize="10" fill="currentColor" textAnchor="middle">
                  <text x="14.5" y="27" transform="rotate(-13 15.5 23.5)">?</text>
                  <text x="33" y="24">?</text>
                  <text x="51.5" y="27" transform="rotate(13 50.5 23.5)">?</text>
                </g>
              </svg>
              <span className="jsp-porte-txt">
                <span className="jsp-porte-titre">{t('je sais pas.')}</span>
                <span className="mono jsp-porte-sous">{t('tire trois plans du carnet →')}</span>
              </span>
            </button>
            {encart}
          </div>
        </>
      ) : (
        <>
          <button
            className="cesoir-rappel mono"
            onClick={() => {
              setCompagnie(null)
              setEnvie(null)
            }}
            title={t('recommencer')}
          >
            {compagnie} · {envie} <span className="cesoir-rappel-x">↺</span>
          </button>
          {compagnie === 'potos' && onMatch && (
            <button className="jsp-entree mono" onClick={onMatch}>
              {t('vous décidez ensemble ? on dit où. →')}
            </button>
          )}
          {/* l'anneau a dépassé la marche : on le dit — jamais un deck menteur */}
          {anneau?.elargi && (
            <p className="mono deck-rayon">
              {t('j’ai poussé jusqu’à')} ~{trajetMin(anneau.loinM).min} min —{' '}
              {t('c’est calme par ici.')}
            </p>
          )}
          <Deck key={`${compagnie}-${envie}-${meteo}`} deck={deck} maintenant={dateEffective} onVoir={onVoir} onComparer={onComparer} />
        </>
      )}

      {/* sur l'écran des questions, l'étiquette du match vit DANS la rangée
          des portes (ci-dessus) — ailleurs (surprise, deck) elle garde sa place */}
      {(surprise || (compagnie && envie)) && encart}

      <span className="lbl mono meteo-bas-lbl">{t('situation du portefeuille ?')}</span>
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
        {meteo === 'pluie' && <span className="mono pluie-mot">{t('il pleut sur ton porte-monnaie.')}</span>}
      </div>

    </div>
  )
}

// ── bloc B : le mode « je sais pas » — trois plans tirés du carnet ──
// l'app tire trois mini-plans (une zone + deux spots complémentaires) et les
// pose comme des pages. « re-tire » = nouvelle graine (le hasard côté app,
// le moteur plans.ts reste pur et testé à graine fixe).
function JeSaisPas({
  lieux,
  maintenant,
  onVoir,
  onFermer,
}: {
  lieux: Lieu[]
  maintenant: Date
  onVoir?: (l: Lieu) => void
  onFermer: () => void
}) {
  const [compagnie, setCompagnie] = useState<CompagnieTirage>('solo')
  const [graine, setGraine] = useState(() => Math.floor(Math.random() * 1_000_000_000))
  // le plan ALLUMÉ (index 0..2) : taper le jeton ① n'allume que SES épingles
  // sur la carte — on relie enfin chaque proposition à ses points. null = tous.
  const [planAllume, setPlanAllume] = useState<number | null>(null)
  const favoris = useMemo(() => lireFavoris(), [])
  // arrondi à la minute : le tirage ne bouge pas sous les yeux à chaque re-rendu
  const minute = Math.floor(maintenant.getTime() / 60000)
  // TRI PAR DISTANCE (Ersan, 08/08) : les plans se classent TOUJOURS du plus
  // proche au plus loin. Mesure retenue = la distance du spot A (le pivot) —
  // c'est CETTE distance qui s'affiche déjà dans l'accroche (« à X min de
  // toi »), le tri reste donc honnête : l'ordre affiché correspond au chiffre
  // affiché, sans recalcul caché. Le spot B, lui, n'est mesuré que depuis le
  // pivot (jamais depuis « toi ») — sa distance n'est pas comparable entre
  // plans sans la recalculer nous-mêmes, donc pas retenue pour le tri.
  const plans = useMemo(() => {
    const tires = tirerPlans(lieux, compagnie, graine, { favoris, maintenant: new Date(minute * 60000) })
    return [...tires].sort((a, b) => distanceM(a.spots[0].lieu) - distanceM(b.spots[0].lieu))
  }, [lieux, compagnie, graine, favoris, minute])

  const retirer = () => {
    navigator.vibrate?.(15) // la frappe légère
    setPlanAllume(null) // nouveau tirage : plus rien d'allumé
    setGraine(Math.floor(Math.random() * 1_000_000_000))
  }

  // tous les spots des plans → la VRAIE carte (MapLibre), avec le point
  // rouge « toi » déjà dedans : même code de position que « ma carte »
  const spotsDesPlans = useMemo(() => plans.flatMap((p) => p.spots.map((s) => s.lieu)), [plans])
  // chaque épingle porte son plan ET son rôle : A = le spot (jeton numéroté),
  // B = le plan B (lettre B, même encre désaturée) — la carte dit tout
  const plansDesPins = useMemo(() => {
    const rec: Record<string, { n: number; role: 'A' | 'B' }> = {}
    plans.forEach((p, i) =>
      p.spots.forEach((s, j) => (rec[s.lieu.id] = { n: i + 1, role: j === 0 ? 'A' : 'B' })),
    )
    return rec
  }, [plans])
  // le plan allumé → ses ids ; les autres épingles s'éteignent
  const idsAllumes =
    planAllume !== null && plans[planAllume]
      ? plans[planAllume].spots.map((s) => s.lieu.id)
      : null

  // « celui-là. » : la décision débouche sur du concret — la FICHE du spot
  // principal (itinéraire, photos, tampon). Le plan B reste lisible sur la
  // carte du plan avant de taper — plus jamais la table de comparaison.
  const celuiLa = (p: Plan) => {
    if (p.spots[0]) onVoir?.(p.spots[0].lieu)
  }

  return (
    <div className="jsp">
      <h1 className="grande-question qs-titre">{t('je sais pas.')}</h1>
      <span className="lbl mono qs-sous">{t('trois plans tirés du carnet')}</span>

      {/* le langage de chips existant : solo · duo · potos */}
      <div className="jsp-compagnies">
        {(['solo', 'duo', 'potos'] as const).map((c) => (
          <button
            key={c}
            className={`meteo-choix ${compagnie === c ? 'on' : ''}`}
            aria-pressed={compagnie === c}
            onClick={() => {
              setPlanAllume(null) // autre compagnie = autre tirage : rien d'allumé
              setCompagnie(c)
            }}
          >
            <span className="meteo-prix mono">{c}</span>
          </button>
        ))}
      </div>

      {plans.length === 0 && (
        <p className="hand jsp-vide">
          {t('pas deux spots ouverts assez proches pour un plan. capture, ou reviens plus tard.')}
        </p>
      )}

      {/* LA VRAIE CARTE (MapLibre, même code que « ma carte ») : les spots
          des plans épinglés sur la ville, le point rouge « toi » avec — on
          sait enfin OÙ c'est avant de choisir (rue inconnue ≠ plan invisible).
          Taper une épingle ouvre la fiche du spot. */}
      {plans.length > 0 && (
        <div className="jsp-carte">
          <Carte
            lieux={spotsDesPlans}
            onVoir={onVoir}
            mini
            plans={plansDesPins}
            allumes={idsAllumes}
            onPlan={(n) => setPlanAllume((v) => (v === n - 1 ? null : n - 1))}
          />
        </div>
      )}

      {plans.map((p, i) => (
        <div
          className={`jsp-plan p${i + 1}${planAllume === i ? ' allume' : ''}`}
          key={p.spots.map((s) => s.lieu.id).join('+')}
          style={{
            animationDelay: `${i * 70}ms`,
            transform: `rotate(${i % 2 ? 0.35 : -0.4}deg)`, // posées à la main
          }}
        >
          {/* taper l'en-tête (le jeton ①) allume CE plan sur la carte —
              re-taper éteint. La carte répond, les cartes-plans commandent. */}
          <button
            type="button"
            className="jsp-tete"
            aria-pressed={planAllume === i}
            onClick={() => setPlanAllume((v) => (v === i ? null : i))}
          >
            <span className="mono jsp-jeton">{i + 1}</span>
            <span className="jsp-zone">{p.zone}</span>
            <span className="mono jsp-tete-carte">
              {t('sur la carte')} {planAllume === i ? '●' : '○'}
            </span>
          </button>
          <span className="mono jsp-accroche">
            à {tempsMarche(distanceM(p.spots[0].lieu))} min de toi · {p.accroche}
          </span>
          <div className="jsp-spots">
            {p.spots.map((s, j) => (
              <button key={s.lieu.id} className="jsp-spot" onClick={() => onVoir?.(s.lieu)}>
                {/* la lettre du rôle, à l'encre du plan (A pleine, B désaturée) :
                    la même que sur l'épingle — l'index et la carte se répondent */}
                <span className={`mono jsp-ab${j === 0 ? '' : ' b'}`}>{j === 0 ? 'A' : 'B'}</span>
                <span className="jsp-spot-corps">
                  <span className="jsp-spot-nom">{s.lieu.nom}</span>
                  <span className="mono jsp-spot-ligne">{s.ligne}</span>
                </span>
              </button>
            ))}
          </div>
          <button className="jsp-va mono" onClick={() => celuiLa(p)}>
            {t('celui-là. →')}
          </button>
        </div>
      ))}

      <button className="jsp-retire mono" onClick={retirer}>
        {t('re-tire')}
      </button>
      <button className="lien" onClick={onFermer}>
        {t('en vrai, je choisis moi-même')}
      </button>
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

  // la question « ça dit quoi [moment] ? » vit désormais en tête d'écran
  // (cesoir-question) : l'étape 0 ne la répète plus, elle pose la sienne
  const titre =
    etape === 0
      ? nuit
        ? t('encore debout ?')
        : t('avec qui ?')
      : compagnie === 'potos'
        ? t('et ça dit quoi, les potos ?')
        : t('pour quoi faire ?')
  const sousTitre = etape === 0 ? '' : t("l'envie du moment")
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
  // geste interrompu (scroll natif, etc.) → on remet la scène en place
  const onCancel = () => setDrag({ x: 0, y: 0, actif: false })

  return (
    <div className="qs">
      <h1 className="grande-question qs-titre">{titre}</h1>
      {sousTitre && <span className="lbl mono qs-sous">{sousTitre}</span>}

      <div
        className="qs-scene"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
      >
        <button className="qs-fleche gauche" onClick={() => defiler(-1)} aria-label={t('précédent')}>
          ‹
        </button>
        <div
          className="qs-choix"
          style={{
            transform: `translate(${drag.x}px, ${drag.y < 0 ? drag.y * 0.4 : 0}px)`,
            transition: drag.actif ? 'none' : 'transform 240ms var(--pose)',
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
        <button className="qs-fleche droite" onClick={() => defiler(1)} aria-label={t('suivant')}>
          ›
        </button>
      </div>

      <div className="qs-points">
        {options.map((o, k) => (
          <span key={o} className={k === idx ? 'on' : ''} />
        ))}
      </div>

      <button className={`qs-valider mono ${drag.y < -20 && drag.actif ? 'pret' : ''}`} onClick={valider}>
        {t("c'est ça ↑")}
      </button>
      <p className="mono qs-aide">
        {t('← → changer · ↑ valider')}
        {etape === 1 ? t(' · ↓ revenir') : ''}
      </p>
    </div>
  )
}

// ── le deck : une carte à la fois, le swipe comme langue ──────
type Verdict = 'valide' | 'bof'

function Deck({
  deck,
  maintenant = new Date(),
  onVoir,
  onComparer,
}: {
  deck: Lieu[]
  maintenant?: Date
  onVoir?: (l: Lieu) => void
  onComparer?: (ids: string[]) => void
}) {
  const [index, setIndex] = useState(0)
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})
  const [photoIndex, setPhotoIndex] = useState(0)
  const [voixIndex, setVoixIndex] = useState(0)
  const [drag, setDrag] = useState({ x: 0, y: 0, actif: false })
  const depart = useRef({ x: 0, y: 0 })
  // V5 §6 : la carte relâchée PART comme une carte jetée — elle hérite de la
  // vitesse du geste (px/ms), le verdict tombe à la fin du vol (240 ms)
  const [envol, setEnvol] = useState<{ x: number; y: number } | null>(null)
  const vitesse = useRef({ vx: 0, vy: 0, t: 0 })
  const envolFin = useRef<(() => void) | null>(null)
  // démontage en plein vol : on solde le verdict — jamais de swipe perdu
  useEffect(() => () => envolFin.current?.(), [])
  // lot B : les lieux « jetés » au récap (appui long) → ils sortent de la vue
  const [jetes, setJetes] = useState<Set<string>>(new Set())

  if (deck.length === 0) {
    return (
      <div className="deck-vide">
        <p className="hand">{t('rien dans ta carte pour ça.')}</p>
        <p className="mono">{t("capture des spots, ou élargis l'envie.")}</p>
      </div>
    )
  }

  // ── le récap : on décide pendant, on explore après ──
  if (index >= deck.length) {
    const refaire = () => {
      setIndex(0)
      setVerdicts({})
      setPhotoIndex(0)
      setJetes(new Set()) // les jetés reviennent : sinon ils se re-swipent puis redisparaissent du récap
    }
    return (
      <Recap
        deck={deck.filter((l) => !jetes.has(l.id))}
        verdicts={verdicts}
        maintenant={maintenant}
        onVoir={onVoir}
        onRefaire={refaire}
        onJeter={(id) => {
          // un lieu validé avait déjà sa sortie en attente → on la retire,
          // sinon l'app redemanderait « alors, X ? » pour un lieu jamais fait
          if (verdicts[id] === 'valide') retirerSortie(id)
          setJetes((prev) => new Set(prev).add(id))
        }}
        onComparer={onComparer}
      />
    )
  }

  const lieu = deck[index]
  const rotation = (envol ? envol.x : drag.x) / 18
  const verdict = envol
    ? envol.x > 0
      ? 'valide'
      : 'bof'
    : drag.x > 60
      ? 'valide'
      : drag.x < -60
        ? 'bof'
        : null
  const nbPhotos = lieu.photos.length

  // même honnêteté que la fiche : une voix sans auteurId = du seed → « démo »
  const voix: { note: string; signature: string; demo?: boolean }[] = [
    ...(lieu.note
      ? [
          {
            note: lieu.note,
            // le fond éditorial « jeudi. » signe de son nom (pas « toi »)
            signature:
              !estAMoi(lieu) && lieu.proprietaire === CURATEUR_JEUDI ? NOM_JEUDI : 'toi',
          },
        ]
      : []),
    ...(lieu.tipsCercle ?? []).map((t) => ({ note: t.note, signature: t.auteur, demo: !t.auteurId })),
  ]
  const laVoix = voix[voixIndex % Math.max(voix.length, 1)]

  const suivant = (v: Verdict) => {
    if (v === 'valide') suivre('spot_valide', { lieu: lieu.nom })
    effacerNote('deck-swipe') // le geste est fait : la note en marge s'efface
    setVerdicts((prev) => ({ ...prev, [lieu.id]: v }))
    if (v === 'valide') {
      ajouterSortie({ lieuId: lieu.id, nom: lieu.nom, date: new Date().toISOString() })
    }
    setIndex((i) => i + 1)
    setPhotoIndex(0)
    setVoixIndex(0)
  }

  // le jet : la carte part avec la vitesse du geste, puis le verdict tombe
  const jeter = (v: Verdict) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      suivant(v) // pas de vol : le verdict tombe sec
      return
    }
    const sens = v === 'valide' ? 1 : -1
    // plancher 1,2 px/ms : une carte se JETTE, elle ne se range pas
    const vx = Math.max(Math.abs(vitesse.current.vx), 1.2) * sens
    setEnvol({ x: drag.x + vx * 240, y: drag.y * 0.3 + vitesse.current.vy * 120 })
    const fin = () => {
      envolFin.current = null
      window.clearTimeout(timer)
      setEnvol(null)
      suivant(v)
    }
    const timer = window.setTimeout(fin, 240)
    envolFin.current = fin
  }

  const onDown = (e: React.PointerEvent) => {
    if (envol) return // la carte précédente est encore en vol
    depart.current = { x: e.clientX, y: e.clientY }
    vitesse.current = { vx: 0, vy: 0, t: performance.now() }
    setDrag({ x: 0, y: 0, actif: true })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag.actif) return
    const x = e.clientX - depart.current.x
    const y = e.clientY - depart.current.y
    const t = performance.now()
    const dt = t - vitesse.current.t
    if (dt > 0) vitesse.current = { vx: (x - drag.x) / dt, vy: (y - drag.y) / dt, t }
    setDrag({ x, y, actif: true })
  }
  const onUp = (e: React.PointerEvent) => {
    const cible = e.target as HTMLElement
    if (drag.x > 90) {
      jeter('valide')
    } else if (drag.x < -90) {
      jeter('bof')
    } else if (
      // swipe haut/bas sur la photo = feuilleter (partout pareil dans l'app)
      Math.abs(drag.y) > 40 &&
      Math.abs(drag.y) > Math.abs(drag.x) &&
      cible.closest('.carte-photo') &&
      nbPhotos > 1
    ) {
      setPhotoIndex((p) => (drag.y < 0 ? (p + 1) % nbPhotos : (p - 1 + nbPhotos) % nbPhotos))
    } else if (Math.abs(drag.x) < 6 && Math.abs(drag.y) < 6) {
      // « s'efface quand t'as pigé » : la note ne part que si le tap a
      // PRODUIT son effet (une seule photo/voix → rien ne bouge → elle reste)
      if (cible.closest('.carte-photo') && nbPhotos > 1) {
        effacerNote('deck-tape')
        setPhotoIndex((p) => (p + 1) % nbPhotos)
      }
      if (cible.closest('.carte-voix') && voix.length > 1) {
        effacerNote('deck-tape')
        setVoixIndex((v) => (v + 1) % voix.length)
      }
    }
    setDrag({ x: 0, y: 0, actif: false })
  }
  // geste interrompu (scroll natif, etc.) → la carte revient en place
  const onCancel = () => setDrag({ x: 0, y: 0, actif: false })

  return (
    <div className="deck">
      <span className="mono deck-compteur">
        {index + 1}/{deck.length}
      </span>
      {index === deck.length - 1 && deck.length > 2 && (
        <p className="mono deck-pique">{t(PIQUES_FIN[0])}</p>
      )}
      <div className="pile">
        <div
          key={lieu.id} /* nouvelle carte = nouveau nœud : pas de glissement hérité */
          className="carte-lieu"
          style={{
            transform: envol
              ? `translate(${envol.x}px, ${envol.y}px) rotate(${rotation}deg)`
              : `translate(${drag.x}px, ${drag.y * 0.3}px) rotate(${rotation}deg)`,
            transition: drag.actif ? 'none' : 'transform 240ms var(--pose)',
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onCancel}
        >
          {verdict === 'valide' && <span className="tampon valide">{t('VALIDÉ')}</span>}
          {verdict === 'bof' && <span className="tampon bof">{t('bof')}</span>}
          <div className="carte-photo">
            {nbPhotos > 1 && (
              <div className="photo-tirets">
                {lieu.photos.map((_, i) => (
                  <span key={i} className={i === photoIndex ? 'on' : ''} />
                ))}
              </div>
            )}
            {nbPhotos > 0 ? (
              <img src={srcPhoto(lieu.photos[photoIndex])} alt={lieu.nom} onError={photoIndisponible} />
            ) : (
              <div className="tirage-vide">
                <span className="croix">✕</span>
                <span className="hand sans-photo">{t('pas encore de photo.')}</span>
              </div>
            )}
          </div>
          <div className="carte-nom">{lieu.nom}</div>
          <div className="mono carte-meta">
            <span>{formatDistance(distanceM(lieu))} · {libelleTrajet(distanceM(lieu))}</span>
            {(() => {
              const h = etatHoraire(lieu.horaires, maintenant)
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
                {laVoix.demo && <span className="tampon-demo">{t('démo')}</span>}
              </span>
            </div>
          )}
          {lieu.adresse && <p className="mono carte-adresse">{lieu.adresse}</p>}
        </div>
        {/* les notes en marge de l'ancien proprio : le swipe, puis le tap.
            une seule à la fois : la 1ʳᵉ carte, puis les suivantes. */}
        {index === 0 && <NoteMarge id="deck-swipe" fleche="coins" className="note-marge-deck" />}
        {index >= 1 && <NoteMarge id="deck-tape" fleche="bas" className="note-marge-deck2" />}
      </div>
      {/* a11y (panel WCAG) : le swipe reste la langue, mais plus la SEULE —
          deux vrais boutons équivalents, focusables, 44px min */}
      <div className="deck-boutons">
        <button className="deck-btn deck-btn-bof" onClick={() => jeter('bof')} aria-label={`${t('bof — écarter')} ${lieu.nom}`}>
          {t('bof')}
        </button>
        <button className="deck-btn deck-btn-valide" onClick={() => jeter('valide')} aria-label={`${t('validé — garder')} ${lieu.nom}`}>
          {t('validé')}
        </button>
      </div>
      <p className="mono deck-aide">{t('← bof · validé → · tap tip = autre voix')}</p>
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
  return t ? labelTypePhoto(t as PhotoLieu['type']) : ''
}

function RecapTirage({
  lieu,
  valide,
  maintenant = new Date(),
  onVoir,
  onJeter,
}: {
  lieu: Lieu
  valide: boolean
  maintenant?: Date
  onVoir?: (l: Lieu) => void
  onJeter: (id: string) => void
}) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const depart = useRef({ x: 0, y: 0 })
  const press = useRef<{ timer: number; fired: boolean } | null>(null)
  const nbPhotos = lieu.photos.length
  const dist = distanceM(lieu)
  const horaire = etatHoraire(lieu.horaires, maintenant)
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
        onPointerCancel={() => {
          // geste interrompu → l'appui long ne doit pas partir tout seul
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
          <img src={srcPhoto(lieu.photos[photoIndex])} alt={lieu.nom} onError={photoIndisponible} />
        ) : (
          <span className="hand sans-photo">{t('pas de photo.')}</span>
        )}
        {valide && <span className="recap-stamp mono">{t('validé')}</span>}
        {nbPhotos > 0 && (
          <span className="mono recap-tirage-cat">{t(labelCatPhoto(lieu.photos[photoIndex]?.type))}</span>
        )}
      </div>

      <button className="recap-tirage-bas" onClick={() => onVoir?.(lieu)}>
        <div className="recap-tirage-nom">{lieu.nom}</div>
        {lieu.description && <p className="mono recap-tirage-desc">{lieu.description}</p>}
        {lieu.note && <p className="hand recap-tirage-tip">{lieu.note}</p>}
        <div className="mono recap-tirage-infos">
          <span>{formatDistance(dist)} · {libelleTrajet(dist)}</span>
          {horaire && (
            <span className={horaire.ouvert ? 'ouvert' : 'ferme'}>{horaire.texte}</span>
          )}
          {wc && <span className="recap-tirage-wc">wc {wc.points}</span>}
        </div>
        <span className="mono recap-tirage-plus">{t('la fiche')} →</span>
      </button>
    </div>
  )
}

function Recap({
  deck,
  verdicts,
  maintenant = new Date(),
  onVoir,
  onRefaire,
  onJeter,
  onComparer,
}: {
  deck: Lieu[]
  verdicts: Record<string, Verdict>
  maintenant?: Date
  onVoir?: (l: Lieu) => void
  onRefaire: () => void
  onJeter: (id: string) => void
  onComparer?: (ids: string[]) => void
}) {
  const [vue, setVue] = useState<VueRecap>('liste')
  const validés = deck.filter((l) => verdicts[l.id] === 'valide').length

  return (
    <div className="recap">
      <p className="hand recap-titre">{t(PIQUES_FIN[1])}</p>
      <p className="mono recap-bilan">
        {validés > 0
          ? `${validés} ${t(validés > 1 ? 'validés ce soir' : 'validé ce soir')}`
          : t("rien validé — t'es dur")}
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
            {v === 'liste' ? t('la liste') : v === 'grand' ? t('en grand') : t('sur la carte')}
          </button>
        ))}
      </div>

      {vue === 'liste' && (
        <ul className="recap-liste">
          {deck.map((l) => (
            <li key={l.id} className="recap-lieu" onClick={() => onVoir?.(l)} role="button">
              {/* la preuve d'abord : la liste montrait des noms secs (audit 02/08) */}
              {l.photos.length > 0 ? (
                <img
                  className="recap-tirage"
                  src={srcPhoto(l.photos[0])}
                  alt=""
                  loading="lazy"
                  onError={photoIndisponible}
                />
              ) : (
                <span className="recap-tirage recap-tirage-vide" />
              )}
              <span className="recap-nom">{l.nom}</span>
              <span className={`recap-tampon mono ${verdicts[l.id] ?? 'passe'}`}>
                {verdicts[l.id] === 'valide' ? t('validé') : verdicts[l.id] === 'bof' ? t('bof') : '—'}
              </span>
            </li>
          ))}
        </ul>
      )}

      {vue === 'grand' && (
        <div className="recap-grand">
          {deck.map((l) => (
            <RecapTirage key={l.id} lieu={l} valide={verdicts[l.id] === 'valide'} maintenant={maintenant} onVoir={onVoir} onJeter={onJeter} />
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
          {t('comparer les')} {deck.length} →
        </button>
      )}

      <button className="lien" onClick={onRefaire}>
        {t('refais-moi le deck')}
      </button>
    </div>
  )
}
