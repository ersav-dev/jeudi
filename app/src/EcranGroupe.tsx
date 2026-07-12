import { useMemo, useState } from 'react'
import { type Lieu, type Envie, type MembreCercle, ENVIES, formatDistance, distanceM } from './db'
import {
  monProfil,
  classerPourGroupe,
  triangule,
  type MembrePref,
  type ScoreGroupe,
} from './groupe'
import { POINTS_REPERE, repereMaPosition, type Repere } from './autour'

type Etape = 'compose' | 'swipe' | 'match'

// V5 bloc 4 : les styles inline (pilules 999px, coins 12px, corps hors échelle)
// ont migré vers les classes .labo-* en fin d'index.css
const chip = (actif: boolean) => `labo-chip${actif ? ' on' : ''}`

// « sortir à plusieurs » (dans l'onglet cercle) : le parcours du match de
// groupe (concept « on se voit où »).
// Bloc D — vrais profils only : les membres = TON VRAI cercle (relations
// acceptées). L'app ne fait PAS parler tes potes : pas de fausses réactions
// signées — elle classe pour le groupe (envie commune, budget, rendez-vous),
// et toi tu swipes. Leurs envies/départs/swipes arriveront du cloud.
export default function Groupe({
  lieux,
  membres,
  onOuvrir,
  onInviter,
}: {
  lieux: Lieu[]
  /** le VRAI cercle (monCercle) — aucun membre simulé */
  membres: MembreCercle[]
  onOuvrir?: (l: Lieu) => void
  /** le canal de croissance : partager son lien d'invitation */
  onInviter?: () => void
}) {
  const [etape, setEtape] = useState<Etape>('compose')
  // par défaut, tout le cercle sort (les petits cercles, c'est le cas normal)
  const [avec, setAvec] = useState<string[]>(() => membres.map((m) => m.id))
  const [mesEnvies, setMesEnvies] = useState<Envie[]>(['apéro'])
  const [monDepart, setMonDepart] = useState<Repere>(repereMaPosition())
  const [i, setI] = useState(0)
  const [gagnant, setGagnant] = useState<ScoreGroupe | null>(null)

  // pas de repli silencieux sur ['apéro'] : zéro envie = bouton désactivé + message
  const groupe = useMemo<MembrePref[]>(() => {
    const moi = monProfil(mesEnvies, 1)
    // les potes du vrai cercle : l'envie du groupe vaut pour eux aussi tant
    // qu'ils n'ont pas posé les leurs — on ne leur invente RIEN de personnel
    const autres = avec
      .map((id) => membres.find((m) => m.id === id))
      .filter((m): m is MembreCercle => !!m)
      .map((m) => ({ id: m.id, prenom: m.prenom, envies: mesEnvies, budgetMax: 1 as const }))
    return [moi, ...autres]
  }, [mesEnvies, avec, membres])

  // le rendez-vous : triangulé depuis les départs posés — pour l'instant,
  // seul le tien existe (les leurs arriveront de leurs téléphones)
  const centre = useMemo(() => triangule([monDepart]), [monDepart])

  // (0,0) = coordonnées manquantes : hors des calculs de distance
  const lieuxValides = useMemo(() => lieux.filter((l) => l.lat !== 0 || l.lng !== 0), [lieux])

  const props = useMemo<ScoreGroupe[]>(
    () => classerPourGroupe(lieuxValides, groupe, 8, centre),
    [lieuxValides, groupe, centre],
  )

  const toggleEnvie = (e: Envie) =>
    setMesEnvies((v) => (v.includes(e) ? v.filter((x) => x !== e) : [...v, e]))
  const toggleAvec = (id: string) =>
    setAvec((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]))

  const sansEnvie = mesEnvies.length === 0
  const lancer = () => {
    if (sansEnvie) return
    setI(0)
    setGagnant(null)
    setEtape('swipe')
  }
  const passer = () => setI((n) => n + 1)
  const choisir = () => {
    setGagnant(props[i])
    setEtape('match')
  }

  // ── CERCLE VIDE : le match de groupe se joue à plusieurs ────
  if (membres.length < 1) {
    return (
      <div style={{ color: 'var(--ivory)' }} className="groupe-vide">
        <h2 className="labo-titre">sortir à plusieurs.</h2>
        <p className="hand groupe-vide-mot">le match de groupe se joue à plusieurs.</p>
        <p className="hand groupe-vide-mot">invite ton premier pote.</p>
        {onInviter && (
          <button className="inviter-pote" onClick={onInviter}>
            invite un pote dans ton cercle →
          </button>
        )}
      </div>
    )
  }

  // ── ÉTAPE 1 : composer ──────────────────────────────────────
  if (etape === 'compose') {
    return (
      <div style={{ color: 'var(--ivory)' }}>
        <h2 className="labo-titre">sortir à plusieurs.</h2>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.6, margin: '0 0 16px' }}>
          ton cercle · l'app propose pour le groupe · le 1er qui matche gagne
        </p>

        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginBottom: 6 }}>
          qui sort ?
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
          <span className="labo-chip on fixe">toi</span>
          {membres.map((m) => (
            <button key={m.id} className={chip(avec.includes(m.id))} onClick={() => toggleAvec(m.id)}>
              {m.prenom.toLowerCase()}
            </button>
          ))}
        </div>

        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginBottom: 6 }}>
          ton départ
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
          <button className={chip(monDepart.nom === 'ma position')} onClick={() => setMonDepart(repereMaPosition())}>
            ici
          </button>
          {POINTS_REPERE.map((p) => (
            <button key={p.nom} className={chip(monDepart.nom === p.nom)} onClick={() => setMonDepart(p)}>
              {p.nom}
            </button>
          ))}
        </div>
        <div className="labo-hint">
          leurs départs et leurs envies arriveront de leurs téléphones — ce soir, tu proposes.
        </div>

        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginBottom: 6 }}>
          l'envie du groupe
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 22 }}>
          {ENVIES.map((e) => (
            <button key={e} className={chip(mesEnvies.includes(e))} onClick={() => toggleEnvie(e)}>
              {e}
            </button>
          ))}
        </div>

        {sansEnvie && (
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.6, margin: '0 0 10px' }}>
            choisis au moins une envie — le groupe a besoin d'un cap.
          </p>
        )}
        <button className="valider" onClick={lancer} disabled={sansEnvie} style={{ width: '100%', padding: '13px 0' }}>
          proposer →
        </button>
      </div>
    )
  }

  // ── ÉTAPE 2 : je swipe les propositions ─────────────────────
  if (etape === 'swipe') {
    const p = props[i]
    if (!p) {
      return (
        <div style={{ color: 'var(--ivory)' }}>
          <p className="labo-vide">plus de propositions.</p>
          <p style={{ opacity: 0.6, marginTop: 6 }}>le groupe est difficile ce soir.</p>
          <button onClick={() => setEtape('compose')} className={chip(false)} style={{ marginTop: 14 }}>
            ↺ recommencer
          </button>
        </div>
      )
    }
    return (
      <div style={{ color: 'var(--ivory)' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginBottom: 10 }}>
          proposition {i + 1}/{props.length} · depuis ton départ
        </div>

        <div className="labo-carte" style={{ padding: '18px 18px' }}>
          <div className="labo-nom">{p.lieu.nom}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.6, marginTop: 4 }}>
            {formatDistance(distanceM(p.lieu, centre))} du rendez-vous · {p.pourquoi}
          </div>
          {p.lieu.note && <p className="hand labo-resume">{p.lieu.note}</p>}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={passer} className="labo-btn-ligne" style={{ flex: 1 }}>
            ← passer
          </button>
          <button onClick={choisir} className="valider" style={{ flex: 1, padding: '12px 0' }}>
            ça me va →
          </button>
        </div>
      </div>
    )
  }

  // ── ÉTAPE 3 : le match ──────────────────────────────────────
  const g = gagnant!
  return (
    <div style={{ color: 'var(--ivory)' }}>
      <div className="labo-cap">TON CHOIX POUR LE GROUPE</div>
      <h2 className="labo-titre" style={{ margin: '6px 0 4px' }}>{g.lieu.nom}</h2>
      <p style={{ fontStyle: 'italic', fontSize: 17, opacity: 0.9 }}>
        {g.satisfaits === g.total
          ? `ça couvre l'envie de tout le monde (${g.satisfaits}/${g.total}).`
          : g.pourquoi}
      </p>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.6, marginTop: 8 }}>
        {formatDistance(distanceM(g.lieu, centre))} du rendez-vous · ouvert ? {g.ouvert === true ? 'oui' : g.ouvert === false ? 'non' : '?'}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginTop: 12 }}>
        quand tes potes swiperont aussi, le match sera à plusieurs — là, c'est toi qui régales.
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        {onOuvrir && (
          <button onClick={() => onOuvrir(g.lieu)} className="valider" style={{ flex: 1, padding: '12px 0' }}>
            on y va → la fiche
          </button>
        )}
        <button
          onClick={() => setEtape('compose')}
          className="labo-btn-ligne"
          style={{ flex: onOuvrir ? '0 0 auto' : 1, padding: '12px 16px' }}
        >
          ↺ relancer
        </button>
      </div>
    </div>
  )
}
