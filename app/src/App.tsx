import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense, type ComponentProps } from 'react'
import { libelleTrajet } from './rayon'
import LigneIndex from './LigneIndex'
import Splash from './Splash'
import Auth from './Auth'
import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'
import { importerSeed } from './seed'
import { jalonner, jalonnerVue } from './jalon'
import { t, lireLangue, basculerLangue } from './langue'
import { lireATester, basculerATester, estATester, type MarqueATester } from './aTester'
import { suivre } from './analytique'
// le générateur de cartes 1080×1920 ne sert qu'au moment du partage : on va
// le chercher sur le clic, pas au démarrage (voir les deux appels plus bas)
import { srcPhoto, photoIndisponible } from './photos'
import { ICadenas, ICercle, IGlobe, IEtincelle, ICarnet, ILoupe, IAppareil, ISoleil, INuage, IPluie, ITampon, IBallon, IRefuge, ICloche, IAnneau, ISceau, ICrayon } from './icones'
import { fusionnerPhotos } from './tirage'
import { typeDeLieu, labelTypeLieu, cuisineDeLieu } from './typesLieu'
import BandeauMatch from './BandeauMatch'
import { lireSortieActive, ajouterCandidat, type MatchOuvert } from './sortieGroupe'
// le grand jeudi n'est pas une option : le 1ᵉʳ jeudi du mois, la date décide
import { estCeLeGrandJeudi } from './grandJeudi'
import {
  mesCriteres,
  ajouterCritere,
  supprimerCritere,
  apercuCritere,
  type TypeCritere,
} from './criteres'
// LE critère du membre (son obsession, singulier) — ≠ criteres.ts ci-dessus
// (une liste de dimensions de jugement) et ≠ Lieu.criterePerso (le verdict
// sur un lieu). Voir critereMembre.ts pour la distinction complète.
import { normaliserCritere, CRITERE_MAX } from './critereMembre'
import {
  lesProches,
  basculerProche,
  CAP_PROCHES,
  fusionnerCercle,
  prenomDe,
} from './cercle'
import { rechercher, profilDeGout } from './recherche'
// le tuto « notes en marge » : le carnet prêté, ses notes qui s'effacent
import NoteMarge from './NoteMarge'
import { effacerNote, toutRelire } from './tuto'
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
  mesLieuxArchives,
  chargerMonId,
  ajouterLieu,
  archiverLieu,
  desarchiverLieu,
  supprimerLieu,
  majLieu,
  estAMoi,
  CURATEUR_JEUDI,
  NOM_JEUDI,
  normaliserTypePhoto,
  spotComplet,
  adopterLieu,
  // les tips réels (table `tips`) : la voix qu'on pose sur le spot d'un autre
  ecrireTip,
  monTipDans,
  estUuid,
  lireCouleur,
  appliquerCouleur,
  ecrireCouleur,
  lireSeuils,
  ecrireSeuils,
  lireVitesse,
  ecrireVitesse,
  villeDeCoords,
  lireVus,
  ecrireVus,
  onboardingFait,
  marquerOnboarding,
  compteDejaInstalle,
  remonterMesPhotos,
  reinitOnboarding,
  lireTagline,
  ecrireTagline,
  signalerLieu,
  signalerCible,
  bloquerMembre,
  debloquerMembre,
  listeBloques,
  type MembreBloque,
  ajouterBof,
  viderSorties,
  effacerTout,
  definirMaPosition,
  importGoogleFait,
  doitRelancerImport,
  marquerRelanceImport,
  distanceM,
  formatDistance,
  etatHoraire,
  propreteWcLabel,
  adresseLisible,
  reverseAdresse,
  lireComparer,
  basculerComparer,
  ecrireComparer,
  viderComparer,
  lireFavoris,
  basculerFavoriLieu,
  // la rayure (0015) : le serment, son repentir, et le balayage du jeudi
  lireRayures,
  rayerLieu,
  deRayerLieu,
  balayerRayures,
  ageDepuis,
  nouvelId,
  sortiesEnAttente,
  retirerSortie,
  lireProfil,
  sauverProfil,
  supprimerMonCompte,
  exporterMesDonnees,
  // le cercle réel (étape 5) — les vraies relations remplacent la simulation
  type DemandeRecue,
  type MembreCercle,
  demandesRecues,
  accepterDemande as accepterDemandeCloud,
  refuserDemande as refuserDemandeCloud,
  monCercle,
  retirerDuCercle,
  lienInvitation,
  capterInvite,
  traiterInviteAttente,
  estClip,
  seDeconnecter,
  lireCompteConnecte,
  lireSuivis,
  lireAmisArchives,
  basculerAmiArchive,
  lireVuesPellicule,
  chargerVuesPellicule,
  marquerVuPellicule,
} from './db'
import type { CompteConnecte } from './db'
// le push (0020) : l'interrupteur « me prévenir » du centre de notifications
import { etatPush, activerPush, couperPush, conseilIphone, type EtatPush } from './push'
// « nouvelle version » : l'état retenu (course du boot — voir majApp.ts)
import { majEnAttente } from './majApp'
import {
  commentRentrer,
  DEBUT_NOCTILIEN,
  FIN_NOCTILIEN,
  type CommentRentrer,
} from './rentrer'
import { MONUMENTS } from './monuments'
import {
  lireStickers,
  revoquerStickers,
  poserSticker,
  retirerSticker,
} from './mesMonuments'
import { anniversairesAVenir, motAnniversaire } from './fetes'
import {
  construireTas,
  taillePolaroid,
  libelleAge,
  estVu,
  estSouvenir,
  enDeveloppement,
  construireCarnet,
  parNuits,
  tipDeLaSoiree,
  inviteAMontrer,
  lireJourInvite,
  noterInviteVue,
  DUREE_INVITE_MS,
  type TasAffiche,
  type SoireePellicule,
  type NuitAffichee,
} from './pellicule'

// ── CE QUI N'EST PAS LE PREMIER ÉCRAN ATTEND SON TOUR ────────────
// Le boot ne montre que trois choses : le splash, le mur d'auth, et l'onglet
// « ma carte ». Tout le reste — les autres onglets, l'onboarding du premier
// jour, les feuillets qu'on ouvre d'un geste — descend à la demande. Le
// service worker les précache dans la foulée : au deuxième lancement, ils
// sont déjà là.

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
// le carrousel de la pellicule ne s'ouvre qu'au tap sur un tas — chargé à la demande
const PelliculeLazy = lazy(() => import('./CarrouselPellicule'))
function Pellicule(p: ComponentProps<typeof PelliculeLazy>) {
  return (
    <Suspense fallback={null}>
      <PelliculeLazy {...p} />
    </Suspense>
  )
}
// le projecteur super 8 ne s'ouvre qu'au tap sur un clip — chargé à la demande
const ProjecteurLazy = lazy(() => import('./Projecteur'))
function Projecteur(p: ComponentProps<typeof ProjecteurLazy>) {
  return (
    <Suspense fallback={null}>
      <ProjecteurLazy {...p} />
    </Suspense>
  )
}
// le picker de couleur ne s'ouvre qu'au dépli du réglage — chargé à la demande
const PickerCouleurLazy = lazy(() => import('./PickerCouleur'))
function PickerCouleur(p: ComponentProps<typeof PickerCouleurLazy>) {
  return (
    <Suspense fallback={null}>
      <PickerCouleurLazy {...p} />
    </Suspense>
  )
}
// l'import Google/liste ne sert qu'à l'onboarding et aux réglages — chargé à la demande
const ImportGoogleLazy = lazy(() => import('./ImportGoogle'))
function ImportGoogle(p: ComponentProps<typeof ImportGoogleLazy>) {
  return (
    <Suspense fallback={null}>
      <ImportGoogleLazy {...p} />
    </Suspense>
  )
}
const ImportListeLazy = lazy(() => import('./ImportListe'))
function ImportListe(p: ComponentProps<typeof ImportListeLazy>) {
  return (
    <Suspense fallback={null}>
      <ImportListeLazy {...p} />
    </Suspense>
  )
}
// la troisième voie de l'écran d'ajout : une entrée écrite à la main
const AjoutMainLazy = lazy(() => import('./AjoutMain'))
function AjoutMain(p: ComponentProps<typeof AjoutMainLazy>) {
  return (
    <Suspense fallback={null}>
      <AjoutMainLazy {...p} />
    </Suspense>
  )
}
// corriger une entrée : un geste rare, sur un spot à moi — chargé à la demande
const CorrigerLieuLazy = lazy(() => import('./CorrigerLieu'))
function CorrigerLieu(p: ComponentProps<typeof CorrigerLieuLazy>) {
  return (
    <Suspense fallback={null}>
      <CorrigerLieuLazy {...p} />
    </Suspense>
  )
}
// « ce soir » — le rituel du soir, mais PAS l'onglet d'accueil (c'est « ma
// carte » qui ouvre le carnet). On l'appelle au premier tap sur l'onglet.
const CeSoirLazy = lazy(() => import('./CeSoir'))
function CeSoir(p: ComponentProps<typeof CeSoirLazy>) {
  return (
    <Suspense fallback={null}>
      <CeSoirLazy {...p} />
    </Suspense>
  )
}
// « trouver » : l'écran de recherche, un autre onglet — chargé à la demande
const RechercheLazy = lazy(() => import('./EcranRecherche'))
function Recherche(p: ComponentProps<typeof RechercheLazy>) {
  return (
    <Suspense fallback={null}>
      <RechercheLazy {...p} />
    </Suspense>
  )
}
// le match de groupe : ouvert depuis « on dit où. » ou depuis le cercle
const GroupeLazy = lazy(() => import('./EcranGroupe'))
function Groupe(p: ComponentProps<typeof GroupeLazy>) {
  return (
    <Suspense fallback={null}>
      <GroupeLazy {...p} />
    </Suspense>
  )
}
// le grand jeudi : un rendez-vous par mois — inutile de le porter les 30 autres jours
const GrandJeudiLazy = lazy(() => import('./EcranGrandJeudi'))
function GrandJeudi(p: ComponentProps<typeof GrandJeudiLazy>) {
  return (
    <Suspense fallback={null}>
      <GrandJeudiLazy {...p} />
    </Suspense>
  )
}
// le carnet du cercle : l'onglet « cercle », jamais le premier écran
const CarnetCercleLazy = lazy(() => import('./CarnetCercle'))
function CarnetCercle(p: ComponentProps<typeof CarnetCercleLazy>) {
  return (
    <Suspense fallback={null}>
      <CarnetCercleLazy {...p} />
    </Suspense>
  )
}
// chercher des amis : un geste volontaire, dans le cercle
const ChercherAmisLazy = lazy(() => import('./ChercherAmis'))
function ChercherAmis(p: ComponentProps<typeof ChercherAmisLazy>) {
  return (
    <Suspense fallback={null}>
      <ChercherAmisLazy {...p} />
    </Suspense>
  )
}
// « et le tirage ? » — le feuillet qui suit le verdict, ouvert d'un geste
const TirageDuSoirLazy = lazy(() => import('./TirageDuSoir'))
function TirageDuSoir(p: ComponentProps<typeof TirageDuSoirLazy>) {
  return (
    <Suspense fallback={null}>
      <TirageDuSoirLazy {...p} />
    </Suspense>
  )
}
// l'onboarding ne se joue qu'au tout premier lancement. Le repli reprend le
// tampon qui respire de l'attente d'auth : la même page continue de tourner,
// on ne troue pas l'écran entre le splash et la première question.
const OnboardingLazy = lazy(() => import('./Onboarding'))
function Onboarding(p: ComponentProps<typeof OnboardingLazy>) {
  return (
    <Suspense
      fallback={
        <div className="attente-auth" aria-busy="true" aria-label="chargement">
          <div className="tampon-logo attente-auth-logo">Jeudi.</div>
        </div>
      }
    >
      <OnboardingLazy {...p} />
    </Suspense>
  )
}

const VISIBILITES: { v: Visibilite; icone: React.ReactNode; label: string }[] = [
  { v: 'prive', icone: <ICadenas taille={15} />, label: 'pour moi' },
  { v: 'cercle', icone: <ICercle taille={15} />, label: 'cercle' },
  { v: 'public', icone: <IGlobe taille={15} />, label: 'public' },
]

// la nav respire : 5 onglets explicites, le labo est mort. « trouver » est
// l'ex-recherche du labo promue à part entière ; le match de groupe vit dans
// « le cercle » ; le grand jeudi n'est plus un onglet, c'est un rendez-vous.
type Onglet = 'cesoir' | 'trouver' | 'macarte' | 'cercle' | 'profil'

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

  // au démontage : on nettoie le timer de snap (sinon il tire sur une molette morte)
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

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
// ── helpers d'affichage du profil = la page de garde du carnet (V5 §7) ──
// un titre de section : un filet graphite + le mot en crayonné, zéro boîte
function TitreSection({ children }: { children: React.ReactNode }) {
  return <div className="profil-section-titre mono">{children}</div>
}
// une stat de la page de garde : mono tabulaire, sur LA ligne des stats
function StatProfil({ n, l, onClick }: { n: React.ReactNode; l: string; onClick?: () => void }) {
  return (
    <button className={`profil-stat mono ${onClick ? 'tape' : ''}`} onClick={onClick}>
      <span className="profil-stat-n">{n}</span> {l}
    </button>
  )
}

