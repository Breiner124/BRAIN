import { getIngresos } from "@/lib/data/repository";
import { ingresosCSV } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function GET() {
  const csv = ingresosCSV(getIngresos());
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ingresos-cerebro.csv"`,
    },
  });
}
