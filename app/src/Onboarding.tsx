import { useRef, useState } from 'react'
import { sauverProfil, lireCouleur, appliquerCouleur } from './db'
import { ISoleil, INuage, IPluie } from './icones'
import PickerCouleur from './PickerCouleur'

// ── "le swipe, c'est ta langue ?" ──────────────────────────────
// Trois canaux de réponse ouverts en même temps. Le canal choisi
// EST la réponse : swipe = 100, clic = 75, écrit = 0.

const CRITERES = ['la lumière', 'le bruit', 'les chaises', 'la playlist', 'le staff', 'les wc']

// on entre par les curateurs : ta carte n'est jamais vide le premier soir.
// suivre = un acte de goût ("je sors comme Léa"), jamais un abonnement passif.
const CURATEURS = [
  { prenom: 'Karim', titre: 'éclaireur du 10e', truc: 'le bruit' },
  { prenom: 'Léa', titre: 'curatrice · 47 spots', truc: 'la lumière' },
  { prenom: 'Sofia', titre: 'éclaireuse du 3e', truc: 'le comptoir' },
  { prenom: 'Inès', titre: 'curatrice · 61 spots', truc: 'la bougie' },
]

export default function Onboarding({ onFini }: { onFini: () => void }) {
  const [drag, setDrag] = useState({ x: 0, actif: false })
  const [etape, setEtape] = useState<
    'question' | 'couleur' | 'critere' | 'curateurs' | 'argent'
  >('question')
  const [couleur, setCouleur] = useState(() => lireCouleur())
  const [score, setScore] = useState(100)
  const [chambre, setChambre] = useState<string | null>(null)
  const [critere, setCritere] = useState('')
  const [naissance, setNaissance] = useState('1991-03-06') // pré-rempli (Ersan)
  const [reponseEcrite, setReponseEcrite] = useState('')
  // qui tu suis : pré-cochés (on entre par les curateurs), mais tu décides
  const [suivis, setSuivis] = useState<string[]>(() => CURATEURS.map((c) => c.prenom))
  // les seuils € du porte-monnaie, réglés ici : pluie < s1 · nuageux s1–s2 · soleil s2+
  const [s1, setS1] = useState('20')
  const [s2, setS2] = useState('50')
  const depart = useRef(0)

  const repondre = (s: number, pique?: string) => {
    setScore(s)
    if (pique) setChambre(pique)
    setEtape('couleur')
  }

  const choisirCouleur = (c: string) => {
    setCouleur(c)
    appliquerCouleur(c) // aperçu live : tout l'écran se recolore
  }

  const basculerSuivi = (p: string) =>
    setSuivis((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))

  const terminer = async () => {
    await sauverProfil({
      scoreSwipe: score,
      critere: critere.trim() || 'le feeling',
      prenom: 'Ersan',
      naissance: naissance || undefined,
    })
    localStorage.setItem('jeudi-couleur', couleur)
    localStorage.setItem('jeudi-suivis', JSON.stringify(suivis))
    // les seuils € (garde-fous : s1 < s2, valeurs positives, sinon défauts)
    const n1 = Number(s1) || 20
    const n2 = Number(s2) || 50
    const seuils = n1 < n2 ? [n1, n2] : [20, 50]
    localStorage.setItem('jeudi-seuils', JSON.stringify(seuils))
    localStorage.setItem('jeudi-onboard', 'fait')
    onFini()
  }

  if (etape === 'couleur') {
    return (
      <div className="onboard">
        <div className="tampon-logo">Jeudi.</div>
        <h1 className="grande-question">ta couleur de Jeudi.</h1>
        <p className="hand onboard-sous">
          le tampon, c'est toi. choisis l'encre — tu pourras la changer plus tard.
        </p>
        <PickerCouleur valeur={couleur} onChange={choisirCouleur} />
        <button className="valider" onClick={() => setEtape('critere')}>
          c'est mon encre.
        </button>
      </div>
    )
  }

  if (etape === 'argent') {
    const n1 = Number(s1) || 0
    const n2 = Number(s2) || 0
    const ok = n1 > 0 && n2 > n1
    return (
      <div className="onboard">
        <div className="tampon-logo">Jeudi.</div>
        <h1 className="grande-question">la météo de ton porte-monnaie.</h1>
        <p className="hand onboard-sous">
          on ne te demande jamais ton budget à voix haute. règle tes seuils une fois — par
          personne, un plat + une boisson, ou deux verres au bar.
        </p>
        <div className="onboard-seuils">
          <label className="mono">
            <IPluie taille={15} /> ça coûte rien — moins de
            <input
              className="onboard-euro"
              type="number"
              inputMode="numeric"
              value={s1}
              onChange={(e) => setS1(e.target.value)}
            />
            €
          </label>
          <label className="mono">
            <INuage taille={15} /> ça va — entre {n1 || '…'} et
            <input
              className="onboard-euro"
              type="number"
              inputMode="numeric"
              value={s2}
              onChange={(e) => setS2(e.target.value)}
            />
            €
          </label>
          <p className="mono onboard-seuil-soleil">
            <ISoleil taille={15} /> on flambe — plus de {n2 || '…'} €
          </p>
          {!ok && <p className="mono onboard-erreur">le 2ᵉ seuil doit être plus grand que le 1er.</p>}
        </div>

        <p className="hand onboard-sous onboard-regles-titre">les règles de la maison :</p>
        <ul className="onboard-regles mono">
          <li>aucun lieu ne paie pour apparaître. jamais.</li>
          <li>pas de notes, pas d'étoiles — des tips, pas des avis.</li>
          <li>publier un lieu = tes propres photos (le lieu, ton verre… et les wc).</li>
          <li>ton cercle reste petit, exprès. on entre sur invitation.</li>
        </ul>

        <button className="valider" onClick={terminer} disabled={!ok}>
          c'est dit. j'entre.
        </button>
      </div>
    )
  }

  if (etape === 'curateurs') {
    return (
      <div className="onboard">
        <div className="tampon-logo">Jeudi.</div>
        <h1 className="grande-question">tu sors comme qui ?</h1>
        <p className="hand onboard-sous">
          suis quelques éclaireurs — leur carte devient la tienne, dès ce soir.
        </p>
        <ul className="onboard-curateurs">
          {CURATEURS.map((c) => {
            const suivi = suivis.includes(c.prenom)
            return (
              <li
                key={c.prenom}
                className={`onboard-curateur ${suivi ? 'suivi' : ''}`}
                role="button"
                aria-pressed={suivi}
                onClick={() => basculerSuivi(c.prenom)}
              >
                <div className="onboard-curateur-tete">
                  <span className="membre-nom">{c.prenom}</span>
                </div>
                <span className="mono onboard-curateur-truc">
                  juge {c.truc} · {suivi ? 'tu suis ✓' : 'suivre'}
                </span>
              </li>
            )
          })}
        </ul>
        <button className="valider" onClick={() => setEtape('argent')}>
          {suivis.length > 0 ? `continuer (${suivis.length} suivis)` : 'je commence seul'}
        </button>
      </div>
    )
  }

  if (etape === 'critere') {
    return (
      <div className="onboard">
        <div className="tampon-logo">Jeudi.</div>
        {chambre && <p className="mono onboard-chambre">{chambre}</p>}
        <h1 className="grande-question">c'est quoi ton truc ?</h1>
        <p className="hand onboard-sous">le détail que tu remarques toujours, partout.</p>
        <div className="onboard-criteres">
          {CRITERES.map((c) => (
            <button
              key={c}
              className={`mot ${critere === c ? 'entouré' : ''}`}
              onClick={() => setCritere(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <input
          className="onboard-input"
          placeholder="ou écris le tien…"
          value={CRITERES.includes(critere) ? '' : critere}
          onChange={(e) => setCritere(e.target.value)}
        />
        <label className="onboard-naissance mono">
          ta date de naissance
          <input
            type="date"
            max="2012-12-31"
            value={naissance}
            onChange={(e) => setNaissance(e.target.value)}
          />
        </label>
        <button className="valider" onClick={() => setEtape('curateurs')}>
          continuer
        </button>
      </div>
    )
  }

  return (
    <div className="onboard">
      <div className="tampon-logo">Jeudi.</div>
      <h1 className="grande-question">le swipe, c'est ta langue ?</h1>
      <p className="hand onboard-sous">réponds comme tu veux. on s'adapte.</p>

      <div
        className="onboard-carte"
        style={{
          transform: `translateX(${drag.x}px) rotate(${drag.x / 14}deg)`,
          transition: drag.actif ? 'none' : 'transform .3s ease',
        }}
        onPointerDown={(e) => {
          depart.current = e.clientX
          setDrag({ x: 0, actif: true })
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => drag.actif && setDrag({ x: e.clientX - depart.current, actif: true })}
        onPointerUp={() => {
          if (Math.abs(drag.x) > 90) repondre(100)
          setDrag({ x: 0, actif: false })
        }}
      >
        <span className="onboard-oui">OUI</span>
      </div>

      <div className="onboard-boutons">
        <button className="visi-choix" onClick={() => repondre(75)}>
          non
        </button>
        <button className="visi-choix" onClick={() => repondre(75)}>
          oui
        </button>
      </div>

      <input
        className="onboard-input"
        placeholder="ou écris-le, si t'insistes…"
        value={reponseEcrite}
        onChange={(e) => setReponseEcrite(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') repondre(0, 'noté. au stylo plume, donc.')
        }}
      />
    </div>
  )
}
