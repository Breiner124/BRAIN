// ── Repositorio de dominio ─────────────────────────────────────────
// Única puerta de acceso a datos para las API routes. Hoy usa el store
// en memoria (demo). Cuando Supabase esté conectado, aquí se cambia la
// implementación sin tocar las rutas ni la UI.

import { db, uid, todayISO, escenarios, rangoSemana } from "@/lib/data/store";
import type {
  Deuda,
  DeudaMovimiento,
  Egreso,
  FuenteIngreso,
  Ingreso,
  Meta,
  OrigenRegistro,
  Proyeccion,
  Reunion,
  Semana,
  Tarea,
} from "@/lib/types";
import {
  correrMotor,
  facturacionDiariaPromedio,
  type EngineInput,
} from "@/lib/engine";

// ── Lectura de colecciones ─────────────────────────────────────────
export const getProfile = () => db().profile;
export const getNodos = () => db().nodos;
export const getConexiones = () => db().conexiones;
export const getUnidades = () => db().unidades;
export const getEscenarios = () => escenarios();
export const getIngresos = () => db().ingresos;
export const getEgresos = () => db().egresos;
export const getDeudas = () => db().deudas;
export const getMetas = () => db().metas;
export const getProyecciones = () => db().proyecciones;
export const getSemanas = () => db().semanas;
export const getSemanaActiva = () => db().semanas.find((s) => s.activa);
export const getTareas = (semana_id?: string) =>
  semana_id ? db().tareas.filter((t) => t.semana_id === semana_id) : db().tareas;
export const getReuniones = () => db().reuniones;
export const getDeudaMovimientos = (deuda_id?: string) =>
  deuda_id
    ? db().deuda_movimientos.filter((m) => m.deuda_id === deuda_id)
    : db().deuda_movimientos;

// ── Ingresos (con ruteo bidireccional §11) ─────────────────────────
export interface NuevoIngreso {
  unidad_id?: string | null;
  fuente: FuenteIngreso;
  descripcion: string;
  monto: number;
  es_facturacion?: boolean;
  fecha?: string;
  recurrente?: boolean;
  origen_registro?: OrigenRegistro;
  proyeccion_id?: string | null;
}

export function crearIngreso(data: NuevoIngreso): Ingreso {
  const ingreso: Ingreso = {
    id: uid("ing"),
    unidad_id: data.unidad_id ?? null,
    fuente: data.fuente,
    descripcion: data.descripcion,
    monto: data.monto,
    es_facturacion: data.es_facturacion ?? false,
    fecha: data.fecha ?? todayISO(),
    recurrente: data.recurrente ?? false,
    origen_registro: data.origen_registro ?? "ganancias",
    proyeccion_id: data.proyeccion_id ?? null,
  };
  db().ingresos.unshift(ingreso);
  return ingreso;
}

// ── Egresos ────────────────────────────────────────────────────────
export interface NuevoEgreso {
  unidad_id?: string | null;
  categoria: Egreso["categoria"];
  descripcion: string;
  monto: number;
  fecha?: string;
  fijo?: boolean;
}

export function crearEgreso(data: NuevoEgreso): Egreso {
  const egreso: Egreso = {
    id: uid("egr"),
    unidad_id: data.unidad_id ?? null,
    categoria: data.categoria,
    descripcion: data.descripcion,
    monto: data.monto,
    fecha: data.fecha ?? todayISO(),
    fijo: data.fijo ?? false,
  };
  db().egresos.unshift(egreso);
  return egreso;
}

// ── Deudas: abonar / pagar total (§5.6) ────────────────────────────
export function abonarDeuda(deuda_id: string, monto: number): {
  deuda: Deuda;
  movimiento: DeudaMovimiento;
} {
  const deuda = db().deudas.find((d) => d.id === deuda_id);
  if (!deuda) throw new Error("Deuda no encontrada");
  if (monto <= 0) throw new Error("El abono debe ser mayor que 0");
  deuda.saldo_actual = Math.max(0, deuda.saldo_actual - monto);
  if (deuda.saldo_actual === 0) deuda.estado = "pagada";

  const movimiento: DeudaMovimiento = {
    id: uid("mov"),
    deuda_id,
    tipo: "abono",
    monto,
    fecha: todayISO(),
  };
  db().deuda_movimientos.unshift(movimiento);
  crearEgreso({
    categoria: "deuda",
    descripcion: `Abono a ${deuda.nombre}`,
    monto,
  });
  return { deuda, movimiento };
}

