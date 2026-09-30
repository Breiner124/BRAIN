import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NodeShell } from "@/components/NodeShell";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/finance/ProgressBar";
import { IncomeQuickAdd } from "@/components/finance/IncomeQuickAdd";
import { ProjectionForm } from "@/components/finance/ProjectionForm";
import { ProjectionControls } from "@/components/finance/ProjectionControls";
import { ProjectionMeta } from "@/components/finance/ProjectionMeta";
import { getIngresos, getProyecciones, getUnidades } from "@/lib/data/repository";
import { formatCOP } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ConsultoriaPage() {
  const [unidades, ingresosRaw, proyeccionesRaw] = await Promise.all([
    getUnidades(),
    getIngresos(),
    getProyecciones(),
  ]);
  const unidad = unidades.find((u) => u.slug === "consultoria");
  const ingresos = ingresosRaw.filter((i) => i.fuente === "consultoria");
  const realizado = ingresos.reduce((s, i) => s + i.monto, 0);
  const proyecciones = proyeccionesRaw.filter(
    (p) => p.ambito === "empresarial" && p.unidad_id === unidad?.id
  );
  const esperadoTotal = proyecciones.reduce(
    (s, p) => s + (p.facturacion_esperada ?? 0),
    0
  );

  return (
    <NodeShell
      tipo="proyecciones"
      titulo="Consultoría"
      descripcion="Proyecciones de cobro y ganancias que se anexan y caen en Ganancias."
    >
      <Link
        href="/nodo/proyecciones/empresarial"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft size={14} /> Volver a Empresarial
      </Link>

      <Card className="mb-5">
        <ProgressBar
          label="Proyección esperada vs realizado"
          logrado={realizado}
          objetivo={esperadoTotal || realizado || 1}
          color="var(--c-yo)"
          mostrarMontos
        />
        <p className="mt-2 text-xs text-muted">
          Realizado {formatCOP(realizado)} · Esperado {formatCOP(esperadoTotal)}
        </p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-1">
          <Card>
            <IncomeQuickAdd
              unidades={unidades}
              fuenteFija="consultoria"
              origen="proy_consultoria"
              titulo="Anexar ganancia de consultoría"
            />
            <p className="mt-3 text-xs text-muted">
              Cae automáticamente en el Nodo Ganancias con la etiqueta &ldquo;vino de
              Proyección Consultoría&rdquo;.
            </p>
          </Card>
          <Card>
            <ProjectionForm
              variant="empresarial"
              unidadId={unidad?.id ?? null}
              titulo="Nueva proyección de consultoría"
            />
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
              Proyecciones de consultoría
            </p>
            {proyecciones.length === 0 ? (
              <p className="text-sm text-muted">
                Sin proyecciones aún. Registra cuánto esperas cobrar (con fecha) y anexa
                las ganancias cuando lleguen.
              </p>
            ) : (
              <ul className="space-y-3">
                {proyecciones.map((p) => (
                  <li key={p.id} className="rounded-xl border border-border bg-surface-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-fg">{p.nombre}</p>
                      <div className="flex flex-col items-end gap-1">
                        {p.facturacion_esperada ? (
                          <p className="font-bold text-fg">
                            {formatCOP(p.facturacion_esperada)}
                          </p>
                        ) : null}
                        <ProjectionControls p={p} />
                      </div>
                    </div>
                    <ProjectionMeta p={p} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </NodeShell>
  );
}
