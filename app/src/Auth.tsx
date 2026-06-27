import { useState } from 'react'
import { supabase } from './supabase'

// l'écran de connexion : Google (un geste) ou un lien magique par mail.
// DA carnet de nuit — sobre, le tampon, une tagline.
export default function Auth() {
  const [email, setEmail] = useState('')
  const [etat, setEtat] = useState<'repos' | 'envoi' | 'envoye' | 'erreur'>('repos')
  const [erreur, setErreur] = useState('')

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const continuerGoogle = async () => {
    setErreur('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    // en cas de succès, le navigateur redirige vers Google : pas de suite ici.
    if (error) {
      setErreur(error.message)
      setEtat('erreur')
    }
  }

  const envoyerLien = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailOk || etat === 'envoi') return
    setEtat('envoi')
    setErreur('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setErreur(error.message)
      setEtat('erreur')
    } else {
      setEtat('envoye')
    }
  }

  return (
    <div className="auth">
      <div className="auth-tampon">Jeudi.</div>
      <div className="auth-tagline">je dis où.</div>

      {etat === 'envoye' ? (
        <div className="auth-envoye">
          <p className="auth-gros">regarde tes mails.</p>
          <p className="auth-sous">
            un lien t'attend à<br />
            <strong>{email.trim()}</strong>
          </p>
          <button
            className="auth-relance"
            onClick={() => {
              setEtat('repos')
              setErreur('')
            }}
          >
            pas reçu ? renvoyer
          </button>
        </div>
      ) : (
        <div className="auth-form">
          <button className="auth-google" type="button" onClick={continuerGoogle}>
            continuer avec Google
          </button>

          <div className="auth-ou">ou par mail</div>

          <form className="auth-form" onSubmit={envoyerLien}>
            <input
              className="auth-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="ton@mail.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={etat === 'envoi'}
            />
            <button className="auth-btn" type="submit" disabled={!emailOk || etat === 'envoi'}>
              {etat === 'envoi' ? 'on envoie…' : 'reçois ton lien'}
            </button>
          </form>

          {etat === 'erreur' && <p className="auth-erreur">{erreur}</p>}
        </div>
      )}
    </div>
  )
}
