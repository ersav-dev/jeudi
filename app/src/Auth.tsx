import { useState } from 'react'
import { supabase } from './supabase'
import { t, lireLangue, basculerLangue } from './langue'
import GuideInstallation from './GuideInstallation'

// Supabase parle anglais ; l'écran d'entrée de jeudi parle français.
// On traduit les cas connus, et on reste digne sur le reste.
function erreurAuthFr(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('rate limit')) return t('trop d’essais d’un coup — réessaie dans quelques minutes.')
  if (m.includes('invalid') && m.includes('email')) return t('cette adresse mail a l’air bancale — vérifie-la.')
  if (m.includes('network') || m.includes('fetch')) return t('pas de réseau — réessaie quand ça capte.')
  if (m.includes('provider') || m.includes('oauth')) return t('la connexion Google n’a pas abouti — réessaie.')
  return t('ça n’a pas marché. réessaie — ou passe par l’autre porte.')
}

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
      setErreur(erreurAuthFr(error.message))
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
      setErreur(erreurAuthFr(error.message))
      setEtat('erreur')
    } else {
      setEtat('envoye')
    }
  }

  return (
    <div className="auth">
      {/* la porte des visiteurs : basculer l'app en anglais dès l'entrée */}
      <button
        type="button"
        className="mono auth-langue"
        onClick={basculerLangue}
        aria-label={lireLangue() === 'fr' ? 'switch to English' : 'passer en français'}
      >
        {lireLangue() === 'fr' ? 'EN' : 'FR'}
      </button>
      <div className="auth-tampon">Jeudi.</div>
      <div className="auth-tagline">{t('je dis où.')}</div>

      {etat === 'envoye' ? (
        <div className="auth-envoye">
          <p className="auth-gros">{t('regarde tes mails.')}</p>
          <p className="auth-sous">
            {t('un lien t’attend à')}
            <br />
            <strong>{email.trim()}</strong>
          </p>
          <button
            className="auth-relance"
            onClick={() => {
              setEtat('repos')
              setErreur('')
            }}
          >
            {t('pas reçu ? renvoyer')}
          </button>
        </div>
      ) : (
        <div className="auth-form">
          <button className="auth-google" type="button" onClick={continuerGoogle}>
            {t('continuer avec Google')}
          </button>

          <div className="auth-ou">{t('ou par mail')}</div>

          <form className="auth-form" onSubmit={envoyerLien}>
            <input
              className="auth-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t('ton@mail.fr')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={etat === 'envoi'}
            />
            <button className="auth-btn" type="submit" disabled={!emailOk || etat === 'envoi'}>
              {etat === 'envoi' ? t('on envoie…') : t('reçois ton lien')}
            </button>
          </form>

          {etat === 'erreur' && <p className="auth-erreur">{erreur}</p>}
        </div>
      )}

      {/* le guide d'installation (si l'app n'est pas sur l'écran d'accueil) */}
      <GuideInstallation />

      {/* la couche légale : discrète mais toujours là */}
      <a className="mono auth-legal" href="/confidentialite.html" target="_blank" rel="noreferrer">
        {t('confidentialité & conditions')}
      </a>
    </div>
  )
}
