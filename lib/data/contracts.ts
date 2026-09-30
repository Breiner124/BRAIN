// ── Contratos de entrada compartidos por ambos backends ────────────
import type {
  CategoriaNota,
  Deuda,
  Egreso,
  EstadoTesteo,
  FuenteIngreso,
  OrigenRegistro,
  PasoTesteo,
  Proyeccion,
  Reunion,
  Tarea,
} from "@/lib/types";

export interface NuevoTesteo {
  producto: string;
  hipotesis?: string | null;
  fecha_testeo?: string | null;
  prioridad?: number;
  presupuesto?: number | null;
  notas?: string | null;
  cuello_botella?: string | null;
  fecha_correccion?: string | null;
}

export interface TesteoPatch {
  producto?: string;
  hipotesis?: string | null;
  fecha_testeo?: string | null;
  estado?: EstadoTesteo;
  prioridad?: number;
  presupuesto?: number | null;
  notas?: string | null;
  resultado?: string | null;
  cuello_botella?: string | null;
  fecha_correccion?: string | null;
  pasos?: PasoTesteo[];
}

export interface NuevaNota {
  contenido: string;
  categoria?: CategoriaNota;
  fecha?: string;
  fuente?: string | null;
}

export interface NotaPatch {
  contenido?: string;
  categoria?: CategoriaNota;
  fecha?: string;
  fuente?: string | null;
  hecha?: boolean;
}

export interface NuevaDeuda {
  nombre: string;
  categoria: Deuda["categoria"];
  nivel_importancia: number;
  monto_original: number;
  saldo_actual?: number;
  tasa_interes?: number | null;
  fecha_limite?: string | null;
}

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

export interface NuevoEgreso {
  unidad_id?: string | null;
  categoria: Egreso["categoria"];
  descripcion: string;
  monto: number;
  fecha?: string;
  fijo?: boolean;
}

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
  objetivo?: number | null;
  avance?: number;
  ganancia?: { monto: number; fuente: FuenteIngreso; es_facturacion?: boolean };
}

export interface ProyeccionPatch {
  estado?: Proyeccion["estado"];
  fecha_objetivo?: string | null;
  fecha_tipo?: "fija" | "variable";
  notas?: string;
}

export interface NuevaTarea {
  ambito: Tarea["ambito"];
  titulo: string;
  descripcion?: string;
  prioridad?: number;
  vinculo_meta_id?: string | null;
  vinculo_proyeccion_id?: string | null;
}

export interface NuevaReunion {
  ambito: Reunion["ambito"];
  titulo: string;
  con_quien?: string;
  inicio: string;
  fin?: string | null;
  notas?: string;
}

export interface ReunionCalendly {
  ambito: Reunion["ambito"];
  titulo: string;
  con_quien?: string;
  inicio: string;
  fin?: string | null;
  calendly_event_id: string | null;
}
