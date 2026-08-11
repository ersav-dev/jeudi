// ════════════════════════════════════════════════════════════════
// jeudi. — l'ATTAQUE du blocage (CHANTIER_SIGNALER_BLOQUER, plan §4)
//
// « Vérification par l'attaque, pas par l'UI : deux comptes, on se
// bloque, et on interroge l'API REST à la main avec le jeton de
// l'autre. Si la donnée descend encore, la policy est fausse —
// l'écran, lui, aurait pu mentir. »
//
// Ce script fait exactement ça, systématiquement. À lancer APRÈS
// avoir collé 0018 et 0019 dans Supabase.
//
// ── Mode d'emploi ───────────────────────────────────────────────
// 1. Ouvre l'app connectée avec le compte A (un navigateur) et le
//    compte B (un autre navigateur / une fenêtre privée).
// 2. Dans chaque : DevTools → Application → Local storage → la clé
//    `sb-…-auth-token` → copie la valeur du champ "access_token".
//    (Il expire vite — fais les deux copies juste avant de lancer.)
// 3. Depuis app/ :
//       JETON_A=eyJ… JETON_B=eyJ… node ../_verification/attaque_blocage.mjs
//    (PowerShell : $env:JETON_A='eyJ…'; $env:JETON_B='eyJ…'; node …)
//
// Par défaut le script SE DÉDIT à la fin (A débloque B) pour laisser
// la base comme il l'a trouvée — SAUF la relation et l'anneau
// intérieur, que bloquer() supprime pour de bon (c'est voulu : on se
// redemande). Passe --garder pour laisser le blocage en place.
// ════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ICI = dirname(fileURLToPath(import.meta.url))

// ── l'URL et la clé anon, lues dans app/.env.local (jamais en dur) ──
function lireEnv() {
  const brut = readFileSync(join(ICI, '..', 'app', '.env.local'), 'utf8')
  const prendre = (nom) => {
    const m = brut.match(new RegExp(`^${nom}=(.+)$`, 'm'))
    if (!m) throw new Error(`${nom} introuvable dans app/.env.local`)
    return m[1].trim()
  }
  return { url: prendre('VITE_SUPABASE_URL'), anon: prendre('VITE_SUPABASE_ANON_KEY') }
}

const { url: URL_SB, anon: ANON } = lireEnv()
const JETON_A = process.env.JETON_A
const JETON_B = process.env.JETON_B
const GARDER = process.argv.includes('--garder')

if (!JETON_A || !JETON_B) {
  console.error('Il faut JETON_A et JETON_B (voir le mode d’emploi en tête du script).')
  process.exit(2)
}

// l'uid vit dans le JWT (champ sub) — pas besoin de le demander
function uidDuJeton(jeton) {
  const corps = JSON.parse(Buffer.from(jeton.split('.')[1], 'base64url').toString('utf8'))
  if (!corps.sub) throw new Error('jeton sans sub — pas un access_token ?')
  return corps.sub
}
const UID_A = uidDuJeton(JETON_A)
const UID_B = uidDuJeton(JETON_B)

