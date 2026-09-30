import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { formatCOP } from "@/lib/format";
import type { Ingreso } from "@/lib/types";

const ORIGEN_LABEL: Record<string, string> = {
  ganancias: "Ganancias",
  proy_consultoria: "vino de Proyección Consultoría",
  proy_ecom: "vino de Proyección E-com",
};

const FUENTE_COLOR: Record<string, string> = {
  consultoria: "var(--c-yo)",
  ecom: "var(--c-ganancias)",
  otros: "var(--c-metas)",
};

export function IncomeList({ ingresos }: { ingresos: Ingreso[] }) {
  return (
    <Card>
      <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
        Bandeja unificada de ingresos
      </p>
      {ingresos.length === 0 ? (
        <p className="text-sm text-muted">
          Aún no has registrado ingresos. Usa el formulario de arriba para tu primer
          registro.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {ingresos.map((i) => (
            <li key={i.id} className="flex items-center gap-3 py-3">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: FUENTE_COLOR[i.fuente] ?? "var(--muted)" }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{i.descripcion}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <Badge>{i.fuente}</Badge>
                  {i.es_facturacion && <Badge>facturación · 15%</Badge>}
                  {i.origen_registro !== "ganancias" && (
                    <Badge>{ORIGEN_LABEL[i.origen_registro]}</Badge>
                  )}
                  <span className="text-xs text-muted">{i.fecha}</span>
                </div>
              </div>
              <span className="shrink-0 font-bold text-fg">{formatCOP(i.monto)}</span>
              <DeleteButton
                url={`/api/ingresos/${i.id}`}
                confirmar={`¿Eliminar el ingreso "${i.descripcion}"?`}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
