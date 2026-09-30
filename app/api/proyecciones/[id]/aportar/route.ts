import { z } from "zod";
import { ok, handleError } from "@/lib/api";
import { aportarProyeccion } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

const schema = z.object({ monto: z.number().positive("El aporte debe ser mayor que 0") });

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { monto } = schema.parse(await req.json());
    return ok(await aportarProyeccion(params.id, monto));
  } catch (e) {
    return handleError(e);
  }
}
