# CHANTIER — les notifications PUSH
*Scoping du 7 août 2026. Session Fable du 12/08 : CODÉ — voir « l'état au
12/08 ». Reste le déploiement (5 gestes, ci-dessous) et le test téléphone.*

---

## L'état au 12/08 (session Fable)

**Codé et vérifié (497 tests verts, tsc 0, build vert, précache identique
51 entrées avant/après la bascule) :**
- **Migration `0020_push_abonnements.sql`** (les numéros ont filé : 0015 du
  scoping → 0020, signaler/bloquer a pris 0018/0019).
- **Bascule `injectManifest` faite** : `app/src/sw.ts` est NOTRE service
  worker — précache, purge des vieux caches, `clientsClaim`, fallback SPA,
  SKIP_WAITING (le toast), chaque bloc commenté avec l'option generateSW
  qu'il remplace — plus les handlers `push` (tag qui remplace, jamais
  d'empilement, silence si charge illisible) et `notificationclick`
  (réutilise la fenêtre ouverte).
- **L'interrupteur « me prévenir »** vit dans le centre de notifications
  (pas aux réglages) : permission demandée SUR LE TAP uniquement ; iPhone
  non installé → on explique l'écran d'accueil au lieu de mendier ;
  refus → on dit où ça se rouvre. `app/src/push.ts` + db.ts (0020).
- **Edge Function `supabase/functions/envoyer-push/`** : la passe ~18 h —
  demandes de cercle reçues (regroupées, jamais une rafale) + le jeudi
  « ça dit quoi ce soir ? » (heure de Paris) ; purge des endpoints morts
  (410/404). Anniversaires et « verdict d'hier » : passes suivantes.
- **`supabase/cron_envoyer_push.sql`** : pg_cron quotidien 16 h UTC, prêt
  à coller (URL et clé anon déjà dedans).
- **Clés VAPID générées** : la publique est dans `app/.env.local`
  (`VITE_VAPID_PUBLIC_KEY`) ; la privée dans `.env.push-vapid` à la racine,
  HORS dépôt (vérifié `git check-ignore`).

## Le déploiement — les 5 gestes d'Ersan, dans l'ordre

