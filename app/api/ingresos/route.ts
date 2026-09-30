import { z } from "zod";
import { ok, handleError } from "@/lib/api";
import { crearIngreso, getIngresos } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

const schema = z.object({
  unidad_id: z.string().nullish(),
  fuente: z.enum(["consultoria", "ecom", "otros"]),
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  monto: z.number().positive("El monto debe ser mayor que 0"),
  es_facturacion: z.boolean().optional(),
  fecha: z.string().optional(),
  recurrente: z.boolean().optional(),
  origen_registro: z
    .enum(["ganancias", "proy_consultoria", "proy_ecom"])
    .optional(),
  proyeccion_id: z.string().nullish(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");
    const fuente = searchParams.get("fuente");
    let ingresos = await getIngresos();
    if (fuente) ingresos = ingresos.filter((i) => i.fuente === fuente);
    if (desde) ingresos = ingresos.filter((i) => i.fecha >= desde);
    if (hasta) ingresos = ingresos.filter((i) => i.fecha <= hasta);
    return ok(ingresos);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const ingreso = await crearIngreso(body);
    return ok(ingreso, 201);
  } catch (e) {
    return handleError(e);
  }
}
