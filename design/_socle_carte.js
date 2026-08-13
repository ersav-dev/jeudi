/* socle carte des planches « quartiers » — 13/08/2026
   LE FOND EST LE VRAI : tuiles CARTO dark_all, celles de Carte.tsx
   (© OpenStreetMap © CARTO), autour du canal Saint-Martin / République.
   Repère : mosaïque z15 de 3x3 tuiles = 768 px CSS, origine tuile
   (16598,11270). 1 unité = 1 px d'écran de téléphone = ~3,14 m au sol.
   z14 = les mêmes coordonnées divisées par 2 (les tuiles tombent juste). */

const MOSA = {
  15: { s: 768, n: 3, x0: 16598, y0: 11270, p: 'd15' },
  14: { s: 1024, n: 2, x0: 8299, y0: 5635, p: 'd14' },
  13: { s: 512, n: 2, x0: 4149, y0: 2817, p: 'd13' },
}
const tuiles = (z) => {
  const m = MOSA[z]; let h = ''
  for (let y = 0; y < m.n; y++) for (let x = 0; x < m.n; x++)
    h += `<img src="_tuiles/${m.p}_${m.x0 + x}_${m.y0 + y}.png" style="left:${x * 256}px;top:${y * 256}px">`
  return h
}
// un point du repère z15 → le repère du niveau demandé
const pt = (p, z) => (z === 15 ? p : z === 14 ? [p[0] / 2, p[1] / 2] : [128 + p[0] / 4, 128 + p[1] / 4])
const pts = (a, z) => a.map((p) => pt(p, z))

/* ── le quartier de référence : « mon quartier », 12 ancres ────── */
// République ↔ Oberkampf ↔ Parmentier — le triangle qu'un Parisien
// appelle « chez moi » sans jamais savoir où il s'arrête.
const QUARTIER = [
  [372, 350], [452, 330], [524, 352], [552, 410], [548, 478], [556, 540],
  [516, 592], [440, 614], [372, 596], [340, 540], [336, 462], [344, 396],
]
// la plume ne pose que 5 points (tout son intérêt… et sa limite)
const QUARTIER_PLUME = [[380, 336], [556, 372], [556, 570], [430, 616], [330, 452]]
// les traits droits : 8 taps
const QUARTIER_DROIT = [
  [372, 350], [452, 328], [552, 370], [560, 478], [560, 570],
  [452, 616], [356, 578], [330, 440],
]

