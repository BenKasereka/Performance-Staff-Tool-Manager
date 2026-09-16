import { cn } from "@/lib/utils";

/**
 * Forme organique décorative (fond de page/en-tête). Purement visuelle :
 * `aria-hidden` et jamais de contenu informatif dedans.
 */
export function Blob({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="-100 -100 200 200"
      className={cn("pointer-events-none select-none", className)}
    >
      <path
        fill="currentColor"
        d="M43.6,-64.5C55.4,-57.7,62.7,-43.1,68.4,-28.2C74.1,-13.3,78.2,1.9,75.6,16.3C73,30.7,63.7,44.3,51.2,54.7C38.7,65.1,23,72.3,5.9,68.1C1,66.7,-11.3,73.1,-24.6,71.6C-37.9,70.1,-52.2,60.7,-61.8,47.7C-71.4,34.7,-76.3,18.1,-76.5,1.4C-76.7,-15.3,-72.2,-30.6,-63.1,-42.6C-54,-54.6,-40.3,-63.3,-26.1,-70.1C-11.9,-76.9,2.8,-81.8,17.6,-79.6C32.4,-77.4,47.8,-71.3,43.6,-64.5Z"
      />
    </svg>
  );
}
