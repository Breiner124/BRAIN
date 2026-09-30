import { NodeShell } from "@/components/NodeShell";
import { Card } from "@/components/ui/Card";
import { MetaCard } from "@/components/finance/MetaCard";
import { ProgressBar } from "@/components/finance/ProgressBar";
import { getMetas, motor } from "@/lib/data/repository";
import { formatCOP } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function MetasPage() {
  const metas = [...getMetas()].sort((a, b) => a.prioridad - b.prioridad);
  const m = motor();
  const aportePorMeta = new Map(
    m.optimo_metas.aportes.map((a) => [a.meta_id, a])
  );

  const objetivoGlobal = metas.reduce((s, x) => s + x.costo_objetivo, 0);
  const logradoGlobal = metas.reduce((s, x) => s + x.ahorrado, 0);

  return (
    <NodeShell
      tipo="metas"
      titulo="Metas"
      descripcion="Cada meta muestra cuánto apartar por mes para llegar a tiempo."
    >
      <Card className="mb-5">
        <ProgressBar
          label="Progreso global de metas"
          logrado={logradoGlobal}
          objetivo={objetivoGlobal}
          color="var(--c-metas)"
        />
        <p className="mt-2 text-xs text-muted">
          Total objetivo {formatCOP(objetivoGlobal)} · Ahorrado {formatCOP(logradoGlobal)} ·
          Óptimo mensual {formatCOP(m.optimo_metas.optimo_metas)}
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {metas.map((meta) => {
          const a = aportePorMeta.get(meta.id);
          return (
            <MetaCard
              key={meta.id}
              meta={meta}
              aporteMensual={a?.aporte_mensual}
              mesesRestantes={a?.meses_restantes}
            />
          );
        })}
      </div>
    </NodeShell>
  );
}
