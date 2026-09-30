import { ok, handleError } from "@/lib/api";
import { motor, getEscenarios } from "@/lib/data/repository";
import { facturacionParaRentabilizar } from "@/lib/engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const resultado = motor();
    return ok({
      ...resultado,
      escenarios: getEscenarios(),
      roi_logistica: facturacionParaRentabilizar(2_000_000, 0.15),
    });
  } catch (e) {
    return handleError(e);
  }
}
