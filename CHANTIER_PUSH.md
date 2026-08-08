# CHANTIER — les notifications PUSH
*Scoping du 7 août 2026 — RIEN n'est implémenté. Session dédiée requise.*

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
