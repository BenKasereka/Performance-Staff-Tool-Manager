import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type ToneStatTile = "neutral" | "info" | "success" | "warning" | "destructive";

// Le Card de base délimite ses bords avec `ring-1 ring-foreground/15` (pas de
// classe `border`) : c'est donc la couleur du ring qu'il faut surcharger ici
// pour qu'une teinte soit réellement visible, pas `border-*/*` qui n'a aucun
// effet sans largeur de bordure.
const FOND: Record<ToneStatTile, string> = {
  neutral: "",
  info: "ring-info/35 bg-info/10",
  success: "ring-success/35 bg-success/10",
  warning: "ring-warning/35 bg-warning/10",
  destructive: "ring-destructive/35 bg-destructive/10",
};

const TEXTE: Record<ToneStatTile, string> = {
  neutral: "text-foreground",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

const PUCE: Record<ToneStatTile, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
};

export function StatTile({
  libelle,
  valeur,
  tone = "neutral",
  icon: Icon,
  className,
}: {
  libelle: string;
  valeur: React.ReactNode;
  tone?: ToneStatTile;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <Card className={cn(FOND[tone], className)}>
      <CardHeader className="pb-2">
        <CardDescription>{libelle}</CardDescription>
        <CardTitle className={cn("text-3xl font-bold tabular-nums", TEXTE[tone])}>
          {valeur}
        </CardTitle>
        {Icon && (
          <CardAction>
            <span
              aria-hidden
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full",
                PUCE[tone],
              )}
            >
              <Icon className="size-4.5" />
            </span>
          </CardAction>
        )}
      </CardHeader>
    </Card>
  );
}
