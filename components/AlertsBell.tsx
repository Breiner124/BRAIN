"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Alerta, Severidad } from "@/lib/alertas";

const COLOR: Record<Severidad, string> = {
  alta: "var(--c-danger)",
  media: "var(--c-warn)",
  info: "var(--c-yo)",
};

export function AlertsBell() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let vivo = true;
    fetch("/api/alertas")
      .then((r) => r.json())
      .then((j) => vivo && j.ok && setAlertas(j.data))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  const urgentes = alertas.filter((a) => a.severidad !== "info").length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="relative rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg"
        aria-label="Notificaciones"
      >
        <Bell size={18} />
        {alertas.length > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-black"
            style={{ background: urgentes ? "var(--c-danger)" : "var(--c-yo)" }}
          >
            {alertas.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="scroll-thin absolute right-0 z-50 mt-2 max-h-[70vh] w-80 overflow-y-auto rounded-2xl border border-border bg-surface p-2 neural-glow"
          >
            <p className="px-2 py-1.5 text-xs font-semibold uppercase text-muted">
              Notificaciones del cerebro
            </p>
            {alertas.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted">
                Todo en orden. Sin alertas por ahora. ✨
              </p>
            ) : (
              <ul className="space-y-1">
                {alertas.map((a) => {
                  const cuerpo = (
                    <div className="rounded-xl p-2.5 hover:bg-surface-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: COLOR[a.severidad] }}
                        />
                        <p className="text-sm font-semibold text-fg">{a.titulo}</p>
                      </div>
                      <p className="mt-0.5 pl-4 text-xs text-muted">{a.detalle}</p>
                    </div>
                  );
                  return (
                    <li key={a.id}>
                      {a.href ? (
                        <Link href={a.href} onClick={() => setAbierto(false)}>
                          {cuerpo}
                        </Link>
                      ) : (
                        cuerpo
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
