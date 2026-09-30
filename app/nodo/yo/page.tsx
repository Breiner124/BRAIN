import { NodeShell } from "@/components/NodeShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

const AMBITOS = [
  { key: "consultoria", label: "Consultoría", color: "var(--c-yo)" },
  { key: "ecom", label: "E-com", color: "var(--c-ganancias)" },
  { key: "personal", label: "Personal", color: "var(--c-metas)" },
];

export default function YoPage() {
  return (
    <NodeShell
      tipo="yo"
      titulo="Yo"
      descripcion="Tu semana y tu trabajo diario que empuja metas y proyecciones."
    >
      <Card className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-muted">Semana activa</p>
          <p className="text-lg font-bold text-fg">Vista lunes – domingo</p>
        </div>
        <Badge>Fase 2: iniciar semana + arrastre de tareas</Badge>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {AMBITOS.map((a) => (
          <Card key={a.key}>
            <div className="mb-3 flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: a.color, boxShadow: `0 0 8px ${a.color}` }}
              />
              <p className="font-semibold text-fg">{a.label}</p>
            </div>
            <p className="text-sm text-muted">
              Sin tareas esta semana. El tablero semanal completo (con reuniones y
              tareas heredadas) llega en la Fase 2.
            </p>
          </Card>
        ))}
      </div>
    </NodeShell>
  );
}
