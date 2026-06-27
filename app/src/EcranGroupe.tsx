import { useMemo, useState } from 'react'
import { type Lieu, type Envie, ENVIES, formatDistance, distanceM } from './db'
import {
  PROFILS_MEMBRES,
  monProfil,
  classerPourGroupe,
  reactionsDuGroupe,
  triangule,
  type ScoreGroupe,
  type ReactionsLieu,
} from './groupe'
import { POINTS_REPERE, repereMaPosition, type Repere } from './autour'

// départs simulés des potes (en vrai : chacun pose le sien depuis son tél)
const DEPART_SIMULE: Record<string, Repere> = {
  karim: POINTS_REPERE.find((p) => p.nom === 'Canal St-Martin') ?? POINTS_REPERE[0],
  lea: POINTS_REPERE.find((p) => p.nom === 'Bastille') ?? POINTS_REPERE[1],
}

type Etape = 'compose' | 'swipe' | 'match'
type Prop = { score: ScoreGroupe; reactions: ReactionsLieu }

const chip = (actif: boolean): React.CSSProperties => ({
  padding: '5px 12px',
  borderRadius: 999,
  border: `1px solid ${actif ? 'var(--red)' : 'var(--ivory-faded)'}`,
  background: actif ? 'var(--red)' : 'transparent',
  color: actif ? 'var(--print-white)' : 'var(--ivory)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12,
  cursor: 'pointer',
})
const carte: React.CSSProperties = {
  background: 'var(--paper-2)',
  border: '1px solid rgba(240,234,217,0.08)',
  borderRadius: 12,
  padding: '14px 16px',
}

