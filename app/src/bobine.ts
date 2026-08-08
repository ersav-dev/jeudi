// ════════════════════════════════════════════════════════════════
// jeudi. — LE DÉVELOPPEMENT D'UNE BOBINE (la partie DOM du super 8)
// On rejoue l'extrait choisi sur un canvas 720p et on le recapture au
// MediaRecorder : la durée est garantie (10 s max) ET toutes les
// vidéos ressortent normalisées (fini le zoo HEVC 4K / MOV / 60fps),
// ~3-5 Mo par clip. Le photogramme (première frame) est saisi au
// passage : c'est LUI qui vivra dans la pellicule comme une photo.
//
// Effet de bord voulu, comme le tirage : les métadonnées du fichier
// (GPS compris) ne survivent pas au réencodage. Seule l'image part.
//
// Le son EST capturé (routé par l'AudioContext, haut-parleurs
// silencieux pendant le développement) : la projection est muette par
// défaut, mais l'icône son du projecteur doit avoir quelque chose à
// réveiller. Si l'audio échoue (vieux navigateur), le clip part muet.
// ════════════════════════════════════════════════════════════════
import { DUREE_MAX_S, COTE_MAX_CLIP, QUALITE_PHOTOGRAMME, choisirMime } from './super8'

export interface Bobine {
  /** la vidéo réencodée, prête pour le bucket `clips` */
  clipBlob: Blob
  clipMime: string
  clipDureeS: number
  /** la première frame en JPEG — la photo qui vivra dans la pellicule */
  photogramme: Blob
}

/** attend un événement une fois — rejette sur 'error' de l'élément */
function attendre(el: HTMLMediaElement, evt: string): Promise<void> {
  return new Promise((res, rej) => {
    const ok = () => {
      el.removeEventListener('error', ko)
      res()
    }
    const ko = () => {
      el.removeEventListener(evt, ok)
      rej(new Error('vidéo illisible'))
    }
    el.addEventListener(evt, ok, { once: true })
    el.addEventListener('error', ko, { once: true })
  })
}

/** ouvre le fichier dans un <video> hors écran, métadonnées chargées.
 *  L'appelant DOIT appeler fermer() (révoque l'object URL). */
export async function ouvrirVideo(
  f: File,
): Promise<{ video: HTMLVideoElement; dureeS: number; fermer: () => void }> {
  const url = URL.createObjectURL(f)
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.playsInline = true
  video.src = url
  await attendre(video, 'loadedmetadata')
  const dureeS = Number.isFinite(video.duration) ? video.duration : 0
  return {
    video,
    dureeS,
    fermer: () => {
      video.pause()
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(url)
    },
  }
}

/** la bande de la réglette : n petites vignettes régulièrement
 *  espacées, en data-URL JPEG (léger, jetable) */
export async function vignettesReglette(video: HTMLVideoElement, n = 6): Promise<string[]> {
  const duree = video.duration
  if (!Number.isFinite(duree) || duree <= 0) return []
  const h = 96
  const w = Math.max(1, Math.round((video.videoWidth / video.videoHeight) * h) || h)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return []
  video.muted = true
  const vignettes: string[] = []
  for (let i = 0; i < n; i++) {
    // jamais la toute fin (frame souvent noire) : on s'arrête à 92 %
    video.currentTime = (duree * 0.92 * i) / Math.max(1, n - 1)
    try {
      await attendre(video, 'seeked')
    } catch {
      break
    }
    ctx.drawImage(video, 0, 0, w, h)
    vignettes.push(c.toDataURL('image/jpeg', 0.55))
  }
  return vignettes
}

/** la frame à `tempsS` en JPEG plein cadre (aperçu de la réglette) */
export async function frameA(video: HTMLVideoElement, tempsS: number): Promise<string | null> {
  video.muted = true
  video.currentTime = tempsS
  try {
    await attendre(video, 'seeked')
  } catch {
    return null
  }
  const r = Math.min(1, COTE_MAX_CLIP / Math.max(video.videoWidth, video.videoHeight))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(video.videoWidth * r))
  c.height = Math.max(1, Math.round(video.videoHeight * r))
  const ctx = c.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(video, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.7)
}

