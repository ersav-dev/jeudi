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
