// ════════════════════════════════════════════════════════════════
// jeudi. — TRADUIRE LES HORAIRES OSM (09/08/2026)
//
// OpenStreetMap écrit ses horaires dans une syntaxe riche (« opening_hours »
// — ex: `Mo-Fr 09:00-12:00,14:00-18:00; Sa 09:00-12:00; PH off`), alors que
// le carnet ne connaît qu'UNE plage par lieu : `[ouverture, fermeture]` en
// heures décimales (19.5 = 19h30), fermeture > 24 = après minuit
// (`[19, 26]` = 19h → 2h). Une borne à `null` = « je sais pas » ; ce module
// ne produit jamais ça — quand il rend une réponse, les deux bornes sont
// connues. `undefined` = rien de fiable à en tirer.
//
// LA RÈGLE : jeudi. est une app du soir. On retient donc, parmi toutes les
// plages du texte OSM (il peut y en avoir plusieurs par jour, et des jours
// différents peuvent avoir des horaires différents), CELLE QUI COUVRE 20h.
// Si aucune plage ne couvre 20h → undefined (le lieu ferme avant le soir,
// ou le texte ne dit rien d'exploitable). Si le texte propose plusieurs
// plages du soir DIFFÉRENTES selon les jours (un jeudi ≠ un dimanche) →
// undefined aussi : une seule case en base ne peut pas mentir en choisissant
// arbitrairement un jour plutôt qu'un autre. Dans le doute, on ne devine
// jamais — un champ vide vaut mieux qu'un horaire faux.
// ════════════════════════════════════════════════════════════════

/** le résultat que sait écrire le carnet : les deux bornes toujours connues,
 *  ou rien du tout. (Le type large `[number|null, number|null]` de `Lieu`
 *  accepte cette forme, mais ce module ne produit jamais de borne `null`
 *  seule — il n'y a rien dans OSM qui corresponde à « je sais l'une des deux
 *  bornes mais pas l'autre » pour une plage qui couvre 20h.) */
export type HoraireTraduit = [number, number]

const HEURE_SOIR = 20

/** "HH:MM" → heure décimale (9.5, 23.0, …). Accepte "24:00" tel quel. */
function versDecimal(hh: string, mm: string): number {
  return Number(hh) + Number(mm) / 60
}

/** un couple ouverture/fermeture, fermeture ramenée après minuit (+24) si
 *  elle est ≤ l'ouverture — sauf fermeture exactement à minuit (24:00),
 *  qui reste 24 et pas 0. */
function normaliserPlage(ouv: number, ferm: number): [number, number] {
  const fermAjustee = ferm <= ouv ? ferm + 24 : ferm
  return [ouv, fermAjustee]
}

/** est-ce que [ouv, fermAjustee) couvre 20h (en comptant le lendemain si la
 *  plage traverse minuit) ? */
function couvre20h(ouv: number, fermAjustee: number): boolean {
  return HEURE_SOIR >= ouv && HEURE_SOIR < fermAjustee
}

const RE_PLAGE = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g
// version non globale, dédiée aux tests de présence (`.test()` sur une regex
// `g` est statefull via `lastIndex` — on ne veut pas de ce piège ici)
const RE_PLAGE_PRESENTE = /\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/

/** extrait, dans UN segment de règle (ex: "Mo-Fr 09:00-12:00,14:00-18:00"),
 *  la ou les plages qui couvrent 20h. En temps normal il n'y en a qu'une
 *  (les plages d'un même jour ne se chevauchent pas) ; s'il y en a plusieurs
 *  c'est que la donnée est incohérente — on les remonte toutes pour que
 *  l'appelant décide de refuser. */
function plagesDuSoir(segment: string): Array<[number, number]> {
  const trouvees: Array<[number, number]> = []
  for (const m of segment.matchAll(RE_PLAGE)) {
    const [ouv, ferm] = normaliserPlage(versDecimal(m[1], m[2]), versDecimal(m[3], m[4]))
    if (couvre20h(ouv, ferm)) trouvees.push([ouv, ferm])
  }
  return trouvees
}

/** deux plages sont-elles la même valeur ? */
function memePlage(a: [number, number], b: [number, number]): boolean {
  return a[0] === b[0] && a[1] === b[1]
}

/**
 * Traduit une chaîne `opening_hours` d'OpenStreetMap vers le format du
 * carnet. Fonction PURE — ne lit ni n'écrit rien, ne devine jamais :
 * toute ambiguïté, contradiction, ou syntaxe non reconnue renvoie
 * `undefined` plutôt qu'une valeur inventée.
 */
export function traduireHorairesOsm(osm: string | null | undefined): HoraireTraduit | undefined {
  if (!osm) return undefined
  const texte = osm.trim()
  if (!texte) return undefined

  // "24/7" — la seule syntaxe où la chaîne entière tient en un mot :
  // ouvert tout le temps, donc ouvert le soir de 0h à minuit.
  if (/^24\/7$/i.test(texte)) return [0, 24]

  // horaires calés sur le soleil : on ne sait PAS à quelle heure exacte le
  // soleil se couche ou se lève (ça varie toute l'année) → aucune plage
  // fiable n'en sort, pour ce lieu comme pour tout le reste de la chaîne.
  if (/sunrise|sunset|dawn|dusk/i.test(texte)) return undefined

  // règles multiples, séparées par ";" (jours différents, exceptions,
  // jours fériés…). On regarde chacune indépendamment.
  const segments = texte.split(';').map((s) => s.trim()).filter(Boolean)
  if (segments.length === 0) return undefined

  const candidates: Array<[number, number]> = []
  for (const segment of segments) {
    // un segment "off" (ex: "Su off", "PH off", ou la chaîne entière "off")
    // ferme ces jours-là : il ne peut évidemment rien proposer pour 20h.
    if (/\boff\b/i.test(segment) && !RE_PLAGE_PRESENTE.test(segment)) continue
    const plages = plagesDuSoir(segment)
    if (plages.length > 1) return undefined // un même jour se contredit → trop louche
    if (plages.length === 1) candidates.push(plages[0])
  }

  if (candidates.length === 0) return undefined // aucune plage ne couvre 20h
  // toutes les plages du soir trouvées (un jour, plusieurs jours…) doivent
  // s'accorder ; sinon (horaires variables selon le jour) on ne choisit pas
  // arbitrairement — une seule case en base ne peut pas représenter « ça
  // dépend du jour ».
  const premiere = candidates[0]
  for (const c of candidates) if (!memePlage(c, premiere)) return undefined
  return premiere
}
