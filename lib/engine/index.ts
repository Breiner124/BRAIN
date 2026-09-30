// ── ⚙️ Motor Financiero de El Cerebro (§6) ─────────────────────────
// Funciones PURAS y deterministas. No leen fecha global: reciben `hoy`.
// Ningún número está "quemado": todo lee de EngineConfig (viene de profile/config).

import type {
  Deuda,
  Egreso,
  EscenarioFacturacion,
  Ingreso,
  Meta,
  Proyeccion,
  UnidadNegocio,
} from "@/lib/types";

// ── Configuración editable (nada quemado) ──────────────────────────
export interface EngineConfig {
  margen_neto_bolsillo: number; // 0.15
  dias_mes: number; // 30
  // Meses por defecto cuando una meta/deuda/proyección no tiene fecha fija:
  meses_default_meta: number; // 24
  meses_default_deuda: number; // 6
  meses_default_proyeccion: number; // 12
  // Reparto sugerido de excedente (§6.8), fracciones que suman 1:
  reparto_excedente: {
    ahorro: number;
    inversion: number;
    metas: number;
    gusto: number;
  };
}

export const CONFIG_POR_DEFECTO: EngineConfig = {
  margen_neto_bolsillo: 0.15,
  dias_mes: 30,
  meses_default_meta: 24,
  meses_default_deuda: 6,
  meses_default_proyeccion: 12,
  reparto_excedente: { ahorro: 0.4, inversion: 0.3, metas: 0.2, gusto: 0.1 },
};

export interface EngineInput {
  ingresos: Ingreso[];
  egresos: Egreso[];
  deudas: Deuda[];
  proyecciones: Proyeccion[];
  metas: Meta[];
  unidades: UnidadNegocio[];
  hoy: Date;
  config?: Partial<EngineConfig>;
  /** Escenario elegido para proyección de bolsillo empresarial (§6.3). */
  escenarioElegido?: EscenarioFacturacion;
}

