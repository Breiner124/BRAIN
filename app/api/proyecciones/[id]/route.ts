import { z } from "zod";
import { ok, handleError } from "@/lib/api";
import { actualizarProyeccion, eliminarProyeccion } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

const schema = z.object({
  estado: z.enum(["pendiente", "en_progreso", "lograda"]).optional(),
  fecha_objetivo: z.string().nullish(),
  fecha_tipo: z.enum(["fija", "variable"]).optional(),
  notas: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const patch = schema.parse(await req.json());
    return ok(await actualizarProyeccion(params.id, patch));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    return ok(await eliminarProyeccion(params.id));
  } catch (e) {
    return handleError(e);
  }
}
