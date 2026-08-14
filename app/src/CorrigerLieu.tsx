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
import { etatHoraire, majLieu, type Lieu } from './db'
import { cuisineDeLieu, decrireLieu, typeDuLieu, type TypeLieu } from './typesLieu'
import { PickerType, PickerTampon, PickerHeure } from './PickersLieu'

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
  onRayer,
  onDeRayer,
  maRayure,
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
  /** RAYER : le serment. L'écran signe, date au jeudi suivant, pousse au
   *  cercle et rafraîchit la carte ; ici on ne fait que demander (deux fois)
   *  et recueillir le motif. */
  onRayer: (motif: string) => Promise<void>
  onDeRayer: () => Promise<void>
  /** la croix posée sur ce lieu est-elle LA MIENNE ? Celle d'un pote se lit,
   *  mais ne se retire pas — on ne se dédit que de son propre serment. */
  maRayure: boolean
}) {
  const [nom, setNom] = useState(lieu.nom)
  const [adresse, setAdresse] = useState(lieu.adresse ?? '')
  const [note, setNote] = useState(lieu.note)
  const [type, setType] = useState<TypeLieu>(() => typeDuLieu(lieu))
  const [code, setCode] = useState<string | null>(() => cuisineDeLieu(lieu)?.code ?? null)
  // les deux bornes d'horaire, séparément : null = « je sais pas » pour
  // CELLE-LÀ (le modèle porte exactement ça, cf. db.ts `horaires`)
  const [ouvre, setOuvre] = useState<number | null>(() => lieu.horaires?.[0] ?? null)
  const [ferme, setFerme] = useState<number | null>(() => lieu.horaires?.[1] ?? null)
  const [enCours, setEnCours] = useState(false)
  // arracher la page se demande deux fois — jamais d'un doigt qui glisse
  const [confirme, setConfirme] = useState(false)
  // rayer aussi : deux temps, et une ligne pour dire pourquoi
  const [rayureOuverte, setRayureOuverte] = useState(false)
  const [motif, setMotif] = useState('')

  // la phrase que le carnet relira — recalculée à chaque geste, montrée telle quelle
  const description = decrireLieu(lieu.description, type, code)

  // les deux bornes inconnues = pas d'horaires du tout (undefined), pas un
  // couple de null : le modèle distingue « je n'en sais rien » de « j'en sais
  // la moitié », et la carte encre différemment selon les deux.
  const horaires: Lieu['horaires'] =
    ouvre == null && ferme == null ? undefined : [ouvre, ferme]
  // ce que la carte fera de ce choix — dit tout de suite, jamais deviné
  const etat = etatHoraire(horaires)

  const enregistrer = async () => {
    if (!nom.trim() || enCours) return
    setEnCours(true)
    const maj: Lieu = {
      ...lieu,
      nom: nom.trim(),
      adresse: adresse.trim() || undefined,
      note: note.trim(),
      description,
      // le type devient une DONNÉE (13/08) : celui que la main vient de
      // choisir, plus une devinette relue dans la prose
      type,
      horaires,
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

  const rayerCeLieu = async () => {
    if (enCours) return
    setEnCours(true)
    try {
      await onRayer(motif)
      setRayureOuverte(false)
      setMotif('')
    } finally {
      setEnCours(false)
    }
  }

  const seDedire = async () => {
    if (enCours) return
    setEnCours(true)
    try {
      await onDeRayer()
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

      {/* LES HEURES (09/08) — le champ qui manquait, et celui qui fait parler
          la carte : depuis les trois crans d'encre, un lieu sans horaires
          reste en demi-teinte pour toujours. Deux bornes, chacune avec son
          « je sais pas » : on préfère une moitié d'information assumée à une
          fausse certitude. Pas de grille par jour — le modèle n'en porte pas
          (db.ts), et on ne dessine pas ce qui ne se relit pas. */}
      <span className="lbl mono">{t('ça ouvre quand ?')}</span>
      <div className="corriger-heures">
        <label className="mono corriger-heure">
          <span className="corriger-heure-mot">{t('ouvre à')}</span>
          <PickerHeure valeur={ouvre} onChoisir={setOuvre} aria={t('heure d’ouverture')} />
        </label>
        <label className="mono corriger-heure">
          <span className="corriger-heure-mot">{t('ferme à')}</span>
          <PickerHeure fin valeur={ferme} onChoisir={setFerme} aria={t('heure de fermeture')} />
        </label>
      </div>
      <p className="mono corriger-note">
        {etat
          ? etat.ouvert === null
            ? t('la carte le laissera en demi-encre : elle ne peut pas trancher.')
            : t('la carte saura l’encrer : plein quand c’est ouvert, pâle quand c’est fermé.')
          : t('sans heures, il restera en demi-encre sur la carte — ni ouvert, ni fermé.')}
      </p>

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

      {/* RAYER (09/08) — le seul geste de jeudi qui parle aux autres en mal.
          Il coûte : le lieu quittera ton carnet au jeudi suivant. Entre les
          deux, il reste là, barré, et tu peux te dédire — c'est le repentir
          intégré, pas un délai technique. Une seule rayure par lieu, signée,
          jamais comptée (rayure.ts) — et elle part vraiment vers le cercle
          (table `rayures`, migration 0015). */}
      <div className="corriger-rayer">
        {lieu.raye ? (
          <>
            <p className="mono corriger-raye-etat">
              {t('rayé par')} {lieu.raye.qui.toLowerCase()}
              {maRayure ? ` · ${t('il part jeudi.')}` : ''}
            </p>
            {lieu.raye.motif && (
              <p className="hand corriger-raye-motif">« {lieu.raye.motif} »</p>
            )}
            {/* on ne se dédit que de SON serment : la croix d'un pote se lit,
                elle ne se décroche pas d'ici */}
            {maRayure && (
              <button className="lien" disabled={enCours} onClick={() => void seDedire()}>
                {enCours ? t('on efface…') : t('j’ai changé d’avis')}
              </button>
            )}
          </>
        ) : !rayureOuverte ? (
          <button className="lien corriger-effacer" onClick={() => setRayureOuverte(true)}>
            {t('rayer — et le dire à ton cercle')}
          </button>
        ) : (
          <>
            <p className="mono corriger-avertissement">
              {t('rayer, c’est un serment : il quitte ton carnet jeudi. jusque-là tu peux te dédire.')}
            </p>
            <p className="mono corriger-note">
              {t('ça reste dans ton cercle, signé de ton nom. ça ne se compte jamais.')}
            </p>
            <input
              className="corriger-motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder={t('trois quarts d’heure pour deux bières')}
              maxLength={120}
              aria-label={t('pourquoi ?')}
            />
            <div className="corriger-actions">
              <button
                className="lien"
                onClick={() => {
                  setRayureOuverte(false)
                  setMotif('')
                }}
              >
                {t('non, laisse')}
              </button>
              <button
                className="lien corriger-effacer"
                disabled={enCours}
                onClick={() => void rayerCeLieu()}
              >
                {enCours ? t('on raye…') : t('oui, je raye')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
