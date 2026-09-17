import Link from "next/link";
import type { Role } from "@prisma/client";

import { formaterDate, formaterDateHeure } from "@/lib/dates";
import {
  joursDeReport,
  LIBELLES_PERIODICITE,
  livreeEnRetard,
  statutAffiche,
} from "@/lib/taches";
import { prisma } from "@/lib/prisma";
import {
  BadgeOrigine,
  BadgePriorite,
  BadgeStatutTache,
} from "@/components/badges";
import { FilCommentaires } from "@/components/fil-commentaires";
import { PageHero } from "@/components/page-hero";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  tacheId: string;
  utilisateur: { id: string; role: Role };
  retour: string;
};

export async function DetailTache({ tacheId, utilisateur, retour }: Props) {
  const tache = await prisma.task.findUnique({
    where: { id: tacheId },
    include: {
      mission: { select: { id: true, nom: true } },
      createur: { select: { nom: true } },
      evaluateur: { select: { nom: true } },
      assignes: {
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              service: true,
              superieur: { select: { nom: true, poste: true } },
            },
          },
        },
      },
      commentaires: {
        include: { auteur: { select: { nom: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!tache) return null;

  const estManager = utilisateur.role === "MANAGER";
  const estAssigne = tache.assignes.some((a) => a.userId === utilisateur.id);
  if (!estManager && !estAssigne && tache.createurId !== utilisateur.id) {
    return null;
  }

  const enRetardLivraison = livreeEnRetard(tache);
  const report = joursDeReport(tache);

  // Le point de contact est le N+1 de la personne assignée : déduit de
  // l'organigramme, il reste juste même si la personne change d'équipe.
  const pointsDeContact = [
    ...new Set(
      tache.assignes
        .map((a) => a.user.superieur)
        .filter((s) => s !== null)
        .map((s) => (s.poste ? `${s.nom} (${s.poste})` : s.nom)),
    ),
  ];

  return (
    <div className="space-y-6">
      <PageHero
        retour={{ href: retour, libelle: "Retour aux tâches" }}
        titre={
          <span className="flex flex-wrap items-center gap-2">
            {tache.titre}
            <BadgeStatutTache statut={statutAffiche(tache)} />
            <BadgePriorite priorite={tache.priorite} />
            {estManager && <BadgeOrigine origine={tache.origine} />}
          </span>
        }
        description={tache.description}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Échéance</dt>
              <dd>
                {formaterDate(tache.echeance)}
                {report > 0 && (
                  <span className="block text-xs font-medium text-warning">
                    Reportée {report} jour{report > 1 ? "s" : ""} — elle reste
                    au planning du jour jusqu&apos;à sa clôture
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Périodicité</dt>
              <dd>{LIBELLES_PERIODICITE[tache.periodicite]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Activité</dt>
              <dd>
                {tache.mission ? (
                  estManager ? (
                    <Link
                      href={`/manager/missions/${tache.mission.id}`}
                      className="hover:underline"
                    >
                      {tache.mission.nom}
                    </Link>
                  ) : (
                    tache.mission.nom
                  )
                ) : (
                  "Activité courante"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Assignée à</dt>
              <dd>
                {tache.assignes
                  .map((a) =>
                    a.user.service
                      ? `${a.user.nom} (${a.user.service})`
                      : a.user.nom,
                  )
                  .join(", ")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Point de contact</dt>
              <dd>
                {pointsDeContact.length > 0 ? (
                  pointsDeContact.join(", ")
                ) : (
                  <span className="text-muted-foreground">
                    Aucun supérieur renseigné dans l&apos;organigramme
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Créée par</dt>
              <dd>{tache.createur.nom}</dd>
            </div>
            {tache.dateFin && (
              <div>
                <dt className="text-muted-foreground">Terminée le</dt>
                <dd className={enRetardLivraison ? "text-destructive" : ""}>
                  {formaterDate(tache.dateFin)}
                  {enRetardLivraison && " (après l'échéance)"}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {tache.noteQualite && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Évaluation qualité : {tache.noteQualite}/5
            </CardTitle>
            <CardDescription>
              {tache.evaluateur?.nom}
              {tache.dateEvaluation &&
                ` · ${formaterDate(tache.dateEvaluation)}`}
            </CardDescription>
          </CardHeader>
          {tache.commentaireQualite && (
            <CardContent className="text-sm">
              {tache.commentaireQualite}
            </CardContent>
          )}
        </Card>
      )}

      <FilCommentaires
        tacheId={tache.id}
        commentaires={tache.commentaires.map((c) => ({
          id: c.id,
          contenu: c.contenu,
          auteur: c.auteur.nom,
          date: formaterDateHeure(c.createdAt),
        }))}
      />
    </div>
  );
}
