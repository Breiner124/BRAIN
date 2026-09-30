import { NodeShell } from "@/components/NodeShell";
import { Card } from "@/components/ui/Card";
import { WeekBoard } from "@/components/yo/WeekBoard";
import {
  getReuniones,
  getSemanaActiva,
  getTareas,
} from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export default async function YoPage() {
  const [semana, reuniones] = await Promise.all([getSemanaActiva(), getReuniones()]);
  const tareas = semana ? await getTareas(semana.id) : [];

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
