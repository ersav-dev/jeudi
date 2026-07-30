# PACK 3/3 — enrichissement spots jeudi (à coller dans ChatGPT/Gemini)

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
  "id": "nom:the-great-canadian-pub",
  "nom": "The Great Canadian Pub",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:the-bowler",
  "nom": "The Bowler",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:galway-irish-pub",
  "nom": "Galway Irish Pub",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:frog-xvi",
  "nom": "Frog XVI",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:the-hideout-paris-gare-nord",
  "nom": "The Hideout Paris Gare du Nord",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:the-coq-bulldog",
  "nom": "The Coq & Bulldog",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:corcoran-s-sacre-c-ur",
  "nom": "Corcoran's Sacré-Cœur",
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
  "id": "nom:nix-nox",
  "nom": "Nix Nox",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:bateau-el-alamein",
  "nom": "Bateau El Alamein",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:nautes",
  "nom": "Les Nautes",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:riviera-fuga",
  "nom": "Riviera Fuga",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:flow-paris",
  "nom": "Flow Paris",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:annette-k",
  "nom": "Annette K",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:plage-parisienne",
  "nom": "La Plage Parisienne",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:bateaux-parisiens",
  "nom": "Bateaux Parisiens",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:plat-form",
  "nom": "PLAT/FORM",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:aqua",
  "nom": "Brasserie Aqua",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:concorde-atlantique",
  "nom": "Concorde Atlantique",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:coquille",
  "nom": "La Coquille",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:duplex",
  "nom": "Duplex Bar",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:marius",
  "nom": "Chez Marius",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:pacifique",
  "nom": "Pacifique",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:celadon",
  "nom": "Restaurant Le Céladon",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:on",
  "nom": "On Restaurant",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:menekse",
  "nom": "Menekse",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:rosie",
  "nom": "Brasserie Rosie",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:poni",
  "nom": "Poni",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:godjo",
  "nom": "Restaurant Godjo",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:akrame",
  "nom": "Restaurant Akrame",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:tarantula-paris",
  "nom": "Tarántula Paris",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:the-hood-paris",
  "nom": "The Hood Paris",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:daroco-16",
  "nom": "DAROCO 16",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:chaumont",
  "nom": "Le Bar Chaumont",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:sushi-b",
  "nom": "Sushi-B",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:chimere",
  "nom": "Chimère",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:auberge",
  "nom": "L'Auberge Café",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:brique-machine-paris-2",
  "nom": "Brique Machine - Paris 2",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:atelier-veau",
  "nom": "Atelier du veau",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:general",
  "nom": "Le Général",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:pendino",
  "nom": "Pendino",
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
  "id": "nom:baan-issan",
  "nom": "Baan Issan",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:cheper",
  "nom": "Cheper",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:clark-hot-dog",
  "nom": "Clark Hot Dog",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:miznon-paris",
  "nom": "Miznon Paris",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:the-highlander-pub",
  "nom": "The Highlander Pub",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:maison-lautrec",
  "nom": "Maison Lautrec",
  "adresse": null,
  "quoi": "tarif+categories"
 },
 {
  "id": "nom:hemingway",
  "nom": "Bar Hemingway",
  "adresse": null,
  "quoi": "tarif+categories"
 }
]