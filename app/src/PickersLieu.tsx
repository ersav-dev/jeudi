// ════════════════════════════════════════════════════════════════
// jeudi. — LES CHOIX QUI N'ONT PAS DE COLONNE : le type, le tampon,
// et depuis le 09/08 les HEURES.
// Ils vivent ici parce qu'ils se posent à deux endroits — quand on corrige
// une entrée, et quand on en écrit une à la main. Mêmes glyphes que la
// carte, mêmes 3 lettres au crayon : un lieu créé et un lieu corrigé se
// ressemblent, sinon le carnet aurait deux écritures.
// ════════════════════════════════════════════════════════════════
import { t } from './langue'
import { formatHeure } from './db'
import { TYPES_LIEU, TAMPONS_CUISINE, labelTypeLieu, svgTypeLieu, type TypeLieu } from './typesLieu'

/** les 10 glyphes, ceux-là mêmes qui marquent la carte */
export function PickerType({
  valeur,
  onChoisir,
}: {
  valeur: TypeLieu
  onChoisir: (t: TypeLieu) => void
}) {
  return (
    <div className="corriger-types">
      {TYPES_LIEU.map((ty) => (
        <button
          key={ty}
          className={`corriger-type ${ty === valeur ? 'choisi' : ''}`}
          aria-pressed={ty === valeur}
          title={t(labelTypeLieu(ty))}
          onClick={() => onChoisir(ty)}
        >
          <span className="corriger-glyphe" dangerouslySetInnerHTML={{ __html: svgTypeLieu(ty) }} />
          <span className="mono corriger-type-mot">{t(labelTypeLieu(ty))}</span>
        </button>
      ))}
    </div>
  )
}

/** les 21 tampons de douane — et « aucun », qui est un choix, pas un trou :
 *  la maison ne tamponne pas son propre passeport (typesLieu.ts). */
export function PickerTampon({
  valeur,
  onChoisir,
}: {
  valeur: string | null
  onChoisir: (code: string | null) => void
}) {
  return (
    <div className="rangée corriger-tampons">
      <button
        className={`mot ${valeur === null ? 'entouré' : ''}`}
        aria-pressed={valeur === null}
        onClick={() => onChoisir(null)}
      >
        {t('aucun')}
      </button>
      {TAMPONS_CUISINE.map((c) => (
        <button
          key={c.code}
          className={`mot mono ${valeur === c.code ? 'entouré' : ''}`}
          aria-pressed={valeur === c.code}
          title={t(c.mot)}
          onClick={() => onChoisir(valeur === c.code ? null : c.code)}
        >
          {c.code}
        </button>
      ))}
    </div>
  )
}

// ── L'HEURE : une borne d'horaire, à la demi-heure (09/08) ──────
// Le modèle ne porte QU'UNE plage, la même tous les jours (db.ts, `horaires`).
// Donc pas de grille lundi→dimanche ici : on ne dessine pas un formulaire que
// la base ne sait pas relire. Deux bornes, et « je sais pas » sur CHACUNE —
// parce que « ça ouvre à 18h, je ne sais plus quand ça ferme » est la moitié
// d'information la plus fréquente, et qu'elle vaut mieux que rien : la carte
// sait déjà l'afficher (etatHoraire → ouvert: null → demi-encre honnête).
//
// Un select natif, pas une roue maison : sur téléphone c'est la roue du
// système, et 48 crans se font au pouce sans qu'on ait rien à coder.

/** les demi-heures d'une borne, en heures décimales (le format du modèle) */
function demiHeures(debut: number, fin: number): number[] {
  const l: number[] = []
  for (let x = debut; x <= fin; x += 0.5) l.push(x)
  return l
}

/** l'ouverture : le tour du cadran, 0h → 23h30 */
const HEURES_OUVERTURE = demiHeures(0, 23.5)
/** la fermeture : jusqu'à 6h du matin (30 = 6h). Au-delà de 24 on est APRÈS
 *  MINUIT — c'est la convention du modèle, et c'est ce que dit l'étiquette. */
const HEURES_FERMETURE = demiHeures(0.5, 30)

export function PickerHeure({
  valeur,
  onChoisir,
  fin = false,
  aria,
}: {
  /** null = « je sais pas » pour CETTE borne (le modèle le porte tel quel) */
  valeur: number | null
  onChoisir: (h: number | null) => void
  /** borne de fermeture : le choix va jusqu'à 6h du matin */
  fin?: boolean
  aria: string
}) {
  const heures = fin ? HEURES_FERMETURE : HEURES_OUVERTURE
  const etiquette = (x: number) =>
    x === 24
      ? t('minuit')
      : x > 24
        ? `${formatHeure(x)} ${t('(après minuit)')}`
        : formatHeure(x)
  return (
    <select
      className="corriger-molette mono"
      aria-label={aria}
      value={valeur == null ? '' : String(valeur)}
      onChange={(e) => onChoisir(e.target.value === '' ? null : Number(e.target.value))}
    >
      {/* « je sais pas » d'abord : c'est l'état honnête par défaut, pas un
          repli caché en bas de liste */}
      <option value="">{t('je sais pas')}</option>
      {heures.map((x) => (
        <option key={x} value={x}>
          {etiquette(x)}
        </option>
      ))}
    </select>
  )
}
