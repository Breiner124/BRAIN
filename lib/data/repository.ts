// ── Repositorio de dominio (enrutador async) ───────────────────────
// Única puerta de acceso a datos para rutas y páginas. Elige el backend:
//   • Supabase (persistente)  si usarSupabase() === true
//   • memoria (demo)          en caso contrario
// La API pública es SIEMPRE async, así la UI no cambia entre modos.

import { escenarios } from "@/lib/data/store";
import { usarSupabase } from "@/lib/supabase/admin";
import * as mem from "@/lib/data/mem-repo";
import * as sb from "@/lib/data/supabase-repo";
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
  Reunion,
  Semana,
  Tarea,
  UnidadNegocio,
} from "@/lib/types";
import type {
  NuevaDeuda,
  NuevaProyeccion,
  NuevaReunion,
  NuevaTarea,
  NuevoEgreso,
  NuevoIngreso,
  ProyeccionPatch,
  ReunionCalendly,
} from "@/lib/data/contracts";
import { correrMotor, facturacionDiariaPromedio, type EngineInput } from "@/lib/engine";

const SB = () => usarSupabase();

// Reexporta los contratos para las rutas/UI que los usaban desde aquí.
export type {
  NuevaDeuda,
  NuevaProyeccion,
  NuevaReunion,
  NuevaTarea,
  NuevoEgreso,
  NuevoIngreso,
  ProyeccionPatch,
  ReunionCalendly,
} from "@/lib/data/contracts";

// ── Lecturas ───────────────────────────────────────────────────────
export const getEscenarios = () => escenarios();

export const getProfile = (): Promise<Profile> =>
  SB() ? sb.getProfile() : Promise.resolve(mem.getProfile());
export const getNodos = (): Promise<Nodo[]> =>
  SB() ? sb.getNodos() : Promise.resolve(mem.getNodos());
export const getConexiones = (): Promise<Conexion[]> =>
  SB() ? sb.getConexiones() : Promise.resolve(mem.getConexiones());
export const getUnidades = (): Promise<UnidadNegocio[]> =>
  SB() ? sb.getUnidades() : Promise.resolve(mem.getUnidades());
export const getIngresos = (): Promise<Ingreso[]> =>
  SB() ? sb.getIngresos() : Promise.resolve(mem.getIngresos());
export const getEgresos = (): Promise<Egreso[]> =>
  SB() ? sb.getEgresos() : Promise.resolve(mem.getEgresos());
export const getDeudas = (): Promise<Deuda[]> =>
  SB() ? sb.getDeudas() : Promise.resolve(mem.getDeudas());
export const getMetas = (): Promise<Meta[]> =>
  SB() ? sb.getMetas() : Promise.resolve(mem.getMetas());
export const getProyecciones = (): Promise<Proyeccion[]> =>
  SB() ? sb.getProyecciones() : Promise.resolve(mem.getProyecciones());
export const getSemanas = (): Promise<Semana[]> =>
  SB() ? sb.getSemanas() : Promise.resolve(mem.getSemanas());
export const getSemanaActiva = (): Promise<Semana | undefined> =>
  SB() ? sb.getSemanaActiva() : Promise.resolve(mem.getSemanaActiva());
export const getTareas = (semana_id?: string): Promise<Tarea[]> =>
  SB() ? sb.getTareas(semana_id) : Promise.resolve(mem.getTareas(semana_id));
export const getReuniones = (): Promise<Reunion[]> =>
  SB() ? sb.getReuniones() : Promise.resolve(mem.getReuniones());
export const getDeudaMovimientos = (deuda_id?: string): Promise<DeudaMovimiento[]> =>
  SB() ? sb.getDeudaMovimientos(deuda_id) : Promise.resolve(mem.getDeudaMovimientos(deuda_id));

// ── Mutaciones ─────────────────────────────────────────────────────
export const crearIngreso = (data: NuevoIngreso): Promise<Ingreso> =>
  SB() ? sb.crearIngreso(data) : Promise.resolve(mem.crearIngreso(data));
export const crearEgreso = (data: NuevoEgreso): Promise<Egreso> =>
  SB() ? sb.crearEgreso(data) : Promise.resolve(mem.crearEgreso(data));
export const eliminarIngreso = (id: string): Promise<{ id: string }> =>
  SB() ? sb.eliminarIngreso(id) : Promise.resolve(mem.eliminarIngreso(id));
export const actualizarMeta = (
  id: string,
  patch: { ahorrado?: number; costo_objetivo?: number }
): Promise<Meta> =>
  SB() ? sb.actualizarMeta(id, patch) : Promise.resolve(mem.actualizarMeta(id, patch));
