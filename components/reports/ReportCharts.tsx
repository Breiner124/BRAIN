"use client";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCOPCompact } from "@/lib/format";
import type { PuntoMensual } from "@/lib/reports";

// Paleta alineada con los tokens de globals.css
const COLORES = {
  consultoria: "#38bdf8",
  ecom: "#22c55e",
  otros: "#fbbf24",
  flujo: "#a78bfa",
  egreso: "#f87171",
};

const ejeFmt = (v: number) => formatCOPCompact(v);

function TooltipCard({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-fg">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{formatCOPCompact(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function ReportCharts({ serie }: { serie: PuntoMensual[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-surface p-5 neural-glow">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          Ingresos por fuente (mensual)
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={serie} margin={{ left: 4, right: 4 }}>
            <CartesianGrid stroke="#242a3d" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: "#8b93ad", fontSize: 12 }} />
            <YAxis tickFormatter={ejeFmt} tick={{ fill: "#8b93ad", fontSize: 11 }} width={48} />
            <Tooltip content={<TooltipCard />} cursor={{ fill: "#ffffff08" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="consultoria" stackId="a" fill={COLORES.consultoria} name="Consultoría" radius={[0, 0, 0, 0]} />
            <Bar dataKey="ecom" stackId="a" fill={COLORES.ecom} name="E-com" />
            <Bar dataKey="otros" stackId="a" fill={COLORES.otros} name="Otros" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 neural-glow">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          Flujo de caja (ingreso vs egreso)
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={serie} margin={{ left: 4, right: 4 }}>
            <defs>
              <linearGradient id="gFlujo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORES.flujo} stopOpacity={0.5} />
                <stop offset="100%" stopColor={COLORES.flujo} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#242a3d" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: "#8b93ad", fontSize: 12 }} />
            <YAxis tickFormatter={ejeFmt} tick={{ fill: "#8b93ad", fontSize: 11 }} width={48} />
            <Tooltip content={<TooltipCard />} cursor={{ stroke: "#ffffff20" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="ingreso" stroke={COLORES.ecom} fill="transparent" name="Ingreso" strokeWidth={2} />
            <Area type="monotone" dataKey="egreso" stroke={COLORES.egreso} fill="transparent" name="Egreso" strokeWidth={2} />
            <Area type="monotone" dataKey="flujo" stroke={COLORES.flujo} fill="url(#gFlujo)" name="Flujo neto" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