// ── Helpers de fechas ──────────────────────────────────────────────
/** Meses restantes hasta `fecha` desde `hoy`, mínimo 1. */
export function mesesRestantes(hoy: Date, fecha?: string | null, fallback = 12): number {
  if (!fecha) return Math.max(1, fallback);
  const objetivo = new Date(fecha);
  if (Number.isNaN(objetivo.getTime())) return Math.max(1, fallback);
  const dias = (objetivo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
  if (dias <= 0) return 1;
  return Math.max(1, Math.ceil(dias / 30));
}

function cfg(input: EngineInput): EngineConfig {
  return { ...CONFIG_POR_DEFECTO, ...(input.config ?? {}) };
}

function margenDeUnidad(
  unidad_id: string | null,
  unidades: UnidadNegocio[],
  fallback: number
): number {
  if (!unidad_id) return fallback;
  const u = unidades.find((x) => x.id === unidad_id);
  if (!u || u.margen_neto == null) return fallback;
  return u.margen_neto;
}

// ── §6.2 Cruce ingresos vs egresos ─────────────────────────────────
export interface Cruce {
  ingreso_mensual: number;
  egreso_fijo: number;
  egreso_variable: number;
  egreso_total: number;
  flujo_neto: number;
  ingresos_por_fuente: Record<string, number>;
}

export function calcularCruce(input: EngineInput): Cruce {
  const c = cfg(input);
  let ingreso_mensual = 0;
  const ingresos_por_fuente: Record<string, number> = {
    consultoria: 0,
    ecom: 0,
    otros: 0,
  };

  for (const i of input.ingresos) {
    const neto = i.es_facturacion
      ? i.monto * margenDeUnidad(i.unidad_id, input.unidades, c.margen_neto_bolsillo)
      : i.monto;
    ingreso_mensual += neto;
    ingresos_por_fuente[i.fuente] = (ingresos_por_fuente[i.fuente] ?? 0) + neto;
  }

  const egreso_fijo = input.egresos
    .filter((e) => e.fijo)
    .reduce((s, e) => s + e.monto, 0);
  const egreso_variable = input.egresos
    .filter((e) => !e.fijo)
    .reduce((s, e) => s + e.monto, 0);
  const egreso_total = egreso_fijo + egreso_variable;

  return {
    ingreso_mensual,
    egreso_fijo,
    egreso_variable,
    egreso_total,
    flujo_neto: ingreso_mensual - egreso_total,
    ingresos_por_fuente,
  };
}

// ── §6.3 Proyección de bolsillo empresarial ────────────────────────
export function bolsilloDeEscenario(facturacion: number, margen: number): number {
  return facturacion * margen;
}

export interface BolsilloProyectado {
  bolsillo_ecom: number;
  ingresos_consultoria: number;
  otros: number;
  bolsillo_total: number;
}

export function proyectarBolsillo(input: EngineInput): BolsilloProyectado {
  const c = cfg(input);
  const cruce = calcularCruce(input);
  const bolsillo_ecom = input.escenarioElegido
    ? bolsilloDeEscenario(input.escenarioElegido.facturacion_mes, c.margen_neto_bolsillo)
    : cruce.ingresos_por_fuente.ecom ?? 0;
  return {
    bolsillo_ecom,
    ingresos_consultoria: cruce.ingresos_por_fuente.consultoria ?? 0,
    otros: cruce.ingresos_por_fuente.otros ?? 0,
    bolsillo_total:
      bolsillo_ecom +
      (cruce.ingresos_por_fuente.consultoria ?? 0) +
      (cruce.ingresos_por_fuente.otros ?? 0),
  };
}

// ── §6.4 Óptimo #1 — cubrir PROYECCIONES + DEUDAS ──────────────────
export function servicioDeudasMes(input: EngineInput): number {
  const c = cfg(input);
  return input.deudas
    .filter((d) => d.estado === "activa" && d.saldo_actual > 0)
    .reduce((s, d) => {
      const meses = mesesRestantes(input.hoy, d.fecha_limite, c.meses_default_deuda);
      return s + d.saldo_actual / meses;
    }, 0);
}

export function costoProyeccionesMes(input: EngineInput): number {
  const c = cfg(input);
  let total = 0;
  for (const p of input.proyecciones) {
    if (p.ambito === "personal") continue; // personales no imponen óptimo empresarial
    if (p.estado === "lograda") {
      // ya ejecutada: solo su costo recurrente sigue pesando
      total += p.costo_recurrente ?? 0;
      continue;
    }
    // pendiente / en_progreso: prorratea inversión + recurrente (si en progreso)
    if (p.costo_estimado) {
      const meses = mesesRestantes(input.hoy, p.fecha_objetivo, c.meses_default_proyeccion);
      total += p.costo_estimado / meses;
    }
    if (p.estado === "en_progreso") {
      total += p.costo_recurrente ?? 0;
    }
  }
  return total;
}

export interface OptimoProyecciones {
  egreso_fijo: number;
  servicio_deudas_mes: number;
  costo_proy_mes: number;
  optimo_proyecciones: number;
  facturacion_diaria_para_proyecciones: number;
}

export function calcularOptimoProyecciones(input: EngineInput): OptimoProyecciones {
  const c = cfg(input);
  const egreso_fijo = input.egresos.filter((e) => e.fijo).reduce((s, e) => s + e.monto, 0);
  const servicio_deudas_mes = servicioDeudasMes(input);
  const costo_proy_mes = costoProyeccionesMes(input);
  const optimo_proyecciones = egreso_fijo + servicio_deudas_mes + costo_proy_mes;
  return {
    egreso_fijo,
    servicio_deudas_mes,
    costo_proy_mes,
    optimo_proyecciones,
    facturacion_diaria_para_proyecciones:
      optimo_proyecciones / c.margen_neto_bolsillo / c.dias_mes,
  };
}

// ── §6.5 Óptimo #2 — lograr METAS ──────────────────────────────────
export interface AporteMeta {
  meta_id: string;
  nombre: string;
  aporte_mensual: number;
  restante: number;
  meses_restantes: number;
}

export function aportesMetas(input: EngineInput): AporteMeta[] {
  const c = cfg(input);
  return input.metas
    .map((m) => {
      const restante = Math.max(0, m.costo_objetivo - m.ahorrado);
      const meses = mesesRestantes(input.hoy, m.fecha_objetivo, c.meses_default_meta);
      return {
        meta_id: m.id,
        nombre: m.nombre,
        aporte_mensual: restante / meses,
        restante,
        meses_restantes: meses,
      };
    })
    .filter((a) => a.restante > 0);
}

export interface OptimoMetas {
  aportes: AporteMeta[];
  optimo_metas: number;
  facturacion_diaria_para_metas: number;
}

export function calcularOptimoMetas(input: EngineInput): OptimoMetas {
  const c = cfg(input);
  const aportes = aportesMetas(input);
  const optimo_metas = aportes.reduce((s, a) => s + a.aporte_mensual, 0);
  return {
    aportes,
    optimo_metas,
    facturacion_diaria_para_metas: optimo_metas / c.margen_neto_bolsillo / c.dias_mes,
  };
}

// ── §6.6 Óptimo combinado + semáforo ───────────────────────────────
export type Semaforo = "verde" | "amarillo" | "rojo";

export interface OptimoCombinado {
  optimo_proyecciones: number;
  optimo_metas: number;
  optimo_total: number;
  facturacion_diaria_ideal: number;
  facturacion_diaria_para_proyecciones: number;
  facturacion_real_diaria: number;
  semaforo: Semaforo;
}

export function calcularOptimoCombinado(
  input: EngineInput,
  facturacion_real_diaria: number
): OptimoCombinado {
  const c = cfg(input);
  const p = calcularOptimoProyecciones(input);
  const m = calcularOptimoMetas(input);
  const optimo_total = p.optimo_proyecciones + m.optimo_metas;
  const facturacion_diaria_ideal = optimo_total / c.margen_neto_bolsillo / c.dias_mes;

  let semaforo: Semaforo = "rojo";
  if (facturacion_real_diaria >= facturacion_diaria_ideal) semaforo = "verde";
  else if (facturacion_real_diaria >= p.facturacion_diaria_para_proyecciones)
    semaforo = "amarillo";

  return {
    optimo_proyecciones: p.optimo_proyecciones,
    optimo_metas: m.optimo_metas,
    optimo_total,
    facturacion_diaria_ideal,
    facturacion_diaria_para_proyecciones: p.facturacion_diaria_para_proyecciones,
    facturacion_real_diaria,
    semaforo,
  };
}

// ── §6.7 ROI de expansión ──────────────────────────────────────────
export function facturacionParaRentabilizar(
  costo_recurrente_mes: number,
  margen: number
): number {
  if (margen <= 0) return Infinity;
  return costo_recurrente_mes / margen;
}

// ── §6.8 Recomendador de excedente ─────────────────────────────────
export interface Recomendacion {
  excedente: number;
  hay_excedente: boolean;
  sugerencias: { concepto: string; fraccion: number; monto: number }[];
}

export function recomendarExcedente(
  input: EngineInput,
  flujo_neto: number,
  optimo_total: number
): Recomendacion {
  const c = cfg(input);
  const excedente = flujo_neto - optimo_total;
  if (excedente <= 0) {
    return { excedente, hay_excedente: false, sugerencias: [] };
  }
  const r = c.reparto_excedente;
  return {
    excedente,
    hay_excedente: true,
    sugerencias: [
      { concepto: "Ahorro / colchón", fraccion: r.ahorro, monto: excedente * r.ahorro },
      { concepto: "Inversión", fraccion: r.inversion, monto: excedente * r.inversion },
      { concepto: "Adelantar metas", fraccion: r.metas, monto: excedente * r.metas },
      { concepto: "Gusto personal", fraccion: r.gusto, monto: excedente * r.gusto },
    ],
  };
}

// ── Facturación diaria promedio (base de cálculos, §5.5) ───────────
/** Promedio de facturación (es_facturacion=true) por día del periodo dado. */
export function facturacionDiariaPromedio(
  ingresos: Ingreso[],
  dias_periodo: number
): number {
  if (dias_periodo <= 0) return 0;
  const totalFacturacion = ingresos
    .filter((i) => i.es_facturacion)
    .reduce((s, i) => s + i.monto, 0);
  return totalFacturacion / dias_periodo;
}

// ── Resultado agregado del motor (para /api/motor/optimos) ─────────
export interface ResultadoMotor {
  cruce: Cruce;
  bolsillo: BolsilloProyectado;
  optimo_proyecciones: OptimoProyecciones;
  optimo_metas: OptimoMetas;
  combinado: OptimoCombinado;
  recomendacion: Recomendacion;
}

export function correrMotor(
  input: EngineInput,
  facturacion_real_diaria: number
): ResultadoMotor {
  const cruce = calcularCruce(input);
  const bolsillo = proyectarBolsillo(input);
  const optimo_proyecciones = calcularOptimoProyecciones(input);
  const optimo_metas = calcularOptimoMetas(input);
  const combinado = calcularOptimoCombinado(input, facturacion_real_diaria);
  const recomendacion = recomendarExcedente(
    input,
    cruce.flujo_neto,
    combinado.optimo_total
  );
  return { cruce, bolsillo, optimo_proyecciones, optimo_metas, combinado, recomendacion };
}
