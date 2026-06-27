import { useMemo, useState } from 'react'
import { type Lieu, type Envie, ENVIES, formatDistance, distanceM } from './db'
import { PROFILS_MEMBRES, monProfil, verdictDeGroupe } from './groupe'

// Écran « labo » : surface le match de groupe (« trouver un endroit avec ses potes »).
// Composant autonome — ne reçoit que la liste des lieux. Cercle simulé (Karim/Léa).
export default function Groupe({
  lieux,
  onOuvrir,
}: {
  lieux: Lieu[]
  onOuvrir?: (l: Lieu) => void
}) {
  const [mesEnvies, setMesEnvies] = useState<Envie[]>(['apéro'])
  const [avec, setAvec] = useState<string[]>(['karim', 'lea'])

  const groupe = useMemo(() => {
    const moi = monProfil(mesEnvies.length ? mesEnvies : ['apéro'], 1)
    const autres = avec.map((id) => PROFILS_MEMBRES[id]).filter(Boolean)
    return [moi, ...autres]
  }, [mesEnvies, avec])

  const verdict = useMemo(() => verdictDeGroupe(lieux, groupe, 5), [lieux, groupe])

  const toggleEnvie = (e: Envie) =>
    setMesEnvies((v) => (v.includes(e) ? v.filter((x) => x !== e) : [...v, e]))
  const toggleAvec = (id: string) =>
    setAvec((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]))

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

  return (
    <div style={{ color: 'var(--ivory)' }}>
      <h2 style={{ fontStyle: 'italic', fontSize: 30, margin: '4px 0 2px' }}>avec mes potes.</h2>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.6, margin: '0 0 14px' }}>
        l'app propose, le groupe réagit, on tranche
      </p>

      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginBottom: 6 }}>le groupe</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
        <span style={{ ...chip(true), cursor: 'default' }}>toi</span>
        {Object.values(PROFILS_MEMBRES).map((m) => (
          <button key={m.id} style={chip(avec.includes(m.id))} onClick={() => toggleAvec(m.id)}>
            {m.prenom}
          </button>
        ))}
      </div>

      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginBottom: 6 }}>ton envie</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
        {ENVIES.map((e) => (
          <button key={e} style={chip(mesEnvies.includes(e))} onClick={() => toggleEnvie(e)}>
            {e}
          </button>
        ))}
      </div>

      {!verdict ? (
        <p style={{ opacity: 0.5, fontStyle: 'italic' }}>aucun lieu sous la main.</p>
      ) : (
        <>
          <div
            onClick={() => onOuvrir?.(verdict.gagnant.lieu)}
            style={{
              padding: '16px 16px',
              borderRadius: 12,
              background: 'var(--paper-2)',
              border: '1px solid var(--red)',
              marginBottom: 16,
              cursor: onOuvrir ? 'pointer' : 'default',
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--red)', letterSpacing: 1 }}>
              LE VERDICT
            </div>
            <div style={{ fontStyle: 'italic', fontSize: 26, margin: '4px 0 6px' }}>{verdict.gagnant.lieu.nom}</div>
            <div style={{ fontStyle: 'italic', fontSize: 16, opacity: 0.85 }}>« {verdict.reactions.resume} »</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.6, marginTop: 8 }}>
              {verdict.gagnant.pourquoi} · {formatDistance(distanceM(verdict.gagnant.lieu))}
            </div>
          </div>

          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginBottom: 8 }}>
            la shortlist
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {verdict.shortlist.map(({ score, reactions }) => (
              <div
                key={score.lieu.id}
                onClick={() => onOuvrir?.(score.lieu)}
                style={{
                  padding: '11px 14px',
                  borderRadius: 10,
                  background: 'var(--paper-2)',
                  border: '1px solid rgba(240,234,217,0.08)',
                  cursor: onOuvrir ? 'pointer' : 'default',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontStyle: 'italic', fontSize: 19 }}>{score.lieu.nom}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.6, whiteSpace: 'nowrap' }}>
                    {score.satisfaits}/{score.total}
                  </span>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                  {Object.entries(reactions.comptes)
                    .map(([r, n]) => `${r} ×${n}`)
                    .join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
