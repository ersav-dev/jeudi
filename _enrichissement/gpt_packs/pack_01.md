# PACK 1/3 — enrichissement spots jeudi (à coller dans ChatGPT/Gemini)

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
  "id": "nom:roof-paris",
  "nom": "ROOF Paris",
  "adresse": "43 Rue Étienne Marcel, 75001 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:sequoia-rooftop",
  "nom": "Sequoia Rooftop Bar",
  "adresse": "27-29 Bd des Capucines, 75002 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:the-shed",
  "nom": "The Shed",
  "adresse": "17 Bd Poissonnière, 75002 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:rooftop-national",
  "nom": "Rooftop National",
  "adresse": "243 Rue Saint-Martin, 75003 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:toit-tour",
  "nom": "Le Toit de la Tour",
  "adresse": "15 Quai de la Tournelle, 75005 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:rooftop-dame-arts",
  "nom": "Rooftop Bar Dame des Arts",
  "adresse": "4 Rue Danton, 75006 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:kinugawa-rive-gauche",
  "nom": "Kinugawa Rive Gauche",
  "adresse": "55 Av. de Saxe, 75007 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:fuga-r",
  "nom": "FUGA R",
  "adresse": "28 Rue de Monceau, 75008 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:pley-rooftop",
  "nom": "PLEY Rooftop",
  "adresse": "216 Rue du Faubourg Saint-Honoré, 75008 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:maggie-rooftop",
  "nom": "Maggie Rooftop",
  "adresse": "55 Bd Marguerite de Rochechouart, 75009 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:perruche",
  "nom": "Perruche",
  "adresse": "Printemps de l'Homme, 2 Rue du Havre, 9e étage, 75009 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:khayma-rooftop",
  "nom": "Khayma Rooftop",
  "adresse": "9-11 Place du Colonel Fabien, 75010 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:perchoir-menilmontant",
  "nom": "Le Perchoir Ménilmontant",
  "adresse": "14 Rue Camille Crespin du Gast, 75011 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:laho-rooftop",
  "nom": "Laho Rooftop",
  "adresse": "5-9 Rue Van Gogh, 75012 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:too-tactac-skybar",
  "nom": "TOO TacTac Skybar",
  "adresse": "65 Rue Bruneseau, 75013 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:skybar-paris-rooftop",
  "nom": "Skybar Paris Rooftop",
  "adresse": "19 Rue du Commandant René Mouchotte, 75014 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:ilvolo-rooftop",
  "nom": "ILVOLO Bar Rooftop",
  "adresse": "257 Rue de Vaugirard, 7e étage, 75015 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:brach-rooftop",
  "nom": "Brach Rooftop",
  "adresse": "1-7 Rue Jean Richepin, 75016 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:oiseau-blanc",
  "nom": "L'Oiseau Blanc",
  "adresse": "19 Av. Kléber, 75116 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:terrass-rooftop",
  "nom": "Terrass'' Rooftop Bar",
  "adresse": "12 Rue Joseph de Maistre, 75018 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:toit-bellevilloise",
  "nom": "Le Toit de La Bellevilloise",
  "adresse": "19-21 Rue Boyer, 75020 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:mama-shelter-paris-east-rooftop",
  "nom": "Mama Shelter Paris East Rooftop",
  "adresse": "109 Rue de Bagnolet, 75020 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:skyline-paris-lounge",
  "nom": "Skyline Paris Lounge & Bar",
  "adresse": "Hotel Meliá Paris La Défense, 4 Espl. du Général de Gaulle, 92400 Courbevoie",
  "quoi": "tout"
 },
 {
  "id": "nom:copperbay",
  "nom": "CopperBay",
  "adresse": "5 Rue Bouchardon, 75010 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:t7-paris",
  "nom": "T7 Paris",
  "adresse": "Pl. des Insurgés de Varsovie, 75015 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:fluctuart",
  "nom": "Fluctuart",
  "adresse": "2 Port du Gros Caillou, 75007 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:dame-canton",
  "nom": "La Dame de Canton",
  "adresse": "5 Port de la Gare, 75013 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:peniche-antipode",
  "nom": "Peniche Antipode",
  "adresse": "55 Quai de la Seine, 75019 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:bateau-phare",
  "nom": "Bateau Phare",
  "adresse": "3 Port de la Gare, 75013 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:javelle",
  "nom": "La Javelle",
  "adresse": "5 Bd Poniatowski, 75012 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:jardin21",
  "nom": "Jardin21",
  "adresse": "12a Rue Ella Fitzgerald, 75019 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:plenitude",
  "nom": "Plenitude",
  "adresse": "8 Quai du Louvre, 75001 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:oiseau-blanc",
  "nom": "L'Oiseau Blanc",
  "adresse": "19 Av. Kleber, 75116 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:communale-saint-ouen",
  "nom": "La Communale Saint-Ouen",
  "adresse": "10 bis Rue de l'Hippodrome, 93400 Saint-Ouen-sur-Seine",
  "quoi": "tout"
 },
 {
  "id": "nom:jardin-menagerie-sceaux",
  "nom": "Jardin de la Ménagerie - Sceaux",
  "adresse": "70 Rue Houdan, 92330 Sceaux",
  "quoi": "tout"
 },
 {
  "id": "nom:central-chapelle",
  "nom": "Central Chapelle",
  "adresse": "4 Esplanade Alice Milliat, 75018 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:dopo-boulogne",
  "nom": "Dopo Boulogne",
  "adresse": "63-64 Quai Georges Gorse, 92100 Boulogne-Billancourt",
  "quoi": "tout"
 },
 {
  "id": "nom:sports-lounge-disney-village",
  "nom": "Sports Bar & Lounge Disney Village",
  "adresse": "2 Avenue Paul Séramy, 77700 Chessy",
  "quoi": "tout"
 },
 {
  "id": "nom:mcbride-s-irish-pub",
  "nom": "McBride's Irish Pub",
  "adresse": "54 Rue Saint-Denis, 75001 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:victoire",
  "nom": "La Victoire",
  "adresse": "11 Rue de Lappe, 75011 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:brussels-beer-project-canal",
  "nom": "Brussels Beer Project Canal",
  "adresse": "47 bis Rue Bichat, 75010 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:bateau-phare",
  "nom": "Le Bateau Phare",
  "adresse": "3 Port de la Gare, 75013 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:dame-canton",
  "nom": "La Dame de Canton",
  "adresse": "5 Port de la Gare, 75013 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:peniche-antipode",
  "nom": "Péniche Antipode",
  "adresse": "55 Quai de la Seine, 75019 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:nanna",
  "nom": "Nanna",
  "adresse": "Port de Montebello, 75005 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:noti-plage",
  "nom": "Noti Plage",
  "adresse": "6 Port de Suffren, 75015 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:bonnotte-club",
  "nom": "Bonnotte Club",
  "adresse": "Port de Suffren, 75007 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:bal-marine",
  "nom": "Bal de la Marine",
  "adresse": "Port de Suffren, 75007 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:calife",
  "nom": "Le Calife",
  "adresse": "Port des Saints-Pères, 75006 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:ducasse-sur-seine",
  "nom": "Ducasse sur Seine",
  "adresse": "19 Port Debilly, 75116 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:eiffel-croisieres-peniche-ivoire",
  "nom": "Eiffel Croisières - Péniche Ivoire",
  "adresse": "Pont Alexandre III, Port des Invalides rive gauche, 75007 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:instant-sur-seine-16e",
  "nom": "L’Instant sur Seine - 16e",
  "adresse": "2 Port Debilly, 75016 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:river-s-king",
  "nom": "River’s King",
  "adresse": "4 Quai Saint-Bernard, 75005 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:yachts-paris",
  "nom": "Yachts de Paris",
  "adresse": "Port Henri IV, 75004 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:javelle-tavern",
  "nom": "La Javelle Tavern",
  "adresse": "5 Boulevard Poniatowski, 75012 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:quai-sauvage",
  "nom": "Quai Sauvage",
  "adresse": "Port de Bercy, Quai de Bercy, 75012 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:jardin21",
  "nom": "Jardin21",
  "adresse": "12a Rue Ella Fitzgerald, 75019 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:barboteur",
  "nom": "Le Barboteur",
  "adresse": "6 Rue Raymond Queneau, 93000 Bobigny",
  "quoi": "tout"
 },
 {
  "id": "nom:vedettes-paris",
  "nom": "Vedettes de Paris",
  "adresse": "2 Port de Suffren, 75007 Paris",
  "quoi": "tout"
 },
 {
  "id": "nom:signac",
  "nom": "Le Signac",
  "adresse": "3 Port Debilly, 75016 Paris",
  "quoi": "tout"
 }
]