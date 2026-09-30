import { ok, handleError } from "@/lib/api";
import { iniciarNuevaSemana } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    return ok(iniciarNuevaSemana(), 201);
  } catch (e) {
    return handleError(e);
  }
}
