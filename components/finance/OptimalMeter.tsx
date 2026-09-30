import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/finance/ProgressBar";
import { formatCOP, formatCOPCompact } from "@/lib/format";
import type { ResultadoMotor } from "@/lib/engine";

const SEMAFORO = {
  verde: { emoji: "🟢", texto: "Cubres proyecciones y metas", color: "var(--c-ok)" },
  amarillo: { emoji: "🟡", texto: "Cubres proyecciones, no metas", color: "var(--c-warn)" },
  rojo: { emoji: "🔴", texto: "No cubres proyecciones", color: "var(--c-danger)" },
} as const;

export function OptimalMeter({ motor }: { motor: ResultadoMotor }) {
  const c = motor.combinado;
  const s = SEMAFORO[c.semaforo];
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">
            Indicador maestro
          </p>
          <p className="text-lg font-bold text-fg">{s.texto}</p>
        </div>
        <span className="text-4xl" title={c.semaforo}>
          {s.emoji}
        </span>
      </div>

      <ProgressBar
        label="Facturación real vs ideal (diaria)"
        logrado={c.facturacion_real_diaria}
        objetivo={c.facturacion_diaria_ideal || 1}
        color={s.color}
        mostrarMontos={false}
      />
      <p className="mt-1 text-xs text-muted">
        Real {formatCOPCompact(c.facturacion_real_diaria)}/día · Ideal{" "}
        {formatCOPCompact(c.facturacion_diaria_ideal)}/día
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-2 p-4">
          <p className="text-xs uppercase text-muted">Óptimo #1 — Proyecciones + Deudas</p>
          <p className="mt-1 text-xl font-bold text-fg">
            {formatCOP(c.optimo_proyecciones)}
            <span className="text-sm font-normal text-muted">/mes</span>
          </p>
          <p className="text-xs text-muted">
            ≈ {formatCOPCompact(c.facturacion_diaria_para_proyecciones)}/día de facturación
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-2 p-4">
          <p className="text-xs uppercase text-muted">Óptimo #2 — Metas</p>
          <p className="mt-1 text-xl font-bold text-fg">
            {formatCOP(c.optimo_metas)}
            <span className="text-sm font-normal text-muted">/mes</span>
          </p>
          <p className="text-xs text-muted">
            {formatCOP(c.optimo_total)}/mes en total (ambos óptimos)
          </p>
        </div>
      </div>
    </Card>
  );
}
