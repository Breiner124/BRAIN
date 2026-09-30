import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NodeShell } from "@/components/NodeShell";
import { Card } from "@/components/ui/Card";
import { ProjectionForm } from "@/components/finance/ProjectionForm";
import { ProjectionPersonalCard } from "@/components/finance/ProjectionPersonalCard";
import { ProgressBar } from "@/components/finance/ProgressBar";
import { getProyecciones } from "@/lib/data/repository";
import { formatCOP } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProyeccionesPersonalesPage() {
  const personales = (await getProyecciones()).filter((p) => p.ambito === "personal");
  const objetivoGlobal = personales.reduce(
    (s, p) => s + (p.objetivo ?? p.costo_estimado ?? 0),
    0
  );
  const avanceGlobal = personales.reduce((s, p) => s + (p.avance ?? 0), 0);

  return (
    <NodeShell
      tipo="proyecciones"
      titulo="Proyecciones Personales"
      descripcion="Patrimonio y ahorro proyectado. Se alimenta del bolsillo (15% empresa + consultoría)."
    >
      <Link
        href="/nodo/proyecciones"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft size={14} /> Volver a Proyecciones
      </Link>

      {personales.length > 0 && (
        <Card className="mb-5">
          <ProgressBar
            label="Avance global personal"
            logrado={avanceGlobal}
            objetivo={objetivoGlobal || 1}
            color="var(--c-proyecciones)"
          />
          <p className="mt-2 text-xs text-muted">
            Ahorrado {formatCOP(avanceGlobal)} · Objetivo {formatCOP(objetivoGlobal)}
          </p>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <ProjectionForm variant="personal" titulo="Nueva proyección personal" />
          </Card>
        </div>
        <div className="lg:col-span-2">
          {personales.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">
                Aún no tienes proyecciones personales. Crea la primera (ej: &ldquo;Colchón
                de $20M para junio 2027&rdquo;) y ve llenando su barra con aportes.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {personales.map((p) => (
                <ProjectionPersonalCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </NodeShell>
  );
}
