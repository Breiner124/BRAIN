import { describe, it, expect } from "vitest";
import {
  calcularCruce,
  proyectarBolsillo,
  calcularOptimoProyecciones,
  calcularOptimoMetas,
  calcularOptimoCombinado,
  facturacionParaRentabilizar,
  recomendarExcedente,
  bolsilloDeEscenario,
  mesesRestantes,
  facturacionDiariaPromedio,
  correrMotor,
  type EngineInput,
} from "./index";
import type {
  Deuda,
  Egreso,
  Ingreso,
  Meta,
  Proyeccion,
  UnidadNegocio,
} from "@/lib/types";

const HOY = new Date("2026-09-30T00:00:00Z");

const unidades: UnidadNegocio[] = [
  { id: "u-ecom", slug: "ecom", nombre: "E-com", margen_neto: 0.15 },
  { id: "u-cons", slug: "consultoria", nombre: "Consultoría", margen_neto: null },
];

function baseInput(over: Partial<EngineInput> = {}): EngineInput {
  return {
    ingresos: [],
    egresos: [],
    deudas: [],
    proyecciones: [],
    metas: [],
    unidades,
    hoy: HOY,
    ...over,
  };
}

describe("mesesRestantes", () => {
  it("usa fallback cuando no hay fecha", () => {
    expect(mesesRestantes(HOY, null, 24)).toBe(24);
  });
  it("nunca es menor que 1", () => {
    expect(mesesRestantes(HOY, "2020-01-01")).toBe(1);
  });
  it("calcula meses futuros por redondeo hacia arriba", () => {
    // ~3 meses (90 días)
    expect(mesesRestantes(HOY, "2026-12-29")).toBe(3);
  });
});

describe("§6.2 calcularCruce", () => {
  it("aplica margen de unidad a facturación bruta y suma neto directo", () => {
    const ingresos: Ingreso[] = [
      {
        id: "1", unidad_id: "u-ecom", fuente: "ecom", descripcion: "venta",
        monto: 100_000_000, es_facturacion: true, fecha: "2026-09-01",
        recurrente: false, origen_registro: "ganancias",
      },
      {
        id: "2", unidad_id: "u-cons", fuente: "consultoria", descripcion: "cobro",
        monto: 3_000_000, es_facturacion: false, fecha: "2026-09-05",
        recurrente: false, origen_registro: "proy_consultoria",
      },
    ];
    const cruce = calcularCruce(baseInput({ ingresos }));
    // ecom: 100M * 0.15 = 15M ; consultoria: 3M neto directo
    expect(cruce.ingresos_por_fuente.ecom).toBe(15_000_000);
    expect(cruce.ingresos_por_fuente.consultoria).toBe(3_000_000);
    expect(cruce.ingreso_mensual).toBe(18_000_000);
  });

  it("separa egresos fijos y variables y calcula flujo neto", () => {
    const egresos: Egreso[] = [
      { id: "e1", unidad_id: null, categoria: "personal", descripcion: "arriendo", monto: 2_000_000, fecha: "2026-09-01", fijo: true },
      { id: "e2", unidad_id: null, categoria: "operativo", descripcion: "ads", monto: 5_000_000, fecha: "2026-09-02", fijo: false },
    ];
    const ingresos: Ingreso[] = [
      { id: "i1", unidad_id: null, fuente: "otros", descripcion: "x", monto: 10_000_000, es_facturacion: false, fecha: "2026-09-01", recurrente: false, origen_registro: "ganancias" },
    ];
    const cruce = calcularCruce(baseInput({ ingresos, egresos }));
    expect(cruce.egreso_fijo).toBe(2_000_000);
    expect(cruce.egreso_variable).toBe(5_000_000);
    expect(cruce.egreso_total).toBe(7_000_000);
    expect(cruce.flujo_neto).toBe(3_000_000);
  });

  it("usa margen del perfil si la facturación no trae unidad con margen", () => {
    const ingresos: Ingreso[] = [
      { id: "1", unidad_id: null, fuente: "otros", descripcion: "fact", monto: 100_000_000, es_facturacion: true, fecha: "2026-09-01", recurrente: false, origen_registro: "ganancias" },
    ];
    const cruce = calcularCruce(baseInput({ ingresos, config: { margen_neto_bolsillo: 0.2 } }));
    expect(cruce.ingreso_mensual).toBe(20_000_000);
  });
});