async function rest(jeton, chemin, options = {}) {
  const r = await fetch(`${URL_SB}${chemin}`, {
    ...options,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${jeton}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  let corps = null
  try {
    corps = await r.json()
  } catch {
    /* certaines réponses sont vides */
  }
  return { statut: r.status, corps }
}

// ── le petit tableau de bord ────────────────────────────────────
let fuites = 0
function verdict(nom, ok, detail = '') {
  if (ok) console.log(`  ✓ ${nom}`)
  else {
    fuites++
    console.log(`  ✗ FUITE — ${nom}${detail ? ` : ${detail}` : ''}`)
  }
}

// une lecture qui doit revenir VIDE (tableau [] — jamais des lignes)
async function doitEtreVide(jeton, chemin, nom) {
  const { statut, corps } = await rest(jeton, chemin)
  const vide = statut === 200 && Array.isArray(corps) && corps.length === 0
  verdict(nom, vide, `HTTP ${statut}, ${Array.isArray(corps) ? corps.length + ' ligne(s)' : JSON.stringify(corps)?.slice(0, 120)}`)
}

// une écriture qui doit être REFUSÉE
async function doitEchouer(jeton, chemin, donnees, nom) {
  const { statut } = await rest(jeton, chemin, { method: 'POST', body: JSON.stringify(donnees) })
  verdict(nom, statut >= 400, `HTTP ${statut} — l’écriture est passée`)
}

console.log(`\njeudi — attaque du blocage`)
console.log(`  A = ${UID_A}\n  B = ${UID_B}\n`)

// ── 0. les deux jetons marchent (sinon tout le reste mentirait) ──
for (const [nom, jeton, uid] of [['A', JETON_A, UID_A], ['B', JETON_B, UID_B]]) {
  const { statut, corps } = await rest(jeton, `/rest/v1/profils_publics?id=eq.${uid}&select=id`)
  if (statut !== 200 || !Array.isArray(corps) || corps.length !== 1) {
    console.error(`Le jeton ${nom} ne répond pas (HTTP ${statut}) — expiré ? Recopie-le et relance.`)
    process.exit(2)
  }
}
console.log('  jetons OK, on y va.\n')

// ── 1. A bloque B ───────────────────────────────────────────────
{
  const { statut, corps } = await rest(JETON_A, '/rest/v1/rpc/bloquer', {
    method: 'POST',
    body: JSON.stringify({ cible: UID_B }),
  })
  if (statut >= 300) {
    console.error(`rpc bloquer a échoué (HTTP ${statut}) : ${JSON.stringify(corps)}`)
    console.error('0019 est-elle collée ?')
    process.exit(2)
  }
  console.log('A a bloqué B. Maintenant, on attaque.\n')
}

// ── 2. B ne voit plus rien de A (et A plus rien de B) ───────────
for (const [moi, jeton, autre] of [['B', JETON_B, UID_A], ['A', JETON_A, UID_B]]) {
  console.log(`avec le jeton de ${moi}, à propos de l'autre :`)
  await doitEtreVide(jeton, `/rest/v1/lieux?owner_id=eq.${autre}&select=id`, 'lieux — aucun spot de l’autre')
  await doitEtreVide(jeton, `/rest/v1/tips?auteur_id=eq.${autre}&select=id`, 'tips — aucune voix de l’autre')
  await doitEtreVide(jeton, `/rest/v1/photos?select=id,lieux!inner(owner_id)&lieux.owner_id=eq.${autre}`, 'photos — aucun tirage des spots de l’autre')
  await doitEtreVide(jeton, `/rest/v1/profils_publics?id=eq.${autre}&select=id`, 'vitrine — introuvable')
  await doitEtreVide(jeton, `/rest/v1/rayures?user_id=eq.${autre}&select=lieu_id`, 'rayures — aucune')
  await doitEtreVide(jeton, `/rest/v1/jugements?user_id=eq.${autre}&select=lieu_id`, 'jugements — aucun')
  await doitEtreVide(jeton, `/rest/v1/relations?select=id`, 'relations — la ligne a sauté')
  console.log('')
}

// ── 3. le silence : B ne peut pas SAVOIR qu'il est bloqué ───────
console.log('le silence :')
await doitEtreVide(JETON_B, '/rest/v1/blocages?select=bloqueur_id', 'blocages, côté bloqué — rien à lire')

// ── 4. B ne peut pas re-demander (défense en profondeur RLS) ────
await doitEchouer(
  JETON_B,
  '/rest/v1/relations',
  { de_id: UID_B, vers_id: UID_A, type: 'suivi', statut: 'demande' },
  'relations — la re-demande est refusée',
)

// ── 5. storage : le portrait de A ne se signe plus pour B ───────
{
  const { statut, corps } = await rest(JETON_B, `/storage/v1/object/sign/photos/${UID_A}/profil.jpg`, {
    method: 'POST',
    body: JSON.stringify({ expiresIn: 60 }),
  })
  // 400/403/404 = rien ne se signe. Attention : si A n'a pas de portrait,
  // un 404 ne prouve rien — le test des photos de lieux (§2) fait foi.
  verdict('storage — le portrait de l’autre ne se signe pas', statut >= 400, `HTTP ${statut} ${JSON.stringify(corps)?.slice(0, 120)}`)
}

// ── 6. on range (sauf --garder) ─────────────────────────────────
if (!GARDER) {
  const { statut } = await rest(JETON_A, '/rest/v1/rpc/debloquer', {
    method: 'POST',
    body: JSON.stringify({ cible: UID_B }),
  })
  console.log(`\nA s'est dédit (HTTP ${statut}). Rappel : la relation et l'anneau ne reviennent pas — on se redemande.`)
} else {
  console.log('\n--garder : le blocage reste en place.')
}

console.log(fuites === 0 ? '\nAUCUNE FUITE. Les policies tiennent.' : `\n${fuites} FUITE(S) — les policies sont fausses, on ne sort pas comme ça.`)
process.exit(fuites === 0 ? 0 : 1)
