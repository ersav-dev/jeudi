import { useRef, useState, lazy, Suspense, type ComponentProps } from 'react'
// ════════════════════════════════════════════════════════════════
// jeudi. — « et le tirage ? »
// L'étape qui suit le verdict : on ouvre la pellicule du téléphone et on
// repêche les photos de la nuit. C'est le geste qui remplit le carnet de
// vraies preuves — sans lui, la carte du cercle reste vide.
//
// On n'ouvre PAS l'appareil photo (pas de `capture`) : le système ouvre la
// galerie, déjà triée, les photos d'hier soir en haut. Le tri par soirée,
// c'est jeudi qui le fait après, sur la date EXIF — et il le DIT quand une
// photo n'en est pas. Jamais de rejet muet.
// ════════════════════════════════════════════════════════════════
import type { PhotoLieu } from './db'
import { IAppareil } from './icones'
import { t } from './langue'
import { srcPhoto, photoIndisponible } from './photos'
import {
  fenetreSoiree,
  estDeLaSoiree,
  heureTirage,
  preparerTirage,
  type FenetreSoiree,
} from './tirage'
// `import type` (et pas `import { type … }`) : avec verbatimModuleSyntax, la
// seconde forme laisse un `import './ImportBobine'` nu dans le JS émis — une
// arête STATIQUE qui coexiste avec le lazy ci-dessous, et le bundler recolle
// alors la chambre noire dans le chunk principal. Le type, lui, s'efface.
import type { BobinePrete } from './ImportBobine'
import { libelleDuree } from './super8'

// la chambre noire du super 8 ne sert qu'à la bobine qui vient d'arriver — chargée à la demande
const ImportBobineLazy = lazy(() => import('./ImportBobine'))
function ImportBobine(p: ComponentProps<typeof ImportBobineLazy>) {
  return (
    <Suspense fallback={null}>
      <ImportBobineLazy {...p} />
    </Suspense>
  )
}

/** une heure de séchage : la photo devient publique après (voir 0010) */
const SECHAGE_MS = 3600_000

/** ce fichier est-il une vidéo ? (le type mime d'abord, le nom en repli) */
const estVideo = (f: File) => f.type.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(f.name)

interface Choisi {
  blob: Blob
  priseLe: Date
  /** dans la fenêtre de la soirée ? */
  dedans: boolean
  /** présent = c'est un clip super 8 : blob est alors son photogramme */
  bobine?: BobinePrete
}

