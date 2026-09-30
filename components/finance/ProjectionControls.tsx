"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { Proyeccion } from "@/lib/types";

export function ProjectionControls({ p }: { p: Proyeccion }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editar, setEditar] = useState(false);
  const [fecha, setFecha] = useState(p.fecha_objetivo ?? "");
  const [fechaTipo, setFechaTipo] = useState(p.fecha_tipo);
  const [notas, setNotas] = useState(
    (p.detalle?.notas as string | undefined) ?? ""
  );
  const [error, setError] = useState<string | null>(null);

  async function patch(body: object) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/proyecciones/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Error");
      setEditar(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
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
    <div className="flex items-center gap-1.5">
      <Select
        value={p.estado}
        disabled={busy}
        onChange={(e) => patch({ estado: e.target.value })}
        className="w-auto px-2 py-1 text-xs"
        aria-label="Estado de la proyección"
      >
        <option value="pendiente">Pendiente</option>
        <option value="en_progreso">En progreso</option>
        <option value="lograda">Lograda</option>
      </Select>
      <button
        onClick={() => setEditar(true)}
        disabled={busy}
        className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-proyecciones disabled:opacity-50"
        aria-label="Editar fecha y notas"
        title="Editar / reprogramar / notas"
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={eliminar}
        disabled={busy}
        className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-danger disabled:opacity-50"
        aria-label="Eliminar proyección"
        title="Eliminar"
      >
        <Trash2 size={15} />
      </button>

      <Modal open={editar} onClose={() => setEditar(false)} title={`Editar: ${p.nombre}`}>
        <div className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha objetivo (reprogramar)</Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div>
              <Label>Tipo de fecha</Label>
              <Select
                value={fechaTipo}
                onChange={(e) => setFechaTipo(e.target.value as "fija" | "variable")}
              >
                <option value="variable">Variable</option>
                <option value="fija">Fija</option>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notas (ve anexando lo que va aconteciendo)</Label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={5}
              placeholder="Ej: 15/oct cotización pedida · 20/oct proveedor confirmó · falta anticipo…"
              className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none placeholder:text-muted focus:border-proyecciones"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button
            className="w-full"
            disabled={busy}
            onClick={() =>
              patch({ fecha_objetivo: fecha || null, fecha_tipo: fechaTipo, notas })
            }
          >
            {busy ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