export function pagarDeudaTotal(deuda_id: string): {
  deuda: Deuda;
  movimiento: DeudaMovimiento;
} {
  const deuda = db().deudas.find((d) => d.id === deuda_id);
  if (!deuda) throw new Error("Deuda no encontrada");
  const monto = deuda.saldo_actual;
  deuda.saldo_actual = 0;
  deuda.estado = "pagada";

  const movimiento: DeudaMovimiento = {
    id: uid("mov"),
    deuda_id,
    tipo: "pago_total",
    monto,
    fecha: todayISO(),
  };
  db().deuda_movimientos.unshift(movimiento);
  if (monto > 0) {
    crearEgreso({
      categoria: "deuda",
      descripcion: `Pago total de ${deuda.nombre}`,
      monto,
    });
  }
  return { deuda, movimiento };
}

// ── Metas: aportar (§11) ───────────────────────────────────────────
export function aportarMeta(meta_id: string, monto: number): Meta {
  const meta = db().metas.find((m) => m.id === meta_id);
  if (!meta) throw new Error("Meta no encontrada");
  if (monto <= 0) throw new Error("El aporte debe ser mayor que 0");
  meta.ahorrado = Math.min(meta.costo_objetivo, meta.ahorrado + monto);
  return meta;
}

// ── Proyecciones: crear (personal o empresarial) + flujo bidireccional
export interface NuevaProyeccion {
  ambito: Proyeccion["ambito"];
  unidad_id?: string | null;
  nombre: string;
  tipo: Proyeccion["tipo"];
  facturacion_esperada?: number | null;
  costo_estimado?: number | null;
  costo_recurrente?: number | null;
  fecha_objetivo?: string | null;
  fecha_tipo?: "fija" | "variable";
  estado?: Proyeccion["estado"];
  objetivo?: number | null; // para proyecciones personales (barra de avance)
  avance?: number;
  // Si se anexa una ganancia desde la proyección (§5.3, §11):
  ganancia?: { monto: number; fuente: FuenteIngreso; es_facturacion?: boolean };
}

export function crearProyeccion(data: NuevaProyeccion): {
  proyeccion: Proyeccion;
  ingreso?: Ingreso;
} {
  const proyeccion: Proyeccion = {
    id: uid("proy"),
    ambito: data.ambito,
    unidad_id: data.unidad_id ?? null,
    nombre: data.nombre,
    tipo: data.tipo,
    facturacion_esperada: data.facturacion_esperada ?? null,
    costo_estimado: data.costo_estimado ?? null,
    costo_recurrente: data.costo_recurrente ?? null,
    fecha_objetivo: data.fecha_objetivo ?? null,
    fecha_tipo: data.fecha_tipo ?? "variable",
    estado: data.estado ?? "pendiente",
    objetivo: data.objetivo ?? null,
    avance: data.avance ?? 0,
  };
  db().proyecciones.unshift(proyeccion);

  // Flujo bidireccional: si trae ganancia, cae en `ingresos` y aparece en Ganancias.
  let ingreso: Ingreso | undefined;
  if (data.ganancia && data.ganancia.monto > 0) {
    const origen: OrigenRegistro =
      data.ganancia.fuente === "consultoria" ? "proy_consultoria" : "proy_ecom";
    ingreso = crearIngreso({
      unidad_id: data.unidad_id ?? null,
      fuente: data.ganancia.fuente,
      descripcion: `Ganancia anexada desde proyección: ${data.nombre}`,
      monto: data.ganancia.monto,
      es_facturacion: data.ganancia.es_facturacion ?? false,
      origen_registro: origen,
      proyeccion_id: proyeccion.id,
    });
  }
  return { proyeccion, ingreso };
}

/** Aporta avance a una proyección personal (barra §5.3A). */
export function aportarProyeccion(proyeccion_id: string, monto: number): Proyeccion {
  const p = db().proyecciones.find((x) => x.id === proyeccion_id);
  if (!p) throw new Error("Proyección no encontrada");
  if (monto <= 0) throw new Error("El aporte debe ser mayor que 0");
  const objetivo = p.objetivo ?? p.costo_estimado ?? 0;
  p.avance = objetivo > 0 ? Math.min(objetivo, (p.avance ?? 0) + monto) : (p.avance ?? 0) + monto;
  if (objetivo > 0 && (p.avance ?? 0) >= objetivo) p.estado = "lograda";
  else if ((p.avance ?? 0) > 0) p.estado = "en_progreso";
  return p;
}

