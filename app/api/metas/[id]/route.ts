import { z } from "zod";
import { ok, handleError } from "@/lib/api";
import { actualizarMeta, eliminarMeta } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

const schema = z.object({
  ahorrado: z.number().nonnegative().optional(),
  costo_objetivo: z.number().positive().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const patch = schema.parse(await req.json());
    return ok(await actualizarMeta(params.id, patch));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    return ok(await eliminarMeta(params.id));
  } catch (e) {
    return handleError(e);
  }
}
