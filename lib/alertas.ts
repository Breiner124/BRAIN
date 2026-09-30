// ── Alertas / notificaciones derivadas del estado (§13 Fase 3) ─────
// No hay push infra: son señales calculadas del propio cerebro.
import { getDeudas, getTesteos, motor, facturacionRealDiaria } from "@/lib/data/repository";
import { mesesRestantes } from "@/lib/engine";
import { formatCOPCompact } from "@/lib/format";

function diasHasta(hoy: Date, fecha?: string | null): number | null {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - hoy.getTime()) / 86400000);
}

export type Severidad = "alta" | "media" | "info";

export interface Alerta {
  id: string;
  severidad: Severidad;
  titulo: string;
  detalle: string;
  href?: string;
}

export async function construirAlertas(hoy = new Date()): Promise<Alerta[]> {
  const alertas: Alerta[] = [];
  const [m, deudas, factReal, testeos] = await Promise.all([
    motor(hoy),
    getDeudas(),
    facturacionRealDiaria(hoy),
    getTesteos(),
  ]);

  // 1. Semáforo maestro
  if (m.combinado.semaforo === "rojo") {
    alertas.push({
      id: "semaforo-rojo",
      severidad: "alta",
      titulo: "No cubres tus proyecciones",
      detalle: `Necesitas facturar ≥ ${formatCOPCompact(
        m.combinado.facturacion_diaria_para_proyecciones
      )}/día. Vas en ${formatCOPCompact(factReal)}/día.`,
      href: "/nodo/ganancias",
    });
  } else if (m.combinado.semaforo === "amarillo") {
    alertas.push({
      id: "semaforo-amarillo",
      severidad: "media",
      titulo: "Cubres proyecciones, pero no metas",
      detalle: `Para cubrir también las metas apunta a ${formatCOPCompact(
        m.combinado.facturacion_diaria_ideal
      )}/día.`,
      href: "/nodo/metas",
    });
  }

  // 2. Deudas con fecha límite próxima (≤ 30 días) o activas de alta importancia
  for (const d of deudas) {
    if (d.estado !== "activa" || d.saldo_actual <= 0) continue;
    if (d.fecha_limite) {
      const meses = mesesRestantes(hoy, d.fecha_limite, 99);
      const dias = (new Date(d.fecha_limite).getTime() - hoy.getTime()) / 86400000;
      if (dias <= 30) {
        alertas.push({
          id: `deuda-${d.id}`,
          severidad: dias <= 7 ? "alta" : "media",
          titulo: `Deuda por vencer: ${d.nombre}`,
          detalle: `Saldo ${formatCOPCompact(d.saldo_actual)} · vence ${d.fecha_limite}${
            meses <= 1 ? " (este mes)" : ""
          }.`,
          href: "/nodo/deudas",
        });
      }
    }
  }

  // 3. Metas atrasadas: aporte requerido supera holgadamente el flujo neto
  for (const a of m.optimo_metas.aportes) {
    if (a.meses_restantes <= 2 && a.restante > 0) {
      alertas.push({
        id: `meta-${a.meta_id}`,
        severidad: "media",
        titulo: `Meta cerca: ${a.nombre}`,
        detalle: `Faltan ${formatCOPCompact(a.restante)} en ${a.meses_restantes} mes(es) → ${formatCOPCompact(
          a.aporte_mensual
        )}/mes.`,
        href: "/nodo/metas",
      });
    }
  }

  // 4. Programación semanal: inicio de testeo y cuellos de botella
  const hoyISO = hoy.toISOString().slice(0, 10);
  for (const t of testeos) {
    if (t.estado === "hecho" || t.estado === "descartado") continue;

    // Día de iniciar el testeo (ads programados)
    if (t.fecha_testeo) {
      const d = diasHasta(hoy, t.fecha_testeo);
      const pendientes = (t.pasos ?? []).filter((p) => !p.hecho).length;
      if (t.fecha_testeo === hoyISO) {
        alertas.push({
          id: `testeo-hoy-${t.id}`,
          severidad: "alta",
          titulo: `Hoy toca iniciar: ${t.producto}`,
          detalle: `Empieza el desarrollo: descargar ads, investigación de mercado, landing y montaje de campañas.${
            pendientes ? ` Te faltan ${pendientes} paso(s).` : ""
          }`,
          href: "/nodo/testeos",
        });
      } else if (d !== null && d > 0 && d <= 2) {
        alertas.push({
          id: `testeo-pronto-${t.id}`,
          severidad: "media",
          titulo: `En ${d} día(s): testeo de ${t.producto}`,
          detalle: `Prepara ads, investigación, landing y campañas antes del ${t.fecha_testeo}.`,
          href: "/nodo/testeos",
        });
      }
    }

    // Cuello de botella con fecha de corrección
    if (t.cuello_botella && t.fecha_correccion) {
      const d = diasHasta(hoy, t.fecha_correccion);
      if (d !== null && d <= 7) {
        alertas.push({
          id: `cuello-${t.id}`,
          severidad: d <= 1 ? "alta" : "media",
          titulo: `Cuello de botella: ${t.producto}`,
          detalle: `${t.cuello_botella} · corregir antes del ${t.fecha_correccion}${
            d < 0 ? " (¡vencido!)" : d === 0 ? " (hoy)" : ` (${d} día(s))`
          }.`,
          href: "/nodo/testeos",
        });
      }
    }
  }

  // 5. Excedente disponible (buena noticia)
  if (m.recomendacion.hay_excedente) {
    alertas.push({
      id: "excedente",
      severidad: "info",
      titulo: "Tienes excedente para asignar",
      detalle: `${formatCOPCompact(
        m.recomendacion.excedente
      )} libres sobre tus óptimos. Revisa el recomendador.`,
      href: "/nodo/ganancias",
    });
  }

  const peso: Record<Severidad, number> = { alta: 0, media: 1, info: 2 };
  return alertas.sort((x, y) => peso[x.severidad] - peso[y.severidad]);
}
