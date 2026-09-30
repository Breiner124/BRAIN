"use client";
import { useEffect } from "react";

// Dispara una notificación del navegador el día en que se programan los ads,
// a partir de las 10:00 AM, recordando iniciar el desarrollo del testeo.
// Solo funciona con la app abierta (una pestaña). La campana del cerebro
// muestra el mismo aviso siempre.
const HORA_AVISO = 10; // 10 AM

interface TesteoLite {
  id: string;
  producto: string;
  fecha_testeo?: string | null;
  estado: string;
}

function yaAvisado(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}
function marcarAvisado(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

async function revisar() {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    const res = await fetch("/api/testeos");
    const json = await res.json();
    if (!json.ok) return;
    const hoy = new Date();
    const hoyISO = hoy.toISOString().slice(0, 10);
    if (hoy.getHours() < HORA_AVISO) return;

    for (const t of json.data as TesteoLite[]) {
      if (t.estado === "hecho" || t.estado === "descartado") continue;
      if (t.fecha_testeo !== hoyISO) continue;
      const key = `notif-testeo-${t.id}-${hoyISO}`;
      if (yaAvisado(key)) continue;
      new Notification(`🧪 Hoy toca iniciar: ${t.producto}`, {
        body: "Empieza el desarrollo: descargar ads, investigación de mercado, landing y montaje de campañas.",
        tag: key,
      });
      marcarAvisado(key);
    }
  } catch {
    /* red no disponible */
  }
}

export function TesteoNotifier() {
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    revisar();
    // Re-revisa cada 5 minutos mientras la app está abierta (p.ej. cruza las 10 AM).
    const id = setInterval(revisar, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return null;
}
