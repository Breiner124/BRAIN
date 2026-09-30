"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, X, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/finance/ProgressBar";
import { formatCOP, formatCOPCompact, formatPct } from "@/lib/format";
import { NODE_COLORS } from "@/lib/utils";
import type { ResumenNodo } from "@/lib/summary";

const SEMAFORO_EMOJI = { verde: "🟢", amarillo: "🟡", rojo: "🔴" } as const;

const TABLEROS: Record<string, string> = {
  central: "/",
  yo: "/nodo/yo",
  proyecciones: "/nodo/proyecciones",
  metas: "/nodo/metas",
  ganancias: "/nodo/ganancias",
  deudas: "/nodo/deudas",
};

interface Props {
  nodo: { tipo: string; titulo: string } | null;
  resumen: ResumenNodo;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-fg">{value}</span>
    </div>
  );
}

export function PeekPanel({ nodo, resumen, onClose }: Props) {
  const tipo = nodo?.tipo ?? "";
  const color = NODE_COLORS[tipo] ?? "var(--c-central)";

  return (
    <AnimatePresence>
      {nodo && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="scroll-thin fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-border bg-surface p-6"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: color, boxShadow: `0 0 10px ${color}` }}
                />
                <h2 className="text-xl font-bold text-fg">{nodo.titulo}</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-fg"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-1">
              {tipo === "central" && <CentralPeek r={resumen} />}
              {tipo === "ganancias" && <GananciasPeek r={resumen} />}
              {tipo === "proyecciones" && <ProyeccionesPeek r={resumen} />}
              {tipo === "metas" && <MetasPeek r={resumen} />}
              {tipo === "deudas" && <DeudasPeek r={resumen} />}
              {tipo === "yo" && (
                <p className="text-sm text-muted">
                  Tu semana, tareas y reuniones. El tablero completo llega con más
                  detalle en la Fase 2.
                </p>
              )}
            </div>

            {TABLEROS[tipo] && tipo !== "central" && (
              <Link href={TABLEROS[tipo]} className="mt-6 block">
                <Button className="w-full" style={{ background: color }}>
                  Abrir tablero <ArrowUpRight size={16} />
                </Button>
              </Link>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function CentralPeek({ r }: { r: ResumenNodo }) {
  const flecha =
    r.ganancias.variacion >= 0 ? (
      <TrendingUp size={14} className="text-ganancias" />
    ) : (
      <TrendingDown size={14} className="text-deudas" />
    );
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface-2 p-4 text-center">
        <p className="text-xs uppercase tracking-wide text-muted">
          Indicador maestro — facturación
        </p>
        <p className="mt-1 text-3xl font-bold">
          {SEMAFORO_EMOJI[r.maestro.semaforo]}
        </p>
        <p className="text-xs text-muted">
          Real {formatCOPCompact(r.maestro.facturacion_real_diaria)}/día · Ideal{" "}
          {formatCOPCompact(r.maestro.facturacion_diaria_ideal)}/día
        </p>
      </div>
      <Row
        label="Ganancias del mes"
        value={
          <span className="flex items-center gap-1">
            {formatCOP(r.ganancias.total_mes)} {flecha}
          </span>
        }
      />
      <Row
        label="Bolsillo estimado (empresa)"
        value={formatCOP(r.proyecciones.bolsillo_estimado)}
      />
      <Row label="Metas activas" value={r.metas.total} />
      <Row label="Deudas activas" value={r.deudas.activas} />
      <Row label="Saldo de deudas" value={formatCOP(r.deudas.saldo_total)} />
    </div>
  );
}

function GananciasPeek({ r }: { r: ResumenNodo }) {
  return (
    <div className="space-y-2">
      <Row label="Total del mes" value={formatCOP(r.ganancias.total_mes)} />
      <Row
        label="vs mes anterior"
        value={formatPct(r.ganancias.variacion, 0)}
      />
      <div className="pt-2">
        <p className="mb-1 text-xs uppercase text-muted">Por fuente</p>
        <Row label="Consultoría" value={formatCOP(r.ganancias.por_fuente.consultoria ?? 0)} />
        <Row label="E-com (bolsillo)" value={formatCOP(r.ganancias.por_fuente.ecom ?? 0)} />
        <Row label="Otros" value={formatCOP(r.ganancias.por_fuente.otros ?? 0)} />
      </div>
    </div>
  );
}

function ProyeccionesPeek({ r }: { r: ResumenNodo }) {
  return (
    <div className="space-y-2">
      <Row label="Pendientes" value={r.proyecciones.pendientes} />
      <Row label="En progreso" value={r.proyecciones.en_progreso} />
      <Row label="Logradas" value={r.proyecciones.logradas} />
      <Row
        label="Facturación esperada"
        value={formatCOP(r.proyecciones.facturacion_esperada)}
      />
      <Row
        label="Bolsillo estimado (15%)"
        value={formatCOP(r.proyecciones.bolsillo_estimado)}
      />
    </div>
  );
}

function MetasPeek({ r }: { r: ResumenNodo }) {
  return (
    <div className="space-y-3">
      <ProgressBar
        label="Progreso global"
        logrado={r.metas.logrado_global}
        objetivo={r.metas.objetivo_global}
        color="var(--c-metas)"
      />
      {r.metas.mas_cercana && (
        <div className="rounded-xl border border-border bg-surface-2 p-3">
          <p className="text-xs uppercase text-muted">Meta más cercana</p>
          <p className="font-semibold text-fg">{r.metas.mas_cercana.nombre}</p>
          <p className="text-xs text-muted">
            {r.metas.mas_cercana.fecha ?? "sin fecha"} ·{" "}
            {formatPct(r.metas.mas_cercana.pct, 0)}
          </p>
        </div>
      )}
    </div>
  );
}

function DeudasPeek({ r }: { r: ResumenNodo }) {
  return (
    <div className="space-y-2">
      <Row label="Saldo total" value={formatCOP(r.deudas.saldo_total)} />
      <Row label="Deudas activas" value={r.deudas.activas} />
      {r.deudas.principal && (
        <div className="rounded-xl border border-border bg-surface-2 p-3">
          <p className="text-xs uppercase text-muted">Deuda #1</p>
          <p className="font-semibold text-fg">{r.deudas.principal.nombre}</p>
          <p className="text-xs text-muted">{formatCOP(r.deudas.principal.saldo)}</p>
        </div>
      )}
    </div>
  );
}
