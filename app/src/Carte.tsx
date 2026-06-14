import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import {
  maPosition,
  etatHoraire,
  teinteCurateur,
  distanceM,
  formatDistance,
  tempsMarche,
  propreteWcLabel,
  type Lieu,
} from './db'
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
  const marqueurs = useRef<maplibregl.Marker[]>([])
  // recalcul des labels (défini dans l'effet d'init, appelé après pose/clic)
  const majLabelsRef = useRef<() => void>(() => {})
  // #11 : le lieu sélectionné — pilote le bottom-sheet, le carrousel et le grisé
  const [actif, setActif] = useState<string | null>(null)
  // les éléments DOM des pins, par id de lieu (pour colorer/griser sans re-créer)
  const pinEls = useRef<Record<string, HTMLElement>>({})
  // la barre carrousel (pour faire défiler la carte vers la carte active)
  const carrousel = useRef<HTMLDivElement>(null)
  // photo en cours dans le bloc « détails » (feuilletable), remise à 0 au changement de lieu
  const [sheetPhoto, setSheetPhoto] = useState(0)
  // page d'infos du bloc « détails » (swipe gauche/droite) : le mot · recommandé · pratique
  const [sheetPage, setSheetPage] = useState(0)
  const sheetDepart = useRef({ x: 0, y: 0 })
  // suivi du clic long : timer + drapeau "déjà déclenché" pour ne pas aussi sélectionner
  const press = useRef<{ timer: number; fired: boolean } | null>(null)
  // setActif stable pour les closures DOM créées dans l'effet de pose
  const setActifRef = useRef(setActif)
  setActifRef.current = setActif
  const onVoirRef = useRef(onVoir)
  onVoirRef.current = onVoir

  const valides = lieux.filter((l) => l.lat !== 0 || l.lng !== 0)
  const lieuActif = valides.find((l) => l.id === actif) ?? null
  // le lieu affiché est-il dans la sélection « à comparer » ? (pilote le bouton)
  const actifAComparer = !!lieuActif && comparer.includes(lieuActif.id)
  // en mode comparaison, le bloc détails gagne une PAGE de plus (la dernière) :
  // l'accès à la table côte-à-côte. sinon, les 4 pages habituelles.
  // sur un lieu « à comparer », le bouton du bloc détails se transforme en
  // « comparer → » et ouvre la FICHE (nav restreinte aux lieux comparés) ; la
  // table côte-à-côte est ensuite accessible depuis la fiche → flux identique
  // à l'index.
  const enCompaCarte = actifAComparer && comparer.length > 1

  useEffect(() => {
    if (!conteneur.current) return
    carte.current = new maplibregl.Map({
      container: conteneur.current,
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
    carte.current.on('load', () => carte.current?.resize())
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
    new maplibregl.Marker({ element: elMoi }).setLngLat(moi()).addTo(carte.current)
    // ── labels anti-collision : jamais tous ; ~8 max, par priorité, sans chevauchement
    const PLAFOND = 8
    type Box = { x: number; y: number; w: number; h: number }
    const chevauche = (a: Box, b: Box) =>
      !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y)
    const boite = (el: Element): Box => {
      const r = el.getBoundingClientRect()
      const nom = (el.getAttribute('data-nom') || '').slice(0, 16)
      const w = nom.length * 5.5 + 12
      return { x: r.left + r.width / 2 - w / 2, y: r.bottom + 2, w, h: 14 }
    }
    const majLabels = () => {
      const cont = conteneur.current
      const m = carte.current
      if (!cont || !m) return
      const pins = [...cont.querySelectorAll<HTMLElement>('.pin, .pin-photo')]
      // dézoomé : la carte respire, zéro label
      if (m.getZoom() < 13) {
        pins.forEach((p) => p.classList.remove('label-on'))
        return
      }
      // priorité : actif > déjà affiché (hystérésis, anti-clignotement) > data-prio
      const dejaLa = new Set(pins.filter((p) => p.classList.contains('label-on')))
      const tries = pins
        .map((p) => ({
          p,
          actif: p.classList.contains('pin-actif'),
          score:
            (p.classList.contains('pin-actif') ? 100 : 0) +
            (dejaLa.has(p) ? 10 : 0) +
            Number(p.dataset.prio || 0),
        }))
        .sort((a, b) => b.score - a.score)
      const posees: Box[] = []
      let n = 0
      for (const { p, actif } of tries) {
        const b = boite(p)
        if (actif) {
          p.classList.add('label-on')
          posees.push(b)
          n++
          continue
        }
        if (n >= PLAFOND || posees.some((o) => chevauche(o, b))) {
          p.classList.remove('label-on')
        } else {
          p.classList.add('label-on')
          posees.push(b)
          n++
        }
      }
    }
    majLabelsRef.current = majLabels
    // recalcul throttlé (rAF) au moindre déplacement/zoom
    let pending = false
    const planifier = () => {
      if (pending) return
      pending = true
      requestAnimationFrame(() => {
        pending = false
        majLabels()
      })
    }
    carte.current.on('move', planifier)
    carte.current.on('zoom', planifier)
    majLabels()
    return () => {
      carte.current?.remove()
      carte.current = null
    }
  }, [])

  // pose les pins rouges et cadre la vue sur les spots
  useEffect(() => {
    const m = carte.current
    if (!m) return

    // la carte doit être prête (style chargé + bonne taille) avant de
    // projeter les pins et cadrer : sinon tuiles et pins se désynchronisent.
    const poser = () => {
      m.resize()
      marqueurs.current.forEach((mk) => mk.remove())
      marqueurs.current = []
      pinEls.current = {}

      const valides = lieux.filter((l) => l.lat !== 0 || l.lng !== 0)
      for (const l of valides) {
        const sig = l.tipsCercle?.[0]
        const nbVoix = (l.note ? 1 : 0) + (l.tipsCercle?.length ?? 0)
        const valide = l.tampon?.v === 'valide'
        const ferme = etatHoraire(l.horaires)?.ouvert === false
        const etats = `${valide ? ' pin-valide' : ''}${ferme ? ' pin-ferme' : ''}`
        const el = document.createElement('div')
        // pins homogènes (façon Airbnb/Google) : la photo vit dans la fiche au tap,
        // pas sur la carte. point rouge = toi · pastille ivoire + initiale = curateur.
        const vu = vus?.has(l.id) ? ' pin-vu' : ''
        el.className = `pin${sig ? ' pin-curateur' : ''}${etats}${vu}`
        if (sig) {
          // une teinte par curateur + son initiale à l'encre
          el.style.background = teinteCurateur(sig.auteur)
          el.textContent = sig.auteur[0].toUpperCase()
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
        const mk = new maplibregl.Marker({ element: el }).setLngLat([l.lng, l.lat]).addTo(m)
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
        pinEls.current[l.id] = el
        marqueurs.current.push(mk)
      }

      if (valides.length === 1) {
        m.flyTo({ center: [valides[0].lng, valides[0].lat], zoom: 14 })
      } else if (valides.length > 1) {
        const bounds = new maplibregl.LngLatBounds()
        valides.forEach((l) => bounds.extend([l.lng, l.lat]))
        m.fitBounds(bounds, { padding: 60, maxZoom: 15 })
      }
    }

    // les marqueurs sont du DOM ancré : pas besoin d'attendre le style
    // (comme le marqueur "moi"). un resize garde tuiles et pins synchro.
    poser()
    majLabelsRef.current()
  }, [lieux, vus])

  // #11 : la sélection — pin actif en couleur, le reste grisé · recadre la carte ·
  // fait défiler le carrousel vers la carte du lieu choisi.
  useEffect(() => {
    Object.entries(pinEls.current).forEach(([id, el]) => {
      el.classList.toggle('pin-actif', id === actif)
      el.classList.toggle('pin-grise', actif !== null && id !== actif)
    })
    majLabelsRef.current()
    setSheetPhoto(0) // nouveau lieu → on repart de la 1re photo
    setSheetPage(1) // on ouvre sur « le mot » ; la photo claire est à gauche (page 0)
    if (!actif) return
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
    const carte_card = carrousel.current?.querySelector(`[data-id="${actif}"]`)
    carte_card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [actif])

  // les pins « à comparer » : dorés et moins transparents (le pin actif reste bleu).
  // dépend aussi de `lieux` pour se réappliquer quand les pins sont recréés.
  useEffect(() => {
    Object.entries(pinEls.current).forEach(([id, el]) => {
      el.classList.toggle('pin-acomparer', comparer.includes(id))
    })
  }, [comparer, lieux])

  const nbOuverts = lieux.filter((l) => etatHoraire(l.horaires)?.ouvert).length

  if (mini) {
    return <div ref={conteneur} className="carte carte-mini" />
  }

  return (
    <>
      <div ref={conteneur} className={`carte${lieuActif ? ' carte-sel' : ''}`} />
      {nbOuverts > 0 && !actif && comparer.length === 0 && (
        <div className="carte-accroche mono">
          {nbOuverts} {nbOuverts > 1 ? 'spots ouverts' : 'spot ouvert'} près de toi ce soir
        </div>
      )}

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
                {lieuActif.match === 'diffuse' && <span className="carte-sheet-wc">⚽ on y voit les matchs</span>}
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

      {/* #11 : le carrousel des lieux — la carte active est en couleur, le reste grisé */}
      {valides.length > 0 && (
        <div className="carte-carrousel" ref={carrousel}>
          {valides.map((l) => (
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
                l.id === actif ? onVoir?.(l) : setActif(l.id) // tap = sélection / fiche
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
          ))}
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
  // pour chaque ligne « gagnante », l'index (ou les index) du/des meilleur(s)
  const dists = lieux.map((l) => distanceM(l))
  const distMin = Math.min(...dists)
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
        {lieux.map((l, i) => (
          <div key={l.id} className={`tc-cell mono${best(dists[i] === distMin)}`}>
            {formatDistance(dists[i])}
            <span className="tc-sous">{tempsMarche(dists[i])} min à pied</span>
          </div>
        ))}

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
              {n > 0 ? `${n} ${n > 1 ? 'voix' : 'voix'}${n >= 2 ? ' · référence' : ''}` : <span className="tc-vide">—</span>}
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
