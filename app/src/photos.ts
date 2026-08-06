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
// La contrepartie, c'est que le retrait doit être FACILE — et la personne
// qui se reconnaît sur un tirage n'a presque jamais de compte. Le canal est
// donc un mail, qui marche pour tout le monde. (LCEN art. 6-I-5 : un
// contenu signalé se retire vite ; la politique de confidentialité l'engage
// à 24 h.)
// ⚠️ ADRESSE À CRÉER avant toute ouverture publique (AVANT_LANCEMENT.md) :
// le domaine jeudi.app doit être acheté et contact@ redirigé vers la vraie
// boîte — tant que ce n'est pas fait, un mail envoyé ici REBONDIT.
export const CONTACT_RETRAIT = 'contact@jeudi.app'

export function lienSignalement(nomLieu: string, position: number, total: number): string {
  const sujet = `jeudi — retrait d'une photo : ${nomLieu}`
  const corps = [
    `Lieu : ${nomLieu}`,
    `Photo : ${position}/${total}`,
    '',
    'Ce que je demande (retrait, autre) :',
    '',
    'Pourquoi (je m’y reconnais, je n’ai pas donné mon accord…) :',
    '',
  ].join('\n')
  return `mailto:${CONTACT_RETRAIT}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`
}

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
