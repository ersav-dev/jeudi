# Reprise — la forme de l'épingle de spot

*Colle tout ce qui suit dans une session fraîche. Autonome.*
*Écrit le 9 août 2026 après SEPT planches qui n'ont pas convaincu Ersan.*

---

Projet **jeudi** : `F:\ErsanMusa-com\Jeudi_App` (React+Vite+PWA dans `app/`,
carte MapLibre dans `app/src/Carte.tsx`). Tout est commité, poussé sur
`main`, en prod sur https://jeudi-seven.vercel.app — **la forme du spot est
le SEUL chantier ouvert**, rien d'autre n'est en cours.

## ⚠️ Lis ça d'abord : sept planches ont échoué

Ersan a dit **« rien ne va ! »**. N'enchaîne pas une huitième variation du
même geste. Le problème n'est probablement pas le réglage — c'est la
méthode. Deux hypothèses à lui soumettre AVANT de dessiner quoi que ce
soit :

1. **La direction est peut-être mauvaise.** Il n'a jamais validé la
   prémisse « il faut une pointe ». Peut-être que le rond lui va très bien
   et que ce qui le gêne est ailleurs (la taille du pin ? le glow ? la
   densité ?). **Demande-lui ce qui, concrètement, le dérange quand il
   regarde sa carte** — pas quelle forme il veut.
2. **Le format des planches ne marche pas pour lui.** Sept fichiers HTML
   n'ont pas suffi. Propose autre chose : une image PNG unique, ou mieux —
   **coder la forme directement dans l'app en prod derrière un réglage**
   pour qu'il la voie sur son téléphone, dans la vraie vie, au lieu de
   juger des maquettes.

**Ne relance pas une planche sans son accord explicite.**

## Ce qui est demandé (ses mots, dans l'ordre)

1. « on peut plutôt faire comme des **gouttes d'eau**… la racine pointe
   exactement l'endroit du spot… un vrai cercle sauf le bas, un peu en
   pointe »
2. « que ça ressemble **un max à un cercle**… sauf la petite pointe en bas.
   la pointe peut être **douce** ! »
3. (capture du pin « La REcyclerie ») « **c'est subtil** »
4. « **le logo à l'intérieur en grand** » puis « **fais le glyphe aussi
   grand que ma capture puree** »
5. « et ensuite juste **le glyphe avec un point en dessous**… et ensuite le
   glyphe dans la goutte mais aux **proportions habituelles** »
6. « **rien ne va !** »

## L'objectif technique (lui, il tient)

Aujourd'hui le pin est un **rond centré** sur la position : le lieu est
« quelque part dessous ». Le but est que la forme **désigne** le point
exact. Ça implique, quelle que soit la forme retenue :
`maplibregl.Marker({ anchor: 'bottom' })` au lieu du centre.

## Les sept planches (design/) — toutes rejetées

| fichier | contenu |
|---|---|
| `goutte_spot.html` | 3 gouttes, pointes 6→12 px |
| `goutte_spot_v2.html` | 6 gouttes, ouverture 8→26° |
| `forme_spot_v3.html` | 3 familles (goutte / bec / larme), rendu néon |
| `forme_spot_v4.html` | 5 formes subtiles 1,6→4,6 px + cercle témoin |
| `glyphes_dix.html` | les 10 glyphes nus et dans le pin |
| `formes_trois_pistes.html` | rond / glyphe nu+point / goutte |
| `formes_sur_carte.html` | **les 4 formes sur de vraies tuiles Carto** ← la plus utile |

## Les trois bugs que j'ai commis (ne pas les refaire)

1. **Le glyphe était à moitié taille pendant six planches.** Je calculais
   la hauteur de boîte comme `corps + 2·PAD` alors que le corps fait **2R**
   (le diamètre), pas R. Le glyphe sortait à ~13 px là où l'app le met à
   25,5. **Géométrie juste** : `H = 2R + L + 2·PAD`, boîte du glyphe de
   `top:PAD` à `bottom:L+PAD` (hauteur 2R).
