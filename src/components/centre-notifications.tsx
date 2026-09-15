"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { NotificationType } from "@prisma/client";

import { marquerLue, marquerToutesLues } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type NotificationAffichee = {
  id: string;
  type: NotificationType;
  titre: string;
  contenu: string;
  lien: string | null;
  lu: boolean;
  quand: string;
};

/** Les décisions de mission passent avant le reste : elles bloquent un rapport. */
const URGENTES: NotificationType[] = [
  "MISSION_EN_ATTENTE_DECISION",
  "MISSION_FIN_PROCHE",
  "TACHE_EN_RETARD",
];

export function CentreNotifications({
  notifications,
  nonLues,
}: {
  notifications: NotificationAffichee[];
  nonLues: number;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [, demarrer] = useTransition();

  function ouvrirNotification(id: string) {
    demarrer(async () => {
      await marquerLue(id);
    });
    setOuvert(false);
  }

  return (
    <Popover open={ouvert} onOpenChange={setOuvert}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          aria-label={`Notifications${nonLues > 0 ? ` — ${nonLues} non lues` : ""}`}
        >
          <span aria-hidden>🔔</span>
          {nonLues > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
              {nonLues > 9 ? "9+" : nonLues}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Notifications</span>
          {nonLues > 0 && (
            <form
              action={async () => {
                await marquerToutesLues();
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                Tout marquer lu
              </Button>
            </form>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Aucune notification.
            </p>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => {
                const contenu = (
                  <div
                    className={cn(
                      "space-y-0.5 px-3 py-2.5",
                      !n.lu && "bg-muted/50",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.lu && (
                        <span
                          aria-hidden
                          className={cn(
                            "mt-1.5 inline-block size-1.5 shrink-0 rounded-full",
                            URGENTES.includes(n.type)
                              ? "bg-destructive"
                              : "bg-foreground/50",
                          )}
                        />
                      )}
                      <span
                        className={cn(
                          "text-sm",
                          !n.lu ? "font-medium" : "text-muted-foreground",
                        )}
                      >
                        {n.titre}
                      </span>
                    </div>
                    <p className="whitespace-pre-line pl-3.5 text-xs text-muted-foreground">
                      {n.contenu}
                    </p>
                    <p className="pl-3.5 text-xs text-muted-foreground/70">
                      {n.quand}
                    </p>
                  </div>
                );

                return (
                  <li key={n.id}>
                    {n.lien ? (
                      <Link
                        href={n.lien}
                        onClick={() => ouvrirNotification(n.id)}
                        className="block hover:bg-muted"
                      >
                        {contenu}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => ouvrirNotification(n.id)}
                        className="block w-full text-left hover:bg-muted"
                      >
                        {contenu}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
