import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import Supercluster from 'supercluster'
import {
  maPosition,
  etatHoraire,
  teinteCurateur,
  distanceM,
  formatDistance,
  tempsMarche,
  propreteWcLabel,
  estAMoi,
  type Lieu,
} from './db'
import { IBallon } from './icones'
import { srcPhoto } from './photos'

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

// ── clustering : les propriétés portées par chaque point de l'index ──
type ProprietesPin = { id: string }

// dernier niveau de zoom où l'index groupe encore (au-delà : pins nus).
// sert aussi à la fonte progressive des pastilles pendant le pinch.
const MAXZOOM_GRAPPES = 16

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

// V5 « l'encre se dépose, le tampon frappe » : courbe sèche, jamais de rebond
const COURBE_ENCRE = 'cubic-bezier(0.22, 1, 0.36, 1)'

// naissance d'un pin depuis le ventre de son ex-grappe : posé à sa vraie
// position, il PART visuellement du centroïde (translate écran) et vole
// jusqu'à sa place. retard = stagger, les proches partent d'abord.
const naitreDepuis = (el: HTMLElement, dx: number, dy: number, retard: number) => {
  el.style.transform = `translate(${dx}px, ${dy}px) scale(0.4)`
  el.style.opacity = '0'
  el.style.willChange = 'transform'
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      el.style.transition = `transform 260ms ${COURBE_ENCRE} ${retard}ms, opacity 160ms ease-out ${retard}ms`
      el.style.transform = ''
      el.style.opacity = ''
      window.setTimeout(() => {
        el.style.transition = ''
        el.style.willChange = ''
      }, 320 + retard)
    }),
  )
}

// absorption : le pin (ou la sous-grappe) vole vers le centroïde de la
// grappe qui l'avale, puis le marker est retiré. l'appelant a déjà sorti
// la clé de `poses` : le diffing reste cohérent pendant le vol.
const absorberVers = (mk: maplibregl.Marker, el: HTMLElement, dx: number, dy: number) => {
  el.style.willChange = 'transform'
  el.style.transition = `transform 220ms ease-in, opacity 180ms ease-in`
  el.style.transform = `translate(${dx}px, ${dy}px) scale(0.4)`
  el.style.opacity = '0'
  window.setTimeout(() => mk.remove(), 240)
}

