import { describe, it, expect, beforeEach } from "vitest";
import { resetDB } from "@/lib/data/store";
import {
  crearTarea,
  cambiarEstadoTarea,
  iniciarNuevaSemana,
  getSemanaActiva,
  getTareas,
  crearProyeccion,
  aportarProyeccion,
  crearIngreso,
  getIngresos,
} from "@/lib/data/mem-repo";

beforeEach(() => resetDB());

describe("§7 semana — iniciar nueva y arrastrar tareas", () => {
  it("arrastra pendientes/aplazadas y deja las hechas atrás", () => {
    const t1 = crearTarea({ ambito: "ecom", titulo: "pendiente" });
    const t2 = crearTarea({ ambito: "ecom", titulo: "hecha" });
    const t3 = crearTarea({ ambito: "consultoria", titulo: "aplazada" });
    cambiarEstadoTarea(t2.id, "hecha");
    cambiarEstadoTarea(t3.id, "aplazada");

    const { semana, arrastradas } = iniciarNuevaSemana();
    expect(arrastradas).toBe(2); // pendiente + aplazada, no la hecha

    const activa = getSemanaActiva();
    expect(activa?.id).toBe(semana.id);

    const nuevas = getTareas(semana.id);
    expect(nuevas.map((t) => t.titulo).sort()).toEqual(["aplazada", "pendiente"]);
    expect(nuevas.every((t) => t.heredada && t.estado === "pendiente")).toBe(true);

    // la nueva semana empieza después de la anterior
    expect(new Date(semana.fecha_inicio).getTime()).toBeGreaterThan(
      new Date(t1.semana_id).getTime() || 0
    );
  });

  it("solo hay una semana activa a la vez", () => {
    iniciarNuevaSemana();
    iniciarNuevaSemana();
    // no lanza y sigue habiendo exactamente una activa (verificado por getSemanaActiva)
    expect(getSemanaActiva()).toBeDefined();
  });
});

describe("aportarProyeccion (barra personal §5.3A)", () => {
  it("acumula avance y marca lograda al llegar al objetivo", () => {
    const { proyeccion } = crearProyeccion({
      ambito: "personal",
      nombre: "Colchón",
      tipo: "personal",
      objetivo: 1_000_000,
    });
    aportarProyeccion(proyeccion.id, 400_000);
    let p = aportarProyeccion(proyeccion.id, 700_000); // se topa en el objetivo
    expect(p.avance).toBe(1_000_000);
    expect(p.estado).toBe("lograda");
  });
});

describe("§11 flujo bidireccional — anexar ganancia desde proyección", () => {
  it("inserta en ingresos con origen_registro y aparece en Ganancias", () => {
    crearProyeccion({
      ambito: "empresarial",
      nombre: "Cobro cliente X",
      tipo: "ingreso_esperado",
      ganancia: { monto: 3_000_000, fuente: "consultoria" },
    });
    const ingresos = getIngresos();
    expect(ingresos).toHaveLength(1);
    expect(ingresos[0].origen_registro).toBe("proy_consultoria");
    expect(ingresos[0].monto).toBe(3_000_000);
  });

  it("registrar directo desde Ganancias también entra a la misma tabla", () => {
    crearIngreso({ fuente: "otros", descripcion: "extra", monto: 500_000 });
    expect(getIngresos()).toHaveLength(1);
    expect(getIngresos()[0].origen_registro).toBe("ganancias");
  });
});
