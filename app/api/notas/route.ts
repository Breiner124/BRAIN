import { z } from "zod";
import { ok, handleError } from "@/lib/api";
import { crearNota, getNotas } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

const schema = z.object({
  contenido: z.string().min(1, "La nota no puede estar vacía"),
  categoria: z.enum(["mentoria", "tarea", "idea", "general"]).optional(),
  fecha: z.string().optional(),
  fuente: z.string().nullish(),
});

export async function GET() {
  try {
    return ok(await getNotas());
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    return ok(await crearNota(body), 201);
  } catch (e) {
    return handleError(e);
  }
}
