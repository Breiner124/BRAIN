"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarClock,
  Check,
  FlaskConical,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { formatCOP } from "@/lib/format";
import type { CategoriaNota, EstadoTesteo, Nota, Testeo } from "@/lib/types";

const num = (s: string) => Number(s.replace(/\D/g, ""));

const ESTADO_TESTEO: Record<EstadoTesteo, { label: string; color: string }> = {
  planificado: { label: "Planificado", color: "var(--muted)" },
  en_curso: { label: "En curso", color: "var(--c-warn)" },
  hecho: { label: "Hecho", color: "var(--c-ok)" },
  descartado: { label: "Descartado", color: "var(--c-danger)" },
};

const CAT_NOTA: Record<CategoriaNota, { label: string; color: string }> = {
  mentoria: { label: "Mentoría", color: "var(--c-yo)" },
  tarea: { label: "Tarea", color: "var(--c-metas)" },
  idea: { label: "Idea", color: "var(--c-testeos)" },
  general: { label: "General", color: "var(--muted)" },
};

export function TesteosBoard({
  testeos,
  notas,
}: {
  testeos: Testeo[];
  notas: Nota[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

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

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <FlaskConical size={18} className="text-testeos" />
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">
              Programar testeo
            </p>
          </div>
          <NuevoTesteoForm onCreate={(b) => call("/api/testeos", "POST", b)} busy={busy} />
        </Card>

        {testeos.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">
              Aún no hay testeos. Programa el primero (producto + cuándo testearlo).
            </p>
          </Card>
        ) : (
          testeos.map((t) => (
            <TesteoCard key={t.id} t={t} call={call} busy={busy} />
          ))
        )}
      </div>

      <div className="space-y-5">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <StickyNote size={18} className="text-testeos" />
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">
              Bloc de notas (mentores · ideas · tareas)
            </p>
          </div>
          <NuevaNotaForm onCreate={(b) => call("/api/notas", "POST", b)} busy={busy} />
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Historial de notas
          </p>
          {notas.length === 0 ? (
            <p className="text-sm text-muted">
              Aquí se van acumulando tus notas con fecha. Anota lo que te dicen tus
              mentores, ideas y tareas fundamentales.
            </p>
          ) : (
            <ul className="space-y-3">
              {notas.map((n) => (
                <NotaItem key={n.id} n={n} call={call} busy={busy} />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

// ── Formulario nuevo testeo ────────────────────────────────────────
function NuevoTesteoForm({
  onCreate,
  busy,
}: {
  onCreate: (b: object) => void;
  busy: boolean;
}) {
  const [producto, setProducto] = useState("");
  const [fecha, setFecha] = useState("");
  const [hipotesis, setHipotesis] = useState("");
  const [prioridad, setPrioridad] = useState("3");
  const [presupuesto, setPresupuesto] = useState("");

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!producto.trim()) return;
    onCreate({
      producto: producto.trim(),
      fecha_testeo: fecha || null,
      hipotesis: hipotesis.trim() || null,
      prioridad: Number(prioridad),
      presupuesto: num(presupuesto) || null,
    });
    setProducto("");
    setFecha("");
    setHipotesis("");
    setPresupuesto("");
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      <div>
        <Label>Producto</Label>
        <Input
          value={producto}
          onChange={(e) => setProducto(e.target.value)}
          placeholder="Ej: Faja reductora, Serum facial…"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>¿Cuándo testear?</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div>
          <Label>Prioridad</Label>
          <Select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "(máxima)" : ""}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label>Hipótesis (qué quieres validar)</Label>
        <Input
          value={hipotesis}
          onChange={(e) => setHipotesis(e.target.value)}
          placeholder="Ej: CPA < $30k con ángulo de dolor de espalda"
        />
      </div>
      <div>
        <Label>Presupuesto de prueba (opcional)</Label>
        <Input
          inputMode="numeric"
          placeholder="$0"
          value={presupuesto ? formatCOP(num(presupuesto)) : ""}
          onChange={(e) => setPresupuesto(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy} style={{ background: "var(--c-testeos)" }}>
        <Plus size={16} /> Programar testeo
      </Button>
    </form>
  );
}

// ── Tarjeta de testeo ──────────────────────────────────────────────
function TesteoCard({
  t,
  call,
  busy,
}: {
  t: Testeo;
  call: (url: string, method: string, body?: object) => void;
  busy: boolean;
}) {
  const [editar, setEditar] = useState(false);
  const [notas, setNotas] = useState(t.notas ?? "");
  const [resultado, setResultado] = useState(t.resultado ?? "");
  const [fecha, setFecha] = useState(t.fecha_testeo ?? "");
  const est = ESTADO_TESTEO[t.estado];

  return (
    <Card style={{ borderColor: `${est.color}55` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-fg">{t.producto}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge>Prioridad #{t.prioridad}</Badge>
            {t.fecha_testeo && (
              <Badge>
                <CalendarClock size={11} /> {t.fecha_testeo}
              </Badge>
            )}
            {t.presupuesto ? <Badge>{formatCOP(t.presupuesto)}</Badge> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Select
            value={t.estado}
            disabled={busy}
            onChange={(e) => call(`/api/testeos/${t.id}`, "PATCH", { estado: e.target.value })}
            className="w-auto px-2 py-1 text-xs"
            aria-label="Estado"
          >
            {Object.entries(ESTADO_TESTEO).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
          <button
            onClick={() => setEditar(true)}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-testeos"
            title="Editar / notas / resultado"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => {
              if (confirm(`¿Eliminar el testeo de "${t.producto}"?`))
                call(`/api/testeos/${t.id}`, "DELETE");
            }}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-danger"
            title="Eliminar"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {t.hipotesis && (
        <p className="mt-2 text-xs text-muted">
          <span className="font-semibold text-fg">Hipótesis:</span> {t.hipotesis}
        </p>
      )}
      {t.notas && (
        <div className="mt-2">
          <p className="text-xs font-semibold uppercase text-muted">Preparación</p>
          <p className="whitespace-pre-wrap text-sm text-fg">{t.notas}</p>
        </div>
      )}
      {t.resultado && (
        <div className="mt-2 rounded-lg border border-border bg-surface-2 p-2.5">
          <p className="text-xs font-semibold uppercase text-muted">Resultado / feedback</p>
          <p className="whitespace-pre-wrap text-sm text-fg">{t.resultado}</p>
        </div>
      )}

      <Modal open={editar} onClose={() => setEditar(false)} title={`Testeo: ${t.producto}`}>
        <div className="space-y-4 text-left">
          <div>
            <Label>¿Cuándo testear?</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <Label>Preparación / checklist</Label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={4}
              placeholder="Ej: creativos listos, landing lista, presupuesto $300k/día…"
              className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none placeholder:text-muted focus:border-testeos"
            />
          </div>
          <div>
            <Label>Resultado / feedback (qué pasó)</Label>
            <textarea
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              rows={4}
              placeholder="Ej: CPA $42k, CTR 1.8%. Mentor sugiere cambiar el hook…"
              className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none placeholder:text-muted focus:border-testeos"
            />
          </div>
          <Button
            className="w-full"
            disabled={busy}
            style={{ background: "var(--c-testeos)" }}
            onClick={() => {
              call(`/api/testeos/${t.id}`, "PATCH", {
                fecha_testeo: fecha || null,
                notas,
                resultado,
              });
              setEditar(false);
            }}
          >
            Guardar
          </Button>
        </div>
      </Modal>
    </Card>
  );
}

// ── Formulario nueva nota ──────────────────────────────────────────
function NuevaNotaForm({
  onCreate,
  busy,
}: {
  onCreate: (b: object) => void;
  busy: boolean;
}) {
  const [categoria, setCategoria] = useState<CategoriaNota>("mentoria");
  const [fuente, setFuente] = useState("");
  const [contenido, setContenido] = useState("");

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!contenido.trim()) return;
    onCreate({
      categoria,
      fuente: fuente.trim() || null,
      contenido: contenido.trim(),
    });
    setContenido("");
    setFuente("");
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tipo</Label>
          <Select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaNota)}
          >
            <option value="mentoria">Mentoría</option>
            <option value="tarea">Tarea fundamental</option>
            <option value="idea">Idea</option>
            <option value="general">General</option>
          </Select>
        </div>
        <div>
          <Label>¿Quién? (opcional)</Label>
          <Input
            value={fuente}
            onChange={(e) => setFuente(e.target.value)}
            placeholder="Mentor, cliente…"
          />
        </div>
      </div>
      <div>
        <Label>Nota</Label>
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          rows={3}
          placeholder="Escribe lo que te dijeron o la tarea…"
          className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none placeholder:text-muted focus:border-testeos"
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy} variant="outline">
        <Plus size={16} /> Anexar nota (con fecha de hoy)
      </Button>
    </form>
  );
}

// ── Item de nota ───────────────────────────────────────────────────
function NotaItem({
  n,
  call,
  busy,
}: {
  n: Nota;
  call: (url: string, method: string, body?: object) => void;
  busy: boolean;
}) {
  const cat = CAT_NOTA[n.categoria];
  const esTarea = n.categoria === "tarea";
  return (
    <li
      className={cn(
        "rounded-xl border border-border bg-surface-2 p-3",
        esTarea && n.hecha && "opacity-50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {esTarea && (
            <button
              onClick={() =>
                call(`/api/notas/${n.id}`, "PATCH", { hecha: !n.hecha })
              }
              disabled={busy}
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                n.hecha ? "border-ok bg-ok text-black" : "border-border"
              )}
              aria-label="Marcar hecha"
            >
              {n.hecha && <Check size={12} />}
            </button>
          )}
          <div className="min-w-0">
            <p className={cn("whitespace-pre-wrap text-sm text-fg", esTarea && n.hecha && "line-through")}>
              {n.contenido}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: `${cat.color}22`, color: cat.color }}
              >
                {cat.label}
              </span>
              {n.fuente && <span className="text-xs text-muted">· {n.fuente}</span>}
              <span className="text-xs text-muted">· {n.fecha}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm("¿Eliminar esta nota?")) call(`/api/notas/${n.id}`, "DELETE");
          }}
          disabled={busy}
          className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-surface hover:text-danger"
          title="Eliminar"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}
