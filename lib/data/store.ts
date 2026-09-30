// ── Store en memoria (MODO DEMO — Fase 1) ──────────────────────────
// Fuente de verdad de la app mientras Supabase no esté conectado.
// Persiste durante la vida del proceso Node (dev). En Vercel serverless
// se reinicia por cold start → ver README para migrar a Supabase.

import {
  conexionesSeed,
  deudasSeed,
  egresosSeed,
  escenariosSeed,
  ingresosSeed,
  metasSeed,
  nodosSeed,
  profileSeed,
  proyeccionesSeed,
  unidadesSeed,
} from "@/lib/demo/seed-data";
import type {
  Conexion,
  Deuda,
  DeudaMovimiento,
  Egreso,
  Ingreso,
  Meta,
  Nodo,
  Profile,
  Proyeccion,
  UnidadNegocio,
} from "@/lib/types";

interface DBShape {
  profile: Profile;
  nodos: Nodo[];
  conexiones: Conexion[];
  unidades: UnidadNegocio[];
  ingresos: Ingreso[];
  egresos: Egreso[];
  deudas: Deuda[];
  deuda_movimientos: DeudaMovimiento[];
  metas: Meta[];
  proyecciones: Proyeccion[];
}

// Singleton resistente a hot-reload de Next.
const globalForStore = globalThis as unknown as { __cerebroDB?: DBShape };

function seed(): DBShape {
  // fecha objetivo de logística = hoy + 45 días
  const logistica = proyeccionesSeed.find((p) => p.id === "p-logistica");
  const proyecciones = proyeccionesSeed.map((p) =>
    p.id === "p-logistica"
      ? { ...p, fecha_objetivo: addDaysISO(new Date(), 45) }
      : { ...p }
  );
  void logistica;
  return {
    profile: { ...profileSeed },
    nodos: nodosSeed.map((n) => ({ ...n })),
    conexiones: conexionesSeed.map((c) => ({ ...c })),
    unidades: unidadesSeed.map((u) => ({ ...u })),
    ingresos: ingresosSeed.map((i) => ({ ...i })),
    egresos: egresosSeed.map((e) => ({ ...e })),
    deudas: deudasSeed.map((d) => ({ ...d })),
    deuda_movimientos: [],
    metas: metasSeed.map((m) => ({ ...m })),
    proyecciones,
  };
}

export function db(): DBShape {
  if (!globalForStore.__cerebroDB) {
    globalForStore.__cerebroDB = seed();
  }
  return globalForStore.__cerebroDB;
}

/** Solo para tests / reset manual. */
export function resetDB(): void {
  globalForStore.__cerebroDB = seed();
}

export function escenarios() {
  return escenariosSeed;
}

// ── Helpers ────────────────────────────────────────────────────────
export function uid(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function addDaysISO(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
