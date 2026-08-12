# DESIGN — le tirage chez un pote (P2, RLS photos multi-auteurs)
*Proposition du 12/08/2026, session Fable. RIEN n'est codé — le prompt P2
exige ta validation d'abord : c'est de la sécurité, zéro raccourci.
Migration cible : **0021** (le scoping disait 0016, les numéros ont filé).*

---

## Le problème, vérifié dans le code le 12/08

Un tirage du soir pris sur le spot d'un pote **ne quitte jamais ton
téléphone**. Deux verrous, tous les deux réels :

1. **La RLS** (0001) : les quatre policies de `photos` disent
   `lieu_a_moi(lieu_id)` — seul le PROPRIÉTAIRE du lieu écrit des photos
   dessus. La colonne `auteur_id` existe pourtant depuis la 0010, mais
   aucune policy ne s'en sert pour l'écriture.
2. **Le chemin d'écriture** (`syncPhotosLieu`, db.ts ~639) : il
   « réécrit tout » — relève les anciennes lignes du lieu, insère les
   neuves, efface les anciennes par id. Garde `estAMoi(lieu)` à l'entrée,
   donc jamais appelé pour un spot de pote. Et il est structurellement
   **incompatible avec des photos multi-auteurs** : le jour où des lignes
   d'autres auteurs vivent sur MON lieu, sa réécriture les effacerait.

Bonne nouvelle vérifiée : **le Storage est DÉJÀ prêt.** Les chemins
commencent par l'uid du DÉPOSANT (`<uid>/<lieu_id>/…`) — la policy de
dépôt (0002) vérifie ce premier dossier, et la lecture
(`chemin_photo_visible`, 0003/0019) rejoue `lieu_visible` sur le 2ᵉ
dossier. Un tirage de moi chez un pote = un fichier dans MON dossier,
pointant son lieu : déposable et lisible sans toucher au Storage.
Idem pour le bucket `clips` (0011). Seule la TABLE bloque.

---

## La proposition

### 1 · Migration 0021 — les policies apprennent l'auteur

**SELECT** — inchangé sur le lieu, PLUS le filtre blocage (cohérence
0019 : les tips l'ont déjà, les photos multi-auteurs en auront besoin le
jour où ce design s'allume) :
```sql
using (public.lieu_visible(lieu_id)
       and not public.sont_bloques(auth.uid(), auteur_id))
```
(`auteur_id` est nullable — `sont_bloques(x, null)` rend false, les
lignes legacy sans auteur restent visibles. Vérifié : `exists` sur un
null ne matche rien.)

**INSERT** — la policy du proprio reste telle quelle, on en AJOUTE une
(les policies d'un même verbe se cumulent en OU) :
```sql
create policy "poser un tirage chez un pote" on public.photos
  for insert to authenticated
  with check (
    auteur_id = auth.uid()          -- signé, pas d'usurpation
    and type = 'soir'               -- QUE le tirage du soir (→ question 1)
    and not public.lieu_a_moi(lieu_id)  -- chez un pote, pas un doublon du chemin proprio
    and exists (                    -- le lieu est à quelqu'un de MON cercle (→ question 3)
      select 1 from public.lieux l
      where l.id = lieu_id and public.est_dans_mon_cercle(l.owner_id)
    )
  );
```
`est_dans_mon_cercle` porte déjà le blocage (0019) — un bloqué ne peut
rien poser chez moi, c'est cadeau.

**UPDATE** — le pote ne touche QUE ses lignes ; le proprio garde les
siennes (les réglages de chambre noire d'un clip restent à leur auteur) :
```sql
-- la policy proprio (lieu_a_moi) est REMPLACÉE par :
using (auteur_id = auth.uid()
       or (auteur_id is null and public.lieu_a_moi(lieu_id)))
```
(le `auteur_id is null` couvre les lignes legacy du proprio.)

**DELETE** — deux mains sur la même ligne, exprès :
```sql
using (
  auteur_id = auth.uid()            -- je retire toujours MON tirage (se dédire)
  or public.lieu_a_moi(lieu_id)     -- et c'est CHEZ MOI : je peux décrocher
)                                   --   ce qui est accroché à mon spot (→ question 2)
```

### 2 · db.ts — un chemin d'écriture CIBLÉ, jamais une réécriture

Nouveau `poserTirageChezUnPote(lieuId, photo)` :
- upload du blob vers `photos/<monId>/<lieuId>/<horodatage>-soir.jpg`
  (mon dossier → policy Storage déjà bonne ; horodatage et non `ordre`
  pour ne jamais écraser un fichier d'un autre tirage) ;
- **un INSERT d'UNE ligne** (`auteur_id = monId`, `prise_le`,
  `visible_le` +1 h — la règle de la pellicule, inchangée) ;
- hors ligne → la file existante (`enfiler`), comme une rayure.

Et le garde-fou dans `syncPhotosLieu` : le relevé/suppression des
anciennes lignes filtre `auteur_id = monId or auteur_id is null` — la
réécriture du proprio ne compte plus JAMAIS les lignes des autres.
(Aujourd'hui sans effet — personne d'autre ne peut écrire — mais c'est le
prérequis pour allumer la 0021 sans perte.)

### 3 · Ce qui ne change PAS
La pellicule lit déjà `auteur_id` (0010) et la RLS de lecture sert déjà
les photos des lieux du cercle : les tirages des potes **apparaîtront
dans le tas du soir sans refonte**. Le +1 h, le sceau, les vues (0014) :
inchangés.

---

## Les 3 questions à trancher AVANT le SQL

1. **Le périmètre : `type = 'soir'` seulement ?** (recommandé) Ou aussi
   plat/terrasse… ? Reco : soir seulement — la fiche d'un lieu reste la
   voix de son propriétaire ; le tirage est un événement, pas une retouche
   de fiche.
2. **Le proprio peut-il décrocher le tirage d'un pote de SON spot ?**
   Reco : oui — c'est chez lui, et c'est plus doux que de devoir signaler.
   (Si non : on retire `lieu_a_moi` du DELETE.)
3. **Chez qui : le cercle seulement ?** (recommandé) Ou aussi les spots
   publics ? Reco : cercle seulement — le public est un décor qu'on
   regarde, pas un mur où l'on punaise. (Si un jour oui : remplacer
   `est_dans_mon_cercle(owner)` par `lieu_visible(lieu_id)`.)

**Tu valides (ou corriges) ces trois réponses → je code la 0021 + db.ts +
les tests dans la foulée.**
