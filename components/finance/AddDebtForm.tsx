"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { formatCOP } from "@/lib/format";

const num = (s: string) => Number(s.replace(/\D/g, ""));

export function AddDebtForm() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("tarjeta_credito");
  const [importancia, setImportancia] = useState("1");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const montoNum = num(monto);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nombre.trim()) return setError("Escribe un nombre");
    if (montoNum <= 0) return setError("Escribe un monto válido");
    setBusy(true);
    try {
      const res = await fetch("/api/deudas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          categoria,
          nivel_importancia: Number(importancia),
          monto_original: montoNum,
          fecha_limite: fecha || null,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Error");
      setNombre("");
      setMonto("");
      setFecha("");
      setAbierto(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (!abierto) {
    return (
      <Button variant="outline" onClick={() => setAbierto(true)}>
        + Agregar deuda
      </Button>
    );
  }

  return (
    <Card>
      <form onSubmit={enviar} className="space-y-3">
        <p className="text-sm font-semibold text-fg">Nueva deuda</p>
        <div>
          <Label>Nombre</Label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Tarjeta Visa, Préstamo a Juan…"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Categoría</Label>
            <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="tarjeta_credito">Tarjeta de crédito</option>
              <option value="tercero">Tercero</option>
              <option value="credito_fijo">Crédito fijo</option>
              <option value="otro">Otro</option>
            </Select>
          </div>
          <div>
            <Label>Importancia (1 = más)</Label>
            <Select value={importancia} onChange={(e) => setImportancia(e.target.value)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Monto (COP)</Label>
            <Input
              inputMode="numeric"
              placeholder="$0"
              value={monto ? formatCOP(montoNum) : ""}
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>
          <div>
            <Label>Fecha límite (opcional)</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" variant="danger" disabled={busy}>
            {busy ? "Guardando…" : "Crear deuda"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setAbierto(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
