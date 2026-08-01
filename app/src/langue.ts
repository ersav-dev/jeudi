// ════════════════════════════════════════════════════════════════
// jeudi. — LA LANGUE : français d'abord, anglais aussi.
// Principe : le FRANÇAIS EST LA CLÉ. t('ça dit quoi ce soir ?') rend la
// chaîne telle quelle en fr, et sa traduction en en. Une chaîne absente du
// dictionnaire retombe sur le français — l'app ne casse jamais, elle
// redevient française par endroits (et on complète le dictionnaire).
// Le LEXIQUE (alloco, incognito, apéro…) ne se traduit pas : c'est la
// marque. Il se GLOSE : chaque mot a son explication dans les deux langues.
// ════════════════════════════════════════════════════════════════

export type Langue = 'fr' | 'en'

const CLE = 'jeudi-langue'

export function lireLangue(): Langue {
  try {
    const v = localStorage.getItem(CLE)
    if (v === 'fr' || v === 'en') return v
    // premier passage : la langue du téléphone décide (fr par défaut)
    return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
  } catch {
    return 'fr'
  }
}

export function ecrireLangue(l: Langue): void {
  try {
    localStorage.setItem(CLE, l)
  } catch {
    /* navigation privée : le choix vivra le temps de la session */
  }
}

/** bascule + rechargement : plus simple et plus sûr qu'un re-render global,
 *  et la langue est un geste rare (une fois, au premier soir) */
export function basculerLangue(): void {
  ecrireLangue(lireLangue() === 'fr' ? 'en' : 'fr')
  window.location.reload()
}

