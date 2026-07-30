import { useEffect } from 'react'

// ── designALT · le reflet spéculaire du polaroïd (maquette papier-nuit) ──
// la lumière glisse sur le tirage : souris (desktop) ou inclinaison du
// téléphone (gyroscope, DeviceOrientationEvent). throttlé rAF — on pose
// juste --gx/--gy sur <html>, seuls les éléments .gloss les lisent.
export function useReflet(actif: boolean) {
  useEffect(() => {
    if (!actif) return
    const racine = document.documentElement
    let raf = 0
    const pose = (px: number, py: number) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        racine.style.setProperty('--gx', `${(Math.max(0, Math.min(1, px)) * 100).toFixed(1)}%`)
        racine.style.setProperty('--gy', `${(Math.max(0, Math.min(1, py)) * 100).toFixed(1)}%`)
      })
    }
    const surSouris = (e: PointerEvent) =>
      pose(e.clientX / window.innerWidth, e.clientY / window.innerHeight)
    const surTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      pose((e.gamma + 45) / 90, (e.beta - 10) / 70)
    }
    window.addEventListener('pointermove', surSouris, { passive: true })
    // iOS demande une permission (geste utilisateur requis) ; Android : direct
    type DOE = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> }
    const DOEv = (
      typeof DeviceOrientationEvent !== 'undefined' ? DeviceOrientationEvent : undefined
    ) as DOE | undefined
    let tiltBranche = false
    const brancheTilt = () => {
      window.addEventListener('deviceorientation', surTilt)
      tiltBranche = true
    }
    const surGeste = () => {
      DOEv?.requestPermission?.()
        .then((s) => {
          if (s === 'granted') brancheTilt()
        })
        .catch(() => {})
    }
    if (DOEv?.requestPermission) {
      window.addEventListener('pointerdown', surGeste, { once: true })
    } else if (DOEv) {
      brancheTilt()
    }
    return () => {
      window.removeEventListener('pointermove', surSouris)
      window.removeEventListener('pointerdown', surGeste)
      if (tiltBranche) window.removeEventListener('deviceorientation', surTilt)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [actif])
}
