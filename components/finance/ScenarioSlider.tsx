"use client";
import { useState } from "react";
import { bolsilloDeEscenario } from "@/lib/engine";
import { formatCOP, formatCOPCompact } from "@/lib/format";
import type { EscenarioFacturacion } from "@/lib/types";

interface Props {
  escenarios: EscenarioFacturacion[];
  margen: number;
}

export function ScenarioSlider({ escenarios, margen }: Props) {
  const [idx, setIdx] = useState(1); // medio por defecto
  const esc = escenarios[idx] ?? escenarios[0];
  const bolsillo = bolsilloDeEscenario(esc.facturacion_mes, margen);
  const diario = esc.facturacion_mes / 30;

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase text-muted">Escenario</p>
          <p className="text-lg font-bold text-fg">{esc.nombre}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-muted">Bolsillo (15%)</p>
          <p className="text-2xl font-bold text-ganancias">{formatCOP(bolsillo)}</p>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={escenarios.length - 1}
        step={1}
        value={idx}
        onChange={(e) => setIdx(Number(e.target.value))}
        className="w-full accent-[var(--c-ganancias)]"
        aria-label="Escenario de facturación"
      />
      <div className="mt-1 flex justify-between text-[11px] text-muted">
        {escenarios.map((e, i) => (
          <button
            key={e.clave}
            onClick={() => setIdx(i)}
            className={i === idx ? "font-bold text-fg" : "hover:text-fg"}
          >
            {formatCOPCompact(e.facturacion_mes)}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
          <p className="text-xs text-muted">Facturación/mes</p>
          <p className="font-bold text-fg">{formatCOP(esc.facturacion_mes)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
          <p className="text-xs text-muted">Facturación/día</p>
          <p className="font-bold text-fg">{formatCOPCompact(diario)}</p>
        </div>
      </div>
    </div>
  );
}
