import { z } from "zod";
import { ok, handleError } from "@/lib/api";
import { actualizarNota, eliminarNota } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

const schema = z.object({
  contenido: z.string().min(1).optional(),
  categoria: z.enum(["mentoria", "tarea", "idea", "general"]).optional(),
  fecha: z.string().optional(),
  fuente: z.string().nullish(),
  hecha: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const patch = schema.parse(await req.json());
    return ok(await actualizarNota(params.id, patch));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    return ok(await eliminarNota(params.id));
  } catch (e) {
    return handleError(e);
  }
}
