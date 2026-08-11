// cache d'object-URLs : un blob = une URL, créée une seule fois
// (corrige la fuite mémoire des createObjectURL appelés à chaque render)
const cache = new WeakMap<Blob, string>()

export function urlPhoto(blob: Blob): string {
  let url = cache.get(blob)
  if (!url) {
    url = URL.createObjectURL(blob)
    cache.set(blob, url)
  }
  return url
}

// la source d'une photo : URL distante (test/cloud) sinon le blob local
export function srcPhoto(p: { blob?: Blob; url?: string }): string {
  if (p.url) return p.url
  return p.blob ? urlPhoto(p.blob) : ''
}

// ── le retrait d'une photo ──────────────────────────────────────
// jeudi ne masque pas les visages : on assume, comme tout réseau social.
// La contrepartie, c'est que le retrait doit être FACILE. Depuis la 0018,
// le signalement s'écrit EN BASE (db.ts → signalerCible, formulaire dans la
// fiche) — l'ancien mailto: vers une boîte inexistante est mort. (LCEN art.
// 6-I-5 : un contenu signalé se retire vite ; la politique l'engage à 24 h.)
// ⚠️ ADRESSE À CRÉER avant toute ouverture publique (AVANT_LANCEMENT.md,
// décision 12/08) : le domaine jeudi.app + contact@ — c'est la 4ᵉ obligation
// d'Apple 1.2 (un moyen de joindre, PUBLIÉ), même si le signalement in-app
// n'en dépend plus.
export const CONTACT_RETRAIT = 'contact@jeudi.app'

// une photo distante qui ne charge pas (service down, hors-ligne, lien mort) :
// on efface l'<img> — le fond papier/tirage stylé en CSS reprend sa place.
// JAMAIS l'icône « image cassée » du navigateur devant un utilisateur.
export function photoIndisponible(e: React.SyntheticEvent<HTMLImageElement>): void {
  const img = e.currentTarget
  img.style.visibility = 'hidden'
  // le même <img> peut feuilleter plusieurs photos (src change) : dès qu'une
  // photo VALIDE charge, elle a le droit de réapparaître.
  img.addEventListener('load', () => { img.style.visibility = '' }, { once: true })
}