// ── Nodo Yo: tareas, semanas, reuniones (§7) ───────────────────────
export interface NuevaTarea {
  ambito: Tarea["ambito"];
  titulo: string;
  descripcion?: string;
  prioridad?: number;
  vinculo_meta_id?: string | null;
  vinculo_proyeccion_id?: string | null;
}

export function crearTarea(data: NuevaTarea): Tarea {
  const activa = getSemanaActiva();
  if (!activa) throw new Error("No hay semana activa");
  const tarea: Tarea = {
    id: uid("tar"),
    semana_id: activa.id,
    ambito: data.ambito,
    titulo: data.titulo,
    descripcion: data.descripcion,
    estado: "pendiente",
    heredada: false,
    prioridad: data.prioridad ?? 3,
    vinculo_meta_id: data.vinculo_meta_id ?? null,
    vinculo_proyeccion_id: data.vinculo_proyeccion_id ?? null,
  };
  db().tareas.push(tarea);
  return tarea;
}

export function cambiarEstadoTarea(
  tarea_id: string,
  estado: Tarea["estado"]
): Tarea {
  const t = db().tareas.find((x) => x.id === tarea_id);
  if (!t) throw new Error("Tarea no encontrada");
  t.estado = estado;
  return t;
}

/**
 * §7 — Cierra la semana activa, crea la siguiente (lunes–domingo) y arrastra
 * las tareas pendientes/aplazadas marcándolas heredada=true.
 */
export function iniciarNuevaSemana(): { semana: Semana; arrastradas: number } {
  const actual = getSemanaActiva();
  if (actual) actual.activa = false;

  const base = actual ? new Date(actual.fecha_fin) : new Date();
  base.setDate(base.getDate() + 1); // día siguiente al fin de la anterior
  const { inicio, fin } = rangoSemana(base);

  const nueva: Semana = {
    id: uid("sem"),
    fecha_inicio: inicio,
    fecha_fin: fin,
    activa: true,
  };
  db().semanas.push(nueva);

  let arrastradas = 0;
  if (actual) {
    const pendientes = db().tareas.filter(
      (t) => t.semana_id === actual.id && t.estado !== "hecha"
    );
    for (const t of pendientes) {
      db().tareas.push({
        ...t,
        id: uid("tar"),
        semana_id: nueva.id,
        estado: "pendiente",
        heredada: true,
      });
      arrastradas++;
    }
  }
  return { semana: nueva, arrastradas };
}

export interface NuevaReunion {
  ambito: Reunion["ambito"];
  titulo: string;
  con_quien?: string;
  inicio: string;
  fin?: string | null;
  notas?: string;
}

export function crearReunion(data: NuevaReunion): Reunion {
  const reunion: Reunion = {
    id: uid("reu"),
    ambito: data.ambito,
    titulo: data.titulo,
    con_quien: data.con_quien,
    inicio: data.inicio,
    fin: data.fin ?? null,
    fuente: "manual",
    calendly_event_id: null,
    notas: data.notas,
  };
  db().reuniones.push(reunion);
  return reunion;
}

// ── Ensamble de entrada del motor + corrida ────────────────────────
export function engineInput(hoy = new Date()): EngineInput {
  const profile = getProfile();
  const escenarioMedio = getEscenarios().find((e) => e.clave === "medio");
  return {
    ingresos: getIngresos(),
    egresos: getEgresos(),
    deudas: getDeudas(),
    proyecciones: getProyecciones(),
    metas: getMetas(),
    unidades: getUnidades(),
    hoy,
    config: { margen_neto_bolsillo: profile.margen_neto_bolsillo },
    escenarioElegido: escenarioMedio,
  };
}

/** Facturación diaria real promedio del mes en curso (base de cálculos). */
export function facturacionRealDiaria(hoy = new Date()): number {
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const diasTranscurridos = Math.max(1, hoy.getDate());
  const delMes = getIngresos().filter((i) => new Date(i.fecha) >= inicioMes);
  void inicioMes;
  return facturacionDiariaPromedio(delMes, diasTranscurridos);
}

export function motor(hoy = new Date()) {
  return correrMotor(engineInput(hoy), facturacionRealDiaria(hoy));
}
