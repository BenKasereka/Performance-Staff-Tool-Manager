"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,

  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type LigneStatut = {
  nom: string;
  terminees: number;
  enCours: number;
  aFaire: number;
  enRetard: number;
};

const SEGMENTS = [
  { cle: "terminees", libelle: "Terminées", couleur: "var(--viz-bien)" },
  { cle: "enCours", libelle: "En cours", couleur: "var(--viz-1)" },
  { cle: "aFaire", libelle: "À faire", couleur: "var(--viz-neutre)" },
  { cle: "enRetard", libelle: "En retard", couleur: "var(--viz-critique)" },
] as const;

export function RepartitionStatuts({ donnees }: { donnees: LigneStatut[] }) {
  if (donnees.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aucune tâche sur cette période.
      </p>
    );
  }

  const hauteur = Math.max(160, donnees.length * 38 + 24);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4">
        {SEGMENTS.map((s) => (
          <span key={s.cle} className="flex items-center gap-1.5 text-xs">
            <span
              aria-hidden
              className="inline-block size-2.5 rounded-sm"
              style={{ background: s.couleur }}
            />
            <span className="text-muted-foreground">{s.libelle}</span>
          </span>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={hauteur}>
        <BarChart
          data={donnees}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
          barCategoryGap="28%"
        >
          <CartesianGrid horizontal={false} stroke="var(--viz-grille)" />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={{ stroke: "var(--viz-axe)" }}
            tick={{ fill: "var(--viz-etiquette)", fontSize: 12 }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="nom"
            width={116}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--viz-etiquette)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "var(--viz-grille)", fillOpacity: 0.4 }}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--card-foreground)",
            }}
          />
          {SEGMENTS.map((s, i) => (
            <Bar
              key={s.cle}
              dataKey={s.cle}
              name={s.libelle}
              stackId="taches"
              fill={s.couleur}
              // 2px de surface entre les segments empilés : les frontières
              // restent lisibles même quand deux teintes se ressemblent.
              stroke="var(--card)"
              strokeWidth={2}
              radius={i === SEGMENTS.length - 1 ? [0, 4, 4, 0] : 0}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
