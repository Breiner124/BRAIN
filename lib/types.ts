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
  | "deudas";

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