function Reglages({
  lieux,
  cercle,
  demandes,
  sorties,
  amisArchives,
  onBasculerAmi,
  onRestaurer,
  onVoir,
  onGrandJeudi,
}: {
  lieux: Lieu[]
  /** le cercle réel COMPLET (archivés compris — c'est ici qu'on les gère) */
  cercle: MembreCercle[]
  demandes: DemandeRecue[]
  sorties: SortieEnAttente[]
  amisArchives: string[]
  onBasculerAmi: (id: string) => void
  onRestaurer: (l: Lieu) => void
  onVoir: (l: Lieu) => void
  onGrandJeudi: () => void
}) {
  const [couleur, setCouleur] = useState(() => lireCouleur())
  const [s1, setS1] = useState(() => String(lireSeuils()[0]))
  const [s2, setS2] = useState(() => String(lireSeuils()[1]))
  const [ouTu, setOuTu] = useState('')
  useEffect(() => {
    villeDeCoords().then(setOuTu)
  }, [])
  // sous quel compte suis-je entré ? (deux comptes peuvent porter le même prénom)
  const [compte, setCompte] = useState<CompteConnecte | null>(null)
  useEffect(() => {
    void lireCompteConnecte().then(setCompte)
  }, [])
  const [sauve, setSauve] = useState(false)
  const [confirmEffacer, setConfirmEffacer] = useState(false)
  // RGPD : suppression du compte (double confirmation) + erreur visible si le cloud refuse
  const [confirmCompte, setConfirmCompte] = useState(false)
  const [compteEnCours, setCompteEnCours] = useState(false)
  const [erreurCompte, setErreurCompte] = useState<string | null>(null)
  // remonter les photos restées locales (bucket absent avant le 07/08)
  const [remonte, setRemonte] = useState<null | 'en cours' | { spots: number; photos: number }>(null)
  const remonter = async () => {
    if (remonte === 'en cours') return
    setRemonte('en cours')
    setRemonte(await remonterMesPhotos())
  }
  const [ouvert, setOuvert] = useState<
    | 'ville'
    | 'couleur'
    | 'argent'
    | 'marche'
    | 'donnees'
    | 'notifs'
    | 'archives'
    | 'bloques'
    | 'amis'
    | 'listes'
    | 'monuments'
    | 'bientot'
    | null
  >(null)
  // LE TIROIR DES SPOTS RANGÉS (10/08) — lu à la demande, pas dans la liste
  // principale. null = pas encore lu (on affiche « on ouvre le tiroir… »).
  const [archives, setArchives] = useState<Lieu[] | null>(null)
  useEffect(() => {
    if (ouvert !== 'archives') return
    let vivant = true
    void mesLieuxArchives().then((l) => {
      if (vivant) setArchives(l)
    })
    return () => {
      vivant = false
    }
  }, [ouvert])

  // LES BLOQUÉS (0019) — lus à l'ouverture de la section, comme les archives.
  // Se dédire doit être aussi facile que bloquer (ligne du chantier).
  const [bloques, setBloques] = useState<MembreBloque[] | null>(null)
  const [erreurBloques, setErreurBloques] = useState<string | null>(null)
  useEffect(() => {
    if (ouvert !== 'bloques') return
    let vivant = true
    void listeBloques().then((b) => {
      if (vivant) setBloques(b)
    })
    return () => {
      vivant = false
    }
  }, [ouvert])
  const debloquer = async (id: string) => {
    setErreurBloques(null)
    try {
      await debloquerMembre(id)
    } catch (e) {
      setErreurBloques((e as Error).message)
      return
    }
    setBloques((b) => b?.filter((x) => x.id !== id) ?? null)
  }

  // MES MONUMENTS (10/08) : ta photo à la place de la gravure, sur TA carte.
  // Strictement local — rien ne monte au cloud, personne d'autre ne le voit.
  const [stickers, setStickers] = useState<Map<string, string>>(new Map())
  const rechargerStickers = () => {
    void lireStickers().then((m) => {
      setStickers((avant) => {
        revoquerStickers(avant.values()) // les anciennes URL ne servent plus
        return m
      })
    })
  }
  useEffect(() => {
    rechargerStickers()
  }, [])
  // un fichier qui ne se décode pas (format exotique, corrompu) doit le DIRE :
  // avant, le geste échouait en silence (relecture 12/08)
  const [stickerRate, setStickerRate] = useState<string | null>(null)
  const choisirSticker = async (nom: string, f: File | undefined) => {
    if (!f) return
    setStickerRate(null)
    if (await poserSticker(nom, f)) rechargerStickers()
    else setStickerRate(nom)
  }
  // ton pas : la vitesse derrière tous les « X min à pied » de l'app
  const [vitesse, setVitesse] = useState(() => lireVitesse())
  const choisirVitesse = (v: number) => {
    setVitesse(v)
    ecrireVitesse(v)
    flash()
  }
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
  // RGPD : portabilité — tout ce que jeudi sait de toi, en un .json daté
  const exporterDonnees = async () => {
    const donnees = await exporterMesDonnees()
    const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `jeudi-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  // RGPD : le droit à l'oubli — deux taps (le premier arme, le second confirme)
  const supprimerCompte = async () => {
    if (compteEnCours) return
    setCompteEnCours(true)
    setErreurCompte(null)
    try {
      await supprimerMonCompte()
      window.location.reload()
    } catch {
      setErreurCompte(t('le cloud a refusé. rien n’a bougé — réessaie dans un instant.'))
      setConfirmCompte(false)
      setCompteEnCours(false)
    }
  }
  // effacer : on vide tout le local (clés jeudi-* + la base IndexedDB) puis reload
  // (effacerTout est async désormais : on ATTEND avant de recharger)
  const effacer = async () => {
    await effacerTout()
    window.location.reload()
  }

  return (
    <div className="reglages">
      <div className="reglages-tete">
        <span className="lbl mono">{t('tes réglages')}</span>
        <span className={`mono reglages-sauve ${sauve ? 'on' : ''}`}>{t('enregistré ✓')}</span>
      </div>

      {/* la note en marge de « j. » : les réglages différés se découvrent ici */}
      <NoteMarge id="reglages-differes" className="note-marge-reglages" />

      {/* LA COUCHE LÉGALE — toujours à portée (RGPD : info accessible) */}
      <a
        className="mono reglages-section reglages-toggle"
        href="/confidentialite.html"
        target="_blank"
        rel="noreferrer"
        style={{ textDecoration: 'none', display: 'flex' }}
      >
        {t('confidentialité & conditions')}
        <span className="reglages-chevron">↗</span>
      </a>

      {/* LA LANGUE — fr/en, bascule + rechargement (langue.ts) */}
      <button className="mono reglages-section reglages-toggle" onClick={basculerLangue}>
        {lireLangue() === 'fr' ? 'langue · français' : 'language · english'}
        <span className="reglages-chevron">{lireLangue() === 'fr' ? 'EN' : 'FR'}</span>
      </button>

      {/* FORCER LA MISE À JOUR — le filet quand l'app s'entête à resservir une
          vieille version (surtout sur iOS depuis l'écran d'accueil). Vide le
          cache des FICHIERS et recharge ; tes lieux et tes réglages ne bougent
          pas (cf. le détail dans main.tsx). */}
      <button
        className="mono reglages-section reglages-toggle"
        onClick={() => window.dispatchEvent(new Event('jeudi:forcer-maj'))}
        title={t('vide le cache des fichiers — tes lieux ne bougent pas')}
      >
        {t('forcer la mise à jour')}
        <span className="reglages-chevron">↻</span>
      </button>

      {/* OÙ TU ES (location-native : le centre suit ton GPS) */}
      <button
        className="mono reglages-section reglages-toggle"
        aria-expanded={ouvert === 'ville'}
        onClick={() => bascule('ville')}
      >
        {t('où tu es')} · {ouTu || '…'}
        <span className="reglages-chevron">{ouvert === 'ville' ? '–' : '+'}</span>
      </button>
      {ouvert === 'ville' && (
        <div className="reglages-villes mono">
          <p className="reglages-ville-actuelle">
            {ouTu ? (
              <>
                {t('tu es à')} <strong>{ouTu}</strong>.
              </>
            ) : (
              <>{t('on cherche où tu es…')}</>
            )}
          </p>
          <p className="reglages-ville-bientot">
            {t(
              "jeudi te suit partout — les distances se calculent depuis ta position. autorise le GPS pour qu'elles soient justes (sinon : Place Vendôme).",
            )}
          </p>
        </div>
      )}

      {/* TA COULEUR */}
      <button
        className="mono reglages-section reglages-toggle"
        aria-expanded={ouvert === 'couleur'}
        onClick={() => bascule('couleur')}
      >
        {t('ta couleur de Jeudi')}
        <span className="reglages-chevron">{ouvert === 'couleur' ? '–' : '+'}</span>
      </button>
      {ouvert === 'couleur' && <PickerCouleur valeur={couleur} onChange={choisirCouleur} />}

      {/* TON PORTE-MONNAIE */}
      <button
        className="mono reglages-section reglages-toggle"
        aria-expanded={ouvert === 'argent'}
        onClick={() => bascule('argent')}
      >
        {t('ton porte-monnaie (€ / pers.)')}
        <span className="reglages-chevron">{ouvert === 'argent' ? '–' : '+'}</span>
      </button>
      {ouvert === 'argent' && (
        <div className="reglages-seuils mono">
          <label>
            {t('ça coûte rien <')}
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
            {t('on flambe >')}
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

      {/* TON PAS — la vitesse derrière tous les « X min à pied » */}
      <button
        className="mono reglages-section reglages-toggle"
        aria-expanded={ouvert === 'marche'}
        onClick={() => bascule('marche')}
      >
        {t('ton pas')}
        <span className="reglages-chevron">{ouvert === 'marche' ? '–' : '+'}</span>
      </button>
      {ouvert === 'marche' && (
        <div className="reglages-seuils reglages-pas mono">
          {(
            [
              { v: 60, mot: 'flâneur' },
              { v: 80, mot: 'normal' },
              { v: 100, mot: 'pressé' },
            ] as const
          ).map(({ v, mot }) => (
            <button
              key={v}
              className={`visi-choix ${vitesse === v ? 'choisi' : ''}`}
              aria-pressed={vitesse === v}
              onClick={() => choisirVitesse(v)}
            >
              {t(mot)}
            </button>
          ))}
          <label className="reglages-pas-libre">
            {t('ou précis :')}
            <input
              className="onboard-euro"
              type="number"
              inputMode="numeric"
              min={40}
              max={140}
              value={vitesse}
              onChange={(e) => {
                const v = Number(e.target.value)
                setVitesse(v)
                if (v >= 40 && v <= 140) ecrireVitesse(v)
              }}
            />
            m/min
          </label>
          <p className="reglages-pas-note">
            {t('c’est le pas derrière tous les « min à pied » de l’app.')}{' '}
            {(lireVitesse() * 0.06).toFixed(1).replace('.', ',')} km/h
          </p>
        </div>
      )}

      {/* MES DONNÉES */}
      <button
        className="mono reglages-section reglages-toggle"
        aria-expanded={ouvert === 'donnees'}
        onClick={() => bascule('donnees')}
      >
        {t('mes données')}
        <span className="reglages-chevron">{ouvert === 'donnees' ? '–' : '+'}</span>
      </button>
      {ouvert === 'donnees' && (
        <div className="reglages-donnees mono">
          <button className="reglages-action" onClick={exporter}>
            {t('exporter mes spots (.json)')}
          </button>
          <button className="reglages-action" onClick={exporterDonnees}>
            {t('exporter mes données (.json)')}
          </button>
          {/* REMONTER LES PHOTOS (09/08) — le bucket n'existait pas avant le
              07/08 : tout ce qui a été pris avant est resté sur CET appareil.
              À lancer depuis celui qui les détient, pas d'un téléphone neuf. */}
          <button className="reglages-action" disabled={remonte === 'en cours'} onClick={remonter}>
            {remonte === 'en cours' ? t('on remonte…') : t('remonter mes photos locales')}
          </button>
          {remonte !== null && remonte !== 'en cours' && (
            <p className="reglages-compte-note">
              {remonte.spots === 0
                ? t('rien à remonter : tout est déjà en ligne.')
                : `${remonte.photos} ${t('photos remontées, sur')} ${remonte.spots} ${t('spots.')}`}
            </p>
          )}
          <button
            className={`reglages-action danger ${confirmEffacer ? 'confirm' : ''}`}
            onClick={() => (confirmEffacer ? effacer() : setConfirmEffacer(true))}
          >
            {confirmEffacer ? t('sûr ? tout effacer pour de bon') : t('effacer mes données locales')}
          </button>
          <button
            className={`reglages-action danger ${confirmCompte ? 'confirm' : ''}`}
            disabled={compteEnCours}
            onClick={() => (confirmCompte ? supprimerCompte() : setConfirmCompte(true))}
          >
            {compteEnCours
              ? t('suppression…')
              : confirmCompte
                ? t('sûr ? tout part : le cloud aussi.')
                : t('supprimer mon compte')}
          </button>
          {erreurCompte && <p className="reglages-erreur mono">{erreurCompte}</p>}
        </div>
      )}

      {/* NOTIFICATIONS — le centre in-app (07/08) : ce que la cloche sait,
          plus les anniversaires du cercle. Le push web reste « bientôt ». */}
      <button
        className="mono reglages-section reglages-toggle"
        aria-expanded={ouvert === 'notifs'}
        onClick={() => bascule('notifs')}
      >
        {t('notifications')}
        {sorties.length + demandes.length > 0 && (
          <span className="reglages-compteur mono">{sorties.length + demandes.length}</span>
        )}
        <span className="reglages-chevron">{ouvert === 'notifs' ? '–' : '+'}</span>
      </button>
      {ouvert === 'notifs' && (
        <div className="reglages-liste">
          {sorties.map((s) => (
            <span key={`${s.lieuId}-${s.date}`} className="reglages-item mono">
              {s.nom} — {t('la sortie attend ton verdict.')}
            </span>
          ))}
          {demandes.map((d) => (
            <span key={d.deId} className="reglages-item mono">
              @{d.prenom.toLowerCase()} {t('veut rejoindre ton cercle (onglet cercle).')}
            </span>
          ))}
          {anniversairesAVenir(cercle, new Date()).map((a) => (
            <span key={`anniv-${a.prenom}`} className="reglages-item mono anniv">
              {motAnniversaire(a)}
            </span>
          ))}
          {sorties.length + demandes.length === 0 &&
            anniversairesAVenir(cercle, new Date()).length === 0 && (
              <span className="reglages-item mono estompe">
                {t('rien à signaler — la cloche est calme.')}
              </span>
            )}
        </div>
      )}

      {/* SPOTS ARCHIVÉS — voir + restaurer (07/08) */}
      <button
        className="mono reglages-section reglages-toggle"
        aria-expanded={ouvert === 'archives'}
        onClick={() => bascule('archives')}
      >
        {t('spots archivés')}
        <span className="reglages-chevron">{ouvert === 'archives' ? '–' : '+'}</span>
      </button>
      {ouvert === 'archives' && (
        <div className="reglages-liste">
          {/* 10/08 — CETTE SECTION ÉTAIT VIDE EN PERMANENCE. Elle filtrait la
              liste principale, qui ne charge que les spots ACTIFS : « restaurer »
              était donc inatteignable. On lit maintenant le tiroir à part, à
              l'ouverture de la section — les archivés ne remontent pas dans le
              deck ni sur la carte, ce qui est bien le sens de « ranger ». */}
          {archives === null && (
            <span className="reglages-item mono estompe">{t('on ouvre le tiroir…')}</span>
          )}
          {archives?.map((l) => (
            <span key={l.id} className="reglages-item mono">
              <button className="lien" onClick={() => onVoir(l)}>
                {l.nom}
              </button>
              <button
                className="reglages-action mono"
                onClick={() => {
                  onRestaurer(l)
                  setArchives((a) => a?.filter((x) => x.id !== l.id) ?? null)
                }}
              >
                {t('restaurer')} →
              </button>
            </span>
          ))}
          {archives?.length === 0 && (
            <span className="reglages-item mono estompe">{t('aucun spot archivé.')}</span>
          )}
        </div>
      )}

      {/* BLOQUÉS (0019) — la liste des portes fermées. Le prénom est celui
          qu'ils portaient au moment du geste (après, la vitrine ne les montre
          plus). Débloquer ne restaure PAS la relation : on se redemande. */}
      <button
        className="mono reglages-section reglages-toggle"
        aria-expanded={ouvert === 'bloques'}
        onClick={() => bascule('bloques')}
      >
        {t('bloqués')}
        <span className="reglages-chevron">{ouvert === 'bloques' ? '–' : '+'}</span>
      </button>
      {ouvert === 'bloques' && (
        <div className="reglages-liste">
          {bloques === null && (
            <span className="reglages-item mono estompe">{t('on regarde…')}</span>
          )}
          {bloques?.map((b) => (
            <span key={b.id} className="reglages-item mono">
              @{b.prenom.toLowerCase()}
              <button className="reglages-action mono" onClick={() => void debloquer(b.id)}>
                {t('débloquer')} →
              </button>
            </span>
          ))}
          {bloques?.length === 0 && (
            <span className="reglages-item mono estompe">{t('personne.')}</span>
          )}
          {bloques !== null && bloques.length > 0 && (
            <span className="reglages-item mono estompe">
              {t('débloquer ne le remet pas dans ton cercle — on se redemande.')}
            </span>
          )}
          {erreurBloques && <p className="reglages-erreur mono">{erreurBloques}</p>}
        </div>
      )}

      {/* AMIS ARCHIVÉS — la mise en sommeil locale (07/08) : la relation
          cloud reste, le membre sort de l'annuaire et de ma carte */}
      <button
        className="mono reglages-section reglages-toggle"
        aria-expanded={ouvert === 'amis'}
        onClick={() => bascule('amis')}
      >
        {t('amis archivés')}
        <span className="reglages-chevron">{ouvert === 'amis' ? '–' : '+'}</span>
      </button>
      {ouvert === 'amis' && (
        <div className="reglages-liste">
          {cercle.map((m) => {
            const dort = amisArchives.includes(m.id)
            return (
              <span key={m.id} className={`reglages-item mono${dort ? '' : ' estompe'}`}>
                @{m.prenom.toLowerCase()}
                <button className="reglages-action mono" onClick={() => onBasculerAmi(m.id)}>
                  {dort ? `${t('réintégrer')} →` : `${t('archiver')} →`}
                </button>
              </span>
            )
          })}
          {cercle.length === 0 && (
            <span className="reglages-item mono estompe">{t('aucun ami archivé.')}</span>
          )}
        </div>
      )}

      {/* MES LISTES — favoris (♥ de ma carte) + éclaireurs suivis */}
      <button
        className="mono reglages-section reglages-toggle"
        aria-expanded={ouvert === 'listes'}
        onClick={() => bascule('listes')}
      >
        {t('mes listes')}
        <span className="reglages-chevron">{ouvert === 'listes' ? '–' : '+'}</span>
      </button>
      {ouvert === 'listes' && (
        <div className="reglages-liste">
          <span className="reglages-item mono estompe">{t('favoris —')}</span>
          {lieux
            .filter((l) => lireFavoris().includes(l.id))
            .map((l) => (
              <span key={l.id} className="reglages-item mono">
                <button className="lien" onClick={() => onVoir(l)}>
                  {l.nom}
                </button>
              </span>
            ))}
          {lieux.filter((l) => lireFavoris().includes(l.id)).length === 0 && (
            <span className="reglages-item mono estompe">{t('aucun favori pour l’instant.')}</span>
          )}
          {lireSuivis().length > 0 && (
            <>
              <span className="reglages-item mono estompe">{t('suivis —')}</span>
              {lireSuivis().map((nom) => (
                <span key={nom} className="reglages-item mono">
                  @{nom.toLowerCase()}
                </span>
              ))}
            </>
          )}
        </div>
      )}

      {/* MES MONUMENTS (10/08) — ta photo par-dessus la gravure, sur ta carte
          seulement. La gravure reste à l'échelle de la ville : ta photo prend
          le relais en approchant, et la taille du monument ne change pas. */}
      <button
        className="mono reglages-section reglages-toggle"
        aria-expanded={ouvert === 'monuments'}
        onClick={() => bascule('monuments')}
      >
        {t('mes monuments')}
        <span className="reglages-chevron">{ouvert === 'monuments' ? '–' : '+'}</span>
      </button>
      {ouvert === 'monuments' && (
        <div className="reglages-liste">
          <p className="reglages-compte-note">
            {t('ta photo remplace la gravure — sur TA carte seulement, jamais sur celle des autres. Elle ne quitte pas ce téléphone.')}
          </p>
          {stickerRate && (
            <p className="reglages-erreur mono">
              {t('cette photo n’a pas pu être lue — essaie-en une autre.')}
            </p>
          )}
          {MONUMENTS.filter((m) => m.img).map((m) => (
            <span key={m.nom} className="reglages-item mono monument-rangee">
              <span className="monument-apercu">
                <img src={stickers.get(m.nom) ?? m.img} alt="" />
              </span>
              <span className="monument-nom-reglage">{m.nom}</span>
              <label className="reglages-action">
                {stickers.has(m.nom) ? t('changer') : t('ma photo')}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => void choisirSticker(m.nom, e.target.files?.[0])}
                />
              </label>
              {stickers.has(m.nom) && (
                <button
                  className="reglages-action"
                  onClick={() => void retirerSticker(m.nom).then(rechargerStickers)}
                >
                  {t('la gravure')}
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* LE COMPTE (09/08) — la porte par laquelle tu es entré, en clair.
          Deux comptes peuvent porter le même prénom : le mail, la porte et le
          début de l'identifiant sont les seules choses qui les distinguent.
          Le nombre de mes spots est là parce que c'est LE symptôme : un carnet
          vide veut presque toujours dire « mauvaise porte ». */}
      {compte && (
        <div className="reglages-compte mono">
          <span className="reglages-compte-mail">{compte.email}</span>
          <span className="reglages-compte-ligne">
            {compte.portes.includes('google') ? t('par Google') : t('par lien mail')}
            {compte.portes.length > 1 && ` ${t('et par lien mail')}`}
            {' · '}
            {lieux.filter((l) => estAMoi(l)).length} {t('spots à moi')}
          </span>
          <span className="reglages-compte-ligne estompe">
            {t('compte')} {compte.idCourt}
          </span>
        </div>
      )}

      {/* SE DÉCONNECTER — réel (07/08) : la session part, le carnet reste.
          C'est aussi la porte pour CHANGER de compte : Google réaffiche
          désormais le choix du compte à chaque entrée (prompt=select_account). */}
      <button className="mono reglages-section" onClick={() => void seDeconnecter()}>
        {t('se déconnecter')}
        <span className="reglages-chevron">→</span>
      </button>
      <p className="reglages-compte-note">
        {t('pour changer de compte : ressors, puis rechoisis ta porte. Tes spots restent sur ce téléphone.')}
      </p>

      {/* BIENTÔT (backend) */}
      <button
        className="mono reglages-section reglages-toggle"
        aria-expanded={ouvert === 'bientot'}
        onClick={() => bascule('bientot')}
      >
        {t('bientôt')}
        <span className="reglages-chevron">{ouvert === 'bientot' ? '–' : '+'}</span>
      </button>
      {ouvert === 'bientot' && (
        <div className="reglages-bientot mono">
          {['notifications push'].map((libelle) => (
            <span key={libelle} className="reglages-bientot-item">
              {t(libelle)} <span className="reglages-bientot-tag">{t('bientôt')}</span>
            </span>
          ))}
        </div>
      )}

      {/* le tuto : faire revenir les notes griffonnées de l'ancien proprio */}
      <button
        className="lien reglages-relire"
        onClick={() => {
          toutRelire()
          flash()
        }}
      >
        {t('relire les notes en marge')}
      </button>

      {/* le grand jeudi arrive tout seul (1ᵉʳ jeudi du mois) — cette ligne de
          colophon sert juste à jeter un œil sans attendre le jour J */}
      <button className="lien reglages-relire" onClick={onGrandJeudi}>
        {t('aperçu du grand jeudi')}
      </button>
    </div>
  )
}

// ── la bannière du jour J : le 1ᵉʳ jeudi du mois, en tête de « ce soir »
// et « trouver ». une étiquette papier + UNE cire (le cap) — elle ouvre
// l'écran du grand jeudi (le voile). ──
function BanniereGrandJeudi({ onOuvrir }: { onOuvrir: () => void }) {
  return (
    <button className="gj-banniere" onClick={onOuvrir}>
      <span className="mono gj-banniere-cap">{t('le grand jeudi')}</span>
      <span className="gj-banniere-mot">{t('ce soir, le voile tombe. toute la ville.')}</span>
    </button>
  )
}

export default function App() {
  const [splash, setSplash] = useState(true)
  // stable (useCallback) : sinon le timer du splash repartirait à chaque render
  const finirSplash = useCallback(() => setSplash(false), [])
  const [session, setSession] = useState<Session | null>(null)
  const [authPret, setAuthPret] = useState(false)
  const [lieux, setLieux] = useState<Lieu[]>([])
  const [ajout, setAjout] = useState(false)
  // true = le formulaire d'ajout s'ouvre panneau import Google DÉPLIÉ
  // (arrivée depuis le bandeau de rappel) — remis à false à la fermeture
  const [importDirect, setImportDirect] = useState(false)
  // CHANTIER_PELLICULE §1.1 : l'accueil, c'est LA CARTE avec la pellicule —
  // le seul écran qui change tous les jours sans que l'utilisateur fasse quoi
  // que ce soit. « sortir » reste le 1er onglet de la nav (le rituel ne bouge pas).
  const [vue, setVue] = useState<'liste' | 'carte'>('carte')
  // chantier 1 : les lieux « à comparer » + l'ouverture de la table (accès aussi
  // depuis l'index, pas seulement la carte). source de vérité = localStorage.
  const [comparer, setComparer] = useState<string[]>(() => lireComparer())
  const [compaOuverte, setCompaOuverte] = useState(false)
  const basculerCompa = (l: Lieu) => setComparer(basculerComparer(l.id))
  // filtre « foot » à 3 états sur UNE ligne : tap = on le voit (diffuse) ·
  // appui long = barré (sans foot / refuge). timer du long-press.
  const footPress = useRef<{ timer: number; fired: boolean } | null>(null)
  const [onglet, setOnglet] = useState<Onglet>('macarte')
  // journal de bord : l'écran affiché (pour situer un plantage iOS — quel
  // écran tue la page). N'écrit plus une fois la session déclarée stable.
  useEffect(() => {
    jalonnerVue(`vue:${onglet}${onglet === 'macarte' ? '·' + vue : ''}`)
  }, [onglet, vue])
  // le match de groupe vit dans l'onglet cercle : l'étiquette « sortir à
  // plusieurs → » ouvre le parcours composer → trianguler → swiper → match
  const [sortieGroupe, setSortieGroupe] = useState(false)
  // le spot semé dans le match par « on y retourne ? » (null = présélection normale)
  const [graineGroupe, setGraineGroupe] = useState<Lieu | null>(null)
  // …et depuis la refonte du cœur (audit 01/08), sa porte PRINCIPALE est
  // l'étiquette « on dit où. » en tête de l'onglet « sortir »
  const [matchSortir, setMatchSortir] = useState(false)
  // un match du cloud où je suis membre (pas créateur) — je le rejoins in-app
  const [matchRejoint, setMatchRejoint] = useState<MatchOuvert | null>(null)
  // « + au vote » : quand un match est ouvert, la FICHE sait y envoyer un spot
  // (on n'amène pas la carte dans le match — on amène le match dans la carte)
  const ajouterAuVote = async (l: Lieu) => {
    const m = lireSortieActive() ?? matchRejoint
    if (!m) return
    try {
      const prenom = (await lireProfil())?.prenom?.trim() || 'moi'
      await ajouterCandidat(m.id, l, prenom)
      setFlash(`${l.nom.toLowerCase()} ${t('est au vote.')}`)
    } catch (e) {
      setFlash((e as Error).message)
    }
  }
  // l'écran du grand jeudi : ouvert par la bannière du jour J, ou par la
  // ligne « aperçu du grand jeudi » des réglages (pour tester sans attendre)
  const [gjOuvert, setGjOuvert] = useState(false)
  // entrer dans « le cercle » ramène toujours à sa racine (jamais au milieu
  // du parcours de groupe) — navigation retour propre
  const allerAuCercle = () => {
    setSortieGroupe(false)
    setOnglet('cercle')
  }
  // mes critères (ma façon de juger un lieu) — binaire / gradué ●●○
  const [criteres, setCriteres] = useState(() => mesCriteres())
  const [nouvCrit, setNouvCrit] = useState('')
  const [nouvType, setNouvType] = useState<TypeCritere>('gradue')
  const ajoutCritere = () => {
    if (!nouvCrit.trim()) return
    setCriteres(ajouterCritere(nouvCrit, nouvType))
    setNouvCrit('')
  }
  // les super potes (anneau intérieur, cap 10) — togglables
  const [proches, setProches] = useState(() => lesProches())
  const toggleProche = (id: string) => {
    const r = basculerProche(id)
    if (r.pleinAtteint) {
      setFlash(`ton cercle est plein (${CAP_PROCHES}) — retire un super pote d'abord.`)
      return
    }
    setProches(r.proches)
  }
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
    // (l'état `comparer` EST la source — pas de relecture localStorage à chaque ouverture)
    const comp = comparer
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
  // L'ACCUEIL APPARTIENT AU COMPTE, PAS AU TÉLÉPHONE (corrigé le 09/08).
  // Avant : un drapeau localStorage → arriver sur un second téléphone avec le
  // bon compte rejouait tout l'accueil et re-demandait prénom + portrait, qui
  // écrasaient le vrai profil. Maintenant : `null` = on ne sait pas encore, on
  // attend la réponse du cloud plutôt que de troubler l'écran d'accueil.
  const [onboard, setOnboard] = useState<boolean | null>(() => (onboardingFait() ? false : null))
  // ⚠ Le cloud est TOUJOURS consulté, même quand le drapeau local a déjà
  // tranché (relecture 12/08) : `jeudi-onboard` est une clé d'APPAREIL — sur
  // un téléphone où le compte A l'a posée, le compte B (réellement neuf)
  // sautait l'accueil et se retrouvait sans prénom ni portrait. La voie
  // rapide locale ne sert plus qu'à éviter le clignotement ; le prénom en
  // base a le dernier mot, dans les deux sens.
  useEffect(() => {
    if (!session) return
    let vivant = true
    void compteDejaInstalle().then((installe) => {
      if (!vivant) return
      if (installe === true) {
        marquerOnboarding() // ce compte est connu : ce téléphone le sait maintenant
        setOnboard(false)
      } else if (installe === false) {
        setOnboard(true) // compte réellement neuf — même si un AUTRE compte avait posé le drapeau
      } else {
        // cloud muet : on s'en remet au local, sans écraser un état déjà résolu
        setOnboard((o) => (o === null ? !onboardingFait() : o))
      }
    })
    return () => {
      vivant = false
    }
  }, [session])
  // `sorties` = TOUTES les sorties en attente (miroir du stockage, lu une fois) ;
  // `attente` = la file de validation ouverte à l'écran. une seule source, deux vues.
  const [sorties, setSorties] = useState<SortieEnAttente[]>([])
  const [attente, setAttente] = useState<SortieEnAttente[]>([])
  const [attenteTotal, setAttenteTotal] = useState(0)
  const [archive, setArchive] = useState<Lieu | null>(null)
  // notifications (haut-droite) : demandes d'amis (RÉELLES) + lieux à noter
  const [notifsOuvertes, setNotifsOuvertes] = useState(false)
  // les VRAIES demandes (table relations) — chargées au boot + au retour de focus
  const [demandes, setDemandes] = useState<DemandeRecue[]>([])
  // le cercle réel (relations acceptées) : les vrais membres, devant le décor seed
  const [cercleReel, setCercleReel] = useState<MembreCercle[]>([])
  // les amis mis en sommeil (local) : hors annuaire, leurs spots hors carte
  const [amisArchives, setAmisArchives] = useState<string[]>(() => lireAmisArchives())

  // ── LA PELLICULE (CHANTIER_PELLICULE) : les tas + le carrousel ──
  const [vuesPel, setVuesPel] = useState<ReadonlySet<string>>(() => lireVuesPellicule())
  useEffect(() => {
    void chargerVuesPellicule().then(setVuesPel) // fusion cloud → local au boot
  }, [])
  // la soirée ouverte dans le carrousel (index dans `soirees`) — null = fermé
  const [pelIndex, setPelIndex] = useState<number | null>(null)
  const cercleActif = useMemo(
    () => cercleReel.filter((m) => !amisArchives.includes(m.id)),
    [cercleReel, amisArchives],
  )
  // bandeau doux d'arrivée par lien d'invite : « ta demande est partie chez… »
  const [bandeauInvite, setBandeauInvite] = useState<string | null>(null)
  // realtime léger (étape 5) : un rechargement à l'ouverture + au focus suffit
  const chargerCercle = useCallback(() => {
    demandesRecues().then(setDemandes).catch(() => {})
    monCercle().then(setCercleReel).catch(() => {})
  }, [])
  // accepter ≠ ignorer : accepter écrit VRAIMENT la relation (cloud),
  // ignorer supprime la demande. Un échec cloud = flash, rien de silencieux.
  const accepterDemande = async (deId: string) => {
    const d = demandes.find((x) => x.deId === deId)
    try {
      await accepterDemandeCloud(deId)
    } catch (e) {
      setFlash((e as Error).message)
      return
    }
    setDemandes((prev) => prev.filter((x) => x.deId !== deId))
    if (d) setFlash(`@${d.prenom.toLowerCase()} rejoint ton cercle.`)
    monCercle().then(setCercleReel).catch(() => {})
    recharger() // ses spots « cercle » arrivent sur ma carte
  }
  const ignorerDemande = async (deId: string) => {
    try {
      await refuserDemandeCloud(deId)
    } catch (e) {
      setFlash((e as Error).message)
      return
    }
    setDemandes((prev) => prev.filter((x) => x.deId !== deId))
  }
  // 0019 : ignorer ne suffit pas toujours — ignoré, on peut re-demander dès la
  // seconde suivante. Bloquer ferme la porte : plus de demande possible (RLS),
  // plus trouvable, plus rien qui passe. Silencieux pour l'autre, par principe.
  const bloquerDemande = async (deId: string) => {
    try {
      await bloquerMembre(deId)
    } catch (e) {
      setFlash((e as Error).message)
      return
    }
    setDemandes((prev) => prev.filter((x) => x.deId !== deId))
    setFlash('c’est fait. tu peux te dédire dans les réglages.')
  }
  // inviter un pote : navigator.share si dispo, sinon copie presse-papier
  const inviterUnPote = async () => {
    let lien: string
    try {
      lien = lienInvitation()
    } catch (e) {
      setFlash((e as Error).message)
      return
    }
    // le geste visé est accompli (le lien existe) : la note en marge s'efface —
    // jamais AVANT, sinon un échec (« connecte-toi d'abord ») la perdait pour rien
    effacerNote('cercle-invite')
    suivre('invite_envoyee')
    const texte = `rejoins mon cercle sur jeudi. je dis où. ${lien}`
    if (navigator.share) {
      try {
        await navigator.share({ text: texte })
      } catch {
        /* partage annulé : rien à dire */
      }
      return
    }
    try {
      await navigator.clipboard.writeText(texte)
      setFlash(t('lien copié. envoie-le à ton pote.'))
    } catch {
      setFlash(lien) // dernier repli : montrer le lien
    }
  }
  const [confirmVider, setConfirmVider] = useState(false)
  const [prenom, setPrenom] = useState('toi')
  const [critere, setCritere] = useState('le feeling')
  const [photoProfil, setPhotoProfil] = useState<Blob | null>(null)
  const [bio, setBio] = useState('')
  const [tagline, setTagline] = useState(() => lireTagline())
  const [insta, setInsta] = useState('')
  // vide tant que non renseignée (l'onboarding la demande) — jamais de défaut perso
  const [naissance, setNaissance] = useState('')
  const [depuis, setDepuis] = useState('')
  const sauverBioInsta = async (naiss = naissance) => {
    const cur = await lireProfil()
    // « depuis » se fige à la 1re sauvegarde (date d'entrée dans le carnet)
    const dep = cur?.depuis ?? depuis ?? new Date().toISOString()
    if (!depuis) setDepuis(dep)
    // le critère ne reste JAMAIS vide (« Karim EST le bruit ») : un champ
    // vidé retombe sur ce que le cloud connaît déjà, sinon le défaut d'onboarding
    const crit = normaliserCritere(critere) || cur?.critere || 'le feeling'
    if (crit !== critere) setCritere(crit)
    // sauverProfil = MERGE : on n'envoie QUE ce que cet éditeur possède
    await sauverProfil({
      bio: bio.trim(),
      insta: insta.trim().replace(/^@/, ''),
      critere: crit,
      naissance: naiss || cur?.naissance,
      depuis: dep,
    })
    setFlash('profil enregistré.')
  }
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!photoProfil) {
      // synchronisation avec une ressource externe (object URL) : le reset à
      // null quand la photo disparaît est voulu, pas un état dérivable au rendu
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    // sauverProfil = MERGE : la photo seule suffit
    await sauverProfil({ photo: f })
    setPhotoProfil(f)
  }
  // le curateur dont on regarde la carte (par prénom) — null = la liste du cercle
  const [curateur, setCurateur] = useState<string | null>(null)
  // petit message éphémère (effacé / signalé / visibilité changée)
  const [flash, setFlash] = useState<string | null>(null)
  // (le toast « nouvelle version » est devenu ToastNouvelleVersion — autonome,
  // rendu aussi sur l'écran d'auth, et sans course au boot. 12/08.)
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
  // le rangement PERSO (0012) : filtre par étiquette — n'apparaît que si
  // MES spots en portent (import Takeout ou saisie sur la fiche)
  const [etiquetteF, setEtiquetteF] = useState<string | null>(null)
  // les filtres statut/ouvert/match repliés dans un menu « filtres ⌄ »
  const [filtresOuvert, setFiltresOuvert] = useState(false)
  // les favoris (signets) : ids gardés sous la main + filtre dédié
  const [favoris, setFavoris] = useState<string[]>(() => lireFavoris())
  const [favOn, setFavOn] = useState(false)
  // la pile « à tester » : la règle (pas de tampon) + mes ratures (aTester.ts)
  const [ratures, setRatures] = useState<Record<string, MarqueATester>>(() => lireATester())
  // #22 : le tri — au plus proche (défaut) ou par propreté des WC (seul score permis)
  const [tri, setTri] = useState<'proche' | 'wc' | 'pop' | 'pertinence' | 'oublies'>('proche')
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
    capterInvite() // ?invite=<id> → mis de côté, URL nettoyée aussitôt
    chargerMonId().then(() => {
      jalonner('monId')
      chargerCercle()
    importerSeed().then(() => {
      jalonner('seed')
      // le prix de la rayure, payé au réveil : les serments dont le jeudi est
      // tombé emportent leur lieu. Une fois par lancement, jamais en
      // minuterie — jeudi bat une fois par semaine, pas à la seconde.
      balayerRayures()
        .catch(() => {
          /* balayage impossible (hors-ligne…) : le prochain lancement réessaie */
        })
        .then(() => recharger())
        .then(() => jalonner('spots'))
      // UNE lecture du stockage : ensuite l'état fait foi (sorties = la cloche,
      // attente = la file de validation ouverte)
      const a = sortiesEnAttente()
      setSorties(a)
      setAttente(a)
      setAttenteTotal(a.length)
    })
    lireProfil().then((p) => {
      jalonner('profil')
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
    // chargerCercle est stable (useCallback []) : l'effet ne tourne qu'une fois
  }, [chargerCercle])

  // ── la session Supabase : on lit l'existante puis on écoute les changements
  // (connexion via magic-link, déconnexion, refresh du token). Tant qu'on n'a
  // pas répondu, authPret reste faux → on n'affiche ni Auth ni l'app par erreur.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      jalonner(data.session ? 'session' : 'session-vide')
      setSession(data.session)
      setAuthPret(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s)
      setAuthPret(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // realtime léger : demandes + cercle se rafraîchissent au retour de focus
  // (pas de websocket pour cette étape — ça, c'est l'étape 6)
  useEffect(() => {
    const auFocus = () => chargerCercle()
    window.addEventListener('focus', auFocus)
    return () => window.removeEventListener('focus', auFocus)
  }, [chargerCercle])

  // l'invite en attente (lien ?invite=) part dès qu'on est connecté — y compris
  // juste après le premier login (l'écran Auth, lui, ne change pas)
  useEffect(() => {
    if (!session) return
    suivre('ouverture')
    chargerCercle()
    traiterInviteAttente().then((prenom) => {
      if (prenom) {
        setBandeauInvite(`ta demande est partie chez ${prenom.toLowerCase()}.`)
        chargerCercle()
      }
    })
  }, [session, chargerCercle])

  // le rappel doux « importe tes adresses Google » : tant que rien n'est venu
  // de Google (source 'google' absente de MES spots), tous les 7 jours, 3 fois
  // max — coupé net au premier import réussi (couperRelanceImport).
  const [rappelImport, setRappelImport] = useState(false)
  useEffect(() => {
    if (!session || lieux.length === 0) return
    if (importGoogleFait(lieux) || !doitRelancerImport()) return
    // hors du corps de l'effet (pas de setState synchrone) ; le garde-fou
    // doitRelancerImport rend l'affaire idempotente si lieux re-change
    const t = setTimeout(() => {
      setRappelImport(true)
      marquerRelanceImport()
    }, 0)
    return () => clearTimeout(t)
  }, [session, lieux])

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
    const verdict = await supprimerLieu(l.id)
    setFavoris(lireFavoris()) // le signet d'un spot effacé n'a plus d'objet
    setRatures(lireATester())
    recharger()
    // on ne dit pas « effacé » quand le cloud n'a pas encore répondu
    // (les flashs s'écrivent en clair dans cet écran : la nouvelle phrase
    //  passe donc par t() ici, à l'appel — le rendu, lui, ne traduit pas)
    setFlash(
      verdict === 'efface' ? 'effacé.' : t('effacé ici — on finit le ménage au retour du réseau.'),
    )
  }

  // arracher la page depuis la fiche : on efface, puis on referme derrière
  const supprimerDepuisFiche = async (l: Lieu) => {
    await supprimer(l)
    setFiche(null)
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

  // ── LA CARTE SUIT LES GESTES (09/08) ──
  // Carte.tsx refait tous ses pins dès que le tableau `lieux` change
  // d'identité (effet `[lieux]`). Un geste posé depuis la fiche doit donc
  // remplacer le lieu touché dans l'état — pas relire tout le cloud pour un
  // cœur : la donnée est déjà là, on la corrige sur place et le marqueur
  // s'allume à la fermeture de la fiche.
  const rafraichirCarte = (id: string, patch: (l: Lieu) => Lieu = (l) => ({ ...l })) => {
    setLieux((ls) => ls.map((x) => (x.id === id ? patch(x) : x)))
  }

  // poser/retirer le signet (favori) — pas une note, juste « je le garde ».
  // Local d'abord (la liste), puis la colonne `favori` de MES spots (0015) :
  // c'est elle que la carte lit pour dessiner son cœur.
  const basculerFav = (l: Lieu) => {
    const pose = !favoris.includes(l.id)
    setFavoris(pose ? [...favoris, l.id] : favoris.filter((x) => x !== l.id))
    rafraichirCarte(l.id, (x) => ({ ...x, favori: pose || undefined }))
    void basculerFavoriLieu(l).then(setFavoris)
  }

  // poser/retirer le spot de la pile « à tester » (rature de la règle).
  // L'œil de la carte se lit directement dans `jeudi-a-tester` (Carte.tsx) :
  // il suffit que le pin soit refait, d'où le coup de rafraîchirCarte.
  const basculerPile = (l: Lieu) => {
    setRatures(basculerATester(l))
    rafraichirCarte(l.id)
  }

  // ── RAYER : le serment (0015). On signe de son prénom, la date tombe au
  // jeudi suivant (rayure.ts), la croix s'allume tout de suite sur la carte
  // et la ligne part vers le cercle — ou attend le réseau dans la file.
  const rayerDepuisFiche = async (l: Lieu, motif: string) => {
    const r = await rayerLieu(l.id, prenom || 'toi', motif)
    rafraichirCarte(l.id, (x) => ({ ...x, raye: r }))
    setFlash('rayé. il part de ton carnet jeudi — tu peux te dédire d’ici là.')
    return r
  }

  // se dédire avant le jeudi : le lieu revient intact, la ligne s'efface
  const deRayerDepuisFiche = async (l: Lieu) => {
    await deRayerLieu(l.id)
    rafraichirCarte(l.id, (x) => ({ ...x, raye: undefined }))
    setFlash('rayure effacée. il reste dans ton carnet.')
  }

  // 0018 : le drapeau local s'allume tout de suite (« on vérifie », même hors
  // ligne) ET le signal part en base — c'est lui qui compte désormais.
  // La ligne éditoriale du chantier : on confirme, on ne remercie pas.
  const signaler = async (l: Lieu) => {
    signalerLieu(l.id)
    try {
      await signalerCible('lieu', l.id, 'lieu à vérifier', undefined, {
        nom: l.nom,
        adresse: l.adresse,
      })
      setFlash('c’est noté.')
    } catch (e) {
      setFlash((e as Error).message)
    }
  }

  // qui possède quoi : mes spots + ceux de mon cercle = "ma carte" ; les
  // éclaireurs hors cercle (proprietaire pub-*) ne vivent que dans "public".
  // bloc D : le cercle = les VRAIS membres (relations acceptées), point.
  const idsCercle = useMemo(() => new Set(cercleActif.map((m) => m.id)), [cercleActif])
  // l'écran cercle : RÉEL uniquement — plus aucun membre de décor
  // (les amis en sommeil n'y figurent plus : ils vivent dans moi → amis archivés)
  const membresCercle = useMemo(() => fusionnerCercle(cercleActif), [cercleActif])
  // le cercle pour les tris de confiance (recherche, « pour toi ») : ids + prénoms
  const cerclePourTri = useMemo(
    () => cercleReel.flatMap((m) => [m.id, m.prenom]),
    [cercleReel],
  )
  // UNE seule source pour les super potes : lesProches() (état `proches`),
  // plus jamais le `proche` figé du seed (il ne sert qu'à amorcer cercle.ts).
  const idsProches = useMemo(() => new Set(proches), [proches])
  const mesLieux = useMemo(
    () => lieux.filter((l) => estAMoi(l) || idsCercle.has(l.proprietaire ?? '')),
    [lieux, idsCercle],
  )
  // mes spots à MOI (stat « spots » du profil : pas ceux du cercle)
  const mesSpots = useMemo(() => lieux.filter((l) => estAMoi(l)), [lieux])

  // la collection affichée sur "ma carte" : 4 niveaux de distance sociale
  // (la sélection d'UNE personne précise se fait dans l'onglet "le cercle")
  const baseCarte = useMemo(() => {
    if (collection === 'tout') return lieux // tout mélangé : mes spots + proches + potes + public/curateurs
    if (collection === 'moi') return lieux.filter(estAMoi)
    if (collection === 'public') return lieux.filter((l) => l.visibilite === 'public')
    if (collection === 'proches')
      return lieux.filter((l) => !!l.proprietaire && idsProches.has(l.proprietaire))
    return lieux.filter((l) => !!l.proprietaire && idsCercle.has(l.proprietaire)) // potes = tout le cercle (proches inclus)
  }, [lieux, collection, idsProches, idsCercle])

  // l'index filtré : les 3 axes se COMBINENT (tous doivent passer)
  const lieuxFiltres = useMemo(() => {
    const liste = baseCarte.filter((l) => {
      // « à tester » et « faits » restent les deux moitiés du carnet : ce qui
      // sort de la pile tombe dans l'autre. La règle par défaut n'a pas
      // bougé (pas de tampon = à tester) — elle se rature juste, spot par spot.
      const dansLaPile = estATester(l, ratures)
      const okStatut = filtre === 'faits' ? !dansLaPile : filtre === 'decouvrir' ? dansLaPile : true
      const okOuvert = !ouvertOn || etatHoraire(l.horaires)?.ouvert === true
      const okMatch =
        matchF === 'diffuse'
          ? l.match === 'diffuse'
          : matchF === 'refuge'
            ? l.match !== 'diffuse'
            : true
      const okEnvie = !envieF || (l.envies as string[]).includes(envieF)
      const okEtiquette = !etiquetteF || (l.etiquettes ?? []).includes(etiquetteF)
      const okFav = !favOn || favoris.includes(l.id)
      const okRooftop = !rooftopOn || !!l.rooftop
      const okSurLeau = !surLeauOn || !!l.surLeau
      return okStatut && okOuvert && okMatch && okEnvie && okEtiquette && okFav && okRooftop && okSurLeau
    })
    if (tri === 'wc') {
      return [...liste].sort((a, b) => (b.propreteWc ?? 0) - (a.propreteWc ?? 0))
    }
    if (tri === 'pop') {
      // populaire = recommandé par le plus de voix (toi + le cercle)
      const voix = (l: Lieu) => (l.note ? 1 : 0) + (l.tipsCercle?.length ?? 0)
      return [...liste].sort((a, b) => voix(b) - voix(a))
    }
    if (tri === 'pertinence') {
      // « pour toi » : la carte respire en resurfaçant selon tes habitudes
      const gout = profilDeGout({
        valides: liste.filter((l) => l.tampon?.v === 'valide'),
        bofs: liste.filter((l) => l.tampon?.v === 'bof'),
        favoris,
        vus: [...vus],
      })
      return rechercher(liste, {}, gout, cerclePourTri).map((r) => r.lieu)
    }
    if (tri === 'oublies') {
      // « à redécouvrir » : les spots jamais consultés remontent (la carte ne dort pas)
      return [...liste].sort(
        (a, b) => (vus.has(a.id) ? 1 : 0) - (vus.has(b.id) ? 1 : 0) || distanceM(a) - distanceM(b),
      )
    }
    return [...liste].sort((a, b) => distanceM(a) - distanceM(b))
  }, [baseCarte, filtre, ouvertOn, matchF, envieF, etiquetteF, favOn, favoris, ratures, rooftopOn, surLeauOn, tri, vus, cerclePourTri])

  // ── la pellicule, prête à peindre : les tas (carte) + les soirées
  // (carrousel), prénoms et sources résolus — le moteur pur fait le reste
  const pelliculeDonnees = useMemo(() => {
    const maintenant = new Date()
    const tousTas = construireTas(lieux, maintenant)
    const prenomDe = (auteurId?: string) =>
      cercleReel.find((m) => m.id === auteurId)?.prenom.toLowerCase() ?? 'toi'
    const parLieu = new Map<string, TasAffiche>()
    const soirees: SoireePellicule[] = []
    for (const tas of tousTas) {
      const srcs = tas.photos.slice(0, 4).map((p) => srcPhoto(p)).filter(Boolean)
      if (!srcs.length) continue
      parLieu.set(tas.lieu.id, {
        lieuId: tas.lieu.id,
        srcs,
        vivantes: tas.vivantes,
        taille: taillePolaroid(tas.fraicheurH),
        age: libelleAge(tas.fraicheurH),
        prenom: prenomDe(tas.auteurId),
        vu: estVu(tas, vuesPel as Set<string>),
        souvenir: estSouvenir(tas.fraicheurH),
        fraicheurH: tas.fraicheurH,
        developpe: enDeveloppement(tas.fraicheurH),
      })
      soirees.push({
        lieuId: tas.lieu.id,
        nom: tas.lieu.nom,
        lat: tas.lieu.lat,
        lng: tas.lieu.lng,
        soiree: tas.soiree,
        diapos: tas.photos
          .map((p) => ({
            src: srcPhoto(p),
            age: libelleAge((maintenant.getTime() - new Date(p.priseLe!).getTime()) / 3600000),
            prenom: prenomDe(p.auteurId),
          }))
          .filter((d) => d.src),
      })
    }
    return { parLieu, soirees }
  }, [lieux, cercleReel, vuesPel])

  // ── l'invitation de la pellicule vide (§1.8) : une fois par jour, puis
  // elle s'efface. Une invitation permanente au-dessus d'une carte devenue
  // dense se lit comme un bandeau, plus comme une main tendue.
  const [invite, setInvite] = useState(false)
  useEffect(() => {
    if (vue !== 'carte') return
    if (!inviteAMontrer(pelliculeDonnees.soirees.length === 0, lireJourInvite())) return
    // l'allumage passe par un timer (tick 0) : la règle react-hooks interdit
    // le setState synchrone dans un effet — il déclencherait un second rendu
    // en cascade avant que le premier soit peint. Même geste, un tick plus tard.
    const t0 = window.setTimeout(() => {
      setInvite(true)
      noterInviteVue()
    }, 0)
    const t = window.setTimeout(() => setInvite(false), DUREE_INVITE_MS)
    return () => {
      window.clearTimeout(t0)
      window.clearTimeout(t)
    }
  }, [vue, pelliculeDonnees.soirees.length])

  // ── les soirs du cercle (§7) : la MÊME pellicule, lue humainement.
  // Une entrée = le résultat d'une soirée. 7 jours, chronologique, coupé
  // par nuit — rien ne classe, rien ne compte, et ça finit.
  const carnetCercle = useMemo(() => {
    const maintenant = new Date()
    const entrees = construireCarnet(lieux, maintenant)
    const prenomDe = (auteurId?: string) =>
      cercleReel.find((m) => m.id === auteurId)?.prenom.toLowerCase() ?? 'toi'
    const nuits: NuitAffichee[] = parNuits(entrees, maintenant).map((n) => ({
      soiree: n.soiree,
      libelle: n.libelle,
      entrees: n.entrees.map((e) => ({
        cle: `${e.lieu.id}|${e.soiree}`,
        lieuId: e.lieu.id,
        nom: e.lieu.nom,
        age: libelleAge(e.fraicheurH),
        prenom: prenomDe(e.auteurId),
        verdict: e.verdict,
        tip: tipDeLaSoiree(e.lieu, e.auteurId),
        srcs: e.photos.slice(0, 5).map((p) => srcPhoto(p)).filter(Boolean),
      })),
    }))
    return { nuits, total: entrees.length }
  }, [lieux, cercleReel])

  // les étiquettes qui existent sur MES spots — la rangée de filtre ne
  // s'affiche que si le rangement perso est réellement utilisé
  const mesEtiquettes = useMemo(() => {
    const toutes = new Set<string>()
    for (const l of baseCarte) if (estAMoi(l)) for (const e of l.etiquettes ?? []) toutes.add(e)
    return [...toutes].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [baseCarte])

  // le compteur « N ouverts » — partagé, calculé une fois par liste filtrée
  const nbOuverts = useMemo(
    () => lieuxFiltres.filter((l) => etatHoraire(l.horaires)?.ouvert === true).length,
    [lieuxFiltres],
  )

  // les lieux à noter, dédoublonnés par nom (des sorties périmées s'accumulent) —
  // dérivés de l'état `sorties` (plus de relecture localStorage à chaque render)
  const aNoter = useMemo(() => {
    const nomsVus = new Set<string>()
    return sorties.filter((s) => (nomsVus.has(s.nom) ? false : (nomsVus.add(s.nom), true)))
  }, [sorties])

  if (splash) return <Splash onFini={finirSplash} />
  // pas d'écran noir pendant qu'on interroge la session : le tampon respire
  if (!authPret)
    return (
      <div className="attente-auth" aria-busy="true" aria-label="chargement">
        <div className="tampon-logo attente-auth-logo">Jeudi.</div>
      </div>
    )
  // le toast « nouvelle version » vit AUSSI ici : quelqu'un de déconnecté
  // coincé sur une vieille version doit pouvoir se mettre à jour (12/08)
  if (!session)
    return (
      <>
        <Auth />
        <div className="toasts">
          <ToastNouvelleVersion />
        </div>
      </>
    )
  // on demande au cloud si ce compte est déjà installé : le tampon respire
  // plutôt que de faire clignoter un accueil qu'on va peut-être sauter
  if (onboard === null)
    return (
      <div className="attente-auth" aria-busy="true" aria-label="chargement">
        <div className="tampon-logo attente-auth-logo">Jeudi.</div>
      </div>
    )
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
            ) : onglet === 'trouver' ? null : ( // « trouver » porte son propre en-tête d'onglet
              <span className="topbar-titre">
                {onglet === 'cesoir'
                  ? t('sortir')
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
          {/* l'accueil de l'invité : bandeau doux, tap pour le ranger */}
          {bandeauInvite && (
            <button className="mono bandeau-invite" onClick={() => setBandeauInvite(null)}>
              {bandeauInvite}
            </button>
          )}
          {/* le rappel import Google : même bandeau doux — tap = ouvre le
              formulaire d'ajout, panneau import déplié ; ✕ implicite au tap */}
          {rappelImport && !bandeauInvite && !ajout && (
            <button
              className="mono bandeau-invite"
              onClick={() => {
                setRappelImport(false)
                setImportDirect(true)
                setAjout(true)
              }}
            >
              tes adresses Google Maps t'attendent — récupère-les →
            </button>
          )}
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
                // les VRAIES demandes (table relations) — plus de tampon démo ici
                demandes.map((d) => (
                  <div className="notif-ligne" key={d.deId}>
                    {/* cohérent avec le cercle : le mini ex-libris devant le prénom */}
                    <span className="notif-qui">
                      <span className="exlibris-initiale exlibris-mini">{d.prenom[0]}</span>
                      @{d.prenom.toLowerCase()}
                    </span>
                    <span className="notif-actions mono">
                      <button className="notif-ok" onClick={() => accepterDemande(d.deId)}>
                        accepter
                      </button>
                      <button className="notif-non" onClick={() => ignorerDemande(d.deId)}>
                        ignorer
                      </button>
                      {/* libellé provisoire — le mot de marque se tranche à part */}
                      <button className="notif-non notif-bloquer" onClick={() => bloquerDemande(d.deId)}>
                        bloquer
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
                      // on ouvre UNE sortie : le compteur doit dire 1/1, pas 3/3
                      setAttente([s])
                      setAttenteTotal(1)
                      setNotifsOuvertes(false)
                    }}
                  >
                    alors, {s.nom} ?
                  </button>
                ))
              )}
            </div>

            {/* le push (0020) : l'interrupteur vit ici, avec les notifications */}
            <PousserMoi />

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
                          setSorties([])
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
                { v: 'pertinence', lbl: 'pour toi', court: 'pour toi' },
                { v: 'oublies', lbl: 'à redécouvrir', court: 'oubliés' },
                { v: 'pop', lbl: 'populaire', court: 'pop' },
                { v: 'wc', lbl: 'wc propres', court: 'wc' },
              ]}
              onChoisir={(v) => setTri(v as 'proche' | 'wc' | 'pop' | 'pertinence' | 'oublies')}
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
              {nbOuverts} ouverts · {lieuxFiltres.length} spot{lieuxFiltres.length > 1 ? 's' : ''}
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

          {/* le rangement PERSO (0012) : la rangée n'existe que si mes spots
              portent des étiquettes — jamais de chrome vide */}
          {mesEtiquettes.length > 0 && (
            <div className="idx-envies mono">
              <span className="idx-envies-lbl">{t('étiquette :')}</span>
              <button
                className={`idx-envie ${etiquetteF === null ? 'on' : ''}`}
                aria-pressed={etiquetteF === null}
                onClick={() => setEtiquetteF(null)}
              >
                {t('toutes')}
              </button>
              {mesEtiquettes.map((e) => (
                <button
                  key={e}
                  className={`idx-envie etiquette ${etiquetteF === e ? 'on' : ''}`}
                  aria-pressed={etiquetteF === e}
                  onClick={() => setEtiquetteF((p) => (p === e ? null : e))}
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
                pellicule={pelliculeDonnees.parLieu}
                onTas={(id) => {
                  const i = pelliculeDonnees.soirees.findIndex((s) => s.lieuId === id)
                  if (i >= 0) setPelIndex(i)
                }}
              />
              {/* l'état vide de la pellicule (§1.8) : une INVITATION,
                  jamais un constat — et les souvenirs, eux, restent.
                  Une fois par jour, puis elle s'efface (cf. invite). */}
              {invite && (
                <p className="hand carte-pellicule-vide" aria-live="polite">
                  {t('la ville se recharge — ce soir, c’est toi qui shootes.')}
                </p>
              )}
              {/* le carrousel deux axes : la nuit du cercle au pouce */}
              {pelIndex != null && pelliculeDonnees.soirees.length > 0 && (
                <Pellicule
                  soirees={pelliculeDonnees.soirees}
                  depart={Math.min(pelIndex, pelliculeDonnees.soirees.length - 1)}
                  onVu={(lieuId, soiree) => setVuesPel(new Set(marquerVuPellicule(lieuId, soiree)))}
                  onJyVais={(id) => {
                    setPelIndex(null)
                    const l = lieux.find((x) => x.id === id)
                    if (l) ouvrirFiche(l, lieux)
                  }}
                  onFermer={() => setPelIndex(null)}
                />
              )}
              {/* la note en marge de la carte — montée ICI (niveau App),
                  par-dessus l'onglet : Carte.tsx n'est pas touché */}
              <NoteMarge
                id="carte-point"
                fleche="bas"
                effaceAuGeste
                className="note-marge-carte"
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

          {/* le fab papier-blanc est mort (12/08, planche navbas_ilot_001) :
              la capture vit désormais dans la bande, amarrée au bout — un
              seul objet flottant, visible partout, toujours sous le pouce. */}
          {ajout && (
            <FormAjout
              importOuvert={importDirect}
              onFini={() => {
                setAjout(false)
                setImportDirect(false)
                recharger()
              }}
              onAnnule={() => {
                setAjout(false)
                setImportDirect(false)
              }}
            />
          )}

          {/* la table de comparaison est rendue au niveau GLOBAL (voir plus bas),
              pour s'ouvrir depuis n'importe quel onglet (récap « ce soir », index, carte). */}
        </>
      )}

      {/* le match plein écran, ouvert par l'étiquette « on dit où. » */}
      {onglet === 'cesoir' && matchSortir && (
        <div className="cercle">
          <button className="lien fiche-retour" onClick={() => setMatchSortir(false)}>
            ← {t('sortir')}
          </button>
          <Groupe lieux={lieux} onOuvrir={(l) => ouvrirFiche(l, lieux)} rejoindre={matchRejoint} />
        </div>
      )}

      {onglet === 'cesoir' && !matchSortir && (
        <>
          {estCeLeGrandJeudi(new Date()) && (
            <BanniereGrandJeudi onOuvrir={() => setGjOuvert(true)} />
          )}
          <CeSoir
            lieux={mesLieux}
            onVoir={(l) => ouvrirFiche(l, mesLieux)}
            onComparer={(ids) => {
              setComparer(ecrireComparer(ids))
              setCompaOuverte(true)
            }}
            onMatch={() => setMatchSortir(true)}
            encart={
              /* la porte du match — SOUS le cœur solo (le rituel d'abord),
                 bandeau de reprise si un vote vit (le mien ou un du cloud) */
              <BandeauMatch
                onOuvrir={(m) => {
                  setMatchRejoint(m)
                  setMatchSortir(true)
                }}
              />
            }
          />
        </>
      )}

      {/* « trouver » : l'ex-recherche du labo, promue onglet à part entière */}
      {onglet === 'trouver' && (
        <>
          {estCeLeGrandJeudi(new Date()) && (
            <BanniereGrandJeudi onOuvrir={() => setGjOuvert(true)} />
          )}
          <Recherche lieux={lieux} cercle={cerclePourTri} onOuvrir={(l) => ouvrirFiche(l, lieux)} />
        </>
      )}

      {onglet === 'profil' && (
        <div className="cercle profil-vue">

          {/* ① la page de garde : « ce carnet appartient à — », le prénom
              par-dessus une ligne pointillée, les stats en mono sur UNE ligne */}
          <p className="profil-garde-phrase">{t('ce carnet appartient à —')}</p>
          <div className="profil-garde">
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
              <img className="profil-id-photo" src={photoUrl ?? portraitDefaut} alt={t('ton portrait')} />
              <span className="profil-id-tampon">{prenom}</span>
              <span className="mono profil-id-changer">
                <IAppareil taille={11} /> {t('changer')}
              </span>
              {/* pas de `capture` : sur téléphone il FORÇAIT l'appareil photo et
                  supprimait « choisir dans la photothèque ». On laisse le
                  système proposer les deux — un portrait, ça se choisit. */}
              <input type="file" accept="image/*" hidden onChange={changerPhotoProfil} />
            </label>

            <div className="profil-garde-droite">
              {/* le prénom : la main (Caveat), posée sur la ligne pointillée */}
              <div className="hand profil-garde-nom">{prenom}</div>
              <div className="mono profil-garde-meta">
                {ageDepuis(naissance) != null ? `${ageDepuis(naissance)} ${t('ans')} · ` : ''}
                {t('depuis')} {formatDepuis(depuis)}
              </div>
              <div className="profil-stats">
                {/* mes spots à MOI (pas ceux du cercle) */}
                <StatProfil n={mesSpots.length} l={t('spots')} />
                <StatProfil n={mesSpots.filter((x) => x.tampon?.v === 'valide').length} l={t('validés')} />
                {/* MÊME source que le toggle : lesProches() (état) — bouge en direct */}
                <StatProfil
                  n={`${proches.length}/${CAP_PROCHES}`}
                  l={t('super potes')}
                  onClick={allerAuCercle}
                />
              </div>
              {/* machine à photos : la ligne sobre — jamais de pourcentage */}
              <div className="mono profil-visages">
                {mesSpots.length} {t('spots')} ·{' '}
                {mesSpots.filter((x) => x.photos.length > 0).length} {t('ont un visage')}
              </div>
            </div>
          </div>

          {/* mes infos : LE critère du membre — son obsession, singulier
              (CONCEPT.md « Les critères »). Se déclare ici, skippable (la
              valeur d'onboarding suffit tant qu'on n'y touche pas). ≠ la
              liste « mes critères » juste en dessous (des dimensions de
              jugement, fonctionnalité distincte) et ≠ `critere_perso` d'un
              Lieu (le verdict d'un membre SUR un lieu, pas sur lui-même). */}
          <TitreSection>{t('mes infos')}</TitreSection>
          <label className="profil-insta mono profil-obsession">
            {t('ton obsession')}
            <input
              value={critere}
              maxLength={CRITERE_MAX}
              placeholder={t('le bruit, la lumière, les chaises…')}
              onChange={(e) => setCritere(e.target.value)}
              onBlur={() => sauverBioInsta()}
            />
          </label>

          {/* ② mes critères : des lignes du registre, plus de boîte */}
          <TitreSection>{t('mes critères')}</TitreSection>
          <div className="profil-criteres">
            {criteres.map((c) => (
              <div key={c.id} className="profil-critere-ligne">
                <span className="profil-critere-nom">{c.nom}</span>
                <span className="profil-critere-droite">
                  {/* les pastilles ●●○ à l'encre — jamais d'étoiles (DA) */}
                  <span className={`mono profil-critere-apercu ${c.type === 'gradue' ? 'gradue' : ''}`}>
                    {apercuCritere(c.type)}
                  </span>
                  <button
                    className="profil-critere-suppr"
                    onClick={() => setCriteres(supprimerCritere(c.id))}
                    aria-label={t('supprimer')}
                  >
                    ✕
                  </button>
                </span>
              </div>
            ))}

            <div className="profil-critere-ajout">
              <input
                className="profil-critere-input"
                value={nouvCrit}
                onChange={(e) => setNouvCrit(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ajoutCritere()}
                placeholder={t('un critère… (le bruit, les cocktails)')}
              />
              <button
                className="mono profil-critere-btn"
                onClick={() => setNouvType((t) => (t === 'gradue' ? 'binaire' : 'gradue'))}
                title={t('bascule le type')}
              >
                {nouvType === 'gradue' ? t('●●○ gradué') : t('oui/non')}
              </button>
              <button className="mono profil-critere-btn" onClick={ajoutCritere}>
                {t('+ ajouter')}
              </button>
            </div>
          </div>

          {/* ③ mes super potes : des ex-libris (initiale au tampon graphite) */}
          <TitreSection>
            {t('mes super potes')} · {proches.length}/{CAP_PROCHES}
          </TitreSection>
          <div className="profil-potes">
            {membresCercle.filter((m) => proches.includes(m.id)).map((m) => (
              <button key={m.id} className="profil-pote" onClick={allerAuCercle}>
                {m.photoUrl ? (
                  <img className="exlibris-initiale exlibris-photo" src={m.photoUrl} alt="" loading="lazy" onError={photoIndisponible} />
                ) : (
                  <span className="exlibris-initiale">{m.prenom[0]}</span>
                )}
                <span className="mono profil-pote-nom">{m.prenom}</span>
              </button>
            ))}
            <button className="profil-pote" onClick={allerAuCercle}>
              {/* la place vide : un ex-libris pas encore frappé */}
              <span className="exlibris-initiale vide">+</span>
              <span className="mono profil-pote-nom">{t('ajouter')}</span>
            </button>
          </div>

          <TitreSection>{t('ta vitrine')}</TitreSection>
          <label className="profil-tagline-edit">
            <input
              className="profil-tagline"
              placeholder={t('ex. « le roi du dernier verre »')}
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
              placeholder={t('ta bio — qui tu es, ce que tu cherches le soir…')}
              value={bio}
              maxLength={160}
              rows={2}
              onChange={(e) => setBio(e.target.value)}
              onBlur={() => sauverBioInsta()}
            />
            <label className="profil-insta mono">
              @
              <input
                placeholder={t('ton insta')}
                value={insta}
                onChange={(e) => setInsta(e.target.value)}
                onBlur={() => sauverBioInsta()}
              />
            </label>
          </div>

          {/* la carte de membre : TON carnet devient un objet à poster —
              portrait, identité, tes preuves. Le lien d'invitation part
              dans le presse-papier (une image de story ne clique pas). */}
          <button
            className="lien fiche-story"
            onClick={() => {
              void (async () => {
                const p = await lireProfil()
                const miens = lieux.filter((l) => estAMoi(l))
                try {
                  await navigator.clipboard.writeText(lienInvitation())
                } catch {
                  /* presse-papier indisponible : la carte part quand même */
                }
                const { partagerMaCarte } = await import('./partageStory')
                const ok = await partagerMaCarte({
                  prenom: p?.prenom?.trim() || 'moi',
                  tagline: tagline.trim() || undefined,
                  critere: p?.critere?.trim() || undefined,
                  nbSpots: miens.length,
                  portrait: photoUrl ?? undefined,
                  tirages: miens
                    .flatMap((l) => l.photos.map((ph) => srcPhoto(ph)))
                    .filter(Boolean)
                    .slice(0, 3),
                  tip: (() => {
                    const avec = miens.find((l) => l.note.trim())
                    return avec ? { note: avec.note, lieu: avec.nom } : undefined
                  })(),
                })
                if (ok) setFlash(t('ton lien d’invitation est copié — colle-le en sticker sur ta story.'))
                suivre('carte_membre_partagee')
              })()
            }}
          >
            {t('partage ton carnet en story →')}
          </button>

          <TitreSection>{t('réglages')}</TitreSection>
          <Reglages
            lieux={lieux}
            cercle={cercleReel}
            demandes={demandes}
            sorties={sorties}
            amisArchives={amisArchives}
            onBasculerAmi={(id) => setAmisArchives(basculerAmiArchive(id))}
            onRestaurer={(l) => {
              void majLieu({ ...l, statut: 'actif' }).then(recharger)
              setFlash(`${l.nom} ${t('revient sur ta carte.')}`)
            }}
            onVoir={(l) => ouvrirFiche(l, lieux)}
            onGrandJeudi={() => setGjOuvert(true)}
          />

          <button
            className="lien"
            onClick={() => {
              reinitOnboarding()
              window.location.reload()
            }}
          >
            {t("refaire l'accueil (le swipe, c'est ta langue ?)")}
          </button>
        </div>
      )}

      {/* le match de groupe (ex-labo « avec mes potes ») vit ici : l'étiquette
          en tête du cercle ouvre le parcours composer → trianguler → swiper → match */}
      {onglet === 'cercle' && !curateur && sortieGroupe && (
        <div className="cercle">
          <button
            className="lien fiche-retour"
            onClick={() => {
              setSortieGroupe(false)
              setGraineGroupe(null)
            }}
          >
            ← le cercle
          </button>
          <Groupe
            lieux={lieux}
            graine={graineGroupe}
            onOuvrir={(l) => ouvrirFiche(l, lieux)}
          />
        </div>
      )}

      {onglet === 'cercle' && !curateur && !sortieGroupe && (
        <div className="cercle">
          {/* sortir à plusieurs : l'entrée du match de groupe, une étiquette papier */}
          <button
            className="inviter-pote sortir-groupe"
            onClick={() => {
              setGraineGroupe(null)
              setSortieGroupe(true)
            }}
          >
            {t('on dit où.')} →
          </button>

          {/* LES SOIRS DU CERCLE (§7) — la lecture humaine de la pellicule,
              au-dessus de l'annuaire. On ne l'affiche pas à un cercle vide :
              l'ex-libris fantôme, plus bas, dit déjà quoi faire. */}
          {(carnetCercle.total > 0 || cercleReel.length > 0) && (
            <CarnetCercle
              nuits={carnetCercle.nuits}
              total={carnetCercle.total}
              onJyVais={(id) => {
                const l = lieux.find((x) => x.id === id)
                if (l) ouvrirFiche(l, lieux)
              }}
              onGarder={(id) => {
                const l = lieux.find((x) => x.id === id)
                if (l) void adopter(l)
              }}
              onRetourner={(id) => {
                // le match de groupe déjà en prod, avec ce spot déjà en lice
                setGraineGroupe(lieux.find((x) => x.id === id) ?? null)
                setSortieGroupe(true)
              }}
            />
          )}

          {/* l'annuaire commence ici — il lui fallait un titre, maintenant
              qu'une section vit au-dessus */}
          <h2 className="labo-titre annuaire-titre">{t('ton cercle.')}</h2>
          {membresCercle.length > 0 && (
            <p className="mono cercle-compteur">
              {membresCercle.length} membre{membresCercle.length > 1 ? 's' : ''} ·{' '}
              {proches.length}/{CAP_PROCHES} super potes
            </p>
          )}
          <ul className="membres">
            {membresCercle.map((m) => {
              // un vrai membre POSSÈDE ses spots (owner_id)
              const nbSpots = lieux.filter((l) => l.proprietaire === m.id).length
              const estPro = proches.includes(m.id)
              return (
                // l'ex-libris (V5 §7) : initiale au tampon graphite (la seule
                // exception ronde), prénom serif, critère mono — et le sceau
                // de cire discret à droite quand c'est un super pote
                <li
                  key={m.id}
                  className="membre"
                  role="button"
                  tabIndex={0}
                  onClick={() => setCurateur(m.prenom)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setCurateur(m.prenom)
                    }
                  }}
                >
                  {/* le portrait quand il existe (dans l'anneau graphite de
                      l'ex-libris) — sinon l'initiale frappée, jamais un avatar bidon */}
                  {m.photoUrl ? (
                    <img
                      className="exlibris-initiale exlibris-photo"
                      src={m.photoUrl}
                      alt=""
                      loading="lazy"
                      onError={photoIndisponible}
                    />
                  ) : (
                    <span className="exlibris-initiale">{m.prenom[0]}</span>
                  )}
                  <div className="membre-corps">
                    <div className="membre-tete">
                      <span className="membre-nom">{m.prenom}</span>
                      {/* le sceau : cire posée = super pote · empreinte vide = à sceller.
                          l'anneau intérieur — jamais d'étoile (DA) */}
                      <button
                        className={`membre-sceau ${estPro ? 'scelle sceau-cire' : ''}`}
                        aria-pressed={estPro}
                        aria-label={
                          estPro
                            ? `retirer ${m.prenom} de tes super potes`
                            : `faire de ${m.prenom} un super pote`
                        }
                        title={estPro ? 'super pote — toucher pour retirer' : '+ super pote'}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleProche(m.id)
                        }}
                      >
                        <IAnneau taille={18} />
                      </button>
                    </div>
                    {/* règle d'or §5 : la bio (la main du pote) reste en Caveat ;
                        le fallback système parle en serif italic */}
                    {m.bio ? (
                      <p className="hand membre-bio">{m.bio}</p>
                    ) : (
                      <p className="membre-bio membre-bio-vide">nouveau dans ton cercle.</p>
                    )}
                    <p className="mono membre-critere">
                      {m.critere ? `son truc : ${m.critere} · ` : ''}voir ses {nbSpots} spots →
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
          {/* cercle vide : l'ex-libris fantôme — la place du premier pote,
              déjà encadrée en pointillés (un état vide qui donne envie) */}
          {membresCercle.length === 0 && (
            <button className="membre-fantome" onClick={inviterUnPote}>
              <span className="exlibris-initiale vide" aria-hidden="true">
                ?
              </span>
              <span className="membre-corps membre-fantome-corps">
                <span className="membre-nom membre-nom-fantome">ton premier pote ici</span>
                <span className="membre-bio membre-bio-vide">
                  son prénom, ses spots, ses tips — dès qu'il accepte ton lien.
                </span>
              </span>
            </button>
          )}
          {/* la note en marge : un cercle sans vrai membre, ça s'invite */}
          {cercleReel.length === 0 && (
            <NoteMarge id="cercle-invite" fleche="bas" className="note-marge-cercle" />
          )}
          {/* retrouver quelqu'un qui a déjà l'app : recherche par prénom */}
          <ChercherAmis idsCercle={cercleReel.map((m) => m.id)} />
          {/* LE canal de croissance : l'étiquette papier, mise en avant */}
          <button className="inviter-pote" onClick={inviterUnPote}>
            invite un pote dans ton cercle →
          </button>
        </div>
      )}

      {onglet === 'cercle' && curateur && (
        <CarteCurateur
          curateur={curateur}
          lieux={lieux}
          vus={vus}
          reels={cercleReel}
          onVoir={(l) => {
            // un vrai membre possède ses spots ; le décor vit dans les tips
            const reel = cercleReel.find((m) => m.prenom === curateur)
            ouvrirFiche(
              l,
              reel
                ? lieux.filter((x) => x.proprietaire === reel.id)
                : lieux.filter((x) => x.tipsCercle?.some((t) => t.auteur === curateur)),
            )
          }}
          onRetirer={async (m) => {
            try {
              await retirerDuCercle(m.id)
            } catch (e) {
              setFlash((e as Error).message)
              return
            }
            setCurateur(null)
            setFlash(`@${m.prenom.toLowerCase()} n'est plus dans ton cercle.`)
            chargerCercle()
            recharger()
          }}
          onBloquer={async (m) => {
            try {
              await bloquerMembre(m.id)
            } catch (e) {
              setFlash((e as Error).message)
              return
            }
            setCurateur(null)
            // silencieux pour l'autre ; pour toi : la porte de sortie est dite
            setFlash('c’est fait. tu peux te dédire dans les réglages.')
            chargerCercle()
            recharger()
          }}
          onFermer={() => setCurateur(null)}
        />
      )}

      {/* le grand jeudi — plein écran, comme un voile posé sur tout (la fiche
          d'un lieu, rendue APRÈS, passe par-dessus quand on en ouvre un) */}
      {gjOuvert && (
        <div className="fiche gj-plein">
          <button className="lien fiche-retour" onClick={() => setGjOuvert(false)}>
            ← revenir
          </button>
          <GrandJeudi lieux={lieux} onOuvrir={(l) => ouvrirFiche(l, lieux)} />
        </div>
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
          reels={cercleReel}
          onAuVote={lireSortieActive() || matchRejoint ? (l) => void ajouterAuVote(l) : undefined}
          favori={favoris.includes(fiche.id)}
          onFavori={() => basculerFav(fiche)}
          aTester={estATester(fiche, ratures)}
          onATester={() => basculerPile(fiche)}
          onSupprimer={supprimerDepuisFiche}
          onRayer={rayerDepuisFiche}
          onDeRayer={deRayerDepuisFiche}
          onNaviguer={naviguerFiche}
          onFermer={() => {
            setFiche(null)
            recharger()
          }}
          onCurateur={(nom) => {
            setFiche(null)
            allerAuCercle()
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
            setSorties((prev) => prev.filter((s) => s.lieuId !== aValider.lieuId))
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

      {/* LA PILE des toasts (audit P0, 12/08) : avant, les trois partageaient
          la même position fixe et s'écrasaient — archiver puis adopter dans
          les 5 s recouvrait le bouton « annuler ». Un seul conteneur fixe,
          ils s'empilent, chacun garde sa vie propre. */}
      <div className="toasts">
        {archive && (
          <div className="toast">
            <span className="mono">{t('archivé.')}</span>
            <button className="lien" onClick={annulerArchive}>
              {t('annuler')}
            </button>
          </div>
        )}
        {flash && (
          <div className="toast">
            <span className="mono">{flash}</span>
          </div>
        )}
        <ToastNouvelleVersion />
      </div>

      {!ajout && !fiche && (
        <nav className="navbas">
          <button
            className={`nav-item ${onglet === 'cesoir' ? 'actif' : ''}`}
            onClick={() => setOnglet('cesoir')}
            aria-label={lireSortieActive() ? 'sortir — un vote en cours' : 'ça dit quoi ce soir ?'}
          >
            <IEtincelle taille={24} />
            {/* la pastille cire : un vote de groupe vit quelque part */}
            {lireSortieActive() && <span className="nav-pastille" aria-hidden="true" />}
            <span className="nav-lbl">{t('sortir')}</span>
          </button>
          <button
            className={`nav-item ${onglet === 'trouver' ? 'actif' : ''}`}
            onClick={() => setOnglet('trouver')}
            aria-label="trouver"
          >
            <ILoupe taille={24} />
            <span className="nav-lbl">{t('trouver')}</span>
          </button>
          <button
            className={`nav-item ${onglet === 'macarte' ? 'actif' : ''}`}
            onClick={() => setOnglet('macarte')}
            aria-label="ma carte"
          >
            <ICarnet taille={24} />
            <span className="nav-lbl">{t('ma carte')}</span>
          </button>
          {/* le + AU MILIEU (Ersan, 12/08) : après « ma carte », avant « le
              cercle » — le geste fondateur au centre de la bande, à l'accent.
              Depuis un autre onglet il t'amène d'abord sur ta carte : un spot
              capturé atterrit toujours chez toi. */}
          <button
            className="nav-plus"
            onClick={() => {
              setOnglet('macarte')
              setAjout(true)
            }}
            aria-label="capturer un lieu"
          >
            +
          </button>
          <button
            className={`nav-item ${onglet === 'cercle' ? 'actif' : ''}`}
            onClick={allerAuCercle}
            aria-label="le cercle"
          >
            <ICercle taille={24} />
            <span className="nav-lbl">{t('le cercle')}</span>
          </button>
          <button
            className={`nav-item ${onglet === 'profil' ? 'actif' : ''}`}
            onClick={() => setOnglet('profil')}
            aria-label="moi"
          >
            <ITampon taille={24} />
            <span className="nav-lbl">{t('moi')}</span>
          </button>
        </nav>
      )}
    </div>
  )
}

// la relance photos (machine à photos, bloc D) : UNE seule fois, jamais de
// culpabilisation — le drapeau se pose dès qu'elle a été montrée
const RELANCE_PHOTO_CLE = 'jeudi-relance-photo'

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
  const [etape, setEtape] = useState<'verdict' | 'tirage' | 'occasions' | 'tampon' | 'relance'>(
    'verdict',
  )
  // les tirages repêchés dans la pellicule (étape « et le tirage ? »)
  const [tiragesSoir, setTiragesSoir] = useState<PhotoLieu[]>([])
  // pré-cochés avec ce que le carnet sait déjà — et tout reste modifiable
  const [tags, setTags] = useState<string[]>(() => [
    ...(lieu?.compagnies ?? []),
    ...(lieu?.envies ?? []),
  ])
  // le spot est-il à moi ? à moi → ma note ; à un VRAI spot cloud d'un autre
  // → MON tip cloud (table `tips`) — jamais la note du proprio dans mon champ.
  // le décor du seed ('karim', 'pub-…') n'existe PAS dans la table `lieux` :
  // son tip reste local (lieu.note), comme avant les tips réels.
  const mien = lieu ? estAMoi(lieu) : true
  const spotCloud =
    lieu != null && !mien && !!lieu.proprietaire && estUuid(lieu.proprietaire) && estUuid(lieu.id)
  const [tip, setTip] = useState(() => (lieu ? (spotCloud ? monTipDans(lieu) : lieu.note) : ''))
  // l'échec d'envoi du tip cloud : message VISIBLE (pas de file muette)
  const [erreurTip, setErreurTip] = useState('')
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

  // la photo montrée sur les écrans qui suivent : le tirage choisi d'abord
  // (c'est LUI qu'on vient de désigner comme couverture), sinon les preuves
  const couverture = tiragesSoir[0] ?? photos[0] ?? lieu?.photos[0]


  // la réponse est donnée (valide OU bof) : la note en marge a fait son travail
  const repondu = () => effacerNote('valider-carnet')

  // même un "bof" est du signal : on le garde — et le tampon le dit
  const bof = async () => {
    repondu()
    ajouterBof(sortie.lieuId)
    if (lieu)
      await majLieu({
        ...lieu,
        tampon: { v: 'bof', x: 50, y: 35, qui: prenom, date: dateCourte },
      })
    onFini()
  }

  // le lieu tel qu'il vient d'être enregistré (base de la relance photos)
  const enregistreRef = useRef<Lieu | null>(null)
  // les clichés pris PENDANT la relance (après le tampon)
  const [photosRelance, setPhotosRelance] = useState<PhotoLieu[]>([])

  const terminer = async () => {
    let sansVisage = false
    if (lieu) {
      // le spot d'un autre (cercle RÉEL) : mon tip part dans la table `tips`
      // (l'autre voix) — échec = message visible, on reste là et on peut
      // retaper. Tip inchangé = RIEN à envoyer : la validation aboutit même
      // hors-ligne, et jamais d'appel cloud pour le décor du seed.
      if (spotCloud && tip.trim() !== monTipDans(lieu)) {
        try {
          await ecrireTip(lieu.id, tip.trim())
          setErreurTip('')
        } catch (e) {
          setErreurTip((e as Error).message)
          return
        }
      }
      // on AJOUTE les nouvelles photos (on ne remplace jamais les anciennes du
      // même type) — deux budgets séparés : les preuves de la fiche ne se font
      // jamais chasser par les tirages du soir, qui s'empilent soirée après soirée
      const photosFusion = fusionnerPhotos(lieu.photos, [...photos, ...tiragesSoir])
      const maj: Lieu = {
        ...lieu,
        // le champ tip reflète l'état final : vidé → le tip s'efface (note: '')
        // — la note d'un spot du cercle RÉEL reste LA voix de son proprio ;
        // sur le décor (seed), ma note vit en local comme avant
        note: spotCloud ? lieu.note : tip.trim(),
        photos: photosFusion,
        // les cases reflètent l'état final : cocher ajoute, décocher corrige
        envies: tags.filter((t) => (ENVIES as readonly string[]).includes(t)) as Lieu['envies'],
        compagnies: tags.filter((t) =>
          (COMPAGNIES as readonly string[]).includes(t),
        ) as Lieu['compagnies'],
        derniereValidation: new Date().toISOString(),
        tampon: { v: 'valide', ...tampon, qui: prenom, date: dateCourte },
        propreteWc: propreteWc ?? lieu.propreteWc,
        recos,
      }
      await majLieu(maj)
      enregistreRef.current = maj
      // la machine à photos : validation finie SANS aucun cliché sur MON spot
      sansVisage = estAMoi(lieu) && photosFusion.length === 0
    }
    // la relance douce, UNE seule fois — jamais de reproche, juste la porte
    if (sansVisage && !localStorage.getItem(RELANCE_PHOTO_CLE)) {
      localStorage.setItem(RELANCE_PHOTO_CLE, 'vue')
      setEtape('relance')
      return
    }
    onFini()
  }

  // fin de la relance : on colle les clichés pris (s'il y en a) puis on sort
  const finirRelance = async () => {
    const base = enregistreRef.current
    if (base && photosRelance.length > 0) {
      await majLieu({ ...base, photos: fusionnerPhotos(base.photos, photosRelance) })
    }
    onFini()
  }

  return (
    <div className="fiche validation">
      <p className="mono">
        {t("l'autre soir")} · {new Date(sortie.date).toLocaleDateString('fr-FR')}
        {total > 1 && ` · ${pos}/${total}`}
      </p>
      {etape === 'verdict' ? (
        <>
          <h1 className="grande-question">{t('alors,')} {sortie.nom} ?</h1>
          {/* la note en marge : c'est ici que le carnet change de main */}
          <NoteMarge id="valider-carnet" className="note-marge-validation" />
          {lieu && (
            <div
              className="carte-lieu fiche-carte validation-carte"
              style={{
                transform: `translateX(${vDrag.x}px) rotate(${vDrag.x / 20}deg)`,
                transition: vDrag.actif ? 'none' : 'transform 240ms var(--pose)',
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
                if (vDrag.x > 90) {
                  repondu()
                  setEtape('tirage')
                } else if (vDrag.x < -90) bof()
                setVDrag({ x: 0, actif: false })
              }}
            >
              {vDrag.x > 60 && <span className="tampon valide">{t('VALIDÉ')}</span>}
              {vDrag.x < -60 && <span className="tampon bof">{t('bof')}</span>}
              <div className="carte-photo">
                {lieu.photos[0] ? (
                  <img src={srcPhoto(lieu.photos[0])} alt={lieu.nom} onError={photoIndisponible} />
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
          <p className="mono validation-aide">{t('← bof · je valide →  (ou les boutons)')}</p>
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
              {bofSur ? t('sûr ? re-tape.') : t('bof')}
            </button>
            <button
              className="valider"
              onClick={() => {
                repondu()
                setEtape('tirage')
              }}
            >
              {t('je valide')}
            </button>
          </div>
          <div className="validation-secondaires">
            <button className="lien" onClick={onFini}>
              {t("j'y suis pas allé — oublie")}
            </button>
            <button className="lien" onClick={onPlusTard}>
              {t('redemande-moi plus tard')}
            </button>
          </div>
        </>
      ) : etape === 'tirage' ? (
        // « et le tirage ? » — on repêche la nuit dans la pellicule du
        // téléphone AVANT de raconter : c'est le pic, juste après le swipe.
        <TirageDuSoir
          nomLieu={sortie.nom}
          dateSortie={sortie.date}
          mien={mien}
          onFini={(tirages) => {
            setTiragesSoir(tirages)
            setEtape('occasions')
          }}
          onPasser={() => setEtape('occasions')}
        />
      ) : etape === 'occasions' ? (
        <>
          <button className="lien retour-etape" onClick={() => setEtape('tirage')}>
            {t('← revenir au tirage')}
          </button>
          <h1 className="grande-question">{t('validé. raconte.')}</h1>

          {lieu && (
            <div className="carte-lieu fiche-carte validation-carte">
              <div className="carte-photo">
                {couverture ? (
                  <img src={srcPhoto(couverture)} alt={lieu.nom} onError={photoIndisponible} />
                ) : (
                  <div className="tirage-vide">
                    <span className="croix">✕</span>
                    <span className="hand sans-photo">{lieu.nom}</span>
                  </div>
                )}
              </div>
              <div className="carte-nom">{lieu.nom}</div>
              {/* le tip s'écrit directement sous la photo, comme une légende */}
              <textarea
                className="validation-tip legende"
                placeholder={t('ton tip pour réussir ce lieu — table du fond, demande Momo…')}
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

          <p className="hand onboard-sous">{t("tu l'as fait comment ?")}</p>
          <p className="mono validation-aide">
            {t(
              "tape : je l'ai fait comme ça (rouge) · reste appuyé : les conditions optimales, je recommande (orange).",
            )}
          </p>
          <div className="rangée">
            <span className="lbl mono">{t('avec qui ?')}</span>
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
            <span className="lbl mono">{t('pour quoi ?')}</span>
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
            {t("c'est dit.")}
          </button>
        </>
      ) : etape === 'tampon' ? (
        <>
          <button className="lien retour-etape" onClick={() => setEtape('occasions')}>
            {t('← corriger le récit')}
          </button>
          <h1 className="grande-question">{t('à toi de tamponner.')}</h1>

          {lieu && (
            <div
              className="carte-lieu fiche-carte validation-carte tampon-cible"
              onPointerDown={tamponDown}
              onPointerMove={tamponMove}
              onPointerUp={tamponUp}
              onPointerCancel={tamponUp}
            >
              <div className="carte-photo">
                {couverture ? (
                  <img src={srcPhoto(couverture)} alt={lieu.nom} onError={photoIndisponible} />
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
            {t('tape où tu veux — même sur le blanc. chaque tape, un coup de tampon.')}
          </p>
          {erreurTip && <p className="mono validation-erreur">{erreurTip}</p>}
          <button className="valider" onClick={terminer}>
            {t('tamponné.')}
          </button>
        </>
      ) : (
        <>
          {/* la relance douce (machine à photos) : glissée UNE fois, après un
              tampon sans cliché — le ton du carnet, zéro culpabilisation */}
          <h1 className="grande-question">{t('3 clichés, 30 secondes —')}</h1>
          <p className="hand relance-sous">{t('et le spot a un visage.')}</p>
          <KitPhotos photos={photosRelance} setPhotos={setPhotosRelance} />
          <div className="validation-secondaires">
            {photosRelance.length > 0 ? (
              <button className="valider" onClick={finirRelance}>
                {t("c'est dans la boîte.")}
              </button>
            ) : (
              <button className="lien" onClick={onFini}>
                {t('plus tard')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── la carte d'un curateur : les spots d'un VRAI membre du cercle ──
// bloc D : plus de faux profil curateur — cette carte ne s'ouvre que pour
// une relation acceptée (les voix « démo » du décor restent de simples
// signatures texte sur les fiches, sans profil derrière)
function CarteCurateur({
  curateur,
  lieux,
  vus,
  reels,
  onVoir,
  onRetirer,
  onBloquer,
  onFermer,
}: {
  curateur: string
  lieux: Lieu[]
  vus: Set<string>
  /** les vrais membres du cercle (relations acceptées) */
  reels: MembreCercle[]
  onVoir: (l: Lieu) => void
  /** retirer un VRAI membre de mon cercle (la relation part) */
  onRetirer: (m: MembreCercle) => void
  /** bloquer (0019) : il ne me voit plus, je ne le vois plus — silencieux */
  onBloquer: (m: MembreCercle) => void
  onFermer: () => void
}) {
  const reel = reels.find((m) => m.prenom === curateur)
  // un vrai membre POSSÈDE ses spots (owner_id)
  const spots = reel ? lieux.filter((l) => l.proprietaire === reel.id) : []
  const [vue, setVue] = useState<'liste' | 'carte'>('liste')
  const [confirmRetrait, setConfirmRetrait] = useState(false)
  const [confirmBloquer, setConfirmBloquer] = useState(false)

  // garde-fou : la personne a quitté (ou n'a jamais été dans) mon cercle
  if (!reel) {
    return (
      <div className="cercle carte-curateur">
        <button className="lien fiche-retour" onClick={onFermer}>
          ← le cercle
        </button>
        <p className="hand vide">ce carnet n'est pas dans ton cercle.</p>
      </div>
    )
  }

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
          {reel.photoUrl ? (
            <img className="profil-id-photo" src={reel.photoUrl} alt={curateur} onError={photoIndisponible} />
          ) : (
            // vrai membre sans portrait : l'initiale — jamais une fausse photo
            <span
              className="profil-id-photo"
              style={{ display: 'grid', placeItems: 'center', fontStyle: 'italic', fontSize: 34 }}
              aria-label={curateur}
            >
              {curateur[0]}
            </span>
          )}
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
          {reel.critere && (
            <div>
              <dt>critère</dt>
              <dd>{reel.critere.replace(/^(le |la |les |l')/, '')}</dd>
            </div>
          )}
          {reel.insta && (
            <div>
              <dt>insta</dt>
              <dd>@{reel.insta}</dd>
            </div>
          )}
        </dl>
      </div>
      {/* SES preuves : une bande de tirages penchés, tirée de ses spots */}
      {(() => {
        const tirages = spots.flatMap((s) => s.photos).slice(0, 4)
        return tirages.length > 0 ? (
          <div className="membre-tirages">
            {tirages.map((p, i) => (
              <img key={i} src={srcPhoto(p)} alt="" loading="lazy" onError={photoIndisponible} />
            ))}
          </div>
        ) : null
      })()}
      {reel.bio && <p className="hand curateur-bio">{reel.bio}</p>}
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
              // son tip = la note du spot (il en est l'auteur)
              const tip = l.note ? { note: l.note } : undefined
              return (
                <li key={l.id} className="lieu">
                  <div
                    className="lieu-ligne"
                    role="button"
                    tabIndex={0}
                    onClick={() => onVoir(l)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onVoir(l)
                      }
                    }}
                  >
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

      {/* retirer un membre — deux taps, jamais silencieux */}
      <button
        className={`lien retirer-cercle ${confirmRetrait ? 'confirm' : ''}`}
        onClick={() => (confirmRetrait ? onRetirer(reel) : setConfirmRetrait(true))}
      >
        {confirmRetrait
          ? `sûr ? @${reel.prenom.toLowerCase()} sortira de ton cercle.`
          : 'retirer de mon cercle'}
      </button>
      {/* bloquer (0019) — la porte qu'on ferme : retirer ne suffit pas, un
          retiré peut re-demander et voit toujours le carnet public. Deux taps.
          Libellé provisoire « bloquer » — le mot de marque se tranche à part. */}
      <button
        className={`lien retirer-cercle ${confirmBloquer ? 'confirm' : ''}`}
        onClick={() => (confirmBloquer ? onBloquer(reel) : setConfirmBloquer(true))}
      >
        {confirmBloquer
          ? `sûr ? @${reel.prenom.toLowerCase()} ne te verra plus — et toi non plus.`
          : 'bloquer'}
      </button>
    </div>
  )
}

// ── le toast « nouvelle version » — autonome (12/08). Il porte son propre
// état pour vivre AUSSI sur l'écran d'auth, et il relit majEnAttente() au
// montage : l'événement du service worker peut partir avant lui (course du
// boot, trouvée au test de la bascule injectManifest).
function ToastNouvelleVersion() {
  const [dispo, setDispo] = useState(() => majEnAttente())
  useEffect(() => {
    const onMaj = () => setDispo(true)
    window.addEventListener('jeudi:maj-dispo', onMaj)
    return () => window.removeEventListener('jeudi:maj-dispo', onMaj)
  }, [])
  if (!dispo) return null
  return (
    <div className="toast">
      <span className="mono">{t('nouvelle version.')}</span>
      <button
        className="lien"
        onClick={() => {
          // main.tsx applique (skipWaiting) puis recharge — sur CE clic, pas au boot
          setDispo(false)
          window.dispatchEvent(new Event('jeudi:applique-maj'))
        }}
      >
        {t('recharger')}
      </button>
    </div>
  )
}

// ── « me prévenir » (0020) : l'interrupteur du push, dans le centre de
// notifications — là où on pense aux notifications, pas perdu aux réglages.
// La permission n'est demandée QUE sur le tap. Rare et précieux : la ligne
// éditoriale du push vit côté envoyeur (Edge Function), ici on ne fait
// qu'ouvrir ou fermer la porte de CET appareil.
function PousserMoi() {
  const [etat, setEtat] = useState<EtatPush | 'lecture' | 'encours'>('lecture')
  const [erreur, setErreur] = useState<string | null>(null)
  useEffect(() => {
    void etatPush().then(setEtat)
  }, [])
  const basculer = async () => {
    if (etat !== 'coupe' && etat !== 'active') return
    const avant = etat
    setEtat('encours')
    setErreur(null)
    try {
      if (avant === 'coupe') await activerPush()
      else await couperPush()
      setEtat(await etatPush())
    } catch (e) {
      setErreur((e as Error).message)
      setEtat(await etatPush())
    }
  }
  if (etat === 'lecture') return null
  return (
    <div className="notif-section notif-push">
      <span className="notif-titre mono">me prévenir</span>
      {etat === 'indisponible' ? (
        <p className="hand notif-vide">
          {conseilIphone()
            ? 'sur iPhone : installe d’abord jeudi sur l’écran d’accueil (partager → sur l’écran d’accueil).'
            : 'ce navigateur ne sait pas prévenir quand l’app est fermée.'}
        </p>
      ) : etat === 'refuse' ? (
        <p className="hand notif-vide">
          le téléphone bloque les notifications de jeudi — ça se rouvre dans ses réglages.
        </p>
      ) : (
        <button className="notif-ligne notif-push-bascule hand" onClick={() => void basculer()}>
          <span>même app fermée — rare et précieux, promis.</span>
          <span className={`mono notif-push-etat ${etat === 'active' ? 'on' : ''}`}>
            {etat === 'encours' ? '…' : etat === 'active' ? 'oui' : 'non'}
          </span>
        </button>
      )}
      {erreur && <p className="hand notif-vide">{erreur}</p>}
    </div>
  )
}

// ── signaler une photo (0018) : le vrai formulaire, plus un mailto: mort ──
// Trois temps : replié → déplié (les mots, facultatifs) → « c'est noté. ».
// On confirme, on ne remercie pas, on ne promet aucun délai (ligne du chantier).
function SignalerPhoto({ lieu, position, total }: { lieu: Lieu; position: number; total: number }) {
  const [etat, setEtat] = useState<'plie' | 'ouvert' | 'envoi' | 'note'>('plie')
  const [texte, setTexte] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const envoyer = async () => {
    setEtat('envoi')
    setErreur(null)
    try {
      // la cible = le lieu + la position du tirage (les photos locales n'ont
      // pas d'id cloud stable) ; le contexte fige de quoi retrouver le fichier
      await signalerCible('photo', `${lieu.id}#${position}`, 'photo à retirer', texte, {
        lieu: lieu.nom,
        photo: position,
        sur: total,
      })
      setEtat('note')
    } catch (e) {
      setErreur((e as Error).message)
      setEtat('ouvert')
    }
  }
  if (etat === 'note') {
    return <p className="mono fiche-signaler">{t('c’est noté.')}</p>
  }
  return (
    <div className="mono fiche-signaler">
      {etat === 'plie' ? (
        <button className="lien signaler-ouvrir" onClick={() => setEtat('ouvert')}>
          {t('signaler cette photo')}
        </button>
      ) : (
        <>
          <textarea
            className="signaler-texte"
            rows={2}
            maxLength={1000}
            placeholder={t('pourquoi ? (facultatif)')}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
          />
          <span className="signaler-actions">
            <button className="lien" onClick={() => setEtat('plie')}>
              {t('annuler')}
            </button>
            <button
              className="lien signaler-envoyer"
              disabled={etat === 'envoi'}
              onClick={() => void envoyer()}
            >
              {etat === 'envoi' ? t('ça part…') : t('signaler')}
            </button>
          </span>
          {erreur && <p className="signaler-erreur">{erreur}</p>}
        </>
      )}
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
  reels,
  onAuVote,
  favori,
  onFavori,
  aTester,
  onATester,
  onSupprimer,
  onRayer,
  onDeRayer,
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
  /** les vrais membres du cercle (owner_id → prénom, « chez untel ») */
  reels: MembreCercle[]
  /** un match est ouvert → la fiche sait mettre ce spot au vote */
  onAuVote?: (l: Lieu) => void
  /** les états tenus par l'écran (signet, pile « à tester ») — la fiche les
   *  montre et les bascule, l'index les relit aussitôt */
  favori: boolean
  onFavori: () => void
  aTester: boolean
  onATester: () => void
  /** arracher la page : l'écran efface, refait l'index et referme la fiche */
  onSupprimer: (l: Lieu) => Promise<void>
  /** rayer / se dédire : l'écran écrit (local + cercle) et rallume la carte ;
   *  la fiche récupère la rayure posée pour se remettre à jour sans relire */
  onRayer: (l: Lieu, motif: string) => Promise<Lieu['raye']>
  onDeRayer: (l: Lieu) => Promise<void>
}) {
  const [lieu, setLieu] = useState(lieuInitial)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [agrandi, setAgrandi] = useState(false) // visionneuse photo plein écran
  // le switch de la visionneuse : la COUVERTURE (polaroid + gravure) par
  // défaut, la photo ENTIÈRE sur demande (les verticales que le carré coupe)
  const [vueNue, setVueNue] = useState(false)
  // le projecteur super 8 : la photo courante est un clip et on l'a tapé
  const [projection, setProjection] = useState(false)
  const zoomDepart = useRef({ x: 0, y: 0 })
  // le doigt a bougé (> 8px) entre down et up → c'est un feuilletage, pas un clic de fermeture
  const zoomBouge = useRef(false)
  // l'adresse complète (n° + rue + CP + ville) récupérée en live, sinon repli
  const [adrComplete, setAdrComplete] = useState('')
  const nbPhotos = lieu.photos.length

  useEffect(() => {
    // reset volontaire avant le fetch : on ne veut pas montrer l'adresse de
    // l'ancien lieu pendant que la nouvelle arrive (comportement voulu tel quel)
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // COMMENT TU RENTRES (10/08) — la réponse du panel : rien sur la carte, une
  // ligne ici, au moment où la question se pose. Chargé seulement quand une
  // fiche s'ouvre ; ni le Vélib' ni le Noctilien ne coûtent quoi que ce soit
  // à qui ne consulte pas de spot.
  const [rentrer, setRentrer] = useState<CommentRentrer | null>(null)
  useEffect(() => {
    if (lieu.lat === 0 && lieu.lng === 0) return
    let ok = true
    void commentRentrer({ lat: lieu.lat, lng: lieu.lng }).then((r) => {
      if (ok) setRentrer(r)
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
  // le spot appartient à un VRAI membre du cercle → « chez untel »
  const chez = mien ? null : prenomDe(lieu.proprietaire, reels)
  // le fond éditorial fondateur : sa note est signée « jeudi. » (pas « toi »,
  // pas un profil cliquable — c'est l'app, honnêtement, pas un faux membre)
  const editorial = !mien && !chez && lieu.proprietaire === CURATEUR_JEUDI
  const [edition, setEdition] = useState(false)
  // le crayon : corriger l'entrée elle-même (nom, adresse, tip, type, tampon)
  const [correction, setCorrection] = useState(false)
  // le bloc d'actions du bas (09/08) — visible sur TOUTE fiche, pas juste
  // les miennes : supprimer / rayer se posent en deux temps, jamais d'un
  // doigt qui glisse (même idiome que CorrigerLieu → arracher/rayer).
  const [confirmSupprFiche, setConfirmSupprFiche] = useState(false)
  const [enCoursSupprFiche, setEnCoursSupprFiche] = useState(false)
  const [rayerOuvertFiche, setRayerOuvertFiche] = useState(false)
  const [motifRayerFiche, setMotifRayerFiche] = useState('')
  const [enCoursRayerFiche, setEnCoursRayerFiche] = useState(false)
  const dist = distanceM(lieu)
  const horaire = etatHoraire(lieu.horaires)
  // la croix posée sur ce lieu est-elle LA MIENNE ? Le carnet local ne tient
  // que mes serments ; celle d'un pote arrive du cloud et ne s'y trouve pas —
  // elle se lit, elle ne se décroche pas.
  const maRayure = useMemo(() => !!lieu.raye && !!lireRayures()[lieu.id], [lieu.id, lieu.raye])
  // la date gravée sur la couverture : celle de la PHOTO regardée (prise_le,
  // migration 0010) — sinon la dernière validation du lieu, sinon rien
  const dateGravee = (() => {
    const iso = lieu.photos[photoIndex]?.priseLe ?? lieu.derniereValidation
    if (!iso) return null
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `${dd} ${mm} '${String(d.getFullYear() % 100).padStart(2, '0')}`
  })()
  const itineraire = `https://www.google.com/maps/dir/?api=1&destination=${lieu.lat},${lieu.lng}`

  const enregistrer = async (maj: Lieu) => {
    setLieu(maj)
    await majLieu(maj)
  }

  // SUPPRIMER, depuis le bloc du bas — sur MES spots ou ceux d'un pote (le
  // geste part alors vers onSupprimer, qui sait la différence : effacé pour
  // de vrai chez moi, simplement retiré de ma carte chez un pote — voir
  // supprimerLieu / masques.ts). onSupprimer referme la fiche derrière lui.
  const confirmerSupprFiche = async () => {
    if (enCoursSupprFiche) return
    setEnCoursSupprFiche(true)
    try {
      await onSupprimer(lieu)
    } finally {
      setEnCoursSupprFiche(false)
    }
  }

  // RAYER, depuis le bloc du bas — le serment marche déjà sur n'importe quel
  // spot (rayerLieu ne filtre pas par propriétaire) : ici on ne fait que
  // demander (deux temps) et recueillir le motif, comme CorrigerLieu.
  const confirmerRayerFiche = async () => {
    if (enCoursRayerFiche) return
    setEnCoursRayerFiche(true)
    try {
      const r = await onRayer(lieu, motifRayerFiche)
      setLieu({ ...lieu, raye: r })
      setRayerOuvertFiche(false)
      setMotifRayerFiche('')
    } finally {
      setEnCoursRayerFiche(false)
    }
  }

  const seDedireFiche = async () => {
    if (enCoursRayerFiche) return
    setEnCoursRayerFiche(true)
    try {
      await onDeRayer(lieu)
      setLieu({ ...lieu, raye: undefined })
    } finally {
      setEnCoursRayerFiche(false)
    }
  }

  // le tiroir : ranger / ressortir. On ne ferme pas la fiche — tant qu'elle
  // est ouverte, on peut se dédire ; l'index se refait à la fermeture.
  const basculerArchive = async () => {
    if (!mien) return
    const range = lieu.statut === 'archive'
    if (range) await desarchiverLieu(lieu.id)
    else await archiverLieu(lieu.id)
    setLieu({ ...lieu, statut: range ? 'actif' : 'archive' })
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

  // les étiquettes perso : libres, privées, à moi (0012)
  const ajouterEtiquette = async (texte: string) => {
    if (!mien) return
    const e = texte.trim()
    if (!e || (lieu.etiquettes ?? []).includes(e)) return
    await enregistrer({ ...lieu, etiquettes: [...(lieu.etiquettes ?? []), e] })
  }
  const retirerEtiquette = async (e: string) => {
    if (!mien) return
    const restantes = (lieu.etiquettes ?? []).filter((x) => x !== e)
    await enregistrer({ ...lieu, etiquettes: restantes.length ? restantes : undefined })
  }

  // le partage : si photo + tampon, le tampon s'IMPRIME dans l'image envoyée
  const partager = async () => {
    const texte = `${lieu.nom} — ${lieu.note || t("regarde où je t'emmène.")}\n${lieu.adresse ?? ''}\nhttps://maps.google.com/?q=${lieu.lat},${lieu.lng}\n${t('— dit sur Jeudi.')}`
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
        const racine = getComputedStyle(document.documentElement)
        const couleurMarque = racine.getPropertyValue('--red').trim() || '#5d8dff'
        // le « bof » suit le crayon graphite du carnet (token), pas un gris à part
        const couleurBof = racine.getPropertyValue('--graphite').trim() || '#8a857a'
        ctx.strokeStyle = t.v === 'valide' ? couleurMarque : couleurBof
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
      {/* le projecteur super 8 : la photo courante bouge et on l'a tapée */}
      {projection && nbPhotos > 0 && estClip(lieu.photos[photoIndex]) && (
        <Projecteur
          photo={lieu.photos[photoIndex]}
          nomLieu={lieu.nom}
          onFermer={() => setProjection(false)}
        />
      )}
      {/* visionneuse photo plein écran (bouton « agrandir ») — feuilletable */}
      {agrandi && nbPhotos > 0 && (
        <div
          className="photo-zoom"
          onClick={() => {
            // un geste de feuilletage ne ferme pas la visionneuse
            if (zoomBouge.current) {
              zoomBouge.current = false
              return
            }
            setAgrandi(false)
          }}
          onPointerDown={(e) => {
            zoomBouge.current = false
            zoomDepart.current = { x: e.clientX, y: e.clientY }
          }}
          onPointerUp={(e) => {
            const dx = e.clientX - zoomDepart.current.x
            const dy = e.clientY - zoomDepart.current.y
            if (Math.abs(dx) > 8 || Math.abs(dy) > 8) zoomBouge.current = true
            if ((Math.abs(dx) > 40 || Math.abs(dy) > 40) && nbPhotos > 1) {
              setPhotoIndex((p) =>
                dx < 0 || dy < 0 ? (p + 1) % nbPhotos : (p - 1 + nbPhotos) % nbPhotos,
              )
            }
          }}
        >
          <button
            className="photo-zoom-x mono"
            aria-label={t('fermer')}
            onClick={(e) => {
              e.stopPropagation()
              setAgrandi(false)
            }}
          >
            ✕
          </button>
          {/* le switch : couverture ↔ photo entière (les verticales) */}
          <button
            className="mono photo-zoom-switch"
            onClick={(e) => {
              e.stopPropagation()
              setVueNue((v) => !v)
            }}
          >
            {vueNue ? t('la couverture') : t('la photo entière')}
          </button>
          {vueNue && (
            <img
              className="photo-zoom-nue"
              src={srcPhoto(lieu.photos[photoIndex])}
              alt={lieu.nom}
              onError={photoIndisponible}
            />
          )}
          {/* LA COUVERTURE (banc d'essai trait_de_cire, test 1) : le polaroid,
              le nom à la main en travers, les infos du lieu GRAVÉES ambre
              comme le dateur des appareils 2000s. L'émotion au centre, les
              faits dans les coins. */}
          {!vueNue && (
          <div className="affiche">
            <span className="affiche-kraft" />
            <div className="affiche-photo">
              <img src={srcPhoto(lieu.photos[photoIndex])} alt={lieu.nom} onError={photoIndisponible} />
              <span className="affiche-grave ag-hg">
                {lieu.nom}
                <br />
                {t(labelTypeLieu(typeDeLieu(lieu)))}
                {/* le tampon de douane, en toutes lettres sur la couverture */}
                {cuisineDeLieu(lieu) ? ` · ${t(cuisineDeLieu(lieu)!.mot)}` : ''}
              </span>
              {horaire && horaire.ouvert !== undefined && (
                <span className="affiche-grave ag-hd">
                  {horaire.ouvert ? t('ouvert') : t('fermé')}
                  <br />
                  {horaire.texte.replace(/^[^·]*· /, '')}
                </span>
              )}
              <span className="affiche-grave ag-bg">{libelleTrajet(dist)}</span>
              {dateGravee && <span className="affiche-grave ag-bd">{dateGravee}</span>}
              <span className="affiche-nom">{lieu.nom}</span>
            </div>
            <div className="affiche-menton">
              {nbPhotos > 1 && (
                <div className="photo-tirets affiche-tirets">
                  {lieu.photos.map((_, i) => (
                    <span key={i} className={i === photoIndex ? 'on' : ''} />
                  ))}
                </div>
              )}
              <span className="mono affiche-colophon">
                jeudi. {nbPhotos > 1 ? `· ${photoIndex + 1}/${nbPhotos}` : ''}
              </span>
            </div>
          </div>
          )}
        </div>
      )}
      <div className="fiche-haut">
        <button className="lien fiche-retour" onClick={onFermer}>
          {t('← retour')}
        </button>
        {liste.length > 1 && idx >= 0 && (
          <div className="fiche-nav">
            <button
              className="fiche-nav-btn"
              aria-label={t('lieu précédent')}
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
              aria-label={t('lieu suivant')}
              disabled={!suivant}
              onClick={() => suivant && onNaviguer(suivant)}
            >
              ›
            </button>
          </div>
        )}
        {enCompa && (
          <button className="fiche-compa-go mono" onClick={onComparer}>
            {t('le tableau →')}
          </button>
        )}
      </div>
      <div
        className="carte-lieu fiche-carte"
        onPointerDown={onCarteDown}
        onPointerUp={onCarteUp}
      >
        {/* MON spot sans photo : le grand tirage vide s'efface — l'album à
            trous (juste sous le titre) prend sa place au-dessus du pli */}
        {!(mien && nbPhotos === 0) && (
          <div className="carte-photo">
            {nbPhotos > 1 && (
              <div className="photo-tirets">
                {lieu.photos.map((_, i) => (
                  <span key={i} className={i === photoIndex ? 'on' : ''} />
                ))}
              </div>
            )}
            {nbPhotos > 0 ? (
              <img src={srcPhoto(lieu.photos[photoIndex])} alt={lieu.nom} onError={photoIndisponible} />
            ) : (
              <div className="tirage-vide">
                <span className="croix">✕</span>
                <span className="hand sans-photo">{t('pas encore de photo.')}</span>
              </div>
            )}
            {/* le photogramme d'un clip : la perforation + le déclic qui
                allume le projecteur (jamais d'autoplay) */}
            {nbPhotos > 0 && estClip(lieu.photos[photoIndex]) && (
              <button
                className="pf-projeter"
                aria-label={t('projeter la bobine')}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  setProjection(true)
                }}
              >
                ▸
              </button>
            )}
            {nbPhotos > 1 && (
              <span className="mono photo-compteur">
                {photoIndex + 1}/{nbPhotos}
              </span>
            )}
          </div>
        )}
        <div className="carte-nom">
          {lieu.nom}
          {/* le sceau du spot complet (≥1 photo + un mot) — LA récompense.
              budget cire de la fiche : le tampon « validé » + ce sceau, rien
              d'autre n'y parle en --cire (arbitrage §4). */}
          {mien && spotComplet(lieu) && (
            <span className="sceau-complet sceau-cire" title={t('spot complet — une photo et un mot')}>
              <ISceau taille={14} />
            </span>
          )}
        </div>
        {nbPhotos > 0 && (
          <button
            className="photo-agrandir"
            onClick={(e) => {
              e.stopPropagation()
              setAgrandi(true)
            }}
            aria-label={t('agrandir la photo')}
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
                <span className="tampon-qui">{lieu.tampon.qui ?? t('toi')}</span>
                {lieu.tampon.date && <span className="tampon-date">{lieu.tampon.date}</span>}
              </>
            ) : (
              `${lieu.tampon.qui ?? t('toi')} — ${t('passé à côté')}`
            )}
          </span>
        )}
      </div>

      {/* le retrait : on ne masque pas les visages, donc la porte de sortie
          doit être visible (la politique l'engage à 24 h). 0018 : le signal
          s'écrit en base — fini le mailto: vers une boîte qui n'existait pas.
          key = la photo affichée : changer de tirage replie le formulaire. */}
      {nbPhotos > 0 && (
        <SignalerPhoto key={photoIndex} lieu={lieu} position={photoIndex + 1} total={nbPhotos} />
      )}

      {/* l'album à trous : sur MES spots, chaque photo manquante démange */}
      {mien && (
        <AlbumATrous
          lieu={lieu}
          onPrise={(type, f) => {
            void enregistrer({ ...lieu, photos: [...lieu.photos, { type, blob: f }] })
          }}
        />
      )}
      {/* spot du cercle sans photo : pas de cadre (RLS Storage), juste le constat */}
      {!mien && chez && nbPhotos === 0 && (
        <p className="mono album-sans-visage">
          {t("pas encore de visage — c'est le spot de")} {chez.toLowerCase()}.
        </p>
      )}

      {/* la provenance : un spot du cercle réel s'annonce « chez untel » */}
      {chez && (
        <p className="mono fiche-adresse fiche-chez">
          {t('chez')} {chez.toLowerCase()} · {t('un spot de ton cercle')}
        </p>
      )}

      {(adrComplete || lieu.adresse) && (
        <p className="mono fiche-adresse">
          {adrComplete || adresseLisible(lieu.adresse, lieu.nom)}
        </p>
      )}

      {/* COMMENT TU RENTRES (10/08, décision du panel — voir rentrer.ts).
          Une ligne, jamais une liste : le panel a prévenu qu'une liste
          redeviendrait le calque qu'on venait de refuser. Et jamais un Vélib'
          sans ses vélos : une station annoncée puis vide, c'est le
          déplacement pour rien qu'on cherche à éviter. */}
      {rentrer && (rentrer.velib.length > 0 || rentrer.noctilien) && (
        <p className="mono fiche-rentrer">
          <span className="fiche-rentrer-mot">{t('rentrer')}</span>
          {rentrer.velib.map((s) => (
            <span key={s.nom} className="fiche-rentrer-bout">
              {t('vélib’')} {s.nom.toLowerCase()} · {formatDistance(s.m)} ·{' '}
              <b>
                {s.velos} {s.velos > 1 ? t('vélos') : t('vélo')}
              </b>
            </span>
          ))}
          {rentrer.noctilien && (
            <span className="fiche-rentrer-bout">
              {t('noctilien')} {rentrer.noctilien.nom.toLowerCase()} ·{' '}
              {formatDistance(rentrer.noctilien.m)} ·{' '}
              <b>{rentrer.noctilien.lignes.join(' ')}</b>
              {/* le libellé dit la vérité de l'heure : tant que le service
                  n'a pas commencé, on annonce quand — jamais un passage. */}
              {rentrer.etatNoctilien === 'bientot' && (
                <span className="fiche-rentrer-heure">
                  {' '}
                  · {t('dès')} {DEBUT_NOCTILIEN}
                </span>
              )}
              {rentrer.etatNoctilien === 'roule' && (
                <span className="fiche-rentrer-heure">
                  {' '}
                  · {t('jusqu’à')} {FIN_NOCTILIEN}
                </span>
              )}
            </span>
          )}
        </p>
      )}

      {/* LA CROIX, dite en toutes lettres (09/08) — jamais un compteur, jamais
          un anonyme : un nom, et la phrase qui explique. C'est tout le signal.
          Elle vaut aussi pour la rayure d'un pote (elle arrive du cercle). */}
      {lieu.raye && (
        <p className="mono fiche-raye">
          <span className="fiche-raye-croix" aria-hidden>
            ✕
          </span>{' '}
          {t('rayé par')} {lieu.raye.qui.toLowerCase()}
          {lieu.raye.motif ? ` — « ${lieu.raye.motif} »` : ''}
          {maRayure ? ` · ${t('il part de ton carnet jeudi.')}` : ''}
        </p>
      )}

      {/* le crayon (08/08) : mon spot, mon écriture — l'import a pu se
          tromper de nom, de rue, de famille. On reprend, on ne subit pas. */}
      {mien && !correction && (
        <button className="lien fiche-corriger mono" onClick={() => setCorrection(true)}>
          <ICrayon taille={13} /> {t('corriger')}
        </button>
      )}
      {mien && correction && (
        <CorrigerLieu
          lieu={lieu}
          onEnregistre={(maj) => setLieu(maj)}
          onFerme={() => setCorrection(false)}
          favori={favori}
          onFavori={onFavori}
          aTester={aTester}
          onATester={onATester}
          archive={lieu.statut === 'archive'}
          onArchive={() => void basculerArchive()}
          onSupprimer={() => onSupprimer(lieu)}
          onRayer={async (motif) => {
            setLieu({ ...lieu, raye: await onRayer(lieu, motif) })
          }}
          onDeRayer={async () => {
            await onDeRayer(lieu)
            setLieu({ ...lieu, raye: undefined })
          }}
          maRayure={maRayure}
        />
      )}

      <div className="fiche-infos">
        <div className="fiche-case">
          <div className="fiche-case-gros">{formatDistance(dist)}</div>
          <div className="mono fiche-case-lbl">{libelleTrajet(dist)}</div>
        </div>
        <div className="fiche-case">
          <div className={`fiche-case-gros ${horaire?.ouvert ? 'ouvert' : 'ferme'}`}>
            {horaire
              ? horaire.ouvert === true
                ? t('ouvert')
                : horaire.ouvert === false
                  ? t('fermé')
                  : t('horaires')
              : '—'}
          </div>
          <div className="mono fiche-case-lbl">
            {horaire ? horaire.texte.replace(/^[^·]*· /, '') : t('horaires inconnus')}
          </div>
        </div>
      </div>

      {propreteWcLabel(lieu.propreteWc) && (
        <div className="fiche-wc mono">
          <span className="fiche-wc-lbl">{t('propreté des wc')}</span>
          <span className="fiche-wc-pts">{propreteWcLabel(lieu.propreteWc)!.points}</span>
          <span className="fiche-wc-mot">{t(propreteWcLabel(lieu.propreteWc)!.mot)}</span>
        </div>
      )}

      {(lieu.match ||
        (lieu.note ? 1 : 0) + (lieu.tipsCercle?.length ?? 0) >= 2) && (
        <div className="fiche-signaux">
          {(lieu.note ? 1 : 0) + (lieu.tipsCercle?.length ?? 0) >= 2 && (
            <span className="fiche-signal ref">{t('référence — recommandé par plusieurs')}</span>
          )}
          {lieu.match === 'diffuse' && (
            <span className="fiche-signal match">
              <IBallon taille={14} /> {t('on y voit les matchs')}
            </span>
          )}
          {lieu.match === 'refuge' && (
            <span className="fiche-signal refuge">
              <IRefuge taille={14} /> {t('refuge anti-foot')}
            </span>
          )}
        </div>
      )}

      {lieu.description && <p className="mono fiche-description">{lieu.description}</p>}

      <div className="fiche-tips">
        <span className="lbl mono">{t('les tips')}</span>
        {lieu.note && (
          /* une note importée de Google est un PENSE-BÊTE, pas un tip signé
             (audit 02/08) : elle s'affiche en note d'import tant qu'elle n'a
             pas été réécrite — la fiche tend le stylo au lieu de mentir */
          <div className={`tip${estNoteImport(lieu) ? ' tip-import' : ''}`}>
            <p className={estNoteImport(lieu) ? 'mono tip-import-txt' : 'hand'}>{lieu.note}</p>
            {estNoteImport(lieu) && mien && (
              <button className="lien tip-reecrire" onClick={() => setEdition(true)}>
                {t('en faire un vrai tip →')}
              </button>
            )}
            <span className="mono tip-signature">
              {/* la note d'un spot du cercle est LA voix de son proprio, pas la mienne */}
              {chez ? (
                <>
                  —{' '}
                  <button className="tip-auteur-lien" onClick={() => onCurateur(chez)}>
                    @{chez.toLowerCase()}
                  </button>
                </>
              ) : editorial ? (
                `— ${NOM_JEUDI}`
              ) : estNoteImport(lieu) ? (
                t('— note d’import')
              ) : (
                t('— toi')
              )}
            </span>
          </div>
        )}
        {(lieu.tipsCercle ?? []).map((tip, i) => {
          // #22 : le critère perso du curateur (sa signature de goût) —
          // seulement pour un VRAI membre du cercle (auteurId)
          const crit = tip.auteurId ? reels.find((m) => m.id === tip.auteurId)?.critere : undefined
          return (
            <div className="tip" key={i}>
              <p className="hand">{tip.note}</p>
              <span className="mono tip-signature">
                —{' '}
                {tip.auteurId ? (
                  // un vrai pote : sa signature ouvre son carnet
                  <button className="tip-auteur-lien" onClick={() => onCurateur(tip.auteur)}>
                    @{tip.auteur.toLowerCase()}
                  </button>
                ) : (
                  // voix du décor (contenu éditorial) : signature TEXTE simple —
                  // aucun faux profil curateur derrière (bloc D)
                  <span>@{tip.auteur.toLowerCase()}</span>
                )}
                {crit && <span className="tip-critere"> · {t('juge')} {crit}</span>}
                {/* seul le décor porte le tampon d'honnêteté */}
                {!tip.auteurId && <span className="tampon-demo">{t('démo')}</span>}
              </span>
            </div>
          )
        })}
        {!lieu.note && (lieu.tipsCercle ?? []).length === 0 && (
          <p className="hand tip-vide">{t("t'as rien dit sur ce spot. encore.")}</p>
        )}
        {/* la note en marge : le 1ᵉʳ tip d'un pote qu'on croise — lue puis
            effacée au prochain scroll/tap. Un VRAI pote (auteurId) seulement :
            « un pote qui parle » pendant que le tampon dit « démo », non. */}
        {(lieu.tipsCercle ?? []).some((t) => t.auteurId) && (
          <NoteMarge id="fiche-tip-pote" fleche="haut" effaceAuGeste className="note-marge-fiche" />
        )}
      </div>

      {/* « à travers leurs yeux » (regards simulés) : SUPPRIMÉ — le vrai
          reviendra quand tes potes poseront leurs critères sur les lieux */}

      {mien && !edition ? (
        <div className="fiche-tags">
          <span className="lbl mono">{t("c'est pour quoi ?")}</span>
          <div className="rangée">
            {lieu.envies.filter((e) => e !== 'turbo').map((e) => (
              <span key={e} className="mot fige entouré">
                {e}
              </span>
            ))}
            {lieu.envies.length === 0 && (
              <span className="mono fiche-lecture-seule">{t('pas encore renseigné')}</span>
            )}
          </div>
          <span className="lbl mono">{t('avec qui ?')}</span>
          <div className="rangée">
            {COMPAGNIES.map((c) => (
              <span key={c} className={`mot fige ${lieu.compagnies.includes(c) ? 'entouré' : 'estompe'}`}>
                {c}
              </span>
            ))}
          </div>
          {lieu.meteo && (
            <span className="mono meteo-sens">
              {t(METEO_INFOS[lieu.meteo].mot)} · {prixMeteo(lieu.meteo)} {t('/ pers.')}
              <span className="glose"> ≈ {uniteParPersonne(lieu.envies)}</span>
            </span>
          )}
          {/* les étiquettes PERSO (0012) : le rangement à soi — visibles
              uniquement sur MES spots, jamais sur ceux du cercle */}
          {(lieu.etiquettes?.length ?? 0) > 0 && (
            <div className="rangée">
              {(lieu.etiquettes ?? []).map((e) => (
                <span key={e} className="mot fige etiquette">
                  {e}
                </span>
              ))}
            </div>
          )}
          <button className="lien fiche-modifier" onClick={() => setEdition(true)}>
            {t('modifier les infos')}
          </button>
        </div>
      ) : mien && edition ? (
        <div className="fiche-tags">
          <span className="lbl mono">{t("c'est pour quoi ?")}</span>
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
          <span className="lbl mono">{t('avec qui ?')}</span>
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
          <span className="lbl mono">{t('tes étiquettes ? (privées)')}</span>
          <div className="rangée">
            {(lieu.etiquettes ?? []).map((e) => (
              <button
                key={e}
                className="mot entouré etiquette"
                title={t('retirer')}
                onClick={() => retirerEtiquette(e)}
              >
                {e} ×
              </button>
            ))}
            <input
              className="etiquette-saisie mono"
              placeholder={t('+ étiquette')}
              maxLength={30}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter') {
                  const cible = ev.target as HTMLInputElement
                  void ajouterEtiquette(cible.value)
                  cible.value = ''
                }
              }}
              onBlur={(ev) => {
                void ajouterEtiquette(ev.target.value)
                ev.target.value = ''
              }}
            />
          </div>
          <span className="lbl mono">{t('situation du portefeuille ?')}</span>
          <div className="form-meteo">
            {METEOS.map((m) => (
              <button
                key={m}
                className={`meteo-choix ${lieu.meteo === m ? 'on' : ''}`}
                aria-pressed={lieu.meteo === m}
                onClick={() => changerMeteo(m)}
                title={`${t(METEO_INFOS[m].mot)} · ${prixMeteo(m)}`}
              >
                {m === 'soleil' ? <ISoleil taille={16} /> : m === 'pluie' ? <IPluie taille={16} /> : <INuage taille={16} />}
                <span className="meteo-prix mono">{prixMeteo(m)}</span>
              </button>
            ))}
          </div>
          <button className="valider fiche-modifier-ok" onClick={() => setEdition(false)}>
            {t('terminé')}
          </button>
        </div>
      ) : (
        <div className="fiche-tags">
          <span className="lbl mono">{t("c'est pour quoi ?")}</span>
          <div className="rangée">
            {lieu.envies.filter((e) => e !== 'turbo').map((e) => (
              <span key={e} className="mot fige entouré">
                {e}
              </span>
            ))}
          </div>
          <span className="lbl mono">{t('avec qui ?')}</span>
          <div className="rangée">
            {COMPAGNIES.map((c) => (
              <span key={c} className={`mot fige ${lieu.compagnies.includes(c) ? 'entouré' : 'estompe'}`}>
                {c}
              </span>
            ))}
          </div>
          {dejaAdopte ? (
            <p className="mono fiche-lecture-seule">{t('déjà sur ta carte ✓')}</p>
          ) : (
            <button className="valider fiche-adopter" onClick={() => onAdopter(lieu)}>
              {t('+ ajouter à ma carte')}
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
          {t("m'y emmener")}
        </a>
        <button className="valider fiche-partage" onClick={partager}>
          {t('envoie à un pote')}
        </button>
      </div>

      {/* un match est ouvert → chaque fiche devient une porte vers le vote */}
      {onAuVote && (
        <button className="lien fiche-story" onClick={() => onAuVote(lieu)}>
          + {t('au vote du match')}
        </button>
      )}

      {/* la carte de story : le spot devient un objet à poster (panel n°1) */}
      <button
        className="lien fiche-story"
        onClick={() => {
          void import('./partageStory').then((m) => m.partagerEnStory(lieu))
          suivre('story_partagee', { lieu: lieu.nom })
        }}
      >
        {t('partager en story →')}
      </button>

      {/* LE BLOC D'ACTIONS, TOUT EN BAS (09/08) — le crayon (plus haut) reste,
          mais n'est plus le SEUL chemin : ces gestes sont désormais toujours
          visibles, qu'on regarde un spot à soi ou celui d'un pote. Pendant
          la correction, CorrigerLieu porte déjà les mêmes états (favori/à
          tester) + supprimer/rayer — on ne les affiche pas deux fois. */}
      {!(mien && correction) && (
        <>
          <div className="fiche-tags fiche-actions-bas">
            <span className="lbl mono">{t('où il en est')}</span>
            <div className="rangée">
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
            </div>
            {/* MODIFIER : uniquement mon écriture — sur le spot d'un pote, la
                voie est « + ajouter à ma carte » plus haut, pas ce lien. */}
            {mien && (
              <button className="lien fiche-modifier" onClick={() => setCorrection(true)}>
                {t('modifier les infos')}
              </button>
            )}
          </div>

          {/* SUPPRIMER — silencieux, deux temps. Sur un spot à moi : pour de
              vrai (photos et clips compris). Sur celui d'un pote : ça ne
              touche que MA carte, jamais la sienne (supprimerLieu, db.ts). */}
          <div className="corriger-arracher">
            {!confirmSupprFiche ? (
              <button
                className="lien corriger-effacer"
                onClick={() => setConfirmSupprFiche(true)}
              >
                {mien ? t('supprimer') : t('retirer de ma carte')}
              </button>
            ) : (
              <>
                <p className="mono corriger-avertissement">
                  {mien
                    ? t('ses photos partent aussi — et ses clips. définitif, sans retour.')
                    : t('il quitte ta carte, pas son carnet à lui — rien n’est effacé de son côté.')}
                </p>
                <div className="corriger-actions">
                  <button className="lien" onClick={() => setConfirmSupprFiche(false)}>
                    {t('non, laisse')}
                  </button>
                  <button
                    className="lien corriger-effacer"
                    disabled={enCoursSupprFiche}
                    onClick={() => void confirmerSupprFiche()}
                  >
                    {enCoursSupprFiche
                      ? t('on efface…')
                      : mien
                        ? t('oui, supprime')
                        : t('oui, retire')}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* SUPPRIMER + SIGNIFIER À MON CERCLE — le serment (rayer.ts) :
              marche déjà sur n'importe quel spot, à moi ou à un pote. C'est
              même LÀ que ça sert le plus — on t'a envoyé un spot, t'y es
              allé, t'es déçu : ton cercle doit pouvoir le savoir. */}
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
                {maRayure && (
                  <button
                    className="lien"
                    disabled={enCoursRayerFiche}
                    onClick={() => void seDedireFiche()}
                  >
                    {enCoursRayerFiche ? t('on efface…') : t('j’ai changé d’avis')}
                  </button>
                )}
              </>
            ) : !rayerOuvertFiche ? (
              <button className="lien corriger-effacer" onClick={() => setRayerOuvertFiche(true)}>
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
                  value={motifRayerFiche}
                  onChange={(e) => setMotifRayerFiche(e.target.value)}
                  placeholder={t('trois quarts d’heure pour deux bières')}
                  maxLength={120}
                  aria-label={t('pourquoi ?')}
                />
                <div className="corriger-actions">
                  <button
                    className="lien"
                    onClick={() => {
                      setRayerOuvertFiche(false)
                      setMotifRayerFiche('')
                    }}
                  >
                    {t('non, laisse')}
                  </button>
                  <button
                    className="lien corriger-effacer"
                    disabled={enCoursRayerFiche}
                    onClick={() => void confirmerRayerFiche()}
                  >
                    {enCoursRayerFiche ? t('on raye…') : t('oui, je raye')}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <div className="mono fiche-meta">
        {VISIBILITES.find((x) => x.v === lieu.visibilite)?.icone}{' '}
        {t(VISIBILITES.find((x) => x.v === lieu.visibilite)?.label ?? '')} · {t('capturé le')}{' '}
        {new Date(lieu.creeLe).toLocaleDateString(lireLangue() === 'fr' ? 'fr-FR' : 'en-GB')}
      </div>
    </div>
  )
}

/** une note venue de Google Maps est un pense-bête, pas un tip signé :
 *  source 'google' + jamais retouchée (pas de tampon, pas de photo à moi).
 *  Tant qu'elle n'est pas réécrite, la fiche l'annonce pour ce qu'elle est. */
function estNoteImport(l: Lieu): boolean {
  return l.source === 'google' && !l.tampon && l.photos.length === 0 && !!l.note?.trim()
}

// ── l'album à trous ────────────────────────────────────────────
// sur MES spots : chaque type de photo manquant = un cadre polaroïd VIDE qui
// démange. un cadre = un <label> → tap = appareil photo ; la prise passe par
// le pipeline existant (majLieu → televerserPhoto + syncPhotosLieu) et le
// tirage « se développe » sur place (du sombre vers l'image, CSS only).
// même langue que le kit photos de la validation (« les wc, c'est la vérité »)
// 5 preuves, dans l'ordre du parcours d'une soirée — la porte et la
// terrasse sont optionnelles (le sceau « fiche complète » reste photo+note)
const CADRES_ALBUM: { type: PhotoLieu['type']; etiquette: string }[] = [
  { type: 'facade', etiquette: 'la porte' },
  { type: 'salle', etiquette: 'la salle' },
  { type: 'terrasse', etiquette: 'la terrasse' },
  { type: 'plat', etiquette: 'ton verre' },
  { type: 'wc', etiquette: 'les wc' },
]

function AlbumATrous({
  lieu,
  onPrise,
}: {
  lieu: Lieu
  onPrise: (type: PhotoLieu['type'], f: File) => void
}) {
  // les trous comblés PENDANT cette visite : le tirage reste en place et se développe
  const [developpees, setDeveloppees] = useState<PhotoLieu['type'][]>([])
  const prendre =
    (type: PhotoLieu['type']) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      e.target.value = ''
      if (!f) return
      setDeveloppees((prev) => (prev.includes(type) ? prev : [...prev, type]))
      onPrise(type, f)
    }
  // un cadre par type SANS photo (+ ceux tout juste comblés) ; album complet → rien
  // ('lieu', l'ancien générique, compte comme « salle »)
  const cadres = CADRES_ALBUM.filter(
    ({ type }) =>
      !lieu.photos.some((p) => normaliserTypePhoto(p.type) === type) ||
      developpees.includes(type),
  )
  if (!cadres.length) return null

  // ZÉRO photo (le cas des 302 spots importés) : cinq trous seraient un
  // constat d'échec — on tend UN seul cadre large, une invitation. La
  // première prise = « la salle » (l'ambiance, la photo canonique) ; dès
  // qu'elle existe, l'album complet prend le relais pour les autres preuves.
  if (lieu.photos.length === 0 && developpees.length === 0) {
    return (
      <div className="album-trous">
        <label className="album-cadre album-vide album-large" aria-label={t('sa photo — prends-la ce soir')}>
          <span className="album-fenetre">
            <IAppareil taille={19} />
          </span>
          {/* sans `capture` : la galerie redevient possible. La fraîcheur d'une
              photo ne se garantit pas par l'appareil photo — elle se LIT dans
              sa date (0010), et une vieille photo entre en souvenir. */}
          <input type="file" accept="image/*" hidden onChange={prendre('salle')} />
          <span className="hand album-etiquette">{t('sa photo — prends-la ce soir')}</span>
        </label>
      </div>
    )
  }
  return (
    <div className="album-trous">
      {cadres.map(({ type, etiquette }) => {
        // le tirage frais : il n'y avait rien de ce type avant, find suffit
        const prise = developpees.includes(type)
          ? lieu.photos.find((p) => p.type === type)
          : undefined
        return (
          <div key={type} className="album-cadre-bloc">
            {prise ? (
              <span className="album-cadre album-developpe">
                <span className="album-fenetre">
                  <img src={srcPhoto(prise)} alt={etiquette} onError={photoIndisponible} />
                </span>
              </span>
            ) : (
              <label className="album-cadre album-vide" aria-label={`${t('prendre la photo :')} ${t(etiquette)}`}>
                <span className="album-fenetre">
                  <IAppareil taille={17} />
                </span>
                {/* sans `capture` : appareil photo OU photothèque, au choix */}
                <input type="file" accept="image/*" hidden onChange={prendre(type)} />
              </label>
            )}
            <span className="hand album-etiquette">{t(etiquette)}</span>
          </div>
        )
      })}
    </div>
  )
}

interface Suggestion {
  nom: string
  adresse: string
  lat: number
  lng: number
}

// #8 : le kit photos — 2-3 tirages PAR catégorie. Une photo DIT CE QU'ELLE
// PROUVE : la porte (trouver l'entrée), la salle (l'ambiance vraie), la
// terrasse (rooftops & péniches), ton verre, les wc (la vérité).
const CATS_PHOTO = [
  { type: 'facade', label: 'la porte' },
  { type: 'salle', label: 'la salle' },
  { type: 'terrasse', label: 'la terrasse' },
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
        const prises = photos.filter((p) => normaliserTypePhoto(p.type) === type)
        return (
          <div key={type} className={`photo-cat ${type === 'wc' ? 'photo-cat-wc' : ''}`}>
            <span className="mono photo-cat-lbl">
              {t(label)} <span className="photo-cat-n">{prises.length}/{MAX_PAR_CAT}</span>
            </span>
            {type === 'wc' && setPropreteWc && (
              <div className="photo-wc-note mono">
                {t('propreté')}&nbsp;:
                {([1, 2, 3] as const).map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={`photo-wc-dot ${propreteWc && propreteWc >= n ? 'on' : ''}`}
                    aria-label={`${t('propreté')} ${n}/3`}
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
                  title={t('retirer')}
                >
                  <img src={srcPhoto(p)} alt={label} onError={photoIndisponible} />
                  <span className="photo-vignette-x">✕</span>
                </button>
              ))}
              {prises.length < MAX_PAR_CAT && (
                <label className="photo-ajout">
                  <IAppareil taille={15} />
                  {/* sans `capture` : appareil photo OU photothèque, au choix */}
                  <input type="file" accept="image/*" hidden onChange={ajouter(type)} />
                </label>
              )}
            </div>
          </div>
        )
      })}
      <p className="mono photo-wc-pousse">{t("les wc, c'est la vérité. mets-en 2-3.")}</p>
    </div>
  )
}

function FormAjout({
  onFini,
  onAnnule,
  importOuvert = false,
}: {
  onFini: () => void
  onAnnule: () => void
  /** true = le panneau import Google s'ouvre déplié (bandeau de rappel) */
  importOuvert?: boolean
}) {
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
  // anti double-tap sur « c'est dit. » + message doux si pas de position
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [msgPosition, setMsgPosition] = useState<string | null>(null)

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
    // debounce de recherche : vider/armer l'état de suggestion à chaque frappe
    // est le comportement voulu (synchronisation avec un fetch externe)
    if (nom.trim().length < 3 || adresseChoisie) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    setMsgPosition(null) // le spot a une place — le message n'a plus lieu d'être
  }

  const enregistrer = async () => {
    if (!nom.trim() || envoiEnCours) return
    // pas de spot à Null Island : sans position (GPS ou adresse), on refuse gentiment
    if (!position) {
      setMsgPosition('place-le sur la carte d’abord — choisis une adresse ou autorise le GPS.')
      return
    }
    setEnvoiEnCours(true)
    try {
      await ajouterLieu({
        id: nouvelId(),
        nom: nom.trim(),
        lat: position.lat,
        lng: position.lng,
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
        source: adresseChoisie ? 'manuel' : 'rue',
      })
      onFini()
    } finally {
      setEnvoiEnCours(false)
    }
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
        <span className="lbl mono">{t('avec qui ?')}</span>
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
            title={`${t(METEO_INFOS[m].mot)} · ${prixMeteo(m)}`}
          >
            {m === 'soleil' ? <ISoleil taille={16} /> : m === 'pluie' ? <IPluie taille={16} /> : <INuage taille={16} />}
            <span className="meteo-prix mono">{prixMeteo(m)}</span>
          </button>
        ))}
      </div>
      {meteo && (
        <span className="mono meteo-sens">
          {t(METEO_INFOS[meteo].mot)} · {prixMeteo(meteo)} / pers.
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
      <ImportGoogle ouvertParDefaut={importOuvert} onImporte={() => setTimeout(onFini, 1100)} />
      {/* l'import universel : des noms collés depuis n'importe où */}
      <ImportListe onImporte={() => setTimeout(onFini, 300)} />
      {/* et la troisième voie : une entrée écrite à la main, sans import */}
      <AjoutMain onAjoute={() => setTimeout(onFini, 700)} />
      <div className="form-actions">
        <button className="lien" onClick={onAnnule}>
          laisse tomber
        </button>
        <button
          className="valider"
          onClick={enregistrer}
          disabled={!nom.trim() || envoiEnCours}
        >
          {envoiEnCours ? 'on le note…' : "c'est dit."}
        </button>
      </div>
      {msgPosition && <p className="mono form-msg-position">{msgPosition}</p>}
    </div>
  )
}
