import { useEffect, useRef, useState } from 'react'
// ════════════════════════════════════════════════════════════════
// jeudi. — « À LA MAIN » : la troisième voie, à côté des imports.
//
// Google donne des listes, « colle ta liste » donne des noms en vrac.
// Ici, on écrit UNE entrée, comme on la noterait sur un carnet : le nom,
// l'adresse, ce que c'est, d'où vient la cuisine. Pas de photo, pas de
// tip obligatoire, pas de placement au doigt sur la carte (v1) — le
// géocodage pose le point, et c'est déjà tout ce qu'il faut pour exister.
//
// Le placement ne réinvente rien : stations.ts répond DANS l'appareil
// quand on tape un nom de station (« Edgar Quinet »), et nominatim.ts
// prend le relais pour tout le reste — adresses, monuments, enseignes.
// ════════════════════════════════════════════════════════════════
import { t } from './langue'
import { ajouterLieu, nouvelId, maPosition, type Lieu } from './db'
import { chercherAdresse, type AdresseTrouvee } from './nominatim'
import { chargerStations, chercherStations } from './stations'
import { decrireLieu, type TypeLieu } from './typesLieu'
import { PickerType, PickerTampon } from './PickersLieu'

/** une place possible pour le spot : ce qu'on montre avant de trancher */
interface Piste extends AdresseTrouvee {
  /** vient de la table embarquée des stations (pas du réseau) */
  station?: boolean
}

