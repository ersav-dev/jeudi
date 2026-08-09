import { useEffect, useRef, useState } from 'react'
import { trajetMin, libelleTrajet } from './rayon'
import maplibregl from 'maplibre-gl'
import type { FeatureCollection, Point } from 'geojson'
import {
  maPosition,
  etatHoraire,
  teinteCurateur,
  distanceM,
  formatDistance,
  propreteWcLabel,
  estAMoi,
  lireFavoris,
  CURATEUR_JEUDI,
  NOM_JEUDI,
  type Lieu,
} from './db'
import { lireMarques, poserMarque, retirerMarque, sAbonnerMarques } from './marques'
import { lireATester } from './aTester'

/** REFONTE 09/08 — de combien le pin remonte pour que le CENTRE de son
 *  marqueur tombe sur les coordonnées : rayon (15) + écart (5) + demi-boîte
 *  du marqueur (6). Doit rester d'accord avec --pin-taille / --pin-ecart /
 *  --mq-boite dans index.css. */
const DECALAGE_MARQUEUR = 26

/** LA HAUTEUR RÉELLE DES MONUMENTS, en mètres (09/08). C'est elle qui donne
 *  leur taille sur la carte : un monument est un objet, pas un sticker.
 *  Ce sont des élévations (des choses qui se dressent) — donc la hauteur.
 *  Le jour où on ajoute une EMPREINTE (place des Vosges, un parc), c'est sa
 *  largeur qu'il faudra mettre, et elle méritera un autre traitement :
 *  une empreinte se visse au sol, une élévation reste debout. */
const HAUTEUR_M: Record<string, number> = {
  'tour eiffel': 330,
  montparnasse: 210,
  invalides: 107, // le dôme
  'sacré-cœur': 83,
  panthéon: 83,
  'notre-dame': 69, // les tours (la flèche, 96 m, a brûlé)
  opéra: 56,
  'arc de triomphe': 50,
}
import { typeDeLieu, svgTypeLieu, cuisineDeLieu } from './typesLieu'
import {
  grouperTas,
  eventailGrappe,
  ligneBoussole,
  texteBoussole,
  type TasAffiche,
  type PointTas,
  type CandidatBoussole,
  type LigneBoussole,
} from './pellicule'
import { composerTas } from './pelliculeComposite'
import { t } from './langue'
import { donneesTransport } from './transport'
import {
  chargerLignes,
  chargerBouches,
  tracesPour,
  bouchesPour,
  AUCUNE_LIGNE,
  SOURCE_LIGNES,
  LAYER_LIGNES,
  LAYER_LIGNES_HALO,
  arretsPour,
  indexerStations,
  stationsIntrouvables,
  AUCUN_ARRET,
  SOURCE_ARRETS,
  LAYER_ARRETS,
  type Ligne,
  type Bouche,
  type IndexStations,
} from './lignes'

// les monuments du croquis : partagés avec la recherche (monuments.ts)
import { MONUMENTS } from './monuments'
import { REPERES } from './reperes'
import { IAnneau, IBallon } from './icones'
import { srcPhoto, photoIndisponible } from './photos'

// fond sombre gratuit (tuiles raster Carto dark) — style inline : aucun
// fichier de config externe à charger, donc rien à bloquer.
const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      // OSM pour le fond, les lignes et une partie des accès · Île-de-France
      // Mobilités (Licence Ouverte v2.0) pour les accès et leur sens de passage
      attribution: '© OpenStreetMap, © CARTO, © Île-de-France Mobilités',
    },
  },
  layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
}
// "moi" : la vraie position si la géoloc a répondu, sinon Place Vendôme
const moi = (): [number, number] => [maPosition.lng, maPosition.lat]

// le bloc « détails » : page 0 = photo claire (sans texte) · 1 le mot · 2 recommandé · 3 pratique
const NB_PAGES_SHEET = 4

// ── la poussière d'encre : TOUS les lieux valides en points GPU (source +
// layer circle MapLibre — 750 points ne coûtent rien). C'est le remplaçant
// du clustering : plus AUCUNE pastille chiffrée, à aucun zoom (on zoomait et
// on ne voyait que la grappe, jamais les lieux). La poussière reste TOUJOURS
// visible sous les pins : la texture de la ville.
const SOURCE_POUSSIERE = 'poussiere'
const LAYER_POUSSIERE = 'poussiere-points'
// hitbox élargie autour d'un tap/appui sur la poussière (un pouce, de nuit)
const HITBOX_POUSSIERE = 12

// ── pins DOM par PRIORITÉ progressive : combien de pins NOMMÉS selon le
// zoom. ~14 à z<12,5 · ~40 à z13,5 · TOUS les visibles dès z≥14,5 — au zoom
// quartier on voit tout en pins nommés (LE reproche des grappes à régler).
const ZOOM_TOUT_EN_PINS = 14.5
const plafondPins = (z: number): number => {
  if (z >= ZOOM_TOUT_EN_PINS) return Infinity
  if (z < 12.5) return 14
  return Math.round(14 + (z - 12.5) * 26) // z13,5 → ~40, puis croît jusqu'au « tout »
}

// l'appui long (pins, poussière, carrousel) : un seul seuil partout
const APPUI_LONG_MS = 450
// tolérance de mouvement avant d'annuler l'appui (c'est un pan, pas un appui)
const TREMBLE_PX = 8

// les ~8 suggestions de marques, orientées sorties. Ces émojis sont des
// CANDIDATS de contenu utilisateur (il en choisit un pour SON lieu), pas du
// chrome — l'exception assumée de la DA (décision Ersan, voir marques.ts).
const SUGGESTIONS_MARQUES = ['🍺', '🍷', '🍕', '☕', '💃', '🎶', '🌿', '❤️'] as const

// maplibre possède le transform de l'ÉLÉMENT du marker (positionnement) :
// impossible d'animer ce transform-là. chaque pin/pastille vit donc dans un
// porteur neutre (l'élément du marker) et c'est l'enfant qu'on anime.
// bonus : les transforms CSS (.pin-actif scale 1.3…) redeviennent effectifs.
const enrober = (el: HTMLElement): HTMLElement => {
  const porteur = document.createElement('div')
  // shrink-wrap explicite : l'ancre du marker = le boîtier du pin, même si
  // le CSS maplibre (.maplibregl-marker { position:absolute }) manquait
  porteur.style.width = 'max-content'
  porteur.appendChild(el)
  return porteur
}

// retrait d'un pin : fondu court 150 ms --pose (V5 « l'encre se range ») —
// plus de vol vers un centroïde : les grappes sont mortes. La naissance,
// elle, passe par la classe CSS .pin-depose (même durée, même courbe).
const retirerEnFondu = (mk: maplibregl.Marker, el: HTMLElement) => {
  el.style.transition = 'transform 150ms var(--pose), opacity 150ms var(--pose)'
  el.style.transform = 'scale(0.85)'
  el.style.opacity = '0'
  window.setTimeout(() => mk.remove(), 170)
}

// ── labels anti-collision : géométrie pure (aucune lecture du DOM) ──
// 09/08 — LA HIÉRARCHIE SE JOUE AU NOMBRE, PAS À L'OPACITÉ. Mesuré sur
// design/monuments_001.html : un nom de spot est à 15,2:1 de contraste
// contre 2,5:1 pour un nom de station — le rapport était déjà bon. Mais
// on en affichait 8 contre 24 : l'œil compte les marques avant de mesurer
// leur encre, et vingt-quatre chuchotements couvrent huit voix. On monte
// donc le plafond des noms de LIEUX (c'est le niveau 1) plutôt que
// d'écraser encore les transports — à force de descendre les couches
// basses la carte devient fade sans rien gagner en hiérarchie.
// Sans danger : l'anti-collision géométrique reste seule juge du placement,
// ce nombre n'est qu'un plafond — on n'ajoute des noms que là où il y a
// la place.
const PLAFOND_LABELS = 14
type Boite = { x: number; y: number; w: number; h: number }
const chevauche = (a: Boite, b: Boite) =>
  !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y)

// combien de cartes réelles de part et d'autre du centre du carrousel
// (le reste = coquilles de même largeur, pour garder le scroll-snap juste)
const FENETRE_CARROUSEL = 7

