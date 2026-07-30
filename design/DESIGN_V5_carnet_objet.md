# DESIGN V5 — « L'OBJET, PAS L'ÉCRAN »
### La direction pour sortir jeudi. au niveau Awwwards — sans IA slop

> V4 (« Carnet de Nuit ») a posé la bonne âme : encre ivoire, charbon, tampon, tips manuscrits.
> Le problème n'est pas l'âme, c'est l'exécution : aujourd'hui c'est un **thème sombre avec des
> cartes arrondies** — c'est-à-dire ce que produit n'importe quel générateur en 2026.
> La V5 ne change pas d'univers : elle le rend **physique**.

---

## 1. LE PRINCIPE UNIQUE

**jeudi. n'est pas une interface qui imite un carnet. C'est un carnet qui se trouve être une app.**

Chaque décision passe ce filtre : *« est-ce qu'un bel objet papeterie ferait ça ? »*
- Un carnet n'a pas 4 rayons de coins différents. → **un seul** rayon, partout.
- Un carnet n'a pas d'ombres portées flottantes. → les éléments sont **posés**, pas flottants.
- L'encre ne « fade in » pas. → elle **se dépose** (apparition sèche, 120 ms, pas de fondu mou).
- Un tampon ne glisse pas : il **frappe** (scale 1.15→1 en 90 ms, une seule fois).
- On ne « scroll » pas un carnet, on le **feuillette** — les transitions d'écrans sont des
  tournes de page discrètes (translation + très légère rotation d'axe), jamais des slides iOS génériques.

## 2. LES RÉFÉRENCES (ce qu'on leur vole, pas ce qu'on copie)

| Référence | Ce qu'on prend |
|---|---|
| **iA Writer / Bear** | La typographie EST l'interface. Hiérarchie par la fonte, pas par des boîtes. |
| **Things 3** | La discipline : UN accent couleur, des blancs généreux, zéro décoration gratuite. |
| **(Not Boring) Apps** | Le culot des matières et du son/haptique — mais dosé : UNE signature par écran. |
| **Linear** | La physique du mouvement : easings custom, 150-250 ms, jamais de bounce mignon. |
| **Field Notes / Moleskine (le vrai monde)** | Le grain, la tranche, le coin corné, la cire — la matérialité crédible. |

## 3. ANTI-SLOP — LES INTERDITS ABSOLUS

1. ❌ Cartes glassmorphism / blur de fond / gradients violets
2. ❌ Textures kraft plaquées en fond plein écran (c'est le collage cheap → c'est le slop version papier)
3. ❌ Ombres portées « Figma default » (0 4px 12px rgba(0,0,0,.25)) partout
4. ❌ Coins arrondis 12-16px génériques sur tout ce qui bouge
5. ❌ Emojis, étoiles, badges, confettis, skeletons qui shimmer
6. ❌ Plus de 2 familles typo par écran, plus de 5 corps par écran
7. ❌ Animations > 300 ms ou avec rebond élastique

## 4. LA MATIÈRE (tokens)

```
PAPIER
--nuit:        #14120E   fond global — charbon chaud (pas noir)
--nuit-2:      #1B1813   la page posée sur la table (cartes, sheets)
--nuit-3:      #23201A   la page soulevée (états actifs, modales)
--grain:       urls data-uri bruit fin 2-3 % opacité — SUR --nuit uniquement,
               généré (SVG feTurbulence), jamais une photo de kraft

ENCRE
--encre:       #EFE9D8   le trait principal
--encre-2:     rgba(239,233,216,.62)  la note en marge
--encre-3:     rgba(239,233,216,.34)  le crayonné (méta, hints)
--cire:        #A8322A   L'UNIQUE accent. Tampons, sceaux, l'irréversible.
--graphite:    #8A857A   le crayon : tracés carte, séparateurs, filets

RÈGLE : --cire apparaît MAX 2 fois par écran. Si un écran en a 3, un des trois est faux.
```

**Le grain** : une seule couche de bruit SVG sur le fond global, opacité 2-3 %, `pointer-events:none`.
PAS de texture sur les cartes (elles héritent du papier par transparence perçue). C'est LA différence
entre « objet crédible » et « scrapbooking IA ».

**Les bords** : rayon unique `--rayon: 3px` (le coin d'une page massicotée, pas un galet).
Les éléments « posés » ont une ombre de CONTACT : `0 1px 0 rgba(0,0,0,.5)` — pas un halo.

## 5. LA TYPO (l'interface, littéralement)

```
Instrument Serif italic  → LA VOIX DU CARNET : titres, noms de lieux, phrases d'accueil
JetBrains Mono           → LA MACHINE À ÉCRIRE : méta, distances, heures, compteurs, étiquettes
Caveat                   → LA MAIN : tips, notes en marge, « — j. » — RÉSERVÉE à ce qui est
                           écrit par un humain (jamais un label système en Caveat = règle d'or)

Échelle (mobile) : 34 / 21 / 17 / 13 / 11 — cinq corps, pas un de plus.
Interlignage serré sur les titres (1.02), généreux sur la lecture (1.5).
Les chiffres (distances, heures) TOUJOURS en mono tabulaire — un carnet de sorties
vit par ses chiffres, ils doivent tomber droit.
```

## 6. LE MOUVEMENT (la physique du papier)

```
--pose:    cubic-bezier(0.2, 0.8, 0.2, 1)   150 ms — tout ce qui apparaît/se range
--frappe:  cubic-bezier(0.6, 0, 0.4, 1)      90 ms — tampons, validations (scale 1.15→1)
--tourne:  cubic-bezier(0.4, 0, 0.1, 1)     240 ms — changements d'onglet (translateX 12px + rotateY 1.5deg, origine tranche gauche)
```

**Les 5 signatures** (une par moment-clé, RIEN d'autre n'est animé de façon voyante) :
1. **Le tampon frappe** — validation d'une sortie, « c'est dit. » : frappe + 1 frame de décalage d'encre
2. **Le polaroïd se développe** — photo ajoutée : du charbon vers l'image, 400 ms
3. **Le trait se tire** — l'underline de l'onglet actif se DESSINE (scaleX origine gauche, 180 ms)
4. **La page tourne** — navigation entre onglets (--tourne, discret)
5. **La cire coule** — Grand Jeudi / super pote : le sceau apparaît par un scale radial 240 ms

Swipe du deck : la carte suit le doigt avec une rotation d'origine BASSE (comme une carte
tenue par le coin), et à la libération elle **part comme une carte jetée** (vitesse héritée du geste).

## 7. ÉCRAN PAR ÉCRAN (l'essentiel)

- **Splash** : rien que le tampon `Jeudi.` qui FRAPPE (une fois), le grain, et « je dis où. »
  qui se dépose. 1,8 s max — un bel objet ne fait pas attendre.
- **Ce soir (deck)** : la carte = une page. Photo pleine largeur en haut (coins 3px),
  nom en serif 34 italique, méta mono en une seule ligne crayonnée. Le tip du pote en Caveat
  sur UNE ligne de marge — pas dans une bulle.
- **Fiche (bottom-sheet)** : la poignée = un coin corné (pseudo-élément), pas une barre grise iOS.
  Pages du sheet = feuilletage avec le trait qui se tire.
- **Carte** : les contrôles zoom/boussole en style « instruments » mono. Le bottom-sheet
  carte suit la fiche. Les pins gardent leur langage encre actuel (déjà bon).
- **Cercle** : les membres = une liste d'« ex-libris » : initiale au tampon graphite, prénom serif,
  critère en mono. Le super pote : le sceau de cire discret à droite (pas un badge pastille).
- **Profil** : la page de garde du carnet. « Ce carnet appartient à — » en tête (serif italic),
  le prénom manuscrit par-dessus une ligne pointillée.
- **Réglages** : le colophon. Tout en mono 13, filets graphite, zéro carte.

## 8. CE QU'ON GARDE DE L'EXISTANT

Les pins carte (langage encre déjà juste) · les pastilles ●●○ (WC + critères validés) ·
les notes en marge du tuto (elles SONT la V5 avant l'heure) · l'album à trous ·
le lexique et tous les textes · la structure de navigation 5 onglets.

## 9. EXÉCUTION (ordre, avec backup avant chaque bloc)

1. **Socle** : tokens + grain + rayon + ombres contact + échelle typo (index.css, global)
2. **Mouvement** : les 3 easings + les 5 signatures + tournes de page
3. **Écrans un à un** : splash → deck → fiche → carte(chrome) → cercle → profil → réglages
4. **Chasse au slop** : passe finale qui supprime tout ce qui viole la section 3
5. Chaque bloc : tsc + tests + build verts, commit, vérif visuelle avant le suivant

*La V4 reste en backup + git. app_designALT (collage papier) reste une expérience à part —
la V5 est plus sobre : la matière dans le FOND et les MOMENTS, pas collée sur chaque carte.*
