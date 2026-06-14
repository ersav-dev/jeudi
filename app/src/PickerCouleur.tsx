import { useRef, useState } from 'react'

// ── le picker de couleur de marque ─────────────────────────────
// deux niveaux : d'abord des suggestions au goût sûr (les Pantone de
// l'année + le rouge cire du carnet), puis une roue HSV qui s'ouvre
// pour ceux qui veulent leur teinte exacte. l'aperçu est live (onChange
// appelle appliquerCouleur côté appelant).

// les suggestions : Pantone récents (peach fuzz 24, viva magenta 23,
// very peri 22, classic blue 20…) + des teintes qui tiennent sur le
// papier charbon. la 1re reste le rouge cire d'origine.
export const SUGGESTIONS: { hex: string; nom: string }[] = [
  { hex: '#a8322a', nom: 'rouge cire' },
  { hex: '#ffbe98', nom: 'peach fuzz' }, // Pantone 2024
  { hex: '#bb2649', nom: 'viva magenta' }, // Pantone 2023
  { hex: '#6667ab', nom: 'very peri' }, // Pantone 2022
  { hex: '#34568b', nom: 'classic blue' }, // Pantone 2020
  { hex: '#e0996f', nom: 'terre cuite' },
  { hex: '#3e8e6e', nom: 'sapin' },
  { hex: '#c99a2e', nom: 'laiton' },
]

// ── conversions HSV ⇄ hex ──────────────────────────────────────
function hsvVersHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    const c = v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(5)}${f(3)}${f(1)}`
}

function hexVersHsv(hex: string): { h: number; s: number; v: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return { h: 0, s: 0, v: 0.66 }
  const n = parseInt(m[1], 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  return { h, s, v: max }
}

export default function PickerCouleur({
  valeur,
  onChange,
}: {
  valeur: string
  onChange: (hex: string) => void
}) {
  const [roue, setRoue] = useState(false)
  const hsv = hexVersHsv(valeur)
  const [v, setV] = useState(hsv.v) // luminosité, réglée au slider
  const disque = useRef<HTMLDivElement>(null)

  const choisirDansLaRoue = (e: React.PointerEvent) => {
    const el = disque.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const rayonMax = r.width / 2
    let h = (Math.atan2(dy, dx) * 180) / Math.PI
    if (h < 0) h += 360
    const s = Math.min(1, Math.hypot(dx, dy) / rayonMax)
    onChange(hsvVersHex(h, s, v))
  }

  const onPointer = (e: React.PointerEvent) => {
    if (e.buttons === 0 && e.type === 'pointermove') return
    e.currentTarget.setPointerCapture(e.pointerId)
    choisirDansLaRoue(e)
  }

  // position du curseur sur le disque (pour le petit point témoin)
  const angle = (hsv.h * Math.PI) / 180
  const rayon = hsv.s * 50 // en %
  const px = 50 + Math.cos(angle) * rayon
  const py = 50 + Math.sin(angle) * rayon

  return (
    <div className="picker">
      <div className="picker-suggestions">
        {SUGGESTIONS.map((c) => (
          <button
            key={c.hex}
            className={`palette-swatch ${valeur.toLowerCase() === c.hex ? 'on' : ''}`}
            style={{ background: c.hex }}
            aria-label={c.nom}
            title={c.nom}
            aria-pressed={valeur.toLowerCase() === c.hex}
            onClick={() => onChange(c.hex)}
          />
        ))}
      </div>

      <button
        type="button"
        className="picker-toggle mono"
        aria-expanded={roue}
        onClick={() => setRoue((r) => !r)}
      >
        {roue ? '– refermer la roue' : '+ ma teinte exacte'}
      </button>

      {roue && (
        <div className="picker-roue-bloc">
          <div
            ref={disque}
            className="picker-roue"
            onPointerDown={onPointer}
            onPointerMove={onPointer}
            style={{ filter: `brightness(${0.4 + v * 0.6})` }}
          >
            <span className="picker-curseur" style={{ left: `${px}%`, top: `${py}%` }} />
          </div>
          <input
            type="range"
            className="picker-lum"
            min={0.3}
            max={1}
            step={0.01}
            value={v}
            onChange={(e) => {
              const nv = Number(e.target.value)
              setV(nv)
              onChange(hsvVersHex(hsv.h, hsv.s, nv))
            }}
            aria-label="luminosité"
          />
          <span className="picker-hex mono">{valeur.toLowerCase()}</span>
        </div>
      )}
    </div>
  )
}