export default function AjoutMain({
  onAjoute,
  demandeOuverture = 0,
}: {
  onAjoute?: () => void
  /** compteur : à chaque incrément (le crayon de l'écran d'ajout), le
      panneau s'ouvre et l'écran descend jusqu'ici. Un compteur plutôt
      qu'un booléen : on peut le redemander autant de fois qu'on veut. */
  demandeOuverture?: number
}) {
  const [deplie, setDeplie] = useState(false)
  // le panneau est ouvert si on a tapé le lien OU si le crayon l'a demandé :
  // un état DÉRIVÉ, pas un état recopié dans un effet (la règle des hooks —
  // et ça évite la désynchro classique entre la prop et le state).
  const ouvert = deplie || demandeOuverture > 0
  const bloc = useRef<HTMLDivElement | HTMLButtonElement | null>(null)

  // le crayon appelle : le panneau est déjà déplié par le rendu, on n'a plus
  // qu'à descendre — 60 ms, le temps que le dépliage soit peint.
  useEffect(() => {
    if (!demandeOuverture) return
    const doux = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = window.setTimeout(() => {
      bloc.current?.scrollIntoView({ behavior: doux ? 'smooth' : 'auto', block: 'center' })
    }, 60)
    return () => window.clearTimeout(id)
  }, [demandeOuverture])
  const [nom, setNom] = useState('')
  const [ou, setOu] = useState('')
  const [type, setType] = useState<TypeLieu>('resto')
  const [code, setCode] = useState<string | null>(null)
  const [pistes, setPistes] = useState<Piste[] | null>(null)
  const [place, setPlace] = useState<Piste | null>(null)
  const [cherche, setCherche] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [fini, setFini] = useState(false)

  // ── placer le spot : la table embarquée d'abord, le réseau ensuite ──
  const placer = async () => {
    const q = ou.trim()
    if (q.length < 2 || cherche) return
    setCherche(true)
    setMsg(null)
    setPistes(null)
    try {
      // 1. une station ? la réponse est dans l'appareil, immédiate et
      //    hors-ligne (stations.ts) — inutile d'aller déranger OSM.
      const stations = await chargerStations()
      const trouvees = chercherStations(q, stations, 3)
      if (trouvees.length) {
        setPistes(
          trouvees.map((s) => ({
            nom: s.nom,
            adresse: `${s.nom} — ${s.type}`,
            lat: s.lat,
            lng: s.lng,
            station: true,
          })),
        )
        return
      }
      // 2. tout le reste : le géocodeur du carnet (file 1,1 s, biais Paris)
      const r = await chercherAdresse(q, { autour: maPosition, limite: 3 })
      if (r.ok) {
        setPistes(r.lieux)
        return
      }
      setMsg(
        r.raison === 'reseau'
          ? t('pas de réseau — réessaie quand ça capte.')
          : t('rien trouvé par là. essaie l’adresse, ou la station la plus proche.'),
      )
    } finally {
      setCherche(false)
    }
  }

  const noter = async () => {
    if (!nom.trim() || !place || enCours) return
    setEnCours(true)
    try {
      const lieu: Lieu = {
        id: nouvelId(),
        nom: nom.trim(),
        lat: place.lat,
        lng: place.lng,
        // la station n'est pas une adresse : on ne fait pas passer un repère
        // pour un numéro de rue — le spot vivra sans, le reverse la trouvera.
        adresse: place.station ? undefined : place.adresse,
        note: '',
        // le mot du carnet reste dans la description (c'est ce qui se lit),
        // mais le type est AUSSI posé en clair depuis le 13/08 : c'est lui
        // qui rend la recherche par catégorie possible.
        description: decrireLieu(undefined, type, code),
        type,
        visibilite: 'prive',
        envies: [],
        compagnies: [],
        photos: [],
        statut: 'actif',
        creeLe: new Date().toISOString(),
        source: 'manuel',
        proprietaire: 'moi',
      }
      await ajouterLieu(lieu)
      setFini(true)
      setNom('')
      setOu('')
      setPlace(null)
      setPistes(null)
      setCode(null)
      setType('resto')
      onAjoute?.()
    } finally {
      setEnCours(false)
    }
  }

  if (!ouvert) {
    return (
      <button
        ref={bloc as React.Ref<HTMLButtonElement>}
        className="takeout-lien lien"
        onClick={() => setDeplie(true)}
      >
        {t('ou écris-en un à la main →')}
      </button>
    )
  }

  return (
    <div className="ajout-main" ref={bloc as React.Ref<HTMLDivElement>}>
      <p className="mono import-liste-hint">
        {t('un spot, écrit à la main — le nom, où c’est, et ce que c’est.')}
      </p>

      <input
        placeholder={t('le nom du spot')}
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        maxLength={80}
      />

      <div className="ajout-main-ou">
        <input
          placeholder={t('l’adresse, ou la station la plus proche')}
          value={ou}
          onChange={(e) => {
            setOu(e.target.value)
            setPlace(null)
          }}
          maxLength={160}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void placer()
          }}
        />
        <button className="lien" disabled={cherche || ou.trim().length < 2} onClick={() => void placer()}>
          {cherche ? t('on cherche…') : t('placer')}
        </button>
      </div>

      {msg && <p className="mono import-liste-hint">{msg}</p>}

      {pistes && !place && (
        <ul className="suggestions">
          {pistes.map((p, i) => (
            <li key={i}>
              <button onClick={() => setPlace(p)}>
                <span className="sugg-nom">{p.nom}</span>
                <span className="mono sugg-adresse">{p.adresse}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {place && (
        <p className="mono ajout-main-place">
          {t('placé :')} {place.adresse}{' '}
          <button className="lien" onClick={() => setPlace(null)}>
            {t('changer')}
          </button>
        </p>
      )}

      <span className="lbl mono">{t("c'est quoi, au juste ?")}</span>
      <PickerType valeur={type} onChoisir={setType} />

      <span className="lbl mono">{t('le tampon de douane')}</span>
      <PickerTampon valeur={code} onChoisir={setCode} />

      <button
        className="valider"
        style={{ width: '100%', padding: '11px 0', marginTop: 12 }}
        disabled={!nom.trim() || !place || enCours}
        onClick={() => void noter()}
      >
        {enCours ? t('on le note…') : t('dans mon carnet →')}
      </button>

      {fini && (
        <p className="mono import-liste-hint">
          {t('noté. il est privé — à toi de le publier.')}
        </p>
      )}
    </div>
  )
}
