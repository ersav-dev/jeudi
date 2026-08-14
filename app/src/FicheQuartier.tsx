import { useEffect, useRef, useState } from 'react'
// ════════════════════════════════════════════════════════════════
// jeudi. — LA FICHE D'UNE ZONE : l'envers de la feuille.
//
// LE MOT EST LA POIGNÉE (14/08) : on touche le mot écrit sur la carte, et
// cette fiche se pose — la même feuille que celle du dessin, pas un écran
// de plus. Tout s'y règle en direct (le carnet note tout de suite) : le
// mot, l'encre, le cadran, le cœur. Et les deux gestes qui engagent :
//   · « refaire le tracé » — l'ancien reste en guide, on ne perd que lui ;
//   · « raturer » — on TIENT, le trait de cire se tire ; on lâche avant la
//     fin, il se rétracte. Jamais de « êtes-vous sûr ? » : la rature EST
//     la confirmation (planche 4).
// ════════════════════════════════════════════════════════════════
import { t } from './langue'
import { ENCRES, POIDS, type Quartier } from './quartiers'
import { ICoeur } from './icones'

const DUREE_RATURE_MS = 700

export default function FicheQuartier({
  zone,
  onMaj,
  onRefaire,
  onRature,
  onFermer,
}: {
  zone: Quartier
  /** chaque réglage s'écrit tout de suite — le carnet ne fait pas attendre */
  onMaj: (q: Quartier) => void
  onRefaire: (q: Quartier) => void
  onRature: (q: Quartier) => void
  onFermer: () => void
}) {
  // le parent nous monte avec `key={zone.id}` : changer de zone remonte la
  // fiche, l'état local repart proprement — pas de synchro par effet
  const [nom, setNom] = useState(zone.nom)

  // ── la rature tenue ─────────────────────────────────────────
  const [tenu, setTenu] = useState(false)
  const minuteur = useRef<number | null>(null)
  const tenir = () => {
    setTenu(true)
    minuteur.current = window.setTimeout(() => {
      setTenu(false)
      onRature(zone)
    }, DUREE_RATURE_MS)
  }
  const lacher = () => {
    setTenu(false)
    if (minuteur.current) {
      window.clearTimeout(minuteur.current)
      minuteur.current = null
    }
  }
  useEffect(() => lacher, [])

  const commit = (patch: Partial<Quartier>) => onMaj({ ...zone, nom: nom.trim(), ...patch })

  return (
    <div className="dessin-fiche fiche-quartier">
      <div className="fiche-tete">
        <span className="lbl mono" style={{ marginTop: 0 }}>
          {t('la zone')}
        </span>
        <button className="lien" onClick={onFermer}>
          {t('fermer')}
        </button>
      </div>

      <input
        className="dessin-mot"
        maxLength={24}
        placeholder={t('mon quartier')}
        value={nom}
        onChange={(ev) => setNom(ev.target.value)}
        onBlur={() => commit({})}
      />

      <span className="lbl mono">{t('l’encre')}</span>
      <div className="dessin-encres">
        {ENCRES.map((e) => (
          <button
            key={e.id}
            className={`dessin-encre${zone.encre === e.id ? ' choisie' : ''}`}
            style={{ background: e.hex }}
            aria-label={e.nom}
            aria-pressed={zone.encre === e.id}
            onClick={() => commit({ encre: e.id })}
          />
        ))}
      </div>

      <span className="lbl mono">{t('me recommander ici ?')}</span>
      <div className="dessin-crans">
        {POIDS.map((p) => (
          <button
            key={p.n}
            className={`dessin-cran${zone.poids === p.n ? ' choisi' : ''}`}
            aria-pressed={zone.poids === p.n}
            onClick={() => commit({ poids: p.n, coeur: p.n === 0 ? false : zone.coeur })}
          >
            <span className="p">{p.pastille}</span>
            <span className="m">{t(p.mot)}</span>
          </button>
        ))}
      </div>
      <button
        className={`dessin-coeur${zone.coeur ? ' allume' : ''}`}
        aria-pressed={zone.coeur === true}
        disabled={zone.poids === 0}
        onClick={() => commit({ coeur: !zone.coeur })}
      >
        <ICoeur taille={20} plein={zone.coeur === true} />
        <span>{t('en priorité')}</span>
      </button>

      <div className="fiche-actes">
        <button className="acte-refaire" onClick={() => onRefaire({ ...zone, nom: nom.trim() })}>
          {t('refaire le tracé')}
          <small>{t('l’ancien reste en guide')}</small>
        </button>
        <button
          className={`rature-hold${tenu ? ' tenu' : ''}`}
          onPointerDown={tenir}
          onPointerUp={lacher}
          onPointerLeave={lacher}
          onPointerCancel={lacher}
          onContextMenu={(ev) => ev.preventDefault()}
        >
          {t('raturer la zone')}
          <small>{t('tiens appuyé — le trait se tire')}</small>
          <i aria-hidden />
        </button>
      </div>
    </div>
  )
}
