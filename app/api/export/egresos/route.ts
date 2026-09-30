import { getEgresos } from "@/lib/data/repository";
import { egresosCSV } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function GET() {
  const csv = egresosCSV(getEgresos());
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="egresos-cerebro.csv"`,
    },
  });
}
