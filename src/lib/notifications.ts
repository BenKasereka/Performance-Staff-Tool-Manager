import type { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { envoyerEmail } from "@/lib/email";

export function urlApplication() {
  return (
    process.env.AUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

type Options = {
  userId: string;
  type: NotificationType;
  titre: string;
  contenu: string;
  lien?: string;
  /** L'email double la notification in-app ; sans clé Resend il est ignoré. */
  email?: boolean;
};

/**
 * Crée une notification in-app et, si demandé, relaie par email.
 *
 * L'enregistrement en base ne dépend jamais du succès de l'email : le centre de
 * notifications reste complet même quand l'envoi échoue.
 */
export async function notifier(options: Options) {
  const utilisateur = await prisma.user.findUnique({
    where: { id: options.userId },
    select: { email: true, actif: true },
  });
  if (!utilisateur?.actif) return null;

  const notification = await prisma.notification.create({
    data: {
      userId: options.userId,
      type: options.type,
      titre: options.titre,
      contenu: options.contenu,
      lien: options.lien,
    },
  });

  if (options.email) {
    const resultat = await envoyerEmail({
      destinataire: utilisateur.email,
      sujet: options.titre,
      titre: options.titre,
      corps: [options.contenu],
      lien: options.lien
        ? { url: `${urlApplication()}${options.lien}`, libelle: "Ouvrir dans l'outil" }
        : undefined,
    });

    if (resultat.envoye) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { emailEnvoye: true },
      });
    }
  }

  return notification;
}

export async function notifierPlusieurs(
  userIds: string[],
  options: Omit<Options, "userId">,
) {
  const uniques = [...new Set(userIds)];
  return Promise.all(uniques.map((userId) => notifier({ ...options, userId })));
}

export async function compterNonLues(userId: string) {
  return prisma.notification.count({ where: { userId, lu: false } });
}

export async function chargerNotifications(userId: string, limite = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limite,
  });
}
