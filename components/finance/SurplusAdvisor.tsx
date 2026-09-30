import { Card } from "@/components/ui/Card";
import { formatCOP, formatPct } from "@/lib/format";
import type { Recomendacion } from "@/lib/engine";

export function SurplusAdvisor({ rec }: { rec: Recomendacion }) {
  return (
    <Card>
      <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">
        Recomendador de excedente
      </p>
      {!rec.hay_excedente ? (
        <p className="text-sm text-muted">
          Aún no hay excedente sobre los óptimos. Cuando el flujo neto supere lo que
          exigen proyecciones y metas, aquí verás cómo repartirlo.{" "}
          {rec.excedente < 0 && (
            <span className="text-danger">
              Faltan {formatCOP(Math.abs(rec.excedente))}/mes.
            </span>
          )}
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-fg">
            Excedente disponible:{" "}
            <span className="font-bold text-ganancias">{formatCOP(rec.excedente)}</span>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {rec.sugerencias.map((s) => (
              <div
                key={s.concepto}
                className="rounded-xl border border-border bg-surface-2 p-3"
              >
                <p className="text-xs uppercase text-muted">
                  {s.concepto} · {formatPct(s.fraccion, 0)}
                </p>
                <p className="mt-0.5 text-lg font-bold text-fg">{formatCOP(s.monto)}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Solo sugerencias. Tú decides — nunca se mueve dinero automáticamente.
          </p>
        </>
      )}
    </Card>
  );
}
