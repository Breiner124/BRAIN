import { TopNav } from "@/components/TopNav";
import { NeuralGraph } from "@/components/graph/NeuralGraph";
import { getNodos, getConexiones } from "@/lib/data/repository";
import { construirResumen } from "@/lib/summary";

// El store en memoria cambia entre requests → render dinámico.
export const dynamic = "force-dynamic";

export default function HomePage() {
  const nodos = getNodos();
  const conexiones = getConexiones();
  const resumen = construirResumen();

  return (
    <main className="relative">
      <TopNav />
      <NeuralGraph nodos={nodos} conexiones={conexiones} resumen={resumen} />
    </main>
  );
}
