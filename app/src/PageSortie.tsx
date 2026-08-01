import { useCallback, useEffect, useRef, useState } from 'react'
// ════════════════════════════════════════════════════════════════
// jeudi. — /sortie/<token> : la page PUBLIQUE du match de groupe.
// L'invité arrive du lien WhatsApp, pose son prénom (SANS compte : sa
// clé vit dans son téléphone), réagit d'un tap, voit les totaux vivre,
// puis le verdict — et la porte d'entrée vers son propre carnet.
// Rendue AVANT le mur de connexion (main.tsx) : zéro auth requise.
// ════════════════════════════════════════════════════════════════
import { distanceM, formatDistance } from './db'
import { t } from './langue'
import {
  type SortieVue,
  type CleSortie,
  type ReactionSG,
  REACTIONS_SG,
  voirSortie,
  rejoindreSortie,
  voterSortie,
  lireCleSortie,
  ecrireCleSortie,
  gagnantSG,
  resumeSG,
  libelleRestant,
} from './sortieGroupe'

const POLL_MS = 8000

export default function PageSortie({ token }: { token: string }) {
  const [vue, setVue] = useState<SortieVue | null>(null)
  const [erreur, setErreur] = useState('')
  const [moi, setMoi] = useState<CleSortie | null>(() => lireCleSortie(token))
  const [prenom, setPrenom] = useState('')
  const [enCours, setEnCours] = useState(false)
  // le compte à rebours vit sans réseau : un battement toutes les 30 s
  const [, setBattement] = useState(0)
  const vivant = useRef(true)

  const charger = useCallback(async () => {
    try {
      const v = await voirSortie(token)
      if (vivant.current) {
        setVue(v)
        setErreur('')
      }
    } catch (e) {
      if (vivant.current && !vue) setErreur((e as Error).message)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    vivant.current = true
    // premier chargement différé d'un tick : jamais de setState dans le corps de l'effet
    const premier = setTimeout(() => void charger(), 0)
    const poll = setInterval(() => {
      if (!document.hidden) void charger()
    }, POLL_MS)
    const tic = setInterval(() => setBattement((b) => b + 1), 30000)
    return () => {
      vivant.current = false
      clearTimeout(premier)
      clearInterval(poll)
      clearInterval(tic)
    }
  }, [charger])

  const rejoindre = async () => {
    const p = prenom.trim()
    if (!p || enCours) return
    setEnCours(true)
    try {
      const { participantId, cle } = await rejoindreSortie(token, p)
      const c: CleSortie = { participantId, cle, prenom: p, votes: {} }
      ecrireCleSortie(token, c)
      setMoi(c)
      void charger()
    } catch (e) {
      setErreur((e as Error).message)
    } finally {
      setEnCours(false)
    }
  }

  const voter = async (candidatId: string, r: ReactionSG) => {
    if (!moi) return
    // optimiste : le tap s'encre tout de suite, le réseau suit
    const avant = moi
    const apres: CleSortie = { ...moi, votes: { ...moi.votes, [candidatId]: r } }
    setMoi(apres)
    ecrireCleSortie(token, apres)
    try {
      await voterSortie(token, moi.cle, candidatId, r)
      void charger()
    } catch (e) {
      setMoi(avant)
      ecrireCleSortie(token, avant)
      setErreur((e as Error).message)
      setTimeout(() => setErreur(''), 4000)
    }
  }

  // ── le lien mène nulle part / réseau mort ─────────────────────
  if (erreur && !vue) {
    return (
      <div className="sortie-page">
        <h1 className="sortie-marque">jeudi.</h1>
      <p className="mono sortie-promesse">{t('on dit où.')}</p>
        <p className="hand sortie-mot">{t(erreur)}</p>
        <a className="valider sortie-cta" href="/">
          {t('découvrir jeudi →')}
        </a>
      </div>
    )
  }

  if (!vue) {
    return (
      <div className="sortie-page">
        <h1 className="sortie-marque">jeudi.</h1>
      <p className="mono sortie-promesse">{t('on dit où.')}</p>
        <p className="mono sortie-meta">{t('on ouvre le carnet…')}</p>
      </div>
    )
  }

  const votants = vue.participants.filter((p) => p.aVote).length
  const total = vue.participants.length
  const restant = libelleRestant(vue.deadline)

  // ── LE VERDICT (vote clos ou deadline passée) ─────────────────
  // Le calcul de secours (gagnantSG) n'existe QUE si la deadline est tombée
  // sans gravure du créateur : un match CLOS sans gagnant est ANNULÉ —
  // jamais un faux « c'est dit. » qui enverrait le groupe au mauvais endroit.
  if (!vue.ouverte) {
    const gagnant =
      vue.candidats.find((c) => c.id === vue.gagnantId) ??
      (vue.statut === 'ouvert' ? gagnantSG(vue.candidats, vue.comptes) : null)
    return (
      <div className="sortie-page">
        <h1 className="sortie-marque">jeudi.</h1>
      <p className="mono sortie-promesse">{t('on dit où.')}</p>
        <p className="mono sortie-meta">{t('le vote est clos')}</p>
        {/* « on rejoue. » : l'ancien lien rapatrie ses votants vers le nouveau */}
        {vue.rematchToken && (
          <a className="valider sortie-cta" href={`/sortie/${vue.rematchToken}`}>
            {t('ça se rejoue — revote ici →')}
          </a>
        )}
        {gagnant ? (
          <>
            <h2 className="sortie-gagnant">{gagnant.nom}.</h2>
            <p className="hand sortie-mot" style={{ margin: '0 0 8px' }}>{t('c’est dit.')}</p>
            <p className="mono sortie-meta">
              {resumeSG(vue.comptes[gagnant.id]) || t('le spot le mieux placé pour le groupe')}
              {total > 0 && ` · ${votants}/${total} ${t('ont voté')}`}
            </p>
            {gagnant.adresse && <p className="mono sortie-meta">{gagnant.adresse}</p>}
            <a
              className="valider sortie-cta"
              href={`https://www.google.com/maps/dir/?api=1&destination=${gagnant.lat},${gagnant.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              {t("l'itinéraire →")}
            </a>
          </>
        ) : (
          <p className="hand sortie-mot">{t('personne n’a tranché — ce sera pour une prochaine.')}</p>
        )}
        <div className="sortie-porte">
          <p className="hand sortie-mot">{t('ce match, c’est jeudi.')}</p>
          <p className="sortie-porte-texte">
            {t('tu viens de découvrir')} {vue.candidats.length} {t('spots. garde-les dans ton propre carnet ?')}
          </p>
          <a className="sortie-cta-ligne" href="/">
            {t('ouvrir mon carnet →')}
          </a>
        </div>
      </div>
    )
  }

  // ── L'ARRIVÉE : poser son prénom, sans compte ─────────────────
  if (!moi) {
    return (
      <div className="sortie-page">
        <h1 className="sortie-marque">jeudi.</h1>
      <p className="mono sortie-promesse">{t('on dit où.')}</p>
        <h2 className="sortie-titre">
          {vue.createur ? `${vue.createur} ${t('vous propose.')}` : t('on vous propose.')}
        </h2>
        <p className="mono sortie-meta">
          {vue.titre ? `${vue.titre} · ` : ''}
          {vue.candidats.length} {t('spots · on vote le lieu')}
          {restant && ` · ${t('il reste')} ${restant}`}
        </p>
        <div className="sortie-apercu">
          {vue.candidats.map((c) => (
            <div key={c.id} className="sortie-carte">
              <div className="sortie-nom">{c.nom}</div>
              <div className="mono sortie-meta">
                {vue.centre ? `${formatDistance(distanceM(c, vue.centre))} ${t('du rendez-vous')}` : (c.adresse ?? '')}
              </div>
              {/* le tip manuscrit AVANT le prénom : c'est lui qui donne envie
                  de voter — une liste sèche est un sondage, un tip est jeudi */}
              {c.note && <p className="hand sortie-note">« {c.note} »</p>}
            </div>
          ))}
        </div>
        <input
          className="sortie-prenom"
          placeholder={t('ton prénom')}
          value={prenom}
          maxLength={30}
          onChange={(e) => setPrenom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void rejoindre()
          }}
        />
        <button className="valider sortie-cta" disabled={!prenom.trim() || enCours} onClick={() => void rejoindre()}>
          {enCours ? t('un instant…') : t('je vote →')}
        </button>
        <p className="hand sortie-mot sortie-centre">{t('sans compte, promis.')}</p>
        {erreur && <p className="mono sortie-erreur">{t(erreur)}</p>}
      </div>
    )
  }

  // ── LE VOTE : un tap par spot, les totaux vivent ──────────────
  return (
    <div className="sortie-page">
      <h1 className="sortie-marque">jeudi.</h1>
      <p className="mono sortie-promesse">{t('on dit où.')}</p>
      <p className="mono sortie-meta">
        {votants}/{total} {t('ont voté')}
        {restant && ` · ${t('il reste')} ${restant}`}
      </p>
      {vue.candidats.map((c) => {
        const monVote = moi.votes[c.id]
        const resume = resumeSG(vue.comptes[c.id])
        return (
          <div key={c.id} className="sortie-carte">
            <div className="sortie-nom">{c.nom}</div>
            <div className="mono sortie-meta">
              {vue.centre ? `${formatDistance(distanceM(c, vue.centre))} ${t('du rendez-vous')}` : (c.adresse ?? '')}
              {c.proposePar && ` · ${t('proposé par')} ${c.proposePar.toLowerCase()}`}
              {resume && ` · ${resume}`}
            </div>
            {c.note && <p className="hand sortie-note">« {c.note} »</p>}
            <div className="sortie-reactions">
              {REACTIONS_SG.map((r) => (
                <button
                  key={r}
                  className={`labo-chip${monVote === r ? ' on' : ''}`}
                  aria-pressed={monVote === r}
                  onClick={() => void voter(c.id, r)}
                >
                  {t(r)}
                </button>
              ))}
            </div>
          </div>
        )
      })}
      <p className="mono sortie-hint">{t('ta réaction reste anonyme — le groupe ne voit que les totaux.')}</p>
      <p className="hand sortie-mot">{t('la discussion, c’est sur WhatsApp. ici, on tranche.')}</p>
      <div role="alert">{erreur && <p className="mono sortie-erreur">{t(erreur)}</p>}</div>
    </div>
  )
}
