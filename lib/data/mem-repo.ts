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
  Nota,
  OrigenRegistro,
  Proyeccion,
  Reunion,
  Semana,
  Tarea,
  Testeo,
} from "@/lib/types";
import type {
  NotaPatch,
  NuevaDeuda,
  NuevaNota,
  NuevaProyeccion,
  NuevaReunion,
  NuevaTarea,
  NuevoEgreso,
  NuevoIngreso,
  NuevoTesteo,
  ProyeccionPatch,
  ReunionCalendly,
  TesteoPatch,
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

export function eliminarIngreso(ingreso_id: string): { id: string } {
  const idx = db().ingresos.findIndex((i) => i.id === ingreso_id);
  if (idx === -1) throw new Error("Ingreso no encontrado");
  db().ingresos.splice(idx, 1);
  return { id: ingreso_id };
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

export function crearDeuda(data: NuevaDeuda): Deuda {
  const deuda: Deuda = {
    id: uid("deu"),
    nombre: data.nombre,
    categoria: data.categoria,
    nivel_importancia: data.nivel_importancia,
    monto_original: data.monto_original,
    saldo_actual: data.saldo_actual ?? data.monto_original,
    tasa_interes: data.tasa_interes ?? null,
    fecha_limite: data.fecha_limite ?? null,
    estado: "activa",
  };
  db().deudas.push(deuda);
  return deuda;
}

export function eliminarDeuda(deuda_id: string): { id: string } {
  const idx = db().deudas.findIndex((d) => d.id === deuda_id);
  if (idx === -1) throw new Error("Deuda no encontrada");
  db().deudas.splice(idx, 1);
  return { id: deuda_id };
}

export function aportarMeta(meta_id: string, monto: number): Meta {
  const meta = db().metas.find((m) => m.id === meta_id);
  if (!meta) throw new Error("Meta no encontrada");
  if (monto <= 0) throw new Error("El aporte debe ser mayor que 0");
  meta.ahorrado = Math.min(meta.costo_objetivo, meta.ahorrado + monto);
  return meta;
}

export function actualizarMeta(
  meta_id: string,
  patch: { ahorrado?: number; costo_objetivo?: number }
): Meta {
  const meta = db().metas.find((m) => m.id === meta_id);
  if (!meta) throw new Error("Meta no encontrada");
  if (patch.costo_objetivo != null) meta.costo_objetivo = patch.costo_objetivo;
  if (patch.ahorrado != null) meta.ahorrado = Math.max(0, patch.ahorrado);
  return meta;
}

export function eliminarMeta(meta_id: string): { id: string } {
  const idx = db().metas.findIndex((m) => m.id === meta_id);
  if (idx === -1) throw new Error("Meta no encontrada");
  db().metas.splice(idx, 1);
  return { id: meta_id };
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

export function actualizarProyeccion(
  proyeccion_id: string,
  patch: ProyeccionPatch
): Proyeccion {
  const p = db().proyecciones.find((x) => x.id === proyeccion_id);
  if (!p) throw new Error("Proyección no encontrada");
  if (patch.estado) p.estado = patch.estado;
  if (patch.fecha_objetivo !== undefined) p.fecha_objetivo = patch.fecha_objetivo || null;
  if (patch.fecha_tipo) p.fecha_tipo = patch.fecha_tipo;
  if (patch.notas !== undefined) p.detalle = { ...(p.detalle ?? {}), notas: patch.notas };
  return p;
}

export function eliminarProyeccion(proyeccion_id: string): { id: string } {
  const idx = db().proyecciones.findIndex((p) => p.id === proyeccion_id);
  if (idx === -1) throw new Error("Proyección no encontrada");
  db().proyecciones.splice(idx, 1);
  return { id: proyeccion_id };
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

export function eliminarReunion(reunion_id: string): { id: string } {
  const idx = db().reuniones.findIndex((r) => r.id === reunion_id);
  if (idx === -1) throw new Error("Reunión no encontrada");
  db().reuniones.splice(idx, 1);
  return { id: reunion_id };
}

// ── Testeos ────────────────────────────────────────────────────────
export const getTesteos = () => db().testeos;

export function crearTesteo(data: NuevoTesteo): Testeo {
  const testeo: Testeo = {
    id: uid("test"),
    producto: data.producto,
    hipotesis: data.hipotesis ?? null,
    fecha_testeo: data.fecha_testeo ?? null,
    estado: "planificado",
    prioridad: data.prioridad ?? 3,
    presupuesto: data.presupuesto ?? null,
    notas: data.notas ?? null,
    resultado: null,
    created_at: new Date().toISOString(),
  };
  db().testeos.unshift(testeo);
  return testeo;
}

export function actualizarTesteo(id: string, patch: TesteoPatch): Testeo {
  const t = db().testeos.find((x) => x.id === id);
  if (!t) throw new Error("Testeo no encontrado");
  Object.assign(t, patch);
  return t;
}

export function eliminarTesteo(id: string): { id: string } {
  const idx = db().testeos.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error("Testeo no encontrado");
  db().testeos.splice(idx, 1);
  return { id };
}

// ── Notas (bloc de notas con fechas) ───────────────────────────────
export const getNotas = () => db().notas;

export function crearNota(data: NuevaNota): Nota {
  const nota: Nota = {
    id: uid("nota"),
    fecha: data.fecha ?? todayISO(),
    categoria: data.categoria ?? "general",
    contenido: data.contenido,
    fuente: data.fuente ?? null,
    hecha: false,
    created_at: new Date().toISOString(),
  };
  db().notas.unshift(nota);
  return nota;
}

export function actualizarNota(id: string, patch: NotaPatch): Nota {
  const n = db().notas.find((x) => x.id === id);
  if (!n) throw new Error("Nota no encontrada");
  Object.assign(n, patch);
  return n;
}

export function eliminarNota(id: string): { id: string } {
  const idx = db().notas.findIndex((n) => n.id === id);
  if (idx === -1) throw new Error("Nota no encontrada");
  db().notas.splice(idx, 1);
  return { id };
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
