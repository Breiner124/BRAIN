// ── Backend en memoria (MODO DEMO) ─────────────────────────────────
// Lógica síncrona sobre el store en memoria. El router (repository.ts) la
// envuelve en promesas para exponer la misma API async que Supabase.

import { db, uid, todayISO, rangoSemana } from "@/lib/data/store";
import type {
  Deuda,
  DeudaMovimiento,
  Egreso,
  Ingreso,
  Meta,
  OrigenRegistro,
  Proyeccion,
  Reunion,
  Semana,
  Tarea,
} from "@/lib/types";
import type {
  NuevaProyeccion,
  NuevaReunion,
  NuevaTarea,
  NuevoEgreso,
  NuevoIngreso,
  ReunionCalendly,
} from "@/lib/data/contracts";

export const getProfile = () => db().profile;
export const getNodos = () => db().nodos;
export const getConexiones = () => db().conexiones;
export const getUnidades = () => db().unidades;
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

export function abonarDeuda(
  deuda_id: string,
  monto: number
): { deuda: Deuda; movimiento: DeudaMovimiento } {
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
  crearEgreso({ categoria: "deuda", descripcion: `Abono a ${deuda.nombre}`, monto });
  return { deuda, movimiento };
}

export function pagarDeudaTotal(
  deuda_id: string
): { deuda: Deuda; movimiento: DeudaMovimiento } {
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
  if (monto > 0)
    crearEgreso({ categoria: "deuda", descripcion: `Pago total de ${deuda.nombre}`, monto });
  return { deuda, movimiento };
}

export function aportarMeta(meta_id: string, monto: number): Meta {
  const meta = db().metas.find((m) => m.id === meta_id);
  if (!meta) throw new Error("Meta no encontrada");
  if (monto <= 0) throw new Error("El aporte debe ser mayor que 0");
  meta.ahorrado = Math.min(meta.costo_objetivo, meta.ahorrado + monto);
  return meta;
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

export function aportarProyeccion(proyeccion_id: string, monto: number): Proyeccion {
  const p = db().proyecciones.find((x) => x.id === proyeccion_id);
  if (!p) throw new Error("Proyección no encontrada");
  if (monto <= 0) throw new Error("El aporte debe ser mayor que 0");
  const objetivo = p.objetivo ?? p.costo_estimado ?? 0;
  p.avance =
    objetivo > 0 ? Math.min(objetivo, (p.avance ?? 0) + monto) : (p.avance ?? 0) + monto;
  if (objetivo > 0 && (p.avance ?? 0) >= objetivo) p.estado = "lograda";
  else if ((p.avance ?? 0) > 0) p.estado = "en_progreso";
  return p;
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

export function cambiarEstadoTarea(tarea_id: string, estado: Tarea["estado"]): Tarea {
  const t = db().tareas.find((x) => x.id === tarea_id);
  if (!t) throw new Error("Tarea no encontrada");
  t.estado = estado;
  return t;
}

export function iniciarNuevaSemana(): { semana: Semana; arrastradas: number } {
  const actual = getSemanaActiva();
  if (actual) actual.activa = false;
  const base = actual ? new Date(actual.fecha_fin) : new Date();
  base.setDate(base.getDate() + 1);
  const { inicio, fin } = rangoSemana(base);
  const nueva: Semana = { id: uid("sem"), fecha_inicio: inicio, fecha_fin: fin, activa: true };
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

export function upsertReunionCalendly(data: ReunionCalendly): Reunion {
  const existente = data.calendly_event_id
    ? db().reuniones.find((r) => r.calendly_event_id === data.calendly_event_id)
    : undefined;
  if (existente) {
    existente.titulo = data.titulo;
    existente.con_quien = data.con_quien;
    existente.inicio = data.inicio;
    existente.fin = data.fin ?? null;
    return existente;
  }
  const reunion: Reunion = {
    id: uid("reu"),
    ambito: data.ambito,
    titulo: data.titulo,
    con_quien: data.con_quien,
    inicio: data.inicio,
    fin: data.fin ?? null,
    fuente: "calendly",
    calendly_event_id: data.calendly_event_id,
  };
  db().reuniones.push(reunion);
  return reunion;
}