export default function TirageDuSoir({
  nomLieu,
  dateSortie,
  mien,
  onFini,
  onPasser,
}: {
  nomLieu: string
  /** la date de la sortie qu'on est en train de valider (ISO) */
  dateSortie: string
  /** le spot est-il à moi ? seul ce cas monte au cloud (RLS : photos de MES
   *  lieux) — ailleurs le tirage reste dans le carnet, sur ce téléphone. */
  mien: boolean
  onFini: (tirages: PhotoLieu[]) => void
  onPasser: () => void
}) {
  const [fen] = useState<FenetreSoiree>(() => fenetreSoiree(dateSortie))
  const [choisis, setChoisis] = useState<Choisi[]>([])
  const [couv, setCouv] = useState(0)
  const [garderHors, setGarderHors] = useState(false)
  const [developpe, setDeveloppe] = useState(0)
  const [refuses, setRefuses] = useState(0)
  // les vidéos passent une à une par la bobine (réglette + chambre noire)
  const [bobines, setBobines] = useState<File[]>([])

  const ouvrir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichiers = [...(e.target.files ?? [])]
    e.target.value = '' // reprendre la pellicule une deuxième fois reste possible
    if (!fichiers.length) return
    const videos = fichiers.filter(estVideo)
    const images = fichiers.filter((f) => !estVideo(f))
    if (videos.length) setBobines((prev) => [...prev, ...videos])
    if (!images.length) return
    setDeveloppe(images.length)
    setRefuses(0)
    const pris: Choisi[] = []
    let kos = 0
    for (const f of images) {
      try {
        const tir = await preparerTirage(f)
        pris.push({ blob: tir.blob, priseLe: tir.priseLe, dedans: estDeLaSoiree(tir.priseLe, fen) })
      } catch {
        kos++ // fichier illisible (HEIC exotique, image morte) : on le dit, on continue
      }
    }
    // la soirée d'abord, dans l'ordre où elle s'est passée ; les intruses en fin
    pris.sort((a, b) => Number(b.dedans) - Number(a.dedans) || +a.priseLe - +b.priseLe)
    setChoisis((prev) => [...prev, ...pris])
    setCouv(0)
    setRefuses(kos)
    setDeveloppe(0)
  }

  /** une bobine sort de la chambre noire : elle rejoint la planche */
  const bobineFinie = (b: BobinePrete) => {
    setChoisis((prev) => [
      ...prev,
      { blob: b.clip.photogramme, priseLe: b.priseLe, dedans: b.dedans, bobine: b },
    ])
    setBobines((prev) => prev.slice(1))
  }

  const dedans = choisis.filter((c) => c.dedans).length
  const hors = choisis.length - dedans
  const retenus = choisis.filter((c) => garderHors || c.dedans)
  const mot = (n: number) => (n > 1 ? t('tirages') : t('tirage'))

  const ecarter = (i: number) => {
    setChoisis((prev) => prev.filter((_, k) => k !== i))
    setCouv((c) => (i < c ? c - 1 : c === i ? 0 : c))
  }

  // même langue que le reste du carnet : tap court = choisir, appui long = retirer
  const minuteur = useRef<number | null>(null)
  const longue = useRef(false)
  const pressDebut = (i: number) => {
    longue.current = false
    minuteur.current = window.setTimeout(() => {
      longue.current = true
      navigator.vibrate?.(20)
      ecarter(i)
    }, 550)
  }
  const pressFin = () => {
    if (minuteur.current) window.clearTimeout(minuteur.current)
  }

  // la couverture d'abord : c'est elle qui ira au-dessus du tas sur la carte
  const valider = () => {
    const couverture = choisis[couv]
    const ordre = [
      ...(couverture && retenus.includes(couverture) ? [couverture] : []),
      ...retenus.filter((c) => c !== couverture),
    ]
    onFini(
      ordre.map((c) => ({
        type: 'soir' as const,
        blob: c.blob,
        priseLe: c.priseLe.toISOString(),
        visibleLe: new Date(c.priseLe.getTime() + SECHAGE_MS).toISOString(),
        // le super 8 : blob est le photogramme, la vidéo part à côté
        ...(c.bobine
          ? {
              clipBlob: c.bobine.clip.clipBlob,
              clipMime: c.bobine.clip.clipMime,
              clipDureeS: c.bobine.clip.clipDureeS,
              reglagesRendu: c.bobine.reglages,
            }
          : {}),
      })),
    )
  }

  // ── une vidéo attend son tour : la bobine passe devant tout ────
  if (bobines.length) {
    return (
      <ImportBobine
        key={bobines.length}
        fichier={bobines[0]}
        fen={fen}
        onFini={bobineFinie}
        onPasser={() => setBobines((prev) => prev.slice(1))}
      />
    )
  }

  // ── la demande : un cadre vide qu'on tend ─────────────────────
  if (!choisis.length) {
    return (
      <div className="tirage">
        <h1 className="grande-question">{t('et le tirage ?')}</h1>
        <p className="hand tirage-sous">{t('t’as forcément pris une photo, hier soir.')}</p>

        <label className="tirage-tendu">
          <span className="tirage-kraft" />
          <span className="tirage-fenetre">
            <IAppareil taille={22} />
          </span>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            hidden
            disabled={developpe > 0}
            onChange={(e) => void ouvrir(e)}
          />
          <span className="hand tirage-pied">{t('ouvrir ma pellicule')}</span>
        </label>

        <p className="mono tirage-aide">
          {t('elle s’ouvre sur hier soir — tes photos les plus récentes sont en haut.')}
        </p>
        <p className="mono tirage-aide">
          {t('une vidéo aussi : elle deviendra une bobine de 10 secondes.')}
        </p>
        {developpe > 0 && (
          <p className="mono tirage-attente" role="status">
            {t('on développe…')} {developpe}
          </p>
        )}
        {refuses > 0 && (
          <p className="mono tirage-aide">
            {refuses} {mot(refuses)} {t('n’ont pas pu être développés.')}
          </p>
        )}
        <div className="validation-secondaires">
          <button className="lien" onClick={onPasser}>
            {t('je n’ai rien pris.')}
          </button>
        </div>
      </div>
    )
  }

  // ── la planche contact ────────────────────────────────────────
  return (
    <div className="tirage">
      <h1 className="grande-question">
        {retenus.length} {mot(retenus.length)}.
      </h1>
      <p className="hand tirage-sous">
        {/* le nom d'abord : « au bisou » / « à chez Momo » — aucune préposition
            ne marche pour tous les noms de spots */}
        {dedans ? `${nomLieu}, ${t('la nuit dernière.')}` : t('aucun n’est d’hier soir — à toi de voir.')}
      </p>

      <div className="tirage-planche">
        {choisis.map((c, i) => {
          const gardee = garderHors || c.dedans
          return (
            <button
              type="button"
              key={i}
              className={`tirage-vue${c.dedans ? '' : ' hors'}${gardee ? '' : ' ecartee'}${
                i === couv && gardee ? ' couv' : ''
              }${c.bobine ? ' pf' : ''}`}
              aria-label={`${c.bobine ? `${t('bobine')}, ` : ''}${heureTirage(c.priseLe)}${
                i === couv ? ` — ${t('sur la carte')}` : ''
              }`}
              aria-pressed={i === couv && gardee}
              onClick={() => {
                if (!longue.current && gardee) setCouv(i)
              }}
              onPointerDown={() => pressDebut(i)}
              onPointerUp={pressFin}
              onPointerLeave={pressFin}
              onPointerCancel={pressFin}
              onContextMenu={(e) => e.preventDefault()}
            >
              <img src={srcPhoto(c)} alt="" onError={photoIndisponible} />
              <span className="hand tirage-heure">
                {heureTirage(c.priseLe)}
                {c.bobine ? ` · ${libelleDuree(c.bobine.clip.clipDureeS)}` : ''}
              </span>
            </button>
          )
        })}
      </div>

      <p className="mono tirage-aide">
        {t('tape un tirage : c’est lui qui ira sur la carte · reste appuyé : l’écarter.')}
      </p>

      {hors > 0 && (
        <div className="tirage-hors">
          <p className="hand tirage-sous">
            {hors} {mot(hors)} {hors > 1 ? t('ne sont pas d’hier soir.') : t('n’est pas d’hier soir.')}
          </p>
          <p className="mono tirage-aide">{t('jeudi les a reconnus à l’heure de prise de vue.')}</p>
          <div className="tirage-rang">
            <button
              className={`tirage-choix ${garderHors ? 'choisi' : ''}`}
              onClick={() => setGarderHors(true)}
            >
              {t('les garder')}
            </button>
            <button
              className={`tirage-choix ${garderHors ? '' : 'choisi'}`}
              onClick={() => {
                setGarderHors(false)
                if (choisis[couv] && !choisis[couv].dedans) {
                  const j = choisis.findIndex((c) => c.dedans)
                  setCouv(j < 0 ? 0 : j)
                }
              }}
            >
              {t('les écarter')}
            </button>
          </div>
        </div>
      )}

      <p className="mono tirage-aide tirage-promesse">
        {mien
          ? t('ils sèchent une heure avant d’apparaître sur la carte du cercle.')
          : t('ils restent dans ton carnet, sur ce téléphone.')}
        <br />
        {t('ni le lieu ni l’heure inscrits dans le fichier ne partent — seulement l’image.')}
      </p>

      <button className="valider" disabled={!retenus.length} onClick={valider}>
        {retenus.length ? t('c’est dans la boîte.') : t('aucun tirage')}
      </button>
      <div className="validation-secondaires">
        <button className="lien" onClick={onPasser}>
          {t('finalement, non.')}
        </button>
      </div>
    </div>
  )
}
