// ── MES MONUMENTS : ta photo à la place de la gravure ──────────────────
// Idée d'Ersan (10/08/2026) : les photos qu'on prend deviennent des stickers
// qui marquent les lieux. Première tranche — les 8 monuments de la carte.
//
// TROIS RÈGLES QUI VIENNENT DE LA DISCUSSION, et qui commandent ce fichier :
//
//  1. STRICTEMENT PERSONNEL. Ta photo ne quitte pas ce téléphone : elle vit
//     en IndexedDB, elle ne monte pas au cloud, personne d'autre ne la voit.
//     C'est ce qui règle la question du repère partagé — la tour Eiffel reste
//     la tour Eiffel pour tout le monde, seul TON dessin change. Et c'est
//     aussi ce qui fait qu'il n'y a AUCUNE modération à écrire : rien n'est
//     publié. Le partage sera une v2, et il attendra signaler/bloquer.
//
//  2. LA GRAVURE NE DISPARAÎT PAS. Elle tient l'échelle de la ville — une
//     silhouette cernée se lit à 40 px, une photo non. Ta photo prend le
//     relais en approchant (voir SEUIL_PHOTO). La carte se développe quand on
//     zoome : de loin le carnet imprimé, de près tes souvenirs.
//
//  3. LA TAILLE NE CHANGE PAS (demande explicite d'Ersan). Le sticker se
//     glisse dans la géométrie existante du monument : hauteur réelle en
//     mètres, courbe de compression, plafond, règle de priorité. On ne
//     réinvente rien — seule l'image change.

import { getDB } from './db'
import { MONUMENTS } from './monuments'

/** Au-dessus de cette hauteur d'affichage, ta photo prend le relais de la
 *  gravure. 64 px : en dessous, une photo n'est qu'une tache — c'est la même
 *  raison qui fait taire le cartouche sous 30 px. */
export const SEUIL_PHOTO = 64

/** La hauteur à laquelle on range le sticker. Celle des gravures (768 px) :
 *  au-delà on stockerait du détail que la carte n'affichera jamais, le
 *  plafond d'affichage étant de 338 px (soit 676 px sur un écran à 2×). */
export const HAUTEUR_STOCK = 768

/** Le sticker garde la HAUTEUR du monument, mais ne peut pas devenir une
 *  banderole : au-delà de 1,5× sa hauteur il irait cogner ses voisins et
 *  fausser la règle anti-chevauchement, qui raisonne sur la demi-hauteur.
 *  Une photo panoramique se contentera donc d'être plus petite — c'est une
 *  conséquence juste : un cadrage bâclé prend moins de place. */
export const LARGEUR_MAX = 1.5

/** les noms de monuments qui peuvent porter un sticker (ceux de la carte) */
export const MONUMENTS_STICKABLES: readonly string[] = MONUMENTS.map((m) => m.nom)

export function estStickable(nom: string): boolean {
  return MONUMENTS_STICKABLES.includes(nom)
}

// ── le stockage ────────────────────────────────────────────────────────
// Une entrée par monument, clé = son nom (celui de monuments.ts, qui sert
// déjà de clé partout ailleurs : dataset.mo, HAUTEUR_M, BOOST_PROPRE).
const STORE = 'stickers'

type Sticker = { blob: Blob; ajoute: string }

/** IndexedDB n'a pas ce magasin avant la version 2 : on l'ouvre à part
 *  plutôt que de faire monter la version du magasin principal, pour ne pas
 *  toucher au chemin critique des lieux. */
async function magasin() {
  const db = await getDB()
  // `stickers` est déclaré dans le schéma (db.ts) ; si une vieille base ne
  // l'a pas encore, on renvoie null et l'app se comporte comme avant.
  if (!db.objectStoreNames.contains(STORE)) return null
  return db
}

/** range ta photo pour ce monument. Elle est redimensionnée et convertie en
 *  WebP avant d'entrer : une photo d'iPhone fait 4 Mo, on n'en garde que ce
 *  que la carte peut afficher. */
export async function poserSticker(nom: string, fichier: Blob): Promise<boolean> {
  if (!estStickable(nom)) return false
  const db = await magasin()
  if (!db) return false
  const blob = await reduire(fichier, HAUTEUR_STOCK)
  if (!blob) return false
  await db.put(STORE, { blob, ajoute: new Date().toISOString() }, nom)
  return true
}

export async function retirerSticker(nom: string): Promise<void> {
  const db = await magasin()
  await db?.delete(STORE, nom)
}

/** tous tes stickers, en URL d'objet prêtes à poser dans un <img>.
 *  ⚠ L'APPELANT DOIT RÉVOQUER ces URL quand il s'en défait (voir
 *  revoquerStickers) — sinon les blobs restent en mémoire tant que la page
 *  vit, et la carte se remonte à chaque changement de vue. */
export async function lireStickers(): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  const db = await magasin()
  if (!db) return out
  for (const nom of MONUMENTS_STICKABLES) {
    const s = (await db.get(STORE, nom)) as Sticker | undefined
    if (s?.blob) out.set(nom, URL.createObjectURL(s.blob))
  }
  return out
}

export function revoquerStickers(urls: Iterable<string>): void {
  for (const u of urls) URL.revokeObjectURL(u)
}

// ── la réduction, en canvas ────────────────────────────────────────────
/** ramène une image à `hMax` de haut, en WebP. null si le navigateur n'a pas
 *  su la décoder (on ne stocke jamais un fichier qu'on ne saurait pas
 *  réafficher). */
export async function reduire(fichier: Blob, hMax: number): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(fichier)
    const ech = Math.min(1, hMax / bitmap.height)
    const l = Math.max(1, Math.round(bitmap.width * ech))
    const h = Math.max(1, Math.round(bitmap.height * ech))
    const cv = document.createElement('canvas')
    cv.width = l
    cv.height = h
    const ctx = cv.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0, l, h)
    bitmap.close?.()
    return await new Promise<Blob | null>((res) =>
      cv.toBlob((b) => res(b), 'image/webp', 0.85),
    )
  } catch {
    return null
  }
}
