import { describe, it, expect } from 'vitest'
import {
  ENCRES, CAP_ZONES, encreSuggeree, metres, simplifier, depuisTrace, depuisTaps,
  bulleAutour, retournerPoint, contour, enGeoJSON, dansLaZone, lieuxDeLaZone,
  poserAngle, deplacerPoint, ajouterPointApres, retirerPoint, milieux,
  POIDS, POIDS_DEFAUT, COEUR_DEFAUT, poidsDuLieu, rangDuLieu, ecarterLesJamais, classerParZones,
  filtrerParZones, zonesQuiContiennent, CAP_SUPER_CERCLE, zonesActives,
  metresParPixel, pointsSaisissables, TOLERANCE_M, type PointZone,
} from '../quartiers'

// le terrain des planches : le triangle République ↔ Oberkampf ↔ Parmentier
const CENTRE = { lng: 2.3661, lat: 48.8698 }
const ZONE = bulleAutour(CENTRE, 350)

describe('les encres', () => {
  it('six encres nommées, et un plafond de dix zones', () => {
    expect(ENCRES).toHaveLength(6)
    // « une encre = une zone » est tombée : on trace aussi le taf, le
    // dating, ce qu'on évite — six ne suffisaient plus
    expect(CAP_ZONES).toBe(10)
  })
  it('suggère la première encre libre, dans l’ordre du carnet', () => {
    expect(encreSuggeree([])).toBe('prusse')
    expect(encreSuggeree([{ encre: 'prusse' }, { encre: 'vert' }])).toBe('aniline')
  })
  it('ne bloque plus quand les six sont prises — l’encre se répète, le mot distingue', () => {
    const toutes = ENCRES.map((e) => ({ encre: e.id }))
    expect(ENCRES.map((e) => e.id)).toContain(encreSuggeree(toutes))
  })
  it('ni la cire ni le bleu jeudi n’entrent dans la palette', () => {
    const hex = ENCRES.map((e) => e.hex.toLowerCase())
    expect(hex).not.toContain('#a8322a')
    expect(hex).not.toContain('#5d8dff')
  })
})

