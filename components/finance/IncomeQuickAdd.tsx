"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { formatCOP } from "@/lib/format";
import type { FuenteIngreso, UnidadNegocio } from "@/lib/types";

interface Props {
  unidades: UnidadNegocio[];
  /** origen del registro: define desde qué "puerta" entra (§11) */
  origen?: "ganancias" | "proy_consultoria" | "proy_ecom";
  fuenteFija?: FuenteIngreso;
  titulo?: string;
}

export function IncomeQuickAdd({
  unidades,
  origen = "ganancias",
  fuenteFija,
  titulo = "Registrar ingreso",
}: Props) {
  const router = useRouter();
  const [fuente, setFuente] = useState<FuenteIngreso>(fuenteFija ?? "ecom");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState<string>("");
  const [esFacturacion, setEsFacturacion] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unidadDeFuente = unidades.find((u) => u.slug === fuente);
  const montoNum = Number(monto.replace(/\D/g, ""));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!descripcion.trim()) return setError("Escribe una descripción");
    if (!montoNum || montoNum <= 0) return setError("Escribe un monto válido");

    setEnviando(true);
    try {
      const res = await fetch("/api/ingresos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fuente,
          unidad_id: unidadDeFuente?.id ?? null,
          descripcion: descripcion.trim(),
          monto: montoNum,
          es_facturacion: fuente === "ecom" ? esFacturacion : false,
          origen_registro: origen,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Error");
      setDescripcion("");
      setMonto("");
      setEsFacturacion(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      <p className="text-sm font-semibold text-fg">{titulo}</p>
      <div className="grid grid-cols-2 gap-3">
        {!fuenteFija && (
          <div className="col-span-2 sm:col-span-1">
            <Label>Fuente</Label>
            <Select
              value={fuente}
              onChange={(e) => setFuente(e.target.value as FuenteIngreso)}
            >
              <option value="ecom">E-com</option>
              <option value="consultoria">Consultoría</option>
              <option value="otros">Otros</option>
            </Select>
          </div>
        )}
        <div className={fuenteFija ? "col-span-2" : "col-span-2 sm:col-span-1"}>
          <Label>Monto (COP)</Label>
          <Input
            inputMode="numeric"
            placeholder="$0"
            value={monto ? formatCOP(montoNum) : ""}
            onChange={(e) => setMonto(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label>Descripción</Label>
        <Input
          placeholder="Ej: venta del día, cobro cliente…"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>
      {fuente === "ecom" && (
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={esFacturacion}
            onChange={(e) => setEsFacturacion(e.target.checked)}
            className="h-4 w-4 accent-[var(--c-ganancias)]"
          />
          Es facturación bruta (se le aplica el margen del 15%)
        </label>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" variant="success" disabled={enviando} className="w-full">
        {enviando ? "Registrando…" : "Anexar a Ganancias"}
      </Button>
    </form>
  );
}
