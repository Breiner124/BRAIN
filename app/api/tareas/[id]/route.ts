import { z } from "zod";
import { ok, handleError } from "@/lib/api";
import { cambiarEstadoTarea } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

const schema = z.object({ estado: z.enum(["pendiente", "hecha", "aplazada"]) });

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { estado } = schema.parse(await req.json());
    return ok(await cambiarEstadoTarea(params.id, estado));
  } catch (e) {
    return handleError(e);
  }
}
