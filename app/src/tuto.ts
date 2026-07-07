// ════════════════════════════════════════════════════════════════
// jeudi. — LE TUTO « NOTES EN MARGE »
// personne n'explique l'app : on t'a PRÊTÉ un carnet. l'ancien proprio
// (« j. ») a laissé des notes griffonnées en marge — chacune s'efface
// quand t'as fait le geste qu'elle montre, et ne revient jamais
// (sauf « relire les notes en marge », dans les réglages).
// logique PURE (localStorage seulement) : testable sans DOM ni React.
// ════════════════════════════════════════════════════════════════

const CLE = 'jeudi-notes-marge' // les ids des notes DÉJÀ effacées

/** l'écran où la note vit (repérage humain — la logique ne s'en sert pas) */
export type EcranNote = 'accueil' | 'cesoir' | 'fiche' | 'carte' | 'cercle' | 'validation'

export interface NoteTuto {
  id: string
  texte: string
  ecran: EcranNote
}

/** les notes de l'ancien proprio — chacune UNE fois, au bon moment */
export const NOTES: NoteTuto[] = [
  {
    id: 'mot-bienvenue',
    ecran: 'accueil',
    texte:
      "tiens. mon carnet des soirs.\nj'ai laissé des notes en marge — elles s'effacent quand t'as pigé.\n— j.",
  },
  {
    id: 'deck-swipe',
    ecran: 'cesoir',
    texte: 'à droite si ça te tente. à gauche, on oublie.',
  },
  {
    id: 'deck-tape',
    ecran: 'cesoir',
    texte: 'tape la photo → un autre lieu. tape le mot → une autre voix.',
  },
  {
    id: 'fiche-tip-pote',
    ecran: 'fiche',
    texte: "ça, c'est un pote qui parle. pas 4 000 inconnus.",
  },
  {
    id: 'carte-point',
    ecran: 'carte',
    texte: "le point, c'est toi. le reste, c'est tes soirs.",
  },
  {
    id: 'cercle-invite',
    ecran: 'cercle',
    texte: 'un carnet seul, ça sert à rien. passe le lien à un pote.',
  },
  {
    id: 'valider-carnet',
    ecran: 'validation',
    texte: "c'est là que le carnet devient le tien.",
  },
]

/** le texte d'une note par id — chaîne vide si l'id n'existe pas */
export function texteNote(id: string): string {
  return NOTES.find((n) => n.id === id)?.texte ?? ''
}

// ── l'état : les ids effacés, dans l'ordre où les gestes ont été faits ──
function lireEffacees(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLE) ?? '[]')
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return [] // stockage abîmé → on repart de zéro, sans casser
  }
}

/** la note a-t-elle déjà été effacée (geste accompli ou tap) ? */
export function noteVue(id: string): boolean {
  return lireEffacees().includes(id)
}

/** efface une note — idempotent : une note effacée le reste, une seule trace */
export function effacerNote(id: string): void {
  const cur = lireEffacees()
  if (cur.includes(id)) return
  localStorage.setItem(CLE, JSON.stringify([...cur, id]))
  prevenir()
}

/** réglages : tout relire — toutes les notes reviennent, au bon moment chacune */
export function toutRelire(): void {
  localStorage.removeItem(CLE)
  prevenir()
}

// ── l'abonnement (React écoute via useSyncExternalStore) ──
type Ecouteur = () => void
const ecouteurs = new Set<Ecouteur>()

/** s'abonner aux changements d'état des notes ; renvoie le désabonnement */
export function sAbonnerNotes(cb: Ecouteur): () => void {
  ecouteurs.add(cb)
  return () => {
    ecouteurs.delete(cb)
  }
}

function prevenir(): void {
  ecouteurs.forEach((cb) => cb())
}
