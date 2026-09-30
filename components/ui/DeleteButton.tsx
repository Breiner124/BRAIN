"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

interface Props {
  url: string;
  confirmar?: string;
  label?: string;
}

/** Botón genérico: hace DELETE al `url` y refresca. */
export function DeleteButton({ url, confirmar, label }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function eliminar() {
    if (confirmar && !confirm(confirmar)) return;
    setBusy(true);
    try {
      const res = await fetch(url, { method: "DELETE" });
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
    <button
      onClick={eliminar}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded-lg p-1.5 text-muted hover:bg-surface hover:text-danger disabled:opacity-50"
      aria-label="Eliminar"
      title="Eliminar"
    >
      <Trash2 size={15} />
      {label && <span className="text-xs">{label}</span>}
    </button>
  );
}
