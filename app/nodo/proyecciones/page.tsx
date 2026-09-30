import Link from "next/link";
import { ArrowUpRight, TrendingUp, User, Building2 } from "lucide-react";
import { NodeShell } from "@/components/NodeShell";
import { Card } from "@/components/ui/Card";
import { getProyecciones, motor } from "@/lib/data/repository";
import { formatCOPCompact } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function ProyeccionesHubPage() {
  const proyecciones = getProyecciones();
  const m = motor();
  const personales = proyecciones.filter((p) => p.ambito === "personal");
  const empresariales = proyecciones.filter((p) => p.ambito === "empresarial");

  const subnodos = [
    {
      href: "/nodo/proyecciones/personales",
      icon: User,
      titulo: "Proyecciones Personales",
      desc: "Patrimonio, colchón y planes con fecha. Se alimentan del bolsillo.",
      dato: `${personales.length} proyección(es)`,
    },
    {
      href: "/nodo/proyecciones/empresarial",
      icon: Building2,
      titulo: "Proyección Empresarial",
      desc: "Cuánto esperamos ganar: Consultoría + E-com, con flujo bidireccional.",
      dato: `${empresariales.length} proyección(es)`,
    },
  ];

  return (
    <NodeShell
      tipo="proyecciones"
      titulo="Proyecciones"
      descripcion="Dos ramas: lo personal (tu bolsillo) y lo empresarial (cuánto esperamos ganar)."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {subnodos.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full transition hover:brightness-110">
              <div className="mb-3 flex items-center justify-between">
                <s.icon className="text-proyecciones" size={26} />
                <ArrowUpRight className="text-muted" size={18} />
              </div>
              <p className="text-lg font-bold text-fg">{s.titulo}</p>
              <p className="mt-1 text-sm text-muted">{s.desc}</p>
              <p className="mt-3 text-xs font-semibold text-proyecciones">{s.dato}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-proyecciones" size={20} />
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">
            Determinación automática de facturación
          </p>
        </div>
        <p className="mt-2 text-sm text-fg">
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
