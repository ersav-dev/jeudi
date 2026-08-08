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
import { cuisineDeLieu, decrireLieu, typeDeLieu, type TypeLieu } from './typesLieu'
import { PickerType, PickerTampon } from './PickersLieu'

export default function CorrigerLieu({
  lieu,
  onEnregistre,
  onFerme,
  favori,
  onFavori,
  aTester,
  onATester,
  archive,
  onArchive,
  onSupprimer,
}: {
  lieu: Lieu
  /** le lieu corrigé, déjà écrit (majLieu) — la fiche n'a qu'à se remettre à jour */
  onEnregistre: (l: Lieu) => void
  onFerme: () => void
  /** les trois états, posés/retirés d'un tap — ce sont des gestes, pas un
   *  formulaire : ils prennent effet tout de suite, sans « enregistrer ». */
  favori: boolean
  onFavori: () => void
  aTester: boolean
  onATester: () => void
  archive: boolean
  onArchive: () => void
  /** arracher la page — l'écran s'occupe d'effacer et de refermer la fiche */
  onSupprimer: () => Promise<void>
}) {
  const [nom, setNom] = useState(lieu.nom)
  const [adresse, setAdresse] = useState(lieu.adresse ?? '')
  const [note, setNote] = useState(lieu.note)
  const [type, setType] = useState<TypeLieu>(() => typeDeLieu(lieu))
  const [code, setCode] = useState<string | null>(() => cuisineDeLieu(lieu)?.code ?? null)
  const [enCours, setEnCours] = useState(false)
  // arracher la page se demande deux fois — jamais d'un doigt qui glisse
  const [confirme, setConfirme] = useState(false)

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

  const effacer = async () => {
    if (enCours) return
    setEnCours(true)
    try {
      await onSupprimer()
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
      <PickerType valeur={type} onChoisir={setType} />

      {/* LE TAMPON : la nationalité de la cuisine, en 3 lettres au crayon */}
      <span className="lbl mono">{t('le tampon de douane')}</span>
      <PickerTampon valeur={code} onChoisir={setCode} />

      {/* LES ÉTATS, au même endroit que le reste — posés d'un tap, pris tout
          de suite. Favori : le signet. À tester : ma pile (par défaut, tout
          ce qui n'a pas de tampon). Archivé : le tiroir — le spot quitte le
          carnet à la fermeture de la fiche, et sait revenir. */}
      <span className="lbl mono">{t('où il en est')}</span>
      <div className="rangée corriger-etats">
        <button
          className={`mot ${favori ? 'entouré' : ''}`}
          aria-pressed={favori}
          onClick={onFavori}
        >
          {t('favori')}
        </button>
        <button
          className={`mot ${aTester ? 'entouré' : ''}`}
          aria-pressed={aTester}
          onClick={onATester}
        >
          {t('à tester')}
        </button>
        <button
          className={`mot ${archive ? 'entouré' : ''}`}
          aria-pressed={archive}
          onClick={onArchive}
        >
          {t('archivé')}
        </button>
      </div>
      {archive && (
        <p className="mono corriger-note">
          {t('rangé — il quitte le carnet dès que tu refermes la fiche.')}
        </p>
      )}

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

      {/* ARRACHER LA PAGE. Tout en bas, sobre, jamais un bouton rouge posé
          là comme un piège : un filet, un lien, et une phrase qui dit ce
          qui part vraiment. Deux temps — on ne déchire pas d'un doigt qui
          glisse. « archivé » est juste au-dessus pour ceux qui hésitent. */}
      <div className="corriger-arracher">
        {!confirme ? (
          <button className="lien corriger-effacer" onClick={() => setConfirme(true)}>
            {t('arracher la page')}
          </button>
        ) : (
          <>
            <p className="mono corriger-avertissement">
              {t('ses photos partent aussi — et ses clips. définitif, sans retour.')}
            </p>
            <div className="corriger-actions">
              <button className="lien" onClick={() => setConfirme(false)}>
                {t('non, je la garde')}
              </button>
              <button
                className="lien corriger-effacer"
                disabled={enCours}
                onClick={() => void effacer()}
              >
                {enCours ? t('on arrache…') : t('oui, arrache')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