export const eliminarMeta = (id: string): Promise<{ id: string }> =>
  SB() ? sb.eliminarMeta(id) : Promise.resolve(mem.eliminarMeta(id));
export const eliminarReunion = (id: string): Promise<{ id: string }> =>
  SB() ? sb.eliminarReunion(id) : Promise.resolve(mem.eliminarReunion(id));
export const abonarDeuda = (deuda_id: string, monto: number) =>
  SB() ? sb.abonarDeuda(deuda_id, monto) : Promise.resolve(mem.abonarDeuda(deuda_id, monto));
export const pagarDeudaTotal = (deuda_id: string) =>
  SB() ? sb.pagarDeudaTotal(deuda_id) : Promise.resolve(mem.pagarDeudaTotal(deuda_id));
export const aportarMeta = (meta_id: string, monto: number): Promise<Meta> =>
  SB() ? sb.aportarMeta(meta_id, monto) : Promise.resolve(mem.aportarMeta(meta_id, monto));
export const crearDeuda = (data: NuevaDeuda): Promise<Deuda> =>
  SB() ? sb.crearDeuda(data) : Promise.resolve(mem.crearDeuda(data));
export const eliminarDeuda = (deuda_id: string): Promise<{ id: string }> =>
  SB() ? sb.eliminarDeuda(deuda_id) : Promise.resolve(mem.eliminarDeuda(deuda_id));
export const actualizarProyeccion = (
  id: string,
  patch: ProyeccionPatch
): Promise<Proyeccion> =>
  SB()
    ? sb.actualizarProyeccion(id, patch)
    : Promise.resolve(mem.actualizarProyeccion(id, patch));
export const eliminarProyeccion = (id: string): Promise<{ id: string }> =>
  SB() ? sb.eliminarProyeccion(id) : Promise.resolve(mem.eliminarProyeccion(id));
export const crearProyeccion = (data: NuevaProyeccion) =>
  SB() ? sb.crearProyeccion(data) : Promise.resolve(mem.crearProyeccion(data));
export const aportarProyeccion = (id: string, monto: number): Promise<Proyeccion> =>
  SB() ? sb.aportarProyeccion(id, monto) : Promise.resolve(mem.aportarProyeccion(id, monto));
export const crearTarea = (data: NuevaTarea): Promise<Tarea> =>
  SB() ? sb.crearTarea(data) : Promise.resolve(mem.crearTarea(data));
export const cambiarEstadoTarea = (id: string, estado: Tarea["estado"]): Promise<Tarea> =>
  SB() ? sb.cambiarEstadoTarea(id, estado) : Promise.resolve(mem.cambiarEstadoTarea(id, estado));
export const iniciarNuevaSemana = () =>
  SB() ? sb.iniciarNuevaSemana() : Promise.resolve(mem.iniciarNuevaSemana());
export const crearReunion = (data: NuevaReunion): Promise<Reunion> =>
  SB() ? sb.crearReunion(data) : Promise.resolve(mem.crearReunion(data));
export const upsertReunionCalendly = (data: ReunionCalendly): Promise<Reunion> =>
  SB() ? sb.upsertReunionCalendly(data) : Promise.resolve(mem.upsertReunionCalendly(data));

// ── Ensamble de entrada del motor + corrida (backend-agnóstico) ────
export async function engineInput(hoy = new Date()): Promise<EngineInput> {
  const [profile, ingresos, egresos, deudas, proyecciones, metas, unidades] =
    await Promise.all([
      getProfile(),
      getIngresos(),
      getEgresos(),
      getDeudas(),
      getProyecciones(),
      getMetas(),
      getUnidades(),
    ]);
  const escenarioMedio = getEscenarios().find((e) => e.clave === "medio");
  return {
    ingresos,
    egresos,
    deudas,
    proyecciones,
    metas,
    unidades,
    hoy,
    config: { margen_neto_bolsillo: profile.margen_neto_bolsillo },
    escenarioElegido: escenarioMedio,
  };
}

/** Facturación diaria real promedio del mes en curso (base de cálculos). */
export function facturacionRealDiariaDe(ingresos: Ingreso[], hoy = new Date()): number {
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const diasTranscurridos = Math.max(1, hoy.getDate());
  const delMes = ingresos.filter((i) => new Date(i.fecha) >= inicioMes);
  return facturacionDiariaPromedio(delMes, diasTranscurridos);
}

export async function facturacionRealDiaria(hoy = new Date()): Promise<number> {
  return facturacionRealDiariaDe(await getIngresos(), hoy);
}

export async function motor(hoy = new Date()) {
  const input = await engineInput(hoy);
  return correrMotor(input, facturacionRealDiariaDe(input.ingresos, hoy));
}