describe("§6.3 bolsillo empresarial", () => {
  it("bolsilloDeEscenario = facturación * margen", () => {
    expect(bolsilloDeEscenario(115_000_000, 0.15)).toBe(17_250_000);
  });
  it("proyectarBolsillo suma escenario + consultoría + otros", () => {
    const ingresos: Ingreso[] = [
      { id: "c", unidad_id: "u-cons", fuente: "consultoria", descripcion: "x", monto: 4_000_000, es_facturacion: false, fecha: "2026-09-01", recurrente: false, origen_registro: "ganancias" },
      { id: "o", unidad_id: null, fuente: "otros", descripcion: "y", monto: 1_000_000, es_facturacion: false, fecha: "2026-09-01", recurrente: false, origen_registro: "ganancias" },
    ];
    const bolsillo = proyectarBolsillo(
      baseInput({
        ingresos,
        escenarioElegido: { clave: "medio", nombre: "Medio", facturacion_mes: 115_000_000 },
      })
    );
    expect(bolsillo.bolsillo_ecom).toBe(17_250_000);
    expect(bolsillo.ingresos_consultoria).toBe(4_000_000);
    expect(bolsillo.otros).toBe(1_000_000);
    expect(bolsillo.bolsillo_total).toBe(22_250_000);
  });
});

describe("§6.4 óptimo proyecciones + deudas", () => {
  it("prorratea deuda por meses hasta fecha límite", () => {
    const deudas: Deuda[] = [
      { id: "d1", nombre: "Computador", categoria: "credito_fijo", nivel_importancia: 3, monto_original: 150_000, saldo_actual: 150_000, fecha_limite: "2026-12-29", estado: "activa" },
    ];
    const r = calcularOptimoProyecciones(baseInput({ deudas }));
    // 150.000 / 3 meses = 50.000
    expect(r.servicio_deudas_mes).toBe(50_000);
  });

  it("incluye egreso fijo y costo prorrateado de proyección empresarial", () => {
    const egresos: Egreso[] = [
      { id: "e", unidad_id: null, categoria: "personal", descripcion: "fijo", monto: 1_000_000, fecha: "2026-09-01", fijo: true },
    ];
    const proyecciones: Proyeccion[] = [
      { id: "p", ambito: "empresarial", unidad_id: "u-ecom", nombre: "Logística", tipo: "expansion", costo_estimado: 12_000_000, costo_recurrente: 2_000_000, fecha_objetivo: "2026-12-29", fecha_tipo: "variable", estado: "pendiente" },
    ];
    const r = calcularOptimoProyecciones(baseInput({ egresos, proyecciones }));
    // egreso fijo 1M + costo 12M/3 = 4M ; pendiente no suma recurrente
    expect(r.costo_proy_mes).toBe(4_000_000);
    expect(r.optimo_proyecciones).toBe(5_000_000);
    // facturación diaria = 5M / 0.15 / 30
    expect(Math.round(r.facturacion_diaria_para_proyecciones)).toBe(1_111_111);
  });

  it("proyección en progreso agrega su costo recurrente", () => {
    const proyecciones: Proyeccion[] = [
      { id: "p", ambito: "empresarial", unidad_id: "u-ecom", nombre: "Logística", tipo: "expansion", costo_estimado: 0, costo_recurrente: 2_000_000, fecha_objetivo: null, fecha_tipo: "variable", estado: "en_progreso" },
    ];
    const r = calcularOptimoProyecciones(baseInput({ proyecciones }));
    expect(r.costo_proy_mes).toBe(2_000_000);
  });
});

