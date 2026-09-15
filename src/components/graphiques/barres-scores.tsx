"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Donnee = { nom: string; score: number };

/** Bleu au-dessus de 70, ambre entre 50 et 70, rouge en dessous. */
function couleur(score: number) {
  if (score >= 70) return "var(--viz-1)";
  if (score >= 50) return "var(--viz-2)";
  return "var(--viz-critique)";
}

export function BarresScores({ donnees }: { donnees: Donnee[] }) {
  if (donnees.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aucune donnée sur cette période.
      </p>
    );
  }

  const hauteur = Math.max(160, donnees.length * 38 + 24);

  return (
    <ResponsiveContainer width="100%" height={hauteur}>
      <BarChart
        data={donnees}
        layout="vertical"
        margin={{ top: 4, right: 44, bottom: 4, left: 4 }}
        barCategoryGap="28%"
      >
        <CartesianGrid
          horizontal={false}
          stroke="var(--viz-grille)"
          strokeDasharray="0"
        />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickLine={false}
          axisLine={{ stroke: "var(--viz-axe)" }}
          tick={{ fill: "var(--viz-etiquette)", fontSize: 12 }}
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
          formatter={(valeur) => [`${valeur} / 100`, "Score global"]}
        />
        <Bar dataKey="score" radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {donnees.map((d) => (
            <Cell key={d.nom} fill={couleur(d.score)} />
          ))}
          {/* Étiquette directe : la couleur seule ne porte jamais la valeur. */}
          <LabelList
            dataKey="score"
            position="right"
            offset={8}
            style={{ fill: "var(--foreground)", fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
