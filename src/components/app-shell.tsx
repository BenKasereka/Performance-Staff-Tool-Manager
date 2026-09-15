import Link from "next/link";
import type { Role } from "@prisma/client";

import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  utilisateur: { nom: string; email?: string | null; role: Role };
  children: React.ReactNode;
};

const LIENS_MANAGER = [
  { href: "/manager", libelle: "Tableau de bord" },
  { href: "/manager/missions", libelle: "Missions" },
  { href: "/manager/taches", libelle: "Tâches" },
  { href: "/manager/equipe", libelle: "Équipe" },
];

const LIENS_MEMBRE = [
  { href: "/mon-espace", libelle: "Mon espace" },
  { href: "/mon-espace/taches", libelle: "Mes tâches" },
  { href: "/mon-espace/missions", libelle: "Mes missions" },
];

export function AppShell({ utilisateur, children }: Props) {
  const liens =
    utilisateur.role === "MANAGER" ? LIENS_MANAGER : LIENS_MEMBRE;
  const initiales = utilisateur.nom
    .split(" ")
    .map((m) => m[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4">
          <Link href="/" className="font-semibold tracking-tight">
            Performance<span className="text-muted-foreground">.équipe</span>
          </Link>

          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {liens.map((lien) => (
              <Button key={lien.href} variant="ghost" size="sm" asChild>
                <Link href={lien.href}>{lien.libelle}</Link>
              </Button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <span className="mr-2 inline-flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                    {initiales}
                  </span>
                  <span className="hidden sm:inline">{utilisateur.nom}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium">
                      {utilisateur.nom}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {utilisateur.role === "MANAGER" ? "Manager" : "Membre"}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/connexion" });
                  }}
                >
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full cursor-pointer">
                      Se déconnecter
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto border-t px-2 py-1 md:hidden">
          {liens.map((lien) => (
            <Button key={lien.href} variant="ghost" size="sm" asChild>
              <Link href={lien.href} className="whitespace-nowrap">
                {lien.libelle}
              </Link>
            </Button>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
