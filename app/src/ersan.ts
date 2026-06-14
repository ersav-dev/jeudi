// Profil Ersan : sa collection réelle (Google Maps, géocodée). 81 lieux IDF.
// Champs bruts ; le mapping cuisine→envie et prix→portefeuille se fait dans seed.ts.
export interface SpotErsan { nom: string; note: string; lat: number; lng: number; adresse: string; prix: string; cuisine: string }
const ERSAN: SpotErsan[] = [
 {
  "nom": "The Office",
  "note": "A tester !!",
  "lat": 48.8391435,
  "lng": 2.3486007,
  "adresse": "The Office, Rue Claude Bernard, Quartier du Val-de-Grâce",
  "prix": "",
  "cuisine": "Restaurant"
 },
 {
  "nom": "215 Rue de Paris",
  "note": "Glace a tester",
  "lat": 48.8293133,
  "lng": 2.4015281,
  "adresse": "Rue de Paris, Valmy, Paris 12e Arrondissement",
  "prix": "",
  "cuisine": "93100 Montreuil"
 },
 {
  "nom": "Chez Michel",
  "note": "Super resto : François et Christophe",
  "lat": 48.8795704,
  "lng": 2.3522406,
  "adresse": "Chez Michel, Rue de Belzunce, Quartier Saint-Vincent-de-Paul",
  "prix": "40–80 €",
  "cuisine": "Française"
 },
 {
  "nom": "Abri Soba",
  "note": "À Tester",
  "lat": 48.875021,
  "lng": 2.3444958,
  "adresse": "Abri Soba, 10, Rue Saulnier",
  "prix": "20–30 €",
  "cuisine": "Restaurant de nouilles au sarrasin (soba)"
 },
 {
  "nom": "Happatei",
  "note": "Resto Lisa Théo",
  "lat": 48.8685831,
  "lng": 2.3366834,
  "adresse": "Happa Teï, 64, Rue Sainte-Anne",
  "prix": "20–30 €",
  "cuisine": "Japonaise"
 },
 {
  "nom": "Aki Café",
  "note": "Bon resto",
  "lat": 48.8687275,
  "lng": 2.3365482,
  "adresse": "Aki Café, 75, Rue Sainte-Anne",
  "prix": "10–20 €",
  "cuisine": "Japonaise"
 },
 {
  "nom": "La Coquille",
  "note": "",
  "lat": 48.8642141,
  "lng": 2.3417384,
  "adresse": "La coquille, Rue Coquillière, Quartier Les Halles",
  "prix": "10–20 €",
  "cuisine": "Bar"
 },
 {
  "nom": "Kehribar",
  "note": "A tester insta",
  "lat": 48.8460828,
  "lng": 2.3432882,
  "adresse": "Kehribar, Rue des Fossés Saint-Jacques, Quartier de la Sorbonne",
  "prix": "10–30 €",
  "cuisine": "Turque"
 },
 {
  "nom": "Mian Fan",
  "note": "A tester",
  "lat": 48.8716074,
  "lng": 2.3412011,
  "adresse": "Mian Fan, Boulevard Montmartre, Quartier Vivienne",
  "prix": "10–20 €",
  "cuisine": "Fusion asiatique"
 },
 {
  "nom": "Duplex Bar",
  "note": "Var gay a tester",
  "lat": 48.8624459,
  "lng": 2.3550899,
  "adresse": "Duplex, Rue Michel le Comte, Quartier Sainte-Avoye",
  "prix": "1–30 €",
  "cuisine": "Bar gay"
 },
 {
  "nom": "Vingt Vins d'Art",
  "note": "Reco xtof",
  "lat": 48.8552343,
  "lng": 2.3580088,
  "adresse": "Vingt Vins d'Art, Rue de Jouy, Quartier Saint-Gervais",
  "prix": "20–30 €",
  "cuisine": "Bistro"
 },
 {
  "nom": "Le Louchebem",
  "note": "",
  "lat": 48.8616443,
  "lng": 2.3443874,
  "adresse": "Le Louchébem, 31, Rue Berger",
  "prix": "20–60 €",
  "cuisine": "Française"
 },
 {
  "nom": "Chez Marius",
  "note": "Reco xtof",
  "lat": 48.8765271,
  "lng": 2.3549639,
  "adresse": "Chez Marius, Rue de Chabrol, Quartier de la Porte-Saint-Denis",
  "prix": "20–70 €",
  "cuisine": "Restaurant"
 },
 {
  "nom": "Restaurant À la maison",
  "note": "Resto reco Xtof",
  "lat": 48.8830175,
  "lng": 2.3184119,
  "adresse": "Nouilles ceintures, 99, Rue des Dames",
  "prix": "40–70 €",
  "cuisine": "Restaurant"
 },
 {
  "nom": "Pacifique",
  "note": "Resto chinois avevamos Bressuire",
  "lat": 48.873054,
  "lng": 2.3796868,
  "adresse": "Pacifique, Rue Rampal, Quartier du Combat",
  "prix": "20–30 €",
  "cuisine": "Chinoise"
 },
 {
  "nom": "Restaurant Le Céladon",
  "note": "Restaurant Corée chicos",
  "lat": 48.8696738,
  "lng": 2.3309961,
  "adresse": "Le Céladon, Rue Daunou, Quartier Gaillon",
  "prix": "50–90 €",
  "cuisine": "Française"
 },
 {
  "nom": "Orson",
  "note": "",
  "lat": 48.8536233,
  "lng": 2.3312702,
  "adresse": "Orson, Rue du Dragon, Quartier de Saint-Germain-des-Prés",
  "prix": "+ de 100 €",
  "cuisine": "Restaurant"
 },
 {
  "nom": "On Restaurant",
  "note": "",
  "lat": 48.8662857,
  "lng": 2.3327705,
  "adresse": "On, Rue Saint-Roch, Quartier Vendôme",
  "prix": "20–60 €",
  "cuisine": "Coréenne"
 },
 {
  "nom": "Menekse",
  "note": "Restaurant kurde",
  "lat": 48.8516114,
  "lng": 2.3778571,
  "adresse": "Menekse, 7, Passage de la Main d'Or",
  "prix": "20–30 €",
  "cuisine": "Restaurant"
 },
 {
  "nom": "Le Louis XVI",
  "note": "",
  "lat": 48.8732901,
  "lng": 2.3235381,
  "adresse": "Le Louis XVI, Rue des Mathurins, Quartier de la Madeleine",
  "prix": "",
  "cuisine": ""
 },
 {
  "nom": "Go Oun",
  "note": "Resto Charlotte",
  "lat": 48.8663515,
  "lng": 2.3353302,
  "adresse": "Go-Oun, 14, Rue Thérèse",
  "prix": "20–30 €",
  "cuisine": "Coréenne"
 },
 {
  "nom": "Brasserie Rosie",
  "note": "Rdv Dina",
  "lat": 48.8521994,
  "lng": 2.3730393,
  "adresse": "Rosie, 53, Rue du Faubourg Saint-Antoine",
  "prix": "20–30 €",
  "cuisine": "Brasserie"
 },
 {
  "nom": "JanTchi",
  "note": "Bobun Saint Anne",
  "lat": 48.8660361,
  "lng": 2.335991,
  "adresse": "Jantchi, Rue Thérèse, Quartier du Palais Royal",
  "prix": "20–30 €",
  "cuisine": "Coréenne"
 },
 {
  "nom": "Poni",
  "note": "Restaurant a tester",
  "lat": 48.8767991,
  "lng": 2.3369941,
  "adresse": "Poni, 24, Rue Saint-Lazare",
  "prix": "20–30 €",
  "cuisine": "Brasserie"
 },
 {
  "nom": "Le Hibou - Paris",
  "note": "",
  "lat": 48.8516588,
  "lng": 2.3385244,
  "adresse": "Le Hibou, 16, Rue de l'Odéon",
  "prix": "20–70 €",
  "cuisine": "Brasserie"
 },
 {
  "nom": "Pide Paris",
  "note": "",
  "lat": 48.8717766,
  "lng": 2.3539306,
  "adresse": "Pidè Paris, Rue du Faubourg Saint-Denis, Quartier de la Porte-Saint-Denis",
  "prix": "10–20 €",
  "cuisine": "Turque"
 },
 {
  "nom": "Hanoï Cà Phê Opéra",
  "note": "Cafe/ Resto sympa",
  "lat": 48.8714582,
  "lng": 2.3357136,
  "adresse": "Hanoi Cà Phê Opéra, Boulevard des Italiens, Quartier de la Chaussée-d'Antin",
  "prix": "20–30 €",
  "cuisine": "Vietnamienne"
 },
 {
  "nom": "Restaurant Godjo",
  "note": "",
  "lat": 48.8476363,
  "lng": 2.3480323,
  "adresse": "Godjo, 8, Rue de l'École Polytechnique",
  "prix": "20–30 €",
  "cuisine": "Éthiopienne"
 },
 {
  "nom": "Les Antiquaires",
  "note": "",
  "lat": 48.8587025,
  "lng": 2.3288305,
  "adresse": "Les Antiquaires, Rue de Lille, Quartier Saint-Thomas-d'Aquin",
  "prix": "30–80 €",
  "cuisine": "Bistro"
 },
 {
  "nom": "Restaurant Akrame",
  "note": "restaurant avec cheval dans l entree (Juliette)",
  "lat": 48.8714228,
  "lng": 2.3251829,
  "adresse": "Akrame, Rue Tronchet, Quartier de la Madeleine",
  "prix": "+ de 100 €",
  "cuisine": "Cuisine gastronomique"
 },
 {
  "nom": "MÛRE",
  "note": "Travail sur Paris",
  "lat": 48.8746195,
  "lng": 2.3386851,
  "adresse": "Mûre, 37, Rue La Fayette",
  "prix": "10–20 €",
  "cuisine": "Bio"
 },
 {
  "nom": "El Guacamole République",
  "note": "Guzcolmoleee",
  "lat": 48.8713675,
  "lng": 2.3621526,
  "adresse": "El Guacamole, 37, Rue Yves Toudic",
  "prix": "10–20 €",
  "cuisine": "Mexicaine"
 },
 {
  "nom": "Le Petit Cambodge",
  "note": "",
  "lat": 48.8738666,
  "lng": 2.3705269,
  "adresse": "Le petit Cambodge, 24, Avenue Claude Vellefaux",
  "prix": "20–30 €",
  "cuisine": "Cambodgienne"
 },
 {
  "nom": "Tarántula Paris",
  "note": "A tester absolutely",
  "lat": 48.8543271,
  "lng": 2.3760595,
  "adresse": "Tarántula, 13bis, Rue Keller",
  "prix": "40–80 €",
  "cuisine": "Restaurant"
 },
 {
  "nom": "Yo",
  "note": "Resto petit gastro fr/thai",
  "lat": 48.8696781,
  "lng": 2.3341013,
  "adresse": "Yo !, Rue de Port Mahon, Quartier Gaillon",
  "prix": "30–50 €",
  "cuisine": "Thaï"
 },
 {
  "nom": "No Scrum No Win - Bar Rugby",
  "note": "",
  "lat": 48.8776425,
  "lng": 2.3278674,
  "adresse": "No Scrum No Win - Bar Rugby, 32, Rue de Londres",
  "prix": "20–30 €",
  "cuisine": "Bar sportif"
 },
 {
  "nom": "La Renommée",
  "note": "A tester, paris 1900",
  "lat": 48.8612719,
  "lng": 2.343211,
  "adresse": "La Renommée, Rue Saint-Honoré, Quartier Les Halles",
  "prix": "+ de 100 €",
  "cuisine": "Française"
 },
 {
  "nom": "The Hood Paris",
  "note": "Singaporean restaurant",
  "lat": 48.833898,
  "lng": 2.3154421,
  "adresse": "the Hood, Rue de l'Ouest, Quartier de Plaisance",
  "prix": "20–30 €",
  "cuisine": "Café"
 },
 {
  "nom": "Express de Lyon",
  "note": "",
  "lat": 48.8459544,
  "lng": 2.3720667,
  "adresse": "Express de Lyon, Rue de Lyon, Quartier des Quinze-Vingts",
  "prix": "10–20 €",
  "cuisine": "Brasserie"
 },
 {
  "nom": "DAROCO 16",
  "note": "",
  "lat": 48.8515008,
  "lng": 2.2778254,
  "adresse": "Daroco 16, 3, Place Clément Ader",
  "prix": "",
  "cuisine": ""
 },
 {
  "nom": "Eunoé",
  "note": "Petit gastro proche du travail à tester",
  "lat": 48.8608257,
  "lng": 2.3789798,
  "adresse": "Eunoé, 6, Rue Rochebrune",
  "prix": "30–80 €",
  "cuisine": "Restaurant"
 },
 {
  "nom": "Le Bar Chaumont",
  "note": "A tester",
  "lat": 48.866209,
  "lng": 2.344963,
  "adresse": "Le Bar Chaumont, 18, Rue Bachaumont",
  "prix": "10–20 €",
  "cuisine": "Bar à cocktails"
 },
 {
  "nom": "Le 404",
  "note": "A tester",
  "lat": 48.8588897,
  "lng": 2.320041,
  "adresse": "Paris, Île-de-France, France métropolitaine",
  "prix": "20–60 €",
  "cuisine": "Marocaine"
 },
 {
  "nom": "Suan Thaï",
  "note": "",
  "lat": 48.8619943,
  "lng": 2.3640317,
  "adresse": "Suan Thai, Rue de Bretagne, Quartier des Enfants-Rouges",
  "prix": "20–30 €",
  "cuisine": "Thaï"
 },
 {
  "nom": "Sushi-B",
  "note": "",
  "lat": 48.8677062,
  "lng": 2.337428,
  "adresse": "Sushi B, Rue Rameau, Quartier Vivienne",
  "prix": "+ de 100 €",
  "cuisine": "Sushis"
 },
 {
  "nom": "Ebis",
  "note": "Super resto a tester",
  "lat": 48.8653963,
  "lng": 2.3321572,
  "adresse": "Ebis, Rue Saint-Roch, Quartier Vendôme",
  "prix": "20–60 €",
  "cuisine": "Fusion asiatique"
 },
 {
  "nom": "Chimère",
  "note": "",
  "lat": 48.8698899,
  "lng": 2.3355082,
  "adresse": "Chimère, 22, Rue du Quatre Septembre",
  "prix": "30–70 €",
  "cuisine": "Restaurant"
 },
 {
  "nom": "L'Auberge Café",
  "note": "",
  "lat": 48.8582612,
  "lng": 2.3447141,
  "adresse": "L'Auberge Café, Rue Saint-Germain l'Auxerrois, Quartier Saint-Germain-l'Auxerrois",
  "prix": "",
  "cuisine": ""
 },
 {
  "nom": "Brique Machine - Paris 2",
  "note": "Grand resto pr match",
  "lat": 48.8709276,
  "lng": 2.3427137,
  "adresse": "Brique Machine - Brique House, 161, Rue Montmartre",
  "prix": "20–30 €",
  "cuisine": "Buffet"
 },
 {
  "nom": "JJAN! 짠",
  "note": "Coréen proche de st laz/ plat fromage poulet pr 2- gino-",
  "lat": 48.8757857,
  "lng": 2.3276025,
  "adresse": "Jjan !, Rue Saint-Lazare, Quartier Saint-Georges",
  "prix": "20–30 €",
  "cuisine": "Coréenne"
 },
 {
  "nom": "Dar Mima",
  "note": "Resto rooftop Marocain - vu a l Aeroport",
  "lat": 48.8489962,
  "lng": 2.3573756,
  "adresse": "Dar Mima - Zyriab, 1, Rue des Fossés Saint-Bernard",
  "prix": "40–100 €",
  "cuisine": "Moyenne-orientale"
 },
 {
  "nom": "Atelier du veau",
  "note": "Kébab gastro",
  "lat": 48.8676812,
  "lng": 2.3326549,
  "adresse": "Atelier Du Veau, Rue Danielle Casanova, Quartier Vendôme",
  "prix": "",
  "cuisine": ""
 },
 {
  "nom": "Loup",
  "note": "Loup",
  "lat": 48.8639344,
  "lng": 2.342597,
  "adresse": "Loup, 44, Rue du Louvre",
  "prix": "20–30 €",
  "cuisine": "Française"
 },
 {
  "nom": "Le Grand Colbert",
  "note": "Grand Colbert",
  "lat": 48.8664844,
  "lng": 2.3389311,
  "adresse": "Le Grand Colbert, Rue Vivienne, Quartier Vivienne",
  "prix": "40–100 €",
  "cuisine": "Brasserie"
 },
 {
  "nom": "Kodawari Ramen (Tsukiji)",
  "note": "Décor de marche aux poissons??",
  "lat": 48.8643846,
  "lng": 2.3362784,
  "adresse": "Kodawari Ramen (Tsukiji), 12, Rue de Richelieu",
  "prix": "20–30 €",
  "cuisine": "Ramen"
 },
 {
  "nom": "Le Général",
  "note": "Reco Uber",
  "lat": 48.8662657,
  "lng": 2.366892,
  "adresse": "Le Général, Rue Rampon, Quartier de la Folie-Méricourt",
  "prix": "20–50 €",
  "cuisine": "Restaurant"
 },
 {
  "nom": "Pendino",
  "note": "Pizza bonne deux de bois",
  "lat": 48.8639457,
  "lng": 2.3345528,
  "adresse": "Pendino, Rue de l'Échelle, Quartier du Palais Royal",
  "prix": "20–30 €",
  "cuisine": "Italienne"
 },
 {
  "nom": "Kodawari Ramen (Yokochō)",
  "note": "Décor de marche aux poissons??",
  "lat": 48.8546284,
  "lng": 2.3381142,
  "adresse": "Kodawari Ramen (Yokochō), 29, Rue Mazarine",
  "prix": "20–30 €",
  "cuisine": "Ramen"
 },
 {
  "nom": "Café Blanc",
  "note": "",
  "lat": 48.8627417,
  "lng": 2.3395806,
  "adresse": "Café Blanc, 12, Rue Croix des Petits Champs",
  "prix": "20–40 €",
  "cuisine": "Française"
 },
 {
  "nom": "Brasserie Dubillot",
  "note": "",
  "lat": 48.868095,
  "lng": 2.3519457,
  "adresse": "Brasserie Dubillot, 222, Rue Saint-Denis",
  "prix": "20–30 €",
  "cuisine": "Française"
 },
 {
  "nom": "La Mezcaleria Paris",
  "note": "",
  "lat": 48.8638472,
  "lng": 2.3656384,
  "adresse": "La Mezcaleria Paris, Rue de Saintonge, Quartier des Enfants-Rouges",
  "prix": "10–20 €",
  "cuisine": "Bar"
 },
 {
  "nom": "Moonshiner",
  "note": "",
  "lat": 48.8556625,
  "lng": 2.3711461,
  "adresse": "Moonshiner, Rue Sedaine, Quartier de la Roquette",
  "prix": "10–20 €",
  "cuisine": "Bar à cocktails"
 },
 {
  "nom": "Le 1905",
  "note": "",
  "lat": 48.8588897,
  "lng": 2.320041,
  "adresse": "Paris, Île-de-France, France métropolitaine",
  "prix": "10–30 €",
  "cuisine": "Bar à cocktails"
 },
 {
  "nom": "LA JAJA",
  "note": "",
  "lat": 48.8660564,
  "lng": 2.3440191,
  "adresse": "La Jaja, 56, Rue d'Argout",
  "prix": "10–20 €",
  "cuisine": "Bar"
 },
 {
  "nom": "Griffon",
  "note": "Proche Félix",
  "lat": 48.8596119,
  "lng": 2.3572985,
  "adresse": "Griffon, 55 bis, Rue des Francs Bourgeois",
  "prix": "20–30 €",
  "cuisine": "Restaurant"
 },
 {
  "nom": "Les 4 soupes",
  "note": "",
  "lat": 48.8264183,
  "lng": 2.3594835,
  "adresse": "Song Huong, Avenue de Choisy, Quartier de la Maison-Blanche",
  "prix": "",
  "cuisine": ""
 },
 {
  "nom": "Baan Issan",
  "note": "",
  "lat": 48.833747,
  "lng": 2.3546338,
  "adresse": "Baan Issan, Rue Véronèse, Quartier de la Salpêtrière",
  "prix": "20–30 €",
  "cuisine": "Thaï"
 },
 {
  "nom": "Le Village",
  "note": "To test",
  "lat": 48.8501678,
  "lng": 2.2864502,
  "adresse": "Le Village, 34-40, Rue Emeriau",
  "prix": "10–60 €",
  "cuisine": "Restaurant"
 },
 {
  "nom": "Cheper",
  "note": "A tester!!",
  "lat": 48.8592147,
  "lng": 2.3578986,
  "adresse": "Chéper, Rue des Francs Bourgeois, Quartier Saint-Gervais",
  "prix": "",
  "cuisine": ""
 },
 {
  "nom": "Fabula",
  "note": "A tester, dans le musée Carnavalet",
  "lat": 48.8506326,
  "lng": 2.3732696,
  "adresse": "Fabula, Rue de Charenton, Quartier des Quinze-Vingts",
  "prix": "20–80 €",
  "cuisine": "Restaurant"
 },
 {
  "nom": "Clark Hot Dog",
  "note": "Hot dogs Marais",
  "lat": 48.8557065,
  "lng": 2.3604385,
  "adresse": "Clark hot dog and coffee, Rue du Roi de Sicile, Quartier Saint-Gervais",
  "prix": "1–10 €",
  "cuisine": "Stand de hot-dog"
 },
 {
  "nom": "Le Petit Dakar",
  "note": "",
  "lat": 48.8580531,
  "lng": 2.361319,
  "adresse": "Le Petit Dakar, 6, Rue Elzévir",
  "prix": "20–30 €",
  "cuisine": "Spécialités d'Afrique de l'Ouest"
 },
 {
  "nom": "Miznon Paris",
  "note": "",
  "lat": 48.872949,
  "lng": 2.3426102,
  "adresse": "Miznon, Rue de la Grange Batelière, Quartier du Faubourg-Montmartre",
  "prix": "10–20 €",
  "cuisine": "Méditerranéenne"
 },
 {
  "nom": "Café des Arts et Métiers",
  "note": "",
  "lat": 48.8648026,
  "lng": 2.355226,
  "adresse": "Le Puy des Arts, 103, Rue Beaubourg",
  "prix": "10–40 €",
  "cuisine": "Restaurant"
 },
 {
  "nom": "doublevie",
  "note": "",
  "lat": 48.8864163,
  "lng": 2.3479153,
  "adresse": "doublevie, 2, Rue Poulet",
  "prix": "20–60 €",
  "cuisine": "Restaurant"
 },
 {
  "nom": "Harry's Bar Paris",
  "note": "",
  "lat": 48.8692089,
  "lng": 2.3321714,
  "adresse": "Harry's Bar, Rue Daunou, Quartier Gaillon",
  "prix": "10–20 €",
  "cuisine": "Bar à cocktails"
 },
 {
  "nom": "Bistrot Victoires",
  "note": "",
  "lat": 48.865508,
  "lng": 2.3403568,
  "adresse": "Bistrot Victoires, Rue Catinat, Quartier du Palais Royal",
  "prix": "20–30 €",
  "cuisine": "Bistro"
 },
 {
  "nom": "Balou Paris 3",
  "note": "",
  "lat": 48.8630437,
  "lng": 2.3518446,
  "adresse": "Balou Paris 3, 11, Rue aux Ours",
  "prix": "10–20 €",
  "cuisine": "Bar à tapas"
 },
 {
  "nom": "The Highlander Pub",
  "note": "",
  "lat": 48.856041,
  "lng": 2.3398038,
  "adresse": "The Highlander, 6, Rue de Nevers",
  "prix": "10–20 €",
  "cuisine": "Pub"
 },
 {
  "nom": "Maison Lautrec",
  "note": "",
  "lat": 48.8811814,
  "lng": 2.3359631,
  "adresse": "La Maison Lautrec, Rue Jean-Baptiste Pigalle, Quartier Saint-Georges",
  "prix": "20–60 €",
  "cuisine": "Française"
 },
 {
  "nom": "Bar Hemingway",
  "note": "",
  "lat": 48.8687856,
  "lng": 2.3275106,
  "adresse": "Bar Hemingway, Rue Cambon, Quartier Vendôme",
  "prix": "30–90 €",
  "cuisine": "Bar"
 }
]
export default ERSAN