describe('le poids — « me recommander ce quartier ? », de 0 à 3', () => {
  const TAF = { points: bulleAutour({ lng: 2.3350, lat: 48.8720 }, 300), poids: 3 as const, coeur: true }
  const JAMAIS = { points: bulleAutour({ lng: 2.3661, lat: 48.8698 }, 300), poids: 0 as const }
  const EGAL = { points: bulleAutour({ lng: 2.3200, lat: 48.8600 }, 300), poids: 2 as const }
  const UNPEU = { points: bulleAutour({ lng: 2.3522, lat: 48.8566 }, 250), poids: 1 as const }
  const lieux = [
    { id: 'ailleurs', lat: 48.8566, lng: 2.3522 },
    { id: 'dans le jamais', lat: 48.8698, lng: 2.3661 },
    { id: 'au taf', lat: 48.8720, lng: 2.3350 },
  ]

  it('le cadran est PLEIN par défaut, et le cœur éteint', () => {
    expect(POIDS).toHaveLength(4)
    expect(POIDS.map((p) => p.n)).toEqual([0, 1, 2, 3])
    expect(POIDS.map((p) => p.pastille)).toEqual(['○○○', '●○○', '●●○', '●●●'])
    // aucune étoile nulle part : on ne note pas un quartier
    expect(POIDS.some((p) => p.pastille.includes('★'))).toBe(false)
    // une zone qu'on vient de tracer ne diminue RIEN
    expect(POIDS_DEFAUT).toBe(3)
    expect(COEUR_DEFAUT).toBe(false)
    expect(poidsDuLieu({ lat: 48.80, lng: 2.30 }, [TAF, JAMAIS])).toBe(3)
  })
  it('le cœur ajoute un étage AU-DESSUS du plein', () => {
    const aimee = { points: bulleAutour({ lng: 2.3350, lat: 48.8720 }, 300), poids: 3 as const, coeur: true }
    expect(rangDuLieu({ lat: 48.8720, lng: 2.3350 }, [aimee])).toBe(4)
    expect(rangDuLieu({ lat: 48.80, lng: 2.30 }, [aimee])).toBe(3)
  })
  it('un cadran éteint éteint le cœur : on ne met pas en priorité où on ne va jamais', () => {
    const contradictoire = { points: bulleAutour({ lng: 2.3661, lat: 48.8698 }, 300), poids: 0 as const, coeur: true }
    expect(rangDuLieu({ lat: 48.8698, lng: 2.3661 }, [contradictoire])).toBe(0)
    expect(ecarterLesJamais(lieux, [contradictoire]).map((l) => l.id))
      .toEqual(['ailleurs', 'au taf'])
  })
  it('« jamais » (0) retire, toujours, sans rien allumer', () => {
    expect(ecarterLesJamais(lieux, [TAF, JAMAIS]).map((l) => l.id))
      .toEqual(['ailleurs', 'au taf'])
    expect(ecarterLesJamais(lieux, [TAF, EGAL])).toHaveLength(3)
    expect(ecarterLesJamais(lieux, [])).toHaveLength(3)
  })
  it('« rarement » (1) fait DESCENDRE, il ne retire pas — c’est ça la nuance', () => {
    const ordre = classerParZones(lieux, [UNPEU, TAF]).map((l) => l.id)
    expect(ordre).toHaveLength(3)              // rien n'a disparu
    expect(ordre[0]).toBe('au taf')            // le 3 remonte
    expect(ordre[ordre.length - 1]).toBe('ailleurs') // le 1 tombe en dernier
  })
  it('le cœur REMONTE, il ne filtre pas — la ville reste entière', () => {
    const ordre = classerParZones(lieux, [TAF, JAMAIS]).map((l) => l.id)
    expect(ordre[0]).toBe('au taf')
    expect(ordre).toContain('ailleurs') // rien n'a été réduit à la zone
    expect(ordre).toHaveLength(2)
  })
  it('à poids égal, l’ordre d’origine tient (distance et ouverture décident)', () => {
    const memes = [
      { id: 'a', lat: 48.8566, lng: 2.3522 },
      { id: 'b', lat: 48.8570, lng: 2.3530 },
      { id: 'c', lat: 48.8575, lng: 2.3540 },
    ]
    expect(classerParZones(memes, [TAF]).map((l) => l.id)).toEqual(['a', 'b', 'c'])
  })
  it('le plus BAS l’emporte : un « jamais » gagne sur un cœur qui le chevauche', () => {
    const large = { points: bulleAutour({ lng: 2.3661, lat: 48.8698 }, 900), poids: 3 as const, coeur: true }
    expect(poidsDuLieu({ lat: 48.8698, lng: 2.3661 }, [large, JAMAIS])).toBe(0)
    expect(classerParZones(lieux, [large, JAMAIS]).some((l) => l.id === 'dans le jamais')).toBe(false)
  })
  it('restreindre à une zone reste possible — « ce soir près du taf »', () => {
    expect(filtrerParZones(lieux, [TAF, JAMAIS], TAF).map((l) => l.id)).toEqual(['au taf'])
  })
  it('dit dans quelles zones on se trouve — « tu es dans : le taf »', () => {
    expect(zonesQuiContiennent({ lat: 48.8720, lng: 2.3350 }, [TAF, JAMAIS])).toEqual([TAF])
    expect(zonesQuiContiennent({ lat: 48.8000, lng: 2.3000 }, [TAF, JAMAIS])).toEqual([])
  })
})

describe('le partage au super cercle — une proposition, jamais un filtre', () => {
  const MIENNE = { points: bulleAutour({ lng: 2.3350, lat: 48.8720 }, 300), poids: 3 as const }
  const RECUE = {
    de: 'Karim', acceptee: false, nom: 'jamais ici', encre: 'graphite' as const,
    points: bulleAutour({ lng: 2.3661, lat: 48.8698 }, 300), poids: 0 as const,
  }
  const lieux = [
    { id: 'au taf', lat: 48.8720, lng: 2.3350 },
    { id: 'chez Karim c’est non', lat: 48.8698, lng: 2.3661 },
  ]

  it('l’anneau reste à dix — ce n’est pas une publication', () => {
    expect(CAP_SUPER_CERCLE).toBe(10)
  })
  it('tant qu’elle n’est pas acceptée, la zone d’un pote ne pèse sur RIEN', () => {
    const actives = zonesActives([MIENNE], [RECUE])
    expect(actives).toHaveLength(1)
    expect(ecarterLesJamais(lieux, actives)).toHaveLength(2)
  })
  it('acceptée, elle pèse comme les miennes', () => {
    const actives = zonesActives([MIENNE], [{ ...RECUE, acceptee: true }])
    expect(actives).toHaveLength(2)
    expect(ecarterLesJamais(lieux, actives).map((l) => l.id)).toEqual(['au taf'])
  })
})

