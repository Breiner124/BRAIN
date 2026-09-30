import { Download, CalendarClock } from "lucide-react";
import { NodeShell } from "@/components/NodeShell";
import { Card } from "@/components/ui/Card";
import { ReportCharts } from "@/components/reports/ReportCharts";
import {
  getEgresos,
  getIngresos,
  getProfile,
  getReuniones,
} from "@/lib/data/repository";
import { serieMensual, totalesReporte } from "@/lib/reports";
import { formatCOP } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function ReportesPage() {
  const margen = getProfile().margen_neto_bolsillo;
  const serie = serieMensual(getIngresos(), getEgresos(), margen, new Date(), 6);
  const totales = totalesReporte(serie);
  const reuniones = getReuniones();
  const calendly = reuniones.filter((r) => r.fuente === "calendly").length;

  const tiles = [
    { label: "Ingreso (6 meses)", valor: totales.ingreso_total, color: "text-ganancias" },
    { label: "Egreso (6 meses)", valor: totales.egreso_total, color: "text-deudas" },
    { label: "Flujo neto (6 meses)", valor: totales.flujo_total, color: "text-central" },
  ];

  return (
    <NodeShell
      tipo="central"
      titulo="Reportes"
      descripcion="Gráficas por fuente y tiempo, exportables e integración de calendario."
    >
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {tiles.map((t) => (
          <Card key={t.label}>
            <p className="text-xs uppercase text-muted">{t.label}</p>
            <p className={`mt-1 text-2xl font-bold ${t.color}`}>{formatCOP(t.valor)}</p>
          </Card>
        ))}
      </div>

      <ReportCharts serie={serie} />

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Exportables (CSV)
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/api/export/ingresos"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2 text-sm font-semibold text-fg hover:brightness-125"
            >
              <Download size={16} /> Ingresos
            </a>
            <a
              href="/api/export/egresos"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2 text-sm font-semibold text-fg hover:brightness-125"
            >
              <Download size={16} /> Egresos
            </a>
          </div>
          <p className="mt-3 text-xs text-muted">
            Se descargan con BOM UTF-8 para abrir bien en Excel (tildes incluidas).
          </p>
        </Card>

        <Card>
          <div className="mb-2 flex items-center gap-2">
            <CalendarClock size={18} className="text-yo" />
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">
              Calendario (Calendly)
            </p>
          </div>
          <p className="text-sm text-fg">
            Reuniones sincronizadas desde Calendly:{" "}
            <span className="font-bold text-yo">{calendly}</span>
          </p>
          <p className="mt-2 text-xs text-muted">
            El webhook <code className="text-fg">/api/webhooks/calendly</code> ya está
            listo (con verificación de firma). Configura{" "}
            <code className="text-fg">CALENDLY_WEBHOOK_SIGNING_KEY</code> y suscribe tu URL
            pública de Vercel. Ver README §Calendly.
          </p>
        </Card>
      </div>
    </NodeShell>
  );
}
