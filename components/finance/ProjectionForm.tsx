"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { formatCOP } from "@/lib/format";
import type { TipoProyeccion } from "@/lib/types";

interface Props {
  variant: "personal" | "empresarial";
  unidadId?: string | null;
  titulo?: string;
}

const num = (s: string) => Number(s.replace(/\D/g, ""));

export function ProjectionForm({ variant, unidadId, titulo }: Props) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoProyeccion>(
    variant === "personal" ? "personal" : "ingreso_esperado"
  );
  const [monto, setMonto] = useState(""); // objetivo | facturacion | costo
  const [fecha, setFecha] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const montoNum = num(monto);
  const esRecurrente = tipo === "expansion" || tipo === "contratacion";

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nombre.trim()) return setError("Escribe un nombre");

    const payload: Record<string, unknown> = {
      ambito: variant,
      unidad_id: variant === "empresarial" ? unidadId ?? null : null,
      nombre: nombre.trim(),
      tipo,
      fecha_objetivo: fecha || null,
      fecha_tipo: fecha ? "fija" : "variable",
    };
    if (variant === "personal") {
      payload.objetivo = montoNum || null;
      payload.estado = "en_progreso";
    } else if (tipo === "ingreso_esperado") {
      payload.facturacion_esperada = montoNum || null;
      payload.estado = "en_progreso";
    } else if (esRecurrente) {
      payload.costo_recurrente = montoNum || null;
    } else {
      payload.costo_estimado = montoNum || null;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/proyecciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Error");
      setNombre("");
      setMonto("");
      setFecha("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  const labelMonto =
    variant === "personal"
      ? "Objetivo (COP)"
      : tipo === "ingreso_esperado"
      ? "Facturación esperada (COP/mes)"
      : esRecurrente
      ? "Costo recurrente (COP/mes)"
      : "Inversión estimada (COP)";

  return (
    <form onSubmit={enviar} className="space-y-3">
      <p className="text-sm font-semibold text-fg">
        {titulo ?? "Nueva proyección"}
      </p>
      <div>
        <Label>Nombre</Label>
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={
            variant === "personal"
              ? "Ej: Colchón de $20M, Patrimonio dic-2027…"
              : "Ej: Contratar diseñador, Nueva línea…"
          }
        />
      </div>
      {variant === "empresarial" && (
        <div>
          <Label>Tipo</Label>
          <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoProyeccion)}>
            <option value="ingreso_esperado">Ingreso esperado</option>
            <option value="expansion">Expansión (costo recurrente)</option>
            <option value="contratacion">Contratación (costo recurrente)</option>
            <option value="inversion">Inversión (una vez)</option>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{labelMonto}</Label>
          <Input
            inputMode="numeric"
            placeholder="$0"
            value={monto ? formatCOP(montoNum) : ""}
            onChange={(e) => setMonto(e.target.value)}
          />
        </div>
        <div>
          <Label>Fecha objetivo (opcional)</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full" variant="outline">
        {busy ? "Creando…" : "Crear proyección"}
      </Button>
    </form>
  );
}
