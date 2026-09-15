"use server";

import { revalidatePath } from "next/cache";

import { exigerUtilisateur } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function marquerLue(notificationId: string) {
  const utilisateur = await exigerUtilisateur();

  // Le filtre sur userId empêche de marquer lue la notification d'un collègue.
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: utilisateur.id },
    data: { lu: true },
  });

  revalidatePath("/", "layout");
}

export async function marquerToutesLues() {
  const utilisateur = await exigerUtilisateur();

  await prisma.notification.updateMany({
    where: { userId: utilisateur.id, lu: false },
    data: { lu: true },
  });

  revalidatePath("/", "layout");
}