// Écran labo : le VRAI parcours du match de groupe (concept « on se voit où »).
// composer le groupe + départs → triangulation → je swipe → le 1er qui matche gagne.
// Local + cercle simulé (Karim/Léa réagissent tout seuls).
export default function Groupe({
  lieux,
  onOuvrir,
}: {
  lieux: Lieu[]
  onOuvrir?: (l: Lieu) => void
}) {
  const [etape, setEtape] = useState<Etape>('compose')
  const [avec, setAvec] = useState<string[]>(['karim', 'lea'])
  const [mesEnvies, setMesEnvies] = useState<Envie[]>(['apéro'])
  const [monDepart, setMonDepart] = useState<Repere>(repereMaPosition())
  const [i, setI] = useState(0)
  const [gagnant, setGagnant] = useState<Prop | null>(null)

  const groupe = useMemo(() => {
    const moi = monProfil(mesEnvies.length ? mesEnvies : ['apéro'], 1)
    const autres = avec.map((id) => PROFILS_MEMBRES[id]).filter(Boolean)
    return [moi, ...autres]
  }, [mesEnvies, avec])

  const centre = useMemo(() => {
    const departs = [monDepart, ...avec.map((id) => DEPART_SIMULE[id]).filter(Boolean)]
    return triangule(departs)
  }, [monDepart, avec])

  const props = useMemo<Prop[]>(
    () =>
      classerPourGroupe(lieux, groupe, 8, centre).map((score) => ({
        score,
        reactions: reactionsDuGroupe(score.lieu, groupe),
      })),
    [lieux, groupe, centre],
  )

  const toggleEnvie = (e: Envie) =>
    setMesEnvies((v) => (v.includes(e) ? v.filter((x) => x !== e) : [...v, e]))
  const toggleAvec = (id: string) =>
    setAvec((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]))

  const lancer = () => {
    setI(0)
    setGagnant(null)
    setEtape('swipe')
  }
  const passer = () => setI((n) => n + 1)
  const choisir = () => {
    setGagnant(props[i])
    setEtape('match')
  }

  // ── ÉTAPE 1 : composer ──────────────────────────────────────
  if (etape === 'compose') {
    return (
      <div style={{ color: 'var(--ivory)' }}>
        <h2 style={{ fontStyle: 'italic', fontSize: 30, margin: '4px 0 2px' }}>avec mes potes.</h2>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.6, margin: '0 0 16px' }}>
          chacun son départ · l'app triangule · le 1er qui matche gagne
        </p>

        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginBottom: 6 }}>
          qui sort ?
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
          <span style={{ ...chip(true), cursor: 'default' }}>toi</span>
          {Object.values(PROFILS_MEMBRES).map((m) => (
            <button key={m.id} style={chip(avec.includes(m.id))} onClick={() => toggleAvec(m.id)}>
              {m.prenom}
            </button>
          ))}
        </div>

        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginBottom: 6 }}>
          ton départ
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
          <button style={chip(monDepart.nom === 'ma position')} onClick={() => setMonDepart(repereMaPosition())}>
            ici
          </button>
          {POINTS_REPERE.map((p) => (
            <button key={p.nom} style={chip(monDepart.nom === p.nom)} onClick={() => setMonDepart(p)}>
              {p.nom}
            </button>
          ))}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, opacity: 0.4, marginBottom: 16 }}>
          {avec.map((id) => `${PROFILS_MEMBRES[id]?.prenom} part de ${DEPART_SIMULE[id]?.nom}`).join(' · ') ||
            'tu sors solo'}
        </div>

        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginBottom: 6 }}>
          l'envie du groupe
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 22 }}>
          {ENVIES.map((e) => (
            <button key={e} style={chip(mesEnvies.includes(e))} onClick={() => toggleEnvie(e)}>
              {e}
            </button>
          ))}
        </div>

        <button
          onClick={lancer}
          style={{
            width: '100%',
            padding: '13px 0',
            borderRadius: 12,
            border: 'none',
            background: 'var(--red)',
            color: 'var(--print-white)',
            fontStyle: 'italic',
            fontSize: 19,
            cursor: 'pointer',
          }}
        >
          trianguler →
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
          <p style={{ fontStyle: 'italic', fontSize: 20 }}>plus de propositions.</p>
          <p style={{ opacity: 0.6, marginTop: 6 }}>le groupe est difficile ce soir.</p>
          <button onClick={() => setEtape('compose')} style={{ ...chip(false), marginTop: 14 }}>
            ↺ recommencer
          </button>
        </div>
      )
    }
    return (
      <div style={{ color: 'var(--ivory)' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginBottom: 10 }}>
          proposition {i + 1}/{props.length} · à mi-chemin
        </div>

        <div style={{ ...carte, padding: '18px 18px' }}>
          <div style={{ fontStyle: 'italic', fontSize: 26 }}>{p.score.lieu.nom}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.6, marginTop: 4 }}>
            {formatDistance(distanceM(p.score.lieu, centre))} du rendez-vous · {p.score.pourquoi}
          </div>

          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid rgba(240,234,217,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {p.reactions.reactions.map((r) => (
              <div
                key={r.membre}
                style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
              >
                <span style={{ opacity: 0.8 }}>{r.membre}</span>
                <span style={{ color: r.reaction === 'chaud' ? 'var(--red)' : 'var(--ivory)', opacity: r.reaction === 'chaud' ? 1 : 0.6 }}>
                  {r.reaction}
                </span>
              </div>
            ))}
          </div>
          <div style={{ fontStyle: 'italic', fontSize: 15, opacity: 0.85, marginTop: 10 }}>
            « {p.reactions.resume} »
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            onClick={passer}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              border: '1px solid var(--ivory-faded)',
              background: 'transparent',
              color: 'var(--ivory)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ← passer
          </button>
          <button
            onClick={choisir}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              border: 'none',
              background: 'var(--red)',
              color: 'var(--print-white)',
              fontStyle: 'italic',
              fontSize: 17,
              cursor: 'pointer',
            }}
          >
            ça me va →
          </button>
        </div>
      </div>
    )
  }

  // ── ÉTAPE 3 : le match ──────────────────────────────────────
  const g = gagnant!
  const total = groupe.length
  const chauds = g.reactions.comptes.chaud ?? 0
  const plein = chauds === total
  return (
    <div style={{ color: 'var(--ivory)' }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1, color: 'var(--red)' }}>
        {plein ? 'ÇA MATCHE' : 'VOTRE CHOIX'}
      </div>
      <h2 style={{ fontStyle: 'italic', fontSize: 34, margin: '6px 0 4px' }}>{g.score.lieu.nom}</h2>
      <p style={{ fontStyle: 'italic', fontSize: 17, opacity: 0.9 }}>
        {plein ? 'tout le monde est chaud.' : g.reactions.resume}
      </p>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.6, marginTop: 8 }}>
        {formatDistance(distanceM(g.score.lieu, centre))} du rendez-vous · ouvert ? {g.score.ouvert === true ? 'oui' : g.score.ouvert === false ? 'non' : '?'}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        {onOuvrir && (
          <button
            onClick={() => onOuvrir(g.score.lieu)}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              border: 'none',
              background: 'var(--red)',
              color: 'var(--print-white)',
              fontStyle: 'italic',
              fontSize: 17,
              cursor: 'pointer',
            }}
          >
            on y va → la fiche
          </button>
        )}
        <button
          onClick={() => setEtape('compose')}
          style={{
            flex: onOuvrir ? '0 0 auto' : 1,
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid var(--ivory-faded)',
            background: 'transparent',
            color: 'var(--ivory)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ↺ relancer
        </button>
      </div>
    </div>
  )
}
