import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import type { FeatureCollection, Point } from 'geojson'
import {
  maPosition,
  etatHoraire,
  teinteCurateur,
  distanceM,
  formatDistance,
  tempsMarche,
  propreteWcLabel,
  estAMoi,
  lireFavoris,
  CURATEUR_JEUDI,
  NOM_JEUDI,
  type Lieu,
} from './db'
import { lireMarques, poserMarque, retirerMarque, sAbonnerMarques } from './marques'
import { typeDeLieu, svgTypeLieu } from './typesLieu'

// les monuments du croquis : silhouettes monoline (viewBox 24, trait graphite)
const traitMonument = (d: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
const MONUMENTS: { nom: string; lat: number; lng: number; trait: string }[] = [
  // la tour : deux jambes qui se croisent, l'arche
  { nom: 'tour eiffel', lat: 48.8584, lng: 2.2945, trait: traitMonument('<path d="M9 21c2-7 2-12 3-17 1 5 1 10 3 17"/><path d="M7 21h4a3 3 0 0 1 2 0h4"/><path d="M9.5 13h5"/>') },
  // l'étoile : l'arche pleine
  { nom: 'arc de triomphe', lat: 48.8738, lng: 2.295, trait: traitMonument('<path d="M5 20V7a7 7 0 0 1 14 0v13"/><path d="M9 20v-6a3 3 0 0 1 6 0v6"/>') },
  // la butte : le dôme et ses deux petits
  { nom: 'sacré-cœur', lat: 48.8867, lng: 2.3431, trait: traitMonument('<path d="M8 20v-6a4 4 0 0 1 8 0v6"/><path d="M12 10V7"/><path d="M4 20v-3a2 2 0 0 1 4 0"/><path d="M16 17a2 2 0 0 1 4 0v3"/><path d="M3 20h18"/>') },
  // l'île : les deux tours carrées
  { nom: 'notre-dame', lat: 48.853, lng: 2.3499, trait: traitMonument('<path d="M6 20V8h4v12"/><path d="M14 20V8h4v12"/><path d="M10 12h4"/><path d="M4 20h16"/>') },
  // la montagne : le dôme sur colonnes
  { nom: 'panthéon', lat: 48.8462, lng: 2.3464, trait: traitMonument('<path d="M7 20v-7M12 20v-7M17 20v-7"/><path d="M5 13a7 5 0 0 1 14 0"/><path d="M4 20h16"/>') },
  // l'opéra : le fronton
  { nom: 'opéra', lat: 48.872, lng: 2.3316, trait: traitMonument('<path d="M4 20l8-12 8 12z"/><path d="M8 20v-4M12 20v-6M16 20v-4"/>') },
  // le dôme doré
  { nom: 'invalides', lat: 48.856, lng: 2.3126, trait: traitMonument('<path d="M9 20v-5a3 5 0 0 1 6 0v5"/><path d="M12 9V5l2 1"/><path d="M5 20h14"/>') },
  // la tour noire (le repère du sud)
  { nom: 'montparnasse', lat: 48.8421, lng: 2.3219, trait: traitMonument('<path d="M9 21V5a6 8 0 0 1 6 0v16"/><path d="M9 9h6M9 14h6"/>') },
]
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
      attribution: '© OpenStreetMap, © CARTO',
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
const PLAFOND_LABELS = 8
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
}) {
  const conteneur = useRef<HTMLDivElement>(null)
  const carte = useRef<maplibregl.Map | null>(null)
  // les lieux valides par id, et les markers actuellement posés (diffing,
  // clé = id de lieu — plus de préfixes l:/c: depuis la mort des grappes)
  const lieuxParId = useRef<Map<string, Lieu>>(new Map())
  const poses = useRef<Map<string, maplibregl.Marker>>(new Map())
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
  // synchronisées après chaque rendu (règle react-hooks/refs : pas d'écriture
  // pendant le rendu) ; cet effet est déclaré AVANT ceux qui les consomment.
  useEffect(() => {
    setActifRef.current = setActif
    onVoirRef.current = onVoir
    actifRef.current = actif
    vusRef.current = vus
    comparerRef.current = comparer
    marquesRef.current = marques
  }, [setActif, onVoir, actif, vus, comparer, marques])

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
  const creerPinLieu = (l: Lieu): HTMLElement => {
    // la pastille avec initiale est un SIGNAL FORT : « un pote de ton cercle a
    // curé ce spot ». On ne la met QUE pour une vraie voix nommée (tipsCercle).
    // Le fond éditorial « jeudi. », lui, reste des pins NEUTRES — sinon la carte
    // devient une mer de « J » qui ne dit rien à personne.
    const sig = estAMoi(l) ? undefined : l.tipsCercle?.[0]
    const nbVoix = (l.note ? 1 : 0) + (l.tipsCercle?.length ?? 0)
    const valide = l.tampon?.v === 'valide'
    const ferme = etatHoraire(l.horaires)?.ouvert === false
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
        // une teinte par curateur + son initiale à l'encre (garde-fou : nom vide)
        el.style.background = teinteCurateur(sig.auteur)
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
      // Coupe du monde : pastille ballon sur les lieux qui diffusent les matchs
      if (l.match === 'diffuse') {
        const ballon = document.createElement('span')
        ballon.className = 'pin-ballon'
        ballon.title = 'on y voit les matchs'
        ballon.innerHTML =
          '<svg viewBox="0 0 24 24" fill="none" stroke="#15130f" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7l3.4 2.5-1.3 4h-4.2l-1.3-4z"/></svg>'
        el.appendChild(ballon)
      }
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
    for (const [id, el] of Object.entries(pinEls.current)) {
      el.classList.toggle('pin-actif', id === a)
      el.classList.toggle('pin-grise', a !== null && id !== a)
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
      // le pin fait 18px ancré au centre : le label naît ~2px sous son bord bas
      const boite: Boite = { x: pt.x - w / 2, y: pt.y + 11, w, h: 14 }
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

    // ── pose des entrants (naissance : l'encre se dépose, .pin-depose) ──
    for (const id of voulus) {
      if (poses.current.has(id)) continue
      const l = lieuxParId.current.get(id)
      if (!l) continue
      const el = creerPinLieu(l)
      pinEls.current[id] = el
      poses.current.set(
        id,
        new maplibregl.Marker({ element: enrober(el) }).setLngLat([l.lng, l.lat]).addTo(m),
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
  }

  // refs vivantes pour les listeners maplibre posés une seule fois au mount ;
  // synchronisées après chaque rendu, avant les effets consommateurs ci-dessous.
  const poserRef = useRef(poserVisibles)
  const majLabelsRef = useRef(majLabels)
  const appliquerEtatsRef = useRef(appliquerEtats)
  useEffect(() => {
    poserRef.current = poserVisibles
    majLabelsRef.current = majLabels
    appliquerEtatsRef.current = appliquerEtats
    ouvrirPanneauRef.current = ouvrirPanneauMarque
  })

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
    // la carte bouge : le panneau de marque (ancré au point écran) se ferme
    carte.current.on('movestart', () => setPanneauMarque(null))
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
    }
    // ── les MONUMENTS-REPÈRES : le croquis s'oriente comme un vrai carnet ──
    // des silhouettes à l'encre graphite, discrètes, jamais tapables — elles
    // situent (la tour, la butte, l'étoile) sans jamais concurrencer les spots.
    for (const mo of MONUMENTS) {
      const el = document.createElement('div')
      el.className = 'monument-repere'
      el.innerHTML = `${mo.trait}<span class="monument-nom">${mo.nom}</span>`
      new maplibregl.Marker({ element: el }).setLngLat([mo.lng, mo.lat]).addTo(carte.current)
    }

    // "moi" par défaut : Place Vendôme (point de repère + futur calcul de distance)
    const elMoi = document.createElement('div')
    elMoi.className = 'pin-moi'
    elMoi.title = 'moi'
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

  // ── `vus` / `comparer` : un simple toggle de classes sur les pins existants —
  // AUCUN marker recréé, la vue ne bouge pas.
  useEffect(() => {
    appliquerEtatsRef.current()
  }, [vus, comparer])

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
            aria-label={`marquer ${lieuPanneau.nom}`}
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
              placeholder="ton émoji"
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
                retirer la marque
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
                {comparer.includes(panneauMarque.id) ? 'ne plus comparer' : 'à comparer'}
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
            aria-label="fermer"
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
                  "pas encore de mot sur ce lieu."}
              </p>
            )}

            {/* PAGE 2 — recommandé par */}
            {sheetPage === 2 && (
              <div className="carte-sheet-recos mono">
                <span className="carte-sheet-lbl">recommandé par</span>
                <span className="carte-sheet-reco-liste">
                  {[
                    ...(lieuActif.note
                      ? [
                          !estAMoi(lieuActif) && lieuActif.proprietaire === CURATEUR_JEUDI
                            ? NOM_JEUDI
                            : 'toi',
                        ]
                      : []),
                    ...(lieuActif.tipsCercle ?? []).map(
                      (t) => `@${t.auteur.toLowerCase()}`,
                    ),
                  ].join('  ·  ') || 'personne encore — à toi de jouer.'}
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
                    <span>horaires inconnus</span>
                  )
                })()}
                {(() => {
                  const w = propreteWcLabel(lieuActif.propreteWc)
                  return w ? (
                    <span className="carte-sheet-wc">wc {w.points} {w.mot}</span>
                  ) : null
                })()}
                {lieuActif.match === 'diffuse' && (
                  <span className="carte-sheet-wc">
                    <IBallon taille={12} /> on y voit les matchs
                  </span>
                )}
                {lieuActif.match === 'refuge' && <span>refuge anti-foot</span>}
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
                  {enCompaCarte ? 'comparer →' : 'la fiche →'}
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
                {comparer.includes(l.id) && <span className="carte-card-vs mono">à comparer</span>}
                <span className="carte-card-nom">{l.nom}</span>
                <span className="mono carte-card-dist">
                  <span className="carte-card-km">{formatDistance(distanceM(l))}</span>
                  <span className="carte-card-min">{tempsMarche(distanceM(l))} min</span>
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
                  <span className="tc-sous">{tempsMarche(d)} min à pied</span>
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
                  <span className="tc-wc-pts">{w.points}</span> {w.mot}
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
