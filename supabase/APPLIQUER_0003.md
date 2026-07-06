# Appliquer la migration 0003 — sécurité

> Prérequis : **0001** et **0002** doivent déjà avoir été appliquées (le bucket
> `photos` et ses policies doivent exister). Si tu n'as jamais collé
> `0002_storage_photos.sql`, fais-le AVANT.

## Comment l'appliquer

1. Ouvre le [dashboard Supabase](https://supabase.com/dashboard) → ton projet jeudi.
2. Menu de gauche → **SQL Editor** → **New query**.
3. Colle TOUT le contenu de `supabase/migrations/0003_securite.sql`.
4. **Run** (Ctrl+Entrée). Ça doit finir en `Success. No rows returned`.
   - Si tu vois une *NOTICE* « index anti-doublons croisés NON créé » : il
     existe déjà des relations en double (A→B **et** B→A). Rien n'est cassé,
     mais nettoie les doublons à la main (garde la ligne acceptée) puis
     relance juste le bloc `do $$ ... end $$` de la section 1.
5. Tu peux relancer le script entier sans risque : il est idempotent et ne
   détruit aucune donnée.

## Ce que ça change

1. **Relations verrouillées.** Une demande d'ami part obligatoirement en
   `statut = 'demande'`, depuis soi, jamais vers soi. Seul le **destinataire**
   peut accepter (UPDATE). Le demandeur ne peut qu'annuler (DELETE). Plus
   d'auto-acceptation possible. Une seule ligne par paire de membres, quel
   que soit le sens.
2. **La date de naissance ne fuit plus.** Chacun ne lit que SON profil complet.
   Les profils des autres se liront via la vue `profils_publics` (prenom,
   critere, bio, insta, photo_url, cree_le — pas de naissance, pas de seuils €,
   pas de score). L'app n'a rien à changer aujourd'hui : elle ne lit que son
   propre profil.
3. **Bucket `photos` privé.** Les anciennes URLs publiques sont mortes. La
   lecture des fichiers passe par une policy qui rejoue la visibilité du lieu
   (privé / cercle / public) ; les portraits `profil.jpg` restent lisibles par
   tout membre connecté. Les colonnes `profils.photo_url` et `photos.url`
   stockent désormais le **chemin** dans le bucket (plus une URL) — le code
   `db.ts` devra générer des URLs **signées** (`createSignedUrl`) à partir de
   ces chemins. ⚠️ Tant que db.ts n'est pas adapté, les photos ne s'affichent
   plus dans l'app : c'est attendu, applique la migration et la mise à jour
   du code dans la même fenêtre.
4. **Colonne `lieux.recos`** (text[], nullable) : les conditions optimales
   recommandées, prête pour la sync cloud.
5. **RGPD.** `supabase.rpc('supprimer_mon_compte')` supprime les fichiers
   Storage du membre puis son compte `auth.users` — tout le reste (profil,
   lieux, tips, photos, relations, sorties) part en cascade. Après l'appel,
   le code devra faire un `signOut()` local.

## Vérifier (3 checks rapides)

**1. Impossible de créer une relation déjà acceptée.**
Dans SQL Editor, simule un membre connecté (remplace les deux uuid par de
vrais ids de `profils` — MON_ID = celui qu'on simule) :

```sql
begin;
select set_config('request.jwt.claims', json_build_object('sub', 'MON_ID', 'role', 'authenticated')::text, true);
set local role authenticated;
insert into public.relations (de_id, vers_id, statut)
values ('MON_ID', 'AUTRE_ID', 'accepte');
rollback;
```

Attendu : `new row violates row-level security policy` → ✅. (Le `rollback`
final garantit qu'aucune trace ne reste, même si ça passait.)

**2. Une ancienne URL publique de photo doit être morte.**
Prends une ancienne URL du type
`https://<projet>.supabase.co/storage/v1/object/public/photos/<uid>/....jpg`
(historique du navigateur, ou reconstruis-la depuis un chemin en base) et
ouvre-la en navigation privée. Attendu : **400/404 « Object not found »**
(plus l'image) → ✅.

**3. La naissance d'un autre profil est invisible.**
Toujours dans SQL Editor, en simulant MON_ID comme au check 1 :

```sql
begin;
select set_config('request.jwt.claims', json_build_object('sub', 'MON_ID', 'role', 'authenticated')::text, true);
set local role authenticated;
select naissance from public.profils where id <> 'MON_ID';
rollback;
```

Attendu : **0 ligne** (la RLS masque les autres profils) → ✅. Bonus : le même
select sur `public.profils_publics` renvoie bien les autres membres, mais la
colonne `naissance` n'y existe pas.

## À faire côté code ensuite (hors de cette migration)

- `db.ts` : remplacer `getPublicUrl` par `createSignedUrl`/`createSignedUrls`
  au moment de l'AFFICHAGE (les colonnes contiennent maintenant des chemins),
  stocker le chemin brut à l'upload, et retirer le `?t=...` (inutile en signé).
- `db.ts` : synchroniser `recos` dans `lieuVersLigne` / `ligneVersLieu`.
- Bouton « supprimer mon compte » : `await supabase.rpc('supprimer_mon_compte')`
  puis `supabase.auth.signOut()` + purge locale (`effacerTout()`).