// sortie d'une pastille qui éclate (zoom avant) : elle se résorbe sur place
const resorber = (mk: maplibregl.Marker, el: HTMLElement) => {
  el.style.transition = 'transform 160ms ease-in, opacity 140ms ease-in'
  el.style.transform = 'scale(0.6)'
  el.style.opacity = '0'
  window.setTimeout(() => mk.remove(), 180)
}
// un résultat de getClusters est soit une grappe, soit un point isolé
const estGrappe = (
  f: Supercluster.ClusterFeature<Supercluster.AnyProps> | Supercluster.PointFeature<ProprietesPin>,
): f is Supercluster.ClusterFeature<Supercluster.AnyProps> =>
  (f.properties as { cluster?: boolean }).cluster === true

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
  // ── clustering supercluster : l'index (reconstruit quand `lieux` change),
  // les lieux valides par id, et les markers actuellement posés (diffing).
  // clés de `poses` : `l:<id de lieu>` (pin isolé) ou `c:<cluster_id>` (grappe).
  const indexRef = useRef<Supercluster<ProprietesPin> | null>(null)
  const lieuxParId = useRef<Map<string, Lieu>>(new Map())
  const poses = useRef<Map<string, maplibregl.Marker>>(new Map())
  // #11 : le lieu sélectionné — pilote le bottom-sheet, le carrousel et le grisé
  const [actif, setActif] = useState<string | null>(null)
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
  // synchronisées après chaque rendu (règle react-hooks/refs : pas d'écriture
  // pendant le rendu) ; cet effet est déclaré AVANT ceux qui les consomment.
  useEffect(() => {
    setActifRef.current = setActif
    onVoirRef.current = onVoir
    actifRef.current = actif
    vusRef.current = vus
    comparerRef.current = comparer
  }, [setActif, onVoir, actif, vus, comparer])

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
    // un tip cloud d'un pote sur MON spot ne me déguise pas en curateur :
    // le point rouge (toi) prime toujours sur la pastille
    const sig = estAMoi(l) ? undefined : l.tipsCercle?.[0]
    const nbVoix = (l.note ? 1 : 0) + (l.tipsCercle?.length ?? 0)
    const valide = l.tampon?.v === 'valide'
    const ferme = etatHoraire(l.horaires)?.ouvert === false
    const el = document.createElement('div')
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
    // Coupe du monde : pastille ballon sur les lieux qui diffusent les matchs
    if (l.match === 'diffuse') {
      const ballon = document.createElement('span')
      ballon.className = 'pin-ballon'
      ballon.title = 'on y voit les matchs'
      ballon.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="#15130f" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7l3.4 2.5-1.3 4h-4.2l-1.3-4z"/></svg>'
      el.appendChild(ballon)
    }
    // le nom s'affiche en label sous le pin (au zoom suffisant)
    el.setAttribute('data-nom', l.nom)
    el.title = l.nom
    // priorité d'affichage du label : validé > recommandé par plusieurs > ouvert
    const ouvertMaintenant = etatHoraire(l.horaires)?.ouvert === true
    el.dataset.prio = String((valide ? 3 : 0) + (nbVoix > 1 ? 2 : 0) + (ouvertMaintenant ? 1 : 0))
    // #11 : 1er tap = sélectionne (nom+desc en bottom-sheet, carte en couleur,
    // le reste grisé) · 2e tap sur le même pin = la fiche détaillée.
    el.addEventListener('click', (ev) => {
      ev.stopPropagation()
      if (el.classList.contains('pin-actif')) {
        onVoirRef.current?.(l)
        return
      }
      setActifRef.current(l.id)
    })
    return el
  }

  // ── fabrique la pastille d'une grappe : rond encre ivoire + compte au mono,
  // même langage que les pins du carnet. clic = zoom jusqu'à l'éclatement.
  const creerPastilleGrappe = (idGrappe: number, compte: number, lng: number, lat: number) => {
    const el = document.createElement('div')
    // la taille dit le poids : une grappe de 200 ne ressemble pas à une de 5,
    // et un duo/trio de trottoir n'est qu'une discrète marque « 2 »
    const gabarit =
      compte >= 80 ? ' cluster-lg' : compte >= 15 ? ' cluster-md' : compte <= 3 ? ' cluster-duo' : ''
    el.className = 'cluster-pastille mono' + gabarit
    el.textContent = String(compte)
    el.title = `${compte} lieux`
    el.addEventListener('click', (ev) => {
      ev.stopPropagation()
      const m = carte.current
      const index = indexRef.current
      if (!m || !index) return
      const zActuel = m.getZoom()
      let z: number
      try {
        z = index.getClusterExpansionZoom(idGrappe)
      } catch {
        /* l'index a été reconstruit entre temps : on zoome quand même un cran */
        z = Math.floor(zActuel) + 2
      }
      // paliers : jamais plus de ~2,5 crans par tap — chaque tap déplie UN
      // étage de la hiérarchie (feuilletage), au lieu d'un saut aveugle de
      // 4 niveaux. durée proportionnelle au chemin parcouru.
      const zCible = Math.min(z, zActuel + 2.5, 17.5)
      const duree = Math.min(850, Math.max(280, 320 * (zCible - zActuel)))
      // frappe brève au tap (confirmation tactile) avant le départ
      el.classList.remove('cluster-tap')
      void el.offsetWidth // relance l'animation si re-tap rapide
      el.classList.add('cluster-tap')
      // offset : la grappe visée atterrit AU-DESSUS du centre, pas sous le
      // bottom-sheet/carrousel qui occupent le bas de l'écran
      m.easeTo({ center: [lng, lat], zoom: zCible, duration: duree, offset: [0, -40] })
    })
    return el
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

  // ── LE cœur : interroge l'index sur la bbox visible et pose UNIQUEMENT ce
  // qui s'y trouve, en diffant contre l'existant (crée les nouveaux, retire
  // les disparus, ne touche pas au reste). Appelé sur moveend/zoomend — jamais
  // à chaque frame.
  //
  // Chorégraphie (V5 « l'objet ») : au zoom avant, les pins NAISSENT du ventre
  // de leur ex-grappe et volent vers leur place ; au zoom arrière, la grappe
  // les AVALE (ils volent vers son centroïde) puis frappe comme un tampon.
  // Tout est transform/opacity sur l'élément INTERNE (maplibre garde le sien).
  const poserVisibles = () => {
    const m = carte.current
    const index = indexRef.current
    if (!m || !index) return
    const b = m.getBounds()
    // marge de 20 % autour du viewport : pas de pop au ras du bord en fin de pan
    const margeX = (b.getEast() - b.getWest()) * 0.2
    const margeY = (b.getNorth() - b.getSouth()) * 0.2
    const bbox: [number, number, number, number] = [
      b.getWest() - margeX,
      Math.max(-85, b.getSouth() - margeY),
      b.getEast() + margeX,
      Math.min(85, b.getNorth() + margeY),
    ]
    const grappes = index.getClusters(bbox, Math.floor(m.getZoom()))

    // les clés voulues d'abord : le diffing a besoin de la photo complète
    const voulus = new Set<string>()
    for (const f of grappes) {
      voulus.add(estGrappe(f) ? `c:${f.properties.cluster_id}` : `l:${f.properties.id}`)
    }
    const a = actifRef.current
    if (a && lieuxParId.current.get(a)) voulus.add(`l:${a}`)

    // ── préparation de la chorégraphie ──────────────────────────────────
    // origines : leafId → point écran du centroïde de sa grappe SORTANTE
    // destinations : leafId → point écran du centroïde de sa grappe ENTRANTE
    const origines = new Map<string, { x: number; y: number }>()
    const destinations = new Map<string, { x: number; y: number }>()
    if (animees) {
      for (const [cle, mk] of poses.current) {
        if (voulus.has(cle) || !cle.startsWith('c:')) continue
        const pt = m.project(mk.getLngLat())
        try {
          for (const feuille of index.getLeaves(Number(cle.slice(2)), Infinity)) {
            origines.set((feuille.properties as ProprietesPin).id, pt)
          }
        } catch {
          /* index reconstruit entre temps : pas d'animation pour celle-ci */
        }
      }
      for (const f of grappes) {
        if (!estGrappe(f)) continue
        const cle = `c:${f.properties.cluster_id}`
        if (poses.current.has(cle)) continue
        const [lng, lat] = f.geometry.coordinates as [number, number]
        const pt = m.project([lng, lat])
        try {
          for (const feuille of index.getLeaves(f.properties.cluster_id, Infinity)) {
            destinations.set((feuille.properties as ProprietesPin).id, pt)
          }
        } catch {
          /* idem : on saute l'animation, jamais la pose */
        }
      }
    }
    // stagger par grappe d'origine : les pins proches du centroïde partent
    // les premiers ; plafond bas pour rester sous les 300 ms de la V5
    const rangs = new Map<{ x: number; y: number }, number>()

    // ── pose des entrants ───────────────────────────────────────────────
    const poserLieu = (l: Lieu) => {
      const cle = `l:${l.id}`
      if (poses.current.has(cle)) return
      const el = creerPinLieu(l)
      pinEls.current[l.id] = el
      poses.current.set(
        cle,
        new maplibregl.Marker({ element: enrober(el) }).setLngLat([l.lng, l.lat]).addTo(m),
      )
      if (!animees) return
      const de = origines.get(l.id)
      if (de) {
        const ici = m.project([l.lng, l.lat])
        const rang = rangs.get(de) ?? 0
        rangs.set(de, rang + 1)
        naitreDepuis(el, de.x - ici.x, de.y - ici.y, Math.min(rang * 12, 96))
      } else {
        // pan-in ou premier rendu : l'encre se dépose, sec
        el.classList.add('pin-depose')
      }
    }
    for (const f of grappes) {
      const [lng, lat] = f.geometry.coordinates as [number, number]
      if (estGrappe(f)) {
        const cle = `c:${f.properties.cluster_id}`
        if (poses.current.has(cle)) continue
        const el = creerPastilleGrappe(f.properties.cluster_id, f.properties.point_count, lng, lat)
        poses.current.set(
          cle,
          new maplibregl.Marker({ element: enrober(el) }).setLngLat([lng, lat]).addTo(m),
        )
        if (!animees) continue
        // une grappe née d'une grappe plus large : elle naît de son parent ;
        // sinon (pan-in, avalement de pins) : elle frappe comme un tampon
        let feuille0: string | undefined
        try {
          feuille0 = (index.getLeaves(f.properties.cluster_id, 1)[0]?.properties as ProprietesPin)?.id
        } catch {
          feuille0 = undefined
        }
        const de = feuille0 ? origines.get(feuille0) : undefined
        if (de) {
          const ici = m.project([lng, lat])
          naitreDepuis(el, de.x - ici.x, de.y - ici.y, 0)
        } else {
          el.classList.add('cluster-frappe')
        }
      } else {
        const l = lieuxParId.current.get(f.properties.id)
        if (l) poserLieu(l)
      }
    }
    // le lieu SÉLECTIONNÉ garde toujours son pin, même si sa grappe l'avale :
    // la sélection reste visible (le pin se superpose à la pastille).
    if (a) {
      const l = lieuxParId.current.get(a)
      if (l) poserLieu(l)
    }

    // ── retrait des sortants ────────────────────────────────────────────
    for (const [cle, mk] of [...poses.current]) {
      if (voulus.has(cle)) continue
      poses.current.delete(cle)
      const estLieu = cle.startsWith('l:')
      const el = (estLieu ? pinEls.current[cle.slice(2)] : null) ?? (mk.getElement().firstElementChild as HTMLElement | null)
      if (estLieu) delete pinEls.current[cle.slice(2)]
      if (!animees || !el) {
        mk.remove()
        continue
      }
      if (estLieu) {
        const vers = destinations.get(cle.slice(2))
        if (vers) {
          // avalé par une grappe naissante : il vole vers elle
          const de = m.project(mk.getLngLat())
          absorberVers(mk, el, vers.x - de.x, vers.y - de.y)
        } else {
          mk.remove() // sorti du viewport : sec, pas de théâtre hors champ
        }
      } else {
        // pastille sortante : avalée par plus grande (vol) ou éclatée (résorption)
        let feuille0: string | undefined
        try {
          feuille0 = (index.getLeaves(Number(cle.slice(2)), 1)[0]?.properties as ProprietesPin)?.id
        } catch {
          feuille0 = undefined
        }
        const vers = feuille0 ? destinations.get(feuille0) : undefined
        const de = m.project(mk.getLngLat())
        const auChamp =
          de.x > -60 && de.y > -60 && de.x < m.getContainer().clientWidth + 60 && de.y < m.getContainer().clientHeight + 60
        if (!auChamp) mk.remove()
        else if (vers) absorberVers(mk, el, vers.x - de.x, vers.y - de.y)
        else resorber(mk, el)
      }
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
      carte.current?.resize()
      poserRef.current()
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

    // fonte progressive des pastilles PENDANT le geste de zoom (16→17) :
    // une seule CSS var écrite (throttle rAF), lue par .cluster-pastille en
    // scale/opacity — les grappes fondent sous le doigt, et le vrai swap de
    // zoomend (chorégraphié) devient presque invisible.
    let rafFonte = 0
    const surZoomContinu = () => {
      if (rafFonte) return
      rafFonte = requestAnimationFrame(() => {
        rafFonte = 0
        const z = carte.current?.getZoom()
        if (z == null) return
        const d = Math.min(Math.max(z - MAXZOOM_GRAPPES, 0), 1)
        cont.style.setProperty('--fonte-grappes', d.toFixed(3))
      })
    }
    carte.current.on('zoom', surZoomContinu)

    const posesCourantes = poses.current
    const pins = pinEls.current
    return () => {
      window.removeEventListener('deviceorientationabsolute', onOrient as EventListener, true)
      window.removeEventListener('deviceorientation', onOrient, true)
      if (onceEnAttente) cont.removeEventListener('click', onceEnAttente)
      if (rafFonte) cancelAnimationFrame(rafFonte)
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

  // ── (re)construit l'index supercluster quand les lieux changent, puis pose
  // la vue courante. `vus` n'est PLUS une dépendance : consulter une fiche ne
  // reconstruit rien (voir l'effet léger plus bas).
  useEffect(() => {
    const validesL = lieux.filter((l) => l.lat !== 0 || l.lng !== 0)
    lieuxParId.current = new Map(validesL.map((l) => [l.id, l]))
    // grappes jusqu'au trottoir : minPoints 2 (deux bars à 15 m ne se rendent
    // plus en pins superposés incliquables) et l'agrégation tient jusqu'au
    // zoom 16 — au-delà, seuls des lieux réellement confondus resteraient
    // groupés, on rend les pins nus. les duos/trios ont leur gabarit dédié.
    const index = new Supercluster<ProprietesPin>({ radius: 40, maxZoom: MAXZOOM_GRAPPES, minPoints: 2 })
    index.load(
      validesL.map((l) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [l.lng, l.lat] },
        properties: { id: l.id },
      })),
    )
    indexRef.current = index
    // les cluster_id ne survivent pas à une reconstruction d'index : table rase
    poses.current.forEach((mk) => mk.remove())
    poses.current.clear()
    pinEls.current = {}
    const m = carte.current
    if (!m) return
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

  if (mini) {
    return <div ref={conteneur} className="carte carte-mini" />
  }

  return (
    <>
      <div ref={conteneur} className={`carte${lieuActif ? ' carte-sel' : ''}`} />

      {/* la barre « à comparer » + la table vivent maintenant dans App (source
          unique), rendues sous les filtres → plus de superposition en vue carte. */}

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
            {sheetPage !== 0 && <div className="carte-sheet-nom">{lieuActif.nom}</div>}

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
                    ...(lieuActif.note ? ['toi'] : []),
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
                  }, 450)
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
                  <img className="carte-card-bg" src={srcPhoto(l.photos[0])} alt="" loading="lazy" />
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
              <img src={srcPhoto(l.photos[0])} alt="" loading="lazy" />
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
