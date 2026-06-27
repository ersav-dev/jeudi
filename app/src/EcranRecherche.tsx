import { useMemo, useState } from 'react'
import {
  type Lieu,
  type Envie,
  ENVIES,
  lireFavoris,
  lireVus,
  formatDistance,
  distanceM,
} from './db'
import { rechercher, pourToi, profilDeGout, type Requete } from './recherche'
import { MEMBRES } from './seed'
import { POINTS_REPERE, geocoderRepere, type Repere } from './autour'

// Écran « labo » : surface le moteur de recherche/reco personnalisé.
// Philosophie (CONCEPT.md) : la recherche RÉPOND (pull) → tout le public, mais
// confiance d'abord, et « ça répond, ça ne liste pas » (sans intention = pour toi).
export default function Recherche({
  lieux,
  onOuvrir,
}: {
  lieux: Lieu[]
  onOuvrir?: (l: Lieu) => void
}) {
  const [texte, setTexte] = useState('')
  const [envie, setEnvie] = useState<Envie | null>(null)
  const [ouvertSeul, setOuvertSeul] = useState(false)
  // « autour de » : null = ma position, sinon un repère choisi
  const [depuis, setDepuis] = useState<Repere | null>(null)
  const [adr, setAdr] = useState('')

  // ton cercle (prénoms + ids) → la confiance d'abord dans le tri
  const cercle = useMemo(() => MEMBRES.flatMap((m) => [m.id, m.prenom]), [])

  // les habitudes : déduites des tampons (validé/bof) + favoris + vus
  const gout = useMemo(() => {
    const valides = lieux.filter((l) => l.tampon?.v === 'valide')
    const bofs = lieux.filter((l) => l.tampon?.v === 'bof')
    return profilDeGout({ valides, bofs, favoris: lireFavoris(), vus: lireVus() })
  }, [lieux])

  // a-t-on une intention ? (un mot, une envie, un filtre) — sinon « pour toi »
  const aIntention = texte.trim().length > 0 || envie !== null || ouvertSeul

  const point = depuis ? { lat: depuis.lat, lng: depuis.lng } : undefined
  const resultats = useMemo(() => {
    // sans intention : on ne LISTE pas le catalogue → « pour toi » (court)
    if (!aIntention) return pourToi(lieux, gout, { exclureVus: lireVus(), topN: 12, cercle, depuis: point })
    // avec intention : on RÉPOND (peu, ciblé, confiance d'abord, autour du repère)
    const req: Requete = {
      texte: texte.trim() || undefined,
      envies: envie ? [envie] : undefined,
      ouvertSeulement: ouvertSeul,
    }
    return rechercher(lieux, req, gout, cercle, point).slice(0, 15)
  }, [lieux, texte, envie, ouvertSeul, gout, cercle, aIntention, point])

  const chercherAdresse = async () => {
    const r = await geocoderRepere(adr)
    if (r) {
      setDepuis(r)
      setAdr('')
    }
  }

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
      <h2 style={{ fontStyle: 'italic', fontSize: 30, margin: '4px 0 2px' }}>trouver.</h2>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.6, margin: '0 0 14px' }}>
        ce que tu cherches, croisé avec tes habitudes
      </p>

      <input
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="un nom, un quartier, une ambiance…"
        style={{
          width: '100%',
          padding: '11px 14px',
          borderRadius: 10,
          border: '1px solid var(--ivory-faded)',
          background: 'var(--paper-2)',
          color: 'var(--ivory)',
          fontFamily: "'Instrument Serif', serif",
          fontSize: 18,
          outline: 'none',
        }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, margin: '12px 0' }}>
        {ENVIES.map((e) => (
          <button key={e} style={chip(envie === e)} onClick={() => setEnvie(envie === e ? null : e)}>
            {e}
          </button>
        ))}
        <button style={chip(ouvertSeul)} onClick={() => setOuvertSeul((v) => !v)}>
          ouvert
        </button>
      </div>

      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginBottom: 6 }}>
        autour de
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
        <button style={chip(depuis === null)} onClick={() => setDepuis(null)}>
          ici
        </button>
        {POINTS_REPERE.map((p) => (
          <button
            key={p.nom}
            style={chip(depuis?.nom === p.nom)}
            onClick={() => setDepuis(depuis?.nom === p.nom ? null : p)}
          >
            {p.nom}
          </button>
        ))}
      </div>
      <input
        value={adr}
        onChange={(e) => setAdr(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && chercherAdresse()}
        placeholder="…ou une adresse / un métro (Entrée)"
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--ivory-faded)',
          background: 'var(--paper-2)',
          color: 'var(--ivory)',
          fontFamily: "'Instrument Serif', serif",
          fontSize: 15,
          outline: 'none',
          marginBottom: 14,
        }}
      />

      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginBottom: 8 }}>
        {aIntention
          ? `${resultats.length} réponse${resultats.length > 1 ? 's' : ''}`
          : 'pour toi · tape ou choisis une envie pour chercher'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {resultats.map(({ lieu, raisons }) => (
          <div
            key={lieu.id}
            onClick={() => onOuvrir?.(lieu)}
            style={{
              padding: '11px 14px',
              borderRadius: 10,
              background: 'var(--paper-2)',
              border: '1px solid rgba(240,234,217,0.08)',
              cursor: onOuvrir ? 'pointer' : 'default',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontStyle: 'italic', fontSize: 20 }}>{lieu.nom}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.6, whiteSpace: 'nowrap' }}>
                {formatDistance(distanceM(lieu, point))}
              </span>
            </div>
            {raisons.length > 0 && (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--red)', marginTop: 4 }}>
                {raisons.join(' · ')}
              </div>
            )}
          </div>
        ))}
        {resultats.length === 0 && (
          <p style={{ opacity: 0.5, fontStyle: 'italic' }}>rien sous la main. essaie une autre envie.</p>
        )}
      </div>
    </div>
  )
}
