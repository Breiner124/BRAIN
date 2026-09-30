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
import type { Deuda } from "@/lib/types";

const CATEGORIA_LABEL: Record<string, string> = {
  tarjeta_credito: "Tarjeta de crédito",
  tercero: "Tercero",
  credito_fijo: "Crédito fijo",
  otro: "Otro",
};

export function DebtCard({ deuda }: { deuda: Deuda }) {
  const router = useRouter();
  const [abrirAbono, setAbrirAbono] = useState(false);
  const [monto, setMonto] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pagado = deuda.monto_original - deuda.saldo_actual;
  const montoNum = Number(monto.replace(/\D/g, ""));
  const pagada = deuda.estado === "pagada";

  async function accion(url: string, body?: object) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Error");
      setAbrirAbono(false);
      setMonto("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={pagada ? "opacity-60" : ""}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-fg">{deuda.nombre}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge>{CATEGORIA_LABEL[deuda.categoria] ?? deuda.categoria}</Badge>
            <Badge>Importancia #{deuda.nivel_importancia}</Badge>
            {pagada && <Badge className="text-ganancias">Pagada ✓</Badge>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Saldo</p>
          <p className="text-lg font-bold text-fg">{formatCOP(deuda.saldo_actual)}</p>
        </div>
      </div>

      <ProgressBar
        logrado={pagado}
        objetivo={deuda.monto_original}
        color="var(--c-deudas)"
        label="Pagado"
      />

      {!pagada && (
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setAbrirAbono(true)}>
            Abonar
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => accion(`/api/deudas/${deuda.id}/pagar-total`)}
            disabled={busy}
          >
            Pagar en totalidad
          </Button>
        </div>
      )}

      <Modal
        open={abrirAbono}
        onClose={() => setAbrirAbono(false)}
        title={`Abonar a ${deuda.nombre}`}
      >
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
            onClick={() => accion(`/api/deudas/${deuda.id}/abonar`, { monto: montoNum })}
          >
            {busy ? "Procesando…" : `Abonar ${formatCOP(montoNum)}`}
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
