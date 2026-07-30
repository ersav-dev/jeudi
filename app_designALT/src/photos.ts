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
