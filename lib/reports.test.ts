import { describe, it, expect } from "vitest";
import {
  serieMensual,
  totalesReporte,
  ingresosCSV,
  egresosCSV,
} from "@/lib/reports";
import type { Egreso, Ingreso } from "@/lib/types";

const HOY = new Date("2026-09-15T00:00:00Z");

const ingresos: Ingreso[] = [
  { id: "1", unidad_id: null, fuente: "ecom", descripcion: "venta", monto: 100_000_000, es_facturacion: true, fecha: "2026-09-05", recurrente: false, origen_registro: "ganancias" },
  { id: "2", unidad_id: null, fuente: "consultoria", descripcion: "cobro", monto: 3_000_000, es_facturacion: false, fecha: "2026-09-10", recurrente: false, origen_registro: "ganancias" },
  { id: "3", unidad_id: null, fuente: "otros", descripcion: "viejo", monto: 1_000_000, es_facturacion: false, fecha: "2026-04-01", recurrente: false, origen_registro: "ganancias" },
];
const egresos: Egreso[] = [
  { id: "e1", unidad_id: null, categoria: "operativo", descripcion: "ads", monto: 5_000_000, fecha: "2026-09-08", fijo: false },
];

describe("serieMensual", () => {
  it("genera 6 meses e imputa netos con margen a facturación", () => {
    const serie = serieMensual(ingresos, egresos, 0.15, HOY, 6);
    expect(serie).toHaveLength(6);
    const sep = serie[serie.length - 1];
    expect(sep.mes.startsWith("Sep")).toBe(true);
    // ecom facturación: 100M * 0.15 = 15M
    expect(sep.ecom).toBe(15_000_000);
    expect(sep.consultoria).toBe(3_000_000);
    expect(sep.ingreso).toBe(18_000_000);
    expect(sep.egreso).toBe(5_000_000);
    expect(sep.flujo).toBe(13_000_000);
  });

  it("ignora movimientos fuera de la ventana", () => {
    const serie = serieMensual(ingresos, egresos, 0.15, HOY, 3);
    const total = serie.reduce((s, p) => s + p.otros, 0);
    expect(total).toBe(0); // el de abril queda fuera de los últimos 3 meses
  });
});

describe("totalesReporte", () => {
  it("suma la serie", () => {
    const serie = serieMensual(ingresos, egresos, 0.15, HOY, 6);
    const t = totalesReporte(serie);
    expect(t.ingreso_total).toBe(19_000_000); // 18M sep + 1M abr
    expect(t.egreso_total).toBe(5_000_000);
    expect(t.flujo_total).toBe(14_000_000);
  });
});

describe("CSV", () => {
  it("ingresosCSV tiene cabecera y escapa comas", () => {
    const csv = ingresosCSV([
      { id: "1", unidad_id: null, fuente: "otros", descripcion: "a, b", monto: 100, es_facturacion: false, fecha: "2026-09-01", recurrente: false, origen_registro: "ganancias" },
    ]);
    const [head, fila] = csv.split("\n");
    expect(head).toBe("fecha,fuente,descripcion,monto,es_facturacion,origen_registro");
    expect(fila).toContain('"a, b"');
  });
  it("egresosCSV incluye columnas base", () => {
    const csv = egresosCSV(egresos);
    expect(csv.split("\n")[0]).toBe("fecha,categoria,descripcion,monto,fijo");
  });
});
