// ── Formato es-CO / COP ────────────────────────────────────────────

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** $1.500.000 */
export function formatCOP(monto: number): string {
  if (!Number.isFinite(monto)) return "$0";
  return copFormatter.format(Math.round(monto));
}

/** Versión compacta: $1,5M · $185M · $80M */
export function formatCOPCompact(monto: number): string {
  if (!Number.isFinite(monto)) return "$0";
  const abs = Math.abs(monto);
  const signo = monto < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${signo}$${(abs / 1_000_000_000).toFixed(1).replace(".", ",")}B`;
  if (abs >= 1_000_000) return `${signo}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace(".", ",")}M`;
  if (abs >= 1_000) return `${signo}$${Math.round(abs / 1_000)}k`;
  return formatCOP(monto);
}

/** 12,5% */
export function formatPct(fraccion: number, decimales = 1): string {
  if (!Number.isFinite(fraccion)) return "0%";
  return `${(fraccion * 100).toFixed(decimales).replace(".", ",")}%`;
}

export function clampPct(valor: number): number {
  return Math.max(0, Math.min(1, valor));
}
