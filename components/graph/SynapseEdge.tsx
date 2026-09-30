"use client";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

interface SynapseData {
  tipo_flujo?: "financiero" | "tarea" | "informativo";
  color?: string;
  [key: string]: unknown;
}

export function SynapseEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const d = (data ?? {}) as SynapseData;
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const financiero = d.tipo_flujo === "financiero";
  const tarea = d.tipo_flujo === "tarea";
  const color =
    d.color ??
    (financiero ? "var(--c-ganancias)" : tarea ? "var(--c-yo)" : "var(--border)");

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: financiero ? 2 : 1.2,
          opacity: financiero ? 0.85 : tarea ? 0.55 : 0.35,
        }}
      />
      {/* Pulso viajando por la sinapsis cuando hay flujo (financiero / tarea) */}
      {(financiero || tarea) && (
        <circle r={financiero ? 3.5 : 2.5} fill={color}>
          <animateMotion
            dur={financiero ? "2.2s" : "3.2s"}
            repeatCount="indefinite"
            path={edgePath}
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="linear"
          />
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            dur={financiero ? "2.2s" : "3.2s"}
            repeatCount="indefinite"
          />
        </circle>
      )}
    </>
  );
}
