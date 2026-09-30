import { z } from "zod";
import { ok, handleError } from "@/lib/api";
import { crearProyeccion, getProyecciones } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

// §11: si es empresarial y trae ganancia → también inserta en `ingresos`.
const schema = z.object({
  ambito: z.enum(["personal", "empresarial"]),
  unidad_id: z.string().nullish(),
  nombre: z.string().min(1, "El nombre es obligatorio"),
  tipo: z.enum([
    "ingreso_esperado",
    "contratacion",
    "inversion",
    "expansion",
    "personal",
  ]),
  facturacion_esperada: z.number().nullish(),
  costo_estimado: z.number().nullish(),
  costo_recurrente: z.number().nullish(),
  fecha_objetivo: z.string().nullish(),
  fecha_tipo: z.enum(["fija", "variable"]).optional(),
  estado: z.enum(["pendiente", "en_progreso", "lograda"]).optional(),
  ganancia: z
    .object({
      monto: z.number().positive(),
      fuente: z.enum(["consultoria", "ecom", "otros"]),
      es_facturacion: z.boolean().optional(),
    })
    .optional(),
});

export async function GET() {
  try {
    return ok(getProyecciones());
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    return ok(crearProyeccion(body), 201);
  } catch (e) {
    return handleError(e);
  }
}
