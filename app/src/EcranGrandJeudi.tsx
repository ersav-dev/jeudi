import { useMemo, useState } from 'react'
import { type Lieu, formatDistance, distanceM } from './db'

// ════════════════════════════════════════════════════════════════
// LE GRAND JEUDI — la nuit où la carte s'ouvre (CONCEPT.md)
// Le reste du temps : ton cercle. Mais cette nuit, le VOILE TOMBE → tous les
// spots PUBLICS de la ville, d'un coup, jusqu'au matin. Le super-pouvoir de l'app.
// Le déballage (spectacle), à ne pas confondre avec la recherche (qui répond).
// Ce n'est PLUS une option : c'est le 1ᵉʳ jeudi du mois, automatique
// (src/grandJeudi.ts). Le jour J, la bannière de « ce soir » et « trouver »
// ouvre cet écran ; les autres jours, l'aperçu vit dans les réglages.
// V5 : le drame reste, mais dans les règles — serif italique, filets graphite,
// et UNE seule cire : le bouton d'entrée (la cire coule dessus, signature 5).
// ════════════════════════════════════════════════════════════════
export default function GrandJeudi({
  lieux,
  onOuvrir,
}: {
  lieux: Lieu[]
  onOuvrir?: (l: Lieu) => void
}) {
  const [phase, setPhase] = useState<'voile' | 'ville'>('voile')

  // le voile n'ouvre que le PUBLIC (jamais l'intime des autres) ;
  // les lieux sans coords (0,0) sont écartés : ils fausseraient toutes les distances
  const publics = useMemo(
    () =>
      lieux
        .filter((l) => l.visibilite === 'public' && !(l.lat === 0 && l.lng === 0))
        .sort((a, b) => distanceM(a) - distanceM(b)),
    [lieux],
  )

  if (phase === 'voile') {
    return (
      <div className="gj-voile">
        <div className="mono gj-date">CE JEUDI</div>
        <h1 className="gj-titre">la ville s'ouvre.</h1>
        <p className="gj-sous">le voile tombe. tous les spots publics, d'un coup. jusqu'au matin.</p>
        <div className="mono gj-compte">
          {publics.length} adresses · toute la ville · cette nuit
        </div>
        {/* LA cire de l'écran : le sceau qu'on brise pour entrer */}
        <button className="valider sceau-cire gj-entrer" onClick={() => setPhase('ville')}>
          entrer dans la ville →
        </button>
        <p className="mono gj-note">ça reste l'exception. le reste du temps, c'est ton cercle.</p>
      </div>
    )
  }

  return (
    <div className="gj-ville">
      <div className="gj-ville-tete">
        <h2 className="gj-ville-titre">toute la ville.</h2>
        <button className="mono gj-voile-btn" onClick={() => setPhase('voile')}>
          le voile ↑
        </button>
      </div>
      <p className="mono gj-ville-meta">
        {publics.length} spots publics · ouverts cette nuit · le voile retombe au matin
      </p>

      {publics.length === 0 && (
        <div className="gj-vide">
          <p className="gj-vide-titre">la ville est encore silencieuse.</p>
          <p className="mono gj-vide-sous">
            aucun spot public pour l'instant — reviens quand la ville aura parlé.
          </p>
        </div>
      )}

      {/* le registre de la nuit : deux colonnes de lignes, pas des cartes */}
      <div className="gj-grille">
        {publics.map((l) => (
          <button key={l.id} className="gj-spot" onClick={() => onOuvrir?.(l)}>
            <div className="gj-spot-nom">{l.nom}</div>
            <div className="mono gj-spot-meta">
              {formatDistance(distanceM(l))}
              {l.envies[0] ? ` · ${l.envies[0]}` : ''}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
