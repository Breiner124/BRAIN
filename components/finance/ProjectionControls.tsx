"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Select } from "@/components/ui/Input";
import type { Proyeccion } from "@/lib/types";

export function ProjectionControls({ p }: { p: Proyeccion }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function cambiarEstado(estado: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/proyecciones/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Error");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function eliminar() {
    if (!confirm(`¿Eliminar la proyección "${p.nombre}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/proyecciones/${p.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Error");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={p.estado}
        disabled={busy}
        onChange={(e) => cambiarEstado(e.target.value)}
        className="w-auto px-2 py-1 text-xs"
        aria-label="Estado de la proyección"
      >
        <option value="pendiente">Pendiente</option>
        <option value="en_progreso">En progreso</option>
        <option value="lograda">Lograda</option>
      </Select>
      <button
        onClick={eliminar}
        disabled={busy}
        className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-danger disabled:opacity-50"
        aria-label="Eliminar proyección"
        title="Eliminar"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
