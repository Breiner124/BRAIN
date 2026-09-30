import { CalendarClock } from "lucide-react";
import type { Proyeccion } from "@/lib/types";

// Muestra la fecha objetivo y las notas de una proyección (si existen).
export function ProjectionMeta({ p }: { p: Proyeccion }) {
  const notas = (p.detalle?.notas as string | undefined)?.trim();
  if (!p.fecha_objetivo && !notas) return null;
  return (
    <div className="mt-2 space-y-1">
      {p.fecha_objetivo && (
        <p className="flex items-center gap-1 text-xs text-muted">
          <CalendarClock size={12} />
          {p.fecha_tipo === "fija" ? "Fecha fija: " : "Objetivo: "}
          <span className="font-medium text-fg">{p.fecha_objetivo}</span>
        </p>
      )}
      {notas && (
        <p className="whitespace-pre-wrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-muted">
          {notas}
        </p>
      )}
    </div>
  );
}
