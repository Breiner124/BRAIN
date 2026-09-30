import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Color CSS var por tipo de nodo (para el grafo y las cabeceras). */
export const NODE_COLORS: Record<string, string> = {
  central: "var(--c-central)",
  yo: "var(--c-yo)",
  proyecciones: "var(--c-proyecciones)",
  proy_personal: "var(--c-proyecciones)",
  proy_empresarial: "var(--c-proyecciones)",
  metas: "var(--c-metas)",
  ganancias: "var(--c-ganancias)",
  deudas: "var(--c-deudas)",
  testeos: "var(--c-testeos)",
};
