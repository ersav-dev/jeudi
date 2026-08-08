import { useState } from 'react'
import { importerEntrees, couperRelanceImport, ENVIES, type Envie, type BilanImport } from './db'
import { moissonner, aGeocoder, type Moisson, type FichierFourni } from './takeout'
import { chercherAdresse } from './nominatim'
import { t, lireLangue } from './langue'

// ── L'import Google guidé — composant PARTAGÉ, et il avale TOUT ──
// Vit à deux endroits : le formulaire d'ajout (FormAjout) et l'onboarding
// (« récupère tes adresses »). On peut déposer :
//   · le .zip Takeout ENTIER (le plus simple — on fouille dedans) ;
//   · « Saved Places.json » seul (étoiles + enregistrés, coordonnées incluses) ;
//   · les .csv des listes « Saved » (Favoris, Envie d'y aller…) — sans
//     coordonnées : on les retrouve via l'URL du lieu, sinon Nominatim
//     (~1 s par adresse, politique OSM).
// Les listes deviennent des CATÉGORIES : chaque liste se range vers des
// envies et/ou les favoris avant l'import.
// Au premier import réussi, la relance douce est coupée (couperRelanceImport).

type Etape = 'repos' | 'lecture' | 'rangement' | 'course' | 'ok' | 'erreur'

