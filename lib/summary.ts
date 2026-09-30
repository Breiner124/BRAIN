// ── Resumen para el Nodo Central y los peeks (§5.1) ────────────────
import {
  getDeudas,
  getMetas,
  getProyecciones,
  getIngresos,
  motor,
  facturacionRealDiaria,
} from "@/lib/data/repository";
import type { Semaforo } from "@/lib/engine";

export interface ResumenNodo {
  ganancias: {
    total_mes: number;
    mes_anterior: number;
    variacion: number; // fracción (+/-)
    por_fuente: Record<string, number>;
  };
  proyecciones: {
    pendientes: number;
    en_progreso: number;
    logradas: number;
    facturacion_esperada: number;
    bolsillo_estimado: number;
  };
  metas: {
    total: number;
    logrado_global: number;
    objetivo_global: number;
    mas_cercana?: { nombre: string; fecha?: string | null; pct: number };
  };
  deudas: {
    saldo_total: number;
    activas: number;
    principal?: { nombre: string; saldo: number };
  };
  maestro: {
    facturacion_real_diaria: number;
    facturacion_diaria_ideal: number;
    semaforo: Semaforo;
  };
}

function mismoMes(fechaISO: string, ref: Date): boolean {
  const d = new Date(fechaISO);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

function netoIngreso(monto: number, esFact: boolean, margen: number): number {
  return esFact ? monto * margen : monto;
}

export function construirResumen(hoy = new Date()): ResumenNodo {
  const m = motor(hoy);
  const ingresos = getIngresos();
  const deudas = getDeudas();
  const metas = getMetas();
  const proyecciones = getProyecciones();
  const margen = m.cruce.ingreso_mensual >= 0 ? 0.15 : 0.15; // margen perfil (demo)

  // Ganancias del mes vs anterior
  const mesAnteriorRef = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 15);
  const total_mes = ingresos
    .filter((i) => mismoMes(i.fecha, hoy))
    .reduce((s, i) => s + netoIngreso(i.monto, i.es_facturacion, margen), 0);
  const mes_anterior = ingresos
    .filter((i) => mismoMes(i.fecha, mesAnteriorRef))
    .reduce((s, i) => s + netoIngreso(i.monto, i.es_facturacion, margen), 0);
  const variacion = mes_anterior > 0 ? (total_mes - mes_anterior) / mes_anterior : 0;

  // Proyecciones
  const emp = proyecciones.filter((p) => p.ambito === "empresarial");
  const facturacion_esperada = emp.reduce(
    (s, p) => s + (p.facturacion_esperada ?? 0),
    0
  );

  // Metas
  const objetivo_global = metas.reduce((s, x) => s + x.costo_objetivo, 0);
  const logrado_global = metas.reduce((s, x) => s + x.ahorrado, 0);
  const conFecha = metas
    .filter((x) => x.fecha_objetivo && x.ahorrado < x.costo_objetivo)
    .sort((a, b) => +new Date(a.fecha_objetivo!) - +new Date(b.fecha_objetivo!));
  const cercana = conFecha[0];

  // Deudas
  const activas = deudas.filter((d) => d.estado === "activa");
  const saldo_total = activas.reduce((s, d) => s + d.saldo_actual, 0);
  const principal = [...activas].sort(
    (a, b) => a.nivel_importancia - b.nivel_importancia
  )[0];

  return {
    ganancias: {
      total_mes,
      mes_anterior,
      variacion,
      por_fuente: m.cruce.ingresos_por_fuente,
    },
    proyecciones: {
      pendientes: proyecciones.filter((p) => p.estado === "pendiente").length,
      en_progreso: proyecciones.filter((p) => p.estado === "en_progreso").length,
      logradas: proyecciones.filter((p) => p.estado === "lograda").length,
      facturacion_esperada,
      bolsillo_estimado: m.bolsillo.bolsillo_total,
    },
    metas: {
      total: metas.length,
      logrado_global,
      objetivo_global,
      mas_cercana: cercana
        ? {
            nombre: cercana.nombre,
            fecha: cercana.fecha_objetivo,
            pct:
              cercana.costo_objetivo > 0
                ? cercana.ahorrado / cercana.costo_objetivo
                : 0,
          }
        : undefined,
    },
    deudas: {
      saldo_total,
      activas: activas.length,
      principal: principal
        ? { nombre: principal.nombre, saldo: principal.saldo_actual }
        : undefined,
    },
    maestro: {
      facturacion_real_diaria: facturacionRealDiaria(hoy),
      facturacion_diaria_ideal: m.combinado.facturacion_diaria_ideal,
      semaforo: m.combinado.semaforo,
    },
  };
}
