-- ═══════════════════════════════════════════════════════════════════
-- jeudi. — DIAGNOSTIC DES COMPTES (10/08/2026)
--
-- À coller dans Supabase → SQL Editor → Run. Ne modifie RIEN : trois
-- lectures. Sauve le snippet sous « diagnostic — comptes ».
--
-- Pourquoi : en se connectant depuis le téléphone avec « son gmail »,
-- l'app a rejoué l'accueil et redemandé prénom + portrait. Deux causes
-- possibles, et une seule est vraie — ces requêtes tranchent.
--
--   Cause A : le téléphone avait un AUTRE compte Google actif (Google
--             reprend la session ouverte sans demander) → un vrai
--             nouveau compte a été créé.
--   Cause B : le bon compte, mais l'accueil se décidait sur un drapeau
--             d'APPAREIL (`localStorage`), donc il se rejouait sur tout
--             nouveau téléphone. ← corrigé dans le code du 10/08
--
-- Supabase relie automatiquement deux portes qui portent la MÊME adresse
-- VÉRIFIÉE (doc « Identity Linking ») : si la requête 1 montre un seul
-- compte pour ton gmail, c'est la cause B. Si elle en montre deux avec
-- des adresses différentes, c'est la cause A.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. TOUS LES COMPTES, ET PAR QUELLES PORTES ────────────────────
select
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  u.email_confirmed_at,
  array_agg(distinct i.provider)              as portes,
  array_agg(distinct i.email)                 as adresses_des_portes,
  count(distinct i.id)                        as nb_portes
from auth.users u
left join auth.identities i on i.user_id = u.id
group by u.id, u.email, u.created_at, u.last_sign_in_at, u.email_confirmed_at
order by u.created_at;

-- ── 2. CE QUE CHAQUE COMPTE POSSÈDE VRAIMENT ──────────────────────
-- C'est la colonne qui compte : celui qui a les spots est LE bon.
select
  u.id,
  u.email,
  p.prenom,
  p.photo_url is not null                     as a_un_portrait,
  u.created_at::date                          as cree_le,
  (select count(*) from public.lieux  l where l.owner_id  = u.id) as spots,
  (select count(*) from public.photos ph
     join public.lieux l2 on l2.id = ph.lieu_id
    where l2.owner_id = u.id)                                     as photos,
  (select count(*) from public.tips   tp where tp.auteur_id = u.id) as tips
from auth.users u
left join public.profils p on p.id = u.id
order by spots desc, u.created_at;

-- ── 3. DEUX COMPTES POUR UNE MÊME ADRESSE ? ───────────────────────
-- Normalement vide : Supabase relie les portes d'une même adresse
-- vérifiée. Si ce n'est pas vide, c'est là qu'il faut regarder.
select lower(email) as adresse, count(*) as nb_comptes,
       array_agg(id) as ids
from auth.users
where email is not null
group by lower(email)
having count(*) > 1;

-- ═══════════════════════════════════════════════════════════════════
-- ENSUITE — si un compte de trop est apparu (cause A)
--
-- ⚠️ NE JAMAIS faire `delete from auth.users` à la main : les cascades
-- passent par GoTrue. La bonne manière : se CONNECTER sur le compte de
-- trop, puis « moi → mes données → supprimer mon compte » (la rpc
-- supprimer_mon_compte fait le ménage complet, Storage compris).
--
-- Et si des données ont atterri sur le mauvais compte, on les déplace
-- AVANT de le supprimer — une ligne par table, avec les deux ids :
--
--   update public.lieux  set owner_id  = '<BON-ID>' where owner_id  = '<MAUVAIS-ID>';
--   update public.tips   set auteur_id = '<BON-ID>' where auteur_id = '<MAUVAIS-ID>';
--
-- Ne lance ça QUE si la requête 2 montre des spots sur le mauvais
-- compte. Sinon il n'y a rien à déplacer, et rien à réparer en base.
-- ═══════════════════════════════════════════════════════════════════
