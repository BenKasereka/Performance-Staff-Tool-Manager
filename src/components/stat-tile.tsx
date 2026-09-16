import { cn } from "@/lib/utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type ToneStatTile = "neutral" | "info" | "success" | "warning" | "destructive";

const FOND: Record<ToneStatTile, string> = {
  neutral: "",
  info: "border-primary/25 bg-primary/[0.06]",
  success: "border-success/25 bg-success/[0.06]",
  warning: "border-warning/25 bg-warning/[0.06]",
  destructive: "border-destructive/25 bg-destructive/[0.06]",
};

const TEXTE: Record<ToneStatTile, string> = {
  neutral: "",
  info: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function StatTile({
  libelle,
  valeur,
  tone = "neutral",
  className,
}: {
  libelle: string;
  valeur: React.ReactNode;
  tone?: ToneStatTile;
  className?: string;
}) {
  return (
    <Card className={cn(FOND[tone], className)}>
      <CardHeader className="pb-2">
        <CardDescription>{libelle}</CardDescription>
        <CardTitle className={cn("text-3xl tabular-nums", TEXTE[tone])}>
          {valeur}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
