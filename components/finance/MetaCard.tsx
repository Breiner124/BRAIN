"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/finance/ProgressBar";
import { formatCOP } from "@/lib/format";
import type { Meta } from "@/lib/types";

const CATEGORIA_EMOJI: Record<string, string> = {
  vehiculo: "🚗",
  viaje: "✈️",
  festividad: "🎄",
  otro: "🎯",
};

interface Props {
  meta: Meta;
  aporteMensual?: number;
  mesesRestantes?: number;
}

export function MetaCard({ meta, aporteMensual, mesesRestantes }: Props) {
  const router = useRouter();
  const [abrir, setAbrir] = useState(false);
  const [monto, setMonto] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const montoNum = Number(monto.replace(/\D/g, ""));
  const completa = meta.ahorrado >= meta.costo_objetivo;

  async function aportar() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/metas/${meta.id}/aportar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto: montoNum }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Error");
      setAbrir(false);
      setMonto("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function accionMeta(metodo: "PATCH" | "DELETE", body?: object) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/metas/${meta.id}`, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Error");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{CATEGORIA_EMOJI[meta.categoria] ?? "🎯"}</span>
          <div>
            <p className="font-bold text-fg">{meta.nombre}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge>{meta.fecha_tipo === "fija" ? "Fecha fija" : "Fecha variable"}</Badge>
              {meta.fecha_objetivo && <Badge>{meta.fecha_objetivo}</Badge>}
              {completa && <Badge className="text-ganancias">Lograda ✓</Badge>}
            </div>
          </div>
        </div>
      </div>

      <ProgressBar
        logrado={meta.ahorrado}
        objetivo={meta.costo_objetivo}
        color="var(--c-metas)"
      />

      {!completa && aporteMensual !== undefined && (
        <p className="mt-2 text-xs text-muted">
          Aparta{" "}
          <span className="font-semibold text-metas">
            {formatCOP(aporteMensual)}/mes
          </span>{" "}
          para llegar a tiempo{mesesRestantes ? ` (${mesesRestantes} meses)` : ""}.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!completa && (
          <Button size="sm" variant="outline" onClick={() => setAbrir(true)}>
            Aportar
          </Button>
        )}
        {meta.ahorrado > 0 && (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              if (confirm(`¿Reiniciar el progreso de "${meta.nombre}" a 0%?`))
                accionMeta("PATCH", { ahorrado: 0 });
            }}
          >
            Reiniciar a 0%
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => {
            if (confirm(`¿Eliminar la meta "${meta.nombre}"?`)) accionMeta("DELETE");
          }}
        >
          Eliminar
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <Modal open={abrir} onClose={() => setAbrir(false)} title={`Aportar a ${meta.nombre}`}>
        <div className="space-y-3">
          <Input
            inputMode="numeric"
            placeholder="$0"
            value={monto ? formatCOP(montoNum) : ""}
            onChange={(e) => setMonto(e.target.value)}
            autoFocus
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button
            variant="success"
            className="w-full"
            disabled={busy || montoNum <= 0}
            onClick={aportar}
          >
            {busy ? "Procesando…" : `Aportar ${formatCOP(montoNum)}`}
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