describe('la simplification — le tremblé n’était pas de l’âme', () => {
  it('réduit une ligne droite bruitée à ses deux bouts', () => {
    const ligne: PointZone[] = Array.from({ length: 40 }, (_, i) => ({
      lng: 2.36 + i * 0.0004,
      // un tremblé de quelques mètres, bien sous la tolérance
      lat: 48.87 + (i % 2 ? 0.00002 : -0.00002),
    }))
    expect(simplifier(ligne)).toHaveLength(2)
  })
  it('garde les quatre coins d’un carré — un angle n’est pas du bruit', () => {
    const cote = (a: PointZone, b: PointZone, n = 12): PointZone[] =>
      Array.from({ length: n }, (_, i) => ({
        lng: a.lng + ((b.lng - a.lng) * i) / n,
        lat: a.lat + ((b.lat - a.lat) * i) / n,
      }))
    const c = [
      { lng: 2.36, lat: 48.87 }, { lng: 2.37, lat: 48.87 },
      { lng: 2.37, lat: 48.875 }, { lng: 2.36, lat: 48.875 },
    ]
    const carre = [...cote(c[0], c[1]), ...cote(c[1], c[2]), ...cote(c[2], c[3]), ...cote(c[3], c[0])]
    // 4 coins + le point de départ répété en fin de parcours
    expect(simplifier(carre).length).toBeGreaterThanOrEqual(4)
    expect(simplifier(carre).length).toBeLessThanOrEqual(6)
  })
  it('ne touche pas à un contour déjà court', () => {
    const trois = ZONE.slice(0, 3)
    expect(simplifier(trois, 1)).toHaveLength(3)
  })
})

describe('les trois naissances d’une zone', () => {
  it('le lasso : le tracé se ferme tout seul et tous les points sont DOUX', () => {
    const trace = contour(ZONE, 20) // ~160 points, comme un vrai tracé au doigt
    const z = depuisTrace(trace)
    expect(z.length).toBeGreaterThan(5)
    expect(z.length).toBeLessThan(trace.length / 4)
    expect(z.every((p) => !p.dur)).toBe(true)
  })
  it('le lasso refuse un geste qui n’est pas un contour', () => {
    expect(depuisTrace([{ lng: 2.36, lat: 48.87 }, { lng: 2.361, lat: 48.871 }])).toEqual([])
  })
  it('la plume : tous les points sont DURS', () => {
    const z = depuisTaps(ZONE.slice(0, 5))
    expect(z.every((p) => p.dur === true)).toBe(true)
  })
  it('la bulle : huit points doux, à la bonne distance du centre', () => {
    const b = bulleAutour(CENTRE, 300)
    expect(b).toHaveLength(8)
    expect(b.every((p) => !p.dur)).toBe(true)
    for (const p of b) expect(metres(CENTRE, p)).toBeGreaterThan(280)
    for (const p of b) expect(metres(CENTRE, p)).toBeLessThan(320)
  })
})

