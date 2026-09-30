import { NodeShell } from "@/components/NodeShell";
import { TesteosBoard } from "@/components/testeos/TesteosBoard";
import { getNotas, getTesteos } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export default async function TesteosPage() {
  const [testeos, notas] = await Promise.all([getTesteos(), getNotas()]);

  return (
    <NodeShell
      tipo="testeos"
      titulo="Testeos"
      descripcion="Programa testeos de producto y guarda lo que dicen tus mentores, ideas y tareas."
    >
      <TesteosBoard testeos={testeos} notas={notas} />
    </NodeShell>
  );
}