describe("§6.5 óptimo metas", () => {
  it("aporte mensual = restante / meses restantes", () => {
    const metas: Meta[] = [
      { id: "m", nombre: "Navidad", categoria: "festividad", costo_objetivo: 6_000_000, ahorrado: 0, fecha_objetivo: "2026-12-29", fecha_tipo: "fija", prioridad: 1 },
    ];
    const r = calcularOptimoMetas(baseInput({ metas }));
    // 6M / 3 meses = 2M
    expect(r.optimo_metas).toBe(2_000_000);
  });
  it("ignora metas ya cumplidas", () => {
    const metas: Meta[] = [
      { id: "m", nombre: "Ya", categoria: "otro", costo_objetivo: 1_000_000, ahorrado: 1_000_000, fecha_objetivo: "2026-12-29", fecha_tipo: "fija", prioridad: 1 },
    ];
    const r = calcularOptimoMetas(baseInput({ metas }));
    expect(r.optimo_metas).toBe(0);
    expect(r.aportes.length).toBe(0);
  });
});

describe("§6.6 semáforo", () => {
  const metas: Meta[] = [
    { id: "m", nombre: "Meta", categoria: "otro", costo_objetivo: 9_000_000, ahorrado: 0, fecha_objetivo: "2026-12-29", fecha_tipo: "fija", prioridad: 1 },
  ];
  const egresos: Egreso[] = [
    { id: "e", unidad_id: null, categoria: "personal", descripcion: "fijo", monto: 1_350_000, fecha: "2026-09-01", fijo: true },
  ];
  // proyecciones: 1.35M/0.15/30 = 300.000/día ; metas: 3M/0.15/30 ≈ 666.667/día
  it("🟢 verde cuando real ≥ ideal", () => {
    const r = calcularOptimoCombinado(baseInput({ metas, egresos }), 2_000_000);
    expect(r.semaforo).toBe("verde");
  });
  it("🟡 amarillo cuando cubre proyecciones pero no metas", () => {
    const r = calcularOptimoCombinado(baseInput({ metas, egresos }), 400_000);
    expect(r.semaforo).toBe("amarillo");
  });
  it("🔴 rojo cuando no cubre proyecciones", () => {
    const r = calcularOptimoCombinado(baseInput({ metas, egresos }), 100_000);
    expect(r.semaforo).toBe("rojo");
  });
});

describe("§6.7 ROI de expansión", () => {
  it("logística $2M/mes ÷ 0.15 ≈ $13.333.333", () => {
    expect(Math.round(facturacionParaRentabilizar(2_000_000, 0.15))).toBe(13_333_333);
  });
});

describe("§6.8 recomendador de excedente", () => {
  it("no sugiere nada si no hay excedente", () => {
    const r = recomendarExcedente(baseInput(), 1_000_000, 2_000_000);
    expect(r.hay_excedente).toBe(false);
    expect(r.sugerencias).toHaveLength(0);
  });
  it("reparte excedente en 40/30/20/10 por defecto", () => {
    const r = recomendarExcedente(baseInput(), 5_000_000, 1_000_000);
    expect(r.excedente).toBe(4_000_000);
    expect(r.sugerencias.map((s) => s.monto)).toEqual([
      1_600_000, 1_200_000, 800_000, 400_000,
    ]);
  });
});

describe("facturacionDiariaPromedio", () => {
  it("promedia solo facturación bruta sobre el periodo", () => {
    const ingresos: Ingreso[] = [
      { id: "1", unidad_id: "u-ecom", fuente: "ecom", descripcion: "x", monto: 90_000_000, es_facturacion: true, fecha: "2026-09-01", recurrente: false, origen_registro: "ganancias" },
      { id: "2", unidad_id: null, fuente: "otros", descripcion: "neto", monto: 5_000_000, es_facturacion: false, fecha: "2026-09-01", recurrente: false, origen_registro: "ganancias" },
    ];
    expect(facturacionDiariaPromedio(ingresos, 30)).toBe(3_000_000);
  });
});

describe("correrMotor (integración)", () => {
  it("devuelve todas las secciones sin lanzar", () => {
    const r = correrMotor(baseInput(), 0);
    expect(r).toHaveProperty("cruce");
    expect(r).toHaveProperty("bolsillo");
    expect(r).toHaveProperty("optimo_proyecciones");
    expect(r).toHaveProperty("optimo_metas");
    expect(r).toHaveProperty("combinado");
    expect(r).toHaveProperty("recomendacion");
    expect(r.combinado.semaforo).toBe("verde"); // sin óptimos, ideal=0
  });
});
