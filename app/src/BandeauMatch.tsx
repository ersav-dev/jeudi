import { useEffect, useState } from 'react'
import { t } from './langue'
import {
  lireSortieActive,
  voirSortie,
  mesMatchsOuverts,
  libelleRestant,
  type SortieVue,
  type MatchOuvert,
} from './sortieGroupe'

// l'étiquette « on dit où. » en tête de « sortir » : la porte PERMANENTE du
// match de groupe (la marque conjuguée au pluriel — jeudi, « je dis où »).
// Quand un vote vit — le MIEN (créateur, localStorage) ou un match du cloud
// où je suis membre — l'étiquette devient le bandeau de reprise.
export default function BandeauMatch({
  onOuvrir,
}: {
  /** null = composer/reprendre mon match local · MatchOuvert = rejoindre celui-ci */
  onOuvrir: (m: MatchOuvert | null) => void
}) {
  const active = lireSortieActive()
  const [vue, setVue] = useState<SortieVue | null>(null)
  const [duCloud, setDuCloud] = useState<MatchOuvert | null>(null)

  const token = active?.token ?? null
  useEffect(() => {
    let vivant = true
    // lecture différée d'un tick (jamais de setState dans le corps de l'effet)
    const premier = setTimeout(() => {
      if (token) {
        // mon match (créateur) : les comptes pour le bandeau
        voirSortie(token).then(
          (v) => {
            if (vivant) setVue(v)
          },
          () => undefined, // hors-ligne : l'étiquette reste sobre, sans compte
        )
      } else {
        // pas de match à moi : un match du cloud où je suis membre ?
        mesMatchsOuverts().then(
          (ms) => {
            if (vivant && ms.length) setDuCloud(ms[0])
          },
          () => undefined,
        )
      }
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
      <button className="match-bandeau vivant" onClick={() => onOuvrir(null)}>
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

  if (duCloud) {
    const restant = libelleRestant(duCloud.deadline)
    return (
      <button className="match-bandeau vivant" onClick={() => onOuvrir(duCloud)}>
        <span className="labo-cap match-bandeau-cap">{t('un vote vit')}</span>
        <span className="match-bandeau-nom">
          {duCloud.titre || t('on dit où.')}
          {restant && ` · ${t('il reste')} ${restant}`}
        </span>
        <span className="mono match-bandeau-sous">{t('voter avec le groupe →')}</span>
      </button>
    )
  }

  return (
    <button className="match-bandeau" onClick={() => onOuvrir(null)}>
      {/* la bande : trois silhouettes à l'encre (celle de devant en avant),
          le pendant du glyphe éventail de « je sais pas » — même langage */}
      <svg className="match-porte-potes" viewBox="0 0 66 44" aria-hidden="true">
        <g fill="var(--nuit-2)" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16.5" cy="17" r="5.2" />
          <path d="M7.5 38 Q7.5 27 16.5 27 Q25.5 27 25.5 38" />
          <circle cx="49.5" cy="17" r="5.2" />
          <path d="M40.5 38 Q40.5 27 49.5 27 Q58.5 27 58.5 38" />
          <circle cx="33" cy="13.5" r="6.2" />
          <path d="M21.5 38 Q21.5 24.5 33 24.5 Q44.5 24.5 44.5 38" />
        </g>
      </svg>
      <span className="match-bandeau-nom">{t('on dit où.')} →</span>
      <span className="mono match-bandeau-sous">{t('le match — tes potes votent par un lien')}</span>
    </button>
  )
}