1. **Coller `supabase/migrations/0020_push_abonnements.sql`** (SQL Editor).
2. **Vercel** : ajouter `VITE_VAPID_PUBLIC_KEY` (valeur dans
   `.env.push-vapid`) dans Project → Settings → Environment Variables,
   puis redéployer (sinon le build prod n'a pas la clé).
3. **Secrets Supabase** : Dashboard → Edge Functions → Secrets →
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (valeurs dans `.env.push-vapid`)
   et `VAPID_SUBJECT` = `mailto:contact@jeudi.app`.
4. **Déployer la fonction** (depuis la racine du projet, une fois
   `npx supabase login` fait) :
   `npx supabase functions deploy envoyer-push --project-ref pksiepuiamuesugackpf`
5. **Coller `supabase/cron_envoyer_push.sql`** (SQL Editor) — le job
   quotidien est posé.

**Puis le test téléphone** (le vrai) : installer la PWA (iPhone : écran
d'accueil obligatoire, iOS ≥ 16.4) → centre de notifications → « me
prévenir » → oui → depuis un autre compte, envoyer une demande de cercle →
attendre la passe de 18 h (ou déclencher la fonction à la main depuis le
dashboard) → la notification doit tomber APP FERMÉE.

⚠ Piège n°1 du scoping (l'update-flow après la bascule injectManifest) :
**vérifié en local le 12/08, cycle complet** — ancienne version → toast en
0,5 s → clic « recharger » → nouvelle version active, plus de SW en
attente. Et le test a payé : il a trouvé DEUX bugs qui préexistaient à la
bascule, corrigés dans la foulée — (1) le toast ne se rendait jamais sur
l'écran d'auth (il vivait dans la branche « connecté » de App : un
déconnecté restait coincé sur la vieille version) ; (2) une course au
boot — l'événement `jeudi:maj-dispo` pouvait partir avant que App n'ait
accroché son écouteur, et se perdait. Le remède : `majApp.ts` RETIENT
l'état, et `ToastNouvelleVersion` (autonome, rendu sur les deux écrans)
le relit au montage. À re-vérifier une fois en prod : ouvrir l'app,
redéployer, rouvrir → le toast doit apparaître.

---

*Le scoping d'origine, ci-dessous, reste la référence du pourquoi.*

> Le centre de notifications IN-APP existe depuis le 07/08 (moi →
> notifications : sorties à valider, demandes de cercle, anniversaires).
> Ce chantier-ci, c'est le PUSH : réveiller le téléphone quand l'app est
> fermée. C'est un chantier d'INFRASTRUCTURE, pas d'UI — le découper en
> une session propre, pas en fin de marathon.

## Pourquoi ce n'est pas « juste un bouton »

1. **Le service worker actuel ne peut pas recevoir de push.**
   vite-plugin-pwa est en mode `generateSW` (Workbox généré) : on ne peut
   pas y injecter un listener `push`. Il faut basculer en **`injectManifest`**
   (on écrit NOTRE `sw.ts` : precache Workbox + handlers `push` /
   `notificationclick`). C'est LE morceau risqué : le SW porte aussi la
   mise à jour de l'app (toast « nouvelle version ») — à re-tester
   soigneusement après bascule.
2. **Il faut un serveur qui envoie.** Le push web = messages chiffrés
   envoyés aux endpoints des navigateurs, signés par une paire de clés
   **VAPID**. Côté nous : une **Supabase Edge Function** (`web-push` en
   Deno) + un **cron Supabase** qui la déclenche.
3. **Il faut stocker les abonnements** : migration `push_abonnements`
   (user_id, endpoint, p256dh, auth, cree_le — RLS : chacun les siens).

## Le plan, dans l'ordre (session dédiée, ~une demi-journée)

1. **Migration 0015** : table `push_abonnements` + RLS.
2. **Bascule `injectManifest`** : `src/sw.ts` (precacheAndRoute + push +
   notificationclick → ouvre l'app au bon endroit) ; vérifier le toast
   de mise à jour + l'offline après bascule (le piège n°1).
3. **Clés VAPID** : `npx web-push generate-vapid-keys` → publique dans
   l'app (env), privée dans les secrets Supabase.
4. **Côté app** : dans moi → notifications, un vrai interrupteur
   « me prévenir » → `Notification.requestPermission()` +
   `pushManager.subscribe(...)` → upsert dans `push_abonnements`.
   (PWA installée obligatoire sur iPhone — iOS ≥ 16.4.)
5. **Edge Function `envoyer-push`** : lit les événements à annoncer,
   pousse via web-push, purge les endpoints morts (410).
6. **Le cron** (pg_cron ou Scheduled Functions) : une passe quotidienne
   ~18 h — jamais du temps réel harcelant, c'est jeudi.

## QUOI pousser (la ligne éditoriale — aussi importante que la technique)

Jeudi ne harcèle pas. Push = RARE et PRÉCIEUX, dans la voix du carnet :
- « @ninon veut rejoindre ton cercle. » (événement social réel)
- « c'est l'anniversaire de karim ! » (le matin, une fois)
- « ta sortie d'hier attend son verdict. » (le lendemain, 1 rappel max)
- le jeudi ~18 h : « ça dit quoi ce soir ? » (LE rendez-vous — opt-in à part)
- JAMAIS : « X a posté », des compteurs, du réengagement gratuit.

## Pièges connus
- iOS : push seulement si PWA installée (A2HS) — le guide existe déjà.
- La bascule injectManifest peut casser l'update-flow silencieusement :
  tester « ancienne version → toast → nouvelle » AVANT de merger.
- Ne pas pousser depuis le client (la clé privée reste côté serveur).
