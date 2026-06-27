import { useEffect, useRef, useState, lazy, Suspense, type ComponentProps } from 'react'
import LigneIndex from './LigneIndex'
import CeSoir from './CeSoir'
import Onboarding from './Onboarding'
import Splash from './Splash'
import Auth from './Auth'
import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'
import PickerCouleur from './PickerCouleur'
import { importerSeed, MEMBRES } from './seed'
import { srcPhoto } from './photos'
import { ICadenas, ICercle, IGlobe, IEtincelle, ICarnet, IAppareil, ISoleil, INuage, IPluie, ITampon, IBallon, IRefuge, ICloche } from './icones'
import Recherche from './EcranRecherche'
import Groupe from './EcranGroupe'
import portraitDefaut from './assets/portrait.jpg'
import {
  type Lieu,
  type Visibilite,
  type PhotoLieu,
  type SortieEnAttente,
  type Meteo,
  ENVIES,
  COMPAGNIES,
  METEOS,
  METEO_INFOS,
  prixMeteo,
  uniteParPersonne,
  gloseEnvie,
  tousLesLieux,
  chargerMonId,
  ajouterLieu,
  archiverLieu,
  supprimerLieu,
  majLieu,
  estAMoi,
  adopterLieu,
  lireCouleur,
  appliquerCouleur,
  ecrireCouleur,
  lireSeuils,
  ecrireSeuils,
  villeDeCoords,
  lireVus,
  ecrireVus,
  onboardingFait,
  reinitOnboarding,
  lireTagline,
  ecrireTagline,
  signalerLieu,
  ajouterBof,
  viderSorties,
  effacerTout,
  definirMaPosition,
  importerTakeout,
  distanceM,
  formatDistance,
  tempsMarche,
  etatHoraire,
  propreteWcLabel,
  adresseLisible,
  reverseAdresse,
  lireComparer,
  basculerComparer,
  ecrireComparer,
  viderComparer,
  lireFavoris,
  basculerFavori,
  ageDepuis,
  nouvelId,
  sortiesEnAttente,
  retirerSortie,
  lireProfil,
  sauverProfil,
} from './db'

// A4 : MapLibre (~1 Mo) sort du bundle principal — chargé à la demande
const CarteLazy = lazy(() => import('./Carte'))
function Carte(p: ComponentProps<typeof CarteLazy>) {
  return (
    <Suspense fallback={<div className="carte carte-chargement" />}>
      <CarteLazy {...p} />
    </Suspense>
  )
}
// la table de comparaison vit dans Carte.tsx — chargée à la demande aussi
const TableComparaisonLazy = lazy(() =>
  import('./Carte').then((m) => ({ default: m.TableComparaison })),
)
function TableComparaison(p: ComponentProps<typeof TableComparaisonLazy>) {
  return (
    <Suspense fallback={null}>
      <TableComparaisonLazy {...p} />
    </Suspense>
  )
}

const VISIBILITES: { v: Visibilite; icone: React.ReactNode; label: string }[] = [
  { v: 'prive', icone: <ICadenas taille={15} />, label: 'pour moi' },
  { v: 'cercle', icone: <ICercle taille={15} />, label: 'cercle' },
  { v: 'public', icone: <IGlobe taille={15} />, label: 'public' },
]

type Onglet = 'cesoir' | 'macarte' | 'cercle' | 'profil' | 'labo'

const labelHeure = (x: number) => `${Math.floor(x) % 24}h${x % 1 === 0.5 ? '30' : ''}`
// valeur de départ quand une borne passe d'inconnue à définie
const DEPART_BORNE: [number, number] = [18, 23]
// les crans : 0h → 6h du matin (30), par demi-heure
const CRANS: number[] = (() => {
  const a: number[] = []
  for (let h = 0; h <= 30; h += 0.5) a.push(h)
  return a
})()
const ROUE_ROW = 34 // hauteur d'une ligne de la molette