/** développe la fenêtre [debutS, debutS + 10 s max] : rejoue sur un
 *  canvas 720p, recapture au MediaRecorder, saisit le photogramme.
 *  `onAvancement` reçoit 0..1 (la barre « ça se développe… »).
 *  Se met en pause quand l'onglet passe en arrière-plan (le canvas ne
 *  peint plus) et reprend au retour. Jette si la vidéo est illisible. */
export async function developperBobine(
  f: File,
  debutS: number,
  onAvancement?: (p: number) => void,
): Promise<Bobine> {
  const { video, dureeS, fermer } = await ouvrirVideo(f)
  try {
    const finS = Math.min(dureeS || DUREE_MAX_S, debutS + DUREE_MAX_S)
    const aDevelopper = Math.max(0.5, finS - debutS)

    const r = Math.min(1, COTE_MAX_CLIP / Math.max(video.videoWidth, video.videoHeight))
    const c = document.createElement('canvas')
    c.width = Math.max(2, Math.round((video.videoWidth * r) / 2) * 2) // pairs : les encodeurs préfèrent
    c.height = Math.max(2, Math.round((video.videoHeight * r) / 2) * 2)
    const ctx = c.getContext('2d')
    if (!ctx) throw new Error('canvas indisponible')

    // ── le son : routé vers le flux, PAS vers les haut-parleurs ──
    video.muted = false
    video.volume = 1
    const flux = c.captureStream(30)
    let actx: AudioContext | null = null
    try {
      actx = new AudioContext()
      const source = actx.createMediaElementSource(video)
      const sortie = actx.createMediaStreamDestination()
      source.connect(sortie) // et PAS vers actx.destination : silence
      const piste = sortie.stream.getAudioTracks()[0]
      if (piste) flux.addTrack(piste)
    } catch {
      video.muted = true // pas d'AudioContext : le clip part muet
    }

    const mime = choisirMime()
    const enregistreur = new MediaRecorder(flux, {
      mimeType: mime,
      videoBitsPerSecond: 2_500_000,
      audioBitsPerSecond: 96_000,
    })
    const morceaux: BlobPart[] = []
    enregistreur.ondataavailable = (e) => {
      if (e.data.size) morceaux.push(e.data)
    }
    const fini = new Promise<void>((res) => {
      enregistreur.onstop = () => res()
    })

    // ── premier arrêt sur image : le photogramme ─────────────────
    video.currentTime = debutS
    await attendre(video, 'seeked')
    ctx.drawImage(video, 0, 0, c.width, c.height)
    const photogramme = await new Promise<Blob | null>((res) =>
      c.toBlob(res, 'image/jpeg', QUALITE_PHOTOGRAMME),
    )
    if (!photogramme) throw new Error('développement impossible')

    // ── la projection de travail : on peint chaque frame ─────────
    let vivant = true
    const peindre = () => {
      if (!vivant) return
      ctx.drawImage(video, 0, 0, c.width, c.height)
      onAvancement?.(Math.min(1, (video.currentTime - debutS) / aDevelopper))
      if (video.currentTime >= finS || video.ended) {
        vivant = false
        if (enregistreur.state !== 'inactive') enregistreur.stop()
        video.pause()
        return
      }
      if ('requestVideoFrameCallback' in video) {
        video.requestVideoFrameCallback(peindre)
      } else {
        requestAnimationFrame(peindre)
      }
    }

    // arrière-plan : le canvas ne peint plus → on met tout en pause
    const surVisibilite = () => {
      if (!vivant) return
      if (document.hidden) {
        video.pause()
        if (enregistreur.state === 'recording') enregistreur.pause()
      } else {
        if (enregistreur.state === 'paused') enregistreur.resume()
        void video.play().catch(() => {})
        peindre()
      }
    }
    document.addEventListener('visibilitychange', surVisibilite)

    try {
      enregistreur.start(500)
      await video.play()
      peindre()
      await fini
    } finally {
      vivant = false
      document.removeEventListener('visibilitychange', surVisibilite)
      void actx?.close().catch(() => {})
    }

    const clipBlob = new Blob(morceaux, { type: mime.split(';')[0] })
    if (!clipBlob.size) throw new Error('développement impossible')
    return {
      clipBlob,
      clipMime: mime.split(';')[0],
      clipDureeS: Math.round(aDevelopper * 10) / 10,
      photogramme,
    }
  } finally {
    fermer()
  }
}
