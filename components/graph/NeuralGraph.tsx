"use client";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo, useState } from "react";
import { NodeCard } from "@/components/graph/NodeCard";
import { SynapseEdge } from "@/components/graph/SynapseEdge";
import { PeekPanel } from "@/components/graph/PeekPanel";
import type { Conexion, Nodo } from "@/lib/types";
import type { ResumenNodo } from "@/lib/summary";
import { formatCOPCompact, formatPct } from "@/lib/format";
import { NODE_COLORS } from "@/lib/utils";

const CANVAS_W = 1100;
const CANVAS_H = 640;

const nodeTypes = { cerebro: NodeCard };
const edgeTypes = { synapse: SynapseEdge };

function metricFor(tipo: string, r: ResumenNodo): string | undefined {
  switch (tipo) {
    case "ganancias":
      return `${formatCOPCompact(r.ganancias.total_mes)}/mes`;
    case "deudas":
      return formatCOPCompact(r.deudas.saldo_total);
    case "metas":
      return formatPct(
        r.metas.objetivo_global > 0
          ? r.metas.logrado_global / r.metas.objetivo_global
          : 0,
        0
      );
    case "proyecciones":
      return formatCOPCompact(r.proyecciones.bolsillo_estimado);
    case "central":
      return { verde: "🟢", amarillo: "🟡", rojo: "🔴" }[r.maestro.semaforo];
    default:
      return undefined;
  }
}

interface Props {
  nodos: Nodo[];
  conexiones: Conexion[];
  resumen: ResumenNodo;
}

export function NeuralGraph({ nodos, conexiones, resumen }: Props) {
  const [seleccion, setSeleccion] = useState<{ tipo: string; titulo: string } | null>(
    null
  );

  const rfNodes: Node[] = useMemo(
    () =>
      nodos.map((n) => ({
        id: n.id,
        type: "cerebro",
        position: { x: n.posicion_x * CANVAS_W, y: n.posicion_y * CANVAS_H },
        data: {
          tipo: n.tipo,
          titulo: n.titulo,
          resumen: n.resumen,
          icono: n.icono,
          central: n.tipo === "central",
          metric: metricFor(n.tipo, resumen),
        },
        draggable: true,
      })),
    [nodos, resumen]
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      conexiones.map((c) => ({
        id: c.id,
        source: c.origen_id,
        target: c.destino_id,
        type: "synapse",
        data: { tipo_flujo: c.tipo_flujo },
      })),
    [conexiones]
  );

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const d = node.data as { tipo: string; titulo: string };
      setSeleccion({ tipo: d.tipo, titulo: d.titulo });
    },
    []
  );

  return (
    <div className="h-[calc(100dvh-3.5rem)] w-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.4}
        maxZoom={1.6}
        nodesConnectable={false}
        edgesFocusable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="#1c2233" />
        <Controls
          showInteractive={false}
          className="!border-border !bg-surface-2 [&_button]:!border-border [&_button]:!bg-surface [&_button]:!fill-fg"
        />
      </ReactFlow>

      <PeekPanel
        nodo={seleccion}
        resumen={resumen}
        onClose={() => setSeleccion(null)}
      />

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-center text-xs text-muted">
        Toca un nodo para ver su resumen · arrastra para reorganizar tu cerebro
      </div>
    </div>
  );
}
