# La palette officielle des lignes — Île-de-France

*Vérifiée le 9 août 2026 contre les modèles Wikipédia qui recopient les
plans de ligne RATP/IDFM officiels. Source du fond de vérité :*
- `Modèle:Métro de Paris/couleur fond` — [wikitexte brut](https://fr.wikipedia.org/w/index.php?title=Mod%C3%A8le:M%C3%A9tro_de_Paris/couleur_fond&action=raw)
- `Modèle:RER/couleur fond` — [wikitexte brut](https://fr.wikipedia.org/w/index.php?title=Mod%C3%A8le:RER/couleur_fond&action=raw)
- `Modèle:Tramway d'Île-de-France/couleur fond` — [wikitexte brut](https://fr.wikipedia.org/w/index.php?title=Mod%C3%A8le:Tramway_d%27%C3%8Ele-de-France/couleur_fond&action=raw)

> **Si `lignes.json` est un jour régénéré depuis OSM, il DOIT être re-patché
> avec cette table.** OSM porte ses propres couleurs, systématiquement plus
> ternes que la charte.

## Le verdict de l'audit

**Le métro était déjà juste** — les 17 refs présentes correspondent au
hex officiel, sans exception. C'est le RER et le tram qui étaient faux
(posés de mémoire lors de la construction de la palette).

## Métro — conforme, rien à changer

| ligne | hex |
|---|---|
| 1 | `#FFCE00` |
| 2 | `#0064B0` |
| 3 | `#9F9825` |
| 3bis · 13 | `#98D4E2` |
| 4 | `#C04191` |
| 5 | `#F28E42` |
| 6 · 7bis | `#83C491` |
| 7 · 16 | `#F3A4BA` |
| 8 | `#CEADD2` |
| 9 · 17 | `#D5C900` |
| 10 | `#E3B32A` |
| 11 | `#8D5E2A` |
| 12 | `#00814F` |
| 14 | `#662483` |
| 15 | `#B90845` |
| 18 | `#00A88F` |

## RER — quatre lignes sur cinq étaient fausses

| ligne | avant (faux) | officiel |
|---|---|---|
| A | `#E2231A` | **`#E3051C`** |
| B | `#7BA3DC` | **`#5291CE`** |
| C | `#F99D1C` | **`#FFCE00`** — jaune, pas orange (la plus visible des erreurs) |
| D | `#00A94F` | **`#00814F`** |
| E | `#C04191` | `#C04191` ✓ |

## Tram — six lignes sur neuf étaient fausses

| ligne | avant (faux) | officiel |
|---|---|---|
| T1 | `#0064B0` | `#0064B0` ✓ |
| T2 | `#C04191` | `#C04191` ✓ |
| T3a | `#F58F53` | **`#F28E42`** |
| T3b | `#00A88F` | **`#00814F`** |
| T4 | `#E3B32A` | `#E3B32A` ✓ |
| T6 | `#E2231A` | **`#E3051C`** |
| T7 | `#8D5E2A` | `#8D5E2A` ✓ |
| T9 | `#00A88F` | **`#5291CE`** — l'erreur la plus grossière (vert au lieu de bleu) |
| T10 | `#8D5E2A` | **`#9F9825`** |

Table complète du tram, pour le jour où d'autres lignes entrent dans la
donnée : T1 `#0064B0` · T2 `#C04191` · T3a et T11 `#F28E42` · T3b et T12
`#B90845` (T3b est `#00814F`) · T4 `#E3B32A` · T5 `#662483` · T6 `#E3051C` ·
T7 et T13 `#8D5E2A` · T8 et T10 `#9F9825` · T9 `#5291CE` · T14 `#00A88F`.
