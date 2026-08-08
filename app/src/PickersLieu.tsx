// ════════════════════════════════════════════════════════════════
// jeudi. — LES DEUX CHOIX QUI N'ONT PAS DE COLONNE : le type et le tampon.
// Ils vivent ici parce qu'ils se posent à deux endroits — quand on corrige
// une entrée, et quand on en écrit une à la main. Mêmes glyphes que la
// carte, mêmes 3 lettres au crayon : un lieu créé et un lieu corrigé se
// ressemblent, sinon le carnet aurait deux écritures.
// ════════════════════════════════════════════════════════════════
import { t } from './langue'
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