// ── le dictionnaire anglais — la voix de jeudi, pas du Google Translate ──
const EN: Record<string, string> = {
  // Auth — l'écran d'entrée
  'je dis où.': 'I say where.',
  'continuer avec Google': 'continue with Google',
  'ou par mail': 'or by email',
  'ton@mail.fr': 'your@mail.com',
  'reçois ton lien': 'get your link',
  'on envoie…': 'sending…',
  'regarde tes mails.': 'check your inbox.',
  'un lien t’attend à': 'a link is waiting at',
  'pas reçu ? renvoyer': 'nothing? send again',
  'trop d’essais d’un coup — réessaie dans quelques minutes.': 'too many tries at once — try again in a few minutes.',
  'cette adresse mail a l’air bancale — vérifie-la.': 'that email looks off — double-check it.',
  'pas de réseau — réessaie quand ça capte.': 'no network — try again when you have signal.',
  'la connexion Google n’a pas abouti — réessaie.': 'Google sign-in didn’t go through — try again.',
  'ça n’a pas marché. réessaie — ou passe par l’autre porte.': 'that didn’t work. try again — or take the other door.',

  // Onboarding
  'on te situe ?': 'can we place you?',
  'pour te dire ce qui se passe autour de toi.': 'so we can tell you what’s happening around you.',
  'd’accord, situe-moi.': 'sure, place me.',
  'un instant…': 'one moment…',
  'plus tard': 'later',
  'ça dit quoi ce soir ?': 'what’s the word tonight?',
  'pas de GPS ? on te montre le centre.': 'no GPS? we’ll show you the center.',
  'voilà ce que le carnet sait déjà.': 'that’s what the notebook already knows.',
  'le carnet se remplit encore. reviens ce soir — il aura des adresses pour toi.': 'the notebook is still filling up. come back tonight — it’ll have addresses for you.',
  'continuer →': 'continue →',
  'passer': 'skip',
  'montre-moi →': 'show me →',
  'tiens, mon carnet des soirs.\nje te montre mes trois coins ?\n— j.': 'here, my notebook of nights.\nshall I show you my three spots?\n— j.',
  'ici, c’est un pote qui te parle. pas 4 000 inconnus.': 'here, it’s a friend talking. not 4,000 strangers.',
  'à droite si ça te tente, à gauche on oublie. essaie.': 'right if you’re tempted, left and we forget it. try.',
  'des tips, jamais des avis. la nuance est tout.': 'tips, never reviews. the nuance is everything.',
  '← précédent': '← previous',
  'suivant →': 'next →',
  'j’ai pigé →': 'got it →',
  '← on oublie': '← we forget it',
  'ça te tente →': 'tempted →',
  'c’est ton carnet maintenant. t’es qui ?': 'it’s your notebook now. who are you?',
  'ton prénom': 'your first name',
  'comment on t’appelle ?': 'what do people call you?',
  'ta tête ici': 'your face here',
  'ta photo — ton cercle te reconnaît': 'your photo — your circle recognizes you',
  'c’est toi ? parfait.': 'that’s you? perfect.',
  'ta date de naissance': 'your date of birth',
  '(si tu veux)': '(if you like)',
  'j’ai 18 ans ou plus': 'I’m 18 or older',
  'c’est parti.': 'let’s go.',
  'tes adresses dorment dans Google Maps ?': 'are your addresses asleep in Google Maps?',
  'récupère-les en 3 étapes — ton carnet démarre plein, pas vide.': 'get them back in 3 steps — your notebook starts full, not empty.',
  'plus tard — je commence à la main': 'later — I’ll start by hand',

  // Import Google (composant partagé)
  'récupérer mes adresses Google': 'get my Google addresses back',
  'récupère tes adresses Google': 'get your Google addresses back',
  'replier': 'fold away',
  'va sur': 'go to',
  'coche seulement « Saved » (tes lieux enregistrés), exporte, télécharge le .zip, ouvre-le → tu y trouves « Saved Places.json »': 'tick only “Saved” (your saved places), export, download the .zip, open it → you’ll find “Saved Places.json”',
  'dépose ce fichier ici :': 'drop that file here:',
  'déposer « Saved Places.json »': 'drop “Saved Places.json”',
  'je lis ton carnet Google…': 'reading your Google notebook…',
  'aucune nouvelle adresse (déjà dans ton carnet ?).': 'no new addresses (already in your notebook?).',

  // Navigation + topbar
  'ce soir': 'tonight',
  'trouver': 'find',
  'ma carte': 'my map',
  'le cercle': 'the circle',
  'moi': 'me',
  'index': 'index',
  'carte': 'map',

  // Trouver (recherche)
  'trouver.': 'find.',
  'dis ce que tu cherches, jeudi répond': 'say what you’re after, jeudi answers',
  'un nom, un quartier, une ambiance…': 'a name, a neighborhood, a mood…',
  'ouvert': 'open',
  "sur l'eau": 'on the water',
  'quand': 'when',
  'maintenant': 'now',
  'demain soir': 'tomorrow night',
  'à l’heure près': 'down to the hour',
  'aujourd’hui': 'today',
  'demain': 'tomorrow',
  'autour de': 'around',
  'ici': 'here',
  '…ou une adresse / un métro (Entrée)': '…or an address / a metro stop (Enter)',
  'la ville en un coup d\'œil': 'the city at a glance',
  'déplier': 'unfold',

  // Recherche d'amis
  'retrouve quelqu’un — tape son prénom': 'find someone — type their first name',
  'on cherche…': 'searching…',
  'personne à ce prénom — envoie-lui plutôt ton lien d’invitation.': 'nobody by that name — send them your invite link instead.',
  'dans ton cercle': 'in your circle',
  'demandé ✓': 'requested ✓',
  'demander': 'request',

  // Guide d'installation
  'mets jeudi sur ton écran d’accueil →': 'put jeudi on your home screen →',
  'ouvre ce site dans Safari (pas Chrome)': 'open this site in Safari (not Chrome)',
  'tape le bouton partager (le carré avec la flèche, en bas)': 'tap the share button (the square with the arrow, at the bottom)',
  'choisis « Sur l’écran d’accueil » — et voilà, jeudi est une app': 'choose “Add to Home Screen” — and just like that, jeudi is an app',
  'ouvre le menu ⋮ du navigateur (en haut à droite)': 'open the browser menu ⋮ (top right)',
  'choisis « Ajouter à l’écran d’accueil » / « Installer l’application »': 'choose “Add to Home screen” / “Install app”',
  'confirme — et voilà, jeudi est une app': 'confirm — and just like that, jeudi is an app',
  'c’est fait (ou plus tard)': 'done (or later)',
  'confidentialité & conditions': 'privacy & terms',

  // Ce soir (le deck)
  'sage.': 'wise.',
  'à jeudi.': 'see you thursday.',
  'en vrai non, je sors': 'actually no, I’m going out',
  'je sais pas — surprends-moi': 'no idea — surprise me',
  'situation du portefeuille ?': 'how’s the wallet?',
  'grand soleil — on flambe': 'full sun — we splurge',
  'nuageux — ça va': 'cloudy — we’re fine',
  "pluie — c'est la merde": 'rain — things are rough',
  "t'es difficile ce soir.": 'you’re picky tonight.',
  "c'est tout ce que j'ai. reviens demain.": 'that’s all I’ve got. come back tomorrow.',
  'rien dans ta carte pour ça.': 'nothing in your map for that.',
  "capture des spots, ou élargis l'envie.": 'capture some spots, or widen the craving.',
  'pas encore de photo.': 'no photo yet.',
  '← bof · validé → · tap tip = autre voix': '← meh · approved → · tap tip = another voice',
  'bof': 'meh',
  'validé': 'approved',
  'avec qui ?': 'who with?',
  "l'envie du moment": 'the craving right now',

  // La fiche + le récap
  "m'y emmener": 'take me there',
  'envoie à un pote': 'send to a friend',
  'partager en story →': 'share as a story →',

  // Toasts / communs
  'nouvelle version.': 'new version.',
  'recharger': 'reload',
  'archivé.': 'archived.',
  'annuler': 'undo',
  'lien copié. envoie-le à ton pote.': 'link copied. send it to your friend.',
}

