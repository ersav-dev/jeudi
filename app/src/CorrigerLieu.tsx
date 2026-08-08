import { useState } from 'react'
// ════════════════════════════════════════════════════════════════
// jeudi. — CORRIGER UNE ENTRÉE DU CARNET (08/08).
// Le carnet passe d'« importé » à « tenu à la main » : depuis la fiche
// d'un spot À MOI, un crayon ouvre ce panneau. On y répare ce que
// l'import a mal noté — le nom, l'adresse, le tip — et surtout on y
// pose ce qui n'a pas de colonne : le TYPE (le glyphe de la carte) et
// le TAMPON de douane. Ces deux-là se DEVINENT de la description :
// decrireLieu() écrit donc des mots que typeDeLieu()/cuisineDeLieu()
// relisent exactement, et le panneau montre la phrase obtenue — rien
// ne se passe dans le dos de celui qui tient le carnet.
// ════════════════════════════════════════════════════════════════
import { t } from './langue'
import { majLieu, type Lieu } from './db'
import {
  TYPES_LIEU,
  TAMPONS_CUISINE,
  cuisineDeLieu,
  decrireLieu,
  labelTypeLieu,
  svgTypeLieu,
  typeDeLieu,
  type TypeLieu,
} from './typesLieu'

export default function CorrigerLieu({
  lieu,
  onEnregistre,
  onFerme,
}: {
  lieu: Lieu
  /** le lieu corrigé, déjà écrit (majLieu) — la fiche n'a qu'à se remettre à jour */
  onEnregistre: (l: Lieu) => void
  onFerme: () => void
}) {
  const [nom, setNom] = useState(lieu.nom)
  const [adresse, setAdresse] = useState(lieu.adresse ?? '')
  const [note, setNote] = useState(lieu.note)
  const [type, setType] = useState<TypeLieu>(() => typeDeLieu(lieu))
  const [code, setCode] = useState<string | null>(() => cuisineDeLieu(lieu)?.code ?? null)
  const [enCours, setEnCours] = useState(false)

  // la phrase que le carnet relira — recalculée à chaque geste, montrée telle quelle
  const description = decrireLieu(lieu.description, type, code)

  const enregistrer = async () => {
    if (!nom.trim() || enCours) return
    setEnCours(true)
    const maj: Lieu = {
      ...lieu,
      nom: nom.trim(),
      adresse: adresse.trim() || undefined,
      note: note.trim(),
      description,
    }
    try {
      await majLieu(maj)
      onEnregistre(maj)
      onFerme()
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="corriger">
      <span className="lbl mono">{t('le nom')}</span>
      <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={80} />

      <span className="lbl mono">{t("l'adresse")}</span>
      <input
        value={adresse}
        onChange={(e) => setAdresse(e.target.value)}
        placeholder={t('12 rue de la Paix, 75002 Paris')}
        maxLength={160}
      />

      <span className="lbl mono">{t('ton tip')}</span>
      <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />

      {/* LE TYPE : les 10 glyphes, ceux-là mêmes qui marquent la carte */}
      <span className="lbl mono">{t("c'est quoi, au juste ?")}</span>
      <div className="corriger-types">
        {TYPES_LIEU.map((ty) => (
          <button
            key={ty}
            className={`corriger-type ${ty === type ? 'choisi' : ''}`}
            aria-pressed={ty === type}
            title={labelTypeLieu(ty)}
            onClick={() => setType(ty)}
          >
            <span
              className="corriger-glyphe"
              dangerouslySetInnerHTML={{ __html: svgTypeLieu(ty) }}
            />
            <span className="mono corriger-type-mot">{labelTypeLieu(ty)}</span>
          </button>
        ))}
      </div>

      {/* LE TAMPON : la nationalité de la cuisine, en 3 lettres au crayon.
          la maison n'a pas de tampon — « aucun » est un choix, pas un trou. */}
      <span className="lbl mono">{t('le tampon de douane')}</span>
      <div className="rangée corriger-tampons">
        <button
          className={`mot ${code === null ? 'entouré' : ''}`}
          aria-pressed={code === null}
          onClick={() => setCode(null)}
        >
          {t('aucun')}
        </button>
        {TAMPONS_CUISINE.map((c) => (
          <button
            key={c.code}
            className={`mot mono ${code === c.code ? 'entouré' : ''}`}
            aria-pressed={code === c.code}
            title={c.mot}
            onClick={() => setCode(code === c.code ? null : c.code)}
          >
            {c.code}
          </button>
        ))}
      </div>

      {/* ce que le carnet relira : montré, jamais deviné */}
      <p className="mono corriger-relecture">
        {t('le carnet lira :')} <span className="corriger-relu">{description}</span>
      </p>

      <div className="corriger-actions">
        <button className="lien" onClick={onFerme}>
          {t('laisse tomber')}
        </button>
        <button className="valider" disabled={!nom.trim() || enCours} onClick={() => void enregistrer()}>
          {enCours ? t('on corrige…') : t("c'est corrigé.")}
        </button>
      </div>
    </div>
  )
}
