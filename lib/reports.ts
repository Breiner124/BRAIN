// ── Reportes y exportables (§13 Fase 3) — funciones puras ──────────
import type { Egreso, Ingreso } from "@/lib/types";

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function clave(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function etiqueta(d: Date): string {
  return `${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

function netoIngreso(i: Ingreso, margen: number): number {
  return i.es_facturacion ? i.monto * margen : i.monto;
}

export interface PuntoMensual {
  mes: string;
  consultoria: number;
  ecom: number;
  otros: number;
  ingreso: number;
  egreso: number;
  flujo: number;
}

/** Serie de los últimos `meses` meses (incluye el actual). */
export function serieMensual(
  ingresos: Ingreso[],
  egresos: Egreso[],
  margen: number,
  hoy = new Date(),
  meses = 6
): PuntoMensual[] {
  const buckets = new Map<string, PuntoMensual>();
  const orden: string[] = [];

  for (let k = meses - 1; k >= 0; k--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - k, 1);
    const c = clave(d);
    orden.push(c);
    buckets.set(c, {
      mes: etiqueta(d),
      consultoria: 0,
      ecom: 0,
      otros: 0,
      ingreso: 0,
      egreso: 0,
      flujo: 0,
    });
  }

  for (const i of ingresos) {
    const c = clave(new Date(i.fecha));
    const b = buckets.get(c);
    if (!b) continue;
    const neto = netoIngreso(i, margen);
    b[i.fuente] += neto;
    b.ingreso += neto;
  }
  for (const e of egresos) {
    const c = clave(new Date(e.fecha));
    const b = buckets.get(c);
    if (!b) continue;
    b.egreso += e.monto;
  }
  for (const c of orden) {
    const b = buckets.get(c)!;
    b.flujo = b.ingreso - b.egreso;
  }
  return orden.map((c) => buckets.get(c)!);
}

export interface TotalesReporte {
  ingreso_total: number;
  egreso_total: number;
  flujo_total: number;
  por_fuente: { consultoria: number; ecom: number; otros: number };
}

export function totalesReporte(serie: PuntoMensual[]): TotalesReporte {
  return serie.reduce<TotalesReporte>(
    (acc, p) => {
      acc.ingreso_total += p.ingreso;
      acc.egreso_total += p.egreso;
      acc.flujo_total += p.flujo;
      acc.por_fuente.consultoria += p.consultoria;
      acc.por_fuente.ecom += p.ecom;
      acc.por_fuente.otros += p.otros;
      return acc;
    },
    {
      ingreso_total: 0,
      egreso_total: 0,
      flujo_total: 0,
      por_fuente: { consultoria: 0, ecom: 0, otros: 0 },
    }
  );
}

// ── CSV ────────────────────────────────────────────────────────────
function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(filas: Record<string, unknown>[], columnas: string[]): string {
  const head = columnas.join(",");
  const body = filas
    .map((f) => columnas.map((c) => csvEscape(f[c])).join(","))
    .join("\n");
  return `${head}\n${body}`;
}

export function ingresosCSV(ingresos: Ingreso[]): string {
  return toCSV(
    ingresos as unknown as Record<string, unknown>[],
    ["fecha", "fuente", "descripcion", "monto", "es_facturacion", "origen_registro"]
  );
}

export function egresosCSV(egresos: Egreso[]): string {
  return toCSV(
    egresos as unknown as Record<string, unknown>[],
    ["fecha", "categoria", "descripcion", "monto", "fijo"]
  );
}
