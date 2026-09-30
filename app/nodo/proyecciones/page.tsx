import Link from "next/link";
import { NodeShell } from "@/components/NodeShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/finance/ProgressBar";
import {
  getEscenarios,
  getProfile,
  getProyecciones,
  motor,
} from "@/lib/data/repository";
import { bolsilloDeEscenario, facturacionParaRentabilizar } from "@/lib/engine";
import { formatCOP, formatCOPCompact } from "@/lib/format";

export const dynamic = "force-dynamic";

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  lograda: "Lograda",
};

export default function ProyeccionesPage() {
  const profile = getProfile();
  const escenarios = getEscenarios();
  const proyecciones = getProyecciones();
  const m = motor();
  const margen = profile.margen_neto_bolsillo;

  const personales = proyecciones.filter((p) => p.ambito === "personal");
  const empresariales = proyecciones.filter((p) => p.ambito === "empresarial");

  return (
    <NodeShell
      tipo="proyecciones"
      titulo="Proyecciones"
      descripcion="Personales (tu bolsillo) y Empresarial (cuánto esperamos ganar)."
    >
      {/* Escenarios de facturación empresarial (§9) */}
      <Card className="mb-5">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          Proyección Empresarial → E-com · escenarios de facturación
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {escenarios.map((e) => {
            const bolsillo = bolsilloDeEscenario(e.facturacion_mes, margen);
            return (
              <div
                key={e.clave}
                className="rounded-xl border border-border bg-surface-2 p-4"
              >
                <p className="text-xs uppercase text-muted">{e.nombre}</p>
                <p className="mt-1 text-lg font-bold text-fg">
                  {formatCOPCompact(e.facturacion_mes)}/mes
                </p>
                <p className="text-xs text-proyecciones">
                  Bolsillo {formatCOPCompact(bolsillo)} ({(margen * 100).toFixed(0)}%)
                </p>
                <p className="text-xs text-muted">
                  ≈ {formatCOPCompact(e.facturacion_mes / 30)}/día
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Empresarial */}
        <Card>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Proyección Empresarial
          </p>
          {empresariales.length === 0 ? (
            <p className="text-sm text-muted">Sin proyecciones empresariales aún.</p>
          ) : (
            <ul className="space-y-4">
              {empresariales.map((p) => (
                <li key={p.id} className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-fg">{p.nombre}</p>
                    <Badge>{ESTADO_LABEL[p.estado]}</Badge>
                  </div>
                  {p.facturacion_esperada ? (
                    <p className="mt-1 text-sm text-muted">
                      Facturación esperada:{" "}
                      <span className="font-semibold text-fg">
                        {formatCOP(p.facturacion_esperada)}/mes
                      </span>
                    </p>
                  ) : null}
                  {p.costo_recurrente ? (
                    <p className="mt-1 text-xs text-muted">
                      Costo recurrente {formatCOP(p.costo_recurrente)}/mes · ROI: necesita
                      habilitar ≥{" "}
                      <span className="font-semibold text-proyecciones">
                        {formatCOP(
                          facturacionParaRentabilizar(p.costo_recurrente, margen)
                        )}
                        /mes
                      </span>{" "}
                      de facturación para pagarse sola.
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted">
            El flujo bidireccional de ganancias (anexar desde aquí a{" "}
            <Link href="/nodo/ganancias" className="text-ganancias underline">
              Ganancias
            </Link>
            ) se completa en la Fase 2. La base y el motor ya están listos.
          </p>
        </Card>

        {/* Personales */}
        <Card>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Proyecciones Personales
          </p>
          {personales.length === 0 ? (
            <p className="text-sm text-muted">
              Aún no hay proyecciones personales. Aquí modelarás tu patrimonio, colchón y
              planes con fecha (llega con más UI en la Fase 2). Se alimentan del bolsillo
              (15% de la empresa + consultoría) que llega vía Ganancias.
            </p>
          ) : (
            <ul className="space-y-4">
              {personales.map((p) => (
                <li key={p.id}>
                  <ProgressBar
                    label={p.nombre}
                    logrado={0}
                    objetivo={p.costo_estimado ?? 1}
                    color="var(--c-proyecciones)"
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-5">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          Determinación automática de facturación
        </p>
        <p className="text-sm text-fg">
          Para sostener proyecciones + deudas apunta a facturar ≥{" "}
          <span className="font-bold text-proyecciones">
            {formatCOPCompact(m.combinado.facturacion_diaria_para_proyecciones)}/día
          </span>
          . Para cubrir además todas las metas, ≥{" "}
          <span className="font-bold text-metas">
            {formatCOPCompact(m.combinado.facturacion_diaria_ideal)}/día
          </span>
          .
        </p>
      </Card>
    </NodeShell>
  );
}