describe('le point décide, pas l’outil', () => {
  it('un tap retourne le point, et lui seul', () => {
    const z = retournerPoint(ZONE, 2)
    expect(z[2].dur).toBe(true)
    expect(z.filter((p) => p.dur)).toHaveLength(1)
    expect(retournerPoint(z, 2)[2].dur).toBe(false)
  })
  it('un point DUR casse la courbe autour de lui, sans déplacer l’ancre', () => {
    const doux = contour(ZONE)
    const dur = contour(retournerPoint(ZONE, 0))
    // l'ancre ne bouge pas : durcir un point ne déplace pas le point
    expect(dur[0].lng).toBeCloseTo(ZONE[0].lng, 10)
    expect(dur[0].lat).toBeCloseTo(ZONE[0].lat, 10)
    // mais la courbe qui en part, si : la tangente est tombée à zéro
    // (sur une bulle, c'est la latitude qui porte la tangente au point 0 —
    //  la longitude y est symétrique, elle ne peut pas bouger)
    expect(dur[1].lat).not.toBeCloseTo(doux[1].lat, 10)
    const bouge = dur.filter((p, i) => Math.abs(p.lat - doux[i].lat) > 1e-9).length
    expect(bouge).toBeGreaterThan(0)
    // et l'angle RENTRE : la pointe durcie coupe le ventre de la courbe
    expect(metres(CENTRE, dur[1])).toBeLessThan(metres(CENTRE, doux[1]))
  })
  it('tout en durs = un polygone : les sommets sont les ancres', () => {
    const carre: PointZone[] = [
      { lng: 2.36, lat: 48.87, dur: true }, { lng: 2.37, lat: 48.87, dur: true },
      { lng: 2.37, lat: 48.875, dur: true }, { lng: 2.36, lat: 48.875, dur: true },
    ]
    const c = contour(carre, 4)
    // sur un côté droit, tous les échantillons sont alignés
    expect(c[1].lat).toBeCloseTo(carre[0].lat, 9)
    expect(c[2].lat).toBeCloseTo(carre[0].lat, 9)
  })
})

describe('éditer la forme — les quatre gestes de l’éditeur', () => {
  it('on POSE l’angle, on ne le devine pas', () => {
    const dur = poserAngle(ZONE, 1, true)
    expect(dur[1].dur).toBe(true)
    // reposer le même angle est idempotent (contrairement au retournement)
    expect(poserAngle(dur, 1, true)[1].dur).toBe(true)
    expect(poserAngle(dur, 1, false)[1].dur).toBe(false)
    // et ça ne touche personne d'autre
    expect(dur.filter((p) => p.dur)).toHaveLength(1)
  })
  it('glisser une poignée déplace CE point, et lui seul', () => {
    const bouge = deplacerPoint(ZONE, 2, { lng: 2.4, lat: 48.9 })
    expect(bouge[2].lng).toBeCloseTo(2.4, 10)
    expect(bouge[2].lat).toBeCloseTo(48.9, 10)
    expect(bouge[0]).toEqual(ZONE[0])
    expect(bouge).toHaveLength(ZONE.length)
  })
  it('le point ajouté tombe au milieu, et il est DOUX', () => {
    const plus = ajouterPointApres(ZONE, 0)
    expect(plus).toHaveLength(ZONE.length + 1)
    expect(plus[1].lng).toBeCloseTo((ZONE[0].lng + ZONE[1].lng) / 2, 10)
    expect(plus[1].dur).toBeUndefined()
    // les voisins n'ont pas bougé
    expect(plus[0]).toEqual(ZONE[0])
    expect(plus[2]).toEqual(ZONE[1])
  })
  it('ajouter APRÈS le dernier point boucle sur le premier', () => {
    const n = ZONE.length
    const plus = ajouterPointApres(ZONE, n - 1)
    expect(plus).toHaveLength(n + 1)
    expect(plus[n].lng).toBeCloseTo((ZONE[n - 1].lng + ZONE[0].lng) / 2, 10)
  })
  it('retirer un point marche — mais jamais en dessous de trois', () => {
    expect(retirerPoint(ZONE, 3)).toHaveLength(ZONE.length - 1)
    expect(retirerPoint(ZONE, 3)[3]).toEqual(ZONE[4])
    const triangle = ZONE.slice(0, 3)
    expect(retirerPoint(triangle, 0)).toHaveLength(3) // refus : ce serait un trait
  })
  it('les milieux : un par segment, y compris celui qui referme la boucle', () => {
    const m = milieux(ZONE)
    expect(m).toHaveLength(ZONE.length)
    const dernier = m[m.length - 1]
    expect(dernier.lng).toBeCloseTo((ZONE[ZONE.length - 1].lng + ZONE[0].lng) / 2, 10)
  })
  it('la forme éditée reste une zone valable (le centre est toujours dedans)', () => {
    let z = poserAngle(ZONE, 0, true)
    z = ajouterPointApres(z, 2)
    z = deplacerPoint(z, 4, { lng: CENTRE.lng + 0.004, lat: CENTRE.lat + 0.004 })
    z = retirerPoint(z, 6)
    expect(dansLaZone(CENTRE, z)).toBe(true)
    expect(z.length).toBeGreaterThanOrEqual(3)
  })
})

