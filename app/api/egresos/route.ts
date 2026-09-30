import { z } from "zod";
import { ok, handleError } from "@/lib/api";
import { crearEgreso, getEgresos } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

const schema = z.object({
  unidad_id: z.string().nullish(),
  categoria: z.enum(["operativo", "nomina", "deuda", "personal", "inversion"]),
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  monto: z.number().positive("El monto debe ser mayor que 0"),
  fecha: z.string().optional(),
  fijo: z.boolean().optional(),
});

export async function GET() {
  try {
    return ok(getEgresos());
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    return ok(crearEgreso(body), 201);
  } catch (e) {
    return handleError(e);
  }
}
