// ── Backend Supabase (async) ───────────────────────────────────────
// Misma API que mem-repo, pero contra Postgres. Opera como el usuario
// único (CEREBRO_USER_ID) usando el cliente service-role del servidor.

import { admin, cerebroUserId } from "@/lib/supabase/admin";
import {
  PASOS_TESTEO_DEFECTO,
  type Conexion,
  type Deuda,
  type DeudaMovimiento,
  type Egreso,
  type Ingreso,
  type Meta,
  type Nodo,
  type Nota,
  type Profile,
  type Proyeccion,
  type Reunion,
  type Semana,
  type Tarea,
  type Testeo,
  type UnidadNegocio,
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

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function ok<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return res.data as T;
}

// ── Lecturas ───────────────────────────────────────────────────────
export async function getProfile(): Promise<Profile> {
  const uid = cerebroUserId();
  const res = await admin().from("profile").select("*").eq("id", uid).single();
  return ok(res) as Profile;
}

async function lista<T>(tabla: string, orderCol?: string, asc = true): Promise<T[]> {
  const uid = cerebroUserId();
  let q = admin().from(tabla).select("*").eq("user_id", uid);
  if (orderCol) q = q.order(orderCol, { ascending: asc });
  const res = await q;
  return (ok(res) as T[]) ?? [];
}

export const getNodos = () => lista<Nodo>("nodos", "orden");
export const getConexiones = () => lista<Conexion>("conexiones");
export const getUnidades = () => lista<UnidadNegocio>("unidades_negocio");
export const getIngresos = () => lista<Ingreso>("ingresos", "fecha", false);
export const getEgresos = () => lista<Egreso>("egresos", "fecha", false);
export const getDeudas = () => lista<Deuda>("deudas", "nivel_importancia");
export const getMetas = () => lista<Meta>("metas", "prioridad");
export const getProyecciones = () => lista<Proyeccion>("proyecciones", "created_at", false);
export const getSemanas = () => lista<Semana>("semanas", "fecha_inicio", false);
export const getReuniones = () => lista<Reunion>("reuniones", "inicio");
export const getTesteos = () => lista<Testeo>("testeos", "prioridad");
export const getNotas = () => lista<Nota>("notas", "fecha", false);

