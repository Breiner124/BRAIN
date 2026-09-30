import { z } from "zod";
import { ok, handleError } from "@/lib/api";
import { crearTesteo, getTesteos } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

const schema = z.object({
  producto: z.string().min(1, "El producto es obligatorio"),
  hipotesis: z.string().nullish(),
  fecha_testeo: z.string().nullish(),
  prioridad: z.number().int().min(1).max(5).optional(),
  presupuesto: z.number().nullish(),
  notas: z.string().nullish(),
});

export async function GET() {
  try {
    return ok(await getTesteos());
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    return ok(await crearTesteo(body), 201);
  } catch (e) {
    return handleError(e);
  }
}
