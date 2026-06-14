import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
// maplibre AVANT notre CSS : nos règles gagnent sans !important
import 'maplibre-gl/dist/maplibre-gl.css'
import './index.css'
import App from './App.tsx'

// filet de sécurité : une exception ne doit jamais faire un écran blanc
class GardeFou extends Component<{ children: ReactNode }, { erreur: boolean }> {
  state = { erreur: false }
  static getDerivedStateFromError() {
    return { erreur: true }
  }
  render() {
    if (this.state.erreur)
      return (
        <div className="vide bientot" style={{ padding: 24 }}>
          <h1 className="grande-question">oups.</h1>
          <p className="hand">un truc a cassé. recharge, ça ira.</p>
          <button className="lien" onClick={() => window.location.reload()}>
            recharger
          </button>
        </div>
      )
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GardeFou>
      <App />
    </GardeFou>
  </StrictMode>,
)
