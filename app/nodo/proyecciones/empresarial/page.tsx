import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Briefcase, ShoppingCart } from "lucide-react";
import { NodeShell } from "@/components/NodeShell";
import { Card } from "@/components/ui/Card";
import {
  getEscenarios,
  getIngresos,
  getProfile,
  getProyecciones,
} from "@/lib/data/repository";
import { bolsilloDeEscenario } from "@/lib/engine";
import { formatCOPCompact } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function EmpresarialHubPage() {
  const proyecciones = getProyecciones().filter((p) => p.ambito === "empresarial");
  const ingresos = getIngresos();
  const escenarios = getEscenarios();
  const margen = getProfile().margen_neto_bolsillo;

  const realizadoConsultoria = ingresos
    .filter((i) => i.fuente === "consultoria")
    .reduce((s, i) => s + i.monto, 0);
  const realizadoEcom = ingresos
    .filter((i) => i.fuente === "ecom")
    .reduce((s, i) => s + (i.es_facturacion ? i.monto * margen : i.monto), 0);

  const medio = escenarios.find((e) => e.clave === "medio") ?? escenarios[0];
  const bolsilloMedio = bolsilloDeEscenario(medio.facturacion_mes, margen);

  const unidades = [
    {
      href: "/nodo/proyecciones/empresarial/consultoria",
      icon: Briefcase,
      titulo: "Consultoría",
      desc: "Proyecciones de cobro y anexar ganancias que caen en Ganancias.",
      dato: `Realizado ${formatCOPCompact(realizadoConsultoria)}`,
    },
    {
      href: "/nodo/proyecciones/empresarial/ecom",
      icon: ShoppingCart,
      titulo: "Empresa E-com",
      desc: "Facturación con margen 15%, escenarios y expansión (ROI).",
      dato: `Bolsillo estimado ${formatCOPCompact(bolsilloMedio)}/mes`,
    },
  ];

  return (
    <NodeShell
      tipo="proyecciones"
      titulo="Proyección Empresarial"
      descripcion="Cuánto esperamos ganar. Dos unidades, una sola fuente de verdad en Ganancias."
    >
      <Link
        href="/nodo/proyecciones"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft size={14} /> Volver a Proyecciones
      </Link>

      <div className="grid gap-4 sm:grid-cols-2">
        {unidades.map((u) => (
          <Link key={u.href} href={u.href}>
            <Card className="h-full transition hover:brightness-110">
              <div className="mb-3 flex items-center justify-between">
                <u.icon className="text-proyecciones" size={26} />
                <ArrowUpRight className="text-muted" size={18} />
              </div>
              <p className="text-lg font-bold text-fg">{u.titulo}</p>
              <p className="mt-1 text-sm text-muted">{u.desc}</p>
              <p className="mt-3 text-xs font-semibold text-proyecciones">{u.dato}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-5">
        <p className="text-sm text-fg">
          <span className="font-semibold">{proyecciones.length}</span> proyecciones
          empresariales activas. El bolsillo de e-com{" "}
          <span className="text-muted">más</span> consultoría{" "}
          <span className="text-muted">más</span> otros alimentan metas, proyecciones
          personales y deudas.
        </p>
      </Card>
    </NodeShell>
  );
}
