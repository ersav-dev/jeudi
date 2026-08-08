// ════════════════════════════════════════════════════════════════
// jeudi. — L'ÉCRAN SUPER 8 : l'habillage projeté, jamais cuit.
// Enveloppe n'importe quel média (video, img) des couches du rendu :
//   · la chambre noire (grain, vignette, teinte, tremblement) — les
//     réglages de l'utilisateur ;
//   · l'usure (poussières, rayures, sautillement, halos, dérive
//     sépia) — calculée depuis l'âge à CHAQUE projection.
// Le même composant sert à l'aperçu de la chambre noire (âge 0) et
// au projecteur (âge réel) : un seul rendu, aucune divergence.
// ════════════════════════════════════════════════════════════════
import { habillageVersStyle, type ReglagesRendu } from './super8'

export default function S8Ecran({
  reglages,
  ageJours,
  children,
}: {
  reglages: ReglagesRendu
  ageJours: number
  children: React.ReactNode
}) {
  return (
    <div className="s8-ecran" style={habillageVersStyle(reglages, ageJours) as React.CSSProperties}>
      <div className="s8-cadre">{children}</div>
      {/* les couches, du plus près de l'image au plus près de l'œil */}
      <span className="s8-vignette" aria-hidden />
      <span className="s8-halo" aria-hidden />
      <span className="s8-grain" aria-hidden />
      <span className="s8-poussieres" aria-hidden />
      <span className="s8-rayures" aria-hidden />
    </div>
  )
}
