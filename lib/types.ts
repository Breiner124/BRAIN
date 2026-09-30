// ── Tipos de dominio de El Cerebro ─────────────────────────────────
// Reflejan el modelo de datos de §4 del blueprint. Montos en COP.

export type NodoTipo =
  | "central"
  | "yo"
  | "proyecciones"
  | "proy_personal"
  | "proy_empresarial"
  | "unidad_consultoria"
  | "unidad_ecom"
  | "metas"
  | "ganancias"
  | "deudas"
  | "testeos";

export type TipoFlujo = "financiero" | "tarea" | "informativo";

export interface Nodo {
  id: string;
  parent_id: string | null;
  tipo: NodoTipo;
  titulo: string;
  resumen?: string;
  posicion_x: number;
  posicion_y: number;
  color?: string;
  icono?: string;
  orden: number;
}

export interface Conexion {
  id: string;
  origen_id: string;
  destino_id: string;
  tipo_flujo: TipoFlujo;
  activa: boolean;
}

export interface UnidadNegocio {
  id: string;
  slug: "consultoria" | "ecom" | string;
  nombre: string;
  margen_neto: number | null; // ecom = 0.15; consultoria = null (pagos netos)
}

export type FuenteIngreso = "consultoria" | "ecom" | "otros";
export type OrigenRegistro = "ganancias" | "proy_consultoria" | "proy_ecom";

export interface Ingreso {
  id: string;
  unidad_id: string | null;
  fuente: FuenteIngreso;
  descripcion: string;
  monto: number; // COP
  es_facturacion: boolean; // true → se le aplica margen de la unidad
  fecha: string; // ISO date
  recurrente: boolean;
  origen_registro: OrigenRegistro;
  proyeccion_id?: string | null;
}

export type CategoriaEgreso =
  | "operativo"
  | "nomina"
  | "deuda"
  | "personal"
  | "inversion";

export interface Egreso {
  id: string;
  unidad_id: string | null;
  categoria: CategoriaEgreso;
  descripcion: string;
  monto: number;
  fecha: string;
  fijo: boolean; // gasto fijo mensual
}

export type CategoriaDeuda =
  | "tarjeta_credito"
  | "tercero"
  | "credito_fijo"
  | "otro";

export interface Deuda {
  id: string;
  nombre: string;
  categoria: CategoriaDeuda;
  nivel_importancia: number; // 1 = más importante
  monto_original: number;
  saldo_actual: number;
  tasa_interes?: number | null;
  fecha_limite?: string | null;
  estado: "activa" | "pagada";
}

export interface DeudaMovimiento {
  id: string;
  deuda_id: string;
  tipo: "abono" | "pago_total";
  monto: number;
  fecha: string;
}

export type CategoriaMeta = "vehiculo" | "viaje" | "festividad" | "otro";

export interface Meta {
  id: string;
  nombre: string;
  categoria: CategoriaMeta;
  costo_objetivo: number;
  ahorrado: number;
  fecha_objetivo?: string | null;
  fecha_tipo: "fija" | "variable";
  prioridad: number;
  detalle?: Record<string, unknown>;
}

export type AmbitoProyeccion = "personal" | "empresarial";
export type TipoProyeccion =
  | "ingreso_esperado"
  | "contratacion"
  | "inversion"
  | "expansion"
  | "personal";

export interface Proyeccion {
  id: string;
  ambito: AmbitoProyeccion;
  unidad_id: string | null;
  nombre: string;
  tipo: TipoProyeccion;
  facturacion_esperada?: number | null;
  costo_estimado?: number | null; // inversión una vez
  costo_recurrente?: number | null; // costo fijo mensual generado
  fecha_objetivo?: string | null;
  fecha_tipo: "fija" | "variable";
  estado: "pendiente" | "en_progreso" | "lograda";
  /** Avance acumulado (COP) — usado por proyecciones personales para su barra. */
  avance?: number;
  /** Objetivo de la barra (COP) — para proyecciones personales de patrimonio/ahorro. */
  objetivo?: number | null;
  detalle?: Record<string, unknown>;
}

export interface Profile {
  id: string;
  nombre: string;
  moneda: string;
  tasa_cambio_usd: number;
  margen_neto_bolsillo: number; // 0.15
}

// ── Escenarios de facturación empresarial (§9) ─────────────────────
export type EscenarioClave =
  | "conservador"
  | "medio"
  | "optimista"
  | "stretch";

export interface EscenarioFacturacion {
  clave: EscenarioClave;
  nombre: string;
  facturacion_mes: number;
}

// ── Nodo Yo — semanas, tareas, reuniones (§4.8, §7) ────────────────
export type AmbitoTrabajo = "consultoria" | "ecom" | "personal";

export interface Semana {
  id: string;
  fecha_inicio: string; // ISO date (lunes)
  fecha_fin: string; // ISO date (domingo)
  activa: boolean;
  nota?: string;
}

export interface Tarea {
  id: string;
  semana_id: string;
  ambito: AmbitoTrabajo;
  titulo: string;
  descripcion?: string;
  estado: "pendiente" | "hecha" | "aplazada";
  heredada: boolean; // vino de semana anterior
  prioridad: number;
  vinculo_meta_id?: string | null;
  vinculo_proyeccion_id?: string | null;
}

export interface Reunion {
  id: string;
  ambito: "consultoria" | "ecom";
  titulo: string;
  con_quien?: string;
  inicio: string; // ISO datetime
  fin?: string | null;
  fuente: "manual" | "calendly";
  calendly_event_id?: string | null;
  notas?: string;
}

// ── Nodo Testeos — programación de testeos + bloc de notas (nuevo) ──
export type EstadoTesteo = "planificado" | "en_curso" | "hecho" | "descartado";

export interface PasoTesteo {
  id: string;
  titulo: string;
  hecho: boolean;
  nota?: string; // lo que voy anotando de este paso
}

export interface Testeo {
  id: string;
  producto: string;
  hipotesis?: string | null; // qué se quiere validar
  fecha_testeo?: string | null; // día programado de los ads / inicio
  estado: EstadoTesteo;
  prioridad: number; // 1 = más importante
  presupuesto?: number | null;
  notas?: string | null; // preparación / checklist
  resultado?: string | null; // qué pasó / feedback
  cuello_botella?: string | null; // qué está trabando
  fecha_correccion?: string | null; // fecha límite para corregirlo
  pasos?: PasoTesteo[]; // checklist con progreso
  created_at?: string;
}

// Pasos por defecto de un testeo (§ flujo del usuario)
export const PASOS_TESTEO_DEFECTO = [
  "Descargar ads",
  "Investigación de mercado",
  "Desarrollar landing",
  "Montaje de campañas",
];

export type CategoriaNota = "mentoria" | "tarea" | "idea" | "general";

export interface Nota {
  id: string;
  fecha: string; // fecha de la nota (ISO date)
  categoria: CategoriaNota;
  contenido: string;
  fuente?: string | null; // quién lo dijo (mentor, etc.)
  hecha?: boolean; // para tareas fundamentales
  created_at?: string;
}
