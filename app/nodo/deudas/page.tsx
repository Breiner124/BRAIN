import { NodeShell } from "@/components/NodeShell";
import { Card } from "@/components/ui/Card";
import { DebtCard } from "@/components/finance/DebtCard";
import { getDeudas } from "@/lib/data/repository";
import { formatCOP } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function DeudasPage() {
  const deudas = [...getDeudas()].sort(
    (a, b) => a.nivel_importancia - b.nivel_importancia
  );
  const activas = deudas.filter((d) => d.estado === "activa");
  const saldoTotal = activas.reduce((s, d) => s + d.saldo_actual, 0);

  return (
    <NodeShell
      tipo="deudas"
      titulo="Deudas"
      descripcion="Ordenadas por nivel de importancia (1 = más importante)."
    >
      <Card className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-muted">Saldo total activo</p>
          <p className="text-2xl font-bold text-fg">{formatCOP(saldoTotal)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-muted">Deudas activas</p>
          <p className="text-2xl font-bold text-fg">{activas.length}</p>
        </div>
      </Card>

      {deudas.length === 0 ? (
        <p className="text-sm text-muted">No hay deudas registradas.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {deudas.map((d) => (
            <DebtCard key={d.id} deuda={d} />
          ))}
        </div>
      )}
    </NodeShell>
  );
}
