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
import type { Proyeccion } from "@/lib/types";

export function ProjectionPersonalCard({ p }: { p: Proyeccion }) {
  const router = useRouter();
  const [abrir, setAbrir] = useState(false);
  const [monto, setMonto] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const objetivo = p.objetivo ?? p.costo_estimado ?? 0;
  const avance = p.avance ?? 0;
  const montoNum = Number(monto.replace(/\D/g, ""));
  const completa = objetivo > 0 && avance >= objetivo;

  async function aportar() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/proyecciones/${p.id}/aportar`, {
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

  return (
    <Card>
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="font-bold text-fg">{p.nombre}</p>
        <div className="flex gap-1.5">
          {p.fecha_objetivo && <Badge>{p.fecha_objetivo}</Badge>}
          {completa && <Badge className="text-proyecciones">Lograda ✓</Badge>}
        </div>
      </div>
      {objetivo > 0 ? (
        <ProgressBar logrado={avance} objetivo={objetivo} color="var(--c-proyecciones)" />
      ) : (
        <p className="text-sm text-muted">
          Avance acumulado: {formatCOP(avance)} (sin objetivo definido)
        </p>
      )}
      {!completa && (
        <Button size="sm" variant="outline" className="mt-4" onClick={() => setAbrir(true)}>
          Aportar avance
        </Button>
      )}

      <Modal open={abrir} onClose={() => setAbrir(false)} title={`Aportar a ${p.nombre}`}>
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
