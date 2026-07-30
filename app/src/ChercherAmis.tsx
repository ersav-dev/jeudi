import { useEffect, useRef, useState } from 'react'
import {
  chercherProfils,
  demandesEnvoyees,
  envoyerDemande,
  type MembreCercle,
} from './db'
import { t, lireLangue } from './langue'

// ── « retrouve quelqu'un » — la recherche d'amis par prénom ─────
// Le geste Instagram, à la sauce carnet : tape un prénom, s'il est sur
// jeudi tu le vois (sa vitrine publique : prénom, portrait, son truc) et tu
// demandes. La demande atterrit dans SA cloche ; le cercle attend son oui.
// Complète le lien d'invitation (pour ceux qui n'ont pas encore l'app).
export default function ChercherAmis({ idsCercle }: { idsCercle: string[] }) {
  const [terme, setTerme] = useState('')
  const [resultats, setResultats] = useState<MembreCercle[]>([])
  const [cherche, setCherche] = useState(false)
  // vers qui MA demande est déjà partie (chargé une fois + enrichi au fil des taps)
  const [envoyees, setEnvoyees] = useState<Set<string>>(new Set())
  const [msg, setMsg] = useState<string | null>(null)
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    demandesEnvoyees().then((ids) => setEnvoyees(new Set(ids)))
  }, [])

  // debounce 400 ms : on ne mitraille pas Supabase à chaque frappe.
  // tout le setState vit DANS le minuteur (pas de setState synchrone d'effet)
  useEffect(() => {
    if (minuteur.current) clearTimeout(minuteur.current)
    const q = terme.trim()
    minuteur.current = setTimeout(
      () => {
        if (q.length < 2) {
          setResultats([])
          setCherche(false)
          return
        }
        setCherche(true)
        chercherProfils(q).then((r) => {
          setResultats(r)
          setCherche(false)
        })
      },
      q.length < 2 ? 0 : 400,
    )
    return () => {
      if (minuteur.current) clearTimeout(minuteur.current)
    }
  }, [terme])

  const demander = async (m: MembreCercle) => {
    setMsg(null)
    try {
      await envoyerDemande(m.id)
      setEnvoyees((prev) => new Set(prev).add(m.id))
      setMsg(
        lireLangue() === 'fr'
          ? `ta demande est partie chez ${m.prenom.toLowerCase()}.`
          : `your request is on its way to ${m.prenom.toLowerCase()}.`,
      )
    } catch (e) {
      // les messages d'envoyerDemande sont déjà en français et lisibles
      setMsg(e instanceof Error ? e.message : 'la demande n’est pas partie. réessaie.')
    }
  }

  const dansCercle = new Set(idsCercle)
  const vide = terme.trim().length >= 2 && !cherche && resultats.length === 0

  return (
    <div className="cherche-ami">
      <input
        className="cherche-ami-champ"
        placeholder={t('retrouve quelqu’un — tape son prénom')}
        value={terme}
        onChange={(e) => setTerme(e.target.value)}
        autoComplete="off"
      />
      {cherche && <p className="mono cherche-ami-etat">{t('on cherche…')}</p>}
      {vide && (
        <p className="cherche-ami-vide">
          {t('personne à ce prénom — envoie-lui plutôt ton lien d’invitation.')}
        </p>
      )}
      {resultats.length > 0 && (
        <ul className="cherche-ami-liste">
          {resultats.map((m) => {
            const deja = dansCercle.has(m.id)
            const partie = envoyees.has(m.id)
            return (
              <li key={m.id} className="cherche-ami-ligne">
                {m.photoUrl ? (
                  <img className="cherche-ami-photo" src={m.photoUrl} alt="" loading="lazy" />
                ) : (
                  <span className="exlibris-initiale">{m.prenom[0]}</span>
                )}
                <span className="cherche-ami-corps">
                  <span className="membre-nom">{m.prenom}</span>
                  {m.critere && <span className="mono cherche-ami-critere">son truc : {m.critere}</span>}
                </span>
                {deja ? (
                  <span className="mono cherche-ami-statut">{t('dans ton cercle')}</span>
                ) : partie ? (
                  <span className="mono cherche-ami-statut">{t('demandé ✓')}</span>
                ) : (
                  <button className="cherche-ami-demander" onClick={() => demander(m)}>
                    {t('demander')}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {msg && <p className="mono cherche-ami-etat">{msg}</p>}
    </div>
  )
}
