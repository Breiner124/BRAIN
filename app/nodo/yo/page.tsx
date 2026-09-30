import { NodeShell } from "@/components/NodeShell";
import { Card } from "@/components/ui/Card";
import { WeekBoard } from "@/components/yo/WeekBoard";
import {
  getReuniones,
  getSemanaActiva,
  getTareas,
} from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export default function YoPage() {
  const semana = getSemanaActiva();
  const tareas = semana ? getTareas(semana.id) : [];
  const reuniones = getReuniones();

  return (
    <NodeShell
      tipo="yo"
      titulo="Yo"
      descripcion="Tu semana y tu trabajo diario que empuja metas y proyecciones."
    >
      {semana ? (
        <WeekBoard semana={semana} tareas={tareas} reuniones={reuniones} />
      ) : (
        <Card>
          <p className="text-sm text-muted">No hay semana activa.</p>
        </Card>
      )}
    </NodeShell>
  );
}
