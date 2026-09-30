import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NodeShell } from "@/components/NodeShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { IncomeQuickAdd } from "@/components/finance/IncomeQuickAdd";
import { ProjectionForm } from "@/components/finance/ProjectionForm";
import { ScenarioSlider } from "@/components/finance/ScenarioSlider";
import {
  getEscenarios,
  getProfile,
  getProyecciones,
  getUnidades,
} from "@/lib/data/repository";
import { facturacionParaRentabilizar } from "@/lib/engine";
import { formatCOP } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function EcomPage() {
  const unidades = getUnidades();
  const unidad = unidades.find((u) => u.slug === "ecom");
  const margen = getProfile().margen_neto_bolsillo;
  const escenarios = getEscenarios();
  const proyecciones = getProyecciones().filter(
    (p) => p.ambito === "empresarial" && p.unidad_id === unidad?.id
  );
  const expansiones = proyecciones.filter(
    (p) => p.tipo === "expansion" || p.tipo === "contratacion"
  );

  return (
    <NodeShell
      tipo="proyecciones"
      titulo="Empresa E-com"
      descripcion="Facturación con margen 15%, escenarios y expansión con ROI."
    >
      <Link
        href="/nodo/proyecciones/empresarial"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft size={14} /> Volver a Empresarial
      </Link>

      <Card className="mb-5">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          Escenarios de facturación → bolsillo
        </p>
        <ScenarioSlider escenarios={escenarios} margen={margen} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-1">
          <Card>
            <IncomeQuickAdd
              unidades={unidades}
              fuenteFija="ecom"
              origen="proy_ecom"
              titulo="Anexar ganancia de e-com"
            />
            <p className="mt-3 text-xs text-muted">
              Marca &ldquo;facturación bruta&rdquo; para que se le aplique el 15%. Cae en
              Ganancias con la etiqueta &ldquo;vino de Proyección E-com&rdquo;.
            </p>
          </Card>
          <Card>
            <ProjectionForm
              variant="empresarial"
              unidadId={unidad?.id ?? null}
              titulo="Nueva proyección de e-com"
            />
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
              Expansiones y su ROI (§6.7)
            </p>
            {expansiones.length === 0 ? (
              <p className="text-sm text-muted">
                Sin expansiones registradas. Una expansión con costo recurrente se
                justifica cuando habilita suficiente facturación para pagarse sola.
              </p>
            ) : (
              <ul className="space-y-3">
                {expansiones.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-xl border border-border bg-surface-2 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-fg">{p.nombre}</p>
                      <Badge>{p.estado}</Badge>
                    </div>
                    {p.costo_recurrente ? (
                      <p className="mt-1 text-xs text-muted">
                        Costo {formatCOP(p.costo_recurrente)}/mes · necesita habilitar ≥{" "}
                        <span className="font-semibold text-proyecciones">
                          {formatCOP(
                            facturacionParaRentabilizar(p.costo_recurrente, margen)
                          )}
                          /mes
                        </span>{" "}
                        de facturación para pagarse sola.
                      </p>
                    ) : null}
                    {p.fecha_objetivo && (
                      <p className="text-xs text-muted">Objetivo: {p.fecha_objetivo}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {proyecciones.filter((p) => p.tipo === "ingreso_esperado").length > 0 && (
            <Card className="mt-5">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                Facturación esperada
              </p>
              <ul className="space-y-2">
                {proyecciones
                  .filter((p) => p.tipo === "ingreso_esperado")
                  .map((p) => (
                    <li key={p.id} className="flex justify-between text-sm">
                      <span className="text-fg">{p.nombre}</span>
                      <span className="font-semibold text-fg">
                        {formatCOP(p.facturacion_esperada ?? 0)}/mes
                      </span>
                    </li>
                  ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </NodeShell>
  );
}
