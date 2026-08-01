import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type Lieu,
  type Envie,
  ENVIES,
  formatDistance,
  distanceM,
  lireMeteo,
  lireProfil,
} from './db'
import { monProfil, classerPourGroupe, triangule, type ScoreGroupe } from './groupe'
import { POINTS_REPERE, repereMaPosition, type Repere } from './autour'
import { t } from './langue'
import {
  type SortieVue,
  type ReactionSG,
  type MatchOuvert,
  REACTIONS_SG,
  creerSortieGroupe,
  cloreSortie,
  voirSortie,
  voterSortie,
  rejoindreSortie,
  ajouterCandidat,
  ecouterVotes,
  lienSortie,
  lireSortieActive,
  ecrireSortieActive,
  lireCleSortie,
  ecrireCleSortie,
  gagnantSG,
  resumeSG,
  libelleRestant,
  budgetDepuisMeteo,
} from './sortieGroupe'
import { lireMoment, dateDuMoment, libelleMoment, momentFutur } from './moment'
import CroquisParis from './CroquisParis'
import { ZONES_CROQUIS } from './croquisZones'

type Etape = 'compose' | 'shortlist' | 'suivi' | 'proposer'

const chip = (actif: boolean) => `labo-chip${actif ? ' on' : ''}`
// le carnet propose 8 candidats, les 5 mieux classés sont précochés —
// le créateur écarte/reprend d'un tap, ou pioche dans TOUTE sa carte
const POOL_CANDIDATS = 8
const PRESEL_CANDIDATS = 5
const MIN_CANDIDATS = 2
const MAX_CANDIDATS = 12 // même cap que le serveur (trigger 0006)
const POLL_MS = 15000
// « avant le rendez-vous » : la deadline se cale 1h30 avant le moment choisi
const RDV = -1

// la deadline, posée par le créateur au lancement (minimum serveur : 15 min)
const DEADLINES: { label: string; minutes: number | null }[] = [
  { label: '30 min', minutes: 30 },
  { label: '1 h', minutes: 60 },
  { label: '3 h', minutes: 180 },
  { label: 'pas de limite', minutes: null },
]

/** ma session dans un match : créateur (localStorage) ou participant (cloud) */
interface SessionMatch {
  id: string
  token: string
  cle: string
  participantId: string
  createur: boolean
}

function sessionDepuisActive(): SessionMatch | null {
  const a = lireSortieActive()
  if (!a) return null
  return { id: a.id, token: a.token, cle: a.cle, participantId: a.participantId, createur: true }
}