// une molette type "réveil iPhone" : on fait défiler, la valeur centrée est
// choisie (2 valeurs avant, 2 après, estompées). snap natif au scroll.
function RoueHoraire({ valeur, onChange }: { valeur: number; onChange: (v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const scrolling = useRef(false)
  const timer = useRef<number | undefined>(undefined)
  const idxSel = CRANS.indexOf(valeur)

  // caler la molette sur la valeur (sauf si l'utilisateur est en train de scroller)
  useEffect(() => {
    const el = ref.current
    if (!el || scrolling.current) return
    const i = CRANS.indexOf(valeur)
    el.scrollTop = (i < 0 ? 0 : i) * ROUE_ROW
  }, [valeur])

  const onScroll = () => {
    scrolling.current = true
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const el = ref.current
      if (!el) return
      const i = Math.max(0, Math.min(CRANS.length - 1, Math.round(el.scrollTop / ROUE_ROW)))
      scrolling.current = false
      if (CRANS[i] !== valeur) onChange(CRANS[i])
      else el.scrollTop = i * ROUE_ROW // re-cale pile sur le cran
    }, 130)
  }

  return (
    <div className="roue">
      <div className="roue-bande" />
      <div className="roue-scroll" ref={ref} onScroll={onScroll}>
        {CRANS.map((x, i) => (
          <div key={x} className={`roue-item ${i === idxSel ? 'sel' : ''}`}>
            {labelHeure(x)}
            {x >= 24 ? <span className="roue-plus1">+1</span> : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

// le choix des horaires : une molette par borne (ouvre / ferme), chacune avec
// son "je sais pas" → on peut n'en renseigner qu'une.
function CompteurHoraires({
  valeur,
  onChange,
}: {
  valeur?: [number | null, number | null]
  onChange: (v: [number | null, number | null] | undefined) => void
}) {
  const o = valeur?.[0] ?? null
  const f = valeur?.[1] ?? null
  const poser = (bord: 0 | 1, nv: number | null) => {
    const paire: [number | null, number | null] = bord === 0 ? [nv, f] : [o, nv]
    onChange(paire[0] == null && paire[1] == null ? undefined : paire)
  }
  return (
    <div className="compteur-horaires">
      <span className="lbl mono">horaires ?</span>
      <div className="roues">
        {([0, 1] as const).map((bord) => {
          const cur = bord === 0 ? o : f
          const lbl = bord === 0 ? 'ouvre' : 'ferme'
          return (
            <div className="roue-borne" key={bord}>
              <span className="mono compteur-lbl">{lbl}</span>
              {cur == null ? (
                <button
                  type="button"
                  className="roue-inconnu mono"
                  onClick={() => poser(bord, DEPART_BORNE[bord])}
                >
                  je sais pas
                  <span className="roue-definir">toucher pour définir</span>
                </button>
              ) : (
                <>
                  <RoueHoraire valeur={cur} onChange={(v) => poser(bord, v)} />
                  <button
                    type="button"
                    className="compteur-saispas mono"
                    onClick={() => poser(bord, null)}
                  >
                    je sais pas
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// "juin 26" depuis une date ISO (pour la fiche d'identité du profil)
const MOIS_COURT = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc']
function formatDepuis(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${MOIS_COURT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
}

// un menu compact « label : valeur ⌄ » qui ouvre un popover des options
// (sert pour « voir » et « trier » — on n'affiche que le critère actif)
function MenuCritere({
  label,
  valeur,
  options,
  onChoisir,
}: {
  label: string
  valeur: string
  options: { v: string; lbl: string; court?: string }[]
  onChoisir: (v: string) => void
}) {
  const [ouvert, setOuvert] = useState(false)
  const actif = options.find((o) => o.v === valeur)
  return (
    <div className="menu-critere">
      <button
        className="menu-critere-btn mono"
        aria-expanded={ouvert}
        onClick={() => setOuvert((o) => !o)}
      >
        <span className="menu-critere-lbl">{label} :</span>{' '}
        {actif?.court ?? actif?.lbl ?? '—'} <span className="menu-critere-chevron">⌄</span>
      </button>
      {ouvert && (
        <>
          <div className="menu-critere-voile" onClick={() => setOuvert(false)} />
          <div className="menu-critere-pop mono">
            {options.map((o) => (
              <button
                key={o.v}
                className={`menu-critere-opt ${o.v === valeur ? 'on' : ''}`}
                onClick={() => {
                  onChoisir(o.v)
                  setOuvert(false)
                }}
              >
                {o.lbl}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// la phrase d'accroche (tagline) : courte par essence — limite stricte
const TAGLINE_MAX = 42

// ── les réglages : où tu es · couleur · porte-monnaie · données · à venir ──
// ── helpers d'affichage du profil v2 (Insta/Bumble) ──
const CARTE_PROFIL: React.CSSProperties = {
  background: 'var(--paper-2)',
  border: '1px solid rgba(240,234,217,0.08)',
  borderRadius: 12,
  padding: '14px 16px',
}
function TitreSection({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        letterSpacing: 1,
        color: 'var(--red)',
        margin: '24px 0 10px',
      }}
    >
      {children}
    </div>
  )
}
function StatProfil({ n, l, onClick }: { n: React.ReactNode; l: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: 'none',
        border: 'none',
        padding: '0 4px',
        color: 'var(--ivory)',
        cursor: onClick ? 'pointer' : 'default',
        textAlign: 'center',
      }}
    >
      <div style={{ fontStyle: 'italic', fontSize: 22 }}>{n}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, opacity: 0.55 }}>{l}</div>
    </button>
  )
}

function Reglages({ lieux }: { lieux: Lieu[] }) {
  const [couleur, setCouleur] = useState(() => lireCouleur())
  const [s1, setS1] = useState(() => String(lireSeuils()[0]))
  const [s2, setS2] = useState(() => String(lireSeuils()[1]))
  const [ouTu, setOuTu] = useState('')
  useEffect(() => {
    villeDeCoords().then(setOuTu)
  }, [])
  const [sauve, setSauve] = useState(false)
  const [confirmEffacer, setConfirmEffacer] = useState(false)
  const [ouvert, setOuvert] = useState<'ville' | 'couleur' | 'argent' | 'donnees' | 'bientot' | null>(
    null,
  )
  const bascule = (s: typeof ouvert) => setOuvert((o) => (o === s ? null : s))
  const flash = () => {
    setSauve(true)
    window.setTimeout(() => setSauve(false), 1200)
  }
  const choisirCouleur = (c: string) => {
    setCouleur(c)
    appliquerCouleur(c)
    ecrireCouleur(c)
    flash()
  }
  const majSeuil = (bord: 0 | 1, val: string) => {
    if (bord === 0) setS1(val)
    else setS2(val)
    const n1 = bord === 0 ? Number(val) : Number(s1)
    const n2 = bord === 1 ? Number(val) : Number(s2)
    if (n1 > 0 && n2 > n1) {
      ecrireSeuils([n1, n2])
      flash()
    }
  }
  // export : un fichier .json de tous mes spots (sans les blobs photos)
  const exporter = () => {
    const propre = lieux.map(({ photos, ...reste }) => ({ ...reste, nbPhotos: photos.length }))
    const blob = new Blob([JSON.stringify(propre, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'jeudi-mes-spots.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  // effacer : on vide tout le local (clés jeudi-* + la base IndexedDB) puis reload
  const effacer = () => {
    effacerTout()
    window.location.reload()
  }

  return (
    <div className="reglages">
      <div className="reglages-tete">
        <span className="lbl mono">tes réglages</span>
        <span className={`mono reglages-sauve ${sauve ? 'on' : ''}`}>enregistré ✓</span>
      </div>

      {/* OÙ TU ES (location-native : le centre suit ton GPS) */}
      <button
        className="mono reglages-section reglages-toggle"
        aria-expanded={ouvert === 'ville'}
        onClick={() => bascule('ville')}
      >
        où tu es · {ouTu || '…'}
        <span className="reglages-chevron">{ouvert === 'ville' ? '–' : '+'}</span>
      </button>
      {ouvert === 'ville' && (
        <div className="reglages-villes mono">
          <p className="reglages-ville-actuelle">
            {ouTu ? (
              <>
                tu es à <strong>{ouTu}</strong>.
              </>
            ) : (
              <>on cherche où tu es…</>
            )}
          </p>
          <p className="reglages-ville-bientot">
            jeudi te suit partout — les distances se calculent depuis ta position. autorise le
            GPS pour qu'elles soient justes (sinon : Place Vendôme).
          </p>
        </div>
      )}

      {/* TA COULEUR */}
      <button
        className="mono reglages-section reglages-toggle"
        aria-expanded={ouvert === 'couleur'}
        onClick={() => bascule('couleur')}
      >
        ta couleur de Jeudi
        <span className="reglages-chevron">{ouvert === 'couleur' ? '–' : '+'}</span>
      </button>
      {ouvert === 'couleur' && <PickerCouleur valeur={couleur} onChange={choisirCouleur} />}

      {/* TON PORTE-MONNAIE */}
      <button
        className="mono reglages-section reglages-toggle"
        aria-expanded={ouvert === 'argent'}
        onClick={() => bascule('argent')}
      >
        ton porte-monnaie (€ / pers.)
        <span className="reglages-chevron">{ouvert === 'argent' ? '–' : '+'}</span>
      </button>
      {ouvert === 'argent' && (
        <div className="reglages-seuils mono">
          <label>
            ça coûte rien &lt;
            <input
              className="onboard-euro"
              type="number"
              inputMode="numeric"
              value={s1}
              onChange={(e) => majSeuil(0, e.target.value)}
            />
            €
          </label>
          <label>
            on flambe &gt;
            <input
              className="onboard-euro"
              type="number"
              inputMode="numeric"
              value={s2}
              onChange={(e) => majSeuil(1, e.target.value)}
            />
            €
          </label>
        </div>
      )}

      {/* MES DONNÉES */}
      <button
        className="mono reglages-section reglages-toggle"
        aria-expanded={ouvert === 'donnees'}
        onClick={() => bascule('donnees')}
      >
        mes données
        <span className="reglages-chevron">{ouvert === 'donnees' ? '–' : '+'}</span>
      </button>
      {ouvert === 'donnees' && (
        <div className="reglages-donnees mono">
          <button className="reglages-action" onClick={exporter}>
            exporter mes spots (.json)
          </button>
          <button
            className={`reglages-action danger ${confirmEffacer ? 'confirm' : ''}`}
            onClick={() => (confirmEffacer ? effacer() : setConfirmEffacer(true))}
          >
            {confirmEffacer ? 'sûr ? tout effacer pour de bon' : 'effacer mes données locales'}
          </button>
        </div>
      )}

      {/* BIENTÔT (backend) */}
      <button
        className="mono reglages-section reglages-toggle"
        aria-expanded={ouvert === 'bientot'}
        onClick={() => bascule('bientot')}
      >
        bientôt
        <span className="reglages-chevron">{ouvert === 'bientot' ? '–' : '+'}</span>
      </button>
      {ouvert === 'bientot' && (
        <div className="reglages-bientot mono">
          {[
            'inviter un pote',
            'amis archivés',
            'spots archivés',
            'notifications',
            'se déconnecter',
            'supprimer le compte',
          ].map((t) => (
            <span key={t} className="reglages-bientot-item">
              {t} <span className="reglages-bientot-tag">bientôt</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [splash, setSplash] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [authPret, setAuthPret] = useState(false)
  const [lieux, setLieux] = useState<Lieu[]>([])
  const [ajout, setAjout] = useState(false)
  const [vue, setVue] = useState<'liste' | 'carte'>('liste')
  // chantier 1 : les lieux « à comparer » + l'ouverture de la table (accès aussi
  // depuis l'index, pas seulement la carte). source de vérité = localStorage.
  const [comparer, setComparer] = useState<string[]>(() => lireComparer())
  const [compaOuverte, setCompaOuverte] = useState(false)
  const basculerCompa = (l: Lieu) => setComparer(basculerComparer(l.id))
  // filtre « foot » à 3 états sur UNE ligne : tap = on le voit (diffuse) ·
  // appui long = barré (sans foot / refuge). timer du long-press.
  const footPress = useRef<{ timer: number; fired: boolean } | null>(null)
  const [onglet, setOnglet] = useState<Onglet>('macarte')
  const [labo, setLabo] = useState<'trouver' | 'potos'>('trouver')
  const [fiche, setFiche] = useState<Lieu | null>(null)
  // la liste de contexte pour naviguer précédent/suivant dans la fiche
  const [ficheListe, setFicheListe] = useState<Lieu[]>([])
  // les lieux déjà consultés : pour les reconnaître sur la carte (comme un lien visité)
  const [vus, setVus] = useState<Set<string>>(
    () => new Set(lireVus()),
  )
  const marquerVu = (id: string) =>
    setVus((prev) => {
      if (prev.has(id)) return prev
      const n = new Set(prev).add(id)
      ecrireVus([...n])
      return n
    })
  const ouvrirFiche = (l: Lieu, contexte: Lieu[]) => {
    // si on ouvre un lieu « à comparer », on ne navigue QUE parmi les sélectionnés
    // (ex. 1/3 au lieu de 1/82), jusqu'à ce que la liste « à comparer » soit vidée.
    const comp = lireComparer()
    if (comp.includes(l.id)) {
      const compares = comp
        .map((id) => lieux.find((x) => x.id === id))
        .filter((x): x is Lieu => !!x)
      setFicheListe(compares.length ? compares : contexte)
    } else {
      setFicheListe(contexte)
    }
    setFiche(l)
    marquerVu(l.id)
  }
  const naviguerFiche = (l: Lieu) => {
    setFiche(l)
    marquerVu(l.id)
  }
  const [onboard, setOnboard] = useState(() => !onboardingFait())
  const [attente, setAttente] = useState<SortieEnAttente[]>([])
  const [attenteTotal, setAttenteTotal] = useState(0)
  const [archive, setArchive] = useState<Lieu | null>(null)
  // notifications (haut-droite) : demandes d'amis (simulées) + lieux à noter
  const [notifsOuvertes, setNotifsOuvertes] = useState(false)
  const [demandes, setDemandes] = useState<{ id: string; prenom: string; titre: string }[]>([
    { id: 'sofia', prenom: 'Sofia', titre: 'éclaireuse du 3e' },
    { id: 'yanis', prenom: 'Yanis', titre: 'éclaireur du 10e' },
  ])
  const repondreDemande = (id: string) => setDemandes((d) => d.filter((x) => x.id !== id))
  const [confirmVider, setConfirmVider] = useState(false)
  const [prenom, setPrenom] = useState('toi')
  const [critere, setCritere] = useState('le feeling')
  const [photoProfil, setPhotoProfil] = useState<Blob | null>(null)
  const [bio, setBio] = useState('')
  const [tagline, setTagline] = useState(() => lireTagline())
  const [insta, setInsta] = useState('')
  const [naissance, setNaissance] = useState('1991-03-06') // pré-rempli (Ersan)
  const [depuis, setDepuis] = useState('')
  const sauverBioInsta = async (naiss = naissance) => {
    const cur = await lireProfil()
    // « depuis » se fige à la 1re sauvegarde (date d'entrée dans le carnet)
    const dep = cur?.depuis ?? depuis ?? new Date().toISOString()
    if (!depuis) setDepuis(dep)
    await sauverProfil({
      scoreSwipe: cur?.scoreSwipe ?? 100,
      critere: cur?.critere ?? critere,
      prenom: cur?.prenom ?? 'Ersan',
      photo: cur?.photo,
      photoUrl: cur?.photoUrl,
      bio: bio.trim(),
      insta: insta.trim().replace(/^@/, ''),
      naissance: naiss || cur?.naissance,
      depuis: dep,
    })
    setFlash('profil enregistré.')
  }
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!photoProfil) {
      setPhotoUrl(null)
      return
    }
    const u = URL.createObjectURL(photoProfil)
    setPhotoUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [photoProfil])
  const changerPhotoProfil = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const cur = await lireProfil()
    await sauverProfil({
      scoreSwipe: cur?.scoreSwipe ?? 100,
      critere: cur?.critere ?? critere,
      prenom: cur?.prenom ?? 'Ersan',
      photo: f,
    })
    setPhotoProfil(f)
  }
  // le curateur dont on regarde la carte (par prénom) — null = la liste du cercle
  const [curateur, setCurateur] = useState<string | null>(null)
  // petit message éphémère (effacé / signalé / visibilité changée)
  const [flash, setFlash] = useState<string | null>(null)
  // filtres COMBINABLES (3 axes qui s'additionnent) :
  //  · statut : tout · à découvrir (pas fait) · faits (validés)
  //  · ouvert : ouvert maintenant (on/off)
  //  · match  : off · diffuse (on y voit le foot) · refuge (tout sauf le foot)
  const [filtre, setFiltre] = useState<'tout' | 'decouvrir' | 'faits'>('tout')
  const [ouvertOn, setOuvertOn] = useState(false)
  const [matchF, setMatchF] = useState<'off' | 'diffuse' | 'refuge'>('off')
  const [rooftopOn, setRooftopOn] = useState(false)
  const [surLeauOn, setSurLeauOn] = useState(false)
  // phase 2 : filtre par envie (apéro, resto, turbo…), combinable. null = toutes.
  const [envieF, setEnvieF] = useState<string | null>(null)
  // les filtres statut/ouvert/match repliés dans un menu « filtres ⌄ »
  const [filtresOuvert, setFiltresOuvert] = useState(false)
  // les favoris (signets) : ids gardés sous la main + filtre dédié
  const [favoris, setFavoris] = useState<string[]>(() => lireFavoris())
  const [favOn, setFavOn] = useState(false)
  // #22 : le tri — au plus proche (défaut) ou par propreté des WC (seul score permis)
  const [tri, setTri] = useState<'proche' | 'wc' | 'pop'>('proche')
  // quelle collection on regarde sur "ma carte" : 'moi', un prénom de curateur, ou 'public'
  const [collection, setCollection] = useState<string>('tout')
  // appliquer la couleur de marque choisie (dès le premier rendu)
  useEffect(() => {
    appliquerCouleur(lireCouleur())
  }, [])

  // re-render quand la vraie géoloc arrive (les distances se recalculent)
  const [, setPosVersion] = useState(0)
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (p) => {
        definirMaPosition({ lat: p.coords.latitude, lng: p.coords.longitude })
        setPosVersion((v) => v + 1)
      },
      () => {
        /* refus ou contexte non sécurisé : on reste sur Place Vendôme */
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [])

  const recharger = () => tousLesLieux().then(setLieux)
  useEffect(() => {
    chargerMonId().then(() => {
    importerSeed().then(() => {
      recharger()
      const a = sortiesEnAttente()
      setAttente(a)
      setAttenteTotal(a.length)
    })
    lireProfil().then((p) => {
      if (p?.prenom) setPrenom(p.prenom.toLowerCase())
      if (p?.critere) setCritere(p.critere)
      // le portrait cloud (Storage) est prioritaire ; sinon le blob local (cache)
      if (p?.photoUrl) setPhotoUrl(p.photoUrl)
      else if (p?.photo) setPhotoProfil(p.photo)
      if (p?.bio) setBio(p.bio)
      if (p?.insta) setInsta(p.insta)
      if (p?.naissance) setNaissance(p.naissance)
      if (p?.depuis) setDepuis(p.depuis)
    })
    })
  }, [])

  // ── la session Supabase : on lit l'existante puis on écoute les changements
  // (connexion via magic-link, déconnexion, refresh du token). Tant qu'on n'a
  // pas répondu, authPret reste faux → on n'affiche ni Auth ni l'app par erreur.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthPret(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s)
      setAuthPret(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const aValider = attente[0] ?? null
  const sortieSuivante = () => setAttente((prev) => prev.slice(1))

  // toast "archivé · annuler" — disparaît après 5 s
  useEffect(() => {
    if (!archive) return
    const t = setTimeout(() => setArchive(null), 5000)
    return () => clearTimeout(t)
  }, [archive])

  // flash éphémère (sans action) — disparaît après 2,5 s
  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 2500)
    return () => clearTimeout(t)
  }, [flash])

  const archiver = async (l: Lieu) => {
    await archiverLieu(l.id)
    setArchive(l)
    recharger()
  }

  const annulerArchive = async () => {
    if (archive) {
      await majLieu({ ...archive, statut: 'actif' })
      setArchive(null)
      recharger()
    }
  }

  const supprimer = async (l: Lieu) => {
    await supprimerLieu(l.id)
    recharger()
    setFlash('effacé.')
  }

  // cycle la visibilité : privé → cercle → public → privé
  const cyclerVisibilite = async (l: Lieu) => {
    const suite: Record<Visibilite, Visibilite> = {
      prive: 'cercle',
      cercle: 'public',
      public: 'prive',
    }
    const v = suite[l.visibilite]
    await majLieu({ ...l, visibilite: v })
    recharger()
    setFlash(v === 'prive' ? 'privé.' : v === 'cercle' ? 'visible par ton cercle.' : 'public autour de toi.')
  }

  // adopter un spot du cercle : crée MA copie privée (sauf si déjà fait)
  const adopter = async (l: Lieu) => {
    if (lieux.some((x) => estAMoi(x) && x.nom === l.nom)) {
      setFlash('déjà sur ta carte.')
      return
    }
    await adopterLieu(l)
    recharger()
    setFlash(`${l.nom} ajouté à ta carte. à toi de le tamponner.`)
  }

  // poser/retirer le signet (favori) — pas une note, juste « je le garde »
  const basculerFav = (l: Lieu) => {
    setFavoris(basculerFavori(l.id))
  }

  const signaler = async (l: Lieu) => {
    signalerLieu(l.id)
    setFlash('signalé. merci, on vérifie.')
  }

  // qui possède quoi : mes spots + ceux de mon cercle = "ma carte" ; les
  // éclaireurs hors cercle (proprietaire pub-*) ne vivent que dans "public".
  const idsCercle = new Set(MEMBRES.map((m) => m.id))
  const idsProches = new Set(MEMBRES.filter((m) => m.proche).map((m) => m.id))
  const estDuCercle = (l: Lieu) => !!l.proprietaire && idsCercle.has(l.proprietaire)
  const estDesProches = (l: Lieu) => !!l.proprietaire && idsProches.has(l.proprietaire)
  const mesLieux = lieux.filter((l) => estAMoi(l) || estDuCercle(l))
  const lieuxPublics = lieux.filter((l) => l.visibilite === 'public')

  // la collection affichée sur "ma carte" : 4 niveaux de distance sociale
  // (la sélection d'UNE personne précise se fait dans l'onglet "le cercle")
  const baseCarte =
    collection === 'tout'
      ? lieux // tout mélangé : mes spots + proches + potes + public/curateurs
      : collection === 'moi'
      ? lieux.filter(estAMoi)
      : collection === 'public'
        ? lieuxPublics
        : collection === 'proches'
          ? lieux.filter(estDesProches)
          : lieux.filter(estDuCercle) // potes = tout le cercle (proches inclus)

  // l'index filtré : les 3 axes se COMBINENT (tous doivent passer)
  const appliquerFiltre = (liste: Lieu[]) =>
    liste.filter((l) => {
      const okStatut = filtre === 'faits' ? !!l.tampon : filtre === 'decouvrir' ? !l.tampon : true
      const okOuvert = !ouvertOn || etatHoraire(l.horaires)?.ouvert === true
      const okMatch =
        matchF === 'diffuse'
          ? l.match === 'diffuse'
          : matchF === 'refuge'
            ? l.match !== 'diffuse'
            : true
      const okEnvie = !envieF || (l.envies as string[]).includes(envieF)
      const okFav = !favOn || favoris.includes(l.id)
      const okRooftop = !rooftopOn || !!l.rooftop
      const okSurLeau = !surLeauOn || !!l.surLeau
      return okStatut && okOuvert && okMatch && okEnvie && okFav && okRooftop && okSurLeau
    })
  const lieuxFiltres = (() => {
    const liste = appliquerFiltre(baseCarte)
    if (tri === 'wc') {
      return [...liste].sort((a, b) => (b.propreteWc ?? 0) - (a.propreteWc ?? 0))
    }
    if (tri === 'pop') {
      // populaire = recommandé par le plus de voix (toi + le cercle)
      const voix = (l: Lieu) => (l.note ? 1 : 0) + (l.tipsCercle?.length ?? 0)
      return [...liste].sort((a, b) => voix(b) - voix(a))
    }
    return [...liste].sort((a, b) => distanceM(a) - distanceM(b))
  })()

  // les lieux à noter, dédoublonnés par nom (des sorties périmées s'accumulent)
  const aNoter = (() => {
    const vus = new Set<string>()
    return sortiesEnAttente().filter((s) => (vus.has(s.nom) ? false : (vus.add(s.nom), true)))
  })()

  if (splash) return <Splash onFini={() => setSplash(false)} />
  if (!authPret) return null
  if (!session) return <Auth />
  if (onboard) return <Onboarding onFini={() => setOnboard(false)} />

  return (
    <div className="page">
      {!fiche && !ajout && !aValider && (
        <>
          <div className="topbar">
            <div className="tampon-logo">Jeudi.</div>
            {onglet === 'macarte' ? (
              <span className="basculer mono topbar-basculer">
                <button
                  className={vue === 'liste' ? 'on' : ''}
                  aria-pressed={vue === 'liste'}
                  onClick={() => setVue('liste')}
                >
                  index
                </button>
                ·
                <button
                  className={vue === 'carte' ? 'on' : ''}
                  aria-pressed={vue === 'carte'}
                  onClick={() => setVue('carte')}
                >
                  carte
                </button>
              </span>
            ) : (
              <span className="topbar-titre">
                {onglet === 'cesoir'
                  ? 'ce soir'
                  : onglet === 'cercle'
                    ? 'le cercle'
                    : 'mon profil'}
              </span>
            )}
          </div>
          {(() => {
            const nb = demandes.length + aNoter.length
            return (
              <button
                className="notif-btn"
                aria-label="notifications"
                onClick={() => setNotifsOuvertes((o) => !o)}
              >
                <ICloche taille={20} />
                {nb > 0 && <span className="notif-pastille mono">{nb}</span>}
              </button>
            )
          })()}
        </>
      )}

      {notifsOuvertes && (
        <>
          <div
            className="notif-voile"
            onClick={() => {
              setNotifsOuvertes(false)
              setConfirmVider(false)
            }}
          />
          <div className="notif-panneau">
            <div className="notif-section">
              <span className="notif-titre mono">on veut t'ajouter</span>
              {demandes.length === 0 ? (
                <p className="hand notif-vide">personne pour l'instant.</p>
              ) : (
                demandes.map((d) => (
                  <div className="notif-ligne" key={d.id}>
                    <span className="notif-qui">
                      @{d.prenom.toLowerCase()}
                    </span>
                    <span className="notif-actions mono">
                      <button className="notif-ok" onClick={() => repondreDemande(d.id)}>
                        accepter
                      </button>
                      <button className="notif-non" onClick={() => repondreDemande(d.id)}>
                        ignorer
                      </button>
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="notif-section">
              <span className="notif-titre mono">à noter</span>
              {aNoter.length === 0 ? (
                <p className="hand notif-vide">rien à noter. sors !</p>
              ) : (
                aNoter.map((s) => (
                  <button
                    className="notif-ligne notif-anoter hand"
                    key={s.lieuId}
                    onClick={() => {
                      setAttente([s])
                      setNotifsOuvertes(false)
                    }}
                  >
                    alors, {s.nom} ?
                  </button>
                ))
              )}
            </div>

            {/* vider le centre — avec garde-fou sur les lieux à noter */}
            {(demandes.length > 0 || aNoter.length > 0) && (
              <div className="notif-pied">
                {confirmVider ? (
                  <div className="notif-confirm">
                    <p className="hand">
                      il te reste {aNoter.length} lieu
                      {aNoter.length > 1 ? 'x' : ''} à noter. on te les redemande plus tard ?
                    </p>
                    <div className="notif-confirm-actions mono">
                      <button
                        className="notif-ok"
                        onClick={() => {
                          setDemandes([])
                          setConfirmVider(false)
                          setNotifsOuvertes(false)
                        }}
                      >
                        oui, plus tard
                      </button>
                      <button
                        className="notif-non"
                        onClick={() => {
                          setDemandes([])
                          viderSorties()
                          setAttente([])
                          setConfirmVider(false)
                          setNotifsOuvertes(false)
                        }}
                      >
                        non, oublie tout
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="notif-vider mono"
                    onClick={() => {
                      if (aNoter.length > 0) setConfirmVider(true)
                      else {
                        setDemandes([])
                        setNotifsOuvertes(false)
                      }
                    }}
                  >
                    vider
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
      {onglet === 'macarte' && (
        <>
          {/* voir + trier : 2 menus compacts sur une ligne (on ne voit que l'actif) */}
          <div className="idx-reglages">
            <MenuCritere
              label="voir"
              valeur={collection}
              options={[
                { v: 'tout', lbl: 'tout' },
                { v: 'moi', lbl: 'moi' },
                { v: 'proches', lbl: 'proches' },
                { v: 'potes', lbl: 'potes' },
                { v: 'public', lbl: 'public' },
              ]}
              onChoisir={(v) => setCollection(v)}
            />
            <MenuCritere
              label="trier"
              valeur={tri}
              options={[
                { v: 'proche', lbl: 'au plus proche', court: 'proche' },
                { v: 'pop', lbl: 'populaire', court: 'pop' },
                { v: 'wc', lbl: 'wc propres', court: 'wc' },
              ]}
              onChoisir={(v) => setTri(v as 'proche' | 'wc' | 'pop')}
            />
            {/* le menu « filtres » : statut / ouvert / match repliés */}
            {(() => {
              const nb =
                (filtre !== 'tout' ? 1 : 0) + (ouvertOn ? 1 : 0) + (matchF !== 'off' ? 1 : 0) + (favOn ? 1 : 0) + (rooftopOn ? 1 : 0) + (surLeauOn ? 1 : 0)
              const lignes: { actif: boolean; lbl: string; toggle: () => void }[] = [
                { actif: favOn, lbl: 'mes favoris', toggle: () => setFavOn((f) => !f) },
                { actif: filtre === 'decouvrir', lbl: 'à tester', toggle: () => setFiltre((p) => (p === 'decouvrir' ? 'tout' : 'decouvrir')) },
                { actif: filtre === 'faits', lbl: 'faits', toggle: () => setFiltre((p) => (p === 'faits' ? 'tout' : 'faits')) },
                { actif: ouvertOn, lbl: 'ouvert maintenant', toggle: () => setOuvertOn((o) => !o) },
                { actif: rooftopOn, lbl: 'rooftop', toggle: () => setRooftopOn((r) => !r) },
                { actif: surLeauOn, lbl: "sur l'eau", toggle: () => setSurLeauOn((s) => !s) },
              ]
              return (
                <div className="menu-critere menu-critere-droite">
                  <button
                    className="menu-critere-btn mono"
                    aria-expanded={filtresOuvert}
                    onClick={() => setFiltresOuvert((o) => !o)}
                  >
                    <span className="menu-critere-lbl">filtres</span>
                    {nb > 0 && <span className="menu-critere-nb"> {nb}</span>}{' '}
                    <span className="menu-critere-chevron">⌄</span>
                  </button>
                  {filtresOuvert && (
                    <>
                      <div className="menu-critere-voile" onClick={() => setFiltresOuvert(false)} />
                      <div className="menu-critere-pop mono">
                        {lignes.map((l) => (
                          <button
                            key={l.lbl}
                            className={`menu-critere-opt ${l.actif ? 'on' : ''}`}
                            onClick={l.toggle}
                          >
                            {l.lbl}
                          </button>
                        ))}
                        {/* « foot » : tap = on le voit (diffuse) · appui long = barré (sans foot) */}
                        <button
                          className={`menu-critere-opt ${matchF !== 'off' ? 'on' : ''} ${matchF === 'refuge' ? 'barre' : ''}`}
                          onPointerDown={() => {
                            footPress.current = { fired: false, timer: 0 }
                            footPress.current.timer = window.setTimeout(() => {
                              if (footPress.current) footPress.current.fired = true
                              setMatchF((m) => (m === 'refuge' ? 'off' : 'refuge'))
                              navigator.vibrate?.(30)
                            }, 450)
                          }}
                          onPointerUp={() => {
                            const p = footPress.current
                            footPress.current = null
                            if (!p) return
                            clearTimeout(p.timer)
                            if (p.fired) return // appui long → déjà traité (barré)
                            setMatchF((m) => (m === 'diffuse' ? 'off' : 'diffuse'))
                          }}
                          onPointerLeave={() => {
                            if (footPress.current) {
                              clearTimeout(footPress.current.timer)
                              footPress.current = null
                            }
                          }}
                        >
                          foot
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })()}
            <span className="idx-reglages-compteur mono">
              {lieuxFiltres.filter((l) => etatHoraire(l.horaires)?.ouvert === true).length} ouverts ·{' '}
              {lieuxFiltres.length} spot{lieuxFiltres.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* phase 2 : filtrer par envie (scroll horizontal, combinable) */}
          {baseCarte.length > 0 && (
            <div className="idx-envies mono">
              <span className="idx-envies-lbl">envie :</span>
              <button
                className={`idx-envie ${envieF === null ? 'on' : ''}`}
                aria-pressed={envieF === null}
                onClick={() => setEnvieF(null)}
              >
                tout
              </button>
              {ENVIES.filter((e) => e !== 'turbo').map((e) => (
                <button
                  key={e}
                  className={`idx-envie ${envieF === e ? 'on' : ''}`}
                  aria-pressed={envieF === e}
                  onClick={() => setEnvieF((p) => (p === e ? null : e))}
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          {vue === 'carte' && (
            <>
              <div className="voile-haut" />
              <Carte
                lieux={lieuxFiltres}
                vus={vus}
                onVoir={(l) => ouvrirFiche(l, lieuxFiltres)}
                comparer={comparer}
                onComparer={(id) => setComparer(basculerComparer(id))}
              />
            </>
          )}

          {vue === 'liste' && baseCarte.length === 0 && !ajout && (
            <div className="vide">
              {collection === 'moi' ? (
                <>
                  <p className="hand">t'as encore rien capturé.</p>
                  <p className="hand">la rue t'attend.</p>
                </>
              ) : (
                <p className="hand">@{collection.toLowerCase()} n'a rien partagé ici.</p>
              )}
            </div>
          )}

          {vue === 'liste' &&
            baseCarte.length > 0 &&
            lieuxFiltres.length === 0 &&
            (filtre === 'faits' ? (
              <div className="vide">
                <p className="hand">rien de validé pour l'instant.</p>
                <p className="hand">sors, puis tamponne.</p>
              </div>
            ) : ouvertOn ? (
              <div className="vide">
                <p className="hand">rien d'ouvert là, maintenant.</p>
                <p className="hand">la nuit est jeune ailleurs.</p>
              </div>
            ) : (
              <div className="vide">
                <p className="hand">tout est fait par ici.</p>
                <p className="hand">capture du neuf.</p>
              </div>
            ))}

          {/* chantier 1 : barre « à comparer · N » unique (liste ET carte), sous
              les filtres → plus de superposition. État remonté ici (source unique). */}
          {!ajout && comparer.length > 0 && (
            <div className="idx-comparer">
              <span className="mono idx-comparer-titre">à comparer · {comparer.length}</span>
              {comparer.length > 1 && (
                <button
                  className="idx-comparer-go mono"
                  onClick={() => {
                    // ouvre les FICHES des lieux comparés (nav restreinte 1/N) ;
                    // la table est ensuite accessible depuis la fiche → flux unique
                    const compares = lieux.filter((x) => comparer.includes(x.id))
                    if (compares[0]) ouvrirFiche(compares[0], compares)
                  }}
                >
                  comparer →
                </button>
              )}
              <button
                className="idx-comparer-vider mono"
                onClick={() => {
                  viderComparer()
                  setComparer([])
                }}
              >
                vider
              </button>
            </div>
          )}

          <ul className="liste" hidden={vue !== 'liste' || ajout}>
            {lieuxFiltres.map((l) => (
              <LigneIndex
                key={l.id}
                lieu={l}
                estMien={estAMoi(l)}
                dejaAdopte={
                  !estAMoi(l) && lieux.some((x) => estAMoi(x) && x.nom === l.nom)
                }
                estFavori={favoris.includes(l.id)}
                aComparer={comparer.includes(l.id)}
                onVoir={(l) => ouvrirFiche(l, lieuxFiltres)}
                onArchiver={archiver}
                onSupprimer={supprimer}
                onSignaler={signaler}
                onVisibilite={cyclerVisibilite}
                onAdopter={adopter}
                onFavori={basculerFav}
                onComparer={basculerCompa}
              />
            ))}
          </ul>

          {ajout ? (
            <FormAjout
              onFini={() => {
                setAjout(false)
                recharger()
              }}
              onAnnule={() => setAjout(false)}
            />
          ) : (
            <button className="fab" onClick={() => setAjout(true)} aria-label="capturer un lieu">
              +
            </button>
          )}

          {/* la table de comparaison est rendue au niveau GLOBAL (voir plus bas),
              pour s'ouvrir depuis n'importe quel onglet (récap « ce soir », index, carte). */}
        </>
      )}

      {onglet === 'cesoir' && (
        <CeSoir
          lieux={mesLieux}
          onVoir={(l) => ouvrirFiche(l, mesLieux)}
          onComparer={(ids) => {
            setComparer(ecrireComparer(ids))
            setCompaOuverte(true)
          }}
        />
      )}

      {onglet === 'profil' && (
        <div className="cercle profil-vue">

          {/* ① en-tête : portrait + identité + stats (façon Insta) */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <label className="profil-id">
              <svg className="profil-trombone" viewBox="0 0 28 72" aria-hidden="true">
                <path
                  d="M9 12 V50 a5 5 0 0 0 10 0 V16 a8 8 0 0 0 -16 0 V52 a13 13 0 0 0 26 0 V20"
                  fill="none"
                  stroke="#c9c0ab"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <img className="profil-id-photo" src={photoUrl ?? portraitDefaut} alt="ton portrait" />
              <span className="profil-id-tampon">{prenom}</span>
              <span className="mono profil-id-changer">
                <IAppareil taille={11} /> changer
              </span>
              <input type="file" accept="image/*" capture="user" hidden onChange={changerPhotoProfil} />
            </label>

            <div style={{ flex: 1, paddingTop: 4, color: 'var(--ivory)' }}>
              <div style={{ fontStyle: 'italic', fontSize: 26, lineHeight: 1.1 }}>
                {prenom}
                {ageDepuis(naissance) != null && (
                  <span style={{ opacity: 0.65 }}> · {ageDepuis(naissance)} ans</span>
                )}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.55, marginTop: 3 }}>
                depuis {formatDepuis(depuis)}
              </div>
              <div style={{ display: 'flex', marginTop: 14 }}>
                <StatProfil n={mesLieux.length} l="spots" />
                <StatProfil n={mesLieux.filter((x) => x.tampon?.v === 'valide').length} l="validés" />
                <StatProfil
                  n={`${MEMBRES.filter((m) => m.proche).length}/10`}
                  l="super potes"
                  onClick={() => setOnglet('cercle')}
                />
              </div>
            </div>
          </div>

          {/* ② mes critères (ex-« critère ») */}
          <TitreSection>mes critères</TitreSection>
          <div style={CARTE_PROFIL}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span style={{ fontStyle: 'italic', fontSize: 19 }}>
                {critere.replace(/^(le |la |les |l')/, '')}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5 }}>
                ton critère
              </span>
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                opacity: 0.45,
                marginTop: 10,
                borderTop: '1px solid rgba(240,234,217,0.08)',
                paddingTop: 10,
                lineHeight: 1.5,
              }}
            >
              bientôt : ajoute tes critères (le bruit ●●○, cocktails oui/non…) — et vois les lieux « selon Karim »
            </div>
          </div>

          {/* ③ mes super potes (anneau intérieur, 10 max) */}
          <TitreSection>mes super potes · {MEMBRES.filter((m) => m.proche).length}/10</TitreSection>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {MEMBRES.filter((m) => m.proche).map((m) => (
              <button
                key={m.id}
                onClick={() => setOnglet('cercle')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ivory)',
                }}
              >
                <span
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    border: '1px solid var(--red)',
                    display: 'grid',
                    placeItems: 'center',
                    fontStyle: 'italic',
                    fontSize: 20,
                  }}
                >
                  {m.prenom[0]}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, opacity: 0.6 }}>
                  {m.prenom}
                </span>
              </button>
            ))}
            <button
              onClick={() => setOnglet('cercle')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ivory-faded)',
              }}
            >
              <span
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: '1px dashed var(--ivory-faded)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 24,
                }}
              >
                +
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, opacity: 0.5 }}>
                ajouter
              </span>
            </button>
          </div>

          <TitreSection>ta vitrine</TitreSection>
          <label className="profil-tagline-edit">
            <input
              className="profil-tagline"
              placeholder="ex. « le roi du dernier verre »"
              value={tagline}
              maxLength={TAGLINE_MAX}
              onChange={(e) => setTagline(e.target.value)}
              onBlur={() => ecrireTagline(tagline.trim())}
            />
            <span className="profil-tagline-compteur mono">
              {tagline.length}/{TAGLINE_MAX}
            </span>
          </label>

          <div className="profil-bio">
            <textarea
              className="profil-bio-texte"
              placeholder="ta bio — qui tu es, ce que tu cherches le soir…"
              value={bio}
              maxLength={160}
              rows={2}
              onChange={(e) => setBio(e.target.value)}
              onBlur={() => sauverBioInsta()}
            />
            <label className="profil-insta mono">
              @
              <input
                placeholder="ton insta"
                value={insta}
                onChange={(e) => setInsta(e.target.value)}
                onBlur={() => sauverBioInsta()}
              />
            </label>
          </div>

          <TitreSection>réglages</TitreSection>
          <Reglages lieux={lieux} />

          <button
            className="lien"
            onClick={() => {
              reinitOnboarding()
              window.location.reload()
            }}
          >
            refaire l'accueil (le swipe, c'est ta langue ?)
          </button>
        </div>
      )}

      {onglet === 'cercle' && !curateur && (
        <div className="cercle">
          <p className="mono cercle-compteur">{MEMBRES.length} membres · 10 max</p>
          <ul className="membres">
            {MEMBRES.map((m) => {
              const nbSpots = lieux.filter((l) =>
                l.tipsCercle?.some((t) => t.auteur === m.prenom),
              ).length
              return (
                <li
                  key={m.id}
                  className="membre"
                  role="button"
                  onClick={() => setCurateur(m.prenom)}
                >
                  <div className="membre-tete">
                    <span className="membre-nom">{m.prenom}</span>
                  </div>
                  <p className="hand membre-bio">{m.bio}</p>
                  <p className="mono membre-critere">
                    son truc : {m.critere} · voir ses {nbSpots} spots →
                  </p>
                </li>
              )
            })}
          </ul>
          <p className="mono tips-bientot">les invitations arrivent. choisis bien.</p>
        </div>
      )}

      {onglet === 'cercle' && curateur && (
        <CarteCurateur
          curateur={curateur}
          lieux={lieux}
          vus={vus}
          onVoir={(l) =>
            ouvrirFiche(
              l,
              lieux.filter((x) => x.tipsCercle?.some((t) => t.auteur === curateur)),
            )
          }
          onFermer={() => setCurateur(null)}
        />
      )}

      {fiche && (
        <Fiche
          key={fiche.id}
          lieu={fiche}
          liste={ficheListe}
          enCompa={comparer.length > 1 && comparer.includes(fiche.id)}
          onComparer={() => setCompaOuverte(true)}
          onAdopter={adopter}
          dejaAdopte={!estAMoi(fiche) && lieux.some((x) => estAMoi(x) && x.nom === fiche.nom)}
          onNaviguer={naviguerFiche}
          onFermer={() => {
            setFiche(null)
            recharger()
          }}
          onCurateur={(nom) => {
            setFiche(null)
            setOnglet('cercle')
            setCurateur(nom)
          }}
        />
      )}

      {/* la table de comparaison — GLOBALE : s'ouvre depuis le récap « ce soir »,
          l'index, la carte ou une fiche (avant elle était piégée dans « ma carte »). */}
      {compaOuverte && (
        <TableComparaison
          lieux={comparer.map((id) => lieux.find((x) => x.id === id)).filter((x): x is Lieu => !!x)}
          onFermer={() => setCompaOuverte(false)}
          onVoir={(l) => {
            setCompaOuverte(false)
            ouvrirFiche(l, lieux.filter((x) => comparer.includes(x.id)))
          }}
          onRetirer={(id) => {
            const n = basculerComparer(id)
            setComparer(n)
            if (n.length < 2) setCompaOuverte(false)
          }}
        />
      )}

      {aValider && (
        <Validation
          key={aValider.lieuId}
          sortie={aValider}
          lieux={lieux}
          prenom={prenom}
          pos={attenteTotal - attente.length + 1}
          total={attenteTotal}
          onFini={() => {
            retirerSortie(aValider.lieuId)
            sortieSuivante()
            recharger()
          }}
          onPlusTard={() => {
            // « plus tard » = on enlève TOUTE la file d'un coup (pas une à une).
            // les sorties restent dans le stockage : on les reposera plus tard,
            // au compte-gouttes (quand/comment = à définir).
            setAttente([])
            setFlash('ok, je te redemande tout ça plus tard.')
          }}
        />
      )}

      {archive && (
        <div className="toast">
          <span className="mono">archivé.</span>
          <button className="lien" onClick={annulerArchive}>
            annuler
          </button>
        </div>
      )}

      {onglet === 'labo' && (
        <div style={{ paddingBottom: 90 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {(['trouver', 'potos'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setLabo(t)}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 10,
                  border: `1px solid ${labo === t ? 'var(--red)' : 'var(--ivory-faded)'}`,
                  background: labo === t ? 'var(--red)' : 'transparent',
                  color: labo === t ? 'var(--print-white)' : 'var(--ivory)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {t === 'trouver' ? 'trouver' : 'avec mes potes'}
              </button>
            ))}
          </div>
          {labo === 'trouver' ? (
            <Recherche lieux={lieux} onOuvrir={(l) => ouvrirFiche(l, lieux)} />
          ) : (
            <Groupe lieux={lieux} onOuvrir={(l) => ouvrirFiche(l, lieux)} />
          )}
        </div>
      )}

      {flash && (
        <div className="toast">
          <span className="mono">{flash}</span>
        </div>
      )}

      {!ajout && !fiche && (
        <nav className="navbas">
          <button
            className={`nav-item ${onglet === 'cesoir' ? 'actif' : ''}`}
            onClick={() => setOnglet('cesoir')}
            aria-label="ça dit quoi ce soir ?"
          >
            <IEtincelle taille={24} />
            <span className="nav-lbl">ce soir</span>
          </button>
          <button
            className={`nav-item ${onglet === 'macarte' ? 'actif' : ''}`}
            onClick={() => setOnglet('macarte')}
            aria-label="ma carte"
          >
            <ICarnet taille={24} />
            <span className="nav-lbl">ma carte</span>
          </button>
          <button
            className={`nav-item ${onglet === 'cercle' ? 'actif' : ''}`}
            onClick={() => setOnglet('cercle')}
            aria-label="le cercle"
          >
            <ICercle taille={24} />
            <span className="nav-lbl">le cercle</span>
          </button>
          <button
            className={`nav-item ${onglet === 'profil' ? 'actif' : ''}`}
            onClick={() => setOnglet('profil')}
            aria-label="mon profil"
          >
            <ITampon taille={24} />
            <span className="nav-lbl">mon profil</span>
          </button>
          <button
            className={`nav-item ${onglet === 'labo' ? 'actif' : ''}`}
            onClick={() => setOnglet('labo')}
            aria-label="labo"
          >
            <IGlobe taille={24} />
            <span className="nav-lbl">labo</span>
          </button>
        </nav>
      )}
    </div>
  )
}

// ── le swipe de sortie : "alors, Le Bisou ?" (la boucle de données) ──
function Validation({
  sortie,
  lieux,
  prenom,
  pos,
  total,
  onFini,
  onPlusTard,
}: {
  sortie: SortieEnAttente
  lieux: Lieu[]
  prenom: string
  pos: number
  total: number
  onFini: () => void
  onPlusTard: () => void
}) {
  const lieu = lieux.find((l) => l.id === sortie.lieuId)
  const [etape, setEtape] = useState<'verdict' | 'occasions' | 'tampon'>('verdict')
  // pré-cochés avec ce que le carnet sait déjà — et tout reste modifiable
  const [tags, setTags] = useState<string[]>(() => [
    ...(lieu?.compagnies ?? []),
    ...(lieu?.envies ?? []),
  ])
  const [tip, setTip] = useState(lieu?.note ?? '')
  const [photos, setPhotos] = useState<PhotoLieu[]>([])
  const [propreteWc, setPropreteWc] = useState<1 | 2 | 3 | undefined>(lieu?.propreteWc)
  // le tampon perso : posé sur la photo, et il suit le doigt
  const [tampon, setTampon] = useState<{ x: number; y: number }>({ x: 50, y: 35 })
  const [glisse, setGlisse] = useState(false)
  // les conditions optimales : appui long sur un mot = "je recommande comme ça" (orange)
  const [recos, setRecos] = useState<string[]>(() => lieu?.recos ?? [])
  const pressTimer = useRef<number | null>(null)
  const pressLongue = useRef(false)
  // "bof" se confirme d'un deuxième tap : un tampon raté, ça ne s'efface pas
  const [bofSur, setBofSur] = useState(false)
  // le verdict aussi se swipe (cohérence langue) : droite = je valide, gauche = bof
  const [vDrag, setVDrag] = useState({ x: 0, actif: false })
  const vDepart = useRef(0)
  // au premier mot coché, on souffle l'appui long en orange — une seule fois
  const [pulseMot, setPulseMot] = useState<string | null>(null)
  const dejaSouffle = useRef(false)

  const basculer = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  // tap court : rouge, "je l'ai fait comme ça" — appui long : orange, "les conditions optimales"
  const pressDebut = (t: string) => {
    pressLongue.current = false
    pressTimer.current = window.setTimeout(() => {
      pressLongue.current = true
      setRecos((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
      setTags((prev) => (prev.includes(t) ? prev : [...prev, t]))
      navigator.vibrate?.(25)
    }, 450)
  }
  const pressFin = (t: string) => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current)
    if (pressLongue.current) return
    if (recos.includes(t)) {
      // un mot orange retape court : on l'éteint complètement
      setRecos((prev) => prev.filter((x) => x !== t))
      setTags((prev) => prev.filter((x) => x !== t))
    } else {
      if (!tags.includes(t) && !dejaSouffle.current && recos.length === 0) {
        dejaSouffle.current = true
        setPulseMot(t)
        window.setTimeout(() => setPulseMot(null), 1400)
      }
      basculer(t)
    }
  }
  const pressAnnule = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current)
  }

  const placerTampon = (e: React.PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTampon({
      x: Math.min(96, Math.max(4, Math.round(((e.clientX - r.left) / r.width) * 100))),
      y: Math.min(92, Math.max(8, Math.round(((e.clientY - r.top) / r.height) * 100))),
    })
  }
  const tamponDown = (e: React.PointerEvent) => {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setGlisse(true)
    placerTampon(e)
    navigator.vibrate?.(15) // le coup de tampon, dans la main
  }
  const tamponMove = (e: React.PointerEvent) => {
    if (glisse) placerTampon(e)
  }
  const tamponUp = () => setGlisse(false)

  const dateCourte = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })


  // même un "bof" est du signal : on le garde — et le tampon le dit
  const bof = async () => {
    ajouterBof(sortie.lieuId)
    if (lieu)
      await majLieu({
        ...lieu,
        tampon: { v: 'bof', x: 50, y: 35, qui: prenom, date: dateCourte },
      })
    onFini()
  }

  const terminer = async () => {
    if (lieu) {
      await majLieu({
        ...lieu,
        note: tip.trim() ? tip.trim() : lieu.note,
        photos: [...lieu.photos.filter((p) => !photos.some((n) => n.type === p.type)), ...photos],
        // les cases reflètent l'état final : cocher ajoute, décocher corrige
        envies: tags.filter((t) => (ENVIES as readonly string[]).includes(t)) as Lieu['envies'],
        compagnies: tags.filter((t) =>
          (COMPAGNIES as readonly string[]).includes(t),
        ) as Lieu['compagnies'],
        derniereValidation: new Date().toISOString(),
        tampon: { v: 'valide', ...tampon, qui: prenom, date: dateCourte },
        propreteWc: propreteWc ?? lieu.propreteWc,
        recos,
      })
    }
    onFini()
  }

  return (
    <div className="fiche validation">
      <p className="mono">
        l'autre soir · {new Date(sortie.date).toLocaleDateString('fr-FR')}
        {total > 1 && ` · ${pos}/${total}`}
      </p>
      {etape === 'verdict' ? (
        <>
          <h1 className="grande-question">alors, {sortie.nom} ?</h1>
          {lieu && (
            <div
              className="carte-lieu fiche-carte validation-carte"
              style={{
                transform: `translateX(${vDrag.x}px) rotate(${vDrag.x / 20}deg)`,
                transition: vDrag.actif ? 'none' : 'transform .35s cubic-bezier(.2,1.2,.4,1)',
              }}
              onPointerDown={(e) => {
                vDepart.current = e.clientX
                setVDrag({ x: 0, actif: true })
                ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
              }}
              onPointerMove={(e) =>
                vDrag.actif && setVDrag({ x: e.clientX - vDepart.current, actif: true })
              }
              onPointerUp={() => {
                if (vDrag.x > 90) setEtape('occasions')
                else if (vDrag.x < -90) bof()
                setVDrag({ x: 0, actif: false })
              }}
            >
              {vDrag.x > 60 && <span className="tampon valide">VALIDÉ</span>}
              {vDrag.x < -60 && <span className="tampon bof">bof</span>}
              <div className="carte-photo">
                {lieu.photos[0] ? (
                  <img src={srcPhoto(lieu.photos[0])} alt={lieu.nom} />
                ) : (
                  <div className="tirage-vide">
                    <span className="croix">✕</span>
                    <span className="hand sans-photo">{lieu.nom}</span>
                  </div>
                )}
              </div>
              {lieu.note && <p className="hand carte-tip">{lieu.note}</p>}
            </div>
          )}
          <p className="mono validation-aide">← bof · je valide →  (ou les boutons)</p>
          <div className="validation-actions">
            <button
              className={`visi-choix ${bofSur ? 'choisi' : ''}`}
              onClick={() => {
                if (bofSur) {
                  bof()
                } else {
                  setBofSur(true)
                  window.setTimeout(() => setBofSur(false), 2600)
                }
              }}
            >
              {bofSur ? 'sûr ? re-tape.' : 'bof'}
            </button>
            <button className="valider" onClick={() => setEtape('occasions')}>
              je valide
            </button>
          </div>
          <div className="validation-secondaires">
            <button className="lien" onClick={onFini}>
              j'y suis pas allé — oublie
            </button>
            <button className="lien" onClick={onPlusTard}>
              redemande-moi plus tard
            </button>
          </div>
        </>
      ) : etape === 'occasions' ? (
        <>
          <button className="lien retour-etape" onClick={() => setEtape('verdict')}>
            ← revenir au verdict
          </button>
          <h1 className="grande-question">validé. raconte.</h1>

          {lieu && (
            <div className="carte-lieu fiche-carte validation-carte">
              <div className="carte-photo">
                {(photos[0] ?? lieu.photos[0]) ? (
                  <img
                    src={srcPhoto(photos[0] ?? lieu.photos[0])}
                    alt={lieu.nom}
                  />
                ) : (
                  <div className="tirage-vide">
                    <span className="croix">✕</span>
                    <span className="hand sans-photo">t'as bien une photo d'hier soir…</span>
                  </div>
                )}
              </div>
              <div className="carte-nom">{lieu.nom}</div>
              {/* le tip s'écrit directement sous la photo, comme une légende */}
              <textarea
                className="validation-tip legende"
                placeholder="ton tip pour réussir ce lieu — table du fond, demande Momo…"
                value={tip}
                onChange={(e) => setTip(e.target.value)}
                rows={2}
              />
            </div>
          )}
          <KitPhotos
            photos={photos}
            setPhotos={setPhotos}
            propreteWc={propreteWc}
            setPropreteWc={setPropreteWc}
          />

          <p className="hand onboard-sous">tu l'as fait comment ?</p>
          <p className="mono validation-aide">
            tape : je l'ai fait comme ça (rouge) · reste appuyé : les conditions optimales, je
            recommande (orange).
          </p>
          <div className="rangée">
            <span className="lbl mono">avec qui ?</span>
            {COMPAGNIES.map((t) => (
              <button
                key={t}
                className={`mot ${recos.includes(t) ? 'entouré reco' : tags.includes(t) ? 'entouré' : ''} ${pulseMot === t ? 'pulse' : ''}`}
                aria-pressed={tags.includes(t)}
                onPointerDown={() => pressDebut(t)}
                onPointerUp={() => pressFin(t)}
                onPointerLeave={pressAnnule}
                onPointerCancel={pressAnnule}
                onContextMenu={(e) => e.preventDefault()}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="rangée">
            <span className="lbl mono">pour quoi ?</span>
            {ENVIES.map((t) => (
              <button
                key={t}
                className={`mot ${recos.includes(t) ? 'entouré reco' : tags.includes(t) ? 'entouré' : ''} ${pulseMot === t ? 'pulse' : ''}`}
                aria-pressed={tags.includes(t)}
                onPointerDown={() => pressDebut(t)}
                onPointerUp={() => pressFin(t)}
                onPointerLeave={pressAnnule}
                onPointerCancel={pressAnnule}
                onContextMenu={(e) => e.preventDefault()}
              >
                {t}
              </button>
            ))}
          </div>
          <button className="valider" onClick={() => setEtape('tampon')}>
            c'est dit.
          </button>
        </>
      ) : (
        <>
          <button className="lien retour-etape" onClick={() => setEtape('occasions')}>
            ← corriger le récit
          </button>
          <h1 className="grande-question">à toi de tamponner.</h1>

          {lieu && (
            <div
              className="carte-lieu fiche-carte validation-carte tampon-cible"
              onPointerDown={tamponDown}
              onPointerMove={tamponMove}
              onPointerUp={tamponUp}
              onPointerCancel={tamponUp}
            >
              <div className="carte-photo">
                {(photos[0] ?? lieu.photos[0]) ? (
                  <img src={srcPhoto(photos[0] ?? lieu.photos[0])} alt={lieu.nom} />
                ) : (
                  <div className="tirage-vide">
                    <span className="croix">✕</span>
                    <span className="hand sans-photo">{lieu.nom}</span>
                  </div>
                )}
              </div>
              <div className="carte-nom">{lieu.nom}</div>
              {tip.trim() && <p className="hand carte-tip">{tip.trim()}</p>}
              {/* le tampon : chaque tape, un coup — partout, même sur le blanc */}
              <span
                key={glisse ? 'glisse' : `${tampon.x}-${tampon.y}`}
                className={`tampon-perso valide ${glisse ? '' : 'claque'}`}
                style={{ left: `${tampon.x}%`, top: `${tampon.y}%` }}
              >
                <span className="tampon-qui">{prenom}</span>
                <span className="tampon-date">{dateCourte}</span>
              </span>
            </div>
          )}
          <p className="mono validation-aide">
            tape où tu veux — même sur le blanc. chaque tape, un coup de tampon.
          </p>
          <button className="valider" onClick={terminer}>
            tamponné.
          </button>
        </>
      )}
    </div>
  )
}

// ── la carte d'un curateur : tous les spots où sa voix est passée ──
function CarteCurateur({
  curateur,
  lieux,
  vus,
  onVoir,
  onFermer,
}: {
  curateur: string
  lieux: Lieu[]
  vus: Set<string>
  onVoir: (l: Lieu) => void
  onFermer: () => void
}) {
  const membre = MEMBRES.find((m) => m.prenom === curateur)
  const spots = lieux.filter((l) => l.tipsCercle?.some((t) => t.auteur === curateur))
  const [vue, setVue] = useState<'liste' | 'carte'>('liste')

  return (
    <div className="cercle carte-curateur">
      <button className="lien fiche-retour" onClick={onFermer}>
        ← le cercle
      </button>
      {/* fiche d'identité de carnet du curateur — même modèle que « mon profil » */}
      <div className="profil-carte">
        <div className="profil-id">
          <svg className="profil-trombone" viewBox="0 0 28 72" aria-hidden="true">
            <path
              d="M9 12 V50 a5 5 0 0 0 10 0 V16 a8 8 0 0 0 -16 0 V52 a13 13 0 0 0 26 0 V20"
              fill="none"
              stroke="#c9c0ab"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <img
            className="profil-id-photo"
            src={`https://i.pravatar.cc/240?u=${membre?.id ?? curateur}`}
            alt={curateur}
          />
          <span className="profil-id-tampon">{curateur}</span>
        </div>
        <dl className="profil-fiche mono">
          <div>
            <dt>prénom</dt>
            <dd>{curateur}</dd>
          </div>
          <div>
            <dt>spots</dt>
            <dd>{spots.length}</dd>
          </div>
          {membre && (
            <div>
              <dt>critère</dt>
              <dd>{membre.critere.replace(/^(le |la |les |l')/, '')}</dd>
            </div>
          )}
        </dl>
      </div>
      <p className="profil-tagline-vue">
        {membre?.tagline ? (
          `« ${membre.tagline} »`
        ) : (
          <span className="tagline-exemple">ex. « le roi du dernier verre »</span>
        )}
      </p>
      {membre?.bio && <p className="hand curateur-bio">{membre.bio}</p>}
      <span className="basculer mono curateur-basculer">
        <button
          className={vue === 'liste' ? 'on' : ''}
          aria-pressed={vue === 'liste'}
          onClick={() => setVue('liste')}
        >
          index
        </button>
        ·
        <button
          className={vue === 'carte' ? 'on' : ''}
          aria-pressed={vue === 'carte'}
          onClick={() => setVue('carte')}
        >
          carte
        </button>
      </span>

      {vue === 'carte' && spots.length > 0 && (
        <>
          <div className="voile-haut" />
          <Carte lieux={spots} vus={vus} onVoir={onVoir} />
        </>
      )}

      {vue === 'liste' &&
        (spots.length === 0 ? (
          <p className="hand vide">aucun spot partagé pour l'instant.</p>
        ) : (
          <ul className="liste">
            {spots.map((l) => {
              const tip = l.tipsCercle?.find((t) => t.auteur === curateur)
              return (
                <li key={l.id} className="lieu">
                  <div className="lieu-ligne" role="button" onClick={() => onVoir(l)}>
                    <div className="lieu-texte">
                      <div className="lieu-tete">
                        <span className="lieu-nom">{l.nom}</span>
                      </div>
                      {tip && <p className="hand curateur-tip">{tip.note}</p>}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        ))}
    </div>
  )
}

// ── la fiche lieu : un témoignage complet, prêt pour les autres voix ──
function Fiche({
  lieu: lieuInitial,
  liste,
  onFermer,
  onCurateur,
  onNaviguer,
  enCompa,
  onComparer,
  onAdopter,
  dejaAdopte,
}: {
  lieu: Lieu
  liste: Lieu[]
  onFermer: () => void
  onCurateur: (nom: string) => void
  onNaviguer: (l: Lieu) => void
  /** la fiche navigue parmi des lieux « à comparer » → propose d'ouvrir la table */
  enCompa: boolean
  onComparer: () => void
  /** adopter un spot qui n'est pas à moi (le copier sur ma carte) */
  onAdopter: (l: Lieu) => void
  dejaAdopte: boolean
}) {
  const [lieu, setLieu] = useState(lieuInitial)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [agrandi, setAgrandi] = useState(false) // visionneuse photo plein écran
  const zoomDepart = useRef({ x: 0, y: 0 })
  // l'adresse complète (n° + rue + CP + ville) récupérée en live, sinon repli
  const [adrComplete, setAdrComplete] = useState('')
  const nbPhotos = lieu.photos.length

  useEffect(() => {
    setAdrComplete('')
    if (lieu.lat === 0 && lieu.lng === 0) return
    let ok = true
    reverseAdresse(lieu.id, lieu.lat, lieu.lng).then((a) => {
      if (ok && a) setAdrComplete(a)
    })
    return () => {
      ok = false
    }
  }, [lieu.id, lieu.lat, lieu.lng])

  // Échap ferme la fiche
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onFermer()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onFermer])

  const mien = estAMoi(lieu)
  const [edition, setEdition] = useState(false)
  const dist = distanceM(lieu)
  const horaire = etatHoraire(lieu.horaires)
  const itineraire = `https://www.google.com/maps/dir/?api=1&destination=${lieu.lat},${lieu.lng}`

  const enregistrer = async (maj: Lieu) => {
    setLieu(maj)
    await majLieu(maj)
  }

  const basculerEnvie = async (e: (typeof ENVIES)[number]) => {
    if (!mien) return
    const envies = lieu.envies.includes(e)
      ? lieu.envies.filter((x) => x !== e)
      : [...lieu.envies, e]
    await enregistrer({ ...lieu, envies })
  }

  const basculerCompagnie = async (c: (typeof COMPAGNIES)[number]) => {
    if (!mien) return
    const compagnies = lieu.compagnies.includes(c)
      ? lieu.compagnies.filter((x) => x !== c)
      : [...lieu.compagnies, c]
    await enregistrer({ ...lieu, compagnies })
  }

  const changerMeteo = async (m: Meteo) => {
    if (!mien) return
    await enregistrer({ ...lieu, meteo: lieu.meteo === m ? undefined : m })
  }

  // le partage : si photo + tampon, le tampon s'IMPRIME dans l'image envoyée
  const partager = async () => {
    const texte = `${lieu.nom} — ${lieu.note || "regarde où je t'emmène."}\n${lieu.adresse ?? ''}\nhttps://maps.google.com/?q=${lieu.lat},${lieu.lng}\n— dit sur Jeudi.`
    const photo = lieu.photos[0]?.blob
    if (photo && lieu.tampon && navigator.canShare) {
      try {
        const img = await createImageBitmap(photo)
        const c = document.createElement('canvas')
        c.width = img.width
        c.height = img.height
        const ctx = c.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        // le coup de tampon, encré dans la photo
        const t = lieu.tampon
        const taille = Math.round(c.width / 16)
        // x/y sont en % du tirage entier ; sur la photo partagée, on ramène le tampon dedans
        ctx.translate(
          (Math.min(88, Math.max(12, t.x)) / 100) * c.width,
          (Math.min(86, Math.max(14, t.y)) / 100) * c.height,
        )
        ctx.rotate((-12 * Math.PI) / 180)
        const couleurMarque =
          getComputedStyle(document.documentElement).getPropertyValue('--red').trim() || '#a8322a'
        ctx.strokeStyle = t.v === 'valide' ? couleurMarque : '#9a948a'
        ctx.fillStyle = ctx.strokeStyle
        ctx.lineWidth = Math.max(3, taille / 8)
        ctx.textAlign = 'center'
        if (t.v === 'valide') {
          // le tampon épuré : le pseudo, la date en dessous
          const qui = (t.qui ?? 'moi').toUpperCase()
          ctx.font = `bold ${taille}px monospace`
          const largQui = ctx.measureText(qui).width
          const petit = Math.round(taille * 0.55)
          ctx.font = `bold ${petit}px monospace`
          const largDate = t.date ? ctx.measureText(t.date).width : 0
          const larg = Math.max(largQui, largDate)
          const haut = taille + (t.date ? petit * 1.3 : 0)
          ctx.strokeRect(-larg / 2 - taille * 0.4, -haut / 2 - taille * 0.35, larg + taille * 0.8, haut + taille * 0.7)
          ctx.textBaseline = 'alphabetic'
          ctx.font = `bold ${taille}px monospace`
          ctx.fillText(qui, 0, t.date ? -petit * 0.25 : taille * 0.35)
          if (t.date) {
            ctx.font = `bold ${petit}px monospace`
            ctx.fillText(t.date, 0, petit * 1.15)
          }
        } else {
          const texteTampon = `${(t.qui ?? 'moi').toUpperCase()} — PASSÉ À CÔTÉ`
          ctx.font = `bold ${taille}px monospace`
          const larg = ctx.measureText(texteTampon).width
          ctx.strokeRect(-larg / 2 - taille * 0.4, -taille * 0.85, larg + taille * 0.8, taille * 1.6)
          ctx.textBaseline = 'middle'
          ctx.fillText(texteTampon, 0, 0)
        }
        const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), 'image/jpeg', 0.85))
        const fichier = new File([blob], 'jeudi.jpg', { type: 'image/jpeg' })
        if (navigator.canShare({ files: [fichier] })) {
          await navigator.share({ title: lieu.nom, text: texte, files: [fichier] })
          return
        }
      } catch {
        /* on retombe sur le texte */
      }
    }
    if (navigator.share) {
      navigator.share({ title: lieu.nom, text: texte }).catch(() => {})
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(texte)}`, '_blank')
    }
  }

  // navigation entre lieux : précédent / suivant dans la liste de contexte
  const idx = liste.findIndex((l) => l.id === lieu.id)
  const precedent = idx > 0 ? liste[idx - 1] : null
  const suivant = idx >= 0 && idx < liste.length - 1 ? liste[idx + 1] : null
  const navDepart = useRef({ x: 0, y: 0 })
  const onCarteDown = (e: React.PointerEvent) => {
    navDepart.current = { x: e.clientX, y: e.clientY }
  }
  const onCarteUp = (e: React.PointerEvent) => {
    const dx = e.clientX - navDepart.current.x
    const dy = e.clientY - navDepart.current.y
    // swipe horizontal = changer de lieu
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0 && suivant) onNaviguer(suivant)
      else if (dx > 0 && precedent) onNaviguer(precedent)
      return
    }
    // swipe haut/bas sur la photo = feuilleter (partout pareil dans l'app)
    const cible = e.target as HTMLElement
    if (
      Math.abs(dy) > 40 &&
      Math.abs(dy) > Math.abs(dx) &&
      cible.closest('.carte-photo') &&
      nbPhotos > 1
    ) {
      setPhotoIndex((p) => (dy < 0 ? (p + 1) % nbPhotos : (p - 1 + nbPhotos) % nbPhotos))
      return
    }
    // tap = feuilleter les photos
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6 && nbPhotos > 1) {
      setPhotoIndex((p) => (p + 1) % nbPhotos)
    }
  }

  return (
    <div className="fiche">
      {/* visionneuse photo plein écran (bouton « agrandir ») — feuilletable */}
      {agrandi && nbPhotos > 0 && (
        <div
          className="photo-zoom"
          onClick={() => setAgrandi(false)}
          onPointerDown={(e) => {
            zoomDepart.current = { x: e.clientX, y: e.clientY }
          }}
          onPointerUp={(e) => {
            const dx = e.clientX - zoomDepart.current.x
            const dy = e.clientY - zoomDepart.current.y
            if ((Math.abs(dx) > 40 || Math.abs(dy) > 40) && nbPhotos > 1) {
              setPhotoIndex((p) =>
                dx < 0 || dy < 0 ? (p + 1) % nbPhotos : (p - 1 + nbPhotos) % nbPhotos,
              )
            }
          }}
        >
          <button className="photo-zoom-x mono" aria-label="fermer">✕</button>
          <img src={srcPhoto(lieu.photos[photoIndex])} alt={lieu.nom} />
          {nbPhotos > 1 && (
            <div className="photo-tirets photo-zoom-tirets">
              {lieu.photos.map((_, i) => (
                <span key={i} className={i === photoIndex ? 'on' : ''} />
              ))}
            </div>
          )}
          <span className="mono photo-zoom-lbl">{lieu.nom} · {photoIndex + 1}/{nbPhotos}</span>
        </div>
      )}
      <div className="fiche-haut">
        <button className="lien fiche-retour" onClick={onFermer}>
          ← retour
        </button>
        {liste.length > 1 && idx >= 0 && (
          <div className="fiche-nav">
            <button
              className="fiche-nav-btn"
              aria-label="lieu précédent"
              disabled={!precedent}
              onClick={() => precedent && onNaviguer(precedent)}
            >
              ‹
            </button>
            <span className="mono fiche-nav-compteur">
              {idx + 1}/{liste.length}
            </span>
            <button
              className="fiche-nav-btn"
              aria-label="lieu suivant"
              disabled={!suivant}
              onClick={() => suivant && onNaviguer(suivant)}
            >
              ›
            </button>
          </div>
        )}
        {enCompa && (
          <button className="fiche-compa-go mono" onClick={onComparer}>
            le tableau →
          </button>
        )}
      </div>
      <div
        className="carte-lieu fiche-carte"
        onPointerDown={onCarteDown}
        onPointerUp={onCarteUp}
      >
        <div className="carte-photo">
          {nbPhotos > 1 && (
            <div className="photo-tirets">
              {lieu.photos.map((_, i) => (
                <span key={i} className={i === photoIndex ? 'on' : ''} />
              ))}
            </div>
          )}
          {nbPhotos > 0 ? (
            <img src={srcPhoto(lieu.photos[photoIndex])} alt={lieu.nom} />
          ) : (
            <div className="tirage-vide">
              <span className="croix">✕</span>
              <span className="hand sans-photo">pas encore de photo.</span>
            </div>
          )}
          {nbPhotos > 1 && (
            <span className="mono photo-compteur">
              {photoIndex + 1}/{nbPhotos}
            </span>
          )}
        </div>
        <div className="carte-nom">{lieu.nom}</div>
        {nbPhotos > 0 && (
          <button
            className="photo-agrandir"
            onClick={(e) => {
              e.stopPropagation()
              setAgrandi(true)
            }}
            aria-label="agrandir la photo"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
            </svg>
          </button>
        )}
        {/* le tampon, posé sur tout le tirage — photo ou marge blanche */}
        {lieu.tampon && (
          <span
            className={`tampon-perso ${lieu.tampon.v}`}
            style={{ left: `${lieu.tampon.x}%`, top: `${lieu.tampon.y}%` }}
          >
            {lieu.tampon.v === 'valide' ? (
              <>
                <span className="tampon-qui">{lieu.tampon.qui ?? 'toi'}</span>
                {lieu.tampon.date && <span className="tampon-date">{lieu.tampon.date}</span>}
              </>
            ) : (
              `${lieu.tampon.qui ?? 'toi'} — passé à côté`
            )}
          </span>
        )}
      </div>

      {(adrComplete || lieu.adresse) && (
        <p className="mono fiche-adresse">
          {adrComplete || adresseLisible(lieu.adresse, lieu.nom)}
        </p>
      )}

      <div className="fiche-infos">
        <div className="fiche-case">
          <div className="fiche-case-gros">{formatDistance(dist)}</div>
          <div className="mono fiche-case-lbl">{tempsMarche(dist)} min à pied</div>
        </div>
        <div className="fiche-case">
          <div className={`fiche-case-gros ${horaire?.ouvert ? 'ouvert' : 'ferme'}`}>
            {horaire
              ? horaire.ouvert === true
                ? 'ouvert'
                : horaire.ouvert === false
                  ? 'fermé'
                  : 'horaires'
              : '—'}
          </div>
          <div className="mono fiche-case-lbl">
            {horaire ? horaire.texte.replace(/^[^·]*· /, '') : 'horaires inconnus'}
          </div>
        </div>
      </div>

      {propreteWcLabel(lieu.propreteWc) && (
        <div className="fiche-wc mono">
          <span className="fiche-wc-lbl">propreté des wc</span>
          <span className="fiche-wc-pts">{propreteWcLabel(lieu.propreteWc)!.points}</span>
          <span className="fiche-wc-mot">{propreteWcLabel(lieu.propreteWc)!.mot}</span>
        </div>
      )}

      {(lieu.match ||
        (lieu.note ? 1 : 0) + (lieu.tipsCercle?.length ?? 0) >= 2) && (
        <div className="fiche-signaux">
          {(lieu.note ? 1 : 0) + (lieu.tipsCercle?.length ?? 0) >= 2 && (
            <span className="fiche-signal ref">référence — recommandé par plusieurs</span>
          )}
          {lieu.match === 'diffuse' && (
            <span className="fiche-signal match">
              <IBallon taille={14} /> on y voit les matchs
            </span>
          )}
          {lieu.match === 'refuge' && (
            <span className="fiche-signal refuge">
              <IRefuge taille={14} /> refuge anti-foot
            </span>
          )}
        </div>
      )}

      {lieu.description && <p className="mono fiche-description">{lieu.description}</p>}

      <div className="fiche-tips">
        <span className="lbl mono">les tips</span>
        {lieu.note && (
          <div className="tip">
            <p className="hand">{lieu.note}</p>
            <span className="mono tip-signature">— toi</span>
          </div>
        )}
        {(lieu.tipsCercle ?? []).map((t, i) => {
          // #22 : on exploite le critère perso du curateur (sa signature de goût)
          const crit = MEMBRES.find((m) => m.prenom === t.auteur)?.critere
          return (
            <div className="tip" key={i}>
              <p className="hand">{t.note}</p>
              <span className="mono tip-signature">
                —{' '}
                <button className="tip-auteur-lien" onClick={() => onCurateur(t.auteur)}>
                  @{t.auteur.toLowerCase()}
                </button>
                {crit && <span className="tip-critere"> · juge {crit}</span>}
              </span>
            </div>
          )
        })}
        {!lieu.note && (lieu.tipsCercle ?? []).length === 0 && (
          <p className="hand tip-vide">t'as rien dit sur ce spot. encore.</p>
        )}
      </div>

      {mien && !edition ? (
        <div className="fiche-tags">
          <span className="lbl mono">c'est pour quoi ?</span>
          <div className="rangée">
            {lieu.envies.filter((e) => e !== 'turbo').map((e) => (
              <span key={e} className="mot fige entouré">
                {e}
              </span>
            ))}
            {lieu.envies.length === 0 && (
              <span className="mono fiche-lecture-seule">pas encore renseigné</span>
            )}
          </div>
          <span className="lbl mono">avec qui ?</span>
          <div className="rangée">
            {COMPAGNIES.map((c) => (
              <span key={c} className={`mot fige ${lieu.compagnies.includes(c) ? 'entouré' : 'estompe'}`}>
                {c}
              </span>
            ))}
          </div>
          {lieu.meteo && (
            <span className="mono meteo-sens">
              {METEO_INFOS[lieu.meteo].mot} · {prixMeteo(lieu.meteo)} / pers.
              <span className="glose"> ≈ {uniteParPersonne(lieu.envies)}</span>
            </span>
          )}
          <button className="lien fiche-modifier" onClick={() => setEdition(true)}>
            modifier les infos
          </button>
        </div>
      ) : mien && edition ? (
        <div className="fiche-tags">
          <span className="lbl mono">c'est pour quoi ?</span>
          <div className="rangée">
            {ENVIES.map((e) => (
              <button
                key={e}
                className={`mot ${lieu.envies.includes(e) ? 'entouré' : ''}`}
                aria-pressed={lieu.envies.includes(e)}
                onClick={() => basculerEnvie(e)}
              >
                {e}
              </button>
            ))}
          </div>
          <span className="lbl mono">avec qui ?</span>
          <div className="rangée">
            {COMPAGNIES.map((c) => (
              <button
                key={c}
                className={`mot ${lieu.compagnies.includes(c) ? 'entouré' : ''}`}
                aria-pressed={lieu.compagnies.includes(c)}
                onClick={() => basculerCompagnie(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <CompteurHoraires
            valeur={lieu.horaires}
            onChange={(v) => enregistrer({ ...lieu, horaires: v })}
          />
          <span className="lbl mono">situation du portefeuille ?</span>
          <div className="form-meteo">
            {METEOS.map((m) => (
              <button
                key={m}
                className={`meteo-choix ${lieu.meteo === m ? 'on' : ''}`}
                aria-pressed={lieu.meteo === m}
                onClick={() => changerMeteo(m)}
                title={`${METEO_INFOS[m].mot} · ${prixMeteo(m)}`}
              >
                {m === 'soleil' ? <ISoleil taille={16} /> : m === 'pluie' ? <IPluie taille={16} /> : <INuage taille={16} />}
                <span className="meteo-prix mono">{prixMeteo(m)}</span>
              </button>
            ))}
          </div>
          <button className="valider fiche-modifier-ok" onClick={() => setEdition(false)}>
            terminé
          </button>
        </div>
      ) : (
        <div className="fiche-tags">
          <span className="lbl mono">c'est pour quoi ?</span>
          <div className="rangée">
            {lieu.envies.filter((e) => e !== 'turbo').map((e) => (
              <span key={e} className="mot fige entouré">
                {e}
              </span>
            ))}
          </div>
          <span className="lbl mono">avec qui ?</span>
          <div className="rangée">
            {COMPAGNIES.map((c) => (
              <span key={c} className={`mot fige ${lieu.compagnies.includes(c) ? 'entouré' : 'estompe'}`}>
                {c}
              </span>
            ))}
          </div>
          {dejaAdopte ? (
            <p className="mono fiche-lecture-seule">déjà sur ta carte ✓</p>
          ) : (
            <button className="valider fiche-adopter" onClick={() => onAdopter(lieu)}>
              + ajouter à ma carte
            </button>
          )}
        </div>
      )}

      <div className="fiche-actions">
        <a
          className="valider fiche-emmener"
          href={itineraire}
          target="_blank"
          rel="noreferrer"
        >
          m'y emmener
        </a>
        <button className="valider fiche-partage" onClick={partager}>
          envoie à un pote
        </button>
      </div>

      <div className="mono fiche-meta">
        {VISIBILITES.find((x) => x.v === lieu.visibilite)?.icone}{' '}
        {VISIBILITES.find((x) => x.v === lieu.visibilite)?.label} · capturé le{' '}
        {new Date(lieu.creeLe).toLocaleDateString('fr-FR')}
      </div>
    </div>
  )
}

interface Suggestion {
  nom: string
  adresse: string
  lat: number
  lng: number
}

// #8 : le kit photos — 2-3 tirages PAR catégorie (le lieu · ton verre · les wc).
// on assume la signature jeudi : les WC sont le détail qui dit la vérité.
const CATS_PHOTO = [
  { type: 'lieu', label: 'le lieu' },
  { type: 'plat', label: 'ton verre' },
  { type: 'wc', label: 'les wc' },
] as const
const MAX_PAR_CAT = 3

function KitPhotos({
  photos,
  setPhotos,
  propreteWc,
  setPropreteWc,
}: {
  photos: PhotoLieu[]
  setPhotos: React.Dispatch<React.SetStateAction<PhotoLieu[]>>
  /** #22 : la propreté des wc — le seul score autorisé (optionnel) */
  propreteWc?: 1 | 2 | 3
  setPropreteWc?: (n: 1 | 2 | 3) => void
}) {
  const ajouter =
    (type: PhotoLieu['type']) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      e.target.value = '' // reprendre la même catégorie est possible
      if (!f) return
      setPhotos((prev) =>
        prev.filter((p) => p.type === type).length >= MAX_PAR_CAT
          ? prev
          : [...prev, { type, blob: f }],
      )
    }
  const retirer = (cible: PhotoLieu) => setPhotos((prev) => prev.filter((p) => p !== cible))

  return (
    <div className="photos-kit">
      {CATS_PHOTO.map(({ type, label }) => {
        const prises = photos.filter((p) => p.type === type)
        return (
          <div key={type} className={`photo-cat ${type === 'wc' ? 'photo-cat-wc' : ''}`}>
            <span className="mono photo-cat-lbl">
              {label} <span className="photo-cat-n">{prises.length}/{MAX_PAR_CAT}</span>
            </span>
            {type === 'wc' && setPropreteWc && (
              <div className="photo-wc-note mono">
                propreté&nbsp;:
                {([1, 2, 3] as const).map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={`photo-wc-dot ${propreteWc && propreteWc >= n ? 'on' : ''}`}
                    aria-label={`propreté ${n}/3`}
                    aria-pressed={propreteWc === n}
                    onClick={() => setPropreteWc(n)}
                  >
                    {propreteWc && propreteWc >= n ? '●' : '○'}
                  </button>
                ))}
              </div>
            )}
            <div className="photo-cat-vignettes">
              {prises.map((p, i) => (
                <button
                  type="button"
                  key={i}
                  className="photo-vignette"
                  onClick={() => retirer(p)}
                  title="retirer"
                >
                  <img src={srcPhoto(p)} alt={label} />
                  <span className="photo-vignette-x">✕</span>
                </button>
              ))}
              {prises.length < MAX_PAR_CAT && (
                <label className="photo-ajout">
                  <IAppareil taille={15} />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    hidden
                    onChange={ajouter(type)}
                  />
                </label>
              )}
            </div>
          </div>
        )
      })}
      <p className="mono photo-wc-pousse">les wc, c'est la vérité. mets-en 2-3.</p>
    </div>
  )
}

function FormAjout({ onFini, onAnnule }: { onFini: () => void; onAnnule: () => void }) {
  const [nom, setNom] = useState('')
  const [note, setNote] = useState('')
  const [visibilite, setVisibilite] = useState<Visibilite>('prive')
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [geoEtat, setGeoEtat] = useState<'attente' | 'ok' | 'refus'>('attente')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [recherche, setRecherche] = useState<'off' | 'cours' | 'vide'>('off')
  const [adresseChoisie, setAdresseChoisie] = useState<string | null>(null)
  const [photos, setPhotos] = useState<PhotoLieu[]>([])
  const [propreteWcV, setPropreteWcV] = useState<1 | 2 | 3 | undefined>(undefined)
  // l'enrichissement (optionnel) : ce qui nourrit les fiches
  const [envies, setEnvies] = useState<string[]>([])
  const [compagnies, setCompagnies] = useState<string[]>([])
  const [meteo, setMeteo] = useState<Meteo | undefined>(undefined)
  const [horaires, setHoraires] = useState<[number | null, number | null] | undefined>(undefined)
  // import Google Takeout
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const importerFichier = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImportMsg('lecture…')
    try {
      const json = JSON.parse(await f.text())
      const n = await importerTakeout(json)
      if (n === 0) {
        setImportMsg('aucun nouveau lieu (déjà importés ?).')
      } else {
        setImportMsg(`${n} lieux importés.`)
        setTimeout(onFini, 900)
      }
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : 'fichier illisible.')
    }
  }

  const bascule = (set: typeof setEnvies, t: string) =>
    set((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))


  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPosition({ lat: p.coords.latitude, lng: p.coords.longitude })
        setGeoEtat('ok')
      },
      () => setGeoEtat('refus'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [])

  // recherche d'adresse (Nominatim/OSM) — debounce 600ms, identifié (politique d'usage)
  useEffect(() => {
    if (nom.trim().length < 3 || adresseChoisie) {
      setSuggestions([])
      setRecherche('off')
      return
    }
    setRecherche('cours')
    const t = setTimeout(async () => {
      try {
        const biais = position
          ? `&viewbox=${position.lng - 0.1},${position.lat + 0.1},${position.lng + 0.1},${position.lat - 0.1}`
          : ''
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(nom)}&format=json&limit=4&countrycodes=fr&email=contact@ersanmusa.com${biais}`,
          { headers: { 'Accept-Language': 'fr' } },
        )
        const data = await r.json()
        const s = data.map((d: { display_name: string; lat: string; lon: string; name?: string }) => ({
          nom: d.name || d.display_name.split(',')[0],
          adresse: d.display_name.split(',').slice(0, 3).join(','),
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
        }))
        setSuggestions(s)
        setRecherche(s.length === 0 ? 'vide' : 'off')
      } catch {
        setSuggestions([])
        setRecherche('off')
      }
    }, 600)
    return () => clearTimeout(t)
  }, [nom, adresseChoisie, position])

  const choisir = (s: Suggestion) => {
    setNom(s.nom)
    setPosition({ lat: s.lat, lng: s.lng })
    setAdresseChoisie(s.adresse)
    setSuggestions([])
    setGeoEtat('ok')
  }

  const enregistrer = async () => {
    if (!nom.trim()) return
    await ajouterLieu({
      id: nouvelId(),
      nom: nom.trim(),
      lat: position?.lat ?? 0,
      lng: position?.lng ?? 0,
      adresse: adresseChoisie ?? undefined,
      note: note.trim(),
      visibilite,
      envies: envies as Lieu['envies'],
      compagnies: compagnies as Lieu['compagnies'],
      meteo,
      horaires,
      photos,
      propreteWc: propreteWcV,
      statut: 'actif',
      creeLe: new Date().toISOString(),
      source: adresseChoisie ? 'manuel' : position ? 'rue' : 'manuel',
    })
    onFini()
  }

  return (
    <div className="form">
      <div className="mono geo">
        {adresseChoisie
          ? adresseChoisie
          : geoEtat === 'attente'
            ? 'on te localise…'
            : geoEtat === 'ok'
              ? `${position!.lat.toFixed(4)}, ${position!.lng.toFixed(4)} — ou tape une adresse`
              : "pas de géoloc — tape le nom ou l'adresse."}
      </div>
      <input
        autoFocus
        placeholder="le nom du spot, ou son adresse"
        value={nom}
        onChange={(e) => {
          setNom(e.target.value)
          setAdresseChoisie(null)
        }}
      />
      {recherche === 'cours' && <span className="mono geo">recherche…</span>}
      {recherche === 'vide' && <span className="mono geo">rien trouvé par là.</span>}
      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button onClick={() => choisir(s)}>
                <span className="sugg-nom">{s.nom}</span>
                <span className="mono sugg-adresse">{s.adresse}</span>
              </button>
            </li>
          ))}
          <li>
            <button className="lien" onClick={() => setSuggestions([])}>
              fermer
            </button>
          </li>
        </ul>
      )}
      <textarea
        placeholder="ton tip — table du fond, évite le vendredi…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
      />
      <KitPhotos
        photos={photos}
        setPhotos={setPhotos}
        propreteWc={propreteWcV}
        setPropreteWc={setPropreteWcV}
      />
      <p className="mono form-section">le détail (optionnel, mais ça aide)</p>
      <div className="rangée">
        <span className="lbl mono">
          pour quoi faire ?
          {envies.length > 0 && (
            <span className="glose-inline">— {gloseEnvie(envies[envies.length - 1])}</span>
          )}
        </span>
        {ENVIES.map((t) => (
          <button
            key={t}
            className={`mot ${envies.includes(t) ? 'entouré' : ''}`}
            aria-pressed={envies.includes(t)}
            onClick={() => bascule(setEnvies, t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="rangée">
        <span className="lbl mono">avec qui ?</span>
        {COMPAGNIES.map((t) => (
          <button
            key={t}
            className={`mot ${compagnies.includes(t) ? 'entouré' : ''}`}
            aria-pressed={compagnies.includes(t)}
            onClick={() => bascule(setCompagnies, t)}
          >
            {t}
          </button>
        ))}
      </div>
      <CompteurHoraires valeur={horaires} onChange={setHoraires} />
      <span className="lbl mono">situation du portefeuille ?</span>
      <div className="form-meteo">
        {METEOS.map((m) => (
          <button
            key={m}
            className={`meteo-choix ${meteo === m ? 'on' : ''}`}
            aria-pressed={meteo === m}
            onClick={() => setMeteo((cur) => (cur === m ? undefined : m))}
            title={`${METEO_INFOS[m].mot} · ${prixMeteo(m)}`}
          >
            {m === 'soleil' ? <ISoleil taille={16} /> : m === 'pluie' ? <IPluie taille={16} /> : <INuage taille={16} />}
            <span className="meteo-prix mono">{prixMeteo(m)}</span>
          </button>
        ))}
      </div>
      {meteo && (
        <span className="mono meteo-sens">
          {METEO_INFOS[meteo].mot} · {prixMeteo(meteo)} / pers.
          <span className="glose"> ≈ {uniteParPersonne(envies)}</span>
        </span>
      )}
      <div className="visi">
        {VISIBILITES.map(({ v, icone, label }) => (
          <button
            key={v}
            className={`visi-choix ${visibilite === v ? 'choisi' : ''}`}
            aria-pressed={visibilite === v}
            onClick={() => setVisibilite(v)}
          >
            {icone} {label}
          </button>
        ))}
      </div>
      <div className="form-import">
        <label className="lien">
          importer mes lieux Google (Takeout .json)
          <input
            type="file"
            accept=".json,application/json"
            hidden
            onChange={importerFichier}
          />
        </label>
        {importMsg && <span className="mono form-import-msg">{importMsg}</span>}
      </div>
      <div className="form-actions">
        <button className="lien" onClick={onAnnule}>
          laisse tomber
        </button>
        <button className="valider" onClick={enregistrer} disabled={!nom.trim()}>
          c'est dit.
        </button>
      </div>
    </div>
  )
}
