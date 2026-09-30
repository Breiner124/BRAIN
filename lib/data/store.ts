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
  Nota,
  Profile,
  Proyeccion,
  Reunion,
  Semana,
  Tarea,
  Testeo,
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
  semanas: Semana[];
  tareas: Tarea[];
  reuniones: Reunion[];
  testeos: Testeo[];
  notas: Nota[];
}

// ── Semana lunes–domingo que contiene a `ref` ──────────────────────
export function rangoSemana(ref: Date): { inicio: string; fin: string } {
  const d = new Date(ref);
  const dia = (d.getDay() + 6) % 7; // 0 = lunes
  const lunes = new Date(d);
  lunes.setDate(d.getDate() - dia);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return { inicio: lunes.toISOString().slice(0, 10), fin: domingo.toISOString().slice(0, 10) };
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
  const { inicio, fin } = rangoSemana(new Date());
  const semanaInicial: Semana = {
    id: "sem-inicial",
    fecha_inicio: inicio,
    fecha_fin: fin,
    activa: true,
    nota: "Semana inicial",
  };
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
    semanas: [semanaInicial],
    tareas: [],
    reuniones: [],
    testeos: [],
    notas: [],
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
