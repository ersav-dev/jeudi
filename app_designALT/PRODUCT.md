# PRODUCT.md — jeudi.

## Ce que c'est
PWA mobile-first pour sortir (seul ou accompagné). Question d'entrée : « ça dit quoi ce soir ? » → avec qui (solo·duo·potos·pro) × envie (lexique en -o) × météo du porte-monnaie → deck de 8 cartes swipables. Des tips, jamais des avis. Pas d'étoiles, pas de pub, aucun lieu ne paie.

## Register
product — l'app est un outil du quotidien (le juge de paix : « Ersan l'utiliserait-il à la place de Google Maps demain ? »). Mais la DA porte l'identité : elle est non négociable.

## Utilisateur
Ersan (fondateur, V1 perso) puis son cercle proche. Usage : le soir, dans la rue ou au bar, une main, écran ~390px. Ambiance sombre — d'où le thème nuit.

## DA « Carnet de Nuit » (NON NÉGOCIABLE — voir design/DESIGN_V4_carnet_de_nuit.md)
- Papier charbon #15130F, encre ivoire #F0EAD9, UN seul rouge cire #A8322A, orange reco #D9913B.
- Polaroids ivoire, tampons encreurs, écriture manuscrite (Caveat), mono (JetBrains Mono), serif (Instrument Serif).
- Émojis interdits dans le chrome UI (icônes encre SVG). Le mot « avis » n'existe pas.

## Écrans
splash (tampon 3,8s) · onboarding swipe · carnet (index + carte MapLibre) · « ce soir » (deck) · validation (verdict → raconte → mode tampon) · fiche lieu · capture 2s.

## Contraintes
Local-first (IndexedDB), zéro backend en V1, React+Vite+TS. Cible : iPhone Safari (PWA installée).
