import { Component, type ReactNode } from 'react'

// filet de sécurité : une exception ne doit jamais faire un écran blanc.
// on AFFICHE le détail de l'erreur (petit, discret) : sur téléphone, sans
// console, c'est le seul moyen de savoir ce qui a cassé.
// (Sorti de main.tsx le 12/08 — la règle react-refresh veut les composants
// dans leurs propres fichiers, et le fast refresh marche mieux ainsi.)
export class GardeFou extends Component<{ children: ReactNode }, { erreur: Error | null }> {
  state = { erreur: null as Error | null }
  static getDerivedStateFromError(erreur: Error) {
    return { erreur }
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
          {/* le détail technique reste accessible (diagnostic sans câble),
              mais replié : un vrai utilisateur n'a pas à lire une stack */}
          <details style={{ maxWidth: '100%' }}>
            <summary style={{ fontSize: 11, opacity: 0.5, cursor: 'pointer' }}>détails</summary>
            <pre
              style={{
                fontSize: 11,
                opacity: 0.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                textAlign: 'left',
                maxWidth: '100%',
              }}
            >
              {String(this.state.erreur.stack || this.state.erreur.message || this.state.erreur)}
            </pre>
          </details>
        </div>
      )
    return this.props.children
  }
}