export async function getSemanaActiva(): Promise<Semana | undefined> {
  const uid = cerebroUserId();
  const res = await admin()
    .from("semanas")
    .select("*")
    .eq("user_id", uid)
    .eq("activa", true)
    .order("fecha_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (ok(res) as Semana | null) ?? undefined;
}

export async function getTareas(semana_id?: string): Promise<Tarea[]> {
  const uid = cerebroUserId();
  let q = admin().from("tareas").select("*").eq("user_id", uid);
  if (semana_id) q = q.eq("semana_id", semana_id);
  const res = await q.order("created_at", { ascending: true });
  return (ok(res) as Tarea[]) ?? [];
}

export async function getDeudaMovimientos(deuda_id?: string): Promise<DeudaMovimiento[]> {
  let q = admin().from("deuda_movimientos").select("*");
  if (deuda_id) q = q.eq("deuda_id", deuda_id);
  const res = await q;
  return (ok(res) as DeudaMovimiento[]) ?? [];
}

// ── Mutaciones ─────────────────────────────────────────────────────
export async function crearIngreso(data: NuevoIngreso): Promise<Ingreso> {
  const uid = cerebroUserId();
  const row = {
    user_id: uid,
    unidad_id: data.unidad_id ?? null,
    fuente: data.fuente,
    descripcion: data.descripcion,
    monto: data.monto,
    es_facturacion: data.es_facturacion ?? false,
    fecha: data.fecha ?? hoyISO(),
    recurrente: data.recurrente ?? false,
    origen_registro: data.origen_registro ?? "ganancias",
    proyeccion_id: data.proyeccion_id ?? null,
  };
  const res = await admin().from("ingresos").insert(row).select("*").single();
  return ok(res) as Ingreso;
}

export async function eliminarIngreso(ingreso_id: string): Promise<{ id: string }> {
  const uid = cerebroUserId();
  const res = await admin()
    .from("ingresos")
    .delete()
    .eq("user_id", uid)
    .eq("id", ingreso_id);
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return { id: ingreso_id };
}

export async function crearEgreso(data: NuevoEgreso): Promise<Egreso> {
  const uid = cerebroUserId();
  const row = {
    user_id: uid,
    unidad_id: data.unidad_id ?? null,
    categoria: data.categoria,
    descripcion: data.descripcion,
    monto: data.monto,
    fecha: data.fecha ?? hoyISO(),
    fijo: data.fijo ?? false,
  };
  const res = await admin().from("egresos").insert(row).select("*").single();
  return ok(res) as Egreso;
}

async function fetchDeuda(deuda_id: string): Promise<Deuda> {
  const uid = cerebroUserId();
  const res = await admin()
    .from("deudas")
    .select("*")
    .eq("user_id", uid)
    .eq("id", deuda_id)
    .single();
  const d = ok(res) as Deuda | null;
  if (!d) throw new Error("Deuda no encontrada");
  return d;
}

export async function abonarDeuda(
  deuda_id: string,
  monto: number
): Promise<{ deuda: Deuda; movimiento: DeudaMovimiento }> {
  if (monto <= 0) throw new Error("El abono debe ser mayor que 0");
  const deuda = await fetchDeuda(deuda_id);
  const saldo = Math.max(0, deuda.saldo_actual - monto);
  const estado = saldo === 0 ? "pagada" : "activa";
  const upd = await admin()
    .from("deudas")
    .update({ saldo_actual: saldo, estado })
    .eq("id", deuda_id)
    .select("*")
    .single();
  const deudaAct = ok(upd) as Deuda;

  const movRes = await admin()
    .from("deuda_movimientos")
    .insert({ deuda_id, tipo: "abono", monto, fecha: hoyISO() })
    .select("*")
    .single();
  const movimiento = ok(movRes) as DeudaMovimiento;

  await crearEgreso({ categoria: "deuda", descripcion: `Abono a ${deuda.nombre}`, monto });
  return { deuda: deudaAct, movimiento };
}

export async function pagarDeudaTotal(
  deuda_id: string
): Promise<{ deuda: Deuda; movimiento: DeudaMovimiento }> {
  const deuda = await fetchDeuda(deuda_id);
  const monto = deuda.saldo_actual;
  const upd = await admin()
    .from("deudas")
    .update({ saldo_actual: 0, estado: "pagada" })
    .eq("id", deuda_id)
    .select("*")
    .single();
  const deudaAct = ok(upd) as Deuda;

  const movRes = await admin()
    .from("deuda_movimientos")
    .insert({ deuda_id, tipo: "pago_total", monto, fecha: hoyISO() })
    .select("*")
    .single();
  const movimiento = ok(movRes) as DeudaMovimiento;

  if (monto > 0)
    await crearEgreso({
      categoria: "deuda",
      descripcion: `Pago total de ${deuda.nombre}`,
      monto,
    });
  return { deuda: deudaAct, movimiento };
}

export async function crearDeuda(data: NuevaDeuda): Promise<Deuda> {
  const uid = cerebroUserId();
  const row = {
    user_id: uid,
    nombre: data.nombre,
    categoria: data.categoria,
    nivel_importancia: data.nivel_importancia,
    monto_original: data.monto_original,
    saldo_actual: data.saldo_actual ?? data.monto_original,
    tasa_interes: data.tasa_interes ?? null,
    fecha_limite: data.fecha_limite ?? null,
    estado: "activa",
  };
  const res = await admin().from("deudas").insert(row).select("*").single();
  return ok(res) as Deuda;
}

export async function eliminarDeuda(deuda_id: string): Promise<{ id: string }> {
  const uid = cerebroUserId();
  // borra movimientos hijos primero (por la FK)
  await admin().from("deuda_movimientos").delete().eq("deuda_id", deuda_id);
  const res = await admin()
    .from("deudas")
    .delete()
    .eq("user_id", uid)
    .eq("id", deuda_id);
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return { id: deuda_id };
}

export async function actualizarProyeccion(
  proyeccion_id: string,
  patch: ProyeccionPatch
): Promise<Proyeccion> {
  const set: Record<string, unknown> = {};
  if (patch.estado) set.estado = patch.estado;
  if (patch.fecha_objetivo !== undefined) set.fecha_objetivo = patch.fecha_objetivo || null;
  if (patch.fecha_tipo) set.fecha_tipo = patch.fecha_tipo;
  if (patch.notas !== undefined) {
    const cur = await admin()
      .from("proyecciones")
      .select("detalle")
      .eq("id", proyeccion_id)
      .single();
    const detalle = ((ok(cur) as { detalle?: Record<string, unknown> } | null)?.detalle) ?? {};
    set.detalle = { ...detalle, notas: patch.notas };
  }
  const res = await admin()
    .from("proyecciones")
    .update(set)
    .eq("id", proyeccion_id)
    .select("*")
    .single();
  const p = ok(res) as Proyeccion | null;
  if (!p) throw new Error("Proyección no encontrada");
  return p;
}

export async function eliminarProyeccion(proyeccion_id: string): Promise<{ id: string }> {
  const uid = cerebroUserId();
  // desvincula ingresos que apunten a esta proyección
  await admin()
    .from("ingresos")
    .update({ proyeccion_id: null })
    .eq("proyeccion_id", proyeccion_id);
  const res = await admin()
    .from("proyecciones")
    .delete()
    .eq("user_id", uid)
    .eq("id", proyeccion_id);
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return { id: proyeccion_id };
}

export async function aportarMeta(meta_id: string, monto: number): Promise<Meta> {
  if (monto <= 0) throw new Error("El aporte debe ser mayor que 0");
  const uid = cerebroUserId();
  const cur = await admin()
    .from("metas")
    .select("*")
    .eq("user_id", uid)
    .eq("id", meta_id)
    .single();
  const meta = ok(cur) as Meta | null;
  if (!meta) throw new Error("Meta no encontrada");
  const ahorrado = Math.min(meta.costo_objetivo, meta.ahorrado + monto);
  const upd = await admin()
    .from("metas")
    .update({ ahorrado })
    .eq("id", meta_id)
    .select("*")
    .single();
  return ok(upd) as Meta;
}

export async function actualizarMeta(
  meta_id: string,
  patch: { ahorrado?: number; costo_objetivo?: number }
): Promise<Meta> {
  const set: Record<string, number> = {};
  if (patch.costo_objetivo != null) set.costo_objetivo = patch.costo_objetivo;
  if (patch.ahorrado != null) set.ahorrado = Math.max(0, patch.ahorrado);
  const res = await admin()
    .from("metas")
    .update(set)
    .eq("id", meta_id)
    .select("*")
    .single();
  const m = ok(res) as Meta | null;
  if (!m) throw new Error("Meta no encontrada");
  return m;
}

export async function eliminarMeta(meta_id: string): Promise<{ id: string }> {
  const uid = cerebroUserId();
  await admin().from("tareas").update({ vinculo_meta_id: null }).eq("vinculo_meta_id", meta_id);
  const res = await admin().from("metas").delete().eq("user_id", uid).eq("id", meta_id);
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return { id: meta_id };
}

export async function eliminarReunion(reunion_id: string): Promise<{ id: string }> {
  const uid = cerebroUserId();
  const res = await admin()
    .from("reuniones")
    .delete()
    .eq("user_id", uid)
    .eq("id", reunion_id);
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return { id: reunion_id };
}

export async function crearProyeccion(data: NuevaProyeccion): Promise<{
  proyeccion: Proyeccion;
  ingreso?: Ingreso;
}> {
  const uid = cerebroUserId();
  const row = {
    user_id: uid,
    ambito: data.ambito,
    unidad_id: data.unidad_id ?? null,
    nombre: data.nombre,
    tipo: data.tipo,
    facturacion_esperada: data.facturacion_esperada ?? null,
    costo_estimado: data.costo_estimado ?? null,
    costo_recurrente: data.costo_recurrente ?? null,
    objetivo: data.objetivo ?? null,
    avance: data.avance ?? 0,
    fecha_objetivo: data.fecha_objetivo ?? null,
    fecha_tipo: data.fecha_tipo ?? "variable",
    estado: data.estado ?? "pendiente",
  };
  const res = await admin().from("proyecciones").insert(row).select("*").single();
  const proyeccion = ok(res) as Proyeccion;

  let ingreso: Ingreso | undefined;
  if (data.ganancia && data.ganancia.monto > 0) {
    ingreso = await crearIngreso({
      unidad_id: data.unidad_id ?? null,
      fuente: data.ganancia.fuente,
      descripcion: `Ganancia anexada desde proyección: ${data.nombre}`,
      monto: data.ganancia.monto,
      es_facturacion: data.ganancia.es_facturacion ?? false,
      origen_registro:
        data.ganancia.fuente === "consultoria" ? "proy_consultoria" : "proy_ecom",
      proyeccion_id: proyeccion.id,
    });
  }
  return { proyeccion, ingreso };
}

export async function aportarProyeccion(
  proyeccion_id: string,
  monto: number
): Promise<Proyeccion> {
  if (monto <= 0) throw new Error("El aporte debe ser mayor que 0");
  const uid = cerebroUserId();
  const cur = await admin()
    .from("proyecciones")
    .select("*")
    .eq("user_id", uid)
    .eq("id", proyeccion_id)
    .single();
  const p = ok(cur) as Proyeccion | null;
  if (!p) throw new Error("Proyección no encontrada");
  const objetivo = p.objetivo ?? p.costo_estimado ?? 0;
  const avance =
    objetivo > 0 ? Math.min(objetivo, (p.avance ?? 0) + monto) : (p.avance ?? 0) + monto;
  const estado =
    objetivo > 0 && avance >= objetivo ? "lograda" : avance > 0 ? "en_progreso" : p.estado;
  const upd = await admin()
    .from("proyecciones")
    .update({ avance, estado })
    .eq("id", proyeccion_id)
    .select("*")
    .single();
  return ok(upd) as Proyeccion;
}

export async function crearTarea(data: NuevaTarea): Promise<Tarea> {
  const uid = cerebroUserId();
  const activa = await getSemanaActiva();
  if (!activa) throw new Error("No hay semana activa");
  const row = {
    user_id: uid,
    semana_id: activa.id,
    ambito: data.ambito,
    titulo: data.titulo,
    descripcion: data.descripcion ?? null,
    estado: "pendiente",
    heredada: false,
    prioridad: data.prioridad ?? 3,
    vinculo_meta_id: data.vinculo_meta_id ?? null,
    vinculo_proyeccion_id: data.vinculo_proyeccion_id ?? null,
  };
  const res = await admin().from("tareas").insert(row).select("*").single();
  return ok(res) as Tarea;
}

export async function cambiarEstadoTarea(
  tarea_id: string,
  estado: Tarea["estado"]
): Promise<Tarea> {
  const res = await admin()
    .from("tareas")
    .update({ estado })
    .eq("id", tarea_id)
    .select("*")
    .single();
  const t = ok(res) as Tarea | null;
  if (!t) throw new Error("Tarea no encontrada");
  return t;
}

export async function iniciarNuevaSemana(): Promise<{ semana: Semana; arrastradas: number }> {
  const uid = cerebroUserId();
  const actual = await getSemanaActiva();
  if (actual) {
    await admin().from("semanas").update({ activa: false }).eq("id", actual.id);
  }
  const base = actual ? new Date(actual.fecha_fin) : new Date();
  base.setDate(base.getDate() + 1);
  const dia = (base.getDay() + 6) % 7;
  const lunes = new Date(base);
  lunes.setDate(base.getDate() - dia);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  const res = await admin()
    .from("semanas")
    .insert({
      user_id: uid,
      fecha_inicio: lunes.toISOString().slice(0, 10),
      fecha_fin: domingo.toISOString().slice(0, 10),
      activa: true,
    })
    .select("*")
    .single();
  const nueva = ok(res) as Semana;

  let arrastradas = 0;
  if (actual) {
    const pend = await admin()
      .from("tareas")
      .select("*")
      .eq("semana_id", actual.id)
      .neq("estado", "hecha");
    const pendientes = (ok(pend) as Tarea[]) ?? [];
    if (pendientes.length > 0) {
      const filas = pendientes.map((t) => ({
        user_id: uid,
        semana_id: nueva.id,
        ambito: t.ambito,
        titulo: t.titulo,
        descripcion: t.descripcion ?? null,
        estado: "pendiente",
        heredada: true,
        prioridad: t.prioridad,
        vinculo_meta_id: t.vinculo_meta_id ?? null,
        vinculo_proyeccion_id: t.vinculo_proyeccion_id ?? null,
      }));
      const ins = await admin().from("tareas").insert(filas);
      if (ins.error) throw new Error(`Supabase: ${ins.error.message}`);
      arrastradas = filas.length;
    }
  }
  return { semana: nueva, arrastradas };
}

export async function crearReunion(data: NuevaReunion): Promise<Reunion> {
  const uid = cerebroUserId();
  const row = {
    user_id: uid,
    ambito: data.ambito,
    titulo: data.titulo,
    con_quien: data.con_quien ?? null,
    inicio: data.inicio,
    fin: data.fin ?? null,
    fuente: "manual",
    calendly_event_id: null,
    notas: data.notas ?? null,
  };
  const res = await admin().from("reuniones").insert(row).select("*").single();
  return ok(res) as Reunion;
}

// ── Testeos ────────────────────────────────────────────────────────
export async function crearTesteo(data: NuevoTesteo): Promise<Testeo> {
  const uid = cerebroUserId();
  const row = {
    user_id: uid,
    producto: data.producto,
    hipotesis: data.hipotesis ?? null,
    fecha_testeo: data.fecha_testeo ?? null,
    estado: "planificado",
    prioridad: data.prioridad ?? 3,
    presupuesto: data.presupuesto ?? null,
    notas: data.notas ?? null,
    resultado: null,
    cuello_botella: data.cuello_botella ?? null,
    fecha_correccion: data.fecha_correccion ?? null,
    pasos: PASOS_TESTEO_DEFECTO.map((titulo, i) => ({
      id: `p${i}-${Math.random().toString(36).slice(2, 7)}`,
      titulo,
      hecho: false,
    })),
  };
  const res = await admin().from("testeos").insert(row).select("*").single();
  return ok(res) as Testeo;
}

export async function actualizarTesteo(id: string, patch: TesteoPatch): Promise<Testeo> {
  const res = await admin()
    .from("testeos")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  const t = ok(res) as Testeo | null;
  if (!t) throw new Error("Testeo no encontrado");
  return t;
}

export async function eliminarTesteo(id: string): Promise<{ id: string }> {
  const uid = cerebroUserId();
  const res = await admin().from("testeos").delete().eq("user_id", uid).eq("id", id);
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return { id };
}

// ── Notas ──────────────────────────────────────────────────────────
export async function crearNota(data: NuevaNota): Promise<Nota> {
  const uid = cerebroUserId();
  const row = {
    user_id: uid,
    fecha: data.fecha ?? new Date().toISOString().slice(0, 10),
    categoria: data.categoria ?? "general",
    contenido: data.contenido,
    fuente: data.fuente ?? null,
    hecha: false,
  };
  const res = await admin().from("notas").insert(row).select("*").single();
  return ok(res) as Nota;
}

export async function actualizarNota(id: string, patch: NotaPatch): Promise<Nota> {
  const res = await admin().from("notas").update(patch).eq("id", id).select("*").single();
  const n = ok(res) as Nota | null;
  if (!n) throw new Error("Nota no encontrada");
  return n;
}

export async function eliminarNota(id: string): Promise<{ id: string }> {
  const uid = cerebroUserId();
  const res = await admin().from("notas").delete().eq("user_id", uid).eq("id", id);
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return { id };
}

export async function upsertReunionCalendly(data: ReunionCalendly): Promise<Reunion> {
  const uid = cerebroUserId();
  if (data.calendly_event_id) {
    const prev = await admin()
      .from("reuniones")
      .select("*")
      .eq("user_id", uid)
      .eq("calendly_event_id", data.calendly_event_id)
      .maybeSingle();
    const existente = ok(prev) as Reunion | null;
    if (existente) {
      const upd = await admin()
        .from("reuniones")
        .update({
          titulo: data.titulo,
          con_quien: data.con_quien ?? null,
          inicio: data.inicio,
          fin: data.fin ?? null,
        })
        .eq("id", existente.id)
        .select("*")
        .single();
      return ok(upd) as Reunion;
    }
  }
  const res = await admin()
    .from("reuniones")
    .insert({
      user_id: uid,
      ambito: data.ambito,
      titulo: data.titulo,
      con_quien: data.con_quien ?? null,
      inicio: data.inicio,
      fin: data.fin ?? null,
      fuente: "calendly",
      calendly_event_id: data.calendly_event_id,
    })
    .select("*")
    .single();
  return ok(res) as Reunion;
}
