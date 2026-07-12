import { useEffect, useMemo, useState } from 'react'
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
import { POINTS_REPERE, type Repere } from './autour'
import { chercherAdresse } from './nominatim'
import { estCeLeGrandJeudi, joursAvantGrandJeudi } from './grandJeudi'
import CroquisParis from './CroquisParis'

// L'onglet « trouver » (ex-labo, promu à part entière) : le moteur de
// recherche/reco personnalisé. Philosophie (CONCEPT.md) : la recherche RÉPOND
// (pull) → tout le public, mais confiance d'abord, et « ça répond, ça ne
// liste pas » (sans intention = pour toi).
export default function Recherche({
  lieux,
  cercle,
  onOuvrir,
}: {
  lieux: Lieu[]
  /** le VRAI cercle (ids + prénoms) — la confiance d'abord dans le tri */
  cercle: string[]
  onOuvrir?: (l: Lieu) => void
}) {
  const [texte, setTexte] = useState('')
  // debounce 200 ms : le moteur ne tourne pas à chaque frappe
  const [texteRetarde, setTexteRetarde] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setTexteRetarde(texte), 200)
    return () => clearTimeout(t)
  }, [texte])

  const [envie, setEnvie] = useState<Envie | null>(null)
  const [ouvertSeul, setOuvertSeul] = useState(false)
  // « autour de » : null = ma position, sinon un repère choisi
  const [depuis, setDepuis] = useState<Repere | null>(null)
  const [adr, setAdr] = useState('')
  // l'état de la recherche d'adresse (Nominatim) — visible, jamais silencieux
  const [etatAdr, setEtatAdr] = useState<'off' | 'cherche' | 'introuvable' | 'reseau'>('off')

  // favoris / vus : relus à CHAQUE retour sur l'écran (focus / onglet visible),
  // pas seulement au premier mount — ils ont pu changer depuis un autre écran.
  const [favoris, setFavoris] = useState<string[]>(() => lireFavoris())
  const [vus, setVus] = useState<string[]>(() => lireVus())
  useEffect(() => {
    const relire = () => {
      setFavoris(lireFavoris())
      setVus(lireVus())
    }
    window.addEventListener('focus', relire)
    document.addEventListener('visibilitychange', relire)
    return () => {
      window.removeEventListener('focus', relire)
      document.removeEventListener('visibilitychange', relire)
    }
  }, [])

  // les habitudes : déduites des tampons (validé/bof) + favoris + vus
  const gout = useMemo(() => {
    const valides = lieux.filter((l) => l.tampon?.v === 'valide')
    const bofs = lieux.filter((l) => l.tampon?.v === 'bof')
    return profilDeGout({ valides, bofs, favoris, vus })
  }, [lieux, favoris, vus])

  // a-t-on une intention ? (un mot, une envie, un filtre) — sinon « pour toi »
  const aIntention = texteRetarde.trim().length > 0 || envie !== null || ouvertSeul

  // point stabilisé (même référence tant que `depuis` ne change pas) : le
  // useMemo des résultats ne recalcule plus à chaque rendu
  const point = useMemo(
    () => (depuis ? { lat: depuis.lat, lng: depuis.lng } : undefined),
    [depuis],
  )

  const resultats = useMemo(() => {
    // sans intention : on ne LISTE pas le catalogue → « pour toi » (court)
    if (!aIntention) return pourToi(lieux, gout, { exclureVus: vus, topN: 12, cercle, depuis: point })
    // avec intention : on RÉPOND (peu, ciblé, confiance d'abord, autour du repère)
    const req: Requete = {
      texte: texteRetarde.trim() || undefined,
      envies: envie ? [envie] : undefined,
      ouvertSeulement: ouvertSeul,
    }
    return rechercher(lieux, req, gout, cercle, point).slice(0, 15)
  }, [lieux, texteRetarde, envie, ouvertSeul, gout, cercle, aIntention, point, vus])

  const lancerAdresse = async () => {
    const q = adr.trim()
    if (!q) return
    setEtatAdr('cherche')
    const r = await chercherAdresse(q)
    if (r.ok) {
      setDepuis({ nom: q, lat: r.lieux[0].lat, lng: r.lieux[0].lng })
      setAdr('')
      setEtatAdr('off')
    } else if (r.raison === 'annule') {
      // une recherche plus récente est partie : on la laisse conclure
    } else {
      setEtatAdr(r.raison)
    }
  }

  // V5 bloc 4 : les styles inline (pilules 999px, coins 8-10px, corps hors
  // échelle) ont migré vers les classes .labo-* en fin d'index.css
  const chip = (actif: boolean) => `labo-chip${actif ? ' on' : ''}`

  // la promesse du grand jeudi : une ligne, pas un bouton (le jour J, c'est
  // la bannière — posée par App — qui prend le relais)
  const joursGJ = joursAvantGrandJeudi(new Date())

  return (
    <div style={{ color: 'var(--ivory)' }}>
      {/* l'en-tête d'onglet : la voix serif, la glose mono */}
      <h2 className="labo-titre">trouver.</h2>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.6, margin: '0 0 14px' }}>
        dis ce que tu cherches, jeudi répond
      </p>

      <input
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="un nom, un quartier, une ambiance…"
        className="labo-champ"
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, margin: '12px 0' }}>
        {ENVIES.map((e) => (
          <button key={e} className={chip(envie === e)} onClick={() => setEnvie(envie === e ? null : e)}>
            {e}
          </button>
        ))}
        <button className={chip(ouvertSeul)} onClick={() => setOuvertSeul((v) => !v)}>
          ouvert
        </button>
      </div>

      {/* la ville en un coup d'œil : le croquis choisit la MÊME chose que les
          chips « autour de » — un seul état (depuis), deux façons de le poser */}
      <CroquisParis
        lieux={lieux}
        actif={depuis?.nom ?? null}
        onChoisir={(nom) => {
          const p = POINTS_REPERE.find((r) => r.nom === nom)
          if (p) setDepuis(depuis?.nom === p.nom ? null : p)
        }}
      />

      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginBottom: 6 }}>
        autour de
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
        <button className={chip(depuis === null)} onClick={() => setDepuis(null)}>
          ici
        </button>
        {POINTS_REPERE.map((p) => (
          <button
            key={p.nom}
            className={chip(depuis?.nom === p.nom)}
            onClick={() => setDepuis(depuis?.nom === p.nom ? null : p)}
          >
            {p.nom}
          </button>
        ))}
      </div>
      <input
        value={adr}
        onChange={(e) => {
          setAdr(e.target.value)
          setEtatAdr('off') // on retape → l'ancien message ne colle plus
        }}
        onKeyDown={(e) => e.key === 'Enter' && lancerAdresse()}
        placeholder="…ou une adresse / un métro (Entrée)"
        className="labo-champ petit"
        style={{ marginBottom: etatAdr === 'off' ? 14 : 4 }}
      />
      {etatAdr !== 'off' && (
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            marginBottom: 14,
            opacity: 0.75,
            color: etatAdr === 'cherche' ? 'var(--ivory)' : 'var(--red)',
          }}
        >
          {etatAdr === 'cherche'
            ? 'je cherche…'
            : etatAdr === 'introuvable'
              ? 'introuvable par ici. essaie plus précis.'
              : 'pas de réseau on dirait. réessaie dans un instant.'}
        </div>
      )}

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
            className="labo-resultat"
            style={{ cursor: onOuvrir ? 'pointer' : 'default' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <span className="labo-nom">{lieu.nom}</span>
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

      {/* le grand jeudi : pas un bouton, une promesse (le 1ᵉʳ jeudi du mois) */}
      {!estCeLeGrandJeudi(new Date()) && (
        <p className="mono gj-promesse">
          le grand jeudi · dans {joursGJ} jour{joursGJ > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
