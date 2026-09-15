import { Svg, Path, Line, Circle, Text as SvgText } from "@react-pdf/renderer";

import { ACCENT, ENCRE_MUETTE, TRAIT } from "./styles-pdf";

type Point = { periode: string; valeur: number | null };

const LARGEUR = 500;
const HAUTEUR = 140;
const MARGE_GAUCHE = 26;
const MARGE_BASSE = 18;
const MARGE_HAUTE = 8;

/**
 * Courbe tracée en SVG natif : @react-pdf n'exécute pas Recharts, et rasteriser
 * un PNG pour un rapport imprimable dégraderait la netteté.
 */
export function CourbePdf({ points }: { points: Point[] }) {
  if (points.length === 0) return null;

  const tracables = points.length;
  const largeurUtile = LARGEUR - MARGE_GAUCHE - 8;
  const hauteurUtile = HAUTEUR - MARGE_BASSE - MARGE_HAUTE;

  const x = (i: number) =>
    MARGE_GAUCHE + (tracables === 1 ? largeurUtile / 2 : (i / (tracables - 1)) * largeurUtile);
  const y = (v: number) => MARGE_HAUTE + hauteurUtile - (v / 100) * hauteurUtile;

  // Les périodes sans donnée coupent la ligne au lieu de la ramener à zéro.
  const segments: { i: number; v: number }[][] = [];
  let courant: { i: number; v: number }[] = [];
  points.forEach((p, i) => {
    if (p.valeur === null) {
      if (courant.length > 0) segments.push(courant);
      courant = [];
    } else {
      courant.push({ i, v: p.valeur });
    }
  });
  if (courant.length > 0) segments.push(courant);

  return (
    <Svg width={LARGEUR} height={HAUTEUR}>
      {[0, 25, 50, 75, 100].map((valeur) => (
        <Line
          key={valeur}
          x1={MARGE_GAUCHE}
          y1={y(valeur)}
          x2={LARGEUR - 8}
          y2={y(valeur)}
          strokeWidth={valeur === 0 ? 1 : 0.5}
          stroke={valeur === 0 ? ENCRE_MUETTE : TRAIT}
        />
      ))}

      {[0, 50, 100].map((valeur) => (
        <SvgText
          key={valeur}
          x={MARGE_GAUCHE - 6}
          y={y(valeur) + 3}
          style={{ fontSize: 7, fill: ENCRE_MUETTE, textAlign: "right" }}
        >
          {String(valeur)}
        </SvgText>
      ))}

      {segments.map((segment, index) => {
        if (segment.length === 1) {
          return (
            <Circle
              key={index}
              cx={x(segment[0].i)}
              cy={y(segment[0].v)}
              r={2.5}
              fill={ACCENT}
            />
          );
        }
        const d = segment
          .map((p, k) => `${k === 0 ? "M" : "L"}${x(p.i)},${y(p.v)}`)
          .join(" ");
        return (
          <Path key={index} d={d} stroke={ACCENT} strokeWidth={1.6} fill="none" />
        );
      })}

      {segments.flat().map((p) => (
        <Circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={2} fill={ACCENT} />
      ))}

      {points.map((p, i) => {
        // Une étiquette sur deux quand la série est dense, sinon elles se chevauchent.
        const pas = tracables > 8 ? 2 : 1;
        if (i % pas !== 0) return null;
        return (
          <SvgText
            key={p.periode + i}
            x={x(i)}
            y={HAUTEUR - 4}
            style={{ fontSize: 6.5, fill: ENCRE_MUETTE, textAlign: "center" }}
          >
            {p.periode}
          </SvgText>
        );
      })}
    </Svg>
  );
}