interface Rangement {
  importer: boolean
  envies: Envie[]
  favori: boolean
}

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
  const [etape, setEtape] = useState<Etape>('repos')
  const [msg, setMsg] = useState<string | null>(null)
  const [moisson, setMoisson] = useState<Moisson | null>(null)
  const [rangement, setRangement] = useState<Record<string, Rangement>>({})
  const [avancee, setAvancee] = useState({ fait: 0, total: 0, courant: '' })
  const [introuvables, setIntrouvables] = useState<string[]>([])

  const fr = lireLangue() === 'fr'

  // ── 1. la moisson : on lit tout ce qui est déposé ──────────────
  const deposer = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichiers = [...(e.target.files ?? [])]
    e.target.value = ''
    if (!fichiers.length) return
    setEtape('lecture')
    setMsg(t('je lis ton carnet Google…'))
    try {
      const fournis: FichierFourni[] = await Promise.all(
        fichiers.map(async (f) => ({
          nom: f.name,
          contenu: /\.zip$/i.test(f.name)
            ? new Uint8Array(await f.arrayBuffer())
            : await f.text(),
        })),
      )
      const m = moissonner(fournis)
      if (!m.spots.length && !m.listes.length) {
        setEtape('erreur')
        setMsg(
          t('rien de reconnu là-dedans — attendu : le .zip Takeout, « Saved Places.json » ou des listes .csv.'),
        )
        return
      }
      setMoisson(m)
      // le rangement par défaut : tout s'importe ; « Favoris » coche favori
      const r: Record<string, Rangement> = {}
      for (const l of m.listes) {
        r[l.nom] = { importer: true, envies: [], favori: /favori|favorite|starred/i.test(l.nom) }
      }
      setRangement(r)
      if (m.listes.length) {
        setEtape('rangement')
        setMsg(null)
      } else {
        await lancerImport(m, r) // que du GeoJSON : rien à ranger, on y va
      }
    } catch {
      setEtape('erreur')
      setMsg(t('fichier illisible.'))
    }
  }

  // ── 2. la course : géocoder ce qui doit l'être, puis écrire ────
  const lancerImport = async (m: Moisson, r: Record<string, Rangement>) => {
    setEtape('course')
    setIntrouvables([])
    const listesRetenues = m.listes.filter((l) => r[l.nom]?.importer !== false)
    const total = aGeocoder(listesRetenues)
    let fait = 0
    setAvancee({ fait, total, courant: '' })

    const bilan: BilanImport = { ajoutes: 0, deja: 0 }
    const perdus: string[] = []

    const ajouter = (b: BilanImport) => {
      bilan.ajoutes += b.ajoutes
      bilan.deja += b.deja
    }

    // le GeoJSON d'abord : il a déjà ses coordonnées
    if (m.spots.length) ajouter(await importerEntrees(m.spots))

    for (const liste of listesRetenues) {
      const options = {
        envies: r[liste.nom]?.envies ?? [],
        favori: r[liste.nom]?.favori ?? false,
        // le nom de la liste devient l'étiquette perso de ses spots :
        // les gens retrouvent leur carnet rangé comme chez Google
        etiquette: liste.nom,
      }
      const pretes = []
      for (const entree of liste.entrees) {
        if (entree.lat != null) {
          pretes.push(entree)
          continue
        }
        setAvancee({ fait, total, courant: entree.nom })
        const trouve = await chercherAdresse(entree.nom, { limite: 1 })
        fait++
        setAvancee({ fait, total, courant: entree.nom })
        if (trouve.ok) {
          const l = trouve.lieux[0]
          pretes.push({ ...entree, lat: l.lat, lng: l.lng, adresse: l.adresse })
        } else if (trouve.raison !== 'annule') {
          perdus.push(entree.nom)
        }
      }
      ajouter(await importerEntrees(pretes, options))
    }

    setIntrouvables(perdus)
    if (bilan.ajoutes > 0) {
      couperRelanceImport()
      onImporte?.(bilan.ajoutes)
    }
    setEtape(bilan.ajoutes > 0 || bilan.deja > 0 ? 'ok' : 'erreur')
    setMsg(
      fr
        ? `${bilan.ajoutes} adresse${bilan.ajoutes > 1 ? 's' : ''} ajoutée${bilan.ajoutes > 1 ? 's' : ''}${
            bilan.deja ? ` · ${bilan.deja} déjà là` : ''
          }`
        : `${bilan.ajoutes} address${bilan.ajoutes > 1 ? 'es' : ''} added${
            bilan.deja ? ` · ${bilan.deja} already there` : ''
          }`,
    )
  }

  const basculerEnvie = (liste: string, envie: Envie) => {
    setRangement((prev) => {
      const r = prev[liste] ?? { importer: true, envies: [], favori: false }
      const envies = r.envies.includes(envie)
        ? r.envies.filter((e) => e !== envie)
        : [...r.envies, envie]
      return { ...prev, [liste]: { ...r, envies } }
    })
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

          {/* ── les 3 étapes + le dépôt ─────────────────────────── */}
          {(etape === 'repos' || etape === 'lecture' || etape === 'erreur') && (
            <>
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
                    {t('coche « Maps (vos adresses) » ET « Saved » (tes listes), exporte, télécharge le .zip')}
                  </span>
                </li>
                <li className="takeout-etape">
                  <span className="takeout-num">3</span>
                  <span>{t('dépose le .zip entier ici — pas besoin de l’ouvrir :')}</span>
                </li>
              </ol>
              <label className="takeout-depot">
                <input
                  type="file"
                  accept=".zip,.json,.csv,application/zip,application/json,text/csv"
                  multiple
                  hidden
                  disabled={etape === 'lecture'}
                  onChange={(e) => void deposer(e)}
                />
                <span className="hand takeout-depot-txt">
                  {t('déposer le .zip (ou .json / .csv)')}
                </span>
              </label>
              <span className="mono takeout-aide">
                {t('tes listes (Favoris, Envie d’y aller…) sont lues aussi — tu les rangeras en catégories juste après.')}
              </span>
            </>
          )}

          {/* ── le rangement : chaque liste devient une catégorie ── */}
          {etape === 'rangement' && moisson && (
            <div className="takeout-rangement">
              {moisson.spots.length > 0 && (
                <p className="mono takeout-aide">
                  {fr
                    ? `${moisson.spots.length} adresse${moisson.spots.length > 1 ? 's' : ''} étoilée${moisson.spots.length > 1 ? 's' : ''} prêtes — et ${moisson.listes.length} liste${moisson.listes.length > 1 ? 's' : ''} à ranger :`
                    : `${moisson.spots.length} starred place${moisson.spots.length > 1 ? 's' : ''} ready — and ${moisson.listes.length} list${moisson.listes.length > 1 ? 's' : ''} to sort:`}
                </p>
              )}
              {moisson.listes.map((liste) => {
                const r = rangement[liste.nom] ?? { importer: true, envies: [], favori: false }
                return (
                  <div key={liste.nom} className={`takeout-liste${r.importer ? '' : ' ecartee'}`}>
                    <div className="takeout-liste-tete">
                      <span className="hand takeout-liste-nom">
                        {liste.nom}
                        <span className="mono takeout-liste-nb"> · {liste.entrees.length}</span>
                      </span>
                      <button
                        type="button"
                        className="lien"
                        onClick={() =>
                          setRangement((prev) => ({
                            ...prev,
                            [liste.nom]: { ...r, importer: !r.importer },
                          }))
                        }
                      >
                        {r.importer ? t('écarter') : t('reprendre')}
                      </button>
                    </div>
                    {r.importer && (
                      <div className="takeout-chips">
                        {ENVIES.map((envie) => (
                          <button
                            key={envie}
                            type="button"
                            className={`takeout-chip${r.envies.includes(envie) ? ' choisi' : ''}`}
                            aria-pressed={r.envies.includes(envie)}
                            onClick={() => basculerEnvie(liste.nom, envie)}
                          >
                            {envie}
                          </button>
                        ))}
                        <button
                          type="button"
                          className={`takeout-chip takeout-chip-fav${r.favori ? ' choisi' : ''}`}
                          aria-pressed={r.favori}
                          onClick={() =>
                            setRangement((prev) => ({
                              ...prev,
                              [liste.nom]: { ...r, favori: !r.favori },
                            }))
                          }
                        >
                          ♥ {t('favoris')}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
              <span className="mono takeout-aide">
                {t('chaque liste reste ton étiquette perso (privée) — les envies, elles, branchent le deck et les filtres.')}
              </span>
              {aGeocoder(moisson.listes.filter((l) => rangement[l.nom]?.importer !== false)) > 0 && (
                <span className="mono takeout-aide">
                  {t('les listes n’ont pas de coordonnées : on retrouve chaque adresse sur la carte (~1 s chacune).')}
                </span>
              )}
              <button
                type="button"
                className="valider takeout-go"
                onClick={() => void lancerImport(moisson, rangement)}
              >
                {t('importer tout ça.')}
              </button>
            </div>
          )}

          {/* ── la course : le géocodage en direct ────────────────── */}
          {etape === 'course' && (
            <div className="takeout-course" role="status">
              <span className="mono takeout-msg">
                {avancee.total > 0
                  ? `${t('on retrouve chaque adresse…')} ${avancee.fait}/${avancee.total}`
                  : t('je lis ton carnet Google…')}
              </span>
              {avancee.courant && <span className="hand takeout-courant">{avancee.courant}</span>}
              {avancee.total > 0 && (
                <div className="bobine-cuve">
                  <span
                    className="bobine-bain"
                    style={{ width: `${Math.round((avancee.fait / avancee.total) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── le bilan ──────────────────────────────────────────── */}
          {msg && etape !== 'course' && etape !== 'rangement' && (
            <span
              className={`mono takeout-msg${etape === 'ok' ? ' takeout-msg-ok' : ''}${
                etape === 'erreur' ? ' takeout-msg-erreur' : ''
              }`}
            >
              {msg}
            </span>
          )}
          {etape === 'ok' && introuvables.length > 0 && (
            <span className="mono takeout-aide">
              {fr
                ? `${introuvables.length} introuvable${introuvables.length > 1 ? 's' : ''} sur la carte : ${introuvables.slice(0, 5).join(' · ')}${introuvables.length > 5 ? '…' : ''}`
                : `${introuvables.length} not found on the map: ${introuvables.slice(0, 5).join(' · ')}${introuvables.length > 5 ? '…' : ''}`}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
