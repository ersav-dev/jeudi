# jeudi. — comptes & services (mémo perso)

> Récap des comptes utilisés pour le backend. **Aucun secret ici** (mots de passe,
> clés secrètes) — ils sont rangés ailleurs, indiqué plus bas. Dépôt privé, mais
> par principe on ne colle jamais un secret dans un fichier versionné.

Dernière mise à jour : 2026-06-14

---

## Supabase (backend : auth + base Postgres + storage)
- **Connexion** : compte GitHub `ersav-dev` (login Supabase via GitHub)
- **Organisation** : `ersav-dev's Org` (plan Free)
- **Projet** : `jeudi`
- **Région** : West EU (Ireland) — UE, RGPD
- **Project URL** : https://pksiepuiamuesugackpf.supabase.co
- **Dashboard** : https://supabase.com/dashboard/project/pksiepuiamuesugackpf
- **Secrets (NON ici)** :
  - Mot de passe base de données → ton gestionnaire de mots de passe
  - Clé `anon` (publique) → `app/.env.local` (gitignoré)
  - Clé `service_role` (secrète) → dashboard Supabase uniquement, jamais dans le code

## Google Cloud (connexion « Sign in with Google »)
- **Compte Google** : ersan.musa@gmail.com
- **Projet** : `jeudi` (ID `jeudi-499418`)
- **Console** : https://console.cloud.google.com → projet `jeudi`
- **Identifiant OAuth** : « jeudi web » (type Application Web)
  - **Client ID** : `147617417057-b40ab1cd1nlfod1vvoa01bdjdab3k4ho.apps.googleusercontent.com`
  - **Redirect URI configuré** : `https://pksiepuiamuesugackpf.supabase.co/auth/v1/callback`
  - **Client Secret (NON ici)** → collé dans Supabase (Authentication → Providers → Google)

## GitHub (code source)
- **Compte** : `ersav-dev`
- **Repo** : https://github.com/ersav-dev/jeudi (privé 🔒)
- **Workflow** : `cd F:\ErsanMusa-com\Jeudi_App` puis `git add -A && git commit -m "..." && git push`

## Vercel (hébergement de l'app)
- **Projet** : `atr-s-projects/jeudi` (compte d'Ersan)
- **URL en ligne** : https://jeudi-seven.vercel.app
- **Republier** : `cd F:\ErsanMusa-com\Jeudi_App\app` puis `vercel --prod`
- ⚠️ À faire avant le prochain déploiement (quand l'auth ira en ligne) :
  - ajouter les variables d'env dans Vercel : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - ajouter `https://jeudi-seven.vercel.app/**` dans Supabase → Authentication → URL Configuration → Redirect URLs

---

## Compte de test (auth)
- **Utilisateur** : ersan.musa@gmail.com (connecté en magic-link + Google, lié au même compte Supabase)

## Où sont les secrets (rappel)
| Secret | Emplacement |
|---|---|
| Mot de passe base Supabase | gestionnaire de mots de passe perso |
| Clé `anon` Supabase | `app/.env.local` (gitignoré) |
| Clé `service_role` Supabase | dashboard Supabase seulement |
| Google OAuth Client Secret | Supabase → Providers → Google |
