"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type PointEvolution = {
  periode: string;
  [serie: string]: string | number | null;
};

type Props = {
  donnees: PointEvolution[];
  series: { cle: string; libelle: string }[];
  unite?: string;
};

const COULEURS = ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)"];

export function CourbeEvolution({ donnees, series, unite = "" }: Props) {
  if (donnees.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Pas encore assez d&apos;historique pour tracer une évolution.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {series.length > 1 && (
        <div className="flex flex-wrap gap-4">
          {series.map((s, i) => (
            <span key={s.cle} className="flex items-center gap-1.5 text-xs">
              <span
                aria-hidden
                className="inline-block size-2.5 rounded-full"
                style={{ background: COULEURS[i % COULEURS.length] }}
              />
              <span className="text-muted-foreground">{s.libelle}</span>
            </span>
          ))}
        </div>
      )}

      <ResponsiveContainer width="100%" height={240}>
        <LineChart
          data={donnees}
          margin={{ top: 8, right: 12, bottom: 4, left: -16 }}
        >
          <CartesianGrid vertical={false} stroke="var(--viz-grille)" />
          <XAxis
            dataKey="periode"
            tickLine={false}
            axisLine={{ stroke: "var(--viz-axe)" }}
            tick={{ fill: "var(--viz-etiquette)", fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--viz-etiquette)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ stroke: "var(--viz-axe)", strokeWidth: 1 }}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--card-foreground)",
            }}
            formatter={(valeur, nom) => [`${valeur}${unite}`, nom]}
          />
          {series.map((s, i) => (
            <Line
              key={s.cle}
              type="monotone"
              dataKey={s.cle}
              name={s.libelle}
              stroke={COULEURS[i % COULEURS.length]}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              // Les périodes sans donnée laissent un trou plutôt qu'un zéro.
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
