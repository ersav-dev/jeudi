# PACK 2/3 — enrichissement spots jeudi (à coller dans ChatGPT/Gemini)

Tu es un assistant de données STRICT sur des lieux parisiens. Pour CHAQUE lieu ci-dessous,
renvoie un objet JSON. RÈGLES ABSOLUES :
- N'INVENTE RIEN. Si tu n'es pas sûr d'une info pour CE lieu précis : null.
- "tarif" : "€" (<10€ la conso/entrée), "€€" (10-25€), "€€€" (>25€), ou null.
- "horaires" : uniquement si tu CONNAIS ce lieu précis, au format
  {"lun":[18,26],"mar":[18,26],...} (26 = 2h du matin), sinon null. Dans le doute : null.
- "categories" : 1 à 3 parmi : apéro, resto, gastro, tranquilo, alloco, disco, incognito,
  turbo, culture, plein-air.
- "confiance" : 0 à 1 (ta certitude que tu connais VRAIMENT ce lieu, pas le type de lieu).
Réponds UNIQUEMENT le tableau JSON, sans commentaire, même ordre que la liste :

[
 {
  "id": "nom:diamant-bleu",
  "nom": "Le Diamant Bleu",
  "adresse": "36 Quai d’Austerlitz, 75013 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:the-office",
  "nom": "The Office",
  "adresse": "The Office, Rue Claude Bernard, Quartier du Val-de-Grâce",
  "quoi": "tout"
 },
 {
  "id": "nom:215-rue-paris",
  "nom": "215 Rue de Paris",
  "adresse": "Rue de Paris, Valmy, Paris 12e Arrondissement",
  "quoi": "tout"
 },
 {
  "id": "nom:happatei",
  "nom": "Happatei",
  "adresse": "Happa Teï, 64, Rue Sainte-Anne",
  "quoi": "tout"
 },
 {
  "id": "nom:404",
  "nom": "Le 404",
  "adresse": "Paris, Île-de-France, France métropolitaine",
  "quoi": "tout"
 },
 {
  "id": "nom:1905",
  "nom": "Le 1905",
  "adresse": "Paris, Île-de-France, France métropolitaine",
  "quoi": "tout"
 },
 {
  "id": "nom:4-soupes",
  "nom": "Les 4 soupes",
  "adresse": "Song Huong, Avenue de Choisy, Quartier de la Maison-Blanche",
  "quoi": "tout"
 },
 {
  "id": "nom:village",
  "nom": "Le Village",
  "adresse": "Le Village, 34-40, Rue Emeriau",
  "quoi": "tout"
 },
 {
  "id": "nom:fabula",
  "nom": "Fabula",
  "adresse": "Fabula, Rue de Charenton, Quartier des Quinze-Vingts",
  "quoi": "tout"
 },
 {
  "id": "nom:tout-paris",
  "nom": "Le Tout-Paris",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:terraza-mikuna",
  "nom": "Terraza Mikuna",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:terrasse-musee-d-orsay",
  "nom": "Terrasse du Musée d'Orsay",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:rooftop-hotel-fouquet-s-paris",
  "nom": "Le Rooftop - Hotel Fouquet's Paris",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:mun-paris",
  "nom": "Mun Paris",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:villa-m-rooftop",
  "nom": "Villa M Rooftop",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:suite-girafe",
  "nom": "La Suite Girafe",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:toit-terrasse-molitor",
  "nom": "Restaurant Toit Terrasse Molitor",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:a-bulles",
  "nom": "Bar a Bulles",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:coeur-sacre",
  "nom": "Coeur Sacre",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:station-m-by-maison-montmartre",
  "nom": "Station M by Maison Montmartre",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:no-entry",
  "nom": "No Entry",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:mezcaleria-paris",
  "nom": "La Mezcaleria Paris",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:experimental-cocktail-club",
  "nom": "Experimental Cocktail Club",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:danico",
  "nom": "Danico",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:nouveau",
  "nom": "Bar Nouveau",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:combat",
  "nom": "Combat",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:sister-midnight",
  "nom": "Sister Midnight",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:badaboum",
  "nom": "Badaboum",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:machine-moulin-rouge",
  "nom": "La Machine du Moulin Rouge",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:java",
  "nom": "La Java",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:virage-paris",
  "nom": "Virage Paris",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:cabaret-sauvage",
  "nom": "Cabaret Sauvage",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:petit-bain",
  "nom": "Petit Bain",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:glazart",
  "nom": "Glazart",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:nouveau-casino",
  "nom": "Nouveau Casino",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:panic-room",
  "nom": "Panic Room",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:silencio",
  "nom": "Silencio",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:marcounet",
  "nom": "Le Marcounet",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:pavillon-puebla",
  "nom": "Pavillon Puebla",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:cite-fertile",
  "nom": "La Cite Fertile",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:prairie-canal",
  "nom": "La Prairie du Canal",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:miznon",
  "nom": "Miznon",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:hakata-choten",
  "nom": "Hakata Choten",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:dumbo",
  "nom": "Dumbo",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:frenchie-a-vins",
  "nom": "Frenchie Bar a Vins",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:bambino",
  "nom": "Bambino",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:epicure",
  "nom": "Epicure",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:guy-savoy",
  "nom": "Guy Savoy",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:grand-rex-iconic-club",
  "nom": "Le Grand Rex - Iconic Club",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:virage-paris",
  "nom": "Virage Paris",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:cite-fertile",
  "nom": "La Cité Fertile",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:atelier-lumieres-hisense-stadium-experience",
  "nom": "Atelier des Lumières - Hisense Stadium Experience",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:belushi-s-gare-nord",
  "nom": "Belushi's Gare du Nord",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:belushi-s-paris-canal",
  "nom": "Belushi's Paris Canal",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:the-french-flair",
  "nom": "The French Flair",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:the-long-hop",
  "nom": "The Long Hop",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:team-brothers",
  "nom": "Team Brothers",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:fondamental-pigalle",
  "nom": "Le Bar Fondamental - Pigalle",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:hurling-pub",
  "nom": "Hurling Pub",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:patrick-s-ballon-vert",
  "nom": "Patrick's - Le Ballon Vert",
  "adresse": null,
  "quoi": "tarif+categories"
 }
]