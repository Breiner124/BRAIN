import { z } from "zod";
import { ok, handleError } from "@/lib/api";
import { crearReunion, getReuniones } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

const schema = z.object({
  ambito: z.enum(["consultoria", "ecom"]),
  titulo: z.string().min(1, "El título es obligatorio"),
  con_quien: z.string().optional(),
  inicio: z.string().min(1, "La fecha/hora es obligatoria"),
  fin: z.string().nullish(),
  notas: z.string().optional(),
});

export async function GET() {
  try {
    return ok(await getReuniones());
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    return ok(await crearReunion(body), 201);
  } catch (e) {
    return handleError(e);
  }
}
