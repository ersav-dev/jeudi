import { useEffect, useState } from 'react'
import { t } from './langue'
import { lireSortieActive, voirSortie, libelleRestant, type SortieVue } from './sortieGroupe'

// l'étiquette « on dit où. » en tête de « ce soir » : la porte PERMANENTE du
// match de groupe (la marque conjuguée au pluriel — jeudi, « je dis où »).
// Quand un vote vit, l'étiquette devient le bandeau de reprise : le match
// te rattrape, il n'est plus jamais perdu.
export default function BandeauMatch({ onOuvrir }: { onOuvrir: () => void }) {
  const active = lireSortieActive()
  const [vue, setVue] = useState<SortieVue | null>(null)

  const token = active?.token ?? null
  useEffect(() => {
    if (!token) return
    let vivant = true
    // lecture différée d'un tick (jamais de setState dans le corps de l'effet)
    const premier = setTimeout(() => {
      voirSortie(token).then(
        (v) => {
          if (vivant) setVue(v)
        },
        () => undefined, // hors-ligne : l'étiquette reste sobre, sans compte
      )
    }, 0)
    return () => {
      vivant = false
      clearTimeout(premier)
    }
  }, [token])

  if (active) {
    const votants = vue ? vue.participants.filter((p) => p.aVote).length : null
    const restant = vue ? libelleRestant(vue.deadline) : ''
    const clos = vue ? !vue.ouverte : false
    return (
      <button className="match-bandeau vivant" onClick={onOuvrir}>
        <span className="labo-cap match-bandeau-cap">
          {clos ? t('le vote est clos') : t('un vote vit')}
        </span>
        <span className="match-bandeau-nom">
          {vue && votants != null
            ? `${votants}/${vue.participants.length} ${t('ont voté')}${restant && !clos ? ` · ${t('il reste')} ${restant}` : ''}`
            : t('on ouvre le carnet…')}
        </span>
        <span className="mono match-bandeau-sous">
          {clos ? t('voir le verdict →') : t('reprendre le match →')}
        </span>
      </button>
    )
  }

  return (
    <button className="match-bandeau" onClick={onOuvrir}>
      <span className="match-bandeau-nom">{t('on dit où.')} →</span>
      <span className="mono match-bandeau-sous">{t('le match — tes potes votent par un lien')}</span>
    </button>
  )
}
