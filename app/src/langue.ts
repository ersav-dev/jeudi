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
  'coche « Maps (vos adresses) » ET « Saved » (tes listes), exporte, télécharge le .zip': 'tick “Maps (your places)” AND “Saved” (your lists), export, download the .zip',
  'dépose le .zip entier ici — pas besoin de l’ouvrir :': 'drop the whole .zip here — no need to open it:',
  'déposer le .zip (ou .json / .csv)': 'drop the .zip (or .json / .csv)',
  'tes listes (Favoris, Envie d’y aller…) sont lues aussi — tu les rangeras en catégories juste après.':
    'your lists (Favorites, Want to go…) are read too — you’ll sort them into categories right after.',
  'rien de reconnu là-dedans — attendu : le .zip Takeout, « Saved Places.json » ou des listes .csv.':
    'nothing recognized in there — expected: the Takeout .zip, “Saved Places.json” or list .csv files.',
  'fichier illisible.': 'unreadable file.',
  'écarter': 'leave out',
  'reprendre': 'take back',
  'favoris': 'favorites',
  'les listes n’ont pas de coordonnées : on retrouve chaque adresse sur la carte (~1 s chacune).':
    'lists carry no coordinates: each address is found on the map (~1 s each).',
  'importer tout ça.': 'import all of it.',
  'on retrouve chaque adresse…': 'finding each address…',
  'chaque liste reste ton étiquette perso (privée) — les envies, elles, branchent le deck et les filtres.':
    'each list stays as your personal (private) label — the cravings are what power the deck and filters.',
  'tes étiquettes ? (privées)': 'your labels? (private)',
  '+ étiquette': '+ label',
  'retirer': 'remove',
  'étiquette :': 'label:',
  'toutes': 'all',
  'se déconnecter': 'sign out',
  'spots archivés': 'archived spots',
  'amis archivés': 'archived friends',
  'notifications': 'notifications',
  'mes listes': 'my lists',
  'restaurer': 'restore',
  'réintégrer': 'bring back',
  'aucun spot archivé.': 'no archived spots.',
  'aucun ami archivé.': 'no archived friends.',
  'rien à signaler — la cloche est calme.': 'nothing to report — the bell is quiet.',
  'favoris —': 'favorites —',
  'suivis —': 'following —',
  'aucun favori pour l’instant.': 'no favorites yet.',
  'archiver': 'archive',
  'la sortie attend ton verdict.': 'the night out awaits your verdict.',
  'veut rejoindre ton cercle (onglet cercle).': 'wants to join your circle (circle tab).',
  'c’est': 'it’s',
  'la Saint-Amour': 'Saint-Amour day',
  'emmène quelqu’un.': 'take someone.',
  'la fête de la musique': 'music day',
  'la ville joue — sors écouter.': 'the city’s playing — go listen.',
  'le Beaujolais nouveau': 'Beaujolais Nouveau',
  'il est arrivé — trinque.': 'it’s here — cheers.',
  'la Saint-Sylvestre': 'New Year’s Eve',
  'la dernière page de l’année.': 'the last page of the year.',
  'la pellicule': 'the film roll',
  'soirées': 'nights',
  '← → les photos · ↑ ↓ la nuit entière': '← → the photos · ↑ ↓ the whole night',
  'j’y vais.': 'I’m going.',
  'revenir à la carte': 'back to the map',
  'la ville se recharge — ce soir, c’est toi qui shootes.':
    'the city is recharging — tonight, you’re the one shooting.',
  // la grappe (§5.2) : un fait de lieu au crayon, jamais un badge chiffré
  'spots ici': 'spots here',
  // la ligne-boussole (§1.9) — elle nomme, elle ne compte pas des gens
  'tout est lu. à toi d’écrire la suite.': 'all read. your turn to write what’s next.',
  'a laissé quelque chose': 'left something',
  'un tirage que tu n’as pas vu': 'one print you haven’t seen',
  'tirages que tu n’as pas vus': 'prints you haven’t seen',
  'au nord': 'to the north',
  'au sud': 'to the south',
  'à l’est': 'to the east',
  'à l’ouest': 'to the west',
  deux: 'two',
  trois: 'three',
  quatre: 'four',
  cinq: 'five',
  six: 'six',
  sept: 'seven',
  huit: 'eight',
  neuf: 'nine',
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
  'quel jour ?': 'which day?',
  'à quelle heure ?': 'what time?',
  'je cherche…': 'searching…',
  'introuvable par ici. essaie plus précis.': 'nothing found around here. try to be more specific.',
  'pas de réseau on dirait. réessaie dans un instant.': 'looks like no network. try again in a moment.',
  'réponse': 'result',
  'réponses': 'results',
  'pour toi · tape ou choisis une envie pour chercher': 'for you · type or pick a craving to search',
  'rien sous la main. essaie une autre envie.': 'nothing on hand. try another craving.',
  'le grand jeudi': 'the big thursday',
  'dans': 'in',
  'jour': 'day',
  'jours': 'days',

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
  'je sais pas.': 'no idea.',
  'tire trois plans du carnet →': 'draw three plans from the notebook →',
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
  'encore debout ?': 'still up?',
  'et ça dit quoi, les potos ?': 'and what’s the word, potos?',
  'pour quoi faire ?': 'what for?',
  'trois plans tirés du carnet': 'three plans drawn from the notebook',
  'pas deux spots ouverts assez proches pour un plan. capture, ou reviens plus tard.':
    'not two open spots close enough for a plan. capture some, or come back later.',
  'celui-là. →': 'that one. →',
  're-tire': 'redraw',
  'en vrai, je choisis moi-même': 'actually, I’ll pick myself',
  'précédent': 'previous',
  'suivant': 'next',
  "c'est ça ↑": 'that’s it ↑',
  '← → changer · ↑ valider': '← → change · ↑ confirm',
  ' · ↓ revenir': ' · ↓ back',
  'VALIDÉ': 'APPROVED',
  'pas de photo.': 'no photo.',
  'la liste': 'the list',
  'en grand': 'full size',
  'validé ce soir': 'approved tonight',
  'validés ce soir': 'approved tonight',
  "rien validé — t'es dur": 'nothing approved — tough crowd.',
  'comparer les': 'compare the',
  'refais-moi le deck': 'reshuffle the deck',
  'bof — écarter': 'meh — drop',
  'validé — garder': 'approved — keep',

  // La fiche + le récap
  "m'y emmener": 'take me there',
  'envoie à un pote': 'send to a friend',
  'partager en story →': 'share as a story →',

  // La fiche lieu (audit 02/08 : le bilingue troué)
  'les tips': 'the tips',
  'ta place vit dans cet onglet — ne le ferme pas avant le verdict.': 'your seat lives in this tab — don’t close it before the verdict.',
  'en faire un vrai tip →': 'turn it into a real tip →',
  '— note d’import': '— imported note',
  "c'est pour quoi ?": 'what for?',
  'modifier les infos': 'edit the details',
  'capturé le': 'captured on',
  'déjà sur ta carte ✓': 'already on your map ✓',
  '+ ajouter à ma carte': '+ add to my map',
  'pour moi': 'just me',
  'cercle': 'circle',
  'public': 'public',
  // les 5 preuves photo
  'la porte': 'the door',
  'la salle': 'the room',
  'la terrasse': 'the terrace',
  'ton verre': 'your glass',
  'les wc': 'the toilets',
  'le verre · le plat': 'the glass · the plate',
  // la fiche lieu — le tour complet (08/08)
  "regarde où je t'emmène.": 'look where I’m taking you.',
  '— dit sur Jeudi.': '— said on Jeudi.',
  '← retour': '← back',
  'lieu précédent': 'previous place',
  'lieu suivant': 'next place',
  'le tableau →': 'the table →',
  'fermé': 'closed',
  'horaires': 'hours',
  'horaires inconnus': 'hours unknown',
  'spot complet — une photo et un mot': 'complete spot — a photo and a word',
  'agrandir la photo': 'expand the photo',
  'toi': 'you',
  'passé à côté': 'missed it',
  "pas encore de visage — c'est le spot de": 'no face yet — this is the spot of',
  'chez': 'at',
  'un spot de ton cercle': 'a spot from your circle',
  'propreté des wc': 'toilet cleanliness',
  'référence — recommandé par plusieurs': 'a favorite — recommended by several',
  'on y voit les matchs': 'matches shown here',
  'refuge anti-foot': 'football-free refuge',
  "t'as rien dit sur ce spot. encore.": 'you haven’t said anything about this spot. yet.',
  'pas encore renseigné': 'not filled in yet',
  'prendre la photo :': 'take the photo:',
  'propreté': 'cleanliness',
  'terminé': 'done',
  '— toi': '— you',
  'juge': 'judge',
  '/ pers.': '/ person',
  'démo': 'demo',

  // corriger une entrée du carnet (08/08) — le carnet se tient à la main
  'corriger': 'fix this',
  'le nom': 'the name',
  "l'adresse": 'the address',
  'ton tip': 'your tip',
  '12 rue de la Paix, 75002 Paris': '12 rue de la Paix, 75002 Paris',
  "c'est quoi, au juste ?": 'what is it, exactly?',
  'le tampon de douane': 'the customs stamp',
  'aucun': 'none',
  'où il en est': 'where it stands',
  'favori': 'favorite',
  'à tester': 'to try',
  'archivé': 'filed away',
  'rangé — il quitte le carnet dès que tu refermes la fiche.':
    'filed away — it leaves the notebook as soon as you close this page.',
  'le carnet lira :': 'the notebook will read:',
  'laisse tomber': 'never mind',
  'on corrige…': 'fixing…',
  "c'est corrigé.": 'fixed.',
  // « à la main » : la troisième voie de l'écran d'ajout (08/08)
  'ou écris-en un à la main →': 'or write one by hand →',
  'un spot, écrit à la main — le nom, où c’est, et ce que c’est.':
    'one spot, written by hand — the name, where it is, what it is.',
  'le nom du spot': 'the name of the spot',
  'l’adresse, ou la station la plus proche': 'the address, or the nearest station',
  'placer': 'place it',
  'rien trouvé par là. essaie l’adresse, ou la station la plus proche.':
    'nothing found there. try the address, or the nearest station.',
  'placé :': 'placed:',
  'on le note…': 'noting it down…',
  'dans mon carnet →': 'into my notebook →',
  'noté. il est privé — à toi de le publier.':
    'noted. it’s private — publishing it is up to you.',

  'arracher la page': 'tear out this page',
  'ses photos partent aussi — et ses clips. définitif, sans retour.':
    'its photos go too — and its clips. final, no way back.',
  'non, je la garde': 'no, I’m keeping it',
  'on arrache…': 'tearing…',
  'oui, arrache': 'yes, tear it out',
  'effacé ici — on finit le ménage au retour du réseau.':
    'gone from here — we’ll finish tidying when you’re back online.',

  // les heures d'ouverture (09/08) — le champ qui fait parler la carte
  'ça ouvre quand ?': 'when is it open?',
  'ouvre à': 'opens at',
  'ferme à': 'closes at',
  'heure d’ouverture': 'opening time',
  'heure de fermeture': 'closing time',
  'je sais pas': 'no idea',
  'minuit': 'midnight',
  '(après minuit)': '(after midnight)',
  'la carte le laissera en demi-encre : elle ne peut pas trancher.':
    'the map will leave it half-inked: it can’t tell either way.',
  'la carte saura l’encrer : plein quand c’est ouvert, pâle quand c’est fermé.':
    'the map will know how to ink it: full when open, pale when closed.',
  'sans heures, il restera en demi-encre sur la carte — ni ouvert, ni fermé.':
    'with no hours it stays half-inked on the map — neither open nor closed.',

  // rayer (09/08) — le seul signal négatif, et le plus cher
  'rayer — et le dire à ton cercle': 'cross it out — and tell your circle',
  'rayer, c’est un serment : il quitte ton carnet jeudi. jusque-là tu peux te dédire.':
    'crossing out is an oath: it leaves your notebook on Thursday. until then you can take it back.',
  'ça reste dans ton cercle, signé de ton nom. ça ne se compte jamais.':
    'it stays in your circle, signed with your name. it is never counted.',
  'trois quarts d’heure pour deux bières': 'forty-five minutes for two beers',
  'pourquoi ?': 'why?',
  'non, laisse': 'no, leave it',
  'on raye…': 'crossing out…',
  'oui, je raye': 'yes, cross it out',
  'rayé par': 'crossed out by',
  'il part jeudi.': 'it goes on Thursday.',
  'il part de ton carnet jeudi.': 'it leaves your notebook on Thursday.',
  'j’ai changé d’avis': 'I changed my mind',
  'on efface…': 'erasing…',

  // La carte de membre
  'partage ton carnet en story →': 'share your notebook as a story →',
  'ton lien d’invitation est copié — colle-le en sticker sur ta story.': 'your invite link is copied — paste it as a sticker on your story.',

  // La carte — le bottom-sheet, le panneau de marque, les tas (08/08)
  'marquer': 'mark',
  'ton émoji': 'your emoji',
  'retirer la marque': 'remove the mark',
  'ne plus comparer': 'stop comparing',
  'à comparer': 'to compare',
  'pas encore de mot sur ce lieu.': 'no word on this place yet.',
  'recommandé par': 'recommended by',
  'personne encore — à toi de jouer.': 'no one yet — your move.',
  'comparer': 'compare',
  'la plus récente se développe encore': 'the newest one is still developing',
  'la plus récente': 'the newest one',

  // Le croquis plein écran
  'agrandir le croquis': 'expand the sketch',
  'réduire le croquis': 'shrink the sketch',

  // L'album à trous + l'import « colle ta liste »
  'sa photo — prends-la ce soir': 'its photo — take it tonight',
  'ou colle une liste de noms →': 'or paste a list of names →',
  'un spot par ligne — depuis tes notes, un article, un message…': 'one spot per line — from your notes, an article, a message…',
  'retrouver ces spots →': 'find these spots →',
  'introuvable — vérifie l’orthographe': 'not found — check the spelling',
  'spots dans mon carnet →': 'spots into my notebook →',
  'spots ajoutés — ils sont privés, à toi de les publier.': 'spots added — they’re private, publishing is up to you.',

  // Le moment unifié (« quand ? » partout — le deck, le match)
  'ça dit quoi': 'what’s the word',
  'jeudi soir': 'thursday night',
  'au vote du match': 'on the match ballot',
  'est au vote.': 'is on the ballot.',
  'ce soir · 20h': 'tonight · 8pm',
  'jeudi · 20h': 'thursday · 8pm',
  'le carnet se règle sur': 'the notebook is set to',
  'avant le rendez-vous': 'before the meet-up',
  'spots au vote': 'spots on the ballot',
  'tape un spot pour l’écarter ou le reprendre': 'tap a spot to drop it or bring it back',
  'au vote': 'on the ballot',
  'écarté': 'dropped',
  'garde au moins deux spots — sinon il n’y a rien à voter.': 'keep at least two spots — otherwise there’s nothing to vote on.',

  // Le match de groupe (in-app + page publique /sortie/<token>)
  'sortir': 'go out',
  'on dit où.': 'we say where.',
  'on dit où ? vote ici :': 'we say where? vote here:',
  'le match — tes potes votent par un lien': 'the match — your friends vote through one link',
  'un vote vit': 'a vote is live',
  'reprendre le match →': 'back to the match →',
  'voir le verdict →': 'see the verdict →',
  'c’est dit.': 'said and done.',
  'vous décidez ensemble ? on dit où. →': 'deciding together? we say where. →',
  'voir ce que dit le carnet →': 'see what the notebook says →',
  'le carnet dit.': 'the notebook says.',
  'on oublie ce match': 'forget this match',
  'on rejoue →': 'rematch →',
  'ça se rejoue — revote ici →': 'it’s being replayed — revote here →',
  'recommencer': 'start over',
  'il pleut sur ton porte-monnaie.': 'it’s raining on your wallet.',
  'sortir à plusieurs.': 'going out together.',
  'tes potes votent par un lien — app ou pas, sans compte.': 'your friends vote through one link — app or not, no account.',
  "l'envie du groupe": 'the group’s craving',
  'ton départ': 'your starting point',
  'on vote jusqu’à quand ?': 'voting open until when?',
  'pas de limite': 'no time limit',
  'choisis au moins une envie — le groupe a besoin d’un cap.': 'pick at least one craving — the group needs a heading.',
  'voir la shortlist →': 'see the shortlist →',
  'la shortlist du carnet': 'the notebook’s shortlist',
  '← revoir': '← rethink',
  'lancer le vote →': 'open the vote →',
  'le verdict du groupe': 'the group’s verdict',
  'la fiche': 'the card',
  '↺ nouveau match': '↺ new match',
  'envoyer le lien aux potes →': 'send the link to your friends →',
  'lien copié. colle-le sur WhatsApp.': 'link copied. paste it on WhatsApp.',
  'on tranche →': 'call it →',
  'abandonner': 'abandon',
  'on se voit où ? vote ici :': 'where are we meeting? vote here:',
  'on ouvre le carnet…': 'opening the notebook…',
  'le vote est clos': 'the vote is closed',
  'le spot le mieux placé pour le groupe': 'the best-placed spot for the group',
  'ont voté': 'voted',
  'il reste': 'time left:',
  "l'itinéraire →": 'directions →',
  'personne n’a tranché — ce sera pour une prochaine.': 'nobody called it — next time, then.',
  'ce match, c’est jeudi.': 'this match runs on jeudi.',
  'tu viens de découvrir': 'you just discovered',
  'spots. garde-les dans ton propre carnet ?': 'spots. keep them in your own notebook?',
  'ouvrir mon carnet →': 'open my notebook →',
  'découvrir jeudi →': 'discover jeudi →',
  'vous propose.': 'has spots for you.',
  'on vous propose.': 'spots, proposed.',
  'spots · on vote le lieu': 'spots · we vote on the place',
  'du rendez-vous': 'from the meeting point',
  'je vote →': 'I vote →',
  'sans compte, promis.': 'no account, promise.',
  'ta réaction reste anonyme — le groupe ne voit que les totaux.': 'your reaction stays anonymous — the group only sees totals.',
  'la discussion, c’est sur WhatsApp. ici, on tranche.': 'the chat stays on WhatsApp. here, we decide.',
  // le langage de réactions (un tap, jamais un clavier)
  'chaud': 'in',
  'pourquoi pas': 'why not',
  'pas moi': 'not me',
  'trop cher': 'too pricey',
  'trop loin': 'too far',
  'juste boire': 'just drinks',
  // les candidats collaboratifs
  'toute ma carte': 'my whole map',
  'un nom, un quartier…': 'a name, a neighborhood…',
  '← retour au match': '← back to the match',
  '+ piocher dans toute ma carte': '+ pick from my whole map',
  '+ proposer un spot de ma carte': '+ put one of my spots on the ballot',
  'proposé par': 'proposed by',
  'voter avec le groupe →': 'vote with the group →',

  // les erreurs du match (affichées telles quelles via t())
  'connecte-toi d’abord pour lancer un match.': 'sign in first to start a match.',
  'le match n’a pas pu se lancer — réessaie.': 'the match couldn’t start — try again.',
  'les spots n’ont pas suivi — réessaie.': 'the spots didn’t follow — try again.',
  'le match est lancé mais sans toi — recharge.': 'the match started without you — reload.',
  'la clôture n’a pas pris — réessaie.': 'closing didn’t stick — try again.',
  'le match ne répond pas — vérifie ta connexion.': 'the match isn’t answering — check your connection.',
  'ce lien ne mène nulle part — redemande-le sur WhatsApp.': 'this link leads nowhere — ask for it again on WhatsApp.',
  'impossible de rejoindre — le vote est peut-être clos.': 'couldn’t join — the vote may be closed.',
  'impossible de rejoindre — réessaie.': 'couldn’t join — try again.',
  'le vote n’est pas parti — le match est peut-être clos.': 'the vote didn’t go through — the match may be closed.',
  'le match est plein — 12 spots max, on vote maintenant.': 'the match is full — 12 spots max, time to vote.',
  'le spot n’est pas parti — le vote est peut-être clos.': 'the spot didn’t go through — the vote may be closed.',

  // « et le tirage ? » — le geste photo du lendemain de sortie
  'et le tirage ?': 'and the print?',
  't’as forcément pris une photo, hier soir.': 'you took a photo last night, admit it.',
  'ouvrir ma pellicule': 'open my camera roll',
  'elle s’ouvre sur hier soir — tes photos les plus récentes sont en haut.':
    'it opens on last night — your most recent photos are up top.',
  'je n’ai rien pris.': 'I didn’t take any.',
  'finalement, non.': 'actually, no.',
  'on développe…': 'developing…',
  'n’ont pas pu être développés.': 'couldn’t be developed.',
  'tirage': 'print',
  'tirages': 'prints',
  'la nuit dernière.': 'last night.',
  'aucun n’est d’hier soir — à toi de voir.': 'none are from last night — your call.',
  'tape un tirage : c’est lui qui ira sur la carte · reste appuyé : l’écarter.':
    'tap a print: that’s the one going on the map · press and hold: drop it.',
  'sur la carte': 'on the map',
  'ne sont pas d’hier soir.': 'aren’t from last night.',
  'n’est pas d’hier soir.': 'isn’t from last night.',
  'jeudi les a reconnus à l’heure de prise de vue.': 'jeudi spotted them by their capture time.',
  'les garder': 'keep them',
  'les écarter': 'drop them',
  'ils sèchent une heure avant d’apparaître sur la carte du cercle.':
    'they dry for an hour before showing up on your circle’s map.',
  'ils restent dans ton carnet, sur ce téléphone.':
    'they stay in your notebook, on this phone.',
  'ni le lieu ni l’heure inscrits dans le fichier ne partent — seulement l’image.':
    'neither the location nor the time written in the file leaves — only the image.',
  'c’est dans la boîte.': 'that’s a wrap.',
  'aucun tirage': 'no prints',
  'le tirage du soir': 'the print of the night',

  // le super 8 — la bobine, la réglette, la chambre noire, le projecteur
  'une vidéo aussi : elle deviendra une bobine de 10 secondes.':
    'a video works too: it becomes a 10-second reel.',
  'la bobine': 'the reel',
  'bobine': 'reel',
  'on regarde ce qu’il y a dessus…': 'seeing what’s on it…',
  'quel est LE moment ?': 'which is THE moment?',
  'la cartouche fait 10 secondes — choisis les tiennes.':
    'the cartridge holds 10 seconds — pick yours.',
  'le début de la bobine': 'where the reel starts',
  'cette bobine.': 'this reel.',
  'la chambre noire': 'the darkroom',
  'règle ton rendu — tu pourras y revenir, rien n’est gravé.':
    'tune your look — you can come back, nothing is burned in.',
  'le grain': 'grain',
  'la vignette': 'vignette',
  'le tremblement': 'shake',
  'la teinte': 'tint',
  'couleur': 'color',
  'délavé': 'faded',
  'n&b': 'b&w',
  'sépia': 'sepia',
  'développer.': 'develop.',
  'ça se développe…': 'it’s developing…',
  'l’extrait est rejoué en entier — dix secondes de film, dix secondes de cuve.':
    'the excerpt replays in full — ten seconds of film, ten seconds in the bath.',
  'cette bobine résiste.': 'this reel won’t give in.',
  'le fichier n’a pas pu être développé — un format exotique, sans doute.':
    'the file couldn’t be developed — an exotic format, most likely.',
  'tant pis pour celle-là.': 'never mind that one.',
  'projeter': 'play',
  'projeter la bobine': 'play the reel',
  'mettre en pause': 'pause',
  'fermer': 'close',
  'le son': 'sound',
  'couper le son': 'mute',

  'signaler cette photo': 'report this photo',

  // la visionneuse : le switch couverture / photo entière
  'la couverture': 'the cover',
  'la photo entière': 'the full photo',

  // le rayon : le temps de trajet dit son mode
  'min à pied': 'min walk',
  'min à vélo': 'min by bike',
  'min en voiture': 'min by car',

  // le rayon : l'anneau élargi s'annonce
  'j’ai poussé jusqu’à': 'I stretched to',
  'c’est calme par ici.': 'it’s quiet around here.',

  // réglages — ton pas
  'ton pas': 'your pace',
  'flâneur': 'strolling',
  'normal': 'normal',
  'pressé': 'in a hurry',
  'ou précis :': 'or exactly:',
  'c’est le pas derrière tous les « min à pied » de l’app.':
    'this is the pace behind every “min walk” in the app.',

  // Profil — la page de garde, les critères, la vitrine (08/08)
  'ce carnet appartient à —': 'this notebook belongs to —',
  'ton portrait': 'your portrait',
  'changer': 'change',
  'ans': 'years old',
  'depuis': 'since',
  'spots': 'spots',
  'validés': 'approved',
  'super potes': 'top friends',
  'mes super potes': 'my top friends',
  'ont un visage': 'have a face',
  'mes infos': 'my info',
  'ton obsession': 'your obsession',
  'le bruit, la lumière, les chaises…': 'the noise, the light, the chairs…',
  'mes critères': 'my criteria',
  'ton critère': 'your criterion',
  'supprimer': 'delete',
  'un critère… (le bruit, les cocktails)': 'a criterion… (the noise, the cocktails)',
  'bascule le type': 'switch type',
  '●●○ gradué': '●●○ graded',
  'oui/non': 'yes/no',
  '+ ajouter': '+ add',
  'ajouter': 'add',
  'ta vitrine': 'your showcase',
  'ex. « le roi du dernier verre »': 'e.g. “the last-round king”',
  'ta bio — qui tu es, ce que tu cherches le soir…': 'your bio — who you are, what you’re after tonight…',
  'ton insta': 'your insta',
  'réglages': 'settings',
  'revient sur ta carte.': 'is back on your map.',
  "refaire l'accueil (le swipe, c'est ta langue ?)": 'redo onboarding (is the swipe your language?)',

  // Réglages — l'écran profil (bloc entier, 08/08)
  'tes réglages': 'your settings',
  'enregistré ✓': 'saved ✓',
  'où tu es': 'where you are',
  'tu es à': 'you’re at',
  'on cherche où tu es…': 'looking for where you are…',
  "jeudi te suit partout — les distances se calculent depuis ta position. autorise le GPS pour qu'elles soient justes (sinon : Place Vendôme).":
    'jeudi follows you everywhere — distances are worked out from where you are. allow GPS so they’re accurate (otherwise: Place Vendôme).',
  'ta couleur de Jeudi': 'your Jeudi color',
  'ton porte-monnaie (€ / pers.)': 'your wallet (€ / person)',
  'ça coûte rien <': 'costs nothing <',
  'on flambe >': 'we splurge >',
  'mes données': 'my data',
  'exporter mes spots (.json)': 'export my spots (.json)',
  'exporter mes données (.json)': 'export my data (.json)',
  'sûr ? tout effacer pour de bon': 'sure? erase it all for good',
  'effacer mes données locales': 'erase my local data',
  'suppression…': 'deleting…',
  'sûr ? tout part : le cloud aussi.': 'sure? everything goes — the cloud too.',
  'supprimer mon compte': 'delete my account',
  'le cloud a refusé. rien n’a bougé — réessaie dans un instant.':
    'the cloud said no. nothing moved — try again in a moment.',
  'bientôt': 'coming soon',
  'notifications push': 'push notifications',
  'relire les notes en marge': 'reread the margin notes',
  'aperçu du grand jeudi': 'preview the big thursday',

  // Toasts / communs
  'nouvelle version.': 'new version.',
  'forcer la mise à jour': 'force the update',
  'vide le cache des fichiers — tes lieux ne bougent pas':
    'clears the file cache — your places stay put',
  'recharger': 'reload',
  'archivé.': 'archived.',
  'annuler': 'undo',
  'lien copié. envoie-le à ton pote.': 'link copied. send it to your friend.',

  // les soirs du cercle (§7) — la pellicule lue humainement
  'les soirs du cercle': 'their nights out',
  'les soirs du cercle.': 'their nights out.',
  'ton cercle.': 'your circle.',
  'rien encore cette semaine. le premier soir sera le tien.':
    'nothing yet this week. the first night out will be yours.',
  // (« ce soir » et « validé » vivent déjà plus haut — pas de doublon)
  'hier soir': 'last night',
  'lundi': 'monday',
  'mardi': 'tuesday',
  'mercredi': 'wednesday',
  'jeudi': 'thursday',
  'vendredi': 'friday',
  'samedi': 'saturday',
  'dimanche': 'sunday',
  'j’y vais': 'i’m going',
  'garder ce tip': 'keep this tip',
  'on y retourne ?': 'go back?',
  'c’est tout. ton cercle est sorti': 'that’s all. your circle went out',
  'une fois cette semaine.': 'once this week.',
  'fois cette semaine.': 'times this week.',
  '— à toi d’écrire la suite.': '— your turn to write what’s next.',

  // l'écran validation (le post-deck, on valide/bof une sortie) — 08/08
  "l'autre soir": 'the other night',
  'alors,': 'so,',
  '← bof · je valide →  (ou les boutons)': '← meh · I approve →  (or the buttons)',
  'sûr ? re-tape.': 'sure? tap again.',
  'je valide': 'I approve',
  "j'y suis pas allé — oublie": "I didn't go — forget it",
  'redemande-moi plus tard': 'ask me again later',
  '← revenir au tirage': '← back to the print',
  'validé. raconte.': 'approved. tell me.',
  'ton tip pour réussir ce lieu — table du fond, demande Momo…':
    'your tip for nailing this place — back table, ask for Momo…',
  "tu l'as fait comment ?": 'how did you do it?',
  "tape : je l'ai fait comme ça (rouge) · reste appuyé : les conditions optimales, je recommande (orange).":
    'tap: I did it like this (red) · press and hold: the optimal conditions, I recommend (orange).',
  'pour quoi ?': 'what for?',
  // doublons d'apostrophe droite : mêmes mots que des clés déjà au
  // dictionnaire (apostrophe courbe), mais tels qu'écrits dans l'écran
  // validation — le fr ne bouge pas d'un caractère, donc deux clés.
  "c'est dit.": 'said and done.',
  '← corriger le récit': '← fix the story',
  'à toi de tamponner.': 'your turn to stamp it.',
  'tape où tu veux — même sur le blanc. chaque tape, un coup de tampon.':
    'tap anywhere — even on the blank. each tap, one stamp.',
  'tamponné.': 'stamped.',
  '3 clichés, 30 secondes —': '3 shots, 30 seconds —',
  'et le spot a un visage.': 'and the spot has a face.',
  "c'est dans la boîte.": 'that’s a wrap.',

  // les libellés dérivés de données, traduits AU SITE D'AFFICHAGE (les
  // données de db.ts ne bougent pas) : propreteWcLabel().mot, METEO_INFOS[].mot
  'à fuir': 'avoid',
  'correct': 'decent',
  'nickel': 'spotless',
  'on flambe': 'we splurge',
  'ça va': 'we’re fine',
  'ça coûte rien': 'costs nothing',

  // la bannière du grand jeudi (le 1ᵉʳ jeudi du mois)
  'ce soir, le voile tombe. toute la ville.': 'tonight, the veil falls. the whole city.',

  // le tampon de douane (typesLieu.ts, cuisineDeLieu().mot) — jamais un
  // drapeau émoji, un mot au crayon, traduit AU SITE D'AFFICHAGE (fiche,
  // carte, pickers) ; typesLieu.ts lui-même ne bouge pas.
  'italien': 'italian',
  'japonais': 'japanese',
  'chinois': 'chinese',
  'coréen': 'korean',
  'thaï': 'thai',
  'vietnamien': 'vietnamese',
  'indien': 'indian',
  'libanais': 'lebanese',
  'israélien': 'israeli',
  'turc': 'turkish',
  'grec': 'greek',
  'marocain': 'moroccan',
  'tunisien': 'tunisian',
  'africain': 'african',
  'éthiopien': 'ethiopian',
  'mexicain': 'mexican',
  'péruvien': 'peruvian',
  'brésilien': 'brazilian',
  'espagnol': 'spanish',
  'portugais': 'portuguese',
  'américain': 'american',

  // idem pour le type du lieu (labelTypeLieu), affiché en toutes lettres
  // sur la fiche et les pickers — « resto » et « rapido » sont du LEXIQUE
  // (jamais traduits : pas d'entrée, repli fr automatique).
  'cave à vin': 'wine bar',
  'café': 'coffee shop',
  'salon de thé': 'tea room',
  'glacier': 'ice cream shop',
  'pâtisserie': 'pastry shop',
  'grande table': 'fine dining',
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
  'rapido': { fr: 'un resto qui va vite', en: 'a fast sit-down bite' },
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
