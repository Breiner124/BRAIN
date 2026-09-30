// ── Contratos de entrada compartidos por ambos backends ────────────
import type { Egreso, FuenteIngreso, OrigenRegistro, Proyeccion, Reunion, Tarea } from "@/lib/types";

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
