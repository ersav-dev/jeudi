import { useEffect, useMemo, useState } from 'react'
import {
  type Lieu,
  type Envie,
  ENVIES,
  lireFavoris,
  lireVus,
  formatDistance,
  distanceM,
} from './db'
import { rechercher, pourToi, profilDeGout, type Requete } from './recherche'
import { POINTS_REPERE, type Repere } from './autour'
import { chercherAdresse } from './nominatim'
import { chargerStations, chercherStations, stationsChargees, type Station } from './stations'

// le glyphe du point de rendez-vous : un rond visé au trait, dans le
// graphite des monuments — jamais un pin plein (réservé aux spots)
const RDV_GLYPHE =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
  '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/></svg>'
import { estCeLeGrandJeudi, joursAvantGrandJeudi } from './grandJeudi'
import CroquisParis from './CroquisParis'
import { srcPhoto, photoIndisponible } from './photos'
import { IAppareil } from './icones'
import { t, lireLangue, glose } from './langue'

// L'onglet « trouver » (ex-labo, promu à part entière) : le moteur de
// recherche/reco personnalisé. Philosophie (CONCEPT.md) : la recherche RÉPOND
// (pull) → tout le public, mais confiance d'abord, et « ça répond, ça ne
// liste pas » (sans intention = pour toi).
export default function Recherche({
  lieux,
  cercle,
  onOuvrir,
}: {
  lieux: Lieu[]
  /** le VRAI cercle (ids + prénoms) — la confiance d'abord dans le tri */
  cercle: string[]
  onOuvrir?: (l: Lieu) => void
}) {
  const [texte, setTexte] = useState('')
  // debounce 200 ms : le moteur ne tourne pas à chaque frappe
  const [texteRetarde, setTexteRetarde] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setTexteRetarde(texte), 200)
    return () => clearTimeout(t)
  }, [texte])

  const [envie, setEnvie] = useState<Envie | null>(null)
  const [ouvertSeul, setOuvertSeul] = useState(false)
  // « sur l'eau » : péniches, guinguettes, quais — la Seine du croquis et la
  // chip posent le MÊME état (jamais un filtre fantôme)
  const [eauSeule, setEauSeule] = useState(false)
  // « quand ? » — chercher pour un AUTRE moment que maintenant : ce soir,
  // demain soir, ou l'heure précise. Change l'évaluation ouvert/fermé et le
  // lexique implicite du moteur (le paramètre `maintenant` de recherche.ts).
  type Quand = 'maintenant' | 'cesoir' | 'demain' | 'perso'
  const [quand, setQuand] = useState<Quand>('maintenant')
  const [persoJour, setPersoJour] = useState(0) // 0 = aujourd'hui, 1 = demain…
  const [persoDemiHeure, setPersoDemiHeure] = useState(40) // 40 = 20h00 (l'heure du soir)
  // « autour de » : null = ma position, sinon un repère choisi
  const [depuis, setDepuis] = useState<Repere | null>(null)
  const [adr, setAdr] = useState('')
  // l'état de la recherche d'adresse (Nominatim) — visible, jamais silencieux
  const [etatAdr, setEtatAdr] = useState<'off' | 'cherche' | 'introuvable' | 'reseau'>('off')

  // ── les stations, en local ────────────────────────────────────────────
  // 581 stations dans l'appareil : « Edgar Quinet » n'a plus à traverser le
  // réseau. On les charge une fois, en fond ; Nominatim reste le filet pour
  // tout ce qui n'est pas une station (une adresse, un monument).
  const [stationsPretes, setStationsPretes] = useState(false)
  useEffect(() => {
    let vivant = true
    chargerStations().then(() => vivant && setStationsPretes(true))
    return () => { vivant = false }
  }, [])
  // les propositions pendant la frappe : un balayage de 581 entrées, immédiat.
  // (stationsPretes n'est lu que pour recalculer une fois la table arrivée)
  const propositions = useMemo(
    () => (stationsPretes ? chercherStations(adr, stationsChargees(), 5) : []),
    [adr, stationsPretes],
  )
  const choisirStation = (s: Station) => {
    setDepuis({ nom: s.nom, lat: s.lat, lng: s.lng })
    setAdr('')
    setEtatAdr('off')
  }

  // favoris / vus : relus à CHAQUE retour sur l'écran (focus / onglet visible),
  // pas seulement au premier mount — ils ont pu changer depuis un autre écran.
  const [favoris, setFavoris] = useState<string[]>(() => lireFavoris())
  const [vus, setVus] = useState<string[]>(() => lireVus())
  useEffect(() => {
    const relire = () => {
      setFavoris(lireFavoris())
      setVus(lireVus())
    }
    window.addEventListener('focus', relire)
    document.addEventListener('visibilitychange', relire)
    return () => {
      window.removeEventListener('focus', relire)
      document.removeEventListener('visibilitychange', relire)
    }
  }, [])

  // les habitudes : déduites des tampons (validé/bof) + favoris + vus
  const gout = useMemo(() => {
    const valides = lieux.filter((l) => l.tampon?.v === 'valide')
    const bofs = lieux.filter((l) => l.tampon?.v === 'bof')
    return profilDeGout({ valides, bofs, favoris, vus })
  }, [lieux, favoris, vus])

  // a-t-on une intention ? (un mot, une envie, un filtre) — sinon « pour toi »
  const aIntention =
    texteRetarde.trim().length > 0 || envie !== null || ouvertSeul || eauSeule

  // point stabilisé (même référence tant que `depuis` ne change pas) : le
  // useMemo des résultats ne recalcule plus à chaque rendu
  const point = useMemo(
    () => (depuis ? { lat: depuis.lat, lng: depuis.lng } : undefined),
    [depuis],
  )

  // le moment de la recherche : maintenant (défaut), ce soir 20h, demain soir,
  // ou le jour + l'heure choisis à la molette. Tout « ouvert/fermé » et le
  // classement du moteur s'évaluent À CE MOMENT-LÀ. (20h = l'heure où une
  // soirée commence — même réglage que moment.ts / HEURE_SOIR.)
  const dateEffective = useMemo(() => {
    const d = new Date()
    if (quand === 'cesoir') d.setHours(20, 0, 0, 0)
    else if (quand === 'demain') {
      d.setDate(d.getDate() + 1)
      d.setHours(20, 0, 0, 0)
    } else if (quand === 'perso') {
      d.setDate(d.getDate() + persoJour)
      d.setHours(Math.floor(persoDemiHeure / 2), (persoDemiHeure % 2) * 30, 0, 0)
    }
    return d
  }, [quand, persoJour, persoDemiHeure])

  const resultats = useMemo(() => {
    // « sur l'eau » restreint le vivier AVANT le moteur (péniches, quais…)
    const vivier = eauSeule ? lieux.filter((l) => l.surLeau) : lieux
    // sans intention : on ne LISTE pas le catalogue → « pour toi » (court)
    if (!aIntention)
      return pourToi(vivier, gout, { exclureVus: vus, topN: 12, cercle, depuis: point }, dateEffective)
    // avec intention : on RÉPOND (peu, ciblé, confiance d'abord, autour du repère)
    const req: Requete = {
      texte: texteRetarde.trim() || undefined,
      envies: envie ? [envie] : undefined,
      ouvertSeulement: ouvertSeul,
    }
    return rechercher(vivier, req, gout, cercle, point, dateEffective).slice(0, 15)
  }, [lieux, texteRetarde, envie, ouvertSeul, eauSeule, gout, cercle, aIntention, point, vus, dateEffective])

  const lancerAdresse = async () => {
    const q = adr.trim()
    if (!q) return
    // une station d'abord : c'est dans l'appareil, c'est instantané, et ça
    // marche sans réseau. Nominatim ne sert que si ce n'en est pas une.
    const locale = chercherStations(q, stationsChargees(), 1)[0]
    if (locale) return choisirStation(locale)
    setEtatAdr('cherche')
    const r = await chercherAdresse(q)
    if (r.ok) {
      setDepuis({ nom: q, lat: r.lieux[0].lat, lng: r.lieux[0].lng })
      setAdr('')
      setEtatAdr('off')
    } else if (r.raison === 'annule') {
      // une recherche plus récente est partie : on la laisse conclure
    } else {
      setEtatAdr(r.raison)
    }
  }

  // V5 bloc 4 : les styles inline (pilules 999px, coins 8-10px, corps hors
  // échelle) ont migré vers les classes .labo-* en fin d'index.css
  const chip = (actif: boolean) => `labo-chip${actif ? ' on' : ''}`

  // la promesse du grand jeudi : une ligne, pas un bouton (le jour J, c'est
  // la bannière — posée par App — qui prend le relais)
  const joursGJ = joursAvantGrandJeudi(new Date())

  return (
    <div style={{ color: 'var(--ivory)' }}>
      {/* l'en-tête d'onglet : la voix serif, la glose mono */}
      <h2 className="labo-titre">{t('trouver.')}</h2>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.6, margin: '0 0 14px' }}>
        {t('dis ce que tu cherches, jeudi répond')}
      </p>

      <input
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder={t('un nom, un quartier, une ambiance…')}
        className="labo-champ"
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, margin: '12px 0' }}>
        {ENVIES.map((e) => (
          <button key={e} className={chip(envie === e)} onClick={() => setEnvie(envie === e ? null : e)}>
            {e}
          </button>
        ))}
        <button className={chip(ouvertSeul)} onClick={() => setOuvertSeul((v) => !v)}>
          {t('ouvert')}
        </button>
        <button className={chip(eauSeule)} onClick={() => setEauSeule((v) => !v)}>
          {t("sur l'eau")}
        </button>
      </div>

      {/* la glose du mot choisi : une note griffonnée dans la marge — le
          lexique s'apprend au moment où on s'en sert (panel : UX + novices) */}
      {envie && glose(envie) && (
        <p className="hand chip-glose">
          {envie} — {glose(envie)}
        </p>
      )}

      {/* « quand ? » — le soir se prépare : chercher pour maintenant (défaut),
          ce soir, demain soir, ou poser le jour et l'heure à la molette */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginBottom: 6 }}>
        {t('quand')}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12, alignItems: 'center' }}>
        {(
          [
            ['maintenant', t('maintenant')],
            ['cesoir', t('ce soir')],
            ['demain', t('demain soir')],
            ['perso', t('à l’heure près')],
          ] as const
        ).map(([k, label]) => (
          <button key={k} className={chip(quand === k)} onClick={() => setQuand(k)}>
            {label}
          </button>
        ))}
        {quand === 'perso' && (
          <span className="labo-quand-molettes">
            <select
              className="labo-molette"
              value={persoJour}
              onChange={(e) => setPersoJour(Number(e.target.value))}
              aria-label={t('quel jour ?')}
            >
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date()
                d.setDate(d.getDate() + i)
                const nom =
                  i === 0
                    ? t('aujourd’hui')
                    : i === 1
                      ? t('demain')
                      : d.toLocaleDateString(lireLangue() === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'long', day: 'numeric' })
                return (
                  <option key={i} value={i}>
                    {nom}
                  </option>
                )
              })}
            </select>
            <select
              className="labo-molette"
              value={persoDemiHeure}
              onChange={(e) => setPersoDemiHeure(Number(e.target.value))}
              aria-label={t('à quelle heure ?')}
            >
              {Array.from({ length: 48 }, (_, i) => (
                <option key={i} value={i}>
                  {`${Math.floor(i / 2)}h${i % 2 ? '30' : ''}`}
                </option>
              ))}
            </select>
          </span>
        )}
      </div>

      {/* la ville en un coup d'œil : le croquis choisit la MÊME chose que les
          chips « autour de » — un seul état (depuis), deux façons de le poser.
          Un repère GÉOCODÉ (métro/adresse tapés) n'est pas une zone : il se
          pose en marqueur — la carte accuse réception, « on est sûr ». */}
      <CroquisParis
        lieux={lieux}
        actif={depuis?.nom ?? null}
        onChoisir={(nom) => {
          const p = POINTS_REPERE.find((r) => r.nom === nom)
          if (p) setDepuis(depuis?.nom === p.nom ? null : p)
        }}
        eauActive={eauSeule}
        onEau={() => setEauSeule((v) => !v)}
        marqueur={depuis && !POINTS_REPERE.some((p) => p.nom === depuis.nom) ? depuis : null}
      />

      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginBottom: 6 }}>
        {t('autour de')}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
        <button className={chip(depuis === null)} onClick={() => setDepuis(null)}>
          {t('ici')}
        </button>
        {POINTS_REPERE.map((p) => (
          <button
            key={p.nom}
            className={chip(depuis?.nom === p.nom)}
            onClick={() => setDepuis(depuis?.nom === p.nom ? null : p)}
          >
            {p.nom}
          </button>
        ))}
      </div>
      <input
        value={adr}
        onChange={(e) => {
          setAdr(e.target.value)
          setEtatAdr('off') // on retape → l'ancien message ne colle plus
        }}
        onKeyDown={(e) => e.key === 'Enter' && lancerAdresse()}
        placeholder={t('…ou une adresse / un métro (Entrée)')}
        className="labo-champ petit"
        style={{ marginBottom: propositions.length ? 6 : etatAdr === 'off' ? 14 : 4 }}
      />
      {/* les stations reconnues pendant la frappe — locales, donc immédiates.
          Entrée prend la première ; on peut aussi en toucher une autre. */}
      {propositions.length > 0 && (
        <div className="rech-stations">
          {propositions.map((s) => (
            <button
              key={`${s.nom}|${s.lat}`}
              type="button"
              className="rech-station"
              data-mode={s.type}
              onClick={() => choisirStation(s)}
            >
              {s.type === 'monument' && s.trait ? (
                // le monument porte sa silhouette monoline, pas une plaque
                <span className="rech-monument" dangerouslySetInnerHTML={{ __html: s.trait }} />
              ) : s.type === 'repere' ? (
                // le point de rendez-vous : un rond visé, dessiné au trait
                <span className="rech-monument" dangerouslySetInnerHTML={{ __html: RDV_GLYPHE }} />
              ) : (
                <span className="rech-station-mode">
                  {s.type === 'rer' ? 'RER' : s.type === 'tram' ? 'T' : 'M'}
                </span>
              )}
              {s.nom}
              {/* le point précis : la phrase qui évite le « t'es où ? » */}
              {s.rdv && <span className="rech-rdv">{s.rdv}</span>}
            </button>
          ))}
        </div>
      )}
      {etatAdr !== 'off' && (
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            marginBottom: 14,
            opacity: 0.75,
            color: etatAdr === 'cherche' ? 'var(--ivory)' : 'var(--red)',
          }}
        >
          {etatAdr === 'cherche'
            ? t('je cherche…')
            : etatAdr === 'introuvable'
              ? t('introuvable par ici. essaie plus précis.')
              : t('pas de réseau on dirait. réessaie dans un instant.')}
        </div>
      )}

      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5, marginBottom: 8 }}>
        {aIntention
          ? `${resultats.length} ${t(resultats.length > 1 ? 'réponses' : 'réponse')}`
          : t('pour toi · tape ou choisis une envie pour chercher')}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {resultats.map(({ lieu, raisons }) => (
          <div
            key={lieu.id}
            onClick={() => onOuvrir?.(lieu)}
            className="labo-resultat rech-ligne"
            style={{ cursor: onOuvrir ? 'pointer' : 'default' }}
          >
            {/* le tirage : une preuve vaut mieux qu'un nom (audit du 02/08) —
                sans photo, le cadre vide invite au lieu de mentir */}
            {lieu.photos.length > 0 ? (
              <img
                className="rech-tirage"
                src={srcPhoto(lieu.photos[0])}
                alt=""
                loading="lazy"
                decoding="async"
                onError={photoIndisponible}
              />
            ) : (
              <span className="rech-tirage rech-tirage-vide">
                <IAppareil taille={15} />
              </span>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <span className="labo-nom">{lieu.nom}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.6, whiteSpace: 'nowrap' }}>
                  {formatDistance(distanceM(lieu, point))}
                </span>
              </div>
              {raisons.length > 0 && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--red)', marginTop: 4 }}>
                  {raisons.join(' · ')}
                </div>
              )}
            </div>
          </div>
        ))}
        {resultats.length === 0 && (
          <p style={{ opacity: 0.5, fontStyle: 'italic' }}>{t('rien sous la main. essaie une autre envie.')}</p>
        )}
      </div>

      {/* le grand jeudi : pas un bouton, une promesse (le 1ᵉʳ jeudi du mois) */}
      {!estCeLeGrandJeudi(new Date()) && (
        <p className="mono gj-promesse">
          {t('le grand jeudi')} · {t('dans')} {joursGJ} {t(joursGJ > 1 ? 'jours' : 'jour')}
        </p>
      )}
    </div>
  )
}
