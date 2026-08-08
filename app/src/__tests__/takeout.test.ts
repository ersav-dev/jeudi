// ── tests de la moisson Takeout : GeoJSON, CSV, URLs, zip ────────
// Pur, sans DOM (le géocodage et l'écriture en base vivent ailleurs).
import { describe, it, expect } from 'vitest'
import { zipSync, strToU8 } from 'fflate'
import {
  parserGeoJson,
  parserCsv,
  parserListeCsv,
  coordsDepuisUrl,
  moissonner,
  aGeocoder,
} from '../takeout'

// ── matière première ────────────────────────────────────────────
const GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      geometry: { coordinates: [2.3295, 48.8675] },
      properties: { Title: 'le perchoir', Comment: 'rooftop' },
    },
    {
      // la variante sans geometry : coordonnées dans Location.Geo
      properties: {
        Location: {
          'Business Name': 'bisou.',
          Address: '15 Bd du Temple, 75003 Paris',
          Geo: { coordinates: [2.365, 48.863] },
        },
      },
    },
    { properties: { Title: 'sans coordonnées — sauté' } },
  ],
}

const CSV_FAVORIS = [
  'Title,Note,URL',
  'Candelaria,"tacos, puis la porte du fond","https://www.google.com/maps/place/Candelaria/@48.8629,2.3631,17z/data=!3m1"',
  '"Le Mary Celeste","","https://maps.google.com/?q=48.8635,2.3622"',
  'Chez Momo,demande la table du fond,https://maps.google.com/?cid=123456',
].join('\r\n')

describe('parserGeoJson — les deux variantes de Saved Places.json', () => {
  it('lit geometry.coordinates ET Location.Geo, saute le reste', () => {
    const e = parserGeoJson(GEOJSON)!
    expect(e).toHaveLength(2)
    expect(e[0]).toMatchObject({ nom: 'le perchoir', lat: 48.8675, lng: 2.3295, note: 'rooftop' })
    expect(e[1]).toMatchObject({ nom: 'bisou.', adresse: '15 Bd du Temple, 75003 Paris' })
  })
  it('rend null (pas une exception) si ce n’est pas une FeatureCollection', () => {
    expect(parserGeoJson({ pas: 'ça' })).toBeNull()
    expect(parserGeoJson(null)).toBeNull()
  })
})

describe('parserCsv — RFC 4180 sans se prendre au sérieux', () => {
  it('guillemets, virgules dans les champs, CRLF', () => {
    const l = parserCsv('a,"b, avec virgule",c\r\nd,"e ""citée""",f')
    expect(l).toEqual([
      ['a', 'b, avec virgule', 'c'],
      ['d', 'e "citée"', 'f'],
    ])
  })
  it('retour à la ligne DANS un champ cité', () => {
    const l = parserCsv('Title,Note\nx,"ligne 1\nligne 2"')
    expect(l[1][1]).toBe('ligne 1\nligne 2')
  })
  it('ignore les lignes vides', () => {
    expect(parserCsv('a,b\n\n\nc,d\n')).toHaveLength(2)
  })
})

describe('coordsDepuisUrl — les trois cachettes Google', () => {
  it('!3d…!4d… (les données du lieu)', () => {
    expect(coordsDepuisUrl('https://google.com/maps/place/x/data=!3d48.8629!4d2.3631')).toEqual({
      lat: 48.8629,
      lng: 2.3631,
    })
  })
  it('@lat,lng (la position de la carte)', () => {
    expect(coordsDepuisUrl('https://www.google.com/maps/place/Candelaria/@48.8629,2.3631,17z')).toEqual(
      { lat: 48.8629, lng: 2.3631 },
    )
  })
  it('q=lat,lng', () => {
    expect(coordsDepuisUrl('https://maps.google.com/?q=48.8635,2.3622')).toEqual({
      lat: 48.8635,
      lng: 2.3622,
    })
  })
  it('rien à trouver → null (cid opaque, url vide)', () => {
    expect(coordsDepuisUrl('https://maps.google.com/?cid=123456')).toBeNull()
    expect(coordsDepuisUrl(undefined)).toBeNull()
  })
  it('rejette les coordonnées aberrantes', () => {
    expect(coordsDepuisUrl('x?q=148.8,2.3')).toBeNull()
  })
})

describe('parserListeCsv — une liste Google → une catégorie', () => {
  it('nomme la liste d’après le fichier et récupère les coords des URLs', () => {
    const l = parserListeCsv('Takeout/Saved/Favoris.csv', CSV_FAVORIS)!
    expect(l.nom).toBe('Favoris')
    expect(l.entrees).toHaveLength(3)
    expect(l.entrees[0]).toMatchObject({ nom: 'Candelaria', lat: 48.8629 })
    expect(l.entrees[1]).toMatchObject({ nom: 'Le Mary Celeste', lat: 48.8635 })
    expect(l.entrees[2].lat).toBeUndefined() // cid opaque → géocodage plus tard
    expect(l.entrees[2].note).toBe('demande la table du fond')
  })
  it('refuse un CSV qui n’est pas une liste Google (pas de Title)', () => {
    expect(parserListeCsv('x.csv', 'a,b\n1,2')).toBeNull()
  })
})

describe('moissonner — le zip entier, les fichiers seuls, le mélange', () => {
  it('avale le .zip Takeout entier : json + csv, ignore le reste', () => {
    const zip = zipSync({
      'Takeout/Maps (your places)/Saved Places.json': strToU8(JSON.stringify(GEOJSON)),
      'Takeout/Saved/Favoris.csv': strToU8(CSV_FAVORIS),
      'Takeout/Saved/Envie d’y aller.csv': strToU8('Title,Note,URL\nGravity Bar,,'),
      'Takeout/archive_browser.html': strToU8('<html>…</html>'),
    })
    const m = moissonner([{ nom: 'takeout.zip', contenu: zip }])
    expect(m.spots).toHaveLength(2)
    expect(m.listes.map((l) => l.nom).sort()).toEqual(['Envie d’y aller', 'Favoris'])
    expect(m.ignores).toHaveLength(0) // le html n'est même pas tenté
  })
  it('avale un json et des csv déposés séparément', () => {
    const m = moissonner([
      { nom: 'Saved Places.json', contenu: JSON.stringify(GEOJSON) },
      { nom: 'Favoris.csv', contenu: CSV_FAVORIS },
    ])
    expect(m.spots).toHaveLength(2)
    expect(m.listes).toHaveLength(1)
  })
  it('fusionne deux listes du même nom', () => {
    const m = moissonner([
      { nom: 'Favoris.csv', contenu: 'Title,Note,URL\nA,,' },
      { nom: 'Favoris.csv', contenu: 'Title,Note,URL\nB,,' },
    ])
    expect(m.listes).toHaveLength(1)
    expect(m.listes[0].entrees).toHaveLength(2)
  })
  it('le fichier illisible finit dans `ignores`, jamais en exception', () => {
    const m = moissonner([
      { nom: 'photo.json', contenu: 'pas du json' },
      { nom: 'cassé.zip', contenu: new Uint8Array([1, 2, 3]) },
    ])
    expect(m.spots).toHaveLength(0)
    expect(m.ignores).toEqual(['photo.json', 'cassé.zip'])
  })
})

describe('aGeocoder — annoncer la durée honnêtement', () => {
  it('ne compte que les entrées sans coordonnées', () => {
    const l = parserListeCsv('Favoris.csv', CSV_FAVORIS)!
    expect(aGeocoder([l])).toBe(1) // Chez Momo seul (cid opaque)
  })
})
