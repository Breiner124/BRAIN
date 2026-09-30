import { z } from "zod";
import { ok, handleError } from "@/lib/api";
import { actualizarTesteo, eliminarTesteo } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

const schema = z.object({
  producto: z.string().min(1).optional(),
  hipotesis: z.string().nullish(),
  fecha_testeo: z.string().nullish(),
  estado: z.enum(["planificado", "en_curso", "hecho", "descartado"]).optional(),
  prioridad: z.number().int().min(1).max(5).optional(),
  presupuesto: z.number().nullish(),
  notas: z.string().nullish(),
  resultado: z.string().nullish(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const patch = schema.parse(await req.json());
    return ok(await actualizarTesteo(params.id, patch));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    return ok(await eliminarTesteo(params.id));
  } catch (e) {
    return handleError(e);
  }
}