/* ── géométrie : les trois façons de fermer une forme ──────────── */
const catmull = (p, ferme = true) => {
  const n = p.length; let d = `M ${p[0][0]} ${p[0][1]}`
  for (let i = 0; i < (ferme ? n : n - 1); i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n]
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6},` +
         ` ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`
  }
  return d + (ferme ? ' Z' : '')
}
const droit = (p, ferme = true) => `M ${p.map((q) => q.join(' ')).join(' L ')}` + (ferme ? ' Z' : '')

// le tracé brut du doigt : la courbe échantillonnée + le tremble de la main
const alea = (s) => { let x = s; return () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648 }
const echantillons = (p, n = 190, seed = 7) => {
  const r = alea(seed), out = [], m = p.length
  for (let i = 0; i < n; i++) {
    const t = (i / n) * m, j = Math.floor(t), u = t - j
    const q = (k) => p[(j + k + m) % m]
    const h = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u)
    const w = Math.sin(t * 3.1) * 2.4 + (r() - 0.5) * 3.4   // le poignet + le doigt
    out.push([h(q(-1)[0], q(0)[0], q(1)[0], q(2)[0]) + w, h(q(-1)[1], q(0)[1], q(1)[1], q(2)[1]) + w * 0.7])
  }
  return out
}
const brut = (p, seed = 7, part = 1) => {
  const e = echantillons(p, 190, seed), n = Math.max(2, Math.round(e.length * part))
  return `M ${e.slice(0, n).map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L ')}` + (part >= 1 ? ' Z' : '')
}
const partiel = (p, part, seed = 7) => {
  const e = echantillons(p, 190, seed), n = Math.max(2, Math.round(e.length * part))
  return { d: `M ${e.slice(0, n).map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L ')}`, fin: e[n - 1], debut: e[0] }
}
// LE POINT DÉCIDE (Ersan, 13/08) : chaque ancre est DURE (angle net) ou
// DOUCE (la courbe passe au travers). Une poignée nulle d'un côté suffit à
// casser la tangente — c'est le point d'angle des vrais outils vectoriels,
// obtenu ici par un tap au lieu d'une touche du clavier.
const mixte = (p, durs = []) => {
  const n = p.length
  const dur = (i) => durs.includes(((i % n) + n) % n)
  const tan = (i) => {
    const a = p[(i - 1 + n) % n], b = p[(i + 1) % n]
    return [(b[0] - a[0]) / 6, (b[1] - a[1]) / 6]
  }
  let d = `M ${p[0][0]} ${p[0][1]}`
  for (let i = 0; i < n; i++) {
    const a = p[i], b = p[(i + 1) % n]
    const ta = dur(i) ? [0, 0] : tan(i)
    const tb = dur(i + 1) ? [0, 0] : tan(i + 1)
    d += ` C ${(a[0] + ta[0]).toFixed(1)} ${(a[1] + ta[1]).toFixed(1)},` +
         ` ${(b[0] - tb[0]).toFixed(1)} ${(b[1] - tb[1]).toFixed(1)}, ${b[0]} ${b[1]}`
  }
  return d + ' Z'
}
const forme = (k, p, ferme = true, seed = 7, durs) =>
  k === 'mixte' ? mixte(p, durs)
  : k === 'droit' ? droit(p, ferme)
  : k === 'brut' ? brut(p, seed, ferme ? 1 : 0.999)
  : catmull(p, ferme)

/* ── ce qui habite la carte ────────────────────────────────────── */
// des spots plausibles du quartier (coordonnées posées sur les rues)
const SPOTS = [
  { x: 438, y: 442, n: 'Aux Deux Amis' }, { x: 526, y: 476, n: 'Le Perchoir', g: true },
  { x: 350, y: 566, n: 'Chez Jeannette' }, { x: 512, y: 590, n: 'Le Mécano', g: true },
  { x: 404, y: 404, n: null }, { x: 468, y: 382, n: null }, { x: 544, y: 436, n: null },
  { x: 376, y: 458, n: null }, { x: 340, y: 438, n: null }, { x: 556, y: 524, n: null },
  { x: 432, y: 600, n: null }, { x: 352, y: 596, n: null },
  { x: 236, y: 306, n: 'Le Comptoir Général', g: true }, { x: 664, y: 486, n: 'Aux Folies' },
  { x: 690, y: 330, n: null }, { x: 258, y: 640, n: null }, { x: 214, y: 470, n: null },
  { x: 620, y: 660, n: null }, { x: 300, y: 210, n: null },
]
const pin = (s, z) => {
  const [x, y] = pt([s.x, s.y], z)
  return `<g class="pin">
    <path d="M ${x} ${y} l -2.6 -5.4 l 5.2 0 Z" class="pin-pied"/>
    <circle cx="${x}" cy="${y - 9}" r="5.4" class="pin-rond"/>
    <circle cx="${x}" cy="${y - 9}" r="1.9" class="pin-oeil"/>
    ${s.n ? `<text x="${x + (s.g ? -9 : 9)}" y="${y - 6}" class="pin-nom"
       ${s.g ? 'text-anchor="end"' : ''}>${s.n}</text>` : ''}</g>`
}
// les plaques de station (le référentiel IDFM, zéro écart — cf. transport)
const LIGNES = { 3: '#837902', 5: '#FF7E2E', 8: '#D282BE', 9: '#D5C900', 11: '#704B1C' }
const PLAQUES = [
  { x: 356, y: 366, n: 'République', l: [3, 5, 8, 9, 11] },
  { x: 546, y: 340, n: 'Parmentier', l: [3] },
  { x: 470, y: 620, n: 'Oberkampf', l: [5, 9] },
]
const plaque = (q, z) => {
  const [x, y] = pt([q.x, q.y], z)
  const w = 11 + q.n.length * 5.4 + q.l.length * 8
  return `<g class="plq"><rect x="${x - w / 2}" y="${y - 8}" width="${w}" height="16" rx="2"/>
    ${q.l.map((n, i) => `<circle cx="${x - w / 2 + 9 + i * 8}" cy="${y}" r="2.6" fill="${LIGNES[n]}"/>`).join('')}
    <text x="${x - w / 2 + 6 + q.l.length * 8}" y="${y + 3.4}" class="plq-nom">${q.n}</text></g>`
}