export default function Carte({
  lieux,
  onVoir,
  vus,
  mini,
  comparer = [],
  onComparer,
  plans,
  onPlan,
  allumes = null,
  pellicule,
  onTas,
}: {
  lieux: Lieu[]
  onVoir?: (l: Lieu) => void
  vus?: Set<string>
  /** version réduite (récap post-deck) : pas de contrôles, pas de légende, pas plein écran */
  mini?: boolean
  /** chantier 1 : l'état « à comparer » est remonté dans App (source unique).
   *  Carte ne fait que lire `comparer` et signaler les bascules / l'ouverture. */
  comparer?: string[]
  onComparer?: (id: string) => void
  /** « je sais pas » : pour chaque lieu, son plan (1..3) et son rôle —
   *  A = le spot (jeton numéroté, l'encre du plan), B = le plan B (lettre B,
   *  la même encre passée au graphite). On distingue les propositions. */
  plans?: Record<string, { n: number; role: 'A' | 'B' }>
  /** taper un pin de plan allume SA proposition (A + B ensemble) — le caller
   *  tient l'état ; re-taper un pin déjà allumé ouvre la fiche du lieu */
  onPlan?: (n: number) => void
  /** les ids ALLUMÉS (le plan choisi) : les autres pins s'éteignent —
   *  null = pas de choix, tout le monde reste allumé */
  allumes?: string[] | null
  /** LA PELLICULE (CHANTIER_PELLICULE) : lieuId → tas prêt à peindre.
   *  Un lieu qui a un tas montre SES polaroids à la place du pin. */
  pellicule?: Map<string, TasAffiche>
  /** taper un tas ouvre le carrousel de la pellicule (le caller gère) */
  onTas?: (lieuId: string) => void
}) {
  const conteneur = useRef<HTMLDivElement>(null)
  const carte = useRef<maplibregl.Map | null>(null)
  // les lieux valides par id, et les markers actuellement posés (diffing,
  // clé = id de lieu — plus de préfixes l:/c: depuis la mort des grappes)
  const lieuxParId = useRef<Map<string, Lieu>>(new Map())
  const poses = useRef<Map<string, maplibregl.Marker>>(new Map())
  // les étiquettes de transport (RER/métro/tram/batobus) — cap 24,
  // remises à zéro à chaque moveend
  const etiquettesTransport = useRef<maplibregl.Marker[]>([])
  // on ne veut fetcher transport.json qu'UNE SEULE fois par montage
  const transportDejaCharge = useRef(false)
  // les tracés de lignes : la table des lignes une fois chargée, et le nom de
  // la station dont les lignes sont actuellement dessinées (null = aucune)
  const lignesConnues = useRef<Map<string, Ligne> | null>(null)
  const bouchesConnues = useRef<Record<string, Bouche[]> | null>(null)
  const stationTracee = useRef<string | null>(null)
  // les quais situés : nom de station → coordonnée, bâti une fois depuis
  // transport.json. C'est ce qui permet de poser les pastilles d'arrêt sur
  // le tracé — Ligne.stations ne porte que des noms.
  const indexStations = useRef<IndexStations | null>(null)
  // les bouches posées : marqueurs DOM (glyphe + numéro + rue), re-posés à
  // chaque zoom puisque le nom n'apparaît qu'au-delà de z17
  const marqueursBouches = useRef<maplibregl.Marker[]>([])
  const poserBouchesRef = useRef<(nom: string | null) => void>(() => {})
  // re-poser les étiquettes après un tracé, pour que la station active
  // porte sa marque (elle est repeinte, pas juste re-stylée)
  const majEtiquettesRef = useRef<() => void>(() => {})
  // effacer le tracé depuis l'extérieur du handler de chargement (tap sur la
  // carte nue, sélection d'un spot) — posé une fois la carte prête
  const effacerLignesRef = useRef<() => void>(() => {})
  // #11 : le lieu sélectionné — pilote le bottom-sheet, le carrousel et le grisé
  const [actif, setActif] = useState<string | null>(null)
  // ── les marques émoji (chantier 2) : Record<lieuId, émoji>, source
  // marques.ts (localStorage + pub/sub). En state : la pastille du sheet et
  // le panneau re-rendent tout seuls quand une marque bouge.
  const [marques, setMarques] = useState<Record<string, string>>(() => lireMarques())
  // le panneau de marque, ancré au point (appui long) — null = fermé
  const [panneauMarque, setPanneauMarque] = useState<{ id: string; x: number; y: number } | null>(
    null,
  )
  const marqueInput = useRef<HTMLInputElement>(null)
  // suivi de l'appui long sur la POUSSIÈRE (les pins ont le leur, en closure)
  const pressCarte = useRef<{ timer: number; fired: boolean; x: number; y: number } | null>(null)
  // les éléments DOM des pins de LIEUX posés, par id (pour colorer/griser sans re-créer)
  const pinEls = useRef<Record<string, HTMLElement>>({})
  // cadrage initial : UNE seule fois — consulter une fiche ne recadre plus jamais
  const dejaCadre = useRef(false)
  // la barre carrousel (pour faire défiler la carte vers la carte active)
  const carrousel = useRef<HTMLDivElement>(null)
  // fenêtrage du carrousel : l'index « au centre » (cartes réelles autour, coquilles ailleurs)
  const [centreCarrousel, setCentreCarrousel] = useState(0)
  const scrollPrevu = useRef(false)
  // photo en cours dans le bloc « détails » (feuilletable), remise à 0 au changement de lieu
  const [sheetPhoto, setSheetPhoto] = useState(0)
  // page d'infos du bloc « détails » (swipe gauche/droite) : le mot · recommandé · pratique
  const [sheetPage, setSheetPage] = useState(0)
  const sheetDepart = useRef({ x: 0, y: 0 })
  // suivi du clic long : timer + drapeau "déjà déclenché" pour ne pas aussi sélectionner
  const press = useRef<{ timer: number; fired: boolean } | null>(null)
  // valeurs vivantes pour les closures DOM / les listeners maplibre posés une fois
  const setActifRef = useRef(setActif)
  const onVoirRef = useRef(onVoir)
  const actifRef = useRef<string | null>(actif)
  const vusRef = useRef(vus)
  const comparerRef = useRef(comparer)
  const marquesRef = useRef(marques)
  const plansRef = useRef(plans)
  const onPlanRef = useRef(onPlan)
  const allumesRef = useRef(allumes)
  const pelliculeRef = useRef(pellicule)
  const onTasRef = useRef(onTas)
  // §5.2 : la grappe déployée (l'id de sa meneuse) — null = tout est replié.
  // Elle se referme au moindre mouvement de carte : c'est un geste, pas un mode.
  const grappeOuverte = useRef<string | null>(null)
  // §1.9 : la ligne du bas — ce qu'on NE PEUT PAS voir, jamais un compteur
  const [boussole, setBoussole] = useState<LigneBoussole | null>(null)
  // synchronisées après chaque rendu (règle react-hooks/refs : pas d'écriture
  // pendant le rendu) ; cet effet est déclaré AVANT ceux qui les consomment.
  useEffect(() => {
    setActifRef.current = setActif
    onVoirRef.current = onVoir
    actifRef.current = actif
    vusRef.current = vus
    comparerRef.current = comparer
    marquesRef.current = marques
    plansRef.current = plans
    onPlanRef.current = onPlan
    allumesRef.current = allumes
    pelliculeRef.current = pellicule
    onTasRef.current = onTas
  }, [setActif, onVoir, actif, vus, comparer, marques, plans, onPlan, allumes, pellicule, onTas])

  const valides = lieux.filter((l) => l.lat !== 0 || l.lng !== 0)
  const lieuActif = valides.find((l) => l.id === actif) ?? null
  // chorégraphie coupée en mini (récap figé) et si l'utilisateur demande
  // moins de mouvement — la pose reste identique, seule l'entrée change
  const animees =
    !mini &&
    !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  // le lieu affiché est-il dans la sélection « à comparer » ? (pilote le bouton)
  const actifAComparer = !!lieuActif && comparer.includes(lieuActif.id)
  // en mode comparaison, le bloc détails gagne une PAGE de plus (la dernière) :
  // l'accès à la table côte-à-côte. sinon, les 4 pages habituelles.
  // sur un lieu « à comparer », le bouton du bloc détails se transforme en
  // « comparer → » et ouvre la FICHE (nav restreinte aux lieux comparés) ; la
  // table côte-à-côte est ensuite accessible depuis la fiche → flux identique
  // à l'index.
  const enCompaCarte = actifAComparer && comparer.length > 1

  // ── fabrique le pin DOM d'un lieu (identité visuelle du carnet : initiale,
  // teinte du curateur, badges — inchangée). Les états volatils (actif/grisé/
  // vu/à comparer) sont appliqués À PART par appliquerEtats().
  // ── LE TAS DE POLAROIDS (pellicule) : la nuit d'hier sèche encore ──
  // CSS transposé du proto validé (design/carte_complete.html §2 du chantier) :
  // éventail p1..p3, photo du dessus à −2°, scotch kraft, étiquette de cire
  // avec le prénom (le pas-encore-vu), l'heure au crayon (le fait).
  const creerTas = (l: Lieu, tasA: TasAffiche): HTMLElement => {
    const el = document.createElement('div')
    el.className = `tas${tasA.vu ? ' lu' : ''}${tasA.souvenir ? ' souvenir' : ''}`
    el.style.setProperty('--t', `${tasA.taille}px`)
    const dessous = [3, 2, 1]
      .map((i) =>
        tasA.srcs[i]
          ? `<img class="f p${i}${i >= tasA.vivantes ? ' morte' : ''}" src="${tasA.srcs[i]}" alt=""/>`
          : '',
      )
      .join('')
    el.innerHTML =
      dessous +
      // §1.7 : une photo de moins d'1 h n'est pas sèche — elle arrive laiteuse
      // et se révèle en 3,2 s (classe .dev)
      `<img class="f haut${tasA.developpe ? ' dev' : ''}" src="${tasA.srcs[0]}" alt=""/><span class="kraft"></span>` +
      `<div class="bloc"><span class="nom"><i>${tasA.prenom}</i></span>` +
      `<span class="quand hand">${tasA.age}</span></div>`
    el.setAttribute('role', 'button')
    el.setAttribute(
      'aria-label',
      `${l.nom}, ${tasA.srcs.length} photo${tasA.srcs.length > 1 ? 's' : ''}, ${
        tasA.developpe
          ? t('la plus récente se développe encore')
          : `${t('la plus récente')} ${tasA.age}`
      }`,
    )
    // §5.3 — l'aplatissement : l'éventail devient UNE image peinte offscreen
    // (2 à 4 <img> → 1, plafonnée à 168 px). Best-effort et asynchrone : le
    // tas est déjà juste à l'écran, l'image composite ne fait que le remplacer.
    // On ne l'aplatit pas pendant le développement — cette photo-là s'anime.
    if (!tasA.developpe) void aplatirTas(el, tasA)
    // le tap propre du chantier (étape 2.6) : < 8 px et < 300 ms — un pan qui
    // démarre sur un tas n'ouvre JAMAIS le carrousel
    let d0: { x: number; y: number; t: number } | null = null
    el.addEventListener('pointerdown', (e) => {
      d0 = { x: e.clientX, y: e.clientY, t: Date.now() }
    })
    el.addEventListener('pointerup', (e) => {
      if (d0 && Math.hypot(e.clientX - d0.x, e.clientY - d0.y) < 8 && Date.now() - d0.t < 300) {
        // §5.2 : une meneuse de grappe ne s'ouvre pas — elle se DÉPLOIE.
        // Les tas qu'elle cachait s'étalent en éventail, puis chacun s'ouvre.
        if (el.classList.contains('tas-meneuse')) {
          grappeOuverte.current = l.id
          majGrappesRef.current()
        } else {
          onTasRef.current?.(l.id)
        }
      }
      d0 = null
    })
    return el
  }

  // ── §5.3 : remplace les <img> de l'éventail par l'image composite, une
  // fois peinte. Si le pinceau renonce (photo illisible, canvas souillé par
  // un tirage distant sans CORS), on ne touche à rien : les <img> restent.
  const aplatirTas = async (el: HTMLElement, tasA: TasAffiche) => {
    const src = await composerTas(tasA.srcs, tasA.vivantes, tasA.taille)
    // le tas a pu être retiré (pan, fonte) pendant la peinture
    if (!src || !el.isConnected) return
    const nappe = document.createElement('img')
    nappe.className = 'nappe'
    nappe.src = src
    nappe.alt = ''
    nappe.draggable = false
    el.querySelectorAll('img.f').forEach((i) => i.remove())
    el.prepend(nappe)
  }

  const creerPinLieu = (l: Lieu): HTMLElement => {
    // LA PELLICULE d'abord : un lieu qui porte un tas montre ses polaroids
    // à la place du pin — la carte devient la page du carnet où la nuit sèche.
    const tasA = pelliculeRef.current?.get(l.id)
    if (tasA && tasA.srcs.length) return creerTas(l, tasA)
    // la pastille avec initiale est un SIGNAL FORT : « un pote de ton cercle a
    // curé ce spot ». On ne la met QUE pour une vraie voix nommée (tipsCercle).
    // Le fond éditorial « jeudi. », lui, reste des pins NEUTRES — sinon la carte
    // devient une mer de « J » qui ne dit rien à personne.
    const sig = estAMoi(l) ? undefined : l.tipsCercle?.[0]
    const nbVoix = (l.note ? 1 : 0) + (l.tipsCercle?.length ?? 0)
    const valide = l.tampon?.v === 'valide'
    const etatH = etatHoraire(l.horaires)
    const ferme = etatH?.ouvert === false
    // « on ne sait pas » : horaires absents ou borne à null. Avant le 09/08 ce
    // cas se présentait exactement comme un lieu ouvert — un petit mensonge.
    const inconnu = !etatH || etatH.ouvert === null
    const marque = marquesRef.current[l.id]
    const el = document.createElement('div')
    if (marque) {
      // lieu MARQUÉ : l'émoji choisi par l'utilisateur dans une pastille
      // papier, À LA PLACE du pin standard. L'émoji est du CONTENU utilisateur
      // (il l'a posé lui-même) — exception assumée à la règle « jamais
      // d'émoji dans le chrome » (décision Ersan, voir marques.ts).
      el.className = `pin pin-marque${ferme ? ' pin-ferme' : ''}`
      el.textContent = marque
    } else {
      // pins homogènes (façon Airbnb/Google) : la photo vit dans la fiche au tap,
      // pas sur la carte. point rouge = toi · pastille ivoire + initiale = curateur.
      el.className = `pin${sig ? ' pin-curateur' : ''}${valide ? ' pin-valide' : ''}${ferme ? ' pin-ferme' : ''}`
      if (sig) {
        // une teinte par curateur. 09/08 : elle ne PEINT PLUS LE FOND — la
        // boîte du pin est invisible depuis la refonte, un fond y redessinait
        // le disque qu'on venait d'enlever. On repose la teinte sur
        // --pin-glyphe : elle descend d'un coup sur le glyphe ET le marqueur
        // (tous deux tracés à cette encre). L'initiale reste dans le DOM pour
        // rien de visible (le CSS la masque) — elle vit dans la fiche.
        el.style.setProperty('--pin-glyphe', teinteCurateur(sig.auteur))
        el.textContent = sig.auteur ? sig.auteur.charAt(0).toUpperCase() : ''
        // recommandé par plusieurs : un badge avec le nombre de voix
        if (nbVoix > 1) {
          const badge = document.createElement('span')
          badge.className = 'pin-badge mono'
          badge.textContent = String(nbVoix)
          el.appendChild(badge)
        }
      }
      // le TYPE du lieu, d'un coup d'œil : un glyphe à l'encre (verre, note,
      // tasse, cornet, cloche, assiette) — révélé AVEC le label au zoom
      // quartier (CSS .label-on), pour que la carte reste un carnet, pas
      // un sapin. Jamais un émoji dans le chrome (DA).
      const glyphe = document.createElement('span')
      glyphe.className = 'pin-type'
      glyphe.innerHTML = svgTypeLieu(typeDeLieu(l))
      el.appendChild(glyphe)
      // le TAMPON DE DOUANE : la nationalité de la cuisine en deux lettres
      // au crayon (IT, JP, LB…) — jamais un drapeau émoji (DA). Réservé aux
      // lieux où l'on mange ; la cuisine française n'a pas de tampon.
      const type = typeDeLieu(l)
      if (type === 'resto' || type === 'gastro' || type === 'street') {
        const cuisine = cuisineDeLieu(l)
        if (cuisine) {
          const douane = document.createElement('span')
          douane.className = 'pin-douane mono'
          douane.textContent = cuisine.code
          douane.title = t(cuisine.mot)
          el.appendChild(douane)
        }
      }
      // Coupe du monde : pastille ballon sur les lieux qui diffusent les matchs
      if (l.match === 'diffuse') {
        const ballon = document.createElement('span')
        ballon.className = 'pin-ballon'
        ballon.title = t('on y voit les matchs')
        ballon.innerHTML =
          '<svg viewBox="0 0 24 24" fill="none" stroke="#15130f" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7l3.4 2.5-1.3 4h-4.2l-1.3-4z"/></svg>'
        el.appendChild(ballon)
      }
    }
    // ── REFONTE DU 09/08 : LE MARQUEUR, ce qui désigne vraiment le lieu ──
    // Échelle de priorité (dictionnaire_carte_001.html) : le plus haut qui
    // est vrai gagne. L'œil suit la PILE explicite (aTester = 'oui'), jamais
    // la règle passive « pas de tampon » — sinon il se poserait sur les 300.
    const aTester = lireATester()[l.id] === 'oui'
    const mq = document.createElement('span')
    if (l.raye) {
      // ⚠ SANS DONNÉE (cf. db.ts) — la croix bat tout : le lieu est mort
      // pour toi, le reste de ta relation ne compte plus.
      mq.className = 'pin-mq pin-mq-croix'
      mq.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg>'
    } else if (l.favori) {
      // ⚠ SANS DONNÉE — le cœur passe devant la pépite SUR TA CARTE : elle
      // raconte ta relation. Chez tes potes, c'est le diamant qui gagnera.
      // Plein si tu y es allé (le tampon), creux sinon : une envie.
      mq.className = `pin-mq pin-mq-coeur${l.tampon ? ' mq-plein' : ''}`
      mq.innerHTML =
        '<svg viewBox="0 0 24 24"><path d="M12 20.8C12 20.8 3 15.2 3 9.4 3 6.4 5.2 4.4 7.7 4.4c1.9 0 3.5 1.2 4.3 2.6.8-1.4 2.4-2.6 4.3-2.6C18.8 4.4 21 6.4 21 9.4c0 5.8-9 11.4-9 11.4z"/></svg>'
    } else if (l.pepite) {
      // ⚠ SANS DONNÉE — la pépite, toujours au trait (taille brillant D1 :
      // un tiers de couronne, deux tiers de pavillon, plus large que haute)
      mq.className = 'pin-mq pin-mq-diamant'
      mq.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8.4 5h7.2l5 5.2-8.6 10.6L3.4 10.2z"/></svg>'
    } else if (aTester) {
      // l'œil : on me l'a recommandé, je compte y aller
      mq.className = 'pin-mq pin-mq-oeil'
      mq.innerHTML =
        '<svg viewBox="0 0 24 24"><path d="M12 4.5c5.5 0 10 7.5 10 7.5s-4.5 7.5-10 7.5S2 12 2 12s4.5-7.5 10-7.5z"/><circle class="pu" cx="12" cy="12" r="3.4"/></svg>'
    } else if (l.tampon) {
      // le tampon : on pose un anneau autour du point qui existait déjà
      mq.className = 'pin-mq pin-mq-cercle'
      mq.innerHTML =
        '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle class="pu" cx="12" cy="12" r="3.4"/></svg>'
    } else {
      // le point nu : rien dit — le degré zéro, et la majorité de la carte
      mq.className = 'pin-mq'
      mq.appendChild(document.createElement('i'))
    }
    el.appendChild(mq)
    // les trois crans d'encre du glyphe : on ne dit que ce qu'on SAIT
    if (inconnu) el.classList.add('pin-inconnu')
    // fraîchement posé : ça bat pendant trois jours
    if (Date.now() - Date.parse(l.creeLe) < 3 * 864e5) el.classList.add('pin-frais')
    // le contenant (bas tiré 45° · 3 px) — l'exception, il ne revient que
    // sur le lieu sélectionné. Tracé pour r=15 : il coiffe la boîte de 30 px.
    const ct = document.createElement('span')
    ct.className = 'pin-ct'
    ct.innerHTML =
      '<svg width="54" height="57" viewBox="-27 -27 54 57">' +
      '<path class="lueur" d="M -10.61 10.61 A 15 15 0 1 1 10.61 10.61 C 5.80 15.41, 3.00 16.74, 0 18.00 C -3.00 16.74, -5.80 15.41, -10.61 10.61 Z"/>' +
      '<path class="corps" d="M -10.61 10.61 A 15 15 0 1 1 10.61 10.61 C 5.80 15.41, 3.00 16.74, 0 18.00 C -3.00 16.74, -5.80 15.41, -10.61 10.61 Z"/>' +
      '</svg>'
    el.appendChild(ct)
    // « je sais pas » : le rôle du lieu dans sa proposition — le A (le spot)
    // porte le jeton numéroté à l'encre du plan, le B (le plan B) porte un
    // « B » de la même encre désaturée. La classe pin-pN pose l'encre (CSS).
    const pl = plansRef.current?.[l.id]
    if (pl) {
      el.classList.add(`pin-p${pl.n}`)
      if (pl.role === 'B') el.classList.add('pin-role-b')
      const jeton = document.createElement('span')
      jeton.className = 'pin-plan mono'
      jeton.textContent = pl.role === 'B' ? 'B' : String(pl.n)
      el.appendChild(jeton)
    }
    // le diffing des marques compare ce dataset à l'état courant (effet [marques])
    el.dataset.marque = marque ?? ''
    // le nom s'affiche en label sous le pin (au zoom suffisant) — l'émoji, lui,
    // ne va JAMAIS dans les labels texte (le label reste le nom, point).
    el.setAttribute('data-nom', l.nom)
    el.title = l.nom
    // priorité d'affichage du label : marqué > validé > plusieurs voix > ouvert
    const ouvertMaintenant = etatHoraire(l.horaires)?.ouvert === true
    el.dataset.prio = String(
      (marque ? 4 : 0) + (valide ? 3 : 0) + (nbVoix > 1 ? 2 : 0) + (ouvertMaintenant ? 1 : 0),
    )
    // #11 : 1er tap = sélectionne (nom+desc en bottom-sheet, carte en couleur,
    // le reste grisé) · 2e tap sur le même pin = la fiche détaillée.
    //
    // ⚠️ ARBITRAGE appui long (chantier 2) : l'appui long sur un pin ouvrait
    // conceptuellement « à comparer » (comme les cartes du carrousel). Décision :
    // sur la CARTE, l'appui long ouvre LE panneau de marque — et la bascule
    // « à comparer » y entre comme dernière ligne. Un seul geste, tout au même
    // endroit. (Le carrousel, lui, garde son appui long direct.)
    let press: { timer: number; fired: boolean; x: number; y: number } | null = null
    el.addEventListener('pointerdown', (ev) => {
      press = { fired: false, timer: 0, x: ev.clientX, y: ev.clientY }
      if (mini) return // mini = récap figé : pas de panneau, le tap reste
      press.timer = window.setTimeout(() => {
        if (press) press.fired = true
        ouvrirPanneauRef.current(l.id)
      }, APPUI_LONG_MS)
    })
    el.addEventListener('pointermove', (ev) => {
      // le doigt dérive : c'est un pan de carte, pas un appui ni un tap
      if (press && (Math.abs(ev.clientX - press.x) > TREMBLE_PX || Math.abs(ev.clientY - press.y) > TREMBLE_PX)) {
        window.clearTimeout(press.timer)
        press = null
      }
    })
    const annuler = () => {
      if (press) {
        window.clearTimeout(press.timer)
        press = null
      }
    }
    el.addEventListener('pointercancel', annuler)
    el.addEventListener('pointerleave', annuler)
    el.addEventListener('pointerup', (ev) => {
      ev.stopPropagation()
      const p = press
      press = null
      if (!p) return // parti en pan (ou déjà annulé) : pas une sélection
      window.clearTimeout(p.timer)
      if (p.fired) return // c'était l'appui long → le panneau est déjà là
      // « je sais pas » : taper un pin de plan allume SA proposition (A + B
      // s'éclairent ensemble) — re-taper un pin déjà allumé ouvre sa fiche
      const plTap = plansRef.current?.[l.id]
      if (plTap && onPlanRef.current) {
        if (el.classList.contains('pin-allume')) {
          onVoirRef.current?.(l)
          return
        }
        onPlanRef.current(plTap.n)
        return
      }
      if (el.classList.contains('pin-actif')) {
        onVoirRef.current?.(l)
        return
      }
      setActifRef.current(l.id)
    })
    // le click résiduel (après pointerup) ne doit pas atteindre la carte
    // (sinon le handler poussière re-sélectionnerait sous le pin)
    el.addEventListener('click', (ev) => ev.stopPropagation())
    return el
  }

  // ── ouvre le panneau de marque, ancré au lieu (appui long pin/poussière) ──
  const ouvrirPanneauMarque = (id: string) => {
    if (mini) return // le récap est figé : pas de panneau
    const m = carte.current
    const l = lieuxParId.current.get(id)
    if (!m || !l) return
    // .carte est fixed inset:0 → les coords projetées = les coords viewport
    const pt = m.project([l.lng, l.lat])
    setPanneauMarque({ id, x: pt.x, y: pt.y })
    navigator.vibrate?.(30)
  }
  const ouvrirPanneauRef = useRef(ouvrirPanneauMarque)

  // ── la poussière d'encre : le GeoJSON de TOUS les lieux valides ──
  const donneesPoussiere = (): FeatureCollection<Point, { id: string }> => ({
    type: 'FeatureCollection',
    features: [...lieuxParId.current.values()].map((l) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [l.lng, l.lat] },
      properties: { id: l.id },
    })),
  })

  // le lieu de poussière le plus proche d'un point écran (hitbox élargie
  // ~12 px) — null si rien sous le doigt. queryRenderedFeatures : le GPU a
  // déjà les points, aucun calcul JS sur les 750 lieux.
  const lieuSousPoint = (p: { x: number; y: number }): string | null => {
    const m = carte.current
    if (!m || !m.getLayer(LAYER_POUSSIERE)) return null
    const feats = m.queryRenderedFeatures(
      [
        [p.x - HITBOX_POUSSIERE, p.y - HITBOX_POUSSIERE],
        [p.x + HITBOX_POUSSIERE, p.y + HITBOX_POUSSIERE],
      ],
      { layers: [LAYER_POUSSIERE] },
    )
    let meilleur: string | null = null
    let dMin = Infinity
    for (const f of feats) {
      const id = (f.properties as { id?: string }).id
      const l = id ? lieuxParId.current.get(id) : undefined
      if (!id || !l) continue
      const q = m.project([l.lng, l.lat])
      const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2
      if (d < dMin) {
        dMin = d
        meilleur = id
      }
    }
    return meilleur
  }

  // ── réapplique les états volatils sur les pins POSÉS (survit au diffing) :
  // sélection, grisé, vu, à comparer. Appelée après chaque re-pose ET quand
  // `actif` / `vus` / `comparer` changent — sans jamais recréer un marker.
  const appliquerEtats = () => {
    const a = actifRef.current
    const c = comparerRef.current
    const v = vusRef.current
    // le plan allumé (« je sais pas ») : hors du plan choisi, le pin s'éteint
    const alm = allumesRef.current ? new Set(allumesRef.current) : null
    for (const [id, el] of Object.entries(pinEls.current)) {
      el.classList.toggle('pin-actif', id === a)
      el.classList.toggle(
        'pin-grise',
        (a !== null && id !== a) || (alm !== null && !alm.has(id)),
      )
      // le plan choisi S'ÉCLAIRE : le pin prend l'encre de son plan (A pleine,
      // B désaturée) avec un petit sursaut — l'ajout de la classe rejoue l'anim
      el.classList.toggle('pin-allume', alm !== null && alm.has(id))
      el.classList.toggle('pin-acomparer', c.includes(id))
      el.classList.toggle('pin-vu', v?.has(id) === true)
    }
  }

  // ── labels anti-collision : jamais tous ; ~8 max, par priorité, sans
  // chevauchement. Version SANS getBoundingClientRect : on connaît les
  // coordonnées géo → map.project() (pur calcul), sur les seuls pins visibles.
  const majLabels = () => {
    const m = carte.current
    if (!m) return
    const entrees = Object.entries(pinEls.current)
    // dézoomé : la carte respire, zéro label
    if (m.getZoom() < 13) {
      for (const [, el] of entrees) el.classList.remove('label-on')
      return
    }
    // priorité : actif > déjà affiché (hystérésis, anti-clignotement) > data-prio
    const candidats: { el: HTMLElement; boite: Boite; actif: boolean; score: number }[] = []
    for (const [id, el] of entrees) {
      const l = lieuxParId.current.get(id)
      if (!l) continue
      const pt = m.project([l.lng, l.lat])
      const nom = l.nom.slice(0, 16)
      const w = nom.length * 5.5 + 12
      // depuis le 09/08 le marqueur tombe SUR les coordonnées et le label
      // naît juste dessous — d'où un simple +9 au lieu de l'ancien +11.
      const boite: Boite = { x: pt.x - w / 2, y: pt.y + 9, w, h: 14 }
      const estActif = el.classList.contains('pin-actif')
      candidats.push({
        el,
        boite,
        actif: estActif,
        score:
          (estActif ? 100 : 0) +
          (el.classList.contains('label-on') ? 10 : 0) +
          Number(el.dataset.prio || 0),
      })
    }
    candidats.sort((a, b) => b.score - a.score)
    const posees: Boite[] = []
    let n = 0
    for (const c of candidats) {
      if (c.actif) {
        c.el.classList.add('label-on')
        posees.push(c.boite)
        n++
        continue
      }
      if (n >= PLAFOND_LABELS || posees.some((o) => chevauche(o, c.boite))) {
        c.el.classList.remove('label-on')
      } else {
        c.el.classList.add('label-on')
        posees.push(c.boite)
        n++
      }
    }
  }

  // ── §5.2 LE CLUSTERING DES TAS ────────────────────────────────────
  // Oberkampf un samedi = 15 tas superposés. Ceux qui se chevauchent
  // fusionnent : la plus FRAÎCHE reste (la meneuse), les autres se cachent
  // derrière elle, et le crayon annonce « 3 spots ici ». Le tap déploie
  // l'éventail. Le z-order suit la fraîcheur décroissante.
  const majGrappes = () => {
    const m = carte.current
    const pel = pelliculeRef.current
    if (!m) return
    const points: PointTas[] = []
    for (const id of Object.keys(pinEls.current)) {
      const ta = pel?.get(id)
      const l = lieuxParId.current.get(id)
      if (!ta || !l || !pinEls.current[id].classList.contains('tas')) continue
      const pt = m.project([l.lng, l.lat])
      points.push({ lieuId: id, x: pt.x, y: pt.y, taille: ta.taille, fraicheurH: ta.fraicheurH })
    }
    const grappes = grouperTas(points)
    // le z-order : la nuit la plus chaude passe devant (rang global, pas
    // par grappe — deux grappes voisines s'ordonnent aussi entre elles)
    const rang = new Map(
      [...points].sort((a, b) => a.fraicheurH - b.fraicheurH).map((p, i) => [p.lieuId, i]),
    )
    for (const g of grappes) {
      const deployee = grappeOuverte.current !== null && g.lieux.includes(grappeOuverte.current)
      const suiveuses = g.lieux.slice(1)
      const ecarts = deployee
        ? eventailGrappe(
            suiveuses.length,
            Math.max(58, (pel?.get(g.lieux[0])?.taille ?? 60) * 1.15),
          )
        : []
      g.lieux.forEach((id, i) => {
        const el = pinEls.current[id]
        if (!el) return
        const mk = poses.current.get(id)
        if (mk) mk.getElement().style.zIndex = String(500 - (rang.get(id) ?? 0))
        const meneuse = i === 0 && suiveuses.length > 0 && !deployee
        el.classList.toggle('tas-meneuse', meneuse)
        el.classList.toggle('tas-suivante', i > 0 && !deployee)
        el.classList.toggle('tas-deploye', i > 0 && deployee)
        if (i > 0 && deployee) {
          const p = ecarts[i - 1]
          el.style.setProperty('--gx', `${p.dx}px`)
          el.style.setProperty('--gy', `${p.dy}px`)
        } else {
          el.style.removeProperty('--gx')
          el.style.removeProperty('--gy')
        }
        habillerMeneuse(el, meneuse ? g.lieux : [id])
      })
    }
  }

  // la meneuse parle pour toute sa grappe : le crayon dit combien de spots
  // sont là-dessous, et l'étiquette de cire reste allumée tant qu'un seul
  // des tas cachés n'a pas été ouvert (sinon la fusion effacerait le signal)
  const habillerMeneuse = (el: HTMLElement, lieux: string[]) => {
    const pel = pelliculeRef.current
    const bloc = el.querySelector('.bloc')
    const quand = el.querySelector('.quand')
    let lbl = el.querySelector('.grappe-lbl')
    if (lieux.length < 2) {
      lbl?.remove()
      quand?.classList.remove('grappe-off')
      const seul = pel?.get(lieux[0])
      if (seul) {
        el.classList.toggle('lu', seul.vu)
        const nom = el.querySelector('.nom i')
        if (nom && nom.textContent !== seul.prenom) nom.textContent = seul.prenom
      }
      return
    }
    const membres = lieux.map((id) => pel?.get(id)).filter((x): x is TasAffiche => !!x)
    const tousLus = membres.every((x) => x.vu)
    el.classList.toggle('lu', tousLus)
    // le prénom affiché = celui de la plus fraîche encore SCELLÉE — la
    // meneuse porte la nouvelle qui reste à lire, pas la sienne
    const porteVoix = membres.find((x) => !x.vu) ?? membres[0]
    const nom = el.querySelector('.nom i')
    if (nom && nom.textContent !== porteVoix.prenom) nom.textContent = porteVoix.prenom
    // l'heure cède sa ligne au crayon : « 3 spots ici »
    quand?.classList.add('grappe-off')
    if (!lbl && bloc) {
      lbl = document.createElement('span')
      lbl.className = 'grappe-lbl hand'
      bloc.appendChild(lbl)
    }
    const texte = `${lieux.length} ${t('spots ici')}`
    if (lbl && lbl.textContent !== texte) lbl.textContent = texte
  }

  // ── §1.9 LA LIGNE-BOUSSOLE ────────────────────────────────────────
  // Elle ne parle QUE de ce que la carte ne montre pas : le hors-champ,
  // ou le pas-encore-lu. Elle nomme une chose, jamais des gens.
  const majBoussole = () => {
    const m = carte.current
    const pel = pelliculeRef.current
    if (!m) return setBoussole(null)
    const b = m.getBounds()
    const candidats: CandidatBoussole[] = []
    for (const [id, ta] of pel ?? []) {
      const l = lieuxParId.current.get(id)
      if (!l) continue
      candidats.push({
        lieuId: id,
        nom: l.nom,
        lng: l.lng,
        lat: l.lat,
        prenom: ta.prenom,
        vu: ta.vu,
        fraicheurH: ta.fraicheurH,
        aLEcran: b.contains([l.lng, l.lat]),
      })
    }
    const c = m.getCenter()
    setBoussole(ligneBoussole(candidats, { lng: c.lng, lat: c.lat }))
  }

  // ── LE cœur : pose en DOM les N meilleurs lieux VISIBLES (N selon le
  // zoom), en diffant contre l'existant (crée les nouveaux, retire les
  // disparus, ne touche pas au reste). La poussière d'encre (layer GPU)
  // montre déjà TOUT le monde : les pins n'habillent que les prioritaires —
  // et TOUS les visibles dès le zoom quartier (z ≥ 14,5).
  //
  // Priorité : marqué (émoji) > à moi/validé > favori/à comparer > tip du
  // cercle > proximité du centre de vue. Appelé sur moveend/zoomend — jamais
  // à chaque frame. Naissances/retraits : fondu court 150 ms --pose.
  const poserVisibles = () => {
    const m = carte.current
    if (!m) return
    const b = m.getBounds()
    // marge de 10 % autour du viewport : pas de pop au ras du bord en fin de pan
    const margeX = (b.getEast() - b.getWest()) * 0.1
    const margeY = (b.getNorth() - b.getSouth()) * 0.1
    const ouest = b.getWest() - margeX
    const est = b.getEast() + margeX
    const sud = b.getSouth() - margeY
    const nord = b.getNorth() + margeY
    const centre = m.getCenter()
    const marquesL = marquesRef.current
    const favoris = new Set(lireFavoris())
    const aComparer = new Set(comparerRef.current)

    // le rang d'un lieu (plus haut = pin posé d'abord)
    const score = (l: Lieu): number => {
      if (marquesL[l.id]) return 5 // marqué : toujours posé, dès z11
      if (estAMoi(l) || l.tampon?.v === 'valide') return 4
      if (favoris.has(l.id) || aComparer.has(l.id)) return 3
      if (l.tipsCercle?.length) return 2
      return 1
    }

    const visibles: { l: Lieu; s: number; d: number }[] = []
    for (const l of lieuxParId.current.values()) {
      if (l.lng < ouest || l.lng > est || l.lat < sud || l.lat > nord) continue
      visibles.push({ l, s: score(l), d: distanceM(l, centre) })
    }
    visibles.sort((x, y) => y.s - x.s || x.d - y.d)

    const plafond = plafondPins(m.getZoom())
    const voulus = new Set<string>()
    for (const v of visibles) {
      if (voulus.size >= plafond) break
      voulus.add(v.l.id)
    }
    // le lieu SÉLECTIONNÉ garde toujours son pin, même non prioritaire
    const a = actifRef.current
    if (a && lieuxParId.current.has(a)) voulus.add(a)
    // les TAS de la pellicule passent toujours devant le plafond : c'est
    // la nuit du cercle, jamais une victime du tri de densité. Mais §5.3 :
    // le DOM ne garde QUE les tas visibles — un tas à l'autre bout de Paris
    // n'a rien à faire dans la page (la boussole, elle, le sait toujours).
    for (const id of pelliculeRef.current?.keys() ?? []) {
      const l = lieuxParId.current.get(id)
      if (!l) continue
      if (l.lng < ouest || l.lng > est || l.lat < sud || l.lat > nord) continue
      voulus.add(id)
    }

    // ── LE DOUBLE POINT (correctif 09/08) ──
    // La poussière pose un point sur TOUS les lieux, y compris ceux qui ont
    // un pin. Tant que le pin était une pastille opaque de 30 px posée sur
    // les coordonnées, elle couvrait son propre grain et personne ne le
    // voyait. Depuis la refonte, le pin ne pose plus qu'un marqueur de
    // 3,5 px au même endroit : le grain d'ivoire dépassait tout autour —
    // un halo gris sous chaque épingle, et deux points pour un seul lieu.
    // On retire donc de la poussière exactement ce que le DOM raconte déjà.
    // La texture de la ville reste entière : elle dit les ~700 AUTRES.
    if (m.getLayer(LAYER_POUSSIERE)) {
      m.setFilter(LAYER_POUSSIERE, ['!', ['in', ['get', 'id'], ['literal', [...voulus]]]])
    }

    // ── pose des entrants (naissance : l'encre se dépose, .pin-depose) ──
    for (const id of voulus) {
      if (poses.current.has(id)) continue
      const l = lieuxParId.current.get(id)
      if (!l) continue
      const el = creerPinLieu(l)
      pinEls.current[id] = el
      poses.current.set(
        id,
        new maplibregl.Marker({
          element: enrober(el),
          // le tas est ANCRÉ par le bas : l'épingle graphite (::after)
          // pointe la position géographique exacte (chantier §1.2)
          anchor: el.classList.contains('tas') ? 'bottom' : 'center',
          // REFONTE 09/08 : le pin remonte de (rayon + écart + demi-marqueur)
          // pour que le CENTRE DU MARQUEUR tombe pile sur les coordonnées.
          // 15 + 5 + 6 = 26. Constante, parce que tous les marqueurs
          // partagent la même boîte de 12 px (cf. .pin-mq dans index.css).
          offset: el.classList.contains('tas') ? [0, 0] : [0, -DECALAGE_MARQUEUR],
        })
          .setLngLat([l.lng, l.lat])
          .addTo(m),
      )
      if (animees) el.classList.add('pin-depose')
    }
    // ── retrait des sortants (fondu court — plus de vol vers un centroïde) ──
    for (const [id, mk] of [...poses.current]) {
      if (voulus.has(id)) continue
      poses.current.delete(id)
      const el = pinEls.current[id]
      delete pinEls.current[id]
      if (!animees || !el) {
        mk.remove()
        continue
      }
      retirerEnFondu(mk, el)
    }
    appliquerEtats()
    majLabels()
    majGrappes()
    majBoussole()
  }

  // refs vivantes pour les listeners maplibre posés une seule fois au mount ;
  // synchronisées après chaque rendu, avant les effets consommateurs ci-dessous.
  const poserRef = useRef(poserVisibles)
  const majLabelsRef = useRef(majLabels)
  const appliquerEtatsRef = useRef(appliquerEtats)
  const majGrappesRef = useRef(majGrappes)
  useEffect(() => {
    poserRef.current = poserVisibles
    majLabelsRef.current = majLabels
    appliquerEtatsRef.current = appliquerEtats
    majGrappesRef.current = majGrappes
    ouvrirPanneauRef.current = ouvrirPanneauMarque
  })

  // ── la pellicule a changé (sceau brisé, nouvelle photo, fonte) : les
  // tas concernés sont re-fabriqués — peu nombreux, re-création directe
  const tasPoses = useRef<Set<string>>(new Set())
  useEffect(() => {
    const ids = new Set(pellicule?.keys() ?? [])
    for (const id of new Set([...ids, ...tasPoses.current])) {
      const mk = poses.current.get(id)
      if (mk) {
        mk.remove()
        poses.current.delete(id)
        delete pinEls.current[id]
      }
    }
    tasPoses.current = ids
    // les éléments ont été refaits : l'éventail déployé n'existe plus
    grappeOuverte.current = null
    poserRef.current()
  }, [pellicule])

  // le carrousel demande à la carte de suivre la soirée (chantier §1.6) :
  // un CustomEvent léger — pas de ref à faire remonter jusqu'à App
  useEffect(() => {
    const suivre = (e: Event) => {
      const d = (e as CustomEvent<{ lng: number; lat: number }>).detail
      if (d) carte.current?.easeTo({ center: [d.lng, d.lat], duration: 600 })
    }
    window.addEventListener('jeudi:easeto', suivre)
    return () => window.removeEventListener('jeudi:easeto', suivre)
  }, [])

  useEffect(() => {
    const cont = conteneur.current
    if (!cont) return
    carte.current = new maplibregl.Map({
      container: cont,
      style: STYLE,
      center: moi(),
      zoom: 13,
      // le petit "i" : compact (replié), placé en bas à gauche ci-dessous
      attributionControl: false,
    })
    carte.current.on('error', (e) => console.error('[carte]', e.error ?? e))
    // le conteneur est révélé au toggle "carte" : maplibre s'initialise
    // parfois avec une taille périmée → tuiles et pins désynchronisés.
    // on force un resize une fois la carte prête.
    carte.current.on('load', () => {
      const m = carte.current
      if (!m) return
      m.resize()
      // ── la poussière d'encre : tous les lieux en points GPU. Rayon ~2 px
      // à z11 → ~4 px à z14, encre (--encre #EFE9D8) à ~55 %, léger halo.
      // C'est la texture de la ville, toujours là sous les pins.
      // ── les repères de transport : le NOM de la station en Caveat, précédé
      // du mode en PLAQUE pleine aux couleurs RATP (M / RER / T / BAT).
      // Variante « C » de design/etiquettes_transport.html (6 pistes comparées
      // le 07/08 : nom seul, sigle+nom, plaque, M° manuscrit, souligné,
      // cocarde ; B d'abord retenue puis remplacée par C le 08/08).
      // Opacité très basse : c'est un filigrane, un cran sous tout le reste.
      // Bus/Vélib' non étiquetés (trop denses, ~4500 points). Cap 24,
      // collision 82 px, seuils zoom par mode.
      //
      // ── TOUCHER une station trace ses lignes (08/08) : c'est la seule
      // chose tapable du transport. Une station qui sert 5 lignes les allume
      // TOUTES — pas de menu au milieu de la carte pour choisir. Le tracé est
      // éphémère : il s'efface au tap suivant ou en touchant la carte nue.
      // Les traits vivent SOUS la poussière et les épingles (ajoutés avant).
      if (!m.getSource(SOURCE_LIGNES)) {
        m.addSource(SOURCE_LIGNES, { type: 'geojson', data: AUCUNE_LIGNE })
        // le halo sombre : décolle le trait des rues du fond, sinon la ligne
        // se confond avec le dessin de la ville sur les tuiles claires
        m.addLayer({
          id: LAYER_LIGNES_HALO,
          type: 'line',
          source: SOURCE_LIGNES,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#0b1a3a',
            'line-width': ['interpolate', ['linear'], ['zoom'], 11, 5, 15, 9],
            'line-opacity': 0.55,
          },
        })
        // le trait : la couleur de la charte IDFM, portée par la donnée.
        // Pleine opacité — c'est ce qu'on vient de demander à voir, ça n'a
        // aucune raison d'être en retrait comme les étiquettes.
        m.addLayer({
          id: LAYER_LIGNES,
          type: 'line',
          source: SOURCE_LIGNES,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': ['get', 'couleur'],
            'line-width': ['interpolate', ['linear'], ['zoom'], 11, 3, 15, 6],
            'line-opacity': 1,
          },
        })
      }
      // ── LES POINTS DE QUAI (08/08) : le trait dit par où ça passe, les
      // pastilles disent où ça s'arrête. Grammaire du plan de métro — un
      // rond d'encre cerclé de la couleur de la ligne — posé AU-DESSUS du
      // trait (donc ajouté après lui). La station touchée porte la sienne en
      // plus gros : on retrouve d'un coup d'œil d'où on est parti.
      if (!m.getSource(SOURCE_ARRETS)) {
        m.addSource(SOURCE_ARRETS, { type: 'geojson', data: AUCUN_ARRET })
        m.addLayer({
          id: LAYER_ARRETS,
          type: 'circle',
          source: SOURCE_ARRETS,
          paint: {
            'circle-color': '#EFE9D8',
            'circle-stroke-color': ['get', 'couleur'],
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              12, ['*', 3, ['get', 'ech']],
              16, ['*', 5, ['get', 'ech']],
            ],
            'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 12, 1.2, 16, 2],
          },
          // la grande pastille passe devant ses voisines quand deux quais
          // se serrent (Opéra, Châtelet) — sinon la station touchée se
          // ferait mordre par la suivante
          layout: { 'circle-sort-key': ['get', 'ech'] },
        })
      }
      // toucher la station allume ses lignes ; la retoucher (ou toucher la
      // carte nue) les éteint. Une seule station tracée à la fois.
      // ── la bouche de métro : une flèche qui descend dans un U, le numéro de
      // sortie à côté, le nom de rue centré dessous. Le glyphe EST le point
      // d'ancrage — la flèche tombe sur la vraie bouche, le texte déborde —
      // parce qu'une bouche, sa précision est justement ce qu'on vient
      // chercher. Numéro dès z15, nom élagué à partir de z17, 8 au maximum.
      // le U est l'ouverture, la flèche dit le sens. Elle descend dedans quand
      // on peut entrer, elle en ressort quand l'accès ne fait que sortir.
      // Le sens vient d'IDFM (voir lignes.ts) : sans lui on ne dessinerait que
      // des flèches descendantes, ce qui affirmerait à tort que tout se
      // franchit dans les deux sens.
      const svgU = (d: string) =>
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
        'stroke-linecap="round" stroke-linejoin="round">' + d +
        '<path d="M6 14v6h12v-6"/></svg>'
      const FLECHE_DESCEND = svgU('<path d="M12 3v8"/><path d="M8 7.5l4 4 4-4"/>')
      const FLECHE_REMONTE = svgU('<path d="M12 11V3"/><path d="M8 6.5l4-4 4 4"/>')
      const poserBouches = (nom: string | null) => {
        for (const mk of marqueursBouches.current) mk.remove()
        marqueursBouches.current = []
        if (!carte.current) return
        const liste = bouchesPour(nom, bouchesConnues.current, carte.current.getZoom())
        marqueursBouches.current = liste.map((b) => {
          const el = document.createElement('div')
          el.className = 'bouche-metro'
          const tete = document.createElement('span')
          tete.className = 'bouche-metro-tete'
          const g = document.createElement('span')
          g.className = 'bouche-metro-glyphe'
          g.innerHTML = b.sens === 's' ? FLECHE_REMONTE : FLECHE_DESCEND
          if (b.sens) el.dataset.sens = b.sens
          el.title = b.sens === 's' ? 'sortie seulement' : b.sens === 'e' ? 'entrée seulement' : ''
          tete.append(g)
          if (b.num) {
            const n = document.createElement('b')
            n.className = 'bouche-metro-num'
            n.textContent = b.num
            tete.append(n)
          }
          el.append(tete)
          if (b.nom) {
            const r = document.createElement('span')
            r.className = 'bouche-metro-rue'
            r.textContent = b.nom
            el.append(r)
          }
          return new maplibregl.Marker({ element: el, anchor: 'top-left', offset: [-8, -8] })
            .setLngLat(b.p)
            .addTo(carte.current!)
        })
      }
      poserBouchesRef.current = poserBouches

      const peindre = (nom: string | null, ids?: string[]) => {
        const sl = m.getSource(SOURCE_LIGNES) as maplibregl.GeoJSONSource | undefined
        const sa = m.getSource(SOURCE_ARRETS) as maplibregl.GeoJSONSource | undefined
        const table = lignesConnues.current
        sl?.setData(!ids || !table ? AUCUNE_LIGNE : tracesPour(ids, table))
        // les arrêts vivent le même cycle que le trait : posés au même
        // moment, effacés au même peindre(null)
        sa?.setData(arretsPour(ids, table, indexStations.current, nom))
        poserBouches(nom)
      }
      const basculerLignes = (nom: string, ids?: string[]) => {
        const memeStation = stationTracee.current === nom
        stationTracee.current = memeStation ? null : nom
        if (memeStation) {
          peindre(null)
        } else {
          // les bouches ne descendent qu'au premier tap de la session
          chargerBouches()
            .then((b) => {
              bouchesConnues.current = b
              if (stationTracee.current === nom) peindre(nom, ids)
            })
            .catch((err) => console.warn('[carte] entrees.json:', err))
          peindre(nom, ids)
        }
        majEtiquettesRef.current()
      }
      effacerLignesRef.current = () => {
        if (!stationTracee.current) return
        stationTracee.current = null
        peindre(null)
        majEtiquettesRef.current()
      }

      if (!transportDejaCharge.current) {
        transportDejaCharge.current = true
        chargerLignes()
          .then((t) => { lignesConnues.current = t })
          .catch((err) => console.warn('[carte] lignes.json:', err))
        donneesTransport()
          .then((geo) => {
            const nommables = geo.features.filter((f) =>
              f.properties.type === 'rer' ||
              f.properties.type === 'metro' ||
              f.properties.type === 'tram' ||
              f.properties.type === 'batobus',
            )
            // les quais situés : métro, RER, tram — les trois modes qui se
            // tracent. Le batobus n'a pas de ligne à allumer.
            indexStations.current = indexerStations(
              geo.features
                .filter((f) =>
                  f.properties.type === 'metro' ||
                  f.properties.type === 'rer' ||
                  f.properties.type === 'tram',
                )
                .map((f) => ({
                  nom: f.properties.nom,
                  p: f.geometry.coordinates as [number, number],
                })),
            )
            // l'audit des trous, UNE fois : transport.json s'arrête à la
            // petite couronne quand les branches de RER listent leurs quais
            // jusqu'à Dourdan. Ces stations-là sont hors carte, donc sans
            // pastille — c'est su, pas subi. Le métro doit rester près de zéro.
            chargerLignes()
              .then((table) => {
                const idx = indexStations.current
                if (!idx) return
                const trous = stationsIntrouvables(table, idx)
                if (!trous.length) return
                const perdues = trous.reduce((n, l) => n + l.perdues, 0)
                console.warn(
                  `[carte] arrêts sans coordonnée : ${perdues} sur ${trous.length} ligne(s) — ` +
                    trous
                      .slice(0, 5)
                      .map((l) => `${l.mode} ${l.ref} ${l.perdues}/${l.total}`)
                      .join(' · '),
                )
              })
              .catch(() => {})
            // priorité (RER majeur → batobus mineur) + seuil de zoom + code mode
            // 09/08 — le RER parlait dès z12,5 alors que les noms de spots se
            // taisent jusqu'à z13 : entre les deux, la carte ne disait QUE des
            // transports. Un repère ne peut pas prendre la parole avant ce
            // qu'il sert à repérer. On aligne le seuil sur celui des labels.
            const CONFIG: Record<string, { prio: number; zMin: number; code: string }> = {
              rer: { prio: 4, zMin: 13, code: 'RER' },
              metro: { prio: 3, zMin: 13, code: 'M' },
              tram: { prio: 2, zMin: 14, code: 'T' },
              batobus: { prio: 1, zMin: 14, code: 'BAT' },
            }
            const majEtiquettes = () => {
              if (!carte.current) return
              const z = carte.current.getZoom()
              // même raison qu'au-dessus : aucun transport avant z13, le zoom
              // où les lieux commencent à dire leur nom.
              if (z < 13) {
                for (const mk of etiquettesTransport.current) mk.remove()
                etiquettesTransport.current = []
                return
              }
              const b = carte.current.getBounds()
              const candidats: {
                nom: string; type: string; lng: number; lat: number; x: number; y: number
                prio: number; lignes?: string[]
              }[] = []
              for (const f of nommables) {
                const cfg = CONFIG[f.properties.type]
                if (!cfg || z < cfg.zMin) continue
                const [lng, lat] = f.geometry.coordinates
                if (lng < b.getWest() || lng > b.getEast()) continue
                if (lat < b.getSouth() || lat > b.getNorth()) continue
                const p = carte.current.project([lng, lat])
                candidats.push({
                  nom: f.properties.nom, type: f.properties.type,
                  lng, lat, x: p.x, y: p.y, prio: cfg.prio,
                  lignes: f.properties.lignes,
                })
              }
              const cx = (carte.current.getContainer().clientWidth || 0) / 2
              const cy = (carte.current.getContainer().clientHeight || 0) / 2
              candidats.sort((a, c) => {
                if (a.prio !== c.prio) return c.prio - a.prio
                const da = (a.x - cx) ** 2 + (a.y - cy) ** 2
                const dc = (c.x - cx) ** 2 + (c.y - cy) ** 2
                return da - dc
              })
              // 09/08 — l'autre moitié du même réglage : on passe de 24 à 14
              // étiquettes, et la grille se desserre (82 → 96 px). Les noms de
              // lieux montent à 14, les transports descendent à 14 : le
              // filigrane cesse d'être plus nombreux que le texte principal.
              const CAP = 14
              const MIN = 96
              const poses: { x: number; y: number }[] = []
              const retenus: typeof candidats = []
              for (const c of candidats) {
                if (retenus.length >= CAP) break
                let libre = true
                for (const p of poses) {
                  if (Math.abs(p.x - c.x) < MIN && Math.abs(p.y - c.y) < MIN) { libre = false; break }
                }
                if (libre) { poses.push({ x: c.x, y: c.y }); retenus.push(c) }
              }
              for (const mk of etiquettesTransport.current) mk.remove()
              etiquettesTransport.current = retenus.map((c) => {
                const el = document.createElement('div')
                el.className = 'repere-transport'
                el.dataset.mode = c.type
                // le mode en petit code texte (M / RER / T / BAT), puis le nom —
                // textContent sur des spans séparés : rien à échapper
                const code = document.createElement('span')
                code.className = 'repere-transport-mode'
                code.textContent = CONFIG[c.type].code
                const nom = document.createElement('span')
                nom.className = 'repere-transport-nom'
                nom.textContent = c.nom
                el.append(code, nom)
                // une station desservie est tapable : elle trace ses lignes.
                // Sans ligne connue (batobus, gares de grande couronne) on
                // laisse l'étiquette inerte plutôt que d'offrir un tap mort.
                if (c.lignes?.length) {
                  el.classList.add('repere-transport--tapable')
                  if (stationTracee.current === c.nom) el.classList.add('repere-transport--trace')
                  el.addEventListener('click', (ev) => {
                    ev.stopPropagation()
                    basculerLignes(c.nom, c.lignes)
                  })
                }
                return new maplibregl.Marker({ element: el, anchor: 'center' })
                  .setLngLat([c.lng, c.lat])
                  .addTo(carte.current!)
              })
            }
            majEtiquettesRef.current = majEtiquettes
            majEtiquettes()
            carte.current?.on('moveend', majEtiquettes)
            carte.current?.on('zoomend', majEtiquettes)
            // le zoom change ce que porte une bouche (numéro seul, puis le
            // nom au-delà de z17) : on les repose avec les étiquettes
            carte.current?.on('zoomend', () => poserBouchesRef.current(stationTracee.current))
          })
          .catch((err) => console.warn('[carte] transport.json:', err))
      }
      if (!m.getSource(SOURCE_POUSSIERE)) {
        m.addSource(SOURCE_POUSSIERE, { type: 'geojson', data: donneesPoussiere() })
        m.addLayer({
          id: LAYER_POUSSIERE,
          type: 'circle',
          source: SOURCE_POUSSIERE,
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 2, 14, 4],
            'circle-color': '#EFE9D8',
            'circle-opacity': 0.55,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#EFE9D8',
            'circle-stroke-opacity': 0.12,
          },
        })
      }
      poserRef.current()
    })
    // ── la poussière se touche comme un pin : tap (hitbox ~12 px) =
    // sélection · appui long = panneau de marque. Les pins DOM au-dessus
    // stoppent la propagation : ici on ne reçoit que la carte nue.
    carte.current.on('click', (e) => {
      const s = pressCarte.current
      if (s?.fired) {
        // le click résiduel d'un appui long déjà consommé : avalé
        pressCarte.current = null
        return
      }
      // taper à côté replie l'éventail déployé (§5.2)
      if (grappeOuverte.current !== null) {
        grappeOuverte.current = null
        majGrappesRef.current()
      }
      // ...et éteint la ligne de métro tracée : le tracé est un coup d'œil,
      // pas un mode dans lequel on reste
      effacerLignesRef.current()
      const id = lieuSousPoint(e.point)
      if (id) setActifRef.current(id)
    })
    const debutAppui = (p: { x: number; y: number }) => {
      finAppui()
      const id = lieuSousPoint(p)
      if (!id) return
      const suivi = { fired: false, timer: 0, x: p.x, y: p.y }
      suivi.timer = window.setTimeout(() => {
        suivi.fired = true
        ouvrirPanneauRef.current(id)
      }, APPUI_LONG_MS)
      pressCarte.current = suivi
    }
    const bougeAppui = (p: { x: number; y: number }) => {
      const s = pressCarte.current
      if (!s || s.fired) return
      if (Math.abs(p.x - s.x) > TREMBLE_PX || Math.abs(p.y - s.y) > TREMBLE_PX) {
        window.clearTimeout(s.timer)
        pressCarte.current = null
      }
    }
    const finAppui = () => {
      const s = pressCarte.current
      if (!s) return
      window.clearTimeout(s.timer)
      // appui long déjà tiré : on GARDE le drapeau — le click résiduel qui
      // suit (souris comme tap) sera avalé par le handler 'click' ci-dessus
      if (!s.fired) pressCarte.current = null
    }
    carte.current.on('mousedown', (e) => debutAppui(e.point))
    carte.current.on('touchstart', (e) => {
      if (e.points.length === 1) debutAppui(e.point)
      else finAppui() // pinch : pas un appui
    })
    carte.current.on('mousemove', (e) => bougeAppui(e.point))
    carte.current.on('touchmove', (e) => bougeAppui(e.point))
    carte.current.on('mouseup', finAppui)
    carte.current.on('touchend', finAppui)
    carte.current.on('touchcancel', finAppui)
    // la carte bouge : le panneau de marque (ancré au point écran) se ferme,
    // et l'éventail d'une grappe déployée se replie (c'est un geste, pas un mode)
    carte.current.on('movestart', () => {
      setPanneauMarque(null)
      if (grappeOuverte.current !== null) {
        grappeOuverte.current = null
        majGrappesRef.current()
      }
    })
    carte.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-left',
    )
    // mini (récap) : pas de contrôles, on laisse la carte respirer
    if (!mini) {
      // zoom +/− et boussole — en bas à droite, zone du pouce, au-dessus du +
      carte.current.addControl(
        new maplibregl.NavigationControl({ visualizePitch: true }),
        'bottom-right',
      )
      carte.current.addControl(
        new maplibregl.GeolocateControl({ trackUserLocation: true }),
        'bottom-right',
      )
      // l'échelle éphémère (Ersan, 08/08) : un repère de distance jamais posé
      // en permanence — visible UNIQUEMENT pendant le geste de zoom. Style
      // carnet surchargé plus bas (index.css .maplibregl-ctrl-scale), placée
      // discrètement en bas-gauche, au-dessus de l'attribution.
      carte.current.addControl(new maplibregl.ScaleControl({ maxWidth: 90, unit: 'metric' }), 'bottom-left')
      const elEchelle = cont.querySelector<HTMLElement>('.maplibregl-ctrl-scale')
      // apparaît sur zoomstart (instantané) ; s'efface en fondu ~1 s dès
      // zoomend — la durée du fondu vit dans le CSS (.maplibregl-ctrl-scale),
      // ici on ne fait que poser/retirer la classe au bon moment du geste.
      carte.current.on('zoomstart', () => elEchelle?.classList.add('s-visible'))
      carte.current.on('zoomend', () => elEchelle?.classList.remove('s-visible'))
    }
    // ── les MONUMENTS-REPÈRES : le croquis s'oriente comme un vrai carnet ──
    // des silhouettes à l'encre graphite, discrètes, jamais tapables — elles
    // situent (la tour, la butte, l'étoile) sans jamais concurrencer les spots.
    // TEST (08/08) : les vignettes carnet des planches GPT remplacent le
    // trait monoline quand elles existent — Ersan juge sur pièce.
    // le nom vit dans le CARTOUCHE de la planche (étiquette parchemin au
    // texte rouge) : séparé quand on l'a découpé, sinon déjà incorporé à la
    // vignette — dans les deux cas, plus de doublon Caveat.
    const htmlVignette = (img: string, etq: string | undefined, petite: boolean) =>
      `<img class="monument-vignette${petite ? ' petite' : ''}" src="${img}" alt="" loading="lazy">` +
      (etq ? `<img class="monument-etq" src="${etq}" alt="" loading="lazy">` : '')
    // toutes les vignettes, monuments et points de rdv confondus : c'est sur
    // elles que joue le relais de zoom (voir relaisVignettes plus bas)
    const vignettes: HTMLElement[] = []
    for (const mo of MONUMENTS) {
      const el = document.createElement('div')
      el.className = 'monument-repere'
      el.innerHTML = mo.img
        ? htmlVignette(mo.img, mo.etq, false)
        : `${mo.trait}<span class="monument-nom">${mo.nom}</span>`
      // son nom sert de clé pour retrouver sa hauteur réelle (HAUTEUR_M)
      el.dataset.mo = mo.nom
      if (mo.img) vignettes.push(el)
      new maplibregl.Marker({ element: el }).setLngLat([mo.lng, mo.lat]).addTo(carte.current)
    }
    // …et les points de rendez-vous qui ont leur vignette (République, la
    // colonne de Juillet, le pont Alexandre III…) : posés plus petits, et
    // seulement à partir de z12.5 — douze images de plus à z11, la ville
    // disparaîtrait sous les stickers.
    const vignettesRdv: maplibregl.Marker[] = []
    for (const r of REPERES) {
      if (!r.img) continue
      const el = document.createElement('div')
      el.className = 'monument-repere repere-vignette'
      el.innerHTML = htmlVignette(r.img, r.etq, true)
      vignettes.push(el)
      vignettesRdv.push(
        new maplibregl.Marker({ element: el }).setLngLat([r.lng, r.lat]).addTo(carte.current),
      )
    }
    // ── LE RELAIS (08/08) : les vignettes se passent la main aux épingles ──
    // De loin, la vignette EST le repère : c'est elle qui dit « voilà la
    // butte, voilà l'étoile ». En approchant, on ne cherche plus la ville,
    // on cherche un spot — la vignette doit alors se faire timbre et rendre
    // la voix aux épingles. Trois paliers plutôt qu'un fondu continu : le
    // zoom se lit par crans, et la transition CSS fait le glissé.
    const relaisVignettes = () => {
      const z = carte.current?.getZoom() ?? 0
      // ── 09/08 · LES MONUMENTS À L'ÉCHELLE RÉELLE DE LA CARTE ──
      // Un monument n'est pas un sticker : c'est un objet qui a une taille
      // en MÈTRES. On la convertit en pixels au zoom courant, et tout le
      // reste en découle sans aucun palier réglé à la main : la tour
      // (330 m) se voit de loin, l'Arc (50 m) n'apparaît qu'en approchant.
      // C'EST ÇA, le réalisme — pas une courbe inventée.
      //
      // mètres par pixel = 156543,034 × cos(latitude) / 2^zoom
      const mpp = (156543.03392 * Math.cos((48.8566 * Math.PI) / 180)) / Math.pow(2, z)
      for (const el of vignettes) {
        const vrai = (HAUTEUR_M[el.dataset.mo ?? ''] ?? 60) / mpp
        // sous ~9 px un dessin ne dit plus rien : on l'efface au lieu de
        // le laisser saloper la carte. Au-dessus, on borne pour qu'un
        // monument ne mange jamais tout l'écran.
        el.style.setProperty('--vign-h', `${Math.min(340, Math.max(9, vrai)).toFixed(1)}px`)
        el.classList.toggle('vg-trop-petit', vrai < 9)
      }
      // les vignettes de rdv se voilent en dessous de z12.5 — douze images de
      // plus à z11 et la ville disparaîtrait sous les stickers
      for (const mk of vignettesRdv) mk.getElement().classList.toggle('cachee', z < 12.5)
      for (const el of vignettes) {
        // z ≤ 13 pleines · 13→15 en retrait · z ≥ 15 timbres
        el.classList.toggle('vg-retrait', z > 13 && z < 15)
        el.classList.toggle('vg-timbre', z >= 15)
      }
    }
    relaisVignettes()
    // 'zoom' (et pas seulement 'zoomend') : la taille doit suivre le geste,
    // sinon le monument saute d'un coup quand on lâche.
    carte.current.on('zoom', relaisVignettes)
    carte.current.on('zoomend', relaisVignettes)

    // "moi" par défaut : Place Vendôme (point de repère + futur calcul de distance)
    const elMoi = document.createElement('div')
    elMoi.className = 'pin-moi'
    elMoi.title = t('moi')
    let posMoi = moi()
    const mkMoi = new maplibregl.Marker({ element: elMoi }).setLngLat(posMoi).addTo(carte.current)
    // la géoloc répond souvent APRÈS le mount : un petit suivi compare la
    // position mémorisée et déplace "moi" quand elle change (fini le marker
    // planté à Vendôme alors que l'utilisateur est ailleurs).
    const suiviMoi = window.setInterval(() => {
      const p = moi()
      if (p[0] !== posMoi[0] || p[1] !== posMoi[1]) {
        posMoi = p
        mkMoi.setLngLat(p)
      }
    }, 5000)

    // ── le cap : une flèche d'orientation sur "moi", pilotée par la boussole ──
    // (mobile · iOS demande l'autorisation au 1er tap · cachée tant qu'aucun cap)
    const cap = document.createElement('div')
    cap.className = 'pin-moi-cap'
    elMoi.appendChild(cap)
    const onOrient = (e: DeviceOrientationEvent) => {
      const ev = e as DeviceOrientationEvent & { webkitCompassHeading?: number }
      let heading: number | null = null
      if (typeof ev.webkitCompassHeading === 'number') heading = ev.webkitCompassHeading
      else if (ev.absolute && typeof ev.alpha === 'number') heading = 360 - ev.alpha
      if (heading == null || Number.isNaN(heading)) return
      cap.style.transform = `translate(-50%, -50%) rotate(${heading}deg)`
      cap.style.opacity = '1'
    }
    const ecouterBoussole = () => {
      window.addEventListener('deviceorientationabsolute', onOrient as EventListener, true)
      window.addEventListener('deviceorientation', onOrient, true)
    }
    const DOE = window.DeviceOrientationEvent as
      | (typeof window.DeviceOrientationEvent & { requestPermission?: () => Promise<string> })
      | undefined
    // iOS : listener « once » — gardé en ref pour le retirer au cleanup s'il n'a pas tiré
    let onceEnAttente: (() => void) | null = null
    if (DOE && typeof DOE.requestPermission === 'function') {
      const once = () => {
        DOE.requestPermission!()
          .then((s) => {
            if (s === 'granted') ecouterBoussole()
          })
          .catch(() => {})
        cont.removeEventListener('click', once)
        onceEnAttente = null
      }
      onceEnAttente = once
      cont.addEventListener('click', once)
    } else {
      ecouterBoussole()
    }

    // re-pose (clustering + diffing + labels) en FIN de geste seulement —
    // pendant le pan/zoom, maplibre déplace lui-même les markers déjà posés.
    const rafraichir = () => poserRef.current()
    carte.current.on('moveend', rafraichir)
    carte.current.on('zoomend', rafraichir)

    const posesCourantes = poses.current
    const pins = pinEls.current
    return () => {
      window.removeEventListener('deviceorientationabsolute', onOrient as EventListener, true)
      window.removeEventListener('deviceorientation', onOrient, true)
      if (onceEnAttente) cont.removeEventListener('click', onceEnAttente)
      if (pressCarte.current) window.clearTimeout(pressCarte.current.timer)
      window.clearInterval(suiviMoi)
      posesCourantes.forEach((mk) => mk.remove())
      posesCourantes.clear()
      etiquettesTransport.current.forEach((mk) => mk.remove())
      etiquettesTransport.current = []
      marqueursBouches.current.forEach((mk) => mk.remove())
      marqueursBouches.current = []
      for (const id of Object.keys(pins)) delete pins[id]
      dejaCadre.current = false
      carte.current?.remove()
      carte.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── quand les lieux changent : la poussière suit (setData) et les pins
  // repartent de zéro. `vus` n'est PLUS une dépendance : consulter une fiche
  // ne reconstruit rien (voir l'effet léger plus bas).
  useEffect(() => {
    const validesL = lieux.filter((l) => l.lat !== 0 || l.lng !== 0)
    lieuxParId.current = new Map(validesL.map((l) => [l.id, l]))
    // les lieux ont pu changer d'identité (filtres, sync) : table rase des pins
    poses.current.forEach((mk) => mk.remove())
    poses.current.clear()
    pinEls.current = {}
    const m = carte.current
    if (!m) return
    // la source existe dès le 'load' (qui la crée avec les données du moment)
    const src = m.getSource(SOURCE_POUSSIERE) as maplibregl.GeoJSONSource | undefined
    src?.setData(donneesPoussiere())
    m.resize()
    poserRef.current()
    // cadrage : UNE seule fois en plein écran (retour de fiche = la vue ne
    // bouge pas). En mini (récap figé, pas de navigation à préserver), on
    // recadre à chaque nouveau deck.
    if ((!dejaCadre.current || mini) && validesL.length > 0) {
      dejaCadre.current = true
      if (mini) {
        // récap du deck : peu de spots, on cadre sur eux
        if (validesL.length === 1) {
          m.flyTo({ center: [validesL[0].lng, validesL[0].lat], zoom: 14 })
        } else {
          const bounds = new maplibregl.LngLatBounds()
          validesL.forEach((l) => bounds.extend([l.lng, l.lat]))
          m.fitBounds(bounds, { padding: 60, maxZoom: 15 })
        }
      } else {
        // plein écran : on démarre CHEZ TOI, pas sur l'enveloppe des 750 spots
        // (un seul spot à 30 km dézoomait toute la ville). Le quartier d'abord :
        // les spots à moins de ~2,5 km cadrent la vue, sinon zoom de quartier.
        const pres = validesL.filter((l) => distanceM(l) < 2500)
        if (pres.length >= 3) {
          const bounds = new maplibregl.LngLatBounds()
          bounds.extend(moi())
          pres.forEach((l) => bounds.extend([l.lng, l.lat]))
          m.fitBounds(bounds, { padding: 70, maxZoom: 15 })
        } else {
          m.flyTo({ center: moi(), zoom: 13.2 })
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lieux])

  // ── `vus` / `comparer` / `allumes` : un simple toggle de classes sur les
  // pins existants — AUCUN marker recréé, la vue ne bouge pas.
  useEffect(() => {
    appliquerEtatsRef.current()
  }, [vus, comparer, allumes])

  // ── marques : on écoute marques.ts (pose/retrait depuis le panneau, ou
  // « effacer mes données » ailleurs) → l'état local suit.
  useEffect(() => sAbonnerMarques(() => setMarques(lireMarques())), [])
  // quand une marque change, SEULS les pins concernés sont refaits (l'émoji
  // remplace le pin standard, ou l'inverse) — puis la pose re-diffe : un lieu
  // fraîchement marqué devient prioritaire et gagne son pin s'il ne l'avait pas.
  useEffect(() => {
    for (const [id, mk] of [...poses.current]) {
      const el = pinEls.current[id]
      if ((el?.dataset.marque ?? '') !== (marques[id] ?? '')) {
        poses.current.delete(id)
        delete pinEls.current[id]
        mk.remove()
      }
    }
    poserRef.current()
  }, [marques])

  // #11 : la sélection — pin actif en couleur, le reste grisé · recadre la carte ·
  // fait défiler le carrousel vers la carte du lieu choisi.
  useEffect(() => {
    // poserVisibles garantit que le pin sélectionné existe (même sous une
    // grappe) puis réapplique états + labels ; à la désélection, il balaie
    // le pin forcé devenu inutile.
    poserRef.current()
    if (!actif) return // désélection : ni recadrage, ni reset inutile du sheet
    // reset volontaire du sheet quand `actif` change (pas de refactor : le
    // comportement « nouveau lieu → photo 0, page 1 » est voulu tel quel)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSheetPhoto(0) // nouveau lieu → on repart de la 1re photo
    setSheetPage(1) // on ouvre sur « le mot » ; la photo claire est à gauche (page 0)
    const m = carte.current
    const l = valides.find((x) => x.id === actif)
    if (m && l) {
      m.flyTo({
        center: [l.lng, l.lat],
        zoom: Math.max(m.getZoom(), 14),
        // on laisse la place au bottom-sheet + carrousel en bas
        padding: { top: 0, left: 0, right: 0, bottom: 240 },
      })
    }
    // recentre la fenêtre du carrousel sur le lieu choisi AVANT le scroll
    const idx = valides.findIndex((x) => x.id === actif)
    if (idx >= 0) setCentreCarrousel(idx)
    const carteCard = carrousel.current?.querySelector(`[data-id="${actif}"]`)
    carteCard?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actif])

  // fenêtrage du carrousel : au scroll, recale le centre sur la carte la plus
  // proche du milieu (throttlé rAF + hystérésis pour éviter les re-rendus en rafale)
  const surScrollCarrousel = () => {
    if (scrollPrevu.current) return
    scrollPrevu.current = true
    requestAnimationFrame(() => {
      scrollPrevu.current = false
      const c = carrousel.current
      if (!c) return
      const centreX = c.scrollLeft + c.clientWidth / 2
      let meilleur = 0
      let dMin = Infinity
      for (let i = 0; i < c.children.length; i++) {
        const h = c.children[i] as HTMLElement
        const d = Math.abs(h.offsetLeft + h.offsetWidth / 2 - centreX)
        if (d < dMin) {
          dMin = d
          meilleur = i
        }
      }
      setCentreCarrousel((prev) => (Math.abs(prev - meilleur) >= 3 ? meilleur : prev))
    })
  }

  // saisie sans émoji : micro-shake du champ (la marque ne se pose pas)
  const secouerInput = () => {
    const el = marqueInput.current
    if (!el) return
    el.classList.remove('marque-shake')
    void el.offsetWidth // relance l'animation si re-secousse rapide
    el.classList.add('marque-shake')
  }

  if (mini) {
    return <div ref={conteneur} className="carte carte-mini" />
  }

  // le lieu du panneau de marque (l'appui long a pu viser un lieu filtré depuis)
  // — dérivé de `valides` (props), jamais d'une ref pendant le rendu
  const lieuPanneau = panneauMarque
    ? (valides.find((l) => l.id === panneauMarque.id) ?? null)
    : null

  return (
    <>
      <div ref={conteneur} className={`carte${lieuActif ? ' carte-sel' : ''}`} />

      {/* ── §1.9 LA LIGNE-BOUSSOLE : elle ne dit QUE ce que la carte ne
          montre pas (le hors-champ, le pas-encore-lu), elle nomme une chose
          et ne compte jamais des gens. Taper y emmène la carte.
          Elle s'efface dès qu'un lieu est sélectionné : le bottom-sheet a
          la parole, et deux voix en bas d'écran n'en font aucune. */}
      {boussole && !lieuActif && (
        <button
          className={`boussole hand${boussole.genre === 'tout-lu' ? ' boussole-fin' : ''}`}
          onClick={() => {
            if (boussole.genre === 'tout-lu') return
            const m = carte.current
            if (!m) return
            m.easeTo({
              center: [boussole.cible.lng, boussole.cible.lat],
              zoom: Math.max(m.getZoom(), 14),
              duration: animees ? 900 : 0,
            })
          }}
          disabled={boussole.genre === 'tout-lu'}
        >
          {texteBoussole(boussole, t)}
        </button>
      )}

      {/* la barre « à comparer » + la table vivent maintenant dans App (source
          unique), rendues sous les filtres → plus de superposition en vue carte. */}

      {/* ── le panneau de marque (appui long sur un pin OU un point de
          poussière) : suggestions d'émojis, « ton émoji » au clavier natif,
          retirer, et la bascule « à comparer » en dernière ligne (icône SVG,
          pas d'émoji : ça, c'est du chrome). Fermé au tap ailleurs (voile). */}
      {panneauMarque && lieuPanneau && (
        <>
          <div className="marque-voile" onPointerDown={() => setPanneauMarque(null)} />
          <div
            className={`marque-panneau${panneauMarque.y < 230 ? ' dessous' : ''}`}
            role="dialog"
            aria-label={`${t('marquer')} ${lieuPanneau.nom}`}
            style={{
              left: Math.min(Math.max(panneauMarque.x, 132), window.innerWidth - 132),
              top: panneauMarque.y,
            }}
          >
            <div className="marque-suggestions">
              {/* des CANDIDATS de marque : du contenu utilisateur, pas du chrome */}
              {SUGGESTIONS_MARQUES.map((e) => (
                <button
                  key={e}
                  className="marque-sugg"
                  onClick={() => {
                    poserMarque(panneauMarque.id, e)
                    setPanneauMarque(null)
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
            {/* « ton émoji » : clavier natif — l'utilisateur bascule sur SON
                clavier émoji ; on retient le PREMIER émoji saisi (graphèmes
                composés compris) ; du texte sans émoji = ignoré, micro-shake */}
            <input
              ref={marqueInput}
              className="marque-input mono"
              type="text"
              placeholder={t('ton émoji')}
              autoComplete="off"
              enterKeyHint="done"
              onChange={(ev) => {
                if (poserMarque(panneauMarque.id, ev.target.value)) setPanneauMarque(null)
              }}
              onKeyDown={(ev) => {
                if (ev.key !== 'Enter') return
                if (poserMarque(panneauMarque.id, (ev.target as HTMLInputElement).value)) {
                  setPanneauMarque(null)
                } else {
                  secouerInput()
                }
              }}
            />
            {marques[panneauMarque.id] && (
              <button
                className="marque-retirer mono"
                onClick={() => {
                  retirerMarque(panneauMarque.id)
                  setPanneauMarque(null)
                }}
              >
                {t('retirer la marque')}
              </button>
            )}
            {/* l'ex-appui long « à comparer » vit ICI désormais (arbitrage :
                un seul geste, tout au même endroit) */}
            {onComparer && (
              <button
                className="marque-comparer mono"
                onClick={() => {
                  onComparer(panneauMarque.id)
                  setPanneauMarque(null)
                }}
              >
                <IAnneau taille={13} />
                {comparer.includes(panneauMarque.id) ? t('ne plus comparer') : t('à comparer')}
              </button>
            )}
          </div>
        </>
      )}

      {/* #11 : le nom + la description du lieu choisi, en bas de l'écran */}
      {lieuActif && (
        <div
          className="carte-sheet"
          onPointerDown={(e) => {
            sheetDepart.current = { x: e.clientX, y: e.clientY }
          }}
          onPointerUp={(e) => {
            // les boutons gardent leur action (fiche, ✕)
            if ((e.target as HTMLElement).closest('button')) return
            const n = lieuActif.photos.length
            const dx = e.clientX - sheetDepart.current.x
            const dy = e.clientY - sheetDepart.current.y
            const ax = Math.abs(dx)
            const ay = Math.abs(dy)
            // swipe gauche/droite = page d'infos · haut/bas = photo · tap = photo suivante
            if (ax > ay && ax > 40) {
              setSheetPage((p) => Math.min(NB_PAGES_SHEET - 1, Math.max(0, p + (dx < 0 ? 1 : -1))))
            } else if (ay > ax && ay > 24 && n > 1) {
              setSheetPhoto((i) => (dy < 0 ? (i + 1) % n : (i - 1 + n) % n))
            } else if (ax < 6 && ay < 6 && n > 1) {
              setSheetPhoto((i) => (i + 1) % n)
            }
          }}
        >
          {/* la photo occupe tout le cadre ; voile dégradé pour garder le texte lisible */}
          {lieuActif.photos.length > 0 && (
            <img
              className="carte-sheet-bg"
              src={srcPhoto(lieuActif.photos[sheetPhoto % lieuActif.photos.length])}
              alt=""
              onError={photoIndisponible}
            />
          )}
          {/* page 0 = photo claire : pas de voile, pas de texte */}
          {sheetPage !== 0 && <div className="carte-sheet-voile" />}

          <button
            className="carte-sheet-x mono"
            aria-label={t('fermer')}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => {
              e.stopPropagation()
              setActif(null)
            }}
            onClick={(e) => {
              e.stopPropagation()
              setActif(null)
            }}
          >
            ✕
          </button>
          {lieuActif.photos.length > 1 && (
            <div className="photo-tirets carte-sheet-tirets">
              {lieuActif.photos.map((_, i) => (
                <span key={i} className={i === sheetPhoto % lieuActif.photos.length ? 'on' : ''} />
              ))}
            </div>
          )}

          <div className="carte-sheet-txt">
            {sheetPage !== 0 && (
              <div className="carte-sheet-nom">
                {lieuActif.nom}
                {/* la marque du lieu, en petit à côté du nom — CONTENU
                    utilisateur (son émoji), jamais dans le label du pin */}
                {marques[lieuActif.id] && (
                  <span className="carte-sheet-marque">{marques[lieuActif.id]}</span>
                )}
              </div>
            )}

            {/* PAGE 1 — le mot */}
            {sheetPage === 1 && (
              <p className="hand carte-sheet-desc">
                {lieuActif.note ||
                  lieuActif.tipsCercle?.[0]?.note ||
                  t('pas encore de mot sur ce lieu.')}
              </p>
            )}

            {/* PAGE 2 — recommandé par */}
            {sheetPage === 2 && (
              <div className="carte-sheet-recos mono">
                <span className="carte-sheet-lbl">{t('recommandé par')}</span>
                <span className="carte-sheet-reco-liste">
                  {[
                    ...(lieuActif.note
                      ? [
                          !estAMoi(lieuActif) && lieuActif.proprietaire === CURATEUR_JEUDI
                            ? NOM_JEUDI
                            : t('toi'),
                        ]
                      : []),
                    ...(lieuActif.tipsCercle ?? []).map(
                      (tip) => `@${tip.auteur.toLowerCase()}`,
                    ),
                  ].join('  ·  ') || t('personne encore — à toi de jouer.')}
                </span>
              </div>
            )}

            {/* PAGE 3 — pratique */}
            {sheetPage === 3 && (
              <div className="carte-sheet-pratique mono">
                {(() => {
                  const h = etatHoraire(lieuActif.horaires)
                  return h ? (
                    <span className={h.ouvert ? 'ouvert' : 'ferme'}>{h.texte}</span>
                  ) : (
                    <span>{t('horaires inconnus')}</span>
                  )
                })()}
                {(() => {
                  const w = propreteWcLabel(lieuActif.propreteWc)
                  return w ? (
                    <span className="carte-sheet-wc">wc {w.points} {t(w.mot)}</span>
                  ) : null
                })()}
                {lieuActif.match === 'diffuse' && (
                  <span className="carte-sheet-wc">
                    <IBallon taille={12} /> {t('on y voit les matchs')}
                  </span>
                )}
                {lieuActif.match === 'refuge' && <span>{t('refuge anti-foot')}</span>}
                {lieuActif.envies.length > 0 && <span>{lieuActif.envies.join(' · ')}</span>}
              </div>
            )}

            <div className={`carte-sheet-pied mono ${sheetPage === 0 ? 'nu' : ''}`}>
              {sheetPage !== 0 && (
                <span className="carte-sheet-dist">{formatDistance(distanceM(lieuActif))}</span>
              )}
              <span className="carte-sheet-pagedots">
                {Array.from({ length: NB_PAGES_SHEET }).map((_, i) => (
                  <span key={i} className={i === sheetPage ? 'on' : ''} />
                ))}
              </span>
              {sheetPage !== 0 && (
                <button
                  className={`carte-sheet-fiche ${enCompaCarte ? 'comparer' : ''}`}
                  onClick={() => onVoir?.(lieuActif)}
                >
                  {enCompaCarte ? `${t('comparer')} →` : `${t('la fiche')} →`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* #11 : le carrousel des lieux — la carte active est en couleur, le reste
          grisé. Fenêtré : seules ~15 cartes autour du centre sont réelles, les
          autres sont des coquilles de même largeur (le nom invisible donne la
          largeur) pour garder le scroll-snap et la barre de défilement justes. */}
      {valides.length > 0 && (
        <div className="carte-carrousel" ref={carrousel} onScroll={surScrollCarrousel}>
          {valides.map((l, i) =>
            Math.abs(i - centreCarrousel) > FENETRE_CARROUSEL ? (
              <div key={l.id} data-id={l.id} className="carte-card" aria-hidden="true">
                <span className="carte-card-nom" style={{ visibility: 'hidden' }}>
                  {l.nom}
                </span>
              </div>
            ) : (
              <button
                key={l.id}
                data-id={l.id}
                className={`carte-card ${l.id === actif ? 'on' : ''} ${
                  comparer.includes(l.id) ? 'a-comparer' : ''
                }`}
                onPointerDown={() => {
                  press.current = { fired: false, timer: 0 }
                  press.current.timer = window.setTimeout(() => {
                    if (press.current) press.current.fired = true
                    onComparer?.(l.id) // clic long = à comparer (état dans App)
                    navigator.vibrate?.(30)
                  }, APPUI_LONG_MS)
                }}
                onPointerUp={() => {
                  const p = press.current
                  press.current = null
                  if (!p) return
                  clearTimeout(p.timer)
                  if (p.fired) return // c'était un clic long → déjà traité
                  // tap = sélection / fiche
                  if (l.id === actif) onVoir?.(l)
                  else setActif(l.id)
                }}
                onPointerLeave={() => {
                  if (press.current) {
                    clearTimeout(press.current.timer)
                    press.current = null
                  }
                }}
              >
                {l.photos.length > 0 && (
                  <img className="carte-card-bg" src={srcPhoto(l.photos[0])} alt="" loading="lazy" onError={photoIndisponible} />
                )}
                {comparer.includes(l.id) && <span className="carte-card-vs mono">{t('à comparer')}</span>}
                <span className="carte-card-nom">{l.nom}</span>
                <span className="mono carte-card-dist">
                  <span className="carte-card-km">{formatDistance(distanceM(l))}</span>
                  <span className="carte-card-min">{trajetMin(distanceM(l)).mode === 'pied' ? `${trajetMin(distanceM(l)).min} min` : `~${trajetMin(distanceM(l)).min} min`}</span>
                </span>
              </button>
            ),
          )}
        </div>
      )}
    </>
  )
}

// ── chantier 1 : la table de comparaison côte-à-côte ───────────
// 1 colonne par lieu (2-3), 1 ligne par critère, la meilleure valeur
// de chaque ligne surlignée. Pas d'étoiles : on compare des faits.
function nbVoix(l: Lieu): number {
  return (l.note ? 1 : 0) + (l.tipsCercle?.length ?? 0)
}

export function TableComparaison({
  lieux,
  onFermer,
  onVoir,
  onRetirer,
}: {
  lieux: Lieu[]
  onFermer: () => void
  onVoir: (l: Lieu) => void
  onRetirer: (id: string) => void
}) {
  // départ du geste de swipe (pour retirer une colonne d'un coup vers le haut)
  const colDepart = useRef({ x: 0, y: 0 })
  // pour chaque ligne « gagnante », l'index (ou les index) du/des meilleur(s).
  // les lieux sans coordonnées (0,0) sortent du calcul de distance : leur
  // distance « depuis Vendôme jusqu'au golfe de Guinée » faussait le gagnant.
  const dists = lieux.map((l) => (l.lat !== 0 || l.lng !== 0 ? distanceM(l) : null))
  const distsConnues = dists.filter((d): d is number => d !== null)
  const distMin = distsConnues.length > 0 ? Math.min(...distsConnues) : Infinity
  const wcMax = Math.max(...lieux.map((l) => l.propreteWc ?? 0))
  const voixMax = Math.max(...lieux.map((l) => nbVoix(l)))

  const best = (cond: boolean) => (cond ? ' tc-best' : '')

  return (
    <div className="tc-overlay">
      {/* ✕ de fermeture flottant (plus de ligne titre dédiée → on gagne une ligne) */}
      <button className="tc-fermer mono" onClick={onFermer} aria-label="fermer">
        ✕
      </button>

      {/* incitation paysage : visible UNIQUEMENT en portrait à 3 lieux (CSS) */}
      {lieux.length >= 3 && (
        <div className="tc-paysage mono">tourne ton téléphone pour mieux comparer ↻</div>
      )}

      <div className="tc-grille" style={{ gridTemplateColumns: `auto repeat(${lieux.length}, 1fr)` }}>
        {/* coin haut-gauche : le titre « comparer » récupère la case vide */}
        <div className="tc-lbl tc-coin">comparer</div>
        {lieux.map((l) => (
          <div
            key={l.id}
            className="tc-col-tete"
            onPointerDown={(e) => {
              colDepart.current = { x: e.clientX, y: e.clientY }
            }}
            onPointerUp={(e) => {
              if ((e.target as HTMLElement).closest('button')) return // le ✕ garde son action
              const dx = e.clientX - colDepart.current.x
              const dy = e.clientY - colDepart.current.y
              // swipe vers le haut = retirer ce lieu (direct, réversible)
              if (dy < -40 && Math.abs(dy) > Math.abs(dx)) onRetirer(l.id)
            }}
          >
            <span className="tc-nom">{l.nom}</span>
            <button className="tc-retirer mono" onClick={() => onRetirer(l.id)} aria-label="retirer">
              ✕
            </button>
          </div>
        ))}

        {/* photo */}
        <div className="tc-lbl mono">photo</div>
        {lieux.map((l) => (
          <div key={l.id} className="tc-cell tc-cell-photo">
            {l.photos.length > 0 ? (
              <img src={srcPhoto(l.photos[0])} alt="" loading="lazy" onError={photoIndisponible} />
            ) : (
              <span className="tc-vide mono">—</span>
            )}
          </div>
        ))}

        {/* distance / temps à pied */}
        <div className="tc-lbl mono">distance</div>
        {lieux.map((l, i) => {
          const d = dists[i]
          return (
            <div key={l.id} className={`tc-cell mono${best(d !== null && d === distMin)}`}>
              {d !== null ? (
                <>
                  {formatDistance(d)}
                  <span className="tc-sous">{libelleTrajet(d)}</span>
                </>
              ) : (
                <span className="tc-vide">—</span>
              )}
            </div>
          )
        })}

        {/* ouvert / fermé */}
        <div className="tc-lbl mono">maintenant</div>
        {lieux.map((l) => {
          const h = etatHoraire(l.horaires)
          const ouvert = h?.ouvert === true
          return (
            <div key={l.id} className={`tc-cell mono${best(ouvert)}`}>
              {h ? (
                <span className={h.ouvert ? 'ouvert' : h.ouvert === false ? 'ferme' : ''}>
                  {h.texte}
                </span>
              ) : (
                <span className="tc-vide">horaires inconnus</span>
              )}
            </div>
          )
        })}

        {/* propreté WC */}
        <div className="tc-lbl mono">propreté wc</div>
        {lieux.map((l) => {
          const w = propreteWcLabel(l.propreteWc)
          return (
            <div key={l.id} className={`tc-cell mono${best(!!l.propreteWc && l.propreteWc === wcMax && wcMax > 0)}`}>
              {w ? (
                <>
                  <span className="tc-wc-pts">{w.points}</span> {t(w.mot)}
                </>
              ) : (
                <span className="tc-vide">—</span>
              )}
            </div>
          )
        })}

        {/* envies */}
        <div className="tc-lbl mono">envies</div>
        {lieux.map((l) => (
          <div key={l.id} className="tc-cell mono tc-envies">
            {l.envies.length > 0 ? (
              l.envies.map((e) => (
                <span key={e} className="tc-chip">
                  {e}
                </span>
              ))
            ) : (
              <span className="tc-vide">—</span>
            )}
          </div>
        ))}

        {/* nb de voix (référence) */}
        <div className="tc-lbl mono">voix</div>
        {lieux.map((l) => {
          const n = nbVoix(l)
          return (
            <div key={l.id} className={`tc-cell mono${best(n > 0 && n === voixMax)}`}>
              {n > 0 ? `${n} voix${n >= 2 ? ' · référence' : ''}` : <span className="tc-vide">—</span>}
            </div>
          )
        })}

        {/* tip */}
        <div className="tc-lbl mono">le tip</div>
        {lieux.map((l) => {
          const tip = l.note || l.tipsCercle?.[0]?.note
          return (
            <div key={l.id} className="tc-cell tc-cell-tip">
              {tip ? <span className="hand">{tip}</span> : <span className="tc-vide mono">—</span>}
            </div>
          )
        })}

        {/* validé */}
        <div className="tc-lbl mono">validé</div>
        {lieux.map((l) => {
          const ok = l.tampon?.v === 'valide'
          return (
            <div key={l.id} className={`tc-cell mono${best(ok)}`}>
              {ok ? 'validé' : <span className="tc-vide">pas encore</span>}
            </div>
          )
        })}

        {/* aller voir la fiche */}
        <div className="tc-lbl" />
        {lieux.map((l) => (
          <div key={l.id} className="tc-cell tc-cell-go">
            <button className="tc-fiche mono" onClick={() => onVoir(l)}>
              la fiche →
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