2. **Une planche avec du JavaScript ne s'affiche pas chez lui** — il ne
   voit que des cadres vides. Calculer les chemins avec node, écrire le SVG
   **en dur** dans le HTML. Zéro `<script>`.
3. **Rendu fil de fer au lieu du rendu réel.** Reproduire exactement :
   anneau `#628ef3` 2 px · lueur `rgba(69,153,232,.6)` floutée 4 px dessous ·
   fond `rgba(18,20,26,.82)` · glyphe `#33a7ff` avec
   `drop-shadow(0 0 5px)` · label JetBrains Mono 11 px sur `rgba(20,18,14,.78)`.

## La formule du raccord (si une pointe revient sur la table)

```js
// ouverture LARGE (40-55°) + pointe MINUSCULE (2-4 px) = subtil
// ouverture étroite + pointe longue = un bec greffé (rejeté)
function tiree(r, phi, L, blunt){
  const p = phi*Math.PI/180
  const xJ = r*Math.sin(p), yJ = r*Math.cos(p), tip = r+L
  const t = (4/3)*Math.tan(p/2)*r*0.82   // continuité de courbure, sinon bosse
  const c1x = xJ - t*Math.cos(p), c1y = yJ + t*Math.sin(p)
  const w = blunt, v = L*0.42
  return `M ${-xJ} ${yJ} A ${r} ${r} 0 1 1 ${xJ} ${yJ}
          C ${c1x} ${c1y}, ${w} ${tip-v}, 0 ${tip}
          C ${-w} ${tip-v}, ${-c1x} ${c1y}, ${-xJ} ${yJ} Z`
}
```

## Où vit le pin dans le code

- `app/src/index.css` : `.pin` (div ronde, `border-radius:50%`,
  variables `--pin-taille:30px --pin-fond --pin-contour:#628ef3
  --pin-contour-ep:2px --pin-glow --pin-glow-blur:16px --pin-glyphe:#33a7ff`
  — **réglées par Ersan à l'atelier, ne pas y toucher sans demander**),
  `.pin-type` (le glyphe, `svg` à 85 %), `.pin::before` (label du nom),
  `.pin::after` (hitbox 44 px), `.pin-allume` `.pin-actif` `.pin-grise`
  `.pin-curateur` `.pin-douane`.
- `app/src/Carte.tsx` : construction du pin, `maplibregl.Marker`.
- `app/src/typesLieu.ts` : `TRAITS` (les 10 glyphes) + `svgTypeLieu()`.
- Passer en SVG = refaire ces états un par un, plus les grappes/éventails
  de la pellicule.

## Conventions du projet

Français partout (code et commentaires, voix du carnet) · diffs ciblés,
jamais réécrire un fichier entier · jamais `git add -A` · toute chaîne UI
en `t('…')` + entrée EN dans `langue.ts` (le lexique alloco/apéro/resto…
ne se traduit JAMAIS) · `npx tsc -b --noEmit`, `npx vitest run`,
`npx vite build` verts avant commit · migrations SQL jamais appliquées
(Ersan les colle) · déploiement `vercel --prod` dans `app/`, sur son go.

## Contexte : ce qui est déjà en prod (ne pas y toucher)

Transports complets sur la carte (plaques stations, lignes aux couleurs
IDFM officielles, bouches numérotées avec sens d'accès) · recherche locale
des 581 stations + 8 monuments + 25 points de rendez-vous · vignettes
carnet des monuments · app bilingue · cycle de vie du lieu · « je sais
pas » en palette B. L'état complet : `ETAT_2026-08-08.md`.

## Ce qui attend Ersan (hors ce chantier)

Coller `_enrichissement/fusion_2026-08-08.sql` · la clé Google Places ·
le test au pouce de la carte · le chantier **push** (`CHANTIER_PUSH.md`).
