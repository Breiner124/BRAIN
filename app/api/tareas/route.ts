import { z } from "zod";
import { ok, handleError } from "@/lib/api";
import { crearTarea, getTareas, getSemanaActiva } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

const schema = z.object({
  ambito: z.enum(["consultoria", "ecom", "personal"]),
  titulo: z.string().min(1, "El título es obligatorio"),
  descripcion: z.string().optional(),
  prioridad: z.number().int().min(1).max(5).optional(),
  vinculo_meta_id: z.string().nullish(),
  vinculo_proyeccion_id: z.string().nullish(),
});

export async function GET() {
  try {
    const activa = await getSemanaActiva();
    return ok(await getTareas(activa?.id));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    return ok(await crearTarea(body), 201);
  } catch (e) {
    return handleError(e);
  }
}
