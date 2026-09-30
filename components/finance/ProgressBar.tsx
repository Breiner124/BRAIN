"use client";
import { clampPct, formatCOP, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Props {
  logrado: number;
  objetivo: number;
  label?: string;
  color?: string; // CSS var o color
  mostrarMontos?: boolean;
  className?: string;
}

export function ProgressBar({
  logrado,
  objetivo,
  label,
  color = "var(--c-ganancias)",
  mostrarMontos = true,
  className,
}: Props) {
  const pct = objetivo > 0 ? clampPct(logrado / objetivo) : 0;
  return (
    <div className={cn("w-full", className)}>
      {(label || mostrarMontos) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
          {label && <span className="font-medium text-fg">{label}</span>}
          <span className="text-muted">
            {mostrarMontos && (
              <>
                {formatCOP(logrado)} / {formatCOP(objetivo)} ·{" "}
              </>
            )}
            <span className="font-semibold text-fg">{formatPct(pct, 0)}</span>
          </span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
