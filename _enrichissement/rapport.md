# Enrichissement OSM — rapport 2026-07-11

- spots du seed : **306**
- matchés sur OSM : **237** (77 %)
  - dont avec HORAIRES réels : **137**
  - avec catégorie/amenity : **237**
  - avec site web : **147**
- non matchés : **69** → packs GPT

## Étape suivante (toi)
1. Ouvre `gpt_packs/pack_01.md` … (3 packs, 169 lieux), colle chacun dans ChatGPT/Gemini.
2. Sauve chaque réponse JSON dans `gpt_reponses/pack_NN.json` (même numéro).
3. Dis à Claude « fusionne l'enrichissement » — le script de fusion validera tout
   (les horaires OSM priment toujours sur les horaires GPT ; confiance < 0.5 = ignoré).

## Les 20 premiers non-matchés (contrôle visuel)
- ROOF Paris
- Sequoia Rooftop Bar
- The Shed
- Rooftop National
- Le Toit de la Tour
- Rooftop Bar Dame des Arts
- Kinugawa Rive Gauche
- FUGA R
- PLEY Rooftop
- Maggie Rooftop
- Perruche
- Khayma Rooftop
- Le Perchoir Ménilmontant
- Laho Rooftop
- TOO TacTac Skybar
- Skybar Paris Rooftop
- ILVOLO Bar Rooftop
- Brach Rooftop
- L'Oiseau Blanc
- Terrass'' Rooftop Bar
