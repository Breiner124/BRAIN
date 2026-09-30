// ── Datos semilla (§10) — fuente de verdad del MODO DEMO ───────────
// Espejo de /db/seed.sql. En modo demo alimentan la app en memoria.

import type {
  Conexion,
  Deuda,
  Egreso,
  EscenarioFacturacion,
  Ingreso,
  Meta,
  Nodo,
  Profile,
  Proyeccion,
  UnidadNegocio,
} from "@/lib/types";

export const DEMO_USER_ID = "bran";

export const profileSeed: Profile = {
  id: DEMO_USER_ID,
  nombre: "Bran",
  moneda: "COP",
  tasa_cambio_usd: 4000,
  margen_neto_bolsillo: 0.15,
};

// ── Escenarios de facturación empresarial (§9) ─────────────────────
export const escenariosSeed: EscenarioFacturacion[] = [
  { clave: "conservador", nombre: "Conservador", facturacion_mes: 80_000_000 },
  { clave: "medio", nombre: "Medio", facturacion_mes: 115_000_000 },
  { clave: "optimista", nombre: "Optimista", facturacion_mes: 150_000_000 },
  { clave: "stretch", nombre: "Stretch (o más)", facturacion_mes: 200_000_000 },
];

// ── Unidades de negocio ────────────────────────────────────────────
export const unidadesSeed: UnidadNegocio[] = [
  { id: "u-consultoria", slug: "consultoria", nombre: "Consultoría", margen_neto: null },
  { id: "u-ecom", slug: "ecom", nombre: "Empresa E-com", margen_neto: 0.15 },
];

// ── Nodos del grafo (posiciones normalizadas 0..1, se escalan en UI) ─
export const nodosSeed: Nodo[] = [
  { id: "n-central", parent_id: null, tipo: "central", titulo: "El Cerebro", resumen: "Resumen de todo", posicion_x: 0.5, posicion_y: 0.5, color: "central", icono: "brain", orden: 0 },
  { id: "n-yo", parent_id: "n-central", tipo: "yo", titulo: "Yo", resumen: "Semana · Consultoría · E-com", posicion_x: 0.18, posicion_y: 0.22, color: "yo", icono: "user", orden: 1 },
  { id: "n-proyecciones", parent_id: "n-central", tipo: "proyecciones", titulo: "Proyecciones", resumen: "Personales + Empresarial", posicion_x: 0.5, posicion_y: 0.12, color: "proyecciones", icono: "trending-up", orden: 2 },
  { id: "n-metas", parent_id: "n-central", tipo: "metas", titulo: "Metas", resumen: "BMW · China · Navidad", posicion_x: 0.82, posicion_y: 0.22, color: "metas", icono: "target", orden: 3 },
  { id: "n-ganancias", parent_id: "n-central", tipo: "ganancias", titulo: "Ganancias", resumen: "Centro de gravedad", posicion_x: 0.8, posicion_y: 0.78, color: "ganancias", icono: "dollar", orden: 4 },
  { id: "n-deudas", parent_id: "n-central", tipo: "deudas", titulo: "Deudas", resumen: "Ordenadas por importancia", posicion_x: 0.2, posicion_y: 0.78, color: "deudas", icono: "credit-card", orden: 5 },
  { id: "n-testeos", parent_id: "n-central", tipo: "testeos", titulo: "Testeos", resumen: "Programación de testeos + notas", posicion_x: 0.5, posicion_y: 0.9, color: "testeos", icono: "flask", orden: 6 },
];

