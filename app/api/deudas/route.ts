import { z } from "zod";
import { ok, handleError } from "@/lib/api";
import { crearDeuda, getDeudas } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

const schema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  categoria: z.enum(["tarjeta_credito", "tercero", "credito_fijo", "otro"]),
  nivel_importancia: z.number().int().min(1).max(9),
  monto_original: z.number().positive("El monto debe ser mayor que 0"),
  saldo_actual: z.number().nonnegative().optional(),
  tasa_interes: z.number().nullish(),
  fecha_limite: z.string().nullish(),
});

export async function GET() {
  try {
    return ok(await getDeudas());
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    return ok(await crearDeuda(body), 201);
  } catch (e) {
    return handleError(e);
  }
}
