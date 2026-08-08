# Prompt de reprise — la forme de l'épingle de spot

*Colle tout ce qui suit dans une session fraîche. Autonome : il contient
l'état, les décisions déjà prises, les pièges rencontrés et la suite.*

---

Projet **jeudi** : `F:\ErsanMusa-com\Jeudi_App` (app React+Vite+PWA dans
`app/`, carte MapLibre dans `app/src/Carte.tsx`, backend Supabase).
Tout est commité et poussé sur `main`, en prod sur https://jeudi-seven.vercel.app

## Ce qu'on cherche

Remplacer le **cercle** de l'épingle de spot par un cercle dont le bas est
**très légèrement tiré vers le bas**, pour que la forme DÉSIGNE le point
exact au lieu d'être centrée dessus (aujourd'hui le rond est centré : le
lieu est « quelque part dessous », c'est l'ambiguïté qu'on lève).

Mots exacts d'Ersan, dans l'ordre où ils sont venus :
1. « on peut plutôt faire comme des gouttes d'eau… la racine pointe
   exactement l'endroit du spot… un vrai cercle sauf le bas, qui est un
   peu en pointe vers le bas »
2. « je veux que ça ressemble un max à un cercle… sauf la petite pointe en
   bas. la pointe peut être **douce** ! »
3. (capture Photoshop du pin « La REcyclerie ») « **c'est subtil** »
4. « **le logo à l'intérieur en grand** »

## Les quatre planches déjà faites (design/)

| fichier | ce qu'elle montre | verdict |
|---|---|---|
| `goutte_spot.html` | 3 gouttes, pointes 6→12 px | trop marqué |
| `goutte_spot_v2.html` | 6 gouttes, ouverture 8→26° | trop marqué, et rendu fil de fer |
| `forme_spot_v3.html` | 3 familles (goutte / bec / larme), **vrai rendu néon** | trop marqué |
| `forme_spot_v4.html` | **5 formes subtiles, 1,6 → 4,6 px**, cercle témoin en pointillés | ← LA BONNE PISTE, en attente du verdict d'Ersan |

## Ce qui a été compris (ne pas refaire les erreurs)

**Le réglage juste est contre-intuitif :** ouverture **LARGE** du cercle
(34° à 55°) + pointe **MINUSCULE** (1,6 à 4,6 px sur un pin de 30). Une
ouverture étroite avec une pointe longue donne un *bec* greffé, pas un bas
tiré — c'est ce que je faisais et c'était faux.

**La formule du raccord** (sinon il fait une bosse) :
```js
function tiree(r, phi, L, blunt){
  const p = phi*Math.PI/180
  const xJ = r*Math.sin(p), yJ = r*Math.cos(p), tip = r+L
  const t = (4/3)*Math.tan(p/2)*r*0.82   // continuité de courbure
  const c1x = xJ - t*Math.cos(p), c1y = yJ + t*Math.sin(p)
  const w = blunt, v = L*0.42
  return `M ${-xJ} ${yJ} A ${r} ${r} 0 1 1 ${xJ} ${yJ}
          C ${c1x} ${c1y}, ${w} ${tip-v}, 0 ${tip}
          C ${-w} ${tip-v}, ${-c1x} ${c1y}, ${-xJ} ${yJ} Z`
}
```
Les cinq de la v4 : S1 φ55° L1,6 · S2 φ50° L2,2 · S3 φ45° L3 ·
S4 φ40° L3,8 · S5 φ34° L4,6 (blunt 3,4 → 2,6).

**LE BUG À CORRIGER EN PREMIER (demande n°4 d'Ersan) :** dans les planches
le glyphe est à `width:50%` alors que **l'app le met à `85%`**
(`.pin-type svg` dans `index.css`). Toutes les planches sous-représentent
donc le logo. **Refaire la v4 avec le glyphe à 85 %** avant toute autre
chose — c'est peut-être ce qui manquait pour trancher.

**Une planche ne doit contenir AUCUN JavaScript.** Selon la façon dont le
fichier s'ouvre chez Ersan, les scripts ne tournent pas et il ne voit que
des cadres vides (ça s'est produit). Calculer les chemins avec un script
node, puis écrire le SVG en dur dans le HTML.

**Le vrai rendu à reproduire sur les planches** (sinon la comparaison avec
sa capture est injuste) : anneau `#628ef3` de 2 px, lueur
`rgba(69,153,232,.6)` floutée 4 px en dessous, fond `rgba(18,20,26,.82)`,
glyphe cyan `#33a7ff` avec `drop-shadow(0 0 5px)`, label du nom en
JetBrains Mono 11 px sur `rgba(20,18,14,.78)`.

## La suite, dans l'ordre

1. **Refaire `forme_spot_v4.html` avec le glyphe à 85 %** (+ éventuellement
   descendre sous 1,6 px si Ersan trouve S1 encore trop marqué).
2. Ersan tranche : une forme parmi S1–S5, et répond aux deux questions
   ouvertes de la planche — *la lueur suit-elle la pointe ou reste-t-elle
   ronde derrière ?* et *le tampon douane reste-t-il en bas-droite ?*
3. **Coder** dans l'app :
   - `Carte.tsx` : le pin devient un SVG (aujourd'hui c'est une div ronde
     avec `border-radius:50%` — voir `.pin` dans `index.css`) ;
   - **l'ancrage passe du centre à la pointe** (`maplibregl.Marker`
     `anchor:'bottom'`) — c'est tout l'intérêt de la forme ;
   - garder les variables d'atelier `--pin-*` réglées par Ersan (ne pas y
     toucher sans demander) ;
   - vérifier les états : `.pin-allume` (plan « je sais pas », contour rose
     `#cf597c`), `.pin-actif`, `.pin-grise`, `.pin-curateur`, le tampon
     douane `.pin-douane`, le label `.pin::before`, la hitbox `.pin::after`
     (44 px), les grappes/éventails de la pellicule ;
   - `npx tsc -b --noEmit`, `npx vitest run`, `npx vite build` verts ;
     commit en français dans la voix du carnet ; déployer sur son go.

## Contexte utile

- Palette « je sais pas » (validée) : plan 1 `#597ccf` · 2 `#cf597c` ·
  3 `#7ccf59`, **au contour jamais au fond**.
- Couleurs de lignes : table officielle dans
  `design/palette_lignes_officielle.md`.
- L'état des lieux complet : `ETAT_2026-08-08.md`.
- Conventions : français partout (code et commentaires), diffs ciblés,
  jamais `git add -A`, migrations jamais appliquées (Ersan les colle).
