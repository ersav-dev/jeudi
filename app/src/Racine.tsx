import { Suspense, lazy } from 'react'
import App from './App.tsx'
import { extraireTokenSortie } from './sortieGroupe'

// /sortie/<token> : la page PUBLIQUE du match de groupe — rendue AVANT
// l'app (et donc avant le mur de connexion) : l'invité vote sans compte.
// Une visite sur mille : elle descend à la demande, pas dans le bundle que
// tout le monde porte.
const PageSortie = lazy(() => import('./PageSortie.tsx'))

// l'aiguillage racine — sorti de main.tsx le 12/08 (react-refresh veut les
// composants dans des fichiers qui les exportent ; l'entrée n'exporte rien).
export function Racine() {
  const tokenSortie = extraireTokenSortie(window.location.pathname)
  if (tokenSortie)
    return (
      <Suspense fallback={null}>
        <PageSortie token={tokenSortie} />
      </Suspense>
    )
  return <App />
}
