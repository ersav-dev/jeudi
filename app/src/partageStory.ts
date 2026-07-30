import { type Lieu } from './db'
import { srcPhoto } from './photos'

// ── LA CARTE DE STORY : le spot devient un objet à poster ───────
// Demande n°1 du panel (influenceuse, ado, étudiante, growth) : un visuel
// vertical 9:16 style carnet — photo en tirage à bord blanc, tip manuscrit,
// tampon rouge incliné, l'adresse de l'app — généré en canvas et poussé dans
// navigator.share (repli : téléchargement). Aucune lib, aucun serveur.

const L = 1080
const H = 1920

/** dessine le texte multi-ligne, renvoie le y final */
function ecrire(
  ctx: CanvasRenderingContext2D,
  texte: string,
  x: number,
  y: number,
  maxL: number,
  interligne: number,
): number {
  const mots = texte.split(' ')
  let ligne = ''
  for (const mot of mots) {
    const essai = ligne ? `${ligne} ${mot}` : mot
    if (ctx.measureText(essai).width > maxL && ligne) {
      ctx.fillText(ligne, x, y)
      y += interligne
      ligne = mot
    } else {
      ligne = essai
    }
  }
  if (ligne) ctx.fillText(ligne, x, y)
  return y + interligne
}

/** la photo du lieu, si elle veut bien (CORS/hors-ligne : on fait sans) */
function chargerPhoto(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    setTimeout(() => resolve(null), 4000) // une story n'attend pas
    img.src = url
  })
}

export async function genererCarteStory(lieu: Lieu): Promise<Blob | null> {
  // les fontes du carnet doivent être prêtes avant de peindre
  try {
    await Promise.all([
      document.fonts.load("64px 'Caveat'"),
      document.fonts.load("italic 56px 'Instrument Serif'"),
      document.fonts.load("28px 'JetBrains Mono'"),
    ])
  } catch {
    /* fontes système en repli : la carte reste digne */
  }

  const canvas = document.createElement('canvas')
  canvas.width = L
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // le papier charbon
  ctx.fillStyle = '#14120e'
  ctx.fillRect(0, 0, L, H)

  // le tirage à bord blanc (polaroid), légèrement incliné
  const photo = await chargerPhoto(srcPhoto(lieu.photos[0] ?? {}))
  const tw = 880
  const th = 880
  const tx = (L - tw) / 2
  const ty = 260
  ctx.save()
  ctx.translate(L / 2, ty + th / 2)
  ctx.rotate(-0.017) // ~-1° : posé à la main
  ctx.translate(-L / 2, -(ty + th / 2))
  ctx.fillStyle = '#efe9d8'
  ctx.fillRect(tx - 28, ty - 28, tw + 56, th + 132) // le bord blanc, plus épais en bas
  if (photo) {
    // cover : on remplit le cadre sans déformer
    const r = Math.max(tw / photo.width, th / photo.height)
    const sw = tw / r
    const sh = th / r
    ctx.drawImage(photo, (photo.width - sw) / 2, (photo.height - sh) / 2, sw, sh, tx, ty, tw, th)
  } else {
    ctx.fillStyle = '#1c1913'
    ctx.fillRect(tx, ty, tw, th)
    ctx.fillStyle = 'rgba(239,233,216,0.5)'
    ctx.font = "italic 44px 'Instrument Serif', serif"
    ctx.textAlign = 'center'
    ctx.fillText('— pas encore de photo —', L / 2, ty + th / 2)
    ctx.textAlign = 'left'
  }
  // le nom, écrit sur le bord blanc du tirage
  ctx.fillStyle = '#14120e'
  ctx.font = "italic 52px 'Instrument Serif', serif"
  ctx.textAlign = 'center'
  ctx.fillText(lieu.nom, L / 2, ty + th + 72, tw)
  ctx.textAlign = 'left'
  ctx.restore()

  // le tip manuscrit (ma note, sinon la voix du cercle)
  const tip = lieu.note?.trim() || lieu.tipsCercle?.[0]?.note?.trim() || ''
  const auteur = lieu.note?.trim() ? '' : (lieu.tipsCercle?.[0]?.auteur ?? '')
  let y = ty + th + 210
  if (tip) {
    ctx.fillStyle = '#efe9d8'
    ctx.font = "64px 'Caveat', cursive"
    y = ecrire(ctx, `« ${tip} »`, 120, y, L - 240, 78)
    if (auteur) {
      ctx.font = "28px 'JetBrains Mono', monospace"
      ctx.fillStyle = 'rgba(239,233,216,0.6)'
      ctx.fillText(`— ${auteur.toLowerCase()}`, 120, y + 8)
    }
  }

  // le tampon rouge incliné, en bas — la signature de l'objet
  const couleur =
    getComputedStyle(document.documentElement).getPropertyValue('--red').trim() || '#a8322a'
  ctx.save()
  ctx.translate(L / 2, H - 250)
  ctx.rotate(-0.035)
  ctx.strokeStyle = couleur
  ctx.lineWidth = 7
  ctx.font = "italic 700 88px 'Instrument Serif', serif"
  ctx.fillStyle = couleur
  ctx.textAlign = 'center'
  const larg = ctx.measureText('Jeudi.').width
  ctx.strokeRect(-larg / 2 - 36, -78, larg + 72, 118)
  ctx.fillText('Jeudi.', 0, 12)
  ctx.restore()
  ctx.font = "30px 'JetBrains Mono', monospace"
  ctx.fillStyle = 'rgba(239,233,216,0.55)'
  ctx.textAlign = 'center'
  ctx.fillText('jeudi-seven.vercel.app', L / 2, H - 110)
  ctx.textAlign = 'left'

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}

/** génère + partage (share natif, repli téléchargement). true = parti. */
export async function partagerEnStory(lieu: Lieu): Promise<boolean> {
  const blob = await genererCarteStory(lieu)
  if (!blob) return false
  const fichier = new File([blob], 'jeudi-story.png', { type: 'image/png' })
  if (navigator.canShare?.({ files: [fichier] })) {
    try {
      await navigator.share({ files: [fichier], text: `${lieu.nom} — jeudi. je dis où.` })
      return true
    } catch {
      return false // partage annulé : pas un échec à afficher
    }
  }
  // repli desktop : on télécharge l'image
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'jeudi-story.png'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
  return true
}