// ── le sélecteur « toute ma carte » : chercher, taper, c'est proposé ──
function ChoixSpot({
  lieux,
  exclus,
  centre,
  onChoisir,
  onFermer,
}: {
  lieux: Lieu[]
  exclus: Set<string>
  centre: { lat: number; lng: number }
  onChoisir: (l: Lieu) => void
  onFermer: () => void
}) {
  const [q, setQ] = useState('')
  // le croquis des quartiers : taper une zone filtre la liste (spatial, un tap)
  const [zone, setZone] = useState<string | null>(null)
  const dispo = useMemo(() => lieux.filter((l) => !exclus.has(l.id)), [lieux, exclus])
  const resultats = useMemo(() => {
    const terme = q.trim().toLowerCase()
    const bbox = zone ? ZONES_CROQUIS.find((z) => z.repere === zone)?.bbox : undefined
    let filtres = bbox
      ? dispo.filter(
          (l) => l.lat >= bbox[0] && l.lat < bbox[1] && l.lng >= bbox[2] && l.lng < bbox[3],
        )
      : dispo
    if (terme)
      filtres = filtres.filter(
        (l) =>
          l.nom.toLowerCase().includes(terme) || (l.adresse ?? '').toLowerCase().includes(terme),
      )
    return [...filtres].sort((a, b) => distanceM(a, centre) - distanceM(b, centre)).slice(0, 12)
  }, [dispo, q, zone, centre])
  return (
    <div>
      <div className="labo-cap" style={{ marginBottom: 6 }}>{t('toute ma carte')}</div>
      <CroquisParis
        lieux={dispo}
        actif={zone}
        onChoisir={(r) => setZone((v) => (v === r ? null : r))}
      />
      <input
        className="sortie-prenom"
        placeholder={t('un nom, un quartier…')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      {resultats.map((l) => (
        <button key={l.id} className="labo-carte sg-choix" onClick={() => onChoisir(l)}>
          <div className="labo-nom">{l.nom}</div>
          <div className="mono" style={{ marginTop: 3 }}>
            {formatDistance(distanceM(l, centre))} {t('du rendez-vous')}
            {l.envies.length > 0 && ` · ${l.envies.join(' · ')}`}
          </div>
        </button>
      ))}
      {resultats.length === 0 && <p className="labo-vide">{t('rien dans ta carte pour ça.')}</p>}
      <button onClick={onFermer} className="labo-btn-ligne" style={{ width: '100%', marginTop: 10 }}>
        {t('← retour au match')}
      </button>
    </div>
  )
}

// « on dit où. » — LE match de groupe, branché sur le vrai moteur cloud.
// Un objet central « sortie » = des candidats + des votes, et TROIS rôles :
// le créateur compose depuis toute sa carte, les participants inscrits
// proposent leurs spots, les invités WhatsApp votent parmi tout ça.
// Pas de messagerie : le langage de réactions, agrégé en totaux.
export default function Groupe({
  lieux,
  onOuvrir,
  rejoindre,
}: {
  lieux: Lieu[]
  onOuvrir?: (l: Lieu) => void
  /** un match du cloud où je suis membre (bandeau) — je le rejoins in-app */
  rejoindre?: MatchOuvert | null
}) {
  const [session, setSession] = useState<SessionMatch | null>(() => sessionDepuisActive())
  const [etape, setEtape] = useState<Etape>(session || rejoindre ? 'suivi' : 'compose')
  const [mesEnvies, setMesEnvies] = useState<Envie[]>(['apéro'])
  const [monDepart, setMonDepart] = useState<Repere>(repereMaPosition())
  // le moment choisi dans « sortir » s'accorde ici : si la sortie est pour
  // plus tard, la deadline par défaut se cale avant le rendez-vous
  const [deadlineMin, setDeadlineMin] = useState<number | null>(() =>
    momentFutur(lireMoment()) ? RDV : 60,
  )
  // null = la présélection du carnet (top 5) ; sinon le choix explicite
  const [selIds, setSelIds] = useState<string[] | null>(null)
  // les spots piochés dans TOUTE ma carte, en plus du top 8 proposé
  const [extras, setExtras] = useState<Lieu[]>([])
  const [vue, setVue] = useState<SortieVue | null>(null)
  const [mesVotes, setMesVotes] = useState<Record<string, ReactionSG>>(() =>
    session ? (lireCleSortie(session.token)?.votes ?? {}) : {},
  )
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState('')
  const [copie, setCopie] = useState(false)
  const [monPrenom, setMonPrenom] = useState('moi')
  // le compte à rebours bat sans réseau ; la clôture auto ne part qu'une fois
  const [, setBattement] = useState(0)
  const clotureLancee = useRef(false)

  useEffect(() => {
    let vivant = true
    void lireProfil().then((p) => {
      if (vivant && p?.prenom?.trim()) setMonPrenom(p.prenom.trim())
    })
    return () => {
      vivant = false
    }
  }, [])

  // membre d'un match du cloud (bandeau) : je le rejoins — idempotent côté
  // serveur, ma clé revient même si je suis déjà dedans
  useEffect(() => {
    if (session || !rejoindre) return
    let vivant = true
    const timer = setTimeout(() => {
      rejoindreSortie(rejoindre.token, '')
        .then(({ participantId, cle }) => {
          if (!vivant) return
          const s: SessionMatch = {
            id: rejoindre.id,
            token: rejoindre.token,
            cle,
            participantId,
            createur: rejoindre.estCreateur,
          }
          const local = lireCleSortie(rejoindre.token)
          ecrireCleSortie(rejoindre.token, {
            participantId,
            cle,
            prenom: local?.prenom ?? '',
            votes: local?.votes ?? {},
          })
          setMesVotes(local?.votes ?? {})
          setSession(s)
          setEtape('suivi')
        })
        .catch((e: Error) => {
          if (vivant) setErreur(e.message)
        })
    }, 0)
    return () => {
      vivant = false
      clearTimeout(timer)
    }
  }, [rejoindre, session])

  // le rendez-vous : triangulé depuis les départs posés — le tien pour
  // l'instant, les leurs arriveront de leurs votes (v2)
  const centre = useMemo(() => triangule([monDepart]), [monDepart])

  // (0,0) = coordonnées manquantes : hors des calculs de distance
  const lieuxValides = useMemo(() => lieux.filter((l) => l.lat !== 0 || l.lng !== 0), [lieux])

  // MA sélection filtre en silence : ma vraie météo du porte-monnaie
  // (celle du deck) remplace l'ancien budget hardcodé — jamais révélée.
  const shortlist = useMemo<ScoreGroupe[]>(() => {
    const moi = monProfil(mesEnvies, budgetDepuisMeteo(lireMeteo()))
    return classerPourGroupe(lieuxValides, [moi], POOL_CANDIDATS, centre, dateDuMoment(lireMoment()))
  }, [lieuxValides, mesEnvies, centre])

  // la sélection effective : le choix explicite, sinon les 5 mieux classés —
  // plus les spots piochés dans toute ma carte (cochés d'office)
  const idsChoisis = useMemo<Set<string>>(() => {
    const base = selIds ?? shortlist.slice(0, PRESEL_CANDIDATS).map((s) => s.lieu.id)
    return new Set([...base, ...extras.map((l) => l.id)].slice(0, MAX_CANDIDATS))
  }, [selIds, shortlist, extras])

  const basculerCandidat = (id: string) => {
    const suivant = new Set(idsChoisis)
    if (suivant.has(id)) suivant.delete(id)
    else suivant.add(id)
    setSelIds([...suivant])
    setExtras((v) => v.filter((l) => suivant.has(l.id)))
  }

  const charger = useCallback(async () => {
    if (!session) return
    try {
      setVue(await voirSortie(session.token))
      setErreur('')
    } catch {
      /* réseau en rade : la prochaine passe réessaie */
    }
  }, [session])

  // suivi : realtime (chaque vote rappelle charger) + filet de poll + battement
  useEffect(() => {
    if (etape !== 'suivi' || !session) return
    // premier chargement différé d'un tick : jamais de setState dans le corps de l'effet
    const premier = setTimeout(() => void charger(), 0)
    const stop = ecouterVotes(session.id, () => void charger())
    const poll = setInterval(() => {
      if (!document.hidden) void charger()
    }, POLL_MS)
    const tic = setInterval(() => setBattement((b) => b + 1), 30000)
    return () => {
      clearTimeout(premier)
      stop()
      clearInterval(poll)
      clearInterval(tic)
    }
  }, [etape, session, charger])

  // la deadline est passée : l'app du CRÉATEUR grave le verdict (une fois)
  useEffect(() => {
    if (!session?.createur || !vue) return
    if (vue.statut === 'ouvert' && !vue.ouverte && !clotureLancee.current) {
      clotureLancee.current = true
      const g = gagnantSG(vue.candidats, vue.comptes)
      void cloreSortie(session.id, g?.id ?? null).then(
        () => void charger(),
        () => {
          clotureLancee.current = false
        },
      )
    }
  }, [vue, session, charger])

  const toggleEnvie = (e: Envie) =>
    setMesEnvies((v) => (v.includes(e) ? v.filter((x) => x !== e) : [...v, e]))

  const sansEnvie = mesEnvies.length === 0

  const lancer = async () => {
    const retenusPool = shortlist.filter((s) => idsChoisis.has(s.lieu.id)).map((s) => s.lieu)
    const retenus = [...retenusPool, ...extras.filter((l) => idsChoisis.has(l.id))]
    if (enCours || retenus.length < MIN_CANDIDATS) return
    setEnCours(true)
    setErreur('')
    try {
      const moment = lireMoment()
      // la deadline : une durée choisie, « avant le rendez-vous » (1h30 avant
      // le moment, jamais sous le minimum serveur de 15 min), ou pas de limite
      let deadline: Date | null = null
      if (deadlineMin === RDV) {
        const d = new Date(dateDuMoment(moment).getTime() - 90 * 60000)
        deadline = d.getTime() > Date.now() + 16 * 60000 ? d : new Date(Date.now() + 30 * 60000)
      } else if (deadlineMin) {
        deadline = new Date(Date.now() + deadlineMin * 60000)
      }
      const creee = await creerSortieGroupe({
        titre: moment.cle === 'maintenant' ? 'ce soir' : libelleMoment(moment),
        envies: mesEnvies,
        centre,
        deadline,
        monPrenom,
        candidats: retenus.slice(0, MAX_CANDIDATS),
      })
      ecrireSortieActive({ ...creee, quand: new Date().toISOString() })
      ecrireCleSortie(creee.token, {
        participantId: creee.participantId,
        cle: creee.cle,
        prenom: monPrenom,
        votes: {},
      })
      clotureLancee.current = false
      setMesVotes({})
      setVue(null)
      setSession({ ...creee, createur: true })
      setEtape('suivi')
    } catch (e) {
      setErreur((e as Error).message)
    } finally {
      setEnCours(false)
    }
  }

  const voter = async (candidatId: string, r: ReactionSG) => {
    if (!session) return
    const avant = mesVotes
    const apres = { ...mesVotes, [candidatId]: r }
    setMesVotes(apres)
    const cle = lireCleSortie(session.token)
    if (cle) ecrireCleSortie(session.token, { ...cle, votes: apres })
    try {
      await voterSortie(session.token, session.cle, candidatId, r)
      void charger()
    } catch (e) {
      setMesVotes(avant)
      if (cle) ecrireCleSortie(session.token, { ...cle, votes: avant })
      setErreur((e as Error).message)
      setTimeout(() => setErreur(''), 4000)
    }
  }

  const proposer = async (l: Lieu) => {
    if (!session) return
    setEtape('suivi')
    try {
      await ajouterCandidat(session.id, l, monPrenom)
      void charger()
    } catch (e) {
      setErreur((e as Error).message)
      setTimeout(() => setErreur(''), 5000)
    }
  }

  const partager = async () => {
    if (!session) return
    const url = lienSortie(session.token)
    const texte = t('on dit où ? vote ici :')
    try {
      if (navigator.share) {
        await navigator.share({ text: `${texte} ${url}` })
        return
      }
    } catch {
      /* partage annulé : on retombe sur la copie */
    }
    try {
      await navigator.clipboard.writeText(`${texte} ${url}`)
      setCopie(true)
      setTimeout(() => setCopie(false), 3000)
    } catch {
      setErreur(url)
    }
  }

  const trancher = async () => {
    if (!session?.createur || !vue || enCours) return
    setEnCours(true)
    try {
      const g = gagnantSG(vue.candidats, vue.comptes)
      await cloreSortie(session.id, g?.id ?? null)
      void charger()
    } catch (e) {
      setErreur((e as Error).message)
    } finally {
      setEnCours(false)
    }
  }

  const nouveauMatch = () => {
    // un match abandonné ne reste pas ouvert dans le vide : le créateur le
    // clôt (best-effort) pour que la page des invités affiche le verdict
    if (session?.createur && vue?.ouverte) void cloreSortie(session.id, null).catch(() => undefined)
    ecrireSortieActive(null)
    setSession(null)
    setVue(null)
    setMesVotes({})
    clotureLancee.current = false
    setEtape('compose')
  }

  // ── ÉTAPE 1 : composer le match ─────────────────────────────
  if (etape === 'compose') {
    return (
      <div style={{ color: 'var(--ivory)' }}>
        <h2 className="labo-titre">{t('on dit où.')}</h2>
        <p className="mono" style={{ margin: '0 0 16px' }}>
          {t('tes potes votent par un lien — app ou pas, sans compte.')}
        </p>

        <div className="labo-cap" style={{ marginBottom: 6 }}>{t("l'envie du groupe")}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
          {ENVIES.map((e) => (
            <button key={e} className={chip(mesEnvies.includes(e))} onClick={() => toggleEnvie(e)}>
              {e}
            </button>
          ))}
        </div>

        <div className="labo-cap" style={{ marginBottom: 6 }}>{t('ton départ')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
          <button className={chip(monDepart.nom === 'ma position')} onClick={() => setMonDepart(repereMaPosition())}>
            {t('ici')}
          </button>
          {POINTS_REPERE.map((p) => (
            <button key={p.nom} className={chip(monDepart.nom === p.nom)} onClick={() => setMonDepart(p)}>
              {p.nom}
            </button>
          ))}
        </div>

        <div className="labo-cap" style={{ marginBottom: 6 }}>{t('on vote jusqu’à quand ?')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 22 }}>
          {/* la sortie est pour plus tard → la deadline sait se caler avant le rendez-vous */}
          {momentFutur(lireMoment()) && (
            <button className={chip(deadlineMin === RDV)} onClick={() => setDeadlineMin(RDV)}>
              {t('avant le rendez-vous')}
            </button>
          )}
          {DEADLINES.map((d) => (
            <button
              key={d.label}
              className={chip(deadlineMin === d.minutes)}
              onClick={() => setDeadlineMin(d.minutes)}
            >
              {d.minutes ? d.label : t('pas de limite')}
            </button>
          ))}
        </div>

        {sansEnvie && (
          <p className="mono" style={{ margin: '0 0 10px' }}>
            {t('choisis au moins une envie — le groupe a besoin d’un cap.')}
          </p>
        )}
        {erreur && <p className="mono" style={{ color: 'var(--cire-claire)', margin: '0 0 10px' }}>{t(erreur)}</p>}
        <button
          className="valider"
          onClick={() => {
            setSelIds(null) // nouvelle shortlist → présélection fraîche du carnet
            setExtras([])
            setEtape('shortlist')
          }}
          disabled={sansEnvie}
          style={{ width: '100%', padding: '13px 0' }}
        >
          {t('voir la shortlist →')}
        </button>
      </div>
    )
  }

  // ── ÉTAPE 2 : la shortlist — le carnet propose, TOI tu disposes ──
  if (etape === 'shortlist') {
    const cartes: { lieu: Lieu; duCarnet: boolean }[] = [
      ...shortlist.map((s) => ({ lieu: s.lieu, duCarnet: true })),
      ...extras.map((l) => ({ lieu: l, duCarnet: false })),
    ]
    const nChoisis = cartes.filter((c) => idsChoisis.has(c.lieu.id)).length
    return (
      <div style={{ color: 'var(--ivory)' }}>
        <div className="labo-cap" style={{ marginBottom: 4 }}>{t('la shortlist du carnet')}</div>
        <p className="mono" style={{ margin: '0 0 10px' }}>
          {nChoisis} {t('spots au vote')} · {t('tape un spot pour l’écarter ou le reprendre')}
        </p>
        {cartes.length === 0 && <p className="labo-vide">{t('rien dans ta carte pour ça.')}</p>}
        {cartes.map(({ lieu }) => {
          const dedans = idsChoisis.has(lieu.id)
          return (
            <button
              key={lieu.id}
              className={`labo-carte sg-choix${dedans ? '' : ' off'}`}
              onClick={() => basculerCandidat(lieu.id)}
              aria-pressed={dedans}
            >
              <div className="labo-nom">{lieu.nom}</div>
              <div className="mono" style={{ marginTop: 4 }}>
                {dedans ? `✓ ${t('au vote')}` : t('écarté')} ·{' '}
                {formatDistance(distanceM(lieu, centre))} {t('du rendez-vous')}
              </div>
              {lieu.note && <p className="hand labo-resume">{lieu.note}</p>}
            </button>
          )
        })}
        {/* la porte vers TOUTE ma carte — pas seulement le top 8 du carnet */}
        {nChoisis < MAX_CANDIDATS && (
          <button onClick={() => setEtape('proposer')} className="labo-btn-ligne" style={{ width: '100%', marginBottom: 10 }}>
            {t('+ piocher dans toute ma carte')}
          </button>
        )}
        {nChoisis < MIN_CANDIDATS && cartes.length > 0 && (
          <p className="mono" style={{ margin: '4px 0 0' }}>
            {t('garde au moins deux spots — sinon il n’y a rien à voter.')}
          </p>
        )}
        {erreur && <p className="mono" style={{ color: 'var(--cire-claire)', margin: '8px 0' }}>{t(erreur)}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={() => setEtape('compose')} className="labo-btn-ligne" style={{ flex: 1 }}>
            {t('← revoir')}
          </button>
          <button
            onClick={() => void lancer()}
            className="valider"
            disabled={enCours || nChoisis < MIN_CANDIDATS}
            style={{ flex: 1, padding: '12px 0' }}
          >
            {enCours ? t('un instant…') : t('lancer le vote →')}
          </button>
        </div>
      </div>
    )
  }

  // ── le sélecteur « toute ma carte » (avant OU pendant le vote) ──
  if (etape === 'proposer') {
    const dejaLa = session
      ? new Set((vue?.candidats ?? []).map((c) => c.lieuId ?? c.id))
      : idsChoisis
    return (
      <div style={{ color: 'var(--ivory)' }}>
        <ChoixSpot
          lieux={lieuxValides}
          exclus={dejaLa as Set<string>}
          centre={vue?.centre ?? centre}
          onChoisir={(l) => {
            if (session) {
              void proposer(l)
            } else {
              setExtras((v) => (v.some((x) => x.id === l.id) ? v : [...v, l]))
              setSelIds((v) => (v ? [...v, l.id] : null))
              setEtape('shortlist')
            }
          }}
          onFermer={() => setEtape(session ? 'suivi' : 'shortlist')}
        />
      </div>
    )
  }

  // ── ÉTAPE 3 : le vote vit (realtime) — puis le verdict ───────
  if (!session || !vue) {
    return (
      <div style={{ color: 'var(--ivory)' }}>
        <p className="mono">{t('on ouvre le carnet…')}</p>
        {erreur && <p className="mono" style={{ color: 'var(--cire-claire)', marginTop: 8 }}>{t(erreur)}</p>}
      </div>
    )
  }

  const votants = vue.participants.filter((p) => p.aVote).length
  const total = vue.participants.length
  const restant = libelleRestant(vue.deadline)

  // LE VERDICT — où le groupe converge vraiment
  if (!vue.ouverte) {
    const gagnant =
      vue.candidats.find((c) => c.id === vue.gagnantId) ?? gagnantSG(vue.candidats, vue.comptes)
    const lieuGagnant = gagnant?.lieuId ? lieux.find((l) => l.id === gagnant.lieuId) : undefined
    return (
      <div style={{ color: 'var(--ivory)' }}>
        <div className="labo-cap">{t('le verdict du groupe')}</div>
        {gagnant ? (
          <>
            <h2 className="labo-titre" style={{ margin: '6px 0 4px' }}>{gagnant.nom}</h2>
            <p className="hand" style={{ margin: '2px 0 0', opacity: 0.9 }}>{t('c’est dit.')}</p>
            <p className="mono" style={{ marginTop: 4 }}>
              {resumeSG(vue.comptes[gagnant.id]) || t('le spot le mieux placé pour le groupe')}
              {total > 0 && ` · ${votants}/${total} ${t('ont voté')}`}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <a
                className="valider"
                style={{ flex: 1, padding: '12px 0', textAlign: 'center', textDecoration: 'none' }}
                href={`https://www.google.com/maps/dir/?api=1&destination=${gagnant.lat},${gagnant.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                {t("l'itinéraire →")}
              </a>
              {onOuvrir && lieuGagnant && (
                <button
                  onClick={() => onOuvrir(lieuGagnant)}
                  className="labo-btn-ligne"
                  style={{ flex: '0 0 auto', padding: '12px 16px' }}
                >
                  {t('la fiche')}
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="labo-vide" style={{ marginTop: 8 }}>
            {t('personne n’a tranché — ce sera pour une prochaine.')}
          </p>
        )}
        {session.createur && (
          <button onClick={nouveauMatch} className="lien" style={{ marginTop: 18 }}>
            {t('↺ nouveau match')}
          </button>
        )}
      </div>
    )
  }

  // LE SUIVI — je partage, je vote, je propose ; les totaux vivent
  return (
    <div style={{ color: 'var(--ivory)' }}>
      <h2 className="labo-titre" style={{ margin: '4px 0 2px' }}>
        {votants}/{total} {t('ont voté')}.
      </h2>
      <p className="mono" style={{ margin: '0 0 4px' }}>
        {vue.participants.map((p) => p.prenom.toLowerCase()).join(' · ')}
      </p>
      {restant && (
        <p className="mono" style={{ margin: '0 0 12px' }}>
          {t('il reste')} {restant}
        </p>
      )}

      <button className="valider" onClick={() => void partager()} style={{ width: '100%', padding: '12px 0', margin: '6px 0 4px' }}>
        {t('envoyer le lien aux potes →')}
      </button>
      {copie && <p className="mono" style={{ margin: '4px 0 0' }}>{t('lien copié. colle-le sur WhatsApp.')}</p>}

      <div style={{ marginTop: 16 }}>
        {vue.candidats.map((c) => {
          const resume = resumeSG(vue.comptes[c.id])
          const monVote = mesVotes[c.id]
          return (
            <div key={c.id} className="labo-carte" style={{ marginBottom: 10 }}>
              <div className="labo-nom">{c.nom}</div>
              <div className="mono" style={{ marginTop: 3 }}>
                {vue.centre ? `${formatDistance(distanceM(c, vue.centre))} ${t('du rendez-vous')}` : (c.adresse ?? '')}
                {c.proposePar && ` · ${t('proposé par')} ${c.proposePar.toLowerCase()}`}
                {resume && ` · ${resume}`}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
                {REACTIONS_SG.map((r) => (
                  <button key={r} className={chip(monVote === r)} onClick={() => void voter(c.id, r)}>
                    {t(r)}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* chacun (créateur ou participant inscrit) peut mettre SES spots au vote */}
      {vue.candidats.length < MAX_CANDIDATS && (
        <button onClick={() => setEtape('proposer')} className="labo-btn-ligne" style={{ width: '100%', marginTop: 4 }}>
          {t('+ proposer un spot de ma carte')}
        </button>
      )}

      <p className="labo-hint">{t('ta réaction reste anonyme — le groupe ne voit que les totaux.')}</p>
      {erreur && <p className="mono" style={{ color: 'var(--cire-claire)', margin: '8px 0 0' }}>{t(erreur)}</p>}

      {session.createur && (
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={() => void trancher()} className="labo-btn-ligne" disabled={enCours} style={{ flex: 1 }}>
            {t('on tranche →')}
          </button>
          <button onClick={nouveauMatch} className="lien" style={{ flex: '0 0 auto' }}>
            {t('abandonner')}
          </button>
        </div>
      )}
    </div>
  )
}
