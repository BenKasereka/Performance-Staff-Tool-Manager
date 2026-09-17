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
// classe `border`), donc une bordure gauche épaisse peut se rajouter sans
// conflit — c'est ce liseré + la puce en couleur pleine qui rendent la teinte
// vraiment visible plutôt qu'un simple lavis à peine perceptible.
const FOND: Record<ToneStatTile, string> = {
  neutral: "",
  info: "border-l-4 border-l-info ring-info/30 bg-info/[0.07]",
  success: "border-l-4 border-l-success ring-success/30 bg-success/[0.07]",
  warning: "border-l-4 border-l-warning ring-warning/30 bg-warning/[0.07]",
  destructive:
    "border-l-4 border-l-destructive ring-destructive/30 bg-destructive/[0.07]",
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
  info: "bg-info text-info-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  destructive: "bg-destructive text-destructive-foreground",
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
