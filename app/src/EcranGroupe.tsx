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
  type SortieActive,
  type ReactionSG,
  REACTIONS_SG,
  creerSortieGroupe,
  cloreSortie,
  voirSortie,
  voterSortie,
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

type Etape = 'compose' | 'shortlist' | 'suivi'

const chip = (actif: boolean) => `labo-chip${actif ? ' on' : ''}`
const TOP_CANDIDATS = 5
const POLL_MS = 15000

// la deadline, posée par le créateur au lancement (minimum serveur : 15 min)
const DEADLINES: { label: string; minutes: number | null }[] = [
  { label: '30 min', minutes: 30 },
  { label: '1 h', minutes: 60 },
  { label: '3 h', minutes: 180 },
  { label: 'pas de limite', minutes: null },
]

// « sortir à plusieurs » (onglet cercle) : LE match de groupe, branché sur
// le vrai moteur cloud. Un objet central « sortie » = des candidats + des
// votes. Le créateur compose ici ; les potes votent par UN lien WhatsApp
// (/sortie/<token>), app ou pas, sans compte. Pas de messagerie : le
// langage de réactions, agrégé en totaux. La conversation reste sur
// WhatsApp — jeudi. fournit l'objet dont on parle.
export default function Groupe({
  lieux,
  onOuvrir,
}: {
  lieux: Lieu[]
  onOuvrir?: (l: Lieu) => void
}) {
  const [active, setActive] = useState<SortieActive | null>(() => lireSortieActive())
  const [etape, setEtape] = useState<Etape>(active ? 'suivi' : 'compose')
  const [mesEnvies, setMesEnvies] = useState<Envie[]>(['apéro'])
  const [monDepart, setMonDepart] = useState<Repere>(repereMaPosition())
  const [deadlineMin, setDeadlineMin] = useState<number | null>(60)
  const [vue, setVue] = useState<SortieVue | null>(null)
  const [mesVotes, setMesVotes] = useState<Record<string, ReactionSG>>(() =>
    active ? (lireCleSortie(active.token)?.votes ?? {}) : {},
  )
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState('')
  const [copie, setCopie] = useState(false)
  // le compte à rebours bat sans réseau ; la clôture auto ne part qu'une fois
  const [, setBattement] = useState(0)
  const clotureLancee = useRef(false)

  // le rendez-vous : triangulé depuis les départs posés — le tien pour
  // l'instant, les leurs arriveront de leurs votes (v2)
  const centre = useMemo(() => triangule([monDepart]), [monDepart])

  // (0,0) = coordonnées manquantes : hors des calculs de distance
  const lieuxValides = useMemo(() => lieux.filter((l) => l.lat !== 0 || l.lng !== 0), [lieux])

  // MA sélection filtre en silence : ma vraie météo du porte-monnaie
  // (celle du deck) remplace l'ancien budget hardcodé — jamais révélée.
  const shortlist = useMemo<ScoreGroupe[]>(() => {
    const moi = monProfil(mesEnvies, budgetDepuisMeteo(lireMeteo()))
    return classerPourGroupe(lieuxValides, [moi], TOP_CANDIDATS, centre)
  }, [lieuxValides, mesEnvies, centre])

  const charger = useCallback(async () => {
    const a = lireSortieActive()
    if (!a) return
    try {
      setVue(await voirSortie(a.token))
      setErreur('')
    } catch {
      /* réseau en rade : la prochaine passe réessaie */
    }
  }, [])

  // suivi : realtime (chaque vote rappelle charger) + filet de poll + battement
  useEffect(() => {
    if (etape !== 'suivi' || !active) return
    // premier chargement différé d'un tick : jamais de setState dans le corps de l'effet
    const premier = setTimeout(() => void charger(), 0)
    const stop = ecouterVotes(active.id, () => void charger())
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
  }, [etape, active, charger])

  // la deadline est passée : l'app du créateur grave le verdict (une fois)
  useEffect(() => {
    if (!active || !vue) return
    if (vue.statut === 'ouvert' && !vue.ouverte && !clotureLancee.current) {
      clotureLancee.current = true
      const g = gagnantSG(vue.candidats, vue.comptes)
      void cloreSortie(active.id, g?.id ?? null).then(
        () => void charger(),
        () => {
          clotureLancee.current = false
        },
      )
    }
  }, [vue, active, charger])

  const toggleEnvie = (e: Envie) =>
    setMesEnvies((v) => (v.includes(e) ? v.filter((x) => x !== e) : [...v, e]))

  const sansEnvie = mesEnvies.length === 0

  const lancer = async () => {
    if (enCours || !shortlist.length) return
    setEnCours(true)
    setErreur('')
    try {
      const prenom = (await lireProfil())?.prenom?.trim() || 'moi'
      const creee = await creerSortieGroupe({
        titre: '',
        envies: mesEnvies,
        centre,
        deadline: deadlineMin ? new Date(Date.now() + deadlineMin * 60000) : null,
        monPrenom: prenom,
        candidats: shortlist.map((s) => s.lieu),
      })
      const a: SortieActive = { ...creee, quand: new Date().toISOString() }
      ecrireSortieActive(a)
      ecrireCleSortie(creee.token, {
        participantId: creee.participantId,
        cle: creee.cle,
        prenom,
        votes: {},
      })
      clotureLancee.current = false
      setMesVotes({})
      setVue(null)
      setActive(a)
      setEtape('suivi')
    } catch (e) {
      setErreur((e as Error).message)
    } finally {
      setEnCours(false)
    }
  }

  const voter = async (candidatId: string, r: ReactionSG) => {
    if (!active) return
    const avant = mesVotes
    const apres = { ...mesVotes, [candidatId]: r }
    setMesVotes(apres)
    const cle = lireCleSortie(active.token)
    if (cle) ecrireCleSortie(active.token, { ...cle, votes: apres })
    try {
      await voterSortie(active.token, active.cle, candidatId, r)
      void charger()
    } catch (e) {
      setMesVotes(avant)
      if (cle) ecrireCleSortie(active.token, { ...cle, votes: avant })
      setErreur((e as Error).message)
      setTimeout(() => setErreur(''), 4000)
    }
  }

  const partager = async () => {
    if (!active) return
    const url = lienSortie(active.token)
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
    if (!active || !vue || enCours) return
    setEnCours(true)
    try {
      const g = gagnantSG(vue.candidats, vue.comptes)
      await cloreSortie(active.id, g?.id ?? null)
      void charger()
    } catch (e) {
      setErreur((e as Error).message)
    } finally {
      setEnCours(false)
    }
  }

  const nouveauMatch = () => {
    // un match abandonné ne reste pas ouvert dans le vide : on le clôt
    // (best-effort) pour que la page des invités affiche le verdict
    if (active && vue?.ouverte) void cloreSortie(active.id, null).catch(() => undefined)
    ecrireSortieActive(null)
    setActive(null)
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
        <button
          className="valider"
          onClick={() => setEtape('shortlist')}
          disabled={sansEnvie}
          style={{ width: '100%', padding: '13px 0' }}
        >
          {t('voir la shortlist →')}
        </button>
      </div>
    )
  }

  // ── ÉTAPE 2 : la shortlist du carnet, avant d'ouvrir le vote ──
  if (etape === 'shortlist') {
    return (
      <div style={{ color: 'var(--ivory)' }}>
        <div className="labo-cap" style={{ marginBottom: 10 }}>{t('la shortlist du carnet')}</div>
        {shortlist.length === 0 && (
          <p className="labo-vide">{t('rien dans ta carte pour ça.')}</p>
        )}
        {shortlist.map((p) => (
          <div key={p.lieu.id} className="labo-carte" style={{ marginBottom: 10 }}>
            <div className="labo-nom">{p.lieu.nom}</div>
            <div className="mono" style={{ marginTop: 4 }}>
              {formatDistance(distanceM(p.lieu, centre))} {t('du rendez-vous')}
            </div>
            {p.lieu.note && <p className="hand labo-resume">{p.lieu.note}</p>}
          </div>
        ))}
        {erreur && <p className="mono" style={{ color: 'var(--cire-claire)', margin: '8px 0' }}>{t(erreur)}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={() => setEtape('compose')} className="labo-btn-ligne" style={{ flex: 1 }}>
            {t('← revoir')}
          </button>
          <button
            onClick={() => void lancer()}
            className="valider"
            disabled={enCours || shortlist.length === 0}
            style={{ flex: 1, padding: '12px 0' }}
          >
            {enCours ? t('un instant…') : t('lancer le vote →')}
          </button>
        </div>
      </div>
    )
  }

  // ── ÉTAPE 3 : le vote vit (realtime) — puis le verdict ───────
  if (!vue) {
    return (
      <div style={{ color: 'var(--ivory)' }}>
        <p className="mono">{t('on ouvre le carnet…')}</p>
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
        <button onClick={nouveauMatch} className="lien" style={{ marginTop: 18 }}>
          {t('↺ nouveau match')}
        </button>
      </div>
    )
  }

  // LE SUIVI — je partage, je vote, les totaux vivent
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

      <p className="labo-hint">{t('ta réaction reste anonyme — le groupe ne voit que les totaux.')}</p>
      {erreur && <p className="mono" style={{ color: 'var(--cire-claire)', margin: '8px 0 0' }}>{t(erreur)}</p>}

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button onClick={() => void trancher()} className="labo-btn-ligne" disabled={enCours} style={{ flex: 1 }}>
          {t('on tranche →')}
        </button>
        <button onClick={nouveauMatch} className="lien" style={{ flex: '0 0 auto' }}>
          {t('abandonner')}
        </button>
      </div>
    </div>
  )
}
