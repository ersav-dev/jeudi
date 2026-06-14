// GÉNÉRÉ par __sources/gen_spots.mjs — ne pas éditer à la main.
// 129 spots curated (fiabilité « bonne »). Catégories : {"rooftop":38,"speakeasy / cocktail":5,"speakeasy / taco bar":1,"speakeasy / mezcal bar":1,"cocktail / nocturne":1,"cocktail / bar reconnu":1,"cocktail pub reconnu":1,"cocktail / date":2,"cocktail / musique":1,"cocktail":2,"cocktail / no menu":1,"cocktail classique":1,"bar / restaurant / events":1,"disco / club":8,"disco / open air club":1,"disco / live venue":1,"disco / live + club":1,"peniche / club":1,"disco / open air":1,"bar club":1,"club / restaurant":1,"peniche / bar sur l'eau":1,"peniche / art urbain":1,"peniche / bar-club":2,"peniche / live":1,"peniche / canal":1,"peniche / bar jazz":1,"guinguette / plein air":1,"guinguette / parc":2,"tiers-lieu / terrasse":1,"food court / terrasse":1,"guinguette / jardin":1,"canal / maison-bar":1,"guinguette / tiers-lieu":1,"guinguette / ferme urbaine":1,"street-food / solo":2,"street-food / sandwich":1,"street-food / pita":1,"street-food / tacos":2,"street-food / bao":2,"solo counter / ramen":3,"solo counter / udon":1,"solo counter / japonais":1,"street-food / nouilles":1,"street-food / vietnamien":1,"cheap eat / chinois":1,"street-food / burger":1,"bouillon / pas cher":3,"gastro / date":1,"resto / date":1,"wine bar / date":2,"bar / date":1,"resto / bar musical":1,"wine bar / ice cream":1,"brasserie / date / terrasse":1,"cafe / terrasse classique":3,"nocturne / brasserie":3,"gastro palace":3,"gastro":3,"gastro rooftop":1,"gastro contemporain":1}
export interface SpotCurated {
  nom: string
  categorie: string
  adresse: string
  lat: number
  lng: number
  description: string
  meteo: 'soleil' | 'nuageux' | 'pluie'
  envies: string[]
  compagnies: string[]
  rooftop: boolean
  surLeau: boolean
  source?: string
}
export const CURATED: SpotCurated[] = [
  {
    "nom": "Le Tout-Paris",
    "categorie": "rooftop",
    "adresse": "8 Quai du Louvre, 75001 Paris",
    "lat": 48.859121,
    "lng": 2.342073,
    "description": "palace du Cheval Blanc avec terrasse et vue Seine / Pont-Neuf.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.chevalblanc.com/en/maison/paris/restaurants-and-bars/le-tout-paris/"
  },
  {
    "nom": "ROOF Paris",
    "categorie": "rooftop",
    "adresse": "43 Rue Étienne Marcel, 75001 Paris",
    "lat": 48.864884,
    "lng": 2.344227,
    "description": "grand rooftop végétalisé de Madame Rêve, central, beau panorama et ambiance mode.",
    "meteo": "nuageux",
    "envies": [
      "alloco",
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://madamereve.com/restaurants/roof/"
  },
  {
    "nom": "Sequoia Rooftop Bar",
    "categorie": "rooftop",
    "adresse": "27-29 Bd des Capucines, 75002 Paris",
    "lat": 48.868548,
    "lng": 2.31829,
    "description": "rooftop chic du Kimpton St Honoré, vue centrale, ambiance premium et cocktails.",
    "meteo": "nuageux",
    "envies": [
      "alloco",
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.kimptonsthonoreparis.com/us/en/sequoia-rooftop-bar/"
  },
  {
    "nom": "The Shed",
    "categorie": "rooftop",
    "adresse": "17 Bd Poissonnière, 75002 Paris",
    "lat": 48.869973,
    "lng": 2.334171,
    "description": "rooftop discret de l'Hotel des Grands Boulevards, petit, cosy et plus cache que panoramique.",
    "meteo": "nuageux",
    "envies": [
      "tranquilo",
      "alloco",
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.grandsboulevardshotel.com/"
  },
  {
    "nom": "Rooftop National",
    "categorie": "rooftop",
    "adresse": "243 Rue Saint-Martin, 75003 Paris",
    "lat": 48.863537,
    "lng": 2.347753,
    "description": "rooftop compact et central de l'Hotel National des Arts et Metiers, vue sur les toits.",
    "meteo": "nuageux",
    "envies": [
      "tranquilo",
      "alloco",
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.hotelnational.paris/"
  },
  {
    "nom": "Bonnie",
    "categorie": "rooftop",
    "adresse": "10 Rue Agrippa d'Aubigné, 75004 Paris",
    "lat": 48.849978,
    "lng": 2.362514,
    "description": "rooftop du SO/Paris avec vue Seine, Notre-Dame, Eiffel et ambiance très chic.",
    "meteo": "soleil",
    "envies": [
      "alloco",
      "resto",
      "gastro",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://bonnie-restaurant.com/paris/"
  },
  {
    "nom": "Terraza Mikuna",
    "categorie": "rooftop",
    "adresse": "1 Rue des Archives, 75004 Paris",
    "lat": 48.85781,
    "lng": 2.35333,
    "description": "rooftop latino au BHV Marais, vegetal, festif, cocktails et cuisine sud-americaine.",
    "meteo": "nuageux",
    "envies": [
      "alloco",
      "resto",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.terrassamikuna.com/"
  },
  {
    "nom": "Le Toit de la Tour",
    "categorie": "rooftop",
    "adresse": "15 Quai de la Tournelle, 75005 Paris",
    "lat": 48.849142,
    "lng": 2.354306,
    "description": "rooftop de la Tour d'Argent, vue Seine / Notre-Dame, champagne et cocktails.",
    "meteo": "soleil",
    "envies": [
      "alloco",
      "gastro",
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://tourdargent.com/"
  },
  {
    "nom": "Rooftop Bar Dame des Arts",
    "categorie": "rooftop",
    "adresse": "4 Rue Danton, 75006 Paris",
    "lat": 48.853904,
    "lng": 2.337882,
    "description": "rooftop rive gauche, vue Notre-Dame, Eiffel et toits du quartier Saint-Michel.",
    "meteo": "nuageux",
    "envies": [
      "tranquilo",
      "alloco",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://hoteldamedesarts.com/"
  },
  {
    "nom": "Kinugawa Rive Gauche",
    "categorie": "rooftop",
    "adresse": "55 Av. de Saxe, 75007 Paris",
    "lat": 48.8468342,
    "lng": 2.3128379,
    "description": "japonais perché au sommet de l'Hotel Sax avec rooftop et vue Eiffel.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://kinu-gawa.com/en-rivegauche.html"
  },
  {
    "nom": "Les Ombres",
    "categorie": "rooftop",
    "adresse": "27 Quai Jacques Chirac, 75007 Paris",
    "lat": 48.8611046,
    "lng": 2.2984734,
    "description": "sur le toit du musée du Quai Branly, terrasse panoramique et vue Eiffel.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.lesombres-restaurant.com/en/"
  },
  {
    "nom": "Terrasse du Musée d'Orsay",
    "categorie": "rooftop",
    "adresse": "Esplanade Valéry Giscard d'Estaing, 75007 Paris",
    "lat": 48.859961,
    "lng": 2.326561,
    "description": "terrasse au-dessus de la Seine, ouverte en saison estivale, boissons et petites assiettes.",
    "meteo": "nuageux",
    "envies": [
      "tranquilo",
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.musee-orsay.fr/en/visit/restaurants%20and%20caf%C3%A9s"
  },
  {
    "nom": "FUGA R",
    "categorie": "rooftop",
    "adresse": "28 Rue de Monceau, 75008 Paris",
    "lat": 48.8767911,
    "lng": 2.3090083,
    "description": "rooftop au 12e étage près du parc Monceau, déco Canaries, vue 360 et accès discret.",
    "meteo": "nuageux",
    "envies": [
      "alloco",
      "resto",
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://fugafamily.com/en/restaurants/fuga-rooftop"
  },
  {
    "nom": "Le Rooftop - Hotel Fouquet's Paris",
    "categorie": "rooftop",
    "adresse": "46 Av. George V, 75008 Paris",
    "lat": 48.8711235,
    "lng": 2.3011694,
    "description": "rooftop premium du Fouquet's, adresse Champs-Elysees / George V.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro",
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.hotelsbarriere.com/paris/le-fouquets/restaurants-et-bars/le-rooftop.html"
  },
  {
    "nom": "Mun Paris",
    "categorie": "rooftop",
    "adresse": "52 Av. des Champs-Élysées, 75008 Paris",
    "lat": 48.8704259,
    "lng": 2.3066934,
    "description": "asiatique haut de gamme avec terrasse perchée sur les Champs-Elysees.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://munparis.com/"
  },
  {
    "nom": "PLEY Rooftop",
    "categorie": "rooftop",
    "adresse": "216 Rue du Faubourg Saint-Honoré, 75008 Paris",
    "lat": 48.8756206,
    "lng": 2.3039644,
    "description": "rooftop d'hôtel avec aperitivo, cocktails et ambiance afterwork.",
    "meteo": "pluie",
    "envies": [
      "alloco",
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://pley-hotel.com/en/page/restaurant-bar-rooftop-paris.8302.html"
  },
  {
    "nom": "Balcon Paris - Galeries Lafayette",
    "categorie": "rooftop",
    "adresse": "25 Rue de la Chaussée d'Antin, 75009 Paris",
    "lat": 48.873409,
    "lng": 2.328004,
    "description": "rooftop très touristique des Galeries Lafayette, vue Opera et toits de Paris.",
    "meteo": "nuageux",
    "envies": [
      "tranquilo",
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.galerieslafayette.com/magasin-haussmann/restaurants"
  },
  {
    "nom": "Maggie Rooftop",
    "categorie": "rooftop",
    "adresse": "55 Bd Marguerite de Rochechouart, 75009 Paris",
    "lat": 48.882163,
    "lng": 2.339618,
    "description": "rooftop de l'Hotel Rochechouart, vue Sacré-Coeur, Pigalle chic et coucher de soleil.",
    "meteo": "nuageux",
    "envies": [
      "alloco",
      "resto",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.orsohotels.com/hotel-rochechouart/rooftop-restaurant-maggie"
  },
  {
    "nom": "Perruche",
    "categorie": "rooftop",
    "adresse": "Printemps de l'Homme, 2 Rue du Havre, 9e étage, 75009 Paris",
    "lat": 48.872906,
    "lng": 2.322927,
    "description": "grand rooftop du Printemps, vue Opera, Eiffel et toits de Paris, ambiance solaire.",
    "meteo": "nuageux",
    "envies": [
      "alloco",
      "resto",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://perruche-restaurant.com/paris/"
  },
  {
    "nom": "Khayma Rooftop",
    "categorie": "rooftop",
    "adresse": "9-11 Place du Colonel Fabien, 75010 Paris",
    "lat": 48.878349,
    "lng": 2.362068,
    "description": "rooftop jeune et accessible du Generator, vue Sacré-Coeur, idéal apéro simple.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "alloco",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://generatorhostels.com/destinations/paris/"
  },
  {
    "nom": "Le Perchoir Ménilmontant",
    "categorie": "rooftop",
    "adresse": "14 Rue Camille Crespin du Gast, 75011 Paris",
    "lat": 48.863454,
    "lng": 2.372165,
    "description": "classique rooftop de l'Est parisien, ambiance branchée et festive.",
    "meteo": "nuageux",
    "envies": [
      "alloco",
      "resto",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://leperchoir.fr/"
  },
  {
    "nom": "Laho Rooftop",
    "categorie": "rooftop",
    "adresse": "5-9 Rue Van Gogh, 75012 Paris",
    "lat": 48.843539,
    "lng": 2.368916,
    "description": "rooftop à 60 m près de Gare de Lyon, vue très dégagée, DJ et événements.",
    "meteo": "nuageux",
    "envies": [
      "alloco",
      "resto",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.laho-rooftop.fr/"
  },
  {
    "nom": "TOO TacTac Skybar",
    "categorie": "rooftop",
    "adresse": "65 Rue Bruneseau, 75013 Paris",
    "lat": 48.825739,
    "lng": 2.374621,
    "description": "skybar très haut du TOO Hotel, vue Seine, Eiffel et monuments, privatisable.",
    "meteo": "nuageux",
    "envies": [
      "alloco",
      "resto",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://toohotel.com/en/tac-tac-skybar-en/"
  },
  {
    "nom": "Skybar Paris Rooftop",
    "categorie": "rooftop",
    "adresse": "19 Rue du Commandant René Mouchotte, 75014 Paris",
    "lat": 48.83881,
    "lng": 2.296433,
    "description": "du Pullman Montparnasse au 32e étage, panorama spectaculaire et ambiance lounge.",
    "meteo": "nuageux",
    "envies": [
      "alloco",
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.skybarparis.com/"
  },
  {
    "nom": "ILVOLO Bar Rooftop",
    "categorie": "rooftop",
    "adresse": "257 Rue de Vaugirard, 7e étage, 75015 Paris",
    "lat": 48.840341,
    "lng": 2.296442,
    "description": "rooftop italien du Novotel Vaugirard, bon afterwork avec vue Tour Eiffel.",
    "meteo": "pluie",
    "envies": [
      "alloco",
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.ilvolo-paris.com/"
  },
  {
    "nom": "Villa M Rooftop",
    "categorie": "rooftop",
    "adresse": "24-30 Bd Pasteur, 75015 Paris",
    "lat": 48.8423509,
    "lng": 2.3124414,
    "description": "rooftop végétal de Villa M, vue Eiffel, Montparnasse et Invalides, cadre confidentiel.",
    "meteo": "nuageux",
    "envies": [
      "tranquilo",
      "resto",
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.hotelvillam-paris15.com/restaurant-rooftop"
  },
  {
    "nom": "Auteuil Brasserie",
    "categorie": "rooftop",
    "adresse": "78 Rue d'Auteuil, 75016 Paris",
    "lat": 48.848307,
    "lng": 2.2598214,
    "description": "grande brasserie végétalisée avec terrasse en hauteur, plus conviviale que skybar.",
    "meteo": "nuageux",
    "envies": [
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://auteuil.paris/"
  },
  {
    "nom": "Brach Rooftop",
    "categorie": "rooftop",
    "adresse": "1-7 Rue Jean Richepin, 75016 Paris",
    "lat": 48.85865,
    "lng": 2.27645,
    "description": "rooftop-jardin du Brach, vue Tour Eiffel, potager et ambiance hôtel design.",
    "meteo": "nuageux",
    "envies": [
      "tranquilo",
      "alloco",
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://brachparis.com/"
  },
  {
    "nom": "L'Oiseau Blanc",
    "categorie": "rooftop",
    "adresse": "19 Av. Kléber, 75116 Paris",
    "lat": 48.87066,
    "lng": 2.287961,
    "description": "rooftop du Peninsula, gastronomie, vue Tour Eiffel, très premium.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.peninsula.com/en/paris/hotel-fine-dining/loiseau-blanc-rooftop-restaurant"
  },
  {
    "nom": "La Suite Girafe",
    "categorie": "rooftop",
    "adresse": "1 Pl. du Trocadéro et du 11 Novembre, 75016 Paris",
    "lat": 48.8628402,
    "lng": 2.287142,
    "description": "paris Society au Palais de Chaillot, vue Tour Eiffel, cuisine chic.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://girafe-restaurant.com/la-suite/"
  },
  {
    "nom": "Restaurant Toit Terrasse Molitor",
    "categorie": "rooftop",
    "adresse": "6 Av. de la Porte Molitor, 75016 Paris",
    "lat": 48.844409,
    "lng": 2.252352,
    "description": "rooftop de Molitor, ambiance piscine mythique, ouest parisien et beaux jours.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://molitorparis.com/"
  },
  {
    "nom": "Bar a Bulles",
    "categorie": "rooftop",
    "adresse": "4 Cité Véron, 75018 Paris",
    "lat": 48.88433,
    "lng": 2.33376,
    "description": "terrasse cachée de la Machine du Moulin Rouge, bohème, culturelle et accessible.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "alloco",
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.lamachinedumoulinrouge.com/le-bar-a-bulles/"
  },
  {
    "nom": "Coeur Sacre",
    "categorie": "rooftop",
    "adresse": "5 Rue Saint-Éleuthère, 75018 Paris",
    "lat": 48.8858403,
    "lng": 2.3415863,
    "description": "en hauteur à Montmartre, vue Sacré-Coeur et Tour Eiffel, plutôt journée et apéro.",
    "meteo": "nuageux",
    "envies": [
      "tranquilo",
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://paris-society-events.com/salles/coeur-sacre/"
  },
  {
    "nom": "Station M by Maison Montmartre",
    "categorie": "rooftop",
    "adresse": "32 Av. de la Porte de Montmartre, 75018 Paris",
    "lat": 48.9004416,
    "lng": 2.3358099,
    "description": "rooftop d'hôtel au nord de Montmartre, bon pour brunch, apéro et groupe calme.",
    "meteo": "nuageux",
    "envies": [
      "tranquilo",
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://hotelmaisonmontmartre.com/en/page/paris-rooftop-bar-restaurant.38219.html"
  },
  {
    "nom": "Terrass'' Rooftop Bar",
    "categorie": "rooftop",
    "adresse": "12 Rue Joseph de Maistre, 75018 Paris",
    "lat": 48.885675,
    "lng": 2.328959,
    "description": "rooftop de Montmartre avec vue Eiffel et Paris, classique pour coucher de soleil.",
    "meteo": "nuageux",
    "envies": [
      "tranquilo",
      "alloco",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.terrass-hotel.com/"
  },
  {
    "nom": "Le Toit de La Bellevilloise",
    "categorie": "rooftop",
    "adresse": "19-21 Rue Boyer, 75020 Paris",
    "lat": 48.872182,
    "lng": 2.386794,
    "description": "rooftop populaire et culturel de Belleville/Ménilmontant, bon pour potes et apéro.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "alloco",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.labellevilloise.com/"
  },
  {
    "nom": "Mama Shelter Paris East Rooftop",
    "categorie": "rooftop",
    "adresse": "109 Rue de Bagnolet, 75020 Paris",
    "lat": 48.858705,
    "lng": 2.390287,
    "description": "rooftop détendu avec esprit groupe, babyfoot/ping-pong selon saison, pas le plus panoramique.",
    "meteo": "nuageux",
    "envies": [
      "tranquilo",
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://mamashelter.com/paris-east/eat-drink/"
  },
  {
    "nom": "Skyline Paris Lounge & Bar",
    "categorie": "rooftop",
    "adresse": "Hotel Meliá Paris La Défense, 4 Espl. du Général de Gaulle, 92400 Courbevoie",
    "lat": 48.889372,
    "lng": 2.244494,
    "description": "rooftop Grand Paris à La Défense, vue skyline et Paris, utile si tu inclus petite couronne.",
    "meteo": "nuageux",
    "envies": [
      "tranquilo",
      "alloco",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://www.melia.com/en/hotels/france/paris/melia-paris-la-defense/restaurants/skyline-paris-lounge-bar"
  },
  {
    "nom": "Little Red Door",
    "categorie": "speakeasy / cocktail",
    "adresse": "60 Rue Charlot, 75003 Paris",
    "lat": 48.8636541,
    "lng": 2.3635309,
    "description": "caché iconique du Marais, signature cocktails, ambiance confidentielle.",
    "meteo": "nuageux",
    "envies": [
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.lrdparis.com/"
  },
  {
    "nom": "Candelaria",
    "categorie": "speakeasy / taco bar",
    "adresse": "52 Rue de Saintonge, 75003 Paris",
    "lat": 48.8629844,
    "lng": 2.3639861,
    "description": "taqueria mexicaine avec bar caché derrière, parfait incognito + tacos.",
    "meteo": "nuageux",
    "envies": [
      "alloco",
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.candelariaparis.com/"
  },
  {
    "nom": "Moonshiner",
    "categorie": "speakeasy / cocktail",
    "adresse": "5 Rue Sedaine, 75011 Paris",
    "lat": 48.8556393,
    "lng": 2.3712026,
    "description": "speakeasy accessible par une chambre froide derrière une pizzeria, décor prohibition.",
    "meteo": "pluie",
    "envies": [
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://moonshinerbar.fr/"
  },
  {
    "nom": "Lavomatic",
    "categorie": "speakeasy / cocktail",
    "adresse": "30 Rue René Boulanger, 75010 Paris",
    "lat": 48.8684268,
    "lng": 2.3618035,
    "description": "caché derrière une laverie, très concept, bon tag incognito.",
    "meteo": "pluie",
    "envies": [
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.fr/paris/bars/les-meilleurs-speakeasys-de-paris"
  },
  {
    "nom": "L'Epicier",
    "categorie": "speakeasy / cocktail",
    "adresse": "24 Rue Notre Dame de Nazareth, 75003 Paris",
    "lat": 48.8672861,
    "lng": 2.3599971,
    "description": "entrée façon épicerie de quartier, bar caché compact et très app-friendly.",
    "meteo": "pluie",
    "envies": [
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.lepicier.paris/"
  },
  {
    "nom": "No Entry",
    "categorie": "speakeasy / cocktail",
    "adresse": "20 bis Rue de Douai, 75009 Paris",
    "lat": 48.8818957,
    "lng": 2.3345641,
    "description": "caché sous Pink Mamma, entrée discrète, bon spot duo/potos.",
    "meteo": "pluie",
    "envies": [
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.bigmammagroup.com/fr/trattorias/no-entry"
  },
  {
    "nom": "La Mezcaleria Paris",
    "categorie": "speakeasy / mezcal bar",
    "adresse": "13 Bd du Temple, 75003 Paris",
    "lat": 48.8639766,
    "lng": 2.3659519,
    "description": "caché de l'hôtel 1K, spécialisé mezcal et vibe latine.",
    "meteo": "pluie",
    "envies": [
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.1k-paris.com/la-mezcaleria/"
  },
  {
    "nom": "Experimental Cocktail Club",
    "categorie": "cocktail / nocturne",
    "adresse": "37 Rue Saint-Sauveur, 75002 Paris",
    "lat": 48.8660758,
    "lng": 2.3482192,
    "description": "institution cocktail parisienne, ouvert tard le week-end.",
    "meteo": "pluie",
    "envies": [
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.experimentalcocktailclub.com/paris/"
  },
  {
    "nom": "Danico",
    "categorie": "cocktail / bar reconnu",
    "adresse": "6 Rue Vivienne, 75002 Paris",
    "lat": 48.8671196,
    "lng": 2.3392939,
    "description": "cocktail bar reconnu dans la Galerie Vivienne, bon pour date ou pro cool.",
    "meteo": "nuageux",
    "envies": [
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.danico-paris.com/"
  },
  {
    "nom": "The Cambridge Public House",
    "categorie": "cocktail pub reconnu",
    "adresse": "8 Rue de Poitou, 75003 Paris",
    "lat": 48.8614298,
    "lng": 2.3641614,
    "description": "cocktail pub du Marais, classé par 50 Best, plus chaleureux que guindé.",
    "meteo": "nuageux",
    "envies": [
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.thecambridge.paris/"
  },
  {
    "nom": "Bar Nouveau",
    "categorie": "cocktail / date",
    "adresse": "5 Rue des Haudriettes, 75003 Paris",
    "lat": 48.8615403,
    "lng": 2.3575655,
    "description": "petit bar cocktail art nouveau, intime, très bon pour duo.",
    "meteo": "pluie",
    "envies": [
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.com/paris/en/bars-pubs/best-cocktail-bars-in-paris"
  },
  {
    "nom": "Fréquence",
    "categorie": "cocktail / musique",
    "adresse": "20 Rue Keller, 75011 Paris",
    "lat": 48.8548031,
    "lng": 2.375927,
    "description": "cocktails + sélection musicale/vinyle, bon apéro tardif sans être une boîte.",
    "meteo": "nuageux",
    "envies": [
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.com/travel/worlds-best-bars"
  },
  {
    "nom": "Combat",
    "categorie": "cocktail",
    "adresse": "63 Rue de Belleville, 75019 Paris",
    "lat": 48.8734048,
    "lng": 2.3822311,
    "description": "cocktail reconnu côté Belleville, ambiance cool et moins bling.",
    "meteo": "pluie",
    "envies": [
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.com/paris/en/bars-pubs/best-cocktail-bars-in-paris"
  },
  {
    "nom": "Bisou.",
    "categorie": "cocktail / no menu",
    "adresse": "15 Bd du Temple, 75003 Paris",
    "lat": 48.864082,
    "lng": 2.3658884,
    "description": "sans carte fixe, cocktails selon goûts, bon premier date pas trop formel.",
    "meteo": "pluie",
    "envies": [
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.bisouparis.com/"
  },
  {
    "nom": "CopperBay",
    "categorie": "cocktail",
    "adresse": "5 Rue Bouchardon, 75010 Paris",
    "lat": 48.8698469,
    "lng": 2.3571238,
    "description": "cocktail bar reconnu, ambiance bord de mer chic mais détendue.",
    "meteo": "pluie",
    "envies": [
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.copperbay.fr/"
  },
  {
    "nom": "Sister Midnight",
    "categorie": "cocktail / date",
    "adresse": "4 Rue Viollet-le-Duc, 75009 Paris",
    "lat": 48.8814639,
    "lng": 2.3407486,
    "description": "petit cocktail bar intime, bien pour duo / premier verre.",
    "meteo": "pluie",
    "envies": [
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.com/paris/en/bars-pubs/best-cocktail-bars-in-paris"
  },
  {
    "nom": "Harry's New York Bar",
    "categorie": "cocktail classique",
    "adresse": "5 Rue Daunou, 75002 Paris",
    "lat": 48.8692491,
    "lng": 2.3321281,
    "description": "institution historique des cocktails à Paris, classique et central.",
    "meteo": "pluie",
    "envies": [
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.harrysbar.fr/"
  },
  {
    "nom": "Serpent a Plume",
    "categorie": "bar / restaurant / events",
    "adresse": "24 Pl. des Vosges, 75003 Paris",
    "lat": 48.8561156,
    "lng": 2.3668233,
    "description": "place des Vosges, hybride bar-restaurant, plus sélective et nocturne.",
    "meteo": "nuageux",
    "envies": [
      "resto",
      "incognito",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.fr/paris/bars/les-meilleurs-speakeasys-de-paris"
  },
  {
    "nom": "Rex Club",
    "categorie": "disco / club",
    "adresse": "5 Bd Poissonnière, 75002 Paris",
    "lat": 48.8705976,
    "lng": 2.3472734,
    "description": "institution techno/house parisienne, recommandée pour vraie sortie club.",
    "meteo": "nuageux",
    "envies": [],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://ra.co/guides/clubs-in-paris"
  },
  {
    "nom": "Djoon Club",
    "categorie": "disco / club",
    "adresse": "22 Bd Vincent Auriol, 75013 Paris",
    "lat": 48.83665,
    "lng": 2.3716268,
    "description": "club reconnu pour house, soulful et disco; vraie piste, pas simple bar.",
    "meteo": "nuageux",
    "envies": [],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://ra.co/guides/clubs-in-paris"
  },
  {
    "nom": "Badaboum",
    "categorie": "disco / club",
    "adresse": "2 bis Rue des Taillandiers, 75011 Paris",
    "lat": 48.8536135,
    "lng": 2.3756573,
    "description": "salle Bastille fiable pour concerts, DJ sets et clubbing.",
    "meteo": "nuageux",
    "envies": [],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://ra.co/guides/clubs-in-paris"
  },
  {
    "nom": "La Machine du Moulin Rouge",
    "categorie": "disco / club",
    "adresse": "90 Bd de Clichy, 75018 Paris",
    "lat": 48.8841152,
    "lng": 2.3321741,
    "description": "grosse salle reconnue Pigalle, programmation club/concert.",
    "meteo": "nuageux",
    "envies": [],
    "compagnies": [
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.lamachinedumoulinrouge.com/"
  },
  {
    "nom": "La Java",
    "categorie": "disco / club",
    "adresse": "105 Rue du Faubourg du Temple, 75010 Paris",
    "lat": 48.8710123,
    "lng": 2.3738915,
    "description": "club historique de Belleville, programmation électronique/queer/alternative.",
    "meteo": "pluie",
    "envies": [],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://ra.co/guides/clubs-in-paris"
  },
  {
    "nom": "T7 Paris",
    "categorie": "disco / club",
    "adresse": "Pl. des Insurgés de Varsovie, 75015 Paris",
    "lat": 48.8273067,
    "lng": 2.2928334,
    "description": "grand club en hauteur Porte de Versailles, programmation DJ/électronique.",
    "meteo": "nuageux",
    "envies": [],
    "compagnies": [
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.t7paris.com/"
  },
  {
    "nom": "Virage Paris",
    "categorie": "disco / open air club",
    "adresse": "26 Rue Hélène et François Missoffe, 75017 Paris",
    "lat": 48.9004188,
    "lng": 2.3220984,
    "description": "club/open-air aux portes de Paris, plutôt saison et programmation électronique.",
    "meteo": "nuageux",
    "envies": [],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://ra.co/guides/clubs-in-paris"
  },
  {
    "nom": "Cabaret Sauvage",
    "categorie": "disco / live venue",
    "adresse": "59 Bd Macdonald, 75019 Paris",
    "lat": 48.8955745,
    "lng": 2.3934188,
    "description": "reconnu de la Villette, concerts et soirées club.",
    "meteo": "nuageux",
    "envies": [],
    "compagnies": [
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.cabaretsauvage.com/"
  },
  {
    "nom": "La Gare - Le Gore",
    "categorie": "disco / live + club",
    "adresse": "1 Av. Corentin Cariou, 75019 Paris",
    "lat": 48.8949221,
    "lng": 2.3821429,
    "description": "jazz/live en haut, club en sous-sol; vrai lieu nocturne culturel.",
    "meteo": "pluie",
    "envies": [],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.lagare-le-gore.com/"
  },
  {
    "nom": "Petit Bain",
    "categorie": "peniche / club",
    "adresse": "7 Port de la Gare, 75013 Paris",
    "lat": 48.8354259,
    "lng": 2.3767186,
    "description": "péniche culturelle sur la Seine: concerts, bar, club et terrasse.",
    "meteo": "nuageux",
    "envies": [
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": true,
    "source": "https://petitbain.org/"
  },
  {
    "nom": "Glazart",
    "categorie": "disco / club",
    "adresse": "7 Av. de la Porte de la Villette, 75019 Paris",
    "lat": 48.899283,
    "lng": 2.3866102,
    "description": "club/lieu live reconnu côté Villette, programmation alternative.",
    "meteo": "nuageux",
    "envies": [],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://ra.co/guides/clubs-in-paris"
  },
  {
    "nom": "Nouveau Casino",
    "categorie": "disco / club",
    "adresse": "109 Rue Oberkampf, 75011 Paris",
    "lat": 48.8658567,
    "lng": 2.3778299,
    "description": "salle Oberkampf reconnue pour concerts et nuits club.",
    "meteo": "pluie",
    "envies": [],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://nouveaucasino.net/"
  },
  {
    "nom": "Kilometre25",
    "categorie": "disco / open air",
    "adresse": "8 Bd Macdonald, 75019 Paris",
    "lat": 48.8959943,
    "lng": 2.3943382,
    "description": "open-air électronique sous le périphérique, très saisonnier.",
    "meteo": "nuageux",
    "envies": [],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://ra.co/guides/clubs-in-paris"
  },
  {
    "nom": "Panic Room",
    "categorie": "bar club",
    "adresse": "101 Rue Amelot, 75011 Paris",
    "lat": 48.861244,
    "lng": 2.3676094,
    "description": "bar-club avec sous-sol dansant; plus casual que gros club.",
    "meteo": "pluie",
    "envies": [
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.panicroomparis.com/"
  },
  {
    "nom": "Silencio",
    "categorie": "club / restaurant",
    "adresse": "142 Rue Montmartre, 75002 Paris",
    "lat": 48.8689175,
    "lng": 2.3433816,
    "description": "club sélectif et culturel, utile pro/incognito mais à réserver selon event.",
    "meteo": "soleil",
    "envies": [
      "incognito"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://silencio-club.com/"
  },
  {
    "nom": "Rosa Bonheur sur Seine",
    "categorie": "peniche / bar sur l'eau",
    "adresse": "2 Port des Invalides, 75007 Paris",
    "lat": 48.8631175,
    "lng": 2.3133776,
    "description": "péniche conviviale près du Pont Alexandre III, apéro + danse selon soirs.",
    "meteo": "nuageux",
    "envies": [
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": true,
    "source": "https://www.rosabonheur.fr/rosa-bonheur-sur-seine/"
  },
  {
    "nom": "Fluctuart",
    "categorie": "peniche / art urbain",
    "adresse": "2 Port du Gros Caillou, 75007 Paris",
    "lat": 48.8605021,
    "lng": 2.2939902,
    "description": "flottant gratuit dédié au street art, bar et terrasse sur Seine.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": false,
    "surLeau": true,
    "source": "https://fluctuart.fr/"
  },
  {
    "nom": "Le Mazette",
    "categorie": "peniche / bar-club",
    "adresse": "69 Port de la Rapée, 75012 Paris",
    "lat": 48.8432577,
    "lng": 2.3693705,
    "description": "barge hybride bar, resto, open-air et club; très bon pour potos.",
    "meteo": "nuageux",
    "envies": [
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": true,
    "source": "https://parisjetaime.com/eng/culture/le-mazette-p4690"
  },
  {
    "nom": "La Dame de Canton",
    "categorie": "peniche / live",
    "adresse": "5 Port de la Gare, 75013 Paris",
    "lat": 48.8359075,
    "lng": 2.3756047,
    "description": "jonque chinoise amarrée, bar-resto et concerts, très identifiable.",
    "meteo": "nuageux",
    "envies": [
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": true,
    "source": "https://www.damedecanton.com/"
  },
  {
    "nom": "Peniche Antipode",
    "categorie": "peniche / canal",
    "adresse": "55 Quai de la Seine, 75019 Paris",
    "lat": 48.887098,
    "lng": 2.3751299,
    "description": "péniche du canal de l'Ourcq, plus tranquille/culturelle que club.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": true,
    "source": "https://www.penicheantipode.fr/"
  },
  {
    "nom": "Le Marcounet",
    "categorie": "peniche / bar jazz",
    "adresse": "14 Quai de l'Hôtel de Ville, 75004 Paris",
    "lat": 48.8534062,
    "lng": 2.3564823,
    "description": "péniche centrale avec jazz et terrasse, bon duo/apéro.",
    "meteo": "nuageux",
    "envies": [
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": true,
    "source": "https://www.peniche-marcounet.fr/"
  },
  {
    "nom": "Bateau Phare",
    "categorie": "peniche / bar-club",
    "adresse": "3 Port de la Gare, 75013 Paris",
    "lat": 48.8359075,
    "lng": 2.3756047,
    "description": "péniche historique côté Bibliothèque, programmation festive.",
    "meteo": "nuageux",
    "envies": [
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": true,
    "source": "https://www.bateauphare.com/"
  },
  {
    "nom": "La Javelle",
    "categorie": "guinguette / plein air",
    "adresse": "5 Bd Poniatowski, 75012 Paris",
    "lat": 48.8340261,
    "lng": 2.4040975,
    "description": "guinguette estivale avec food, DJ sets et grande terrasse.",
    "meteo": "pluie",
    "envies": [
      "alloco",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.sortiraparis.com/en/where-to-eat-in-paris/bars-cafes/guides/329014-guinguettes-in-paris-and-ile-de-france-in-2026-our-top-picks-for-a-pre-dinner-drink"
  },
  {
    "nom": "Rosa Bonheur Buttes Chaumont",
    "categorie": "guinguette / parc",
    "adresse": "2 Av. de la Cascade, 75019 Paris",
    "lat": 48.8799811,
    "lng": 2.3862299,
    "description": "guinguette emblématique dans les Buttes-Chaumont, apéro/potos.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.rosabonheur.fr/rosa-bonheur-buttes-chaumont/"
  },
  {
    "nom": "Pavillon Puebla",
    "categorie": "guinguette / parc",
    "adresse": "Av. Darcel, 75019 Paris",
    "lat": 48.8772891,
    "lng": 2.379077,
    "description": "grande terrasse dans le parc des Buttes-Chaumont, apéro/potos.",
    "meteo": "nuageux",
    "envies": [
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.pavillonpuebla.fr/"
  },
  {
    "nom": "La REcyclerie",
    "categorie": "tiers-lieu / terrasse",
    "adresse": "83 Bd Ornano, 75018 Paris",
    "lat": 48.8976218,
    "lng": 2.3440598,
    "description": "tiers-lieu éco-responsable avec terrasse et ferme urbaine, bon solo/potos.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.larecyclerie.com/"
  },
  {
    "nom": "Ground Control",
    "categorie": "food court / terrasse",
    "adresse": "81 Rue du Charolais, 75012 Paris",
    "lat": 48.8433293,
    "lng": 2.3811637,
    "description": "grand lieu hybride food, bar, events; très bien potos et solo safe.",
    "meteo": "pluie",
    "envies": [
      "alloco",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.groundcontrolparis.com/"
  },
  {
    "nom": "Jardin21",
    "categorie": "guinguette / jardin",
    "adresse": "12a Rue Ella Fitzgerald, 75019 Paris",
    "lat": 48.8964692,
    "lng": 2.3954621,
    "description": "jardin-guinguette près de La Villette, terrasse, events et DJ sets.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.jardin21.fr/"
  },
  {
    "nom": "Le Pavillon des Canaux",
    "categorie": "canal / maison-bar",
    "adresse": "39 Quai de la Loire, 75019 Paris",
    "lat": 48.8874305,
    "lng": 2.3786909,
    "description": "maison-bar colorée au bord du canal, bon duo/tranquillo.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": true,
    "source": "https://www.pavillondescanaux.com/"
  },
  {
    "nom": "La Cite Fertile",
    "categorie": "guinguette / tiers-lieu",
    "adresse": "14 Av. Edouard Vaillant, 93500 Pantin",
    "lat": 48.8984672,
    "lng": 2.3983699,
    "description": "grand tiers-lieu à Pantin, ambiance guinguette/extérieur, petite couronne.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://citefertile.com/"
  },
  {
    "nom": "La Prairie du Canal",
    "categorie": "guinguette / ferme urbaine",
    "adresse": "55 Rue de Paris, 93000 Bobigny",
    "lat": 48.8985048,
    "lng": 2.4413639,
    "description": "guinguette/ferme urbaine de petite couronne, très saison et week-end.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.prairieducanal.fr/"
  },
  {
    "nom": "Urfa Durum",
    "categorie": "street-food / solo",
    "adresse": "58 Rue du Faubourg Saint-Denis, 75010 Paris",
    "lat": 48.8724069,
    "lng": 2.3542518,
    "description": "durüm culte, rapide, parfait solo ou petit budget.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "alloco"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.com/paris/en/feature/food/pariss-best-cheap-eats"
  },
  {
    "nom": "L'As du Fallafel",
    "categorie": "street-food / solo",
    "adresse": "34 Rue des Rosiers, 75004 Paris",
    "lat": 48.8574095,
    "lng": 2.3590493,
    "description": "falafel iconique du Marais, rapide, budget pluie.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "alloco"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.com/paris/en/feature/food/pariss-best-cheap-eats"
  },
  {
    "nom": "Chez Alain Miam Miam",
    "categorie": "street-food / sandwich",
    "adresse": "26 Rue Charlot, 75003 Paris",
    "lat": 48.8622747,
    "lng": 2.3619516,
    "description": "sandwich généreux du Marché des Enfants Rouges, très solo.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "alloco"
    ],
    "compagnies": [
      "solo",
      "duo"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.com/paris/en/feature/food/pariss-best-cheap-eats"
  },
  {
    "nom": "Miznon",
    "categorie": "street-food / pita",
    "adresse": "22 Rue des Ecouffes, 75004 Paris",
    "lat": 48.8571596,
    "lng": 2.3589213,
    "description": "pitas méditerranéennes, simple, efficace, bon solo/potos.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "alloco"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.eater.com/maps/best-restaurants-paris-france"
  },
  {
    "nom": "El Nopal",
    "categorie": "street-food / tacos",
    "adresse": "3 Rue Eugene Varlin, 75010 Paris",
    "lat": 48.877844,
    "lng": 2.3651419,
    "description": "tacos mexicains directs et abordables, parfait rotation allocco.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "alloco"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.com/paris/en/feature/food/pariss-best-cheap-eats"
  },
  {
    "nom": "Taco Mesa",
    "categorie": "street-food / tacos",
    "adresse": "40 Rue du Faubourg Poissonniere, 75010 Paris",
    "lat": 48.8736232,
    "lng": 2.3480462,
    "description": "tacos bien notés, plus confort que pur comptoir.",
    "meteo": "nuageux",
    "envies": [
      "alloco"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.tacomesa.fr/"
  },
  {
    "nom": "Petit Bao",
    "categorie": "street-food / bao",
    "adresse": "10 Rue Breguet, 75011 Paris",
    "lat": 48.8567411,
    "lng": 2.3720813,
    "description": "bao et dim sum, pratique solo ou potos.",
    "meteo": "nuageux",
    "envies": [
      "alloco",
      "resto"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.baofamily.co/"
  },
  {
    "nom": "Gros Bao",
    "categorie": "street-food / bao",
    "adresse": "72 Quai de Jemmapes, 75010 Paris",
    "lat": 48.8714265,
    "lng": 2.365705,
    "description": "grand spot chinois canal Saint-Martin, plus potos que comptoir.",
    "meteo": "nuageux",
    "envies": [
      "alloco",
      "resto"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.baofamily.co/"
  },
  {
    "nom": "Kodawari Ramen",
    "categorie": "solo counter / ramen",
    "adresse": "29 Rue Mazarine, 75006 Paris",
    "lat": 48.8546421,
    "lng": 2.3380705,
    "description": "ramen immersif, facile seul au comptoir, gros potentiel app solo.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "alloco",
      "resto"
    ],
    "compagnies": [
      "solo",
      "duo"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.kodawari-ramen.com/"
  },
  {
    "nom": "Udon Jubey",
    "categorie": "solo counter / udon",
    "adresse": "39 Rue Sainte-Anne, 75001 Paris",
    "lat": 48.8664423,
    "lng": 2.3355536,
    "description": "udon rue Sainte-Anne, très compatible manger seul.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "alloco",
      "resto"
    ],
    "compagnies": [
      "solo",
      "duo"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.com/paris/en/feature/food/pariss-best-cheap-eats"
  },
  {
    "nom": "Kintaro",
    "categorie": "solo counter / japonais",
    "adresse": "24 Rue Saint-Augustin, 75002 Paris",
    "lat": 48.8689261,
    "lng": 2.3348866,
    "description": "japonaise populaire, rapide, idéale solo.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "alloco",
      "resto"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.com/paris/en/feature/food/pariss-best-cheap-eats"
  },
  {
    "nom": "Neko Ramen",
    "categorie": "solo counter / ramen",
    "adresse": "6 Rue de la Grange Bateliere, 75009 Paris",
    "lat": 48.8731221,
    "lng": 2.3421505,
    "description": "ramen accessible, très bon usage solo/duo.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "alloco",
      "resto"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.com/paris/en/feature/food/pariss-best-cheap-eats"
  },
  {
    "nom": "Hakata Choten",
    "categorie": "solo counter / ramen",
    "adresse": "53 Rue des Petits Champs, 75001 Paris",
    "lat": 48.8671314,
    "lng": 2.334942,
    "description": "ramen central, petit budget, comptoir compatible.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "alloco",
      "resto"
    ],
    "compagnies": [
      "solo",
      "duo"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.com/paris/en/feature/food/pariss-best-cheap-eats"
  },
  {
    "nom": "TranTranZai",
    "categorie": "street-food / nouilles",
    "adresse": "94 Rue St Denis, 75001 Paris",
    "lat": 48.8631582,
    "lng": 2.3498973,
    "description": "nouilles sichuanaises, rapide, ouvert tard ven/sam.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "alloco",
      "resto"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.com/paris/en/feature/food/pariss-best-cheap-eats"
  },
  {
    "nom": "Pho Banh Cuon 14",
    "categorie": "street-food / vietnamien",
    "adresse": "129 Av. de Choisy, 75013 Paris",
    "lat": 48.826412,
    "lng": 2.3595345,
    "description": "pho populaire du 13e, efficace solo et petit budget.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "alloco",
      "resto"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.com/paris/en/feature/food/pariss-best-cheap-eats"
  },
  {
    "nom": "Best Tofu",
    "categorie": "cheap eat / chinois",
    "adresse": "9 Bd de la Villette, 75010 Paris",
    "lat": 48.872697,
    "lng": 2.3759497,
    "description": "très abordable, budget pluie fort.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "alloco",
      "resto"
    ],
    "compagnies": [
      "solo",
      "duo"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.com/paris/en/feature/food/pariss-best-cheap-eats"
  },
  {
    "nom": "Dumbo",
    "categorie": "street-food / burger",
    "adresse": "64 Rue Jean-Baptiste Pigalle, 75009 Paris",
    "lat": 48.8817097,
    "lng": 2.3369461,
    "description": "smash burger populaire, rapide, bon solo/potos.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "alloco"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.com/paris/en/feature/food/pariss-best-cheap-eats"
  },
  {
    "nom": "Bouillon Chartier Grands Boulevards",
    "categorie": "bouillon / pas cher",
    "adresse": "7 Rue du Faubourg Montmartre, 75009 Paris",
    "lat": 48.8719356,
    "lng": 2.3430137,
    "description": "classique budget pluie, service rapide, gros volume.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "resto"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.bouillon-chartier.com/"
  },
  {
    "nom": "Bouillon Republique",
    "categorie": "bouillon / pas cher",
    "adresse": "39 Bd du Temple, 75003 Paris",
    "lat": 48.8660094,
    "lng": 2.3646451,
    "description": "bouillon moderne, très bon rapport quantité/prix.",
    "meteo": "nuageux",
    "envies": [
      "tranquilo",
      "resto"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://bouillonlesite.com/bouillon-republique/"
  },
  {
    "nom": "Bouillon Pigalle",
    "categorie": "bouillon / pas cher",
    "adresse": "22 Bd de Clichy, 75018 Paris",
    "lat": 48.8826186,
    "lng": 2.3374142,
    "description": "grand bouillon à Pigalle, pratique tard et budget maîtrisé.",
    "meteo": "nuageux",
    "envies": [
      "tranquilo",
      "resto"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://bouillonlesite.com/bouillon-pigalle/"
  },
  {
    "nom": "Septime",
    "categorie": "gastro / date",
    "adresse": "80 Rue de Charonne, 75011 Paris",
    "lat": 48.8536026,
    "lng": 2.3809558,
    "description": "grande table contemporaine, recommandée pour duo ou pro sérieux.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://guide.michelin.com/en/fr/ile-de-france/paris/restaurants"
  },
  {
    "nom": "Clamato",
    "categorie": "resto / date",
    "adresse": "80 Rue de Charonne, 75011 Paris",
    "lat": 48.8536026,
    "lng": 2.3809558,
    "description": "seafood bar du groupe Septime, date cool mais budget élevé.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.eater.com/maps/best-restaurants-paris-france"
  },
  {
    "nom": "Frenchie Bar a Vins",
    "categorie": "wine bar / date",
    "adresse": "6 Rue du Nil, 75002 Paris",
    "lat": 48.8677971,
    "lng": 2.3479177,
    "description": "à vins reconnu rue du Nil, excellent pour duo et apéro dînatoire.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.eater.com/maps/best-restaurants-paris-france"
  },
  {
    "nom": "Le Mary Celeste",
    "categorie": "bar / date",
    "adresse": "1 Rue Commines, 75003 Paris",
    "lat": 48.8619727,
    "lng": 2.3657451,
    "description": "oysters, cocktails, vins; très bon premier date sans être trop formel.",
    "meteo": "nuageux",
    "envies": [
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.theworlds50best.com/discovery"
  },
  {
    "nom": "Bambino",
    "categorie": "resto / bar musical",
    "adresse": "25 Rue Saint-Sebastien, 75011 Paris",
    "lat": 48.8613507,
    "lng": 2.3698338,
    "description": "resto-bar musical, ambiance date/potos avec son et vinyles.",
    "meteo": "nuageux",
    "envies": [
      "resto",
      "apéro"
    ],
    "compagnies": [
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.eater.com/maps/best-restaurants-paris-france"
  },
  {
    "nom": "Early June",
    "categorie": "wine bar / date",
    "adresse": "19 Rue Jean Poulmarch, 75010 Paris",
    "lat": 48.8728964,
    "lng": 2.3632862,
    "description": "canal Saint-Martin, vins nature et chefs invités, date food.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.eater.com/maps/best-restaurants-paris-france"
  },
  {
    "nom": "Folderol",
    "categorie": "wine bar / ice cream",
    "adresse": "10 Rue du Grand Prieure, 75011 Paris",
    "lat": 48.8651683,
    "lng": 2.3690583,
    "description": "glace + vins nature, très bon solo/duo, original sans être lourd.",
    "meteo": "pluie",
    "envies": [
      "tranquilo",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.eater.com/maps/best-restaurants-paris-france"
  },
  {
    "nom": "Le Fumoir",
    "categorie": "brasserie / date / terrasse",
    "adresse": "6 Rue de l'Amiral de Coligny, 75001 Paris",
    "lat": 48.8605065,
    "lng": 2.340843,
    "description": "classique près du Louvre, bon pro/date, terrasse souvent utile.",
    "meteo": "nuageux",
    "envies": [
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.lefumoir.com/"
  },
  {
    "nom": "La Palette",
    "categorie": "cafe / terrasse classique",
    "adresse": "43 Rue de Seine, 75006 Paris",
    "lat": 48.8554133,
    "lng": 2.3368241,
    "description": "terrasse classique de Saint-Germain, bon duo/verre.",
    "meteo": "nuageux",
    "envies": [
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://lapalette-paris.com/"
  },
  {
    "nom": "Cafe de Flore",
    "categorie": "cafe / terrasse classique",
    "adresse": "172 Bd Saint-Germain, 75006 Paris",
    "lat": 48.8541278,
    "lng": 2.3325499,
    "description": "institution de Saint-Germain, terrasse connue, bon pro/touristique.",
    "meteo": "nuageux",
    "envies": [
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://cafedeflore.fr/"
  },
  {
    "nom": "Les Deux Magots",
    "categorie": "cafe / terrasse classique",
    "adresse": "6 Pl. Saint-Germain des Pres, 75006 Paris",
    "lat": 48.8542327,
    "lng": 2.33321,
    "description": "institution parisienne, terrasse et rendez-vous pro/duo.",
    "meteo": "nuageux",
    "envies": [
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://lesdeuxmagots.fr/"
  },
  {
    "nom": "Au Pied de Cochon",
    "categorie": "nocturne / brasserie",
    "adresse": "6 Rue Coquilliere, 75001 Paris",
    "lat": 48.8634867,
    "lng": 2.3437202,
    "description": "brasserie historique des Halles ouverte très tard, sécurisante pour nocturne.",
    "meteo": "nuageux",
    "envies": [
      "resto"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.pieddecochon.com/"
  },
  {
    "nom": "Le Tambour",
    "categorie": "nocturne / brasserie",
    "adresse": "41 Rue Montmartre, 75002 Paris",
    "lat": 48.8654459,
    "lng": 2.3447267,
    "description": "brasserie tardive, utile après cinéma/concert quand tout ferme.",
    "meteo": "nuageux",
    "envies": [
      "resto",
      "apéro"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.timeout.com/paris/en/bars-and-pubs/the-best-heated-terraces-in-paris"
  },
  {
    "nom": "L'Alsace",
    "categorie": "nocturne / brasserie",
    "adresse": "39 Av. des Champs-Elysees, 75008 Paris",
    "lat": 48.8699948,
    "lng": 2.305834,
    "description": "brasserie Champs-Elysées ouverte tard, utile en sortie pro/touristes.",
    "meteo": "nuageux",
    "envies": [
      "resto"
    ],
    "compagnies": [
      "solo",
      "duo",
      "potos",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://www.alsace-paris.com/"
  },
  {
    "nom": "Le Cinq",
    "categorie": "gastro palace",
    "adresse": "31 Av. George V, 75008 Paris",
    "lat": 48.868784,
    "lng": 2.3006774,
    "description": "grande table palace, niveau client pro/très grand soleil.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://guide.michelin.com/en/fr/ile-de-france/paris/restaurants"
  },
  {
    "nom": "Epicure",
    "categorie": "gastro palace",
    "adresse": "112 Rue du Faubourg Saint-Honore, 75008 Paris",
    "lat": 48.8716714,
    "lng": 2.3147666,
    "description": "grande table du Bristol, gastro très premium.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://guide.michelin.com/en/fr/ile-de-france/paris/restaurants"
  },
  {
    "nom": "Guy Savoy",
    "categorie": "gastro",
    "adresse": "11 Quai de Conti, 75006 Paris",
    "lat": 48.8564015,
    "lng": 2.3384956,
    "description": "grande table historique à la Monnaie de Paris.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://guide.michelin.com/en/fr/ile-de-france/paris/restaurants"
  },
  {
    "nom": "Arpege",
    "categorie": "gastro",
    "adresse": "84 Rue de Varenne, 75007 Paris",
    "lat": 48.855754,
    "lng": 2.3170135,
    "description": "table d'Alain Passard, légume et haute gastronomie.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://guide.michelin.com/en/fr/ile-de-france/paris/restaurants"
  },
  {
    "nom": "Le Clarence",
    "categorie": "gastro",
    "adresse": "31 Av. Franklin Delano Roosevelt, 75008 Paris",
    "lat": 48.8674115,
    "lng": 2.3099361,
    "description": "grande table raffinée, très pro/occasion spéciale.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://guide.michelin.com/en/fr/ile-de-france/paris/restaurants"
  },
  {
    "nom": "Plenitude",
    "categorie": "gastro palace",
    "adresse": "8 Quai du Louvre, 75001 Paris",
    "lat": 48.8588428,
    "lng": 2.3418987,
    "description": "très haut de gamme du Cheval Blanc, ultra premium.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://guide.michelin.com/en/fr/ile-de-france/paris/restaurants"
  },
  {
    "nom": "L'Oiseau Blanc",
    "categorie": "gastro rooftop",
    "adresse": "19 Av. Kleber, 75116 Paris",
    "lat": 48.8707617,
    "lng": 2.2931271,
    "description": "gastro en hauteur au Peninsula, vue Tour Eiffel.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": true,
    "surLeau": false,
    "source": "https://guide.michelin.com/en/fr/ile-de-france/paris/restaurants"
  },
  {
    "nom": "Datil",
    "categorie": "gastro contemporain",
    "adresse": "13 Rue des Gravilliers, 75003 Paris",
    "lat": 48.8636106,
    "lng": 2.3573521,
    "description": "table contemporaine de Manon Fleury, gastro durable.",
    "meteo": "soleil",
    "envies": [
      "resto",
      "gastro"
    ],
    "compagnies": [
      "duo",
      "pro"
    ],
    "rooftop": false,
    "surLeau": false,
    "source": "https://guide.michelin.com/en/fr/ile-de-france/paris/restaurants"
  }
]
