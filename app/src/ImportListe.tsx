import { useRef, useState } from 'react'
// ════════════════════════════════════════════════════════════════
// jeudi. — « COLLE TA LISTE » : l'import universel.
// Des noms de spots depuis n'importe où (Notes, WhatsApp, Mapstr, un
// article…) : un nom par ligne, jeudi géocode (Nominatim, file 1 req/s),
// tu valides d'un tap, le carnet se remplit. Privé par défaut, comme
// toute capture — tu publies ensuite, spot par spot.
// ════════════════════════════════════════════════════════════════
import { t } from './langue'
import { chercherAdresse, type AdresseTrouvee } from './nominatim'
import { ajouterLieu, nouvelId, maPosition, type Lieu } from './db'

const MAX_LIGNES = 20

interface Piste {
  requete: string
  trouve?: AdresseTrouvee
  garde: boolean
}

export default function ImportListe({ onImporte }: { onImporte?: (n: number) => void }) {
  const [ouvert, setOuvert] = useState(false)
  const [texte, setTexte] = useState('')
  const [pistes, setPistes] = useState<Piste[] | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [progression, setProgression] = useState(0)
  const [fini, setFini] = useState<number | null>(null)
  const vivant = useRef(true)

  const chercher = async () => {
    const lignes = [...new Set(texte.split('\n').map((l) => l.trim()).filter((l) => l.length > 1))]
      .slice(0, MAX_LIGNES)
    if (!lignes.length || enCours) return
    setEnCours(true)
    setFini(null)
    setPistes(lignes.map((requete) => ({ requete, garde: true })))
    vivant.current = true
    // séquentiel : la file nominatim impose déjà 1,1 s entre deux tirs
    for (let i = 0; i < lignes.length; i++) {
      if (!vivant.current) break
      setProgression(i + 1)
      const r = await chercherAdresse(lignes[i], { autour: maPosition, limite: 1 })
      if (!vivant.current) break
      const trouve = r.ok ? r.lieux[0] : undefined
      setPistes((prev) =>
        prev
          ? prev.map((p) => (p.requete === lignes[i] ? { ...p, trouve, garde: !!trouve } : p))
          : prev,
      )
    }
    setEnCours(false)
  }

  const ajouter = async () => {
    if (!pistes) return
    const gardes = pistes.filter((p) => p.garde && p.trouve)
    let n = 0
    for (const p of gardes) {
      const a = p.trouve as AdresseTrouvee
      const lieu: Lieu = {
        id: nouvelId(),
        nom: a.nom || p.requete,
        lat: a.lat,
        lng: a.lng,
        adresse: a.adresse || undefined,
        note: '',
        visibilite: 'prive',
        envies: [],
        compagnies: [],
        photos: [],
        statut: 'actif',
        creeLe: new Date().toISOString(),
        source: 'manuel',
      }
      await ajouterLieu(lieu)
      n++
    }
    setFini(n)
    setPistes(null)
    setTexte('')
    onImporte?.(n)
  }

  const basculer = (requete: string) =>
    setPistes((prev) =>
      prev ? prev.map((p) => (p.requete === requete ? { ...p, garde: !p.garde } : p)) : prev,
    )

  if (!ouvert) {
    return (
      <button className="takeout-lien lien" onClick={() => setOuvert(true)}>
        {t('ou colle une liste de noms →')}
      </button>
    )
  }

  const nGardes = pistes?.filter((p) => p.garde && p.trouve).length ?? 0

  return (
    <div className="import-liste">
      <p className="mono import-liste-hint">
        {t('un spot par ligne — depuis tes notes, un article, un message…')}
      </p>
      <textarea
        className="import-liste-zone mono"
        rows={5}
        placeholder={'le perchoir\nchez jeannette\nle syndicat'}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        disabled={enCours}
      />
      {!pistes && (
        <button
          className="valider"
          style={{ width: '100%', padding: '11px 0' }}
          disabled={enCours || texte.trim().length < 2}
          onClick={() => void chercher()}
        >
          {t('retrouver ces spots →')}
        </button>
      )}
      {enCours && pistes && (
        <p className="mono import-liste-hint">
          {t('on cherche…')} {progression}/{pistes.length}
        </p>
      )}
      {pistes && (
        <div>
          {pistes.map((p) => (
            <button
              key={p.requete}
              className={`labo-carte sg-choix${p.garde && p.trouve ? '' : ' off'}`}
              onClick={() => p.trouve && basculer(p.requete)}
              disabled={!p.trouve && !enCours}
            >
              <div className="labo-nom" style={{ fontSize: 17 }}>{p.trouve?.nom ?? p.requete}</div>
              <div className="mono" style={{ marginTop: 2 }}>
                {p.trouve
                  ? `${p.garde ? '✓' : '·'} ${p.trouve.adresse}`
                  : enCours
                    ? '…'
                    : t('introuvable — vérifie l’orthographe')}
              </div>
            </button>
          ))}
          {!enCours && (
            <button
              className="valider"
              style={{ width: '100%', padding: '11px 0' }}
              disabled={nGardes === 0}
              onClick={() => void ajouter()}
            >
              {nGardes} {t('spots dans mon carnet →')}
            </button>
          )}
        </div>
      )}
      {fini != null && (
        <p className="mono import-liste-hint">
          {fini} {t('spots ajoutés — ils sont privés, à toi de les publier.')}
        </p>
      )}
    </div>
  )
}
