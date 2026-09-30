"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarPlus, Check, Clock, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import type { AmbitoTrabajo, Reunion, Semana, Tarea } from "@/lib/types";

const AMBITOS: { key: AmbitoTrabajo; label: string; color: string }[] = [
  { key: "consultoria", label: "Consultoría", color: "var(--c-yo)" },
  { key: "ecom", label: "E-com", color: "var(--c-ganancias)" },
  { key: "personal", label: "Personal", color: "var(--c-metas)" },
];

interface Props {
  semana: Semana;
  tareas: Tarea[];
  reuniones: Reunion[];
}

export function WeekBoard({ semana, tareas, reuniones }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [nuevaReunion, setNuevaReunion] = useState(false);
  const [nuevos, setNuevos] = useState<Record<string, string>>({});

  async function call(url: string, method: string, body?: object) {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
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

  async function agregarTarea(ambito: AmbitoTrabajo) {
    const titulo = (nuevos[ambito] ?? "").trim();
    if (!titulo) return;
    setNuevos((s) => ({ ...s, [ambito]: "" }));
    await call("/api/tareas", "POST", { ambito, titulo });
  }

  return (
    <>
      <Card className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-muted">Semana activa</p>
          <p className="text-lg font-bold text-fg">
            {semana.fecha_inicio} → {semana.fecha_fin}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNuevaReunion(true)}
            disabled={busy}
          >
            <CalendarPlus size={15} /> Reunión
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={busy}
            onClick={() => {
              if (confirm("¿Cerrar esta semana y arrastrar tareas pendientes?"))
                call("/api/semanas/nueva", "POST");
            }}
          >
            <RotateCcw size={15} /> Iniciar nueva semana
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {AMBITOS.map((a) => {
          const items = tareas.filter((t) => t.ambito === a.key);
          return (
            <Card key={a.key}>
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: a.color, boxShadow: `0 0 8px ${a.color}` }}
                />
                <p className="font-semibold text-fg">{a.label}</p>
                <span className="ml-auto text-xs text-muted">{items.length}</span>
              </div>

              <ul className="space-y-2">
                {items.map((t) => (
                  <li
                    key={t.id}
                    className={cn(
                      "rounded-lg border border-border bg-surface-2 p-2.5",
                      t.estado === "hecha" && "opacity-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm text-fg",
                          t.estado === "hecha" && "line-through"
                        )}
                      >
                        {t.titulo}
                      </p>
                      <div className="flex shrink-0 gap-1">
                        {t.estado !== "hecha" && (
                          <button
                            title="Marcar hecha"
                            onClick={() =>
                              call(`/api/tareas/${t.id}`, "PATCH", { estado: "hecha" })
                            }
                            className="rounded p-1 text-muted hover:bg-surface hover:text-ganancias"
                          >
                            <Check size={15} />
                          </button>
                        )}
                        {t.estado === "pendiente" && (
                          <button
                            title="Aplazar"
                            onClick={() =>
                              call(`/api/tareas/${t.id}`, "PATCH", { estado: "aplazada" })
                            }
                            className="rounded p-1 text-muted hover:bg-surface hover:text-metas"
                          >
                            <Clock size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {t.heredada && <Badge>⏮ Semana pasada</Badge>}
                      {t.estado === "aplazada" && <Badge>Aplazada</Badge>}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex gap-1.5">
                <Input
                  value={nuevos[a.key] ?? ""}
                  onChange={(e) =>
                    setNuevos((s) => ({ ...s, [a.key]: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && agregarTarea(a.key)}
                  placeholder="Nueva tarea…"
                  className="text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => agregarTarea(a.key)}
                  disabled={busy}
                >
                  <Plus size={15} />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-5">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Reuniones
        </p>
        {reuniones.length === 0 ? (
          <p className="text-sm text-muted">
            Sin reuniones. Agrega reuniones con clientes (consultoría) o mentores (e-com).
            La integración con Calendly llega en la Fase 3.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {[...reuniones]
              .sort((a, b) => +new Date(a.inicio) - +new Date(b.inicio))
              .map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">{r.titulo}</p>
                    <p className="text-xs text-muted">
                      {r.con_quien ? `con ${r.con_quien} · ` : ""}
                      {new Date(r.inicio).toLocaleString("es-CO")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Badge>{r.ambito}</Badge>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar la reunión "${r.titulo}"?`))
                          call(`/api/reuniones/${r.id}`, "DELETE");
                      }}
                      disabled={busy}
                      className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-danger disabled:opacity-50"
                      aria-label="Eliminar reunión"
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </Card>

      <ReunionModal
        open={nuevaReunion}
        onClose={() => setNuevaReunion(false)}
        onSave={(body) => call("/api/reuniones", "POST", body)}
      />
    </>
  );
}

function ReunionModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (body: object) => Promise<void>;
}) {
  const [ambito, setAmbito] = useState<"consultoria" | "ecom">("consultoria");
  const [titulo, setTitulo] = useState("");
  const [conQuien, setConQuien] = useState("");
  const [inicio, setInicio] = useState("");

  return (
    <Modal open={open} onClose={onClose} title="Nueva reunión">
      <div className="space-y-3">
        <Select value={ambito} onChange={(e) => setAmbito(e.target.value as "consultoria" | "ecom")}>
          <option value="consultoria">Consultoría (cliente)</option>
          <option value="ecom">E-com (mentor)</option>
        </Select>
        <Input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <Input placeholder="Con quién" value={conQuien} onChange={(e) => setConQuien(e.target.value)} />
        <Input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        <Button
          variant="primary"
          className="w-full"
          disabled={!titulo.trim() || !inicio}
          onClick={async () => {
            await onSave({
              ambito,
              titulo: titulo.trim(),
              con_quien: conQuien.trim() || undefined,
              inicio: new Date(inicio).toISOString(),
            });
            setTitulo("");
            setConQuien("");
            setInicio("");
            onClose();
          }}
        >
          Guardar reunión
        </Button>
      </div>
    </Modal>
  );
}
