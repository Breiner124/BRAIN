"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import {
  Brain,
  CreditCard,
  DollarSign,
  FlaskConical,
  Target,
  TrendingUp,
  User,
  type LucideIcon,
} from "lucide-react";
import { NODE_COLORS } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  brain: Brain,
  user: User,
  "trending-up": TrendingUp,
  target: Target,
  dollar: DollarSign,
  "credit-card": CreditCard,
  flask: FlaskConical,
};

export interface NodeCardData {
  tipo: string;
  titulo: string;
  resumen?: string;
  icono?: string;
  metric?: string;
  central?: boolean;
  [key: string]: unknown;
}

export function NodeCard({ data }: NodeProps) {
  const d = data as NodeCardData;
  const color = NODE_COLORS[d.tipo] ?? "var(--c-central)";
  const Icon = ICONS[d.icono ?? "brain"] ?? Brain;
  const size = d.central ? 168 : 128;

  return (
    <motion.div
      className="animate-float cursor-pointer select-none"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.97 }}
      style={{ width: size, height: size }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <div
        className="flex h-full w-full flex-col items-center justify-center rounded-full border text-center transition"
        style={{
          borderColor: color,
          background: `radial-gradient(circle at 50% 35%, ${color}22, var(--surface) 70%)`,
          boxShadow: `0 0 24px -6px ${color}, inset 0 0 24px -12px ${color}`,
        }}
      >
        <Icon size={d.central ? 34 : 26} style={{ color }} />
        <p
          className="mt-1 px-2 font-bold leading-tight text-fg"
          style={{ fontSize: d.central ? 15 : 13 }}
        >
          {d.titulo}
        </p>
        {d.metric && (
          <p className="px-2 text-[11px] font-semibold" style={{ color }}>
            {d.metric}
          </p>
        )}
      </div>
    </motion.div>
  );
}
