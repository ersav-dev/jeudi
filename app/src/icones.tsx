// icônes à l'encre, single-line — la DA interdit les émojis dans le chrome
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const Svg = ({ children, taille = 20 }: { children: React.ReactNode; taille?: number }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" {...S} aria-hidden>
    {children}
  </svg>
)

export const ICadenas = ({ taille }: { taille?: number }) => (
  <Svg taille={taille}><rect x="6" y="11" width="12" height="9" rx="1.5" /><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" /></Svg>
)
export const ICercle = ({ taille }: { taille?: number }) => (
  <Svg taille={taille}><circle cx="9" cy="9" r="3" /><circle cx="16.5" cy="10" r="2.4" /><path d="M4.5 19c.6-3 2.6-4.5 4.5-4.5S13 16 13.5 19M13.8 18.6c.4-2.2 1.6-3.4 2.9-3.4 1.3 0 2.4 1.1 2.8 3.2" /></Svg>
)
export const IGlobe = ({ taille }: { taille?: number }) => (
  <Svg taille={taille}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.4 3.6 5.3 3.6 8.5s-1.1 6.1-3.6 8.5c-2.5-2.4-3.6-5.3-3.6-8.5s1.1-6.1 3.6-8.5z" /></Svg>
)
export const IEtincelle = ({ taille }: { taille?: number }) => (
  <Svg taille={taille}><path d="M12 3.5 13.8 9.8 20 12l-6.2 2.2L12 20.5 10.2 14.2 4 12l6.2-2.2z" /></Svg>
)
export const ICarnet = ({ taille }: { taille?: number }) => (
  <Svg taille={taille}><rect x="6" y="4" width="13" height="16" rx="1.5" /><path d="M9.5 4v16M12.5 8.5h3.5M12.5 11.5h3.5" /></Svg>
)
export const IAppareil = ({ taille }: { taille?: number }) => (
  <Svg taille={taille}><rect x="4" y="7" width="16" height="13" rx="1.5" /><path d="M9 7l1.4-2.5h3.2L15 7" /><circle cx="12" cy="13.5" r="3.4" /></Svg>
)
export const ISoleil = ({ taille }: { taille?: number }) => (
  <Svg taille={taille}><circle cx="12" cy="12" r="4" /><path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M5.6 18.4l1.7-1.7M16.7 7.3l1.7-1.7" /></Svg>
)
export const INuage = ({ taille }: { taille?: number }) => (
  <Svg taille={taille}><path d="M7 17.5a4 4 0 0 1 .6-7.9 5 5 0 0 1 9.6 1.4 3.3 3.3 0 0 1-.5 6.5z" /></Svg>
)
export const IPluie = ({ taille }: { taille?: number }) => (
  <Svg taille={taille}><path d="M7 14a4 4 0 0 1 .6-7.9 5 5 0 0 1 9.6 1.4A3.3 3.3 0 0 1 16.7 14z" /><path d="M9 17l-1 3M13 17l-1 3M17 17l-1 3" /></Svg>
)
export const IPosition = ({ taille }: { taille?: number }) => (
  <Svg taille={taille}><path d="M12 21s-6.5-6.2-6.5-10.7a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z" /><circle cx="12" cy="10" r="2.3" /></Svg>
)
// le ballon (Coupe du monde) : on y voit les matchs
export const IBallon = ({ taille }: { taille?: number }) => (
  <Svg taille={taille}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.2l3.4 2.5-1.3 4h-4.2l-1.3-4z" />
    <path d="M12 7.2V4.2M15.4 9.7l2.8-1M14.1 13.7l1.8 2.4M9.9 13.7l-1.8 2.4M8.6 9.7l-2.8-1" />
  </Svg>
)
// le refuge anti-foot : un toit/abri, on y échappe au match
export const IRefuge = ({ taille }: { taille?: number }) => (
  <Svg taille={taille}>
    <path d="M4 11l8-6 8 6" />
    <path d="M6.5 9.6V19h11V9.6" />
    <path d="M10 19v-4.5h4V19" />
  </Svg>
)
// la cloche des notifications (amis qui t'ajoutent + lieux à noter)
export const ICloche = ({ taille }: { taille?: number }) => (
  <Svg taille={taille}>
    <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 3h16z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </Svg>
)
// le tampon (profil) : un cadre incliné, comme le logo "jeudi" frappé
export const ITampon = ({ taille }: { taille?: number }) => (
  <Svg taille={taille}>
    <g transform="rotate(-8 12 12)">
      <rect x="5" y="7.5" width="14" height="9" rx="1.5" />
      <path d="M8.5 11h7M8.5 13.4h4.5" />
    </g>
  </Svg>
)
// le signet (favoris) : un marque-page corné. plein = gardé sous la main.
// pas une étoile/note — juste « celui-là, je le retrouve vite ».
export const ISignet = ({ taille, plein }: { taille?: number; plein?: boolean }) => (
  <svg
    width={taille ?? 20}
    height={taille ?? 20}
    viewBox="0 0 24 24"
    fill={plein ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M7 4h10v16l-5-3.5L7 20z" />
  </svg>
)
// le trombone (favoris) : « je le clipse, je le garde » — écho au trombone du
// portrait profil. pas de remplissage (c'est un fil de fer) : actif = trait
// plus appuyé + couleur de marque (gérée en CSS).
export const ITrombone = ({ taille, actif }: { taille?: number; actif?: boolean }) => (
  <svg
    width={taille ?? 20}
    height={taille ?? 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={actif ? 2.1 : 1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M20.5 11.2l-8.7 8.7a5.6 5.6 0 0 1-7.9-7.9l8.7-8.7a3.7 3.7 0 0 1 5.3 5.3l-8.7 8.7a1.85 1.85 0 0 1-2.6-2.6l8-8" />
  </svg>
)