describe('« dans mon quartier » — sans ça, ce n’est qu’un dessin', () => {
  it('le centre est dedans, un point à 2 km est dehors', () => {
    expect(dansLaZone(CENTRE, ZONE)).toBe(true)
    expect(dansLaZone({ lng: 2.40, lat: 48.86 }, ZONE)).toBe(false)
  })
  it('juste dedans / juste dehors, de part et d’autre du bord', () => {
    const bord = ZONE[0]
    const versDedans = { lng: (bord.lng + CENTRE.lng) / 2, lat: (bord.lat + CENTRE.lat) / 2 }
    const versDehors = { lng: bord.lng + (bord.lng - CENTRE.lng), lat: bord.lat + (bord.lat - CENTRE.lat) }
    expect(dansLaZone(versDedans, ZONE)).toBe(true)
    expect(dansLaZone(versDehors, ZONE)).toBe(false)
  })
  it('filtre une liste de lieux — c’est le futur filtre de la recherche', () => {
    const lieux = [
      { id: 'a', lat: CENTRE.lat, lng: CENTRE.lng },
      { id: 'b', lat: 48.8566, lng: 2.3522 },
      { id: 'c', lat: CENTRE.lat + 0.0005, lng: CENTRE.lng - 0.0005 },
    ]
    expect(lieuxDeLaZone(lieux, ZONE).map((l) => l.id)).toEqual(['a', 'c'])
  })
  it('une zone dégénérée ne contient rien (jamais de faux positif)', () => {
    expect(dansLaZone(CENTRE, [])).toBe(false)
    expect(dansLaZone(CENTRE, ZONE.slice(0, 2))).toBe(false)
  })
})

describe('le GeoJSON — ce qui partira à MapLibre', () => {
  it('un anneau fermé, refermé sur son premier point', () => {
    const g = enGeoJSON(ZONE)
    expect(g.type).toBe('Polygon')
    const anneau = g.coordinates[0]
    expect(anneau[0]).toEqual(anneau[anneau.length - 1])
    expect(anneau.length).toBeGreaterThan(20)
  })
})

describe('la règle des 32 px — pour retourner un point, il faut le toucher', () => {
  it('l’échelle du zoom est celle de la carte', () => {
    // ~1,2 m/px à Paris au zoom 17 (repère connu de la doc MapLibre)
    expect(metresParPixel(48.87, 17)).toBeCloseTo(0.78, 1)
    expect(metresParPixel(48.87, 15)).toBeCloseTo(3.14, 1)
  })
  it('fond les points trop serrés, et les rend en zoomant', () => {
    // huit points sur 120 m de rayon : serrés à z15, confortables à z18
    const serree = bulleAutour(CENTRE, 120)
    const z15 = pointsSaisissables(serree, 15)
    const z18 = pointsSaisissables(serree, 18)
    expect(z15.length).toBeLessThan(serree.length)
    expect(z18).toHaveLength(serree.length)
  })
  it('garde toujours au moins le premier point', () => {
    expect(pointsSaisissables(bulleAutour(CENTRE, 5), 12)).toEqual([0])
    expect(pointsSaisissables([], 15)).toEqual([])
  })
})

describe('les mesures', () => {
  it('mesure une distance connue : ~111 m pour un millième de degré de latitude', () => {
    expect(metres({ lng: 2.36, lat: 48.87 }, { lng: 2.36, lat: 48.871 })).toBeCloseTo(111, 0)
  })
  it('la tolérance de lissage reste à l’échelle d’une rue', () => {
    expect(TOLERANCE_M).toBeGreaterThan(5)
    expect(TOLERANCE_M).toBeLessThan(40)
  })
})
