import { NodeShell } from "@/components/NodeShell";
import { Card } from "@/components/ui/Card";
import { IncomeQuickAdd } from "@/components/finance/IncomeQuickAdd";
import { IncomeList } from "@/components/finance/IncomeList";
import { CrossingPanel } from "@/components/finance/CrossingPanel";
import { OptimalMeter } from "@/components/finance/OptimalMeter";
import { SurplusAdvisor } from "@/components/finance/SurplusAdvisor";
import { ProgressBar } from "@/components/finance/ProgressBar";
import { getIngresos, getUnidades, motor } from "@/lib/data/repository";
import { formatCOP } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function GananciasPage() {
  const [ingresos, unidades, m] = await Promise.all([
    getIngresos(),
    getUnidades(),
    motor(),
  ]);

  return (
    <NodeShell
      tipo="ganancias"
      titulo="Ganancias"
      descripcion="Centro de gravedad: consultoría, e-com y otros — una sola fuente de verdad."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-1">
          <Card>
            <IncomeQuickAdd unidades={unidades} />
          </Card>

          <Card>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Aportes sugeridos a metas
            </p>
            {m.optimo_metas.aportes.length === 0 ? (
              <p className="text-sm text-muted">Todas las metas están cubiertas 🎉</p>
            ) : (
              <ul className="space-y-3">
                {m.optimo_metas.aportes.map((a) => (
                  <li key={a.meta_id}>
                    <div className="flex justify-between text-sm">
                      <span className="text-fg">{a.nombre}</span>
                      <span className="font-semibold text-metas">
                        {formatCOP(a.aporte_mensual)}/mes
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      {a.meses_restantes} meses · faltan {formatCOP(a.restante)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <CrossingPanel cruce={m.cruce} />
          <OptimalMeter motor={m} />
          <Card>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Bolsillo proyectado (escenario medio)
            </p>
            <ProgressBar
              label="E-com (15%)"
              logrado={m.bolsillo.bolsillo_ecom}
              objetivo={m.bolsillo.bolsillo_total || 1}
              color="var(--c-ganancias)"
              mostrarMontos
            />
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-muted">E-com</p>
                <p className="font-bold text-fg">{formatCOP(m.bolsillo.bolsillo_ecom)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Consultoría</p>
                <p className="font-bold text-fg">
                  {formatCOP(m.bolsillo.ingresos_consultoria)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Otros</p>
                <p className="font-bold text-fg">{formatCOP(m.bolsillo.otros)}</p>
              </div>
            </div>
          </Card>
          <SurplusAdvisor rec={m.recomendacion} />
          <IncomeList ingresos={ingresos} />
        </div>
      </div>
    </NodeShell>
  );
}
