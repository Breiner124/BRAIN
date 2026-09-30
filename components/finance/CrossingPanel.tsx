import { Card } from "@/components/ui/Card";
import { formatCOP } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Cruce } from "@/lib/engine";

function Bloque({
  titulo,
  valor,
  detalle,
  tono,
}: {
  titulo: string;
  valor: number;
  detalle?: string;
  tono: "ingreso" | "egreso" | "neto";
}) {
  const color =
    tono === "ingreso"
      ? "text-ganancias"
      : tono === "egreso"
      ? "text-deudas"
      : valor >= 0
      ? "text-ganancias"
      : "text-deudas";
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-4">
      <p className="text-xs uppercase text-muted">{titulo}</p>
      <p className={cn("mt-1 text-xl font-bold", color)}>{formatCOP(valor)}</p>
      {detalle && <p className="text-xs text-muted">{detalle}</p>}
    </div>
  );
}

export function CrossingPanel({ cruce }: { cruce: Cruce }) {
  return (
    <Card>
      <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
        Cruce ingresos vs egresos
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Bloque titulo="Ingreso mensual" valor={cruce.ingreso_mensual} tono="ingreso" />
        <Bloque
          titulo="Egresos"
          valor={cruce.egreso_total}
          tono="egreso"
          detalle={`Fijo ${formatCOP(cruce.egreso_fijo)} · Variable ${formatCOP(
            cruce.egreso_variable
          )}`}
        />
        <Bloque
          titulo="Flujo neto (al bolsillo)"
          valor={cruce.flujo_neto}
          tono="neto"
        />
      </div>
    </Card>
  );
}
