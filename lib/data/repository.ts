// ── Repositorio de dominio ─────────────────────────────────────────
// Única puerta de acceso a datos para las API routes. Hoy usa el store
// en memoria (demo). Cuando Supabase esté conectado, aquí se cambia la
// implementación sin tocar las rutas ni la UI.

import { db, uid, todayISO, escenarios } from "@/lib/data/store";
import type {
  Deuda,
  DeudaMovimiento,
  Egreso,
  FuenteIngreso,
  Ingreso,
  Meta,
  OrigenRegistro,
  Proyeccion,
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