/* ── le doigt ──────────────────────────────────────────────────── */
const doigt = (x, y, o = {}) => `<g class="doigt">
  ${o.halo === false ? '' : `<circle cx="${x}" cy="${y}" r="${o.r || 22}" class="dt-pulpe"/>`}
  <circle cx="${x}" cy="${y}" r="2.8" class="dt-point"/>
  ${o.fleche ? `<path d="${o.fleche}" class="dt-fleche" marker-end="url(#tete)"/>` : ''}</g>`

/* ── le cadre : tuiles + teinte + encre ────────────────────────── */
let UID = 0
function cadre(o) {
  const z = o.z || 15, m = MOSA[z], id = 'q' + (++UID)
  const w = o.w || 272, h = o.h || 340
  const v = pt(o.vue || [314, 296], z)          // coin haut-gauche de la fenêtre
  const zones = (o.zones || []).map((zz) => ({
    ...zz, P: pts(zz.pts || QUARTIER, z),
    d: forme(zz.durs ? 'mixte' : zz.k || 'lisse', pts(zz.pts || QUARTIER, z),
       !zz.ouvert, zz.seed, zz.durs),
  }))
  const plan = (cls, style) =>
    `<div class="plan ${cls}" style="width:${m.s}px;height:${m.s}px;left:${-v[0]}px;top:${-v[1]}px;${style || ''}">${tuiles(z)}</div>`

  const teinte = zones.filter((zz) => zz.teinte).map((zz) => `
    <div class="teinte" style="--enc:${zz.c};width:${m.s}px;height:${m.s}px;left:${-v[0]}px;top:${-v[1]}px;
         clip-path:path('${zz.d}');opacity:${zz.teinte === true ? 1 : zz.teinte}">
      <div class="plan" style="width:${m.s}px;height:${m.s}px;left:0;top:0">${tuiles(z)}</div></div>`).join('')

  // la MATIÈRE dit le sens : plein = j'y vais, hachuré = j'évite. Jamais la
  // couleur (le rouge serait un piège : c'est la cire, et elle a un métier)
  const hachures = zones.map((zz, i) => zz.hachure
    ? `<pattern id="${id}h${i}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
         <line x1="0" y1="0" x2="0" y2="7" stroke="${zz.c}" stroke-width="1.6" opacity=".55"/></pattern>`
    : '').join('')

  const encre = zones.map((zz, iz) => {
    if (zz.part !== undefined && zz.part < 1) {
      const p = partiel(zz.P, zz.part, zz.seed)
      return `<g style="--enc:${zz.c}"><path d="${p.d}" class="trace-vive"/>
        ${zz.ferme ? `<path d="M ${p.fin[0]} ${p.fin[1]} L ${p.debut[0]} ${p.debut[1]}" class="trace-ferme"/>` : ''}
        ${zz.doigtSuit ? doigt(p.fin[0], p.fin[1], { r: 22 }) : ''}</g>`
    }
    return `<g style="--enc:${zz.c}">
      ${zz.aplat ? `<path d="${zz.d}" class="aplat" style="opacity:${zz.aplat}"/>` : ''}
      ${zz.hachure ? `<path d="${zz.d}" fill="url(#${id}h${iz})" stroke="none"/>` : ''}
      ${zz.contour === false ? '' : `<path d="${zz.d}"
          class="${zz.fantome ? 'contour-fantome' : zz.vif ? 'contour-vif' : 'contour'}"
          style="stroke-width:${zz.fantome ? 1.6 : zz.vif ? (zz.trait || 2.2) : (zz.repos || 1.4)}${
            zz.pointille ? ';stroke-dasharray:3 4' : ''}"/>`}
      ${zz.rature ? `<path d="${zz.rature}" class="rature"/>` : ''}
      ${zz.poignees ? zz.P.map((p, i) => {
        const r = zz.actif === i ? 7 : 5, cl = `poignee ${zz.actif === i ? 'po-actif' : ''}`
        // le point DUR est un carré, le point DOUX un rond : la convention
        // de tous les outils vectoriels, lisible à la taille du pouce
        return (zz.durs || []).includes(i)
          ? `<rect x="${p[0] - r}" y="${p[1] - r}" width="${r * 2}" height="${r * 2}" class="${cl}"/>`
          : `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" class="${cl}"/>`
      }).join('') : ''}
      ${zz.milieux ? zz.P.map((p, i, a) => { const q = a[(i + 1) % a.length]
          return `<circle cx="${(p[0] + q[0]) / 2}" cy="${(p[1] + q[1]) / 2}" r="3" class="milieu"/>` }).join('') : ''}
      ${zz.nom ? `<text x="${pt([zz.nx, zz.ny], z)[0]}" y="${pt([zz.nx, zz.ny], z)[1]}" class="etq"
          transform="rotate(${zz.rot === undefined ? -3.5 : zz.rot} ${pt([zz.nx, zz.ny], z)[0]} ${pt([zz.nx, zz.ny], z)[1]})"
          style="font-size:${zz.nt || 22}px">${zz.nom}</text>` : ''}</g>`
  }).join('')

  const dedans = (s) => zones.some((zz) => zz.teinte) // (repère de lecture, non utilisé pour filtrer)
  return `<div class="cadre" style="width:${w}px;height:${h}px" id="${id}">
    ${plan('')}${teinte}
    <svg viewBox="${v[0]} ${v[1]} ${w} ${h}" width="${w}" height="${h}">
      <defs>${hachures}<marker id="tete${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
        <path d="M 0 1 L 9 5 L 0 9 z" fill="rgba(239,233,216,.55)"/></marker></defs>
      ${o.spots === false ? '' : (() => { let n = o.noms === undefined ? 99 : o.noms
          return SPOTS.map((s) => pin(s.n && n-- > 0 ? s : { ...s, n: null }, z)).join('') })()}
      ${o.plaques === false ? '' : PLAQUES.map((q) => plaque(q, z)).join('')}
      ${encre}
      ${o.doigt ? doigt(...pt(o.doigt, z), o.doigtOpt || {}) : ''}
      ${o.sus || ''}
    </svg>
    ${o.bandeau ? `<div class="bandeau">${o.bandeau}<span>annuler</span></div>` : ''}
    ${o.bas || ''}
  </div>`
}

/* ── deux autres zones, pour la vue de loin (planche 3) ────────── */
const AILLEURS = [
  { nom: 'le dimanche', c: '#7C9A6E', nx: 780, ny: 390,
    pts: [[700, 300], [790, 270], [870, 300], [890, 380], [860, 460], [780, 500], [700, 470], [664, 380]] },
  { nom: 'les courses', c: '#C9963E', nx: 302, ny: 752,
    pts: [[240, 660], [340, 640], [410, 690], [420, 780], [360, 850], [260, 860], [196, 800], [190, 720]] },
]

/* ── les encres du carnet (planche 2) ──────────────────────────── */
const ENCRES = [
  { id: 'prusse', nom: 'bleu de Prusse', c: '#5C88A6', dit: "l'eau, le trajet, le calme" },
  { id: 'vert', nom: 'vert-de-gris', c: '#7C9A6E', dit: 'les arbres, le dimanche' },
  { id: 'aniline', nom: "violet d'aniline", c: '#8E76B4', dit: 'la nuit, la fête' },
  { id: 'ocre', nom: 'ocre brûlée', c: '#C9963E', dit: 'les lumières, le monde' },
  { id: 'indien', nom: 'rose indien', c: '#B85F82', dit: 'le tendre, le à-moi' },
  { id: 'graphite', nom: 'graphite', c: '#9A948A', dit: 'celle qui ne crie pas' },
]