/** traduit une chaîne de la voix de jeudi. fr = la clé, en = le dictionnaire,
 *  absence = repli français (jamais de trou dans l'interface). */
export function t(fr: string): string {
  if (lireLangue() === 'fr') return fr
  return EN[fr] ?? fr
}

// ── le GLOSSAIRE du lexique : les mots ne se traduisent pas, ils s'expliquent.
// Servi par les gloses des chips (tap → une ligne) dans les deux langues.
export const GLOSSAIRE: Record<string, { fr: string; en: string }> = {
  'tranquilo': { fr: 'posé, sans pression', en: 'laid-back, no pressure' },
  'alloco': { fr: 'street-food, sur le pouce', en: 'street food, on the go' },
  'resto': { fr: 'on s’attable', en: 'a proper sit-down meal' },
  'gastro': { fr: 'la grande assiette', en: 'fine dining' },
  'incognito': { fr: 'bar caché, entre initiés', en: 'hidden bar, in the know' },
  'apéro': { fr: 'des verres, du monde', en: 'drinks with people around' },
  'alcolo': { fr: 'l’apéro après minuit', en: 'drinks, past-midnight edition' },
  'disco': { fr: 'on danse', en: 'dancing' },
  'dodo': { fr: 'on reste au lit', en: 'staying in bed' },
  'turbo': { fr: 'vite fait, bien fait', en: 'quick and good' },
  'solo': { fr: 'toi et toi-même', en: 'you and yourself' },
  'duo': { fr: 'à deux', en: 'the two of you' },
  'potos': { fr: 'la bande', en: 'the crew' },
  'pro': { fr: 'boulot, réseau', en: 'work things' },
}

/** la glose d'un mot du lexique dans la langue courante ('' si inconnu) */
export function glose(mot: string): string {
  const g = GLOSSAIRE[mot]
  if (!g) return ''
  return lireLangue() === 'fr' ? g.fr : g.en
}
