import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";

export default async function LayoutApplication({
  children,
}: LayoutProps<"/">) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  return <AppShell utilisateur={session.user}>{children}</AppShell>;
}
