import { t, lireLangue } from './langue'
import { type Moment, type MomentCle, dateDuMoment } from './moment'

// « quand ? » — l'UI unique du moment, réutilisée partout (le deck de
// « sortir », le match — la recherche suivra). Chips dans la matière des
// choix météo + « à l'heure près » qui déplie l'heure LIBRE (datetime
// natif : sur téléphone c'est la roue système, le meilleur clavier d'heure).
const PRESETS: { cle: MomentCle; label: string }[] = [
  { cle: 'maintenant', label: 'maintenant' },
  { cle: 'soir', label: 'ce soir · 22h' },
  { cle: 'demain', label: 'demain soir' },
  { cle: 'jeudi', label: 'jeudi · 22h' },
]

/** la valeur par défaut du champ libre : demain 20h, format datetime-local */
function defautLibre(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(20, 0, 0, 0)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Date locale → valeur datetime-local (jamais d'UTC ici : l'heure d'une
 *  soirée est une heure LOCALE) */
function versLocal(iso: string): string {
  const d = new Date(iso)
  if (!isFinite(d.getTime())) return defautLibre()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function ChoixMoment({
  valeur,
  onChange,
}: {
  valeur: Moment
  onChange: (m: Moment) => void
}) {
  return (
    <>
      <div className="meteo-bas moment-chips">
        {PRESETS.map(({ cle, label }) => (
          <button
            key={cle}
            className={`meteo-choix ${valeur.cle === cle ? 'on' : ''}`}
            aria-pressed={valeur.cle === cle}
            onClick={() => onChange({ cle })}
          >
            <span className="meteo-prix mono">{t(label)}</span>
          </button>
        ))}
        <button
          className={`meteo-choix ${valeur.cle === 'libre' ? 'on' : ''}`}
          aria-pressed={valeur.cle === 'libre'}
          onClick={() => onChange({ cle: 'libre', iso: valeur.iso ?? new Date(defautLibre()).toISOString() })}
        >
          <span className="meteo-prix mono">{t('à l’heure près')} ▾</span>
        </button>
      </div>
      {valeur.cle === 'libre' && (
        <input
          type="datetime-local"
          className="moment-libre mono"
          value={valeur.iso ? versLocal(valeur.iso) : defautLibre()}
          min={versLocal(new Date().toISOString())}
          onChange={(e) => {
            const d = new Date(e.target.value)
            if (isFinite(d.getTime())) onChange({ cle: 'libre', iso: d.toISOString() })
          }}
          aria-label={t('à l’heure près')}
        />
      )}
      {valeur.cle !== 'maintenant' && (
        <p className="mono moment-hint">
          {t('le carnet se règle sur')} {dateDuMoment(valeur).toLocaleString(lireLangue() === 'fr' ? 'fr-FR' : 'en-GB', {
            weekday: 'long',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      )}
    </>
  )
}
