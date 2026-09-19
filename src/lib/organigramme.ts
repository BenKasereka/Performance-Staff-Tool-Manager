import { prisma } from "@/lib/prisma";
import { estClose, estEnRetard } from "@/lib/taches";

export type NoeudOrganigramme = {
  id: string;
  nom: string;
  poste: string | null;
  service: string | null;
  role: "MANAGER" | "MEMBER";
  actif: boolean;
  superieurId: string | null;
  /** Tâches assignées à cette personne seule. */
  chargePropre: { total: number; ouvertes: number; enRetard: number };
  /** Tâches de la personne et de toute sa descendance hiérarchique. */
  chargeEquipe: { total: number; ouvertes: number; enRetard: number };
  enfants: NoeudOrganigramme[];
};

type Charge = { total: number; ouvertes: number; enRetard: number };

function chargeVide(): Charge {
  return { total: 0, ouvertes: 0, enRetard: 0 };
}

function cumuler(a: Charge, b: Charge): Charge {
  return {
    total: a.total + b.total,
    ouvertes: a.ouvertes + b.ouvertes,
    enRetard: a.enRetard + b.enRetard,
  };
}

/**
 * Construit l'arbre hiérarchique et agrège la charge de travail.
 *
 * `chargeEquipe` cumule la descendance complète : c'est ce qui permet de voir
 * combien de tâches relèvent réellement de la responsabilité de chaque
 * encadrant, et non seulement de ce qu'il traite lui-même.
 */
export async function construireOrganigramme() {
  const personnes = await prisma.user.findMany({
    orderBy: [{ nom: "asc" }],
    select: {
      id: true,
      nom: true,
      poste: true,
      service: true,
      role: true,
      actif: true,
      superieurId: true,
      tachesAssignees: {
        select: {
          task: { select: { statut: true, echeance: true } },
        },
      },
    },
  });

  const noeuds = new Map<string, NoeudOrganigramme>();

  for (const personne of personnes) {
    const charge = chargeVide();
    for (const { task } of personne.tachesAssignees) {
      charge.total++;
      if (!estClose(task)) charge.ouvertes++;
      if (estEnRetard(task)) charge.enRetard++;
    }

    noeuds.set(personne.id, {
      id: personne.id,
      nom: personne.nom,
      poste: personne.poste,
      service: personne.service,
      role: personne.role,
      actif: personne.actif,
      superieurId: personne.superieurId,
      chargePropre: charge,
      chargeEquipe: { ...charge },
      enfants: [],
    });
  }

  const racines: NoeudOrganigramme[] = [];
  for (const noeud of noeuds.values()) {
    const parent = noeud.superieurId
      ? noeuds.get(noeud.superieurId)
      : undefined;
    if (parent) parent.enfants.push(noeud);
    else racines.push(noeud);
  }

  function agreger(noeud: NoeudOrganigramme): Charge {
    let cumul = { ...noeud.chargePropre };
    for (const enfant of noeud.enfants) {
      cumul = cumuler(cumul, agreger(enfant));
    }
    noeud.chargeEquipe = cumul;
    return cumul;
  }
  for (const racine of racines) agreger(racine);

  return { racines, noeuds: [...noeuds.values()] };
}

/** Un nœud et toute sa descendance hiérarchique (sans lui-même). */
export function collecterDescendance(noeud: NoeudOrganigramme): string[] {
  const ids: string[] = [];
  for (const enfant of noeud.enfants) {
    ids.push(enfant.id, ...collecterDescendance(enfant));
  }
  return ids;
}

/**
 * Un manager ne gère que lui-même, sa descendance hiérarchique complète, et
 * les membres pas encore rattachés à personne (à réclamer dans son équipe).
 * Un autre manager et l'équipe qui lui est propre restent hors de portée :
 * chaque manager n'agit que sur sa propre organisation.
 */
export async function idsEquipeGeree(managerId: string): Promise<Set<string>> {
  const { noeuds } = await construireOrganigramme();
  const managerNoeud = noeuds.find((n) => n.id === managerId);

  const ids = new Set<string>([managerId]);
  if (managerNoeud) {
    for (const id of collecterDescendance(managerNoeud)) ids.add(id);
  }
  for (const noeud of noeuds) {
    if (!noeud.superieurId && noeud.role !== "MANAGER") ids.add(noeud.id);
  }

  return ids;
}

/** Le point de contact d'une tâche est le N+1 de la personne assignée. */
export async function pointsDeContact(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, string>();

  const personnes = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      superieur: { select: { id: true, nom: true, poste: true } },
    },
  });

  const contacts = new Map<string, string>();
  for (const personne of personnes) {
    if (personne.superieur) {
      contacts.set(
        personne.id,
        personne.superieur.poste
          ? `${personne.superieur.nom} (${personne.superieur.poste})`
          : personne.superieur.nom,
      );
    }
  }
  return contacts;
}
