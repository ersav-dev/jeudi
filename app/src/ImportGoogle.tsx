import { useState } from 'react'
import { importerTakeout, couperRelanceImport } from './db'
import { t, lireLangue } from './langue'

// ── L'import Google guidé (3 étapes) — composant PARTAGÉ ────────
// Vit à deux endroits : le formulaire d'ajout (FormAjout) et l'onboarding
// (« récupère tes adresses »). Une seule vérité pour le parcours takeout :
// takeout.google.com → cocher « Saved » → déposer « Saved Places.json ».
// Au premier import réussi, la relance douce est coupée (couperRelanceImport).
export default function ImportGoogle({
  ouvertParDefaut = false,
  onImporte,
}: {
  /** true = le panneau 3 étapes est déplié d'entrée (onboarding) */
  ouvertParDefaut?: boolean
  /** appelé après un import réussi (n = nombre d'adresses ajoutées) */
  onImporte?: (n: number) => void
}) {
  const [ouvert, setOuvert] = useState(ouvertParDefaut)
  const [msg, setMsg] = useState<string | null>(null)
  const [etat, setEtat] = useState<'repos' | 'lecture' | 'ok' | 'erreur'>('repos')

  const importerFichier = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setEtat('lecture')
    setMsg(t('je lis ton carnet Google…'))
    try {
      const json = JSON.parse(await f.text())
      const n = await importerTakeout(json)
      if (n === 0) {
        setEtat('erreur')
        setMsg(t('aucune nouvelle adresse (déjà dans ton carnet ?).'))
      } else {
        setEtat('ok')
        setMsg(
          lireLangue() === 'fr'
            ? `${n} adresse${n > 1 ? 's' : ''} ajoutée${n > 1 ? 's' : ''} à ton carnet.`
            : `${n} address${n > 1 ? 'es' : ''} added to your notebook.`,
        )
        couperRelanceImport() // l'import est fait : plus jamais de rappel
        onImporte?.(n)
      }
    } catch (err) {
      setEtat('erreur')
      // le message d'erreur d'importerTakeout est déjà lisible (mauvais fichier)
      setMsg(err instanceof Error ? err.message : 'fichier illisible.')
    } finally {
      // on réarme l'input : réessayer le MÊME fichier redéclenche l'onChange
      e.target.value = ''
    }
  }

  return (
    <div className="takeout">
      {!ouvert ? (
        <button type="button" className="lien takeout-ouvrir" onClick={() => setOuvert(true)}>
          {t('récupérer mes adresses Google')}
        </button>
      ) : (
        <div className="takeout-panneau">
          <div className="takeout-tete">
            <span className="hand takeout-titre">{t('récupère tes adresses Google')}</span>
            {!ouvertParDefaut && (
              <button type="button" className="lien takeout-replier" onClick={() => setOuvert(false)}>
                {t('replier')}
              </button>
            )}
          </div>
          <ol className="takeout-etapes mono">
            <li className="takeout-etape">
              <span className="takeout-num">1</span>
              <span>
                {t('va sur')}{' '}
                <a
                  className="takeout-lien"
                  href="https://takeout.google.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  takeout.google.com
                </a>
              </span>
            </li>
            <li className="takeout-etape">
              <span className="takeout-num">2</span>
              <span>
                {t('coche seulement « Saved » (tes lieux enregistrés), exporte, télécharge le .zip, ouvre-le → tu y trouves « Saved Places.json »')}
              </span>
            </li>
            <li className="takeout-etape">
              <span className="takeout-num">3</span>
              <span>{t('dépose ce fichier ici :')}</span>
            </li>
          </ol>
          <label className="takeout-depot">
            <input type="file" accept=".json,application/json" hidden onChange={importerFichier} />
            <span className="hand takeout-depot-txt">{t('déposer « Saved Places.json »')}</span>
          </label>
          {msg && (
            <span
              className={`mono takeout-msg${etat === 'ok' ? ' takeout-msg-ok' : ''}${
                etat === 'erreur' ? ' takeout-msg-erreur' : ''
              }`}
            >
              {msg}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
