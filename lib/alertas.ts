// ── Alertas / notificaciones derivadas del estado (§13 Fase 3) ─────
// No hay push infra: son señales calculadas del propio cerebro.
import {
  getDeudas,
  getMetas,
  motor,
  facturacionRealDiaria,
} from "@/lib/data/repository";
import { mesesRestantes } from "@/lib/engine";
import { formatCOPCompact } from "@/lib/format";

export type Severidad = "alta" | "media" | "info";

export interface Alerta {
  id: string;
  severidad: Severidad;
  titulo: string;
  detalle: string;
  href?: string;
}

export function construirAlertas(hoy = new Date()): Alerta[] {
  const alertas: Alerta[] = [];
  const m = motor(hoy);

  // 1. Semáforo maestro
  if (m.combinado.semaforo === "rojo") {
    alertas.push({
      id: "semaforo-rojo",
      severidad: "alta",
      titulo: "No cubres tus proyecciones",
      detalle: `Necesitas facturar ≥ ${formatCOPCompact(
        m.combinado.facturacion_diaria_para_proyecciones
      )}/día. Vas en ${formatCOPCompact(facturacionRealDiaria(hoy))}/día.`,
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
  for (const d of getDeudas()) {
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

  // 4. Excedente disponible (buena noticia)
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
