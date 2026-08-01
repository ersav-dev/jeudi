import { getDB } from './db'

// ════════════════════════════════════════════════════════════════
// v22 — LE DÉCOR EST MORT, VIVE LE VRAI CARNET.
// Historique : v1→v21, l'app embarquait un fond local simulé (les spots
// Google d'Ersan + curated + extra sous le curateur 'jeudi', plus des
// éclaireurs fictifs 'pub-*' aux tips inventés — « Karim, éclaireur du
// 10e »…). Le panel puis Ersan ont tranché : plus AUCUN faux profil.
// Le fond vit désormais dans le CLOUD, dans le compte réel du fondateur
// (visibilité publique — la RLS le sert à tous les inscrits, signé d'un
// humain identifiable). Voir supabase/imports/2026-08-01_import_ersan_v2.
// Ici, il ne reste qu'une chose à faire : purger le décor des installs
// existantes. Une fois, puis plus jamais.
// ════════════════════════════════════════════════════════════════
export async function importerSeed(): Promise<boolean> {
  if (localStorage.getItem('jeudi-seed-v22')) return false
  // poser le drapeau AVANT de purger : React StrictMode lance l'effet
  // deux fois en dev (course classique)
  localStorage.setItem('jeudi-seed-v22', 'fait')
  const db = await getDB()
  let purges = 0
  for (const l of await db.getAll('lieux')) {
    if (l.proprietaire === 'jeudi' || l.proprietaire?.startsWith('pub-')) {
      await db.delete('lieux', l.id)
      purges++
    }
  }
  return purges > 0
}
