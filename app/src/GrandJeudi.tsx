import { useMemo, useState } from 'react'
import { type Lieu, formatDistance, distanceM } from './db'

// ════════════════════════════════════════════════════════════════
// LE GRAND JEUDI — la nuit où la carte s'ouvre (CONCEPT.md)
// Le reste du temps : ton cercle. Mais cette nuit, le VOILE TOMBE → tous les
// spots PUBLICS de la ville, d'un coup, jusqu'au matin. Le super-pouvoir de l'app.
// Le déballage (spectacle), à ne pas confondre avec la recherche (qui répond).
// ⚠️ ici le déclenchement est manuel (démo) ; en vrai = un jeudi sur X, push.
// ════════════════════════════════════════════════════════════════
export default function GrandJeudi({
  lieux,
  onOuvrir,
}: {
  lieux: Lieu[]
  onOuvrir?: (l: Lieu) => void
}) {
  const [phase, setPhase] = useState<'voile' | 'ville'>('voile')

  // le voile n'ouvre que le PUBLIC (jamais l'intime des autres)
  const publics = useMemo(
    () => lieux.filter((l) => l.visibilite === 'public').sort((a, b) => distanceM(a) - distanceM(b)),
    [lieux],
  )

  if (phase === 'voile') {
    return (
      <div
        style={{
          color: 'var(--ivory)',
          textAlign: 'center',
          padding: '60px 16px',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: 3,
            color: 'var(--red)',
            marginBottom: 14,
          }}
        >
          CE JEUDI
        </div>
        <h1
          style={{
            fontStyle: 'italic',
            fontSize: 46,
            lineHeight: 1.05,
            margin: 0,
            textShadow: '0 0 24px color-mix(in srgb, var(--red) 55%, transparent)',
          }}
        >
          la ville s'ouvre.
        </h1>
        <p style={{ fontStyle: 'italic', fontSize: 18, opacity: 0.85, marginTop: 16, maxWidth: 320 }}>
          le voile tombe. tous les spots publics, d'un coup. jusqu'au matin.
        </p>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginTop: 10 }}>
          {publics.length} adresses · toute la ville · cette nuit
        </div>
        <button
          onClick={() => setPhase('ville')}
          style={{
            marginTop: 34,
            padding: '15px 30px',
            borderRadius: 14,
            border: 'none',
            background: 'var(--red)',
            color: 'var(--print-white)',
            fontStyle: 'italic',
            fontSize: 21,
            cursor: 'pointer',
            boxShadow: '0 8px 28px color-mix(in srgb, var(--red) 45%, transparent)',
          }}
        >
          entrer dans la ville →
        </button>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, opacity: 0.35, marginTop: 20 }}>
          ça reste l'exception. le reste du temps, c'est ton cercle.
        </p>
      </div>
    )
  }

  return (
    <div style={{ color: 'var(--ivory)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 style={{ fontStyle: 'italic', fontSize: 28, margin: 0 }}>toute la ville.</h2>
        <button
          onClick={() => setPhase('voile')}
          style={{ background: 'none', border: 'none', color: 'var(--ivory-faded)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, cursor: 'pointer' }}
        >
          le voile ↑
        </button>
      </div>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.6, margin: '0 0 16px' }}>
        {publics.length} spots publics · ouverts cette nuit · le voile retombe au matin
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {publics.map((l) => (
          <button
            key={l.id}
            onClick={() => onOuvrir?.(l)}
            style={{
              textAlign: 'left',
              padding: '12px 13px',
              borderRadius: 11,
              background: 'var(--paper-2)',
              border: '1px solid color-mix(in srgb, var(--red) 22%, transparent)',
              color: 'var(--ivory)',
              cursor: onOuvrir ? 'pointer' : 'default',
            }}
          >
            <div style={{ fontStyle: 'italic', fontSize: 17, lineHeight: 1.15 }}>{l.nom}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, opacity: 0.55, marginTop: 5 }}>
              {formatDistance(distanceM(l))}
              {l.envies[0] ? ` · ${l.envies[0]}` : ''}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