// ── Conexiones (sinapsis) — §1 ─────────────────────────────────────
export const conexionesSeed: Conexion[] = [
  { id: "c-1", origen_id: "n-ganancias", destino_id: "n-proyecciones", tipo_flujo: "financiero", activa: true },
  { id: "c-2", origen_id: "n-ganancias", destino_id: "n-metas", tipo_flujo: "financiero", activa: true },
  { id: "c-3", origen_id: "n-ganancias", destino_id: "n-deudas", tipo_flujo: "financiero", activa: true },
  { id: "c-4", origen_id: "n-proyecciones", destino_id: "n-ganancias", tipo_flujo: "financiero", activa: true },
  { id: "c-5", origen_id: "n-proyecciones", destino_id: "n-metas", tipo_flujo: "informativo", activa: true },
  { id: "c-6", origen_id: "n-yo", destino_id: "n-metas", tipo_flujo: "tarea", activa: true },
  { id: "c-7", origen_id: "n-yo", destino_id: "n-proyecciones", tipo_flujo: "tarea", activa: true },
  // enlaces del central para el layout radial
  { id: "c-8", origen_id: "n-central", destino_id: "n-yo", tipo_flujo: "informativo", activa: true },
  { id: "c-9", origen_id: "n-central", destino_id: "n-proyecciones", tipo_flujo: "informativo", activa: true },
  { id: "c-10", origen_id: "n-central", destino_id: "n-metas", tipo_flujo: "informativo", activa: true },
  { id: "c-11", origen_id: "n-central", destino_id: "n-ganancias", tipo_flujo: "informativo", activa: true },
  { id: "c-12", origen_id: "n-central", destino_id: "n-deudas", tipo_flujo: "informativo", activa: true },
  { id: "c-13", origen_id: "n-central", destino_id: "n-testeos", tipo_flujo: "informativo", activa: true },
  { id: "c-14", origen_id: "n-testeos", destino_id: "n-proyecciones", tipo_flujo: "tarea", activa: true },
];

// ── Deudas (§10) ───────────────────────────────────────────────────
export const deudasSeed: Deuda[] = [
  { id: "d-computador", nombre: "Computador a crédito", categoria: "credito_fijo", nivel_importancia: 3, monto_original: 150_000, saldo_actual: 150_000, tasa_interes: null, fecha_limite: null, estado: "activa" },
];

// ── Metas (§10, §8) ────────────────────────────────────────────────
export const metasSeed: Meta[] = [
  {
    id: "m-bmw",
    nombre: "BMW M340i",
    categoria: "vehiculo",
    costo_objetivo: 185_000_000,
    ahorrado: 0,
    fecha_objetivo: null,
    fecha_tipo: "variable",
    prioridad: 3,
    detalle: { nota: "Fecha variable — depende del flujo" },
  },
  {
    id: "m-china",
    nombre: "Viaje China (Feria de Cantón)",
    categoria: "viaje",
    costo_objetivo: 30_000_000,
    ahorrado: 0,
    fecha_objetivo: "2027-04-25",
    fecha_tipo: "fija",
    prioridad: 2,
    detalle: {
      base_sin_compras: 21_200_000,
      all_in: 33_200_000,
      rubros: {
        vuelos: 8_000_000, visa: 800_000, hotel: 6_600_000, comida: 3_120_000,
        transporte: 1_200_000, seguro: 480_000, sim_varios: 1_000_000, compras: 12_000_000,
      },
      estimado_editable: true,
    },
  },
  {
    id: "m-navidad",
    nombre: "Navidad 2026",
    categoria: "festividad",
    costo_objetivo: 6_000_000,
    ahorrado: 0,
    fecha_objetivo: "2026-12-24",
    fecha_tipo: "fija",
    prioridad: 1,
    detalle: {
      reparto: {
        Mamá: 600_000, Papá: 600_000, Abuela: 600_000, Hermano: 600_000,
        Padrastro: 600_000, Tía: 600_000, Abuelo: 600_000, Prima: 600_000,
        Tío: 600_000, Bran: 600_000,
      },
      editable: true,
    },
  },
];

// ── Proyecciones (§10) ─────────────────────────────────────────────
export const proyeccionesSeed: Proyeccion[] = [
  {
    id: "p-ecom-facturacion",
    ambito: "empresarial",
    unidad_id: "u-ecom",
    nombre: "Facturación esperada E-com",
    tipo: "ingreso_esperado",
    facturacion_esperada: 115_000_000,
    costo_estimado: null,
    costo_recurrente: null,
    fecha_objetivo: null,
    fecha_tipo: "variable",
    estado: "en_progreso",
    detalle: { escenarios: ["conservador", "medio", "optimista", "stretch"] },
  },
  {
    id: "p-logistica",
    ambito: "empresarial",
    unidad_id: "u-ecom",
    nombre: "Contratar persona de logística",
    tipo: "expansion",
    facturacion_esperada: null,
    costo_estimado: null,
    costo_recurrente: 2_000_000,
    fecha_objetivo: null, // hoy + 45 días (se calcula al sembrar en SQL)
    fecha_tipo: "variable",
    estado: "pendiente",
    detalle: { roi_umbral: 13_333_333, dias_objetivo: 45 },
  },
];

// ── Ingresos y egresos demo (arrancan vacíos; Bran registra) ───────
export const ingresosSeed: Ingreso[] = [];
export const egresosSeed: Egreso[] = [];
