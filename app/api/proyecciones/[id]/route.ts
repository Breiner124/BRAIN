import { z } from "zod";
import { ok, handleError } from "@/lib/api";
import { actualizarEstadoProyeccion, eliminarProyeccion } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

const schema = z.object({
  estado: z.enum(["pendiente", "en_progreso", "lograda"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { estado } = schema.parse(await req.json());
    return ok(await actualizarEstadoProyeccion(params.id, estado));
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
