// ════════════════════════════════════════════════════════════════
// jeudi. — LES SOIRS DU CERCLE (CHANTIER_PELLICULE §7)
// La même pellicule, lue humainement : une entrée = LE RÉSULTAT d'une
// soirée (le lieu, le tampon de verdict, le tip manuscrit, la bande de
// tirages) et jamais un post — on ne publie pas sans être sorti.
//
// CE QUI EN FAIT UN NON-FEED, et qui ne doit pas bouger :
//  · ça FINIT — la dernière ligne rend la main, il n'y a rien en dessous ;
//  · zéro compteur, zéro like, aucun bouton qui mesure quoi que ce soit ;
//  · 7 jours, chronologique, coupé par nuit — aucun algorithme ;
//  · le « bof » a la même place que le « validé » : même cadre, même
//    taille, même encre. C'est ça qui prouve que ce n'est pas un feed —
//    donc ici les deux tampons sont au GRAPHITE (la cire du « validé »
//    du deck ferait du bof un second rôle, et rallumerait dix rouges
//    dans la page). L'unique cire de cet écran va à « on y retourne ? ».
// ════════════════════════════════════════════════════════════════
import { photoIndisponible } from './photos'
import { t } from './langue'
import { nombreEnMots, type NuitAffichee } from './pellicule'

export default function CarnetCercle({
  nuits,
  total,
  onJyVais,
  onGarder,
  onRetourner,
}: {
  /** les nuits des 7 derniers jours, la plus récente d'abord */
  nuits: NuitAffichee[]
  /** le nombre de soirées de la semaine — pour la ligne de fin, pas un score */
  total: number
  /** « j'y vais → » : la fiche du spot (comme la sortie du carrousel) */
  onJyVais: (lieuId: string) => void
  /** « garder ce tip → » : la copie sur ma carte, tip compris */
  onGarder: (lieuId: string) => void
  /** « on y retourne ? → » : le match de groupe, ce spot déjà en lice */
  onRetourner: (lieuId: string) => void
}) {
  return (
    <section className="carnet-soirs" aria-label={t('les soirs du cercle')}>
      <h2 className="labo-titre">{t('les soirs du cercle.')}</h2>

      {/* l'état vide est une INVITATION, jamais un constat (§1.8) */}
      {total === 0 && (
        <p className="hand carnet-vide">{t('rien encore cette semaine. le premier soir sera le tien.')}</p>
      )}

      {nuits.map((n) => (
        <div key={n.soiree} className="carnet-nuit">
          {/* l'intertitre au crayon : la semaine se tourne comme des pages */}
          <p className="hand carnet-nuit-titre">{t(n.libelle)}</p>
          {n.entrees.map((e) => (
            <article key={e.cle} className="carnet-entree">
              <header className="carnet-tete">
                <span className="carnet-lieu">{e.nom}</span>
                {e.verdict && (
                  <span className={`carnet-tampon mono ${e.verdict}`}>
                    {e.verdict === 'valide' ? t('validé') : t('bof')}
                  </span>
                )}
              </header>

              {/* le tip, dans sa main — jamais réécrit, jamais résumé */}
              {e.tip && <p className="hand carnet-tip">«&nbsp;{e.tip}&nbsp;»</p>}
              <p className="carnet-signature">
                <em className="hand">— {e.prenom}</em>
                <span className="mono carnet-quand">{e.age}</span>
              </p>

              {/* la bande de tirages : des preuves, pas une galerie */}
              {e.srcs.length > 0 && (
                <div className="carnet-bande">
                  {e.srcs.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`${e.nom} — ${e.prenom}, ${e.age}`}
                      loading="lazy"
                      draggable={false}
                      onError={photoIndisponible}
                    />
                  ))}
                </div>
              )}

              <p className="carnet-actions">
                <button className="lien" onClick={() => onJyVais(e.lieuId)}>
                  {t('j’y vais')} →
                </button>
                <button className="lien" onClick={() => onGarder(e.lieuId)}>
                  {t('garder ce tip')} →
                </button>
                {/* l'unique cire de l'écran : la seule action qui engage les autres */}
                <button className="lien carnet-retour" onClick={() => onRetourner(e.lieuId)}>
                  {t('on y retourne ?')} →
                </button>
              </p>
            </article>
          ))}
        </div>
      ))}

      {/* LA FIN. Rien ne charge en dessous, il n'y a pas de suite à faire
          défiler — c'est à l'utilisateur d'aller la vivre. */}
      {total > 0 && (
        <p className="hand carnet-fin">
          {t('c’est tout. ton cercle est sorti')}{' '}
          {total === 1
            ? t('une fois cette semaine.')
            : `${t(nombreEnMots(total))} ${t('fois cette semaine.')}`}
          <br />
          <span className="carnet-fin-relance">{t('— à toi d’écrire la suite.')}</span>
        </p>
      )}
    </section>
  )
}
