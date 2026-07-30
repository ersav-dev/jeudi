import { useState } from 'react'
import { t } from './langue'

// ── « mets jeudi sur ton écran d'accueil » — le guide en 3 gestes ──
// Le mur des novices (panel : « sans ma fille à côté, je referme ») et des
// 80 % d'installs perdues (dev mobile) : personne ne connaît le geste PWA.
// Affiché sur l'écran d'entrée tant que l'app n'est pas installée ; se range
// d'un tap (et ne revient pas — localStorage).
const CLE_VU = 'jeudi-install-vu'

function estInstallee(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari iOS expose navigator.standalone (hors spec)
    (navigator as { standalone?: boolean }).standalone === true
  )
}

export default function GuideInstallation() {
  const [range, setRange] = useState(() => {
    try {
      return localStorage.getItem(CLE_VU) === '1'
    } catch {
      return false
    }
  })
  const [ouvert, setOuvert] = useState(false)

  if (range || estInstallee()) return null

  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const etapes = ios
    ? [
        t('ouvre ce site dans Safari (pas Chrome)'),
        t('tape le bouton partager (le carré avec la flèche, en bas)'),
        t('choisis « Sur l’écran d’accueil » — et voilà, jeudi est une app'),
      ]
    : [
        t('ouvre le menu ⋮ du navigateur (en haut à droite)'),
        t('choisis « Ajouter à l’écran d’accueil » / « Installer l’application »'),
        t('confirme — et voilà, jeudi est une app'),
      ]

  const ranger = () => {
    try {
      localStorage.setItem(CLE_VU, '1')
    } catch {
      /* navigation privée */
    }
    setRange(true)
  }

  return (
    <div className="guide-install">
      {!ouvert ? (
        <button type="button" className="lien guide-install-ouvrir" onClick={() => setOuvert(true)}>
          {t('mets jeudi sur ton écran d’accueil →')}
        </button>
      ) : (
        <div className="guide-install-panneau">
          <ol className="mono guide-install-etapes">
            {etapes.map((e, i) => (
              <li key={i}>
                <span className="takeout-num">{i + 1}</span>
                <span>{e}</span>
              </li>
            ))}
          </ol>
          <button type="button" className="lien" onClick={ranger}>
            {t('c’est fait (ou plus tard)')}
          </button>
        </div>
      )}
    </div>
  )
}
